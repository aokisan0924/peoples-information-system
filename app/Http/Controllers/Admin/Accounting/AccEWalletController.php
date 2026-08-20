<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccEWallet;
use App\Models\AccGeneralLedger;
use App\Models\AccChartOfAccount;
use App\Models\AccJournalEntry;
use App\Services\AccountingJournalQueue;
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
        $queued = AccJournalEntry::where('source_type', 'ewallet')
            ->whereIn('source_record_id', $records->pluck('id'))->latest('id')->get()->groupBy('source_record_id');
        foreach ($records as $record) {
            $line = $queued->get($record->id)?->first();
            $record->journal_status = $line?->status;
            $record->journal_batch_reference = $line?->batch_reference;
        }

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

    public function journalize(Request $request, $id, AccountingJournalQueue $queue) {
        $request->validate([
            'entries' => 'required|array|min:1',
            'entries.*.accountCode' => 'required|string',
            'entries.*.debit' => 'numeric',
            'entries.*.credit' => 'numeric',
        ]);

        $record = AccEWallet::findOrFail($id);
        $reference = trim((string) $record->referenceNo);
        $queue->enqueue('ewallet', $reference !== '' && $reference !== '-' ? $reference : "EWALLET-{$record->id}",
            $record->id, $record->branch, (string) $record->transactionDate, $record->particulars, $request->entries);

        return redirect()->back()->with('success', 'Journal entry submitted for review.');
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
