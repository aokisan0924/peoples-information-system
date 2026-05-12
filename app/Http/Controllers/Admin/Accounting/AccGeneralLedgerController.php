<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccGeneralLedger;
use App\Models\AccChartOfAccount;
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
            $prefix = substr($entry->accountCode, 0, 1);
            if (in_array($prefix, ['4', '5'])) {
                if (!isset($revenues[$entry->accountCode])) $revenues[$entry->accountCode] = ['name' => $entry->accountName, 'balance' => 0];
                $revenues[$entry->accountCode]['balance'] += ($entry->credit - $entry->debit);
            } elseif (in_array($prefix, ['6', '7', '8'])) {
                if (!isset($expenses[$entry->accountCode])) $expenses[$entry->accountCode] = ['name' => $entry->accountName, 'balance' => 0];
                $expenses[$entry->accountCode]['balance'] += ($entry->debit - $entry->credit);
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
        $assets = []; $liabilities = []; $equity = [];
        $ytdRevenue = 0; $ytdExpense = 0;

        foreach ($ledgers as $entry) {
            $prefix = substr($entry->accountCode, 0, 1);

            if ($prefix === '1') {
                if (!isset($assets[$entry->accountCode])) $assets[$entry->accountCode] = ['name' => $entry->accountName, 'balance' => 0];
                $assets[$entry->accountCode]['balance'] += ($entry->debit - $entry->credit);
            } elseif ($prefix === '2') {
                if (!isset($liabilities[$entry->accountCode])) $liabilities[$entry->accountCode] = ['name' => $entry->accountName, 'balance' => 0];
                $liabilities[$entry->accountCode]['balance'] += ($entry->credit - $entry->debit);
            } elseif ($prefix === '3') {
                if (!isset($equity[$entry->accountCode])) $equity[$entry->accountCode] = ['name' => $entry->accountName, 'balance' => 0];
                $equity[$entry->accountCode]['balance'] += ($entry->credit - $entry->debit);
            }

            if ($entry->transactionDate >= $startOfYear) {
                if (in_array($prefix, ['4', '5'])) $ytdRevenue += ($entry->credit - $entry->debit);
                if (in_array($prefix, ['6', '7', '8'])) $ytdExpense += ($entry->debit - $entry->credit);
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