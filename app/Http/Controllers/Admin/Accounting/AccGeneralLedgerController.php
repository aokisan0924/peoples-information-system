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
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        
        $start = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $end = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $summaries = AccGeneralLedger::whereBetween('transactionDate', [$start, $end])
            ->selectRaw('accountCode, accountName, SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->groupBy('accountCode', 'accountName')
            ->orderBy('accountCode', 'asc')
            ->get();

        return Inertia::render('Admin/Accounting/GeneralLedger', [
            'summaries' => $summaries,
            'filters' => [
                'month' => $month,
                'monthName' => $start->format('F'),
                'year' => $year
            ]
        ]);
    }
}