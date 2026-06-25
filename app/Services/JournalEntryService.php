<?php

namespace App\Services;

use App\Models\AccChartOfAccount;
use App\Models\AccGeneralLedger;
use App\Models\AccJournalEntry;
use App\Models\Member;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * JournalEntryService
 *
 * Responsible for:
 *  1. Resolving account codes from AccChartOfAccount based on transaction type + member status.
 *  2. Writing draft lines to acc_journal_entries (status = pending_review).
 *  3. Posting approved lines from acc_journal_entries → acc_general_ledgers.
 *
 * Account code conventions (update to match your Chart of Accounts):
 *   11205  — Cash in Bank - PayMongo
 *   11210  — Cash in Bank - GCash/Maya  (savings withdrawal disbursement)
 *   20110  — Membership Fee Income
 *   30010  — Subscribed Share Capital - Common   (Regular members)
 *   30020  — Subscribed Share Capital - Preferred (Associate / unverified)
 *   11001  — Savings Deposits Liability
 */
class JournalEntryService
{
    // ── Account code map — every code is looked up from AccChartOfAccount at runtime.
    // These are FALLBACK codes used only if the chart lookup fails.
    private const ACCOUNT_CODES = [
        'paymongo_cash'         => '11205',
        'membership_income'     => '20110',
        'share_capital_regular' => '30010',
        'share_capital_other'   => '30020',
        'savings_liability'     => '11001',
    ];

    // ────────────────────────────────────────────────────────────────────────
    //  PUBLIC: GENERATE DRAFT ENTRIES (called from PayMongo webhook)
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Membership fee payment (₱300 base).
     */
    public function draftMembershipEntry(int $memberId, float $amount, string $reference): void {
        $this->writeDraft(
            sourceType: 'membership',
            memberId:   $memberId,
            reference:  $reference,
            lines:      $this->membershipLines($memberId, $amount),
        );
    }

    /**
     * Share capital deposit.
     * Account side depends on member->accountStatus (Regular → Common, else → Preferred).
     */
    public function draftCapitalEntry(int $memberId, float $amount, string $reference): void {
        $this->writeDraft(
            sourceType: 'capital',
            memberId:   $memberId,
            reference:  $reference,
            lines:      $this->capitalLines($memberId, $amount),
        );
    }

    /**
     * Savings deposit.
     */
    public function draftSavingsEntry(int $memberId, float $amount, string $reference): void {
        $this->writeDraft(
            sourceType: 'savings',
            memberId:   $memberId,
            reference:  $reference,
            lines:      $this->savingsLines($memberId, $amount),
        );
    }

    /**
     * Combined onboarding (membership + share capital, same reference).
     * Written as two separate source_type batches under the same batch_reference
     * so the clerk can approve them individually if needed.
     */
    public function draftMemCapEntry(int $memberId, float $membershipAmount, float $capitalAmount, string $reference): void {
        $allLines = array_merge(
            $this->membershipLines($memberId, $membershipAmount),
            $this->capitalLines($memberId, $capitalAmount),
        );

        // Write as one batch — source_type = memcap
        $this->writeDraft('memcap', $memberId, $reference, $allLines);
    }

    // ────────────────────────────────────────────────────────────────────────
    //  PUBLIC: APPROVE — post draft lines to GeneralLedger
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Post all lines in a batch to AccGeneralLedger.
     * Called by the accounting clerk controller after final approval.
     *
     * @throws \Throwable
     */
    public function approveBatch(string $batchReference, int $adminId, ?string $notes = null): void {
        DB::transaction(function () use ($batchReference, $adminId, $notes) {
            $lines = AccJournalEntry::where('batch_reference', $batchReference)
                ->where('status', 'pending_review')
                ->lockForUpdate()
                ->get();

            if ($lines->isEmpty()) {
                throw new \RuntimeException("No pending lines found for batch: {$batchReference}");
            }

            foreach ($lines as $line) {
                // Post to General Ledger
                AccGeneralLedger::create([
                    'branch'          => $line->branch,
                    'referenceNo'     => $line->batch_reference,
                    'memberId'        => $line->member_id,
                    'accountCode'     => $line->account_code,
                    'accountName'     => $line->account_name,
                    'debit'           => $line->debit,
                    'credit'          => $line->credit,
                    'particulars'     => $line->particulars,
                    'transactionDate' => $line->transaction_date,
                ]);

                // Mark staging line as approved
                $line->update([
                    'status'         => 'approved',
                    'reviewed_by'    => $adminId,
                    'reviewed_at'    => now(),
                    'reviewer_notes' => $notes,
                ]);
            }

            Log::info("JournalEntryService: batch approved and posted to GL", [
                'batch_reference' => $batchReference,
                'lines_posted'    => $lines->count(),
                'admin_id'        => $adminId,
            ]);
        });
    }

    /**
     * Reject a batch without posting.
     */
    public function rejectBatch(string $batchReference, int $adminId, string $notes): void {
        AccJournalEntry::where('batch_reference', $batchReference)
            ->where('status', 'pending_review')
            ->update([
                'status'         => 'rejected',
                'reviewed_by'    => $adminId,
                'reviewed_at'    => now(),
                'reviewer_notes' => $notes,
            ]);
    }

    /**
     * Update a single line's account code/name/amounts before approval.
     * This is the "clerk edits" path.
     */
    public function updateLine(int $lineId, array $data): AccJournalEntry {
        $line = AccJournalEntry::findOrFail($lineId);

        if (!$line->isPendingReview()) {
            throw new \RuntimeException("Cannot edit a line that is already {$line->status}.");
        }

        $allowed = ['account_code', 'account_name', 'debit', 'credit', 'particulars'];
        $line->fill(array_intersect_key($data, array_flip($allowed)));

        // Re-resolve account name from chart if only code changed
        if (isset($data['account_code']) && !isset($data['account_name'])) {
            $acct = AccChartOfAccount::where('accountCode', $data['account_code'])->first();
            if ($acct) $line->account_name = $acct->accountName;
        }

        $line->save();
        return $line;
    }

