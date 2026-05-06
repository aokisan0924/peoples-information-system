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

        if ($selectedBranch !== 'Consolidated') {
            $query->where('branch', $selectedBranch);
        }

        $summaries = $query->selectRaw('accountCode, accountName, SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->groupBy('accountCode', 'accountName')
            ->orderBy('accountCode', 'asc')
            ->get();

        return Inertia::render('Admin/Accounting/GeneralLedger', [
            'summaries' => $summaries,
            'filters' => [
                'branch' => $selectedBranch,
                'month' => $month,
                'monthName' => $start->format('F'),
                'year' => $year
            ]
        ]);
    }

    public function statementOfOperation(Request $request) {
        $branch = $request->input('branch', 'Consolidated');
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        $start = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $end = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $query = AccGeneralLedger::whereBetween('transactionDate', [$start, $end]);
        if ($branch !== 'Consolidated') {
            $query->where('branch', $branch);
        }

        $operations = $query->where(function($q) {
                $q->where('accountCode', 'like', '4%')
                    ->orWhere('accountCode', 'like', '5%');
            })
            ->selectRaw('accountCode, accountName, SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->groupBy('accountCode', 'accountName')
            ->orderBy('accountCode', 'asc')
            ->get();

        return Inertia::render('Admin/Accounting/Reports/StatementOfOperation', [
            'data' => $operations,
            'branch' => $branch,
            'period' => $start->format('F Y')
        ]);
    }

    public function financialStatement(Request $request) {
        $branch = $request->input('branch', 'Consolidated');
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        $start = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $end = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $query = AccGeneralLedger::whereBetween('transactionDate', [$start, $end]);
        if ($branch !== 'Consolidated') {
            $query->where('branch', $branch);
        }

        $financials = $query->where(function($q) {
                $q->where('accountCode', 'like', '1%')
                    ->orWhere('accountCode', 'like', '2%')
                    ->orWhere('accountCode', 'like', '3%');
            })
            ->selectRaw('accountCode, accountName, SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->groupBy('accountCode', 'accountName')
            ->orderBy('accountCode', 'asc')
            ->get();

        return Inertia::render('Admin/Accounting/Reports/FinancialStatement', [
            'data' => $financials,
            'branch' => $branch,
            'period' => $start->format('F Y')
        ]);
    }
}