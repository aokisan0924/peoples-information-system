<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccGeneralLedger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AccGeneralLedgerController extends Controller
{
    public function index(Request $request) {
        $userBranch = $request->user()->branch ?? 'Main Office';
        $selectedBranch = $request->input('branch', $userBranch);
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        
        $start = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $end = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $query = AccGeneralLedger::whereBetween('transactionDate', [$start, $end]);
        if ($selectedBranch !== 'Consolidated') $query->where('branch', $selectedBranch);

        $summaries = $query->selectRaw('accountCode, accountName, SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->groupBy('accountCode', 'accountName')
            ->orderBy('accountCode', 'asc')
            ->get();

        return Inertia::render('Admin/Accounting/GeneralLedger', [
            'summaries' => $summaries,
            'filters' => ['branch' => $selectedBranch, 'month' => $month, 'monthName' => $start->format('F'), 'year' => $year]
        ]);
    }

    public function statementOfOperation(Request $request) {
        $branch = $request->input('branch', 'Consolidated');
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        $periodType = $request->input('period_type', 'ytd');

        $targetDate = Carbon::createFromDate($year, $month, 1);

        if ($periodType === 'monthly') {
            $start = $targetDate->copy()->startOfMonth();
            $end = $targetDate->copy()->endOfMonth();
            $periodLabel = 'For the month ending ' . $start->format('F Y');
        } elseif ($periodType === 'quarterly') {
            $start = $targetDate->copy()->firstOfQuarter()->startOfDay();
            $end = $targetDate->copy()->lastOfQuarter()->endOfMonth();
            $periodLabel = 'For the month ending ' . $end->format('F d, Y');
        } elseif ($periodType === 'yearly') {
            $start = Carbon::createFromDate($year, 1, 1)->startOfDay();
            $end = Carbon::createFromDate($year, 12, 31)->endOfDay();
            $periodLabel = 'For the month ending ' . $year;
        } else {
            $start = Carbon::createFromDate($year, 1, 1)->startOfDay();
            $end = $targetDate->copy()->endOfMonth();
            $periodLabel = 'For the month ending ' . $end->format('F d, Y');
        }

        $query = AccGeneralLedger::whereBetween('transactionDate', [$start, $end]);
        if ($branch !== 'Consolidated') $query->where('branch', $branch);

        $ledgers = $query->get();
        $revenues = []; $expenses = [];

        foreach ($ledgers as $entry) {
            $code = $entry->accountCode;
            $name = $entry->accountName;

            // Explicit verification against PMPC Chart of Accounts specifications
            $isRevenue = in_array($code, ['40110', '40120', '40140', '40610', '40650', '40730']) 
                || ($code === '73350' && stripos($name, 'Other Income') !== false);

            if ($isRevenue) {
                if (!isset($revenues[$code])) $revenues[$code] = ['name' => $name, 'balance' => 0];
                $revenues[$code]['balance'] += ($entry->credit - $entry->debit);
            } else {
                // Catches administrative exception codes (21320, 40620, 40720) and standard 6xxx-8xxx prefixes
                if (in_array($code, ['21320', '40620', '40720']) || preg_match('/^[678]/', $code)) {
                    if (!isset($expenses[$code])) $expenses[$code] = ['name' => $name, 'balance' => 0];
                    $expenses[$code]['balance'] += ($entry->debit - $entry->credit);
                }
            }
        }

        $totalRev = array_sum(array_column($revenues, 'balance'));
        $totalExp = array_sum(array_column($expenses, 'balance'));

        return Inertia::render('Admin/Accounting/Reports/StatementOfOperation', [
            'revenues' => $revenues,
            'expenses' => $expenses,
            'totalRevenue' => $totalRev,
            'totalExpense' => $totalExp,
            'netSurplus' => $totalRev - $totalExp,
            'branch' => $branch,
            'periodLabel' => $periodLabel
        ]);
    }

    public function financialStatement(Request $request) {
        $branch = $request->input('branch', 'Consolidated');
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        $periodType = $request->input('period_type', 'ytd');

        $targetDate = Carbon::createFromDate($year, $month, 1);

        if ($periodType === 'quarterly') {
            $asOfDate = $targetDate->copy()->lastOfQuarter()->endOfMonth();
        } elseif ($periodType === 'yearly') {
            $asOfDate = Carbon::createFromDate($year, 12, 31)->endOfDay();
        } else {
            $asOfDate = $targetDate->copy()->endOfMonth();
        }

        $startOfYear = Carbon::createFromDate($asOfDate->year, 1, 1)->startOfDay();

        $query = AccGeneralLedger::where('transactionDate', '<=', $asOfDate);
        if ($branch !== 'Consolidated') $query->where('branch', $branch);

        $ledgers = $query->get();
        
        // Maintained flat array structures to preserve frontend data loop compatibility
        $assets = []; 
        $liabilities = []; 
        $equity = [];
        $ytdRevenue = 0; $ytdExpense = 0;

        foreach ($ledgers as $entry) {
            $code = $entry->accountCode;
            $name = $entry->accountName;
            $prefix = substr($code, 0, 2);

            // 1. ASSET CLASSIFICATION (1xxx series, excluding 11241 liability exception)
            if (str_starts_with($code, '1') && $code !== '11241') {
                if (!isset($assets[$code])) {
                    $assets[$code] = [
                        'name' => $name,
                        'balance' => 0,
                        'is_current' => ($prefix === '11')
                    ];
                }
                $assets[$code]['balance'] += ($entry->debit - $entry->credit);
            } 
            
            // 2. LIABILITY CLASSIFICATION (2xxx series + 11241 Unearned Interest exception)
            elseif (str_starts_with($code, '2') || $code === '11241') {
                if (!isset($liabilities[$code])) {
                    $liabilities[$code] = [
                        'name' => $name,
                        'balance' => 0,
                        'is_current' => ($prefix === '21' || $code === '11241')
                    ];
                }
                $liabilities[$code]['balance'] += ($entry->credit - $entry->debit);
            } 
            
            // 3. EQUITY CLASSIFICATION (3xxx series)
            elseif (str_starts_with($code, '3')) {
                if (!isset($equity[$code])) {
                    $equity[$code] = [
                        'name' => $name,
                        'balance' => 0
                    ];
                }
                $equity[$code]['balance'] += ($entry->credit - $entry->debit);
            }

            // 4. NET SURPLUS ROLLING CALCULATION WINDOW
            if ($entry->transactionDate >= $startOfYear) {
                $isRev = in_array($code, ['40110', '40120', '40140', '40610', '40650', '40730']) 
                    || ($code === '73350' && stripos($name, 'Other Income') !== false);
                
                $isExp = in_array($code, ['21320', '40620', '40720']) 
                    || (preg_match('/^[678]/', $code) && !($code === '73350' && stripos($name, 'Other Income') !== false));

                if ($isRev) $ytdRevenue += ($entry->credit - $entry->debit);
                if ($isExp) $ytdExpense += ($entry->debit - $entry->credit);
            }
        }

        return Inertia::render('Admin/Accounting/Reports/FinancialStatement', [
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'netSurplus' => $ytdRevenue - $ytdExpense,
            'branch' => $branch,
            'period' => $asOfDate->format('F d, Y')
        ]);
    }
}