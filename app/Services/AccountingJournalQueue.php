<?php

namespace App\Services;

use App\Models\AccChartOfAccount;
use App\Models\AccJournalEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AccountingJournalQueue
{
    public function enqueue(
        string $sourceType,
        string $batchReference,
        ?int $sourceRecordId,
        string $branch,
        string $transactionDate,
        string $particulars,
        array $entries,
        bool $replacePending = false,
    ): void {
        $totalDebit = round((float) collect($entries)->sum(fn ($entry) => (float) ($entry['debit'] ?? 0)), 2);
        $totalCredit = round((float) collect($entries)->sum(fn ($entry) => (float) ($entry['credit'] ?? 0)), 2);

        if ($totalDebit <= 0 || abs($totalDebit - $totalCredit) >= 0.005) {
            throw ValidationException::withMessages([
                'entries' => 'Journal entries must contain equal, non-zero debit and credit totals.',
            ]);
        }

        foreach ($entries as $index => $entry) {
            $debit = round((float) ($entry['debit'] ?? 0), 2);
            $credit = round((float) ($entry['credit'] ?? 0), 2);
            if (($debit > 0 && $credit > 0) || ($debit <= 0 && $credit <= 0)) {
                throw ValidationException::withMessages([
                    "entries.{$index}" => 'Each journal line must contain either a debit or a credit amount, but not both.',
                ]);
            }
        }

        DB::transaction(function () use (
            $sourceType,
            $batchReference,
            $sourceRecordId,
            $branch,
            $transactionDate,
            $particulars,
            $entries,
            $replacePending,
        ): void {
            $existing = AccJournalEntry::query()
                ->where('source_type', $sourceType)
                ->where('batch_reference', $batchReference)
                ->when(
                    $sourceRecordId === null,
                    fn ($query) => $query->whereNull('source_record_id'),
                    fn ($query) => $query->where('source_record_id', $sourceRecordId),
                )
                ->lockForUpdate()
                ->get();

            if ($existing->contains('status', 'approved')) {
                throw ValidationException::withMessages([
                    'entries' => 'This journal batch has already been approved and cannot be replaced.',
                ]);
            }

            if ($existing->contains('status', 'pending_review') && !$replacePending) {
                throw ValidationException::withMessages([
                    'entries' => 'This journal batch is already pending review.',
                ]);
            }

            if ($existing->isNotEmpty()) {
                AccJournalEntry::whereKey($existing->pluck('id'))->delete();
            }

            foreach ($entries as $entry) {
                $account = AccChartOfAccount::where('accountCode', $entry['accountCode'])->first();
                AccJournalEntry::create([
                    'batch_reference' => $batchReference,
                    'source_type' => $sourceType,
                    'source_record_id' => $sourceRecordId,
                    'branch' => $branch,
                    'account_code' => $entry['accountCode'],
                    'account_name' => $account?->accountName ?? ($entry['accountName'] ?? 'Manual Entry'),
                    'debit' => round((float) ($entry['debit'] ?? 0), 2),
                    'credit' => round((float) ($entry['credit'] ?? 0), 2),
                    'particulars' => $particulars,
                    'transaction_date' => $transactionDate,
                    'status' => 'pending_review',
                ]);
            }
        });
    }
}
