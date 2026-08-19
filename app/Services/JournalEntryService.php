<?php

namespace App\Services;

use App\Models\AccJournalEntry;
use App\Models\Member;
use Illuminate\Support\Facades\Log;

class JournalEntryService
{
    /**
     * Create a double-entry journal batch.
     *
     * $params = [
     *   'source_type'      => 'savings' | 'capital' | 'memcap' | 'savings_td'  (maps to enum)
     *   'memberId'         => int
     *   'branch'           => 'upi' | 'aguinaldo' | 'fort_mag' | 'ilagan' | null
     *   'channel'          => 'cash' | 'gcash' | 'maya' | 'bank' | 'ewallet' | 'paymongo'
     *   'transaction_type' => 'deposit' | 'withdrawal'
     *   'amount'           => float
     *   'reference'        => string   (e.g. WD-20240101-001)
     *   'particulars'      => string
     *   'liability_account'=> ['code' => '21110', 'name' => 'Savings Deposit']  (optional override)
     * ]
     */
    public function create(array $params): void {
        try {
            $amount   = abs((float) $params['amount']);
            $type     = $params['transaction_type'];        // deposit | withdrawal
            $channel  = strtolower($params['channel'] ?? 'cash');
            $branch   = $params['branch'] ?? null;
            $memberId = $params['memberId'];

            // ── Resolve cash/bank asset account ──────────────────────────────
            $assetAccount = AccJournalEntry::resolveAssetAccount($channel, $branch);

            // ── Resolve liability account ─────────────────────────────────────
            if (!empty($params['liability_account'])) {
                $liabilityAccount = $params['liability_account'];
            } else {
                $liabilityAccount = $this->resolveLiabilityAccount(
                    $params['source_type'],
                    $memberId
                );
            }

            // ── Build Dr / Cr depending on direction ──────────────────────────
            // Deposit:    Dr: Asset (cash/bank) / Cr: Liability (savings/capital/td)
            // Withdrawal: Dr: Liability          / Cr: Asset
            if ($type === 'deposit') {
                $drAccount = $assetAccount;
                $crAccount = $liabilityAccount;
            } else {
                $drAccount = $liabilityAccount;
                $crAccount = $assetAccount;
            }

            $batchRef = $this->makeBatchRef($params['source_type'], $memberId);
            $date     = now()->toDateString();

            $shared = [
                'batch_reference'  => $params['batch_reference'] ?? $batchRef,
                'source_type'      => $this->mapSourceType($params['source_type']),
                'memberId'         => $memberId,
                'branch'           => $branch,
                'particulars'      => $params['particulars'] ?? '',
                'transaction_date' => $date,
                'status'           => 'pending_review',
            ];

            // Dr line
            AccJournalEntry::create(array_merge($shared, [
                'account_code' => $drAccount['code'],
                'account_name' => $drAccount['name'],
                'debit'        => $amount,
                'credit'       => 0,
            ]));

            // Cr line
            AccJournalEntry::create(array_merge($shared, [
                'account_code' => $crAccount['code'],
                'account_name' => $crAccount['name'],
                'debit'        => 0,
                'credit'       => $amount,
            ]));

        } catch (\Throwable $e) {
            // Journal entry failure is non-fatal — log and continue
            Log::error('Journal entry creation failed', [
                'params' => $params,
                'error'  => $e->getMessage(),
            ]);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function resolveLiabilityAccount(string $sourceType, int $memberId): array {
        if ($sourceType === 'savings') {
            return AccJournalEntry::savingsDepositAccount();
        }

        if ($sourceType === 'time_deposit') {
            return AccJournalEntry::timeDepositAccount();
        }

        if (in_array($sourceType, ['capital', 'memcap'])) {
            $member = Member::find($memberId);
            $status = $member?->accountStatus ?? '';
            return AccJournalEntry::shareCapitalAccount($status);
        }

        return ['code' => '21110', 'name' => 'Savings Deposit'];
    }

    private function mapSourceType(string $sourceType): string {
        return match ($sourceType) {
            'time_deposit' => 'savings',   // reuse savings enum slot
            'capital'      => 'capital',
            'memcap'       => 'memcap',
            default        => 'savings',
        };
    }

    private function makeBatchRef(string $sourceType, int $memberId): string {
        $prefix = match ($sourceType) {
            'capital'      => 'SC',
            'time_deposit' => 'TD',
            default        => 'SV',
        };
        return $prefix . '-' . now()->format('Ymd') . '-' . $memberId . '-' . uniqid();
    }
}