<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccGeneralLedger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AccTrialBalanceController extends Controller
{
    public function index(Request $request) {
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        $branch = $request->user()->branch ?? 'Main Office';

        $start = Carbon::createFromDate($year, 1, 1)->startOfDay(); 
        $end = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $ledgers = AccGeneralLedger::where('branch', $branch)
            ->whereBetween('transactionDate', [$start, $end])
            ->get();

        $accounts = [];

        foreach ($ledgers as $entry) {
            $code = $entry->accountCode;
            if (!isset($accounts[$code])) {
                $accounts[$code] = ['accountCode' => $code, 'accountName' => $entry->accountName, 'pre_debit' => 0, 'pre_credit' => 0, 'adj_debit' => 0, 'adj_credit' => 0];
            }

            if ($entry->is_adjustment) {
                $accounts[$code]['adj_debit'] += $entry->debit;
                $accounts[$code]['adj_credit'] += $entry->credit;
            } else {
                $accounts[$code]['pre_debit'] += $entry->debit;
                $accounts[$code]['pre_credit'] += $entry->credit;
            }
        }

        foreach ($accounts as $code => &$acc) {
            $totalDebit = $acc['pre_debit'] + $acc['adj_debit'];
            $totalCredit = $acc['pre_credit'] + $acc['adj_credit'];
            $acc['adj_final_debit'] = 0; $acc['adj_final_credit'] = 0;

            if ($totalDebit > $totalCredit) $acc['adj_final_debit'] = $totalDebit - $totalCredit;
            elseif ($totalCredit > $totalDebit) $acc['adj_final_credit'] = $totalCredit - $totalDebit;
        }

        ksort($accounts);

        return Inertia::render('Admin/Accounting/TrialBalance', [
            'trialBalance' => array_values($accounts),
            'filters' => ['month' => $month, 'year' => $year, 'branch' => $branch]
        ]);
    }
}