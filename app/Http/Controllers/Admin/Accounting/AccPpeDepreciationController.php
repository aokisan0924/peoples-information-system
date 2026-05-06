<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccPpeDepreciation;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

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

        $categories = [
            'Transport Equipment', 
            'Furniture & Fixtures', 
            'Office Equipment', 
            'Leasehold Improvt', 
            'ICT Equipment'
        ];

        $processedData = [];
        foreach ($categories as $cat) {
            $processedData[$cat] = [];
        }

        foreach ($ppes as $ppe) {
            $acquiredDate = Carbon::parse($ppe->date_acquired);
            
            $acquiredMonth = $acquiredDate->copy()->startOfMonth();
            $targetMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth();

            $monthsElapsed = $acquiredMonth->lessThanOrEqualTo($targetMonth)
                ? $acquiredMonth->diffInMonths($targetMonth)
                : 0;
                
            $maxMonths = $ppe->life_years * 12;
            
            if ($monthsElapsed > $maxMonths) {
                $monthsElapsed = $maxMonths;
            }

            $monthlyDeprn = $ppe->amount / $maxMonths;
            $totalDeprn = $monthlyDeprn * $monthsElapsed;
            $netAmount = $ppe->amount - $totalDeprn;

            // Ensure category exists
            if (!isset($processedData[$ppe->category])) {
                $processedData[$ppe->category] = [];
            }

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

        return Inertia::render('Admin/Accounting/PPEDepreciation', [
            'data' => $processedData,
            'categories' => $categories,
            'filters' => [
                'branch' => $currentBranch,
                'month' => $month,
                'year' => $year,
                'monthName' => $selectedDate->format('F'),
            ]
        ]);
    }

    public function store(Request $request) {
        $request->validate([
            'category' => 'required|string',
            'date_acquired' => 'required|date',
            'particular' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'life_years' => 'required|numeric|min:1',
        ]);

        AccPpeDepreciation::create([
            'branch' => $request->user()->branch ?? 'Main Office',
            'category' => $request->category,
            'date_acquired' => $request->date_acquired,
            'particular' => $request->particular,
            'amount' => $request->amount,
            'life_years' => $request->life_years,
        ]);

        return redirect()->back()->with('success', 'PPE added successfully.');
    }

    public function update(Request $request, $id) {
        $record = AccPpeDepreciation::findOrFail($id);
        
        $request->validate([
            'category' => 'required|string',
            'date_acquired' => 'required|date',
            'particular' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'life_years' => 'required|numeric|min:1',
        ]);

        $record->update($request->only('category', 'date_acquired', 'particular', 'amount', 'life_years'));
        return redirect()->back()->with('success', 'PPE updated successfully.');
    }

    public function destroy($id) {
        AccPpeDepreciation::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'PPE deleted successfully.');
    }
}
