<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccChartOfAccount;
use App\Models\AccGeneralLedger;
use App\Models\AccPettyCashFund;
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
        foreach ($records as $record) {
            $record->ledger_entries = $ledgers->get($record->id, collect());
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

    public function journalize(Request $request, $id) {
        $request->validate([
            'entries' => 'required|array|min:1',
            'entries.*.accountCode' => 'required|string',
            'entries.*.debit' => 'numeric',
            'entries.*.credit' => 'numeric',
        ]);

        return DB::transaction(function () use ($request, $id) {
            $record = AccPettyCashFund::findOrFail($id);
            $userBranch = $request->user()->branch ?? 'Main Office';

            foreach ($request->entries as $entry) {
                $account = AccChartOfAccount::where('accountCode', $entry['accountCode'])->first();

                AccGeneralLedger::create([
                    'petty_cash_id'   => $record->id,
                    'transactionDate' => $record->transactionDate,
                    'accountCode'     => $entry['accountCode'],
                    'accountName'     => $account->accountName ?? 'Manual Entry',
                    'particulars'     => $record->particulars,
                    'referenceNo'     => $record->orNumber ?? '-',
                    'debit'           => floatval($entry['debit'] ?? 0),
                    'credit'          => floatval($entry['credit'] ?? 0),
                    'branch'          => $userBranch,
                ]);
            }
            $record->update(['is_posted' => true]);
            return redirect()->back()->with('success', 'Journal Entry created.');
        });
    }

    public function updateJournal(Request $request, $id) {
        $request->validate([
            'entries' => 'required|array|min:1',
            'entries.*.accountCode' => 'required|string',
            'entries.*.debit' => 'numeric',
            'entries.*.credit' => 'numeric',
        ]);

        return DB::transaction(function () use ($request, $id) {
            $record = AccPettyCashFund::findOrFail($id);
            $userBranch = $request->user()->branch ?? 'Main Office';

            // 1. Delete the old incorrect entries from the general ledger
            AccGeneralLedger::where('petty_cash_id', $record->id)->delete();

            // 2. Re-create them with the new edited mapping
            foreach ($request->entries as $entry) {
                $account = AccChartOfAccount::where('accountCode', $entry['accountCode'])->first();

                AccGeneralLedger::create([
                    'petty_cash_id'   => $record->id,
                    'transactionDate' => $record->transactionDate,
                    'accountCode'     => $entry['accountCode'],
                    'accountName'     => $account->accountName ?? 'Manual Entry',
                    'particulars'     => $record->particulars,
                    'referenceNo'     => $record->orNumber ?? '-',
                    'debit'           => floatval($entry['debit'] ?? 0),
                    'credit'          => floatval($entry['credit'] ?? 0),
                    'branch'          => $userBranch,
                ]);
            }
            return redirect()->back()->with('success', 'Journal Entry updated successfully.');
        });
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
}
