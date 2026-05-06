<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccEWallet;
use App\Models\AccGeneralLedger;
use App\Models\AccChartOfAccount;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AccEWalletController extends Controller
{
    public function index(Request $request) {
        $currentBranch = $request->user()->branch ?? 'Main Office';
        $date = $request->input('date', date('Y-m-d')); // Daily view filter[cite: 27]

        $history = AccEWallet::where('branch', $currentBranch)->whereDate('transactionDate', '<', $date);
        $beginningBalance = (clone $history)->sum('credit') - (clone $history)->sum('debit');

        $recordsQuery = AccEWallet::where('branch', $currentBranch)->whereDate('transactionDate', $date);
        $records = (clone $recordsQuery)->orderBy('created_at', 'asc')->get();

        $endingBalance = $beginningBalance + (clone $recordsQuery)->sum('credit') - (clone $recordsQuery)->sum('debit');

        return Inertia::render('Admin/Accounting/EWallet', [
            'records' => $records,
            'beginningBalance' => (float)$beginningBalance,
            'endingBalance' => (float)$endingBalance,
            'chartOfAccounts' => AccChartOfAccount::orderBy('accountCode')->get(),
            'filters' => [
                'branch' => $currentBranch,
                'date' => $date,
            ]
        ]);
    }

    public function storeLog(Request $request) {
        $request->validate([
            'transactions' => 'required|array|min:1',
            'transactions.*.transactionDate' => 'required|date',
            'transactions.*.referenceNo'     => 'nullable|string',
            'transactions.*.particulars'     => 'required|string',
            'transactions.*.walletType'      => 'required|string',
            'transactions.*.debit'           => 'numeric',
            'transactions.*.credit'          => 'numeric',
        ]);

        DB::transaction(function () use ($request) {
            $branch = $request->user()->branch ?? 'Main Office';
            
            foreach ($request->transactions as $trans) {
                AccEWallet::create([
                    'branch'          => $branch,
                    'transactionDate' => $trans['transactionDate'],
                    'referenceNo'     => $trans['referenceNo'] ?? '-',
                    'particulars'     => $trans['particulars'],
                    'walletType'      => $trans['walletType'],
                    'debit'           => floatval($trans['debit'] ?? 0),
                    'credit'          => floatval($trans['credit'] ?? 0),
                    'is_posted'       => false,
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
            $record = AccEWallet::findOrFail($id);
            $userBranch = $request->user()->branch ?? 'Main Office';

            foreach ($request->entries as $entry) {
                $account = AccChartOfAccount::where('accountCode', $entry['accountCode'])->first();

                AccGeneralLedger::create([
                    'e_wallet_id'     => $record->id,
                    'transactionDate' => $record->transactionDate,
                    'accountCode'     => $entry['accountCode'],
                    'accountName'     => $account->accountName ?? 'Manual Entry',
                    'particulars'     => $record->particulars,
                    'referenceNo'     => $record->referenceNo ?? '-',
                    'debit'           => floatval($entry['debit'] ?? 0),
                    'credit'          => floatval($entry['credit'] ?? 0),
                    'branch'          => $userBranch,
                ]);
            }
            $record->update(['is_posted' => true]);
            return redirect()->back()->with('success', 'Journal Entry created.');
        });
    }

    public function update(Request $request, $id) {
        $validated = $request->validate([
            'transactionDate' => 'required|date',
            'referenceNo'     => 'nullable|string',
            'particulars'     => 'required|string',
            'walletType'      => 'required|string',
            'debit'           => 'numeric',
            'credit'          => 'numeric',
        ]);

        return DB::transaction(function () use ($validated, $id) {
            $record = AccEWallet::findOrFail($id);
            $oldRef = $record->referenceNo;
            
            $glUpdateData = $validated;
            unset($glUpdateData['walletType']);

            $record->update($validated);

            if ($record->is_posted) {
                AccGeneralLedger::where('e_wallet_id', $record->id)->update([
                    'transactionDate' => $validated['transactionDate'],
                    'particulars'     => $validated['particulars'],
                    'referenceNo'     => $validated['referenceNo'] ?? '-',
                ]);
            }
            return redirect()->back()->with('success', 'Record updated.');
        });
    }
}
