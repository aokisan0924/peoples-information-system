<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccGeneralLedger;
use App\Models\AccChartOfAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AccGeneralJournalController extends Controller
{
    public function index(Request $request) {
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        $currentBranch = $request->user()->branch ?? 'Main Office';

        $start = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $end = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $adjustments = AccGeneralLedger::where('branch', $currentBranch)
            ->where('is_adjustment', true)
            ->whereBetween('transactionDate', [$start, $end])
            ->orderBy('transactionDate', 'desc')
            ->get()
            ->groupBy('referenceNo');

        $formattedLogs = [];
        foreach ($adjustments as $ref => $entries) {
            $first = $entries->first();
            $formattedLogs[] = [
                'referenceNo' => $ref,
                'transactionDate' => $first->transactionDate,
                'particulars' => $first->particulars,
                'totalDebit' => $entries->sum('debit'),
                'totalCredit' => $entries->sum('credit'),
                'entries' => $entries
            ];
        }

        return Inertia::render('Admin/Accounting/GeneralJournal', [
            'logs' => $formattedLogs,
            'chartOfAccounts' => AccChartOfAccount::orderBy('accountCode', 'asc')->get(),
            'filters' => ['month' => $month, 'year' => $year, 'branch' => $currentBranch]
        ]);
    }

    public function store(Request $request) {
        $request->validate([
            'transactionDate' => 'required|date',
            'particulars' => 'required|string',
            'referenceNo' => 'required|string',
            'entries' => 'required|array|min:2',
            'entries.*.accountCode' => 'required|string',
            'entries.*.debit' => 'numeric|min:0',
            'entries.*.credit' => 'numeric|min:0',
        ]);

        $totalDebit = collect($request->entries)->sum('debit');
        $totalCredit = collect($request->entries)->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return redirect()->back()->withErrors(['entries' => 'Debits and Credits must balance.']);
        }

        DB::transaction(function () use ($request) {
            $branch = $request->user()->branch ?? 'Main Office';

            foreach ($request->entries as $entry) {
                if (empty($entry['debit']) && empty($entry['credit'])) continue;

                $account = AccChartOfAccount::where('accountCode', $entry['accountCode'])->first();

                AccGeneralLedger::create([
                    'branch'          => $branch,
                    'transactionDate' => $request->transactionDate,
                    'referenceNo'     => strtoupper($request->referenceNo),
                    'particulars'     => $request->particulars,
                    'accountCode'     => $entry['accountCode'],
                    'accountName'     => $account->accountName ?? 'Manual Entry',
                    'debit'           => floatval($entry['debit'] ?? 0),
                    'credit'          => floatval($entry['credit'] ?? 0),
                    'is_adjustment'   => true
                ]);
            }
        });

        return redirect()->back()->with('success', 'Adjusting entry posted.');
    }
}