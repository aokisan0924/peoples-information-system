<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccGeneralLedger;
use App\Models\AccChartOfAccount;
use App\Models\AccBankRecord;
use App\Models\AccJournalEntry;
use App\Services\AccountingJournalQueue;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AccBankRecordController extends Controller
{
    public function index(Request $request) {
        $date = $request->input('date', date('Y-m-d'));
        $bankAccounts = AccChartOfAccount::where('accountName', 'LIKE', '%Bank%')
            ->orderBy('accountCode', 'asc')
            ->get();

        $userBranch = strtolower($request->user()->branch ?? 'Main Office');
        
        if (str_contains($userBranch, 'cubao')) {
            $selectedBank = $bankAccounts->filter(fn($b) => str_contains(strtolower($b->accountName), 'aguinaldo'))->first();
        } elseif (str_contains($userBranch, 'magsaysay') || str_contains($userBranch, 'fort')) {
            $selectedBank = $bankAccounts->filter(fn($b) => str_contains(strtolower($b->accountName), 'fort mag'))->first();
        } else {
            $selectedBank = $bankAccounts->filter(fn($b) => str_contains(strtolower($b->accountName), 'ilagan'))->first();
        }

        $selectedBank = $selectedBank ?? $bankAccounts->first();
        $accountCode = $selectedBank->accountCode;
    
        $history = AccBankRecord::where('bank_account_code', $accountCode)
            ->whereDate('transaction_date', '<', $date);
        $beginningBalance = (clone $history)->sum('credit') - (clone $history)->sum('debit');

        $recordsQuery = AccBankRecord::where('bank_account_code', $accountCode)
            ->whereDate('transaction_date', $date);

        $records = (clone $recordsQuery)
            ->orderBy('created_at', 'asc')
            ->get();

        $recordIds = $records->pluck('id');
        
        $ledgers = AccGeneralLedger::whereIn('bank_record_id', $recordIds)
            ->get()
            ->groupBy('bank_record_id');
        $queued = AccJournalEntry::where('source_type', 'bank')
            ->whereIn('source_record_id', $recordIds)->latest('id')->get()->groupBy('source_record_id');

        foreach ($records as $record) {
            $record->is_posted = $record->is_journalized;
            $record->ledger_entries = $ledgers->get($record->id, collect());
            $line = $queued->get($record->id)?->first();
            $record->journal_status = $line?->status;
            $record->journal_batch_reference = $line?->batch_reference;
        }

        $dayCredit = (clone $recordsQuery)->sum('credit');
        $dayDebit = (clone $recordsQuery)->sum('debit');
        $endingBalance = $beginningBalance + $dayCredit - $dayDebit;
    
        return Inertia::render('Admin/Accounting/BankRecords', [
            'records' => $records,
            'currentBank' => $selectedBank,
            'chartOfAccounts' => AccChartOfAccount::orderBy('accountCode', 'asc')->get(),
            'beginningBalance' => (float) $beginningBalance,
            'endingBalance' => (float) $endingBalance,
            'filters' => [
                'accountCode' => $accountCode,
                'date' => $date
            ]
        ]);
    }

    public function storeBulk(Request $request) {
        $request->validate([
            'accountCode' => 'required|string',
            'entries' => 'required|array|min:1',
            'entries.*.transactionDate' => 'required|date',
            'entries.*.referenceNo' => 'nullable|string',
            'entries.*.particulars' => 'required|string',
        ]);

        foreach ($request->entries as $row) {
            $debit = floatval($row['debit'] ?? 0);
            $credit = floatval($row['credit'] ?? 0);
            if ($debit == 0 && $credit == 0) continue;

            AccBankRecord::create([
                'branch'            => $request->user()->branch ?? 'Main Office',
                'bank_account_code' => $request->accountCode,
                'transaction_date'  => $row['transactionDate'],
                'particulars'       => $row['particulars'],
                'reference_no'      => strtoupper($row['referenceNo'] ?? 'BNK-' . time() . '-' . rand(100, 999)),
                'debit'             => $debit,
                'credit'            => $credit,
                'is_journalized'    => false
            ]);
        }
        return redirect()->back()->with('success', 'Bank logs saved to source table.');
    }

    public function journalize(Request $request, $id, AccountingJournalQueue $queue) {
        $request->validate(['entries' => 'required|array|min:2']); // Must have at least 2 lines for double-entry
        
        $bankLog = AccBankRecord::findOrFail($id);
        $queue->enqueue('bank', $bankLog->reference_no, $bankLog->id, $bankLog->branch,
            (string) $bankLog->transaction_date, $bankLog->particulars, $request->entries);
        return response()->json(['message' => 'Journal entry submitted for review.']);
    }

    public function updateJournal(Request $request, $id, AccountingJournalQueue $queue) {
        $request->validate(['entries' => 'required|array|min:2']);
        
        $bankLog = AccBankRecord::findOrFail($id);
        $queue->enqueue('bank', $bankLog->reference_no, $bankLog->id, $bankLog->branch,
            (string) $bankLog->transaction_date, $bankLog->particulars, $request->entries, true);
        return response()->json(['message' => 'Pending journal entry updated.']);
    }

    public function update(Request $request, $id) {
        $validated = $request->validate([
            'transaction_date' => 'required|date',
            'reference_no' => 'nullable|string',
            'particulars' => 'required|string',
            'debit' => 'nullable|numeric|min:0',
            'credit' => 'nullable|numeric|min:0',
        ]);

        $record = AccBankRecord::findOrFail($id);

        if ($record->is_journalized)
            return redirect()->back()->with('error', 'Cannot edit a journalized record.');

        $record->update($validated);
        return redirect()->back()->with('success', 'Log updated.');
    }
}
