<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccChartOfAccount;
use App\Models\AccGeneralLedger;
use App\Models\AccPettyCashFund;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccPettyCashController extends Controller
{
    public function index(Request $request) {
        $currentBranch = $request->user()->branch ?? 'Main Office';
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        
        $months = collect(range(1, 12))->map(fn($m) => [
            'value' => str_pad($m, 2, '0', STR_PAD_LEFT),
            'label' => Carbon::createFromDate(null, $m, 1)->format('F'),
        ]);

        $start = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $end = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $history = AccPettyCashFund::where('branch', $currentBranch)->where('transactionDate', '<', $start);
        $beginningBalance = (clone $history)->sum('credit') - (clone $history)->sum('debit');

        $records = AccPettyCashFund::where('branch', $currentBranch)
                ->whereBetween('transactionDate', [$start, $end])
                ->orderBy('transactionDate', 'asc')->get();

        $chartOfAccounts = AccChartOfAccount::orderBy('accountCode', 'asc')->get();

        return Inertia::render('Admin/Accounting/PettyCash', [
            'records' => $records,
            'months' => $months,
            'chartOfAccounts' => $chartOfAccounts,
            'beginningBalance' => (float) $beginningBalance,
            'filters' => [
                'month' => $month, 
                'year' => $year,
                'branch' => $currentBranch, 
                'monthName' => $start->format('F')]
        ]);
    }

    public function bulkStore(Request $request) {
        $userBranch = $request->user()->branch ?? 'Main Office';
        $request->validate(['entries' => 'required|array']);
    
        foreach ($request->entries as $entry) {
            // Force NULL values to 0
            $debit = floatval($entry['debit'] ?? 0);
            $credit = floatval($entry['credit'] ?? 0);

            if ($debit == 0 && $credit == 0) continue;

            AccPettyCashFund::create([
                'branch' => $userBranch,
                'transactionDate' => $entry['transactionDate'],
                'orNumber' => $entry['orNumber'] ?? null,
                'particulars' => $entry['particulars'],
                'debit' => $debit,
                'credit' => $credit,
            ]);
        }
        return redirect()->back()->with('success', 'Petty cash synchronized.');
    }

    public function update(Request $request, $id) {
        $validated = $request->validate([
            'transactionDate' => 'required|date',
            'orNumber' => 'nullable|string',
            'particulars' => 'required|string',
            'debit' => 'numeric',
            'credit' => 'numeric',
        ]);
        AccPettyCashFund::findOrFail($id)->update($validated);
        return redirect()->back();
    }

    public function journalize(Request $request) {
        $request->validate([
            'petty_cash_id' => 'required|exists:acc_petty_cash_funds,id',
            'debitAccount'  => 'required|exists:acc_chart_of_accounts,accountCode',
            'creditAccount' => 'required|exists:acc_chart_of_accounts,accountCode',
        ]);
    
        $petty = AccPettyCashFund::findOrFail($request->petty_cash_id);
        $debitAcc = AccChartOfAccount::where('accountCode', $request->debitAccount)->first();
        $creditAcc = AccChartOfAccount::where('accountCode', $request->creditAccount)->first();
        
        $amount = $petty->debit > 0 ? $petty->debit : $petty->credit;
    
        $commonData = [
            'petty_cash_id'   => $petty->id,
            'branch'          => $petty->branch,
            'transactionDate' => $petty->transactionDate,
            'particulars'     => $petty->particulars,
            'referenceNo'     => $petty->orNumber ?? '-',
        ];
    
        AccGeneralLedger::create(array_merge($commonData, [
            'accountCode' => $debitAcc->accountCode,
            'accountName' => $debitAcc->accountName,
            'debit'       => $amount,
            'credit'      => 0,
        ]));
    
        AccGeneralLedger::create(array_merge($commonData, [
            'accountCode' => $creditAcc->accountCode,
            'accountName' => $creditAcc->accountName,
            'debit'       => 0,
            'credit'      => $amount,
        ]));
    
        $petty->update(['is_posted' => true]);
    
        return redirect()->back()->with('success', 'Journal entry posted successfully.');
    }

    public function printVoucher(Request $request, $ids) {
        $idArray = explode(',', $ids);
        $vouchers = [];

        foreach ($idArray as $id) {
            $record = AccPettyCashFund::findOrFail($id);
            
            $ledgerEntries = AccGeneralLedger::where('petty_cash_id', $record->id)
                ->orderBy('debit', 'desc')
                ->get();
            
            $vouchers[] = [
                'record' => $record,
                'ledgerEntries' => $ledgerEntries 
            ];
        }

        return Inertia::render('Admin/Accounting/PrintVoucher', [
            'vouchers' => $vouchers,
            'perPage'  => $request->input('perPage', 3)
        ]);
    }
}
