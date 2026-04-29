<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccEWallet;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccEWalletController extends Controller
{
    public function index(Request $request) {
        $currentBranch = $request->user()->branch ?? 'Main Office';
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));

        $months = collect(range(1, 12))->map(fn($m) => [
            'value' => str_pad($m, 2, '0', STR_PAD_LEFT),
            'label' => Carbon::createFromDate(null, $m, 1)->format('F')
        ]);

        $start = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $end = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $history = AccEWallet::where('branch', $currentBranch)->where('transactionDate', '<', $start);
        $beginningBalance = $history->sum('credit') - $history->sum('debit');

        $records = AccEWallet::where('branch', $currentBranch)
            ->whereMonth('transactionDate', $month)
            ->whereYear('transactionDate', $year)
            ->orderBy('transactionDate', 'asc')->get();

        return Inertia::render('Admin/Accounting/EWallet', [
            'records' => $records,
            'months' => $months,
            'beginningBalance' => (float)$beginningBalance,
            'filters' => [
                'branch' => $currentBranch,
                'month' => $month,
                'year' => $year,
            ]
        ]);
    }

    public function bulkStore(Request $request) {
        $userBranch = $request->user()->branch ?? 'Main Office';
        $request->validate(['entries' => 'required|array']);

        foreach ($request->entries as $entry) {
            $debit = floatval($entry['debit'] ?? 0);
            $credit = floatval($entry['credit'] ?? 0);

            if ($debit == 0 && $credit == 0) continue;

            AccEWallet::create(array_merge($entry, [
                'branch' => $userBranch,
                'debit'  => $debit,
                'credit' => $credit
            ]));
        }
        return redirect()->back()->with('success', 'Records synchronized.');
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

        $record = AccEWallet::findOrFail($id);
        $record->update($validated);

        return redirect()->back()->with('success', 'E-Wallet record updated.');
    }
}
