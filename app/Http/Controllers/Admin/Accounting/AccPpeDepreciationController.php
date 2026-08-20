<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccPpeDepreciation;
use App\Models\AccGeneralLedger;
use App\Models\AccChartOfAccount;
use App\Models\AccJournalEntry;
use App\Services\AccountingJournalQueue;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AccPpeDepreciationController extends Controller
{
    public function index(Request $request) {
        $currentBranch = $request->user()->branch ?? 'Main Office';
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        
        $selectedDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $ppes = AccPpeDepreciation::where('branch', $currentBranch)
                ->where('date_acquired', '<=', $selectedDate)
                ->orderBy('date_acquired', 'asc')
                ->get();

        $categories = ['Transport Equipment', 'Furniture & Fixtures', 'Office Equipment', 'Leasehold Improvt', 'ICT Equipment'];

        $processedData = [];
        foreach ($categories as $cat) {
            $processedData[$cat] = [];
        }

        foreach ($ppes as $ppe) {
            $acquiredDate = Carbon::parse($ppe->date_acquired);
            $acquiredMonth = $acquiredDate->copy()->startOfMonth();
            $targetMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth();

            $monthsElapsed = $acquiredMonth->lessThanOrEqualTo($targetMonth) ? $acquiredMonth->diffInMonths($targetMonth) : 0;
            $maxMonths = $ppe->life_years * 12;
            
            $monthlyDeprn = ($monthsElapsed > 0 && $monthsElapsed <= $maxMonths) ? ($ppe->amount / $maxMonths) : 0;
            
            if ($monthsElapsed > $maxMonths) $monthsElapsed = $maxMonths;

            $totalDeprn = ($ppe->amount / $maxMonths) * $monthsElapsed;
            $netAmount = $ppe->amount - $totalDeprn;

            if (!isset($processedData[$ppe->category])) $processedData[$ppe->category] = [];

            $processedData[$ppe->category][] = [
                'id' => $ppe->id,
                'category' => $ppe->category,
                'date_acquired' => $acquiredDate->format('Y-m-d'),
                'particular' => $ppe->particular,
                'amount' => $ppe->amount,
                'life_years' => $ppe->life_years,
                'monthly_deprn' => $monthlyDeprn,
                'total_deprn' => $totalDeprn,
                'net_amount' => $netAmount,
            ];
        }

        $transportRef = "DEPR-TRANS-{$year}-{$month}";
        $othersRef = "DEPR-OTHERS-{$year}-{$month}";

        $statusFor = function (string $reference) use ($currentBranch): ?string {
            $queued = AccJournalEntry::where('source_type', 'ppe')->where('batch_reference', $reference)
                ->where('branch', $currentBranch)->latest('id')->value('status');
            return $queued ?: (AccGeneralLedger::where('referenceNo', $reference)->where('branch', $currentBranch)->exists() ? 'approved' : null);
        };
        $journalStatus = ['transport' => $statusFor($transportRef), 'others' => $statusFor($othersRef)];

        return Inertia::render('Admin/Accounting/PPEDepreciation', [
            'data' => $processedData,
            'categories' => $categories,
            'chartOfAccounts' => AccChartOfAccount::orderBy('accountCode', 'asc')->get(),
            'journalStatus' => $journalStatus,
            'filters' => [
                'branch' => $currentBranch,
                'month' => str_pad($month, 2, '0', STR_PAD_LEFT),
                'year' => $year,
                'monthName' => $selectedDate->format('F'),
            ]
        ]);
    }

    public function journalize(Request $request, AccountingJournalQueue $queue) {
        $request->validate([
            'month' => 'required',
            'year' => 'required',
            'type' => 'required|in:transport,others',
            'branch' => 'required|string|exists:acc_ppe_depreciations,branch',
            'entries' => 'required|array|min:1'
        ]);

        $branch = $request->string('branch')->toString();
        $ref = $request->type === 'transport' ? "DEPR-TRANS-{$request->year}-{$request->month}" : "DEPR-OTHERS-{$request->year}-{$request->month}";
        $date = Carbon::createFromDate($request->year, $request->month, 1)->endOfMonth()->format('Y-m-d');
            
        $particulars = $request->type === 'transport'
                ? "Monthly Depreciation - Transport Equipment ({$request->month}/{$request->year})" 
                : "Monthly Depreciation - Other PPE ({$request->month}/{$request->year})";

        $queue->enqueue('ppe', $ref, null, $branch, $date, $particulars, $request->entries, true);
        return redirect()->back()->with('success', 'Depreciation journal submitted for review.');
    }

    public function storeBulk(Request $request) {
        $request->validate([
        'assets' => ['required', 'array', 'min:1'],
        'assets.*.category' => ['required', 'string'], 
        'assets.*.date_acquired' => ['required', 'date'],
        'assets.*.particular' => ['required', 'string'], 
        'assets.*.amount' => ['required', 'numeric', 'min:0'],
        'assets.*.life_years' => ['required', 'numeric', 'min:1'],
    ]);

        DB::transaction(function () use ($request) {
            $branch = $request->user()->branch ?? 'Main Office';

            foreach ($request->assets as $asset) {
                AccPpeDepreciation::create([
                    'branch' => $branch,
                    'category' => $asset['category'],
                    'date_acquired' => $asset['date_acquired'],
                    'particular' => $asset['particular'],
                    'amount' => $asset['amount'],
                    'life_years' => $asset['life_years'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'PPE Assets added successfully.');
    }

    public function update(Request $request, $id) {
        $record = AccPpeDepreciation::findOrFail($id);
        $request->validate(['category' => 'required|string', 'date_acquired' => 'required|date', 'particular' => 'required|string', 'amount' => 'required|numeric|min:0', 'life_years' => 'required|numeric|min:1']);
        $record->update($request->only('category', 'date_acquired', 'particular', 'amount', 'life_years'));
        return redirect()->back()->with('success', 'PPE updated successfully.');
    }

    public function destroy($id) {
        AccPpeDepreciation::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'PPE deleted successfully.');
    }
}