    // ────────────────────────────────────────────────────────────────────────
    //  PRIVATE: LINE BUILDERS
    // ────────────────────────────────────────────────────────────────────────

    private function membershipLines(int $memberId, float $amount): array {
        $member     = $this->loadMember($memberId);
        $memberName = $this->memberName($member);

        $debitAcct  = $this->resolveAccount(self::ACCOUNT_CODES['paymongo_cash']);
        $creditAcct = $this->resolveAccount(self::ACCOUNT_CODES['membership_income']);

        return [
            [
                'account_code' => $debitAcct['code'],
                'account_name' => $debitAcct['name'],
                'debit'        => $amount,
                'credit'       => 0.00,
                'particulars'  => "PayMongo - Membership Fee: {$memberName}",
            ],
            [
                'account_code' => $creditAcct['code'],
                'account_name' => $creditAcct['name'],
                'debit'        => 0.00,
                'credit'       => $amount,
                'particulars'  => "Membership Fee Income: {$memberName}",
            ],
        ];
    }

    private function capitalLines(int $memberId, float $amount): array {
        $member     = $this->loadMember($memberId);
        $memberName = $this->memberName($member);

        // ── SHARE CAPITAL ACCOUNT: determined by accountStatus ────────────
        $status = strtolower(trim($member->accountStatus ?? ''));

        $capitalCode = match ($status) {
            'regular'   => self::ACCOUNT_CODES['share_capital_regular'],  // Common
            'associate' => self::ACCOUNT_CODES['share_capital_other'],    // Preferred
            default     => self::ACCOUNT_CODES['share_capital_other'],    // Preferred (unverified / other)
        };

        $debitAcct   = $this->resolveAccount(self::ACCOUNT_CODES['paymongo_cash']);
        $creditAcct  = $this->resolveAccount($capitalCode);

        return [
            [
                'account_code' => $debitAcct['code'],
                'account_name' => $debitAcct['name'],
                'debit'        => $amount,
                'credit'       => 0.00,
                'particulars'  => "PayMongo - Share Capital: {$memberName}",
            ],
            [
                'account_code' => $creditAcct['code'],
                'account_name' => $creditAcct['name'],
                'debit'        => 0.00,
                'credit'       => $amount,
                'particulars'  => "{$creditAcct['name']}: {$memberName}",
            ],
        ];
    }

    private function savingsLines(int $memberId, float $amount): array {
        $member     = $this->loadMember($memberId);
        $memberName = $this->memberName($member);

        $debitAcct  = $this->resolveAccount(self::ACCOUNT_CODES['paymongo_cash']);
        $creditAcct = $this->resolveAccount(self::ACCOUNT_CODES['savings_liability']);

        return [
            [
                'account_code' => $debitAcct['code'],
                'account_name' => $debitAcct['name'],
                'debit'        => $amount,
                'credit'       => 0.00,
                'particulars'  => "PayMongo - Savings Deposit: {$memberName}",
            ],
            [
                'account_code' => $creditAcct['code'],
                'account_name' => $creditAcct['name'],
                'debit'        => 0.00,
                'credit'       => $amount,
                'particulars'  => "Savings Deposit Liability: {$memberName}",
            ],
        ];
    }

    // ────────────────────────────────────────────────────────────────────────
    //  PRIVATE: STAGING WRITER
    // ────────────────────────────────────────────────────────────────────────

    private function writeDraft(string $sourceType, int $memberId, string $reference, array $lines): void {
        try {
            $member = $this->loadMember($memberId);
            $branch = $member->branchService->branchService ?? 'Main Office';

            DB::transaction(function () use ($sourceType, $memberId, $reference, $lines, $branch) {
                // Guard: don't double-create if webhook fires twice
                if (AccJournalEntry::where('batch_reference', $reference)->exists()) {
                    Log::warning("JournalEntryService: duplicate batch suppressed for {$reference}");
                    return;
                }

                foreach ($lines as $line) {
                    AccJournalEntry::create([
                        'batch_reference'  => $reference,
                        'source_type'      => $sourceType,
                        'member_id'        => $memberId,
                        'branch'           => $branch,
                        'account_code'     => $line['account_code'],
                        'account_name'     => $line['account_name'],
                        'debit'            => $line['debit'],
                        'credit'           => $line['credit'],
                        'particulars'      => $line['particulars'],
                        'transaction_date' => Carbon::today(),
                        'status'           => 'pending_review',
                    ]);
                }

                Log::info("JournalEntryService: {$sourceType} draft written", [
                    'reference' => $reference,
                    'lines'     => count($lines),
                ]);
            });
        } catch (\Throwable $e) {
            // Never let journal entry failure break the payment confirmation
            Log::error("JournalEntryService::writeDraft failed for {$reference}: " . $e->getMessage());
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    //  PRIVATE: HELPERS
    // ────────────────────────────────────────────────────────────────────────

    private function resolveAccount(string $code): array {
        $acct = AccChartOfAccount::where('accountCode', $code)->first();
        return [
            'code' => $code,
            'name' => $acct?->accountName ?? "Account {$code}",
        ];
    }

    private function loadMember(int $memberId): Member {
        return Member::with('branchService')->findOrFail($memberId);
    }

    private function memberName(Member $member): string {
        return trim("{$member->lastName}, {$member->firstName}");
    }
}