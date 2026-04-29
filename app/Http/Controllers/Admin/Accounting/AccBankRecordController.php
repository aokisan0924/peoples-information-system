<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccGeneralLedger;
use App\Models\AccChartOfAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AccBankRecordController extends Controller
{
    public function index(Request $request) {
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        
        // Create an array of months for the dropdown
        $months = collect(range(1, 12))->map(function ($m) {
            $date = Carbon::createFromDate(null, $m, 1);
            return [
                'value' => $date->format('m'),
                'label' => $date->format('F'),
            ];
        });
    
        $bankAccounts = AccChartOfAccount::where('accountName', 'LIKE', '%Bank%')
            ->orderBy('accountCode', 'asc')
            ->get();
    
        $accountCode = $request->input('accountCode', $bankAccounts->first()->accountCode ?? '11115');
        $currentBank = $bankAccounts->where('accountCode', $accountCode)->first();
    
        $start = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $end = Carbon::createFromDate($year, $month, 1)->endOfMonth();
    
        // Beginning Balance logic
        $history = AccGeneralLedger::where('accountCode', $accountCode);
        $beginningBalance = (clone $history)->where('transactionDate', '<', $start)->sum('debit') - 
                            (clone $history)->where('transactionDate', '<', $start)->sum('credit');
    
        $records = AccGeneralLedger::where('accountCode', $accountCode)
            ->whereBetween('transactionDate', [$start, $end])
            ->orderBy('transactionDate', 'asc')
            ->get();
    
        return Inertia::render('Admin/Accounting/BankRecords', [
            'records' => $records,
            'bankAccounts' => $bankAccounts,
            'months' => $months, // New dynamic month list
            'beginningBalance' => (float) $beginningBalance,
            'filters' => [
                'accountCode' => $accountCode,
                'bankName' => $currentBank->accountName ?? 'Select Bank',
                'month' => $month,
                'monthName' => $start->format('F'),
                'year' => $year
            ]
        ]);
    }

    public function bulkStore(Request $request) {
        $request->validate([
            'accountCode' => 'required|string',
            'entries' => 'required|array|min:1',
            'entries.*.transactionDate' => 'required|date',
            'entries.*.particulars' => 'required|string|max:255',
            'entries.*.debit' => 'nullable|numeric',
            'entries.*.credit' => 'nullable|numeric',
        ]);

        $account = AccChartOfAccount::where('accountCode', $request->accountCode)->first();

        foreach ($request->entries as $row) {
            $debit = floatval($row['debit'] ?? 0);
            $credit = floatval($row['credit'] ?? 0);

            if ($debit == 0 && $credit == 0) continue;

            AccGeneralLedger::create([
                'transactionDate' => Carbon::parse($row['transactionDate']),
                'accountCode' => $request->accountCode,
                'accountName' => $account->accountName ?? 'CASH IN BANK',
                'particulars' => $row['particulars'],
                'referenceNo' => strtoupper($row['referenceNo'] ?? ''),
                'debit' => $debit,
                'credit' => $credit,
            ]);
        }

        return redirect()->back()->with('success', 'Bank records synchronized successfully.');
    }

    public function update(Request $request, $id) {
        $validated = $request->validate([
            'transactionDate' => 'required|date',
            'referenceNo' => 'nullable|string|max:255',
            'particulars' => 'required|string|max:255',
            'debit' => 'nullable|numeric|min:0',
            'credit' => 'nullable|numeric|min:0',
        ]);

        $record = AccGeneralLedger::findOrFail($id);
        $record->update($validated);

        return redirect()->back()->with('success', 'Transaction updated successfully.');
    }
}