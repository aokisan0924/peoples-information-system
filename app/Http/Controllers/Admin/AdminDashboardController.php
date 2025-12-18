<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BranchService; // Added this import
use App\Models\CapitalContribution;
use App\Models\Loan;
use App\Models\Member;
use App\Models\SavingsDeposit;
use App\Models\TimeDeposit;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function showDashboard() {
        // --- 1. CARD TOTALS ---
        $totalMembers = Member::count();
        
        $totalShareCapital = (float) CapitalContribution::whereIn('status', ['Paid', 'Posted'])->sum('amount');
        
        $totalSavings = (float) SavingsDeposit::whereIn('status', ['Paid', 'Posted'])
            ->where('transactionType', 'deposit')
            ->sum('amount');
        
        $totalTimeDeposits = (float) TimeDeposit::sum('principal');

        // --- 2. CHART DATA (Last 6 Months) ---
        $chartData = $this->getMonthlyData();

        // --- 3. PIE CHART DATA (Branch Distribution) ---
        $branchData = BranchService::select('branchService', DB::raw('count(*) as count'))
            ->whereNotNull('branchService')
            ->where('branchService', '!=', '')
            ->groupBy('branchService')
            ->orderByDesc('count')
            ->limit(6) // Top 6 branches to keep chart clean
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->branchService,
                    'value' => $item->count
                ];
            });

        return Inertia::render('Admin/AdminDashboard', [
            'dashboardSummary' => [
                'totalMembers'       => $totalMembers,
                'totalShareCapital'  => $totalShareCapital,
                'totalSavings'       => $totalSavings,
                'totalTimeDeposits'  => $totalTimeDeposits,
            ],
            'chartData'  => $chartData,
            'branchData' => $branchData // Passed to view
        ]);
    }

    private function getMonthlyData()
    {
        $months = collect(range(5, 0))->map(function ($i) {
            return Carbon::now()->subMonths($i);
        });

        return $months->map(function ($date) {
            $month = $date->month;
            $year = $date->year;
            $monthName = $date->format('M');

            $capital = CapitalContribution::whereIn('status', ['Paid', 'Posted'])
                ->whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->sum('amount');

            $savings = SavingsDeposit::whereIn('status', ['Paid', 'Posted'])
                ->where('transactionType', 'deposit')
                ->whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->sum('amount');

            $time = TimeDeposit::whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->sum('principal');

            $members = Member::whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->count();

            return [
                'name'    => $monthName,
                'capital' => (float) $capital,
                'savings' => (float) $savings,
                'time'    => (float) $time,
                'members' => $members,
            ];
        })->values();
    }
}