<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccChartOfAccount;
use App\Models\AccGeneralLedger;
use App\Models\AccJournalEntry;
use App\Models\AccPettyCashFund;
use App\Services\AccountingJournalQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccPettyCashController extends Controller
{
    public function index(Request $request) {
        $currentBranch = $request->user()->branch ?? 'Main Office';
        $date = $request->input('date', date('Y-m-d')); // Default to today[cite: 25]

        // Compute Beginning Balance prior to the selected day
        $history = AccPettyCashFund::where('branch', $currentBranch)->whereDate('transactionDate', '<', $date);
        $beginningBalance = (clone $history)->sum('credit') - (clone $history)->sum('debit');

        // Fetch only records for the specific day
        $recordsQuery = AccPettyCashFund::where('branch', $currentBranch)->whereDate('transactionDate', $date);
        $records = (clone $recordsQuery)->orderBy('created_at', 'asc')->get();

        $recordIds = $records->pluck('id');
        $ledgers = AccGeneralLedger::whereIn('petty_cash_id', $recordIds)->get()->groupBy('petty_cash_id');
        $queued = AccJournalEntry::where('source_type', 'petty_cash')
            ->whereIn('source_record_id', $recordIds)
            ->latest('id')
            ->get()
            ->groupBy('source_record_id');
        foreach ($records as $record) {
            $record->ledger_entries = $ledgers->get($record->id, collect());
            $queueLine = $queued->get($record->id)?->first();
            $record->journal_status = $queueLine?->status;
            $record->journal_batch_reference = $queueLine?->batch_reference;
        }

        // Compute Ending Balance for the day
        $dayCredit = (clone $recordsQuery)->sum('credit');
        $dayDebit = (clone $recordsQuery)->sum('debit');
        $endingBalance = $beginningBalance + $dayCredit - $dayDebit;

        return Inertia::render('Admin/Accounting/PettyCash', [
            'records' => $records,
            'chartOfAccounts' => AccChartOfAccount::orderBy('accountCode', 'asc')->get(),
            'beginningBalance' => (float) $beginningBalance,
            'endingBalance' => (float) $endingBalance,
            'filters' => [
                'date' => $date, 
                'branch' => $currentBranch,
            ]
        ]);
    }

    public function storeLog (Request $request) {
        $request->validate([
            'transactions' => 'required|array|min:1',
            'transactions.*.transactionDate' => 'required|date',
            'transactions.*.orNumber'        => 'nullable|string',
            'transactions.*.particulars'     => 'required|string',
            'transactions.*.debit'           => 'numeric',
            'transactions.*.credit'          => 'numeric',
        ]);

        DB::transaction(function () use ($request) {
            $branch = $request->user()->branch ?? 'Main Office';
            
            foreach ($request->transactions as $trans) {
                AccPettyCashFund::create([
                    'branch'          => $branch,
                    'transactionDate' => $trans['transactionDate'],
                    'orNumber'        => $trans['orNumber'] ?? null,
                    'particulars'     => $trans['particulars'],
                    'debit'           => floatval($trans['debit'] ?? 0),
                    'credit'          => floatval($trans['credit'] ?? 0),
                    'is_posted'       => false, // Flag for Journalizing
                ]);
            }
        });

        return redirect()->back()->with('success', 'Transactions logged successfully.');
    }

    public function journalize(Request $request, $id, AccountingJournalQueue $queue) {
        $request->validate([
            'entries' => 'required|array|min:1',
            'entries.*.accountCode' => 'required|string',
            'entries.*.debit' => 'numeric',
            'entries.*.credit' => 'numeric',
        ]);

        $record = AccPettyCashFund::findOrFail($id);
        $queue->enqueue(
            'petty_cash',
            $this->batchReference($record),
            $record->id,
            $record->branch,
            (string) $record->transactionDate,
            $record->particulars,
            $request->entries,
        );

        return redirect()->back()->with('success', 'Journal entry submitted for review.');
    }

    public function updateJournal(Request $request, $id, AccountingJournalQueue $queue) {
        $request->validate([
            'entries' => 'required|array|min:1',
            'entries.*.accountCode' => 'required|string',
            'entries.*.debit' => 'numeric',
            'entries.*.credit' => 'numeric',
        ]);

        $record = AccPettyCashFund::findOrFail($id);
        $queue->enqueue(
            'petty_cash',
            $this->batchReference($record),
            $record->id,
            $record->branch,
            (string) $record->transactionDate,
            $record->particulars,
            $request->entries,
            true,
        );

        return redirect()->back()->with('success', 'Pending journal entry updated.');
    }

    public function update(Request $request, $id) {
        $validated = $request->validate([
            'transactionDate' => ['required', 'date'],
            'orNumber'        => ['nullable', 'string'],
            'particulars'     => ['required', 'string'],
            'debit'           => ['numeric'],
            'credit'          => ['numeric'],
        ]);

        return DB::transaction(function () use ($validated, $id) {
            $record = AccPettyCashFund::findOrFail($id);
            $record->update($validated);

            if ($record->is_posted) {
                AccGeneralLedger::where('petty_cash_id', $record->id)->update([
                    'transactionDate' => $validated['transactionDate'],
                    'particulars'     => $validated['particulars'],
                    'referenceNo'     => $validated['orNumber'] ?? '-',
                ]);
            }
            return redirect()->back()->with('success', 'Record updated.');
        });
    }

    public function printVoucher(Request $request, $ids) {
        $idArray = explode(',', $ids);
        $vouchers = [];

        foreach ($idArray as $id) {
            $record = AccPettyCashFund::findOrFail($id);
            $ledgerEntries = AccGeneralLedger::where('petty_cash_id', $record->id)->orderBy('debit', 'desc')->get();
            $vouchers[] = ['record' => $record, 'ledgerEntries' => $ledgerEntries];
        }

        return Inertia::render('Admin/Accounting/PrintVoucher', [
            'vouchers' => $vouchers,
            'perPage'  => $request->input('perPage', 3)
        ]);
    }

    private function batchReference(AccPettyCashFund $record): string
    {
        $reference = trim((string) $record->orNumber);
        return $reference !== '' && $reference !== '-' ? $reference : "PETTY-{$record->id}";
    }
}
