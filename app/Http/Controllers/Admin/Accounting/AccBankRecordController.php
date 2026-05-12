<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccGeneralLedger;
use App\Models\AccChartOfAccount;
use App\Models\AccBankRecord;
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
            ->where('accountCode', '!=', $accountCode)    
            ->get()
            ->groupBy('bank_record_id');

        foreach ($records as $record) {
            $record->is_posted = $record->is_journalized;
            $record->ledger_entries = $ledgers->get($record->id, collect());
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

    public function journalize(Request $request, $id) {
         $request->validate(['entries' => 'required|array|min:1']);
        return DB::transaction(function () use ($request, $id) {
            $bankLog = AccBankRecord::findOrFail($id);
            $userBranch = $request->user()->branch ?? 'Main Office';

            // Base Entry Generation (Flipped logic for General Ledger)
            AccGeneralLedger::create([
                'bank_record_id'  => $bankLog->id,
                'transactionDate' => $bankLog->transaction_date,
                'accountCode'     => $bankLog->bank_account_code,
                'accountName'     => 'Cash in Bank', 
                'particulars'     => $bankLog->particulars,
                'referenceNo'     => $bankLog->reference_no,
                'debit'           => $bankLog->credit, // IN = Asset Increase
                'credit'          => $bankLog->debit, // OUT = Asset Decrease
                'branch'          => $userBranch,
            ]);

            foreach ($request->entries as $entry) {
                $account = AccChartOfAccount::where('accountCode', $entry['accountCode'])->first();
                AccGeneralLedger::create([
                    'bank_record_id'  => $bankLog->id,
                    'transactionDate' => $bankLog->transaction_date,
                    'accountCode'     => $entry['accountCode'],
                    'accountName'     => $account->accountName ?? 'Manual Entry',
                    'particulars'     => $bankLog->particulars,
                    'referenceNo'     => $bankLog->reference_no,
                    'debit'           => floatval($entry['debit'] ?? 0),
                    'credit'          => floatval($entry['credit'] ?? 0),
                    'branch'          => $userBranch,
                ]);
            }

            $bankLog->update(['is_journalized' => true]);
            return redirect()->back()->with('success', 'Posted to General Ledger successfully.');
        });
    }

    public function updateJournal(Request $request, $id) {
        $request->validate(['entries' => 'required|array|min:1']);
        return DB::transaction(function () use ($request, $id) {
            $bankLog = AccBankRecord::findOrFail($id);
            $userBranch = $request->user()->branch ?? 'Main Office';

            AccGeneralLedger::where('bank_record_id', $bankLog->id)->delete();

            AccGeneralLedger::create([
                'bank_record_id'  => $bankLog->id,
                'transactionDate' => $bankLog->transaction_date,
                'accountCode'     => $bankLog->bank_account_code,
                'accountName'     => 'Cash in Bank',
                'particulars'     => $bankLog->particulars,
                'referenceNo'     => $bankLog->reference_no,
                'debit'           => $bankLog->credit,
                'credit'          => $bankLog->debit,
                'branch'          => $userBranch,
            ]);

            foreach ($request->entries as $entry) {
                $account = AccChartOfAccount::where('accountCode', $entry['accountCode'])->first();
                AccGeneralLedger::create([
                    'bank_record_id'  => $bankLog->id,
                    'transactionDate' => $bankLog->transaction_date,
                    'accountCode'     => $entry['accountCode'],
                    'accountName'     => $account->accountName ?? 'Manual Entry',
                    'particulars'     => $bankLog->particulars,
                    'referenceNo'     => $bankLog->reference_no,
                    'debit'           => floatval($entry['debit'] ?? 0),
                    'credit'          => floatval($entry['credit'] ?? 0),
                    'branch'          => $userBranch,
                ]);
            }
            return redirect()->back()->with('success', 'Journal Entry updated.');
        });
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