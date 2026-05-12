<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccGeneralLedger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AccFinancialReportController extends Controller
{
    public function index(Request $request) {
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        $branch = $request->user()->branch ?? 'Main Office';

        $asOfDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();
        $startOfYear = Carbon::createFromDate($year, 1, 1)->startOfDay();

        $allLedgers = AccGeneralLedger::where('branch', $branch)->where('transactionDate', '<=', $asOfDate)->get();

        $incomeStatement = ['revenues' => [], 'expenses' => [], 'total_revenue' => 0, 'total_expense' => 0];
        $balanceSheet = ['assets' => [], 'liabilities' => [], 'equity' => [], 'total_assets' => 0, 'total_liabilities' => 0, 'total_equity' => 0];

        foreach ($allLedgers as $entry) {
            $code = (string) $entry->accountCode;
            $prefix = substr($code, 0, 1);
            
            // Income Statement (YTD)
            if ($entry->transactionDate >= $startOfYear) {
                if ($prefix === '4' || $prefix === '5') {
                    if (!isset($incomeStatement['revenues'][$code])) $incomeStatement['revenues'][$code] = ['name' => $entry->accountName, 'balance' => 0];
                    $incomeStatement['revenues'][$code]['balance'] += ($entry->credit - $entry->debit);
                } elseif ($prefix === '6' || $prefix === '7' || $prefix === '8') {
                    if (!isset($incomeStatement['expenses'][$code])) $incomeStatement['expenses'][$code] = ['name' => $entry->accountName, 'balance' => 0];
                    $incomeStatement['expenses'][$code]['balance'] += ($entry->debit - $entry->credit);
                }
            }

            if ($prefix === '1') {
                if (!isset($balanceSheet['assets'][$code])) $balanceSheet['assets'][$code] = ['name' => $entry->accountName, 'balance' => 0];
                $balanceSheet['assets'][$code]['balance'] += ($entry->debit - $entry->credit);
            } elseif ($prefix === '2') {
                if (!isset($balanceSheet['liabilities'][$code])) $balanceSheet['liabilities'][$code] = ['name' => $entry->accountName, 'balance' => 0];
                $balanceSheet['liabilities'][$code]['balance'] += ($entry->credit - $entry->debit);
            } elseif ($prefix === '3') {
                if (!isset($balanceSheet['equity'][$code])) $balanceSheet['equity'][$code] = ['name' => $entry->accountName, 'balance' => 0];
                $balanceSheet['equity'][$code]['balance'] += ($entry->credit - $entry->debit);
            }
        }

        foreach ($incomeStatement['revenues'] as $i) $incomeStatement['total_revenue'] += $i['balance'];
        foreach ($incomeStatement['expenses'] as $i) $incomeStatement['total_expense'] += $i['balance'];
        $netSurplus = $incomeStatement['total_revenue'] - $incomeStatement['total_expense'];

        foreach ($balanceSheet['assets'] as $i) $balanceSheet['total_assets'] += $i['balance'];
        foreach ($balanceSheet['liabilities'] as $i) $balanceSheet['total_liabilities'] += $i['balance'];
        foreach ($balanceSheet['equity'] as $i) $balanceSheet['total_equity'] += $i['balance'];

        // Inject Net Surplus into Equity
        $balanceSheet['total_equity'] += $netSurplus;
        $balanceSheet['total_liabilities_equity'] = $balanceSheet['total_liabilities'] + $balanceSheet['total_equity'];

        return Inertia::render('Admin/Accounting/FinancialReports', [
            'incomeStatement' => $incomeStatement,
            'balanceSheet' => $balanceSheet,
            'netSurplus' => $netSurplus,
            'filters' => ['month' => $month, 'year' => $year, 'branch' => $branch]
        ]);
    }
}