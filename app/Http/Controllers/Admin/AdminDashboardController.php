<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BranchService;
use App\Models\CapitalContribution;
use App\Models\Loan;
use App\Models\Member;
use App\Models\SavingsDeposit;
use App\Models\TimeDeposit;
use App\Models\TimeDepositWithdrawal; 
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function showDashboard() {
        // --- 1. CARD TOTALS (Net Running Balances) ---
        $totalMembers = Member::count();
        
        $totalShareCapital = (float) CapitalContribution::whereIn('status', ['Paid', 'Posted'])
            ->sum('amount');
        
        $totalSavings = (float) SavingsDeposit::whereIn('status', ['Paid', 'Posted'])
            ->sum('amount');
        
        $timePrincipal = (float) TimeDeposit::sum('principal');
        $timeWithdraw = (float) TimeDepositWithdrawal::sum('amount');
        $totalTimeDeposits = $timePrincipal - $timeWithdraw;

        $totalLoanIncome = (float) Loan::where('status', 'released')->sum('income');

        // --- 2. CHART DATA (Last 6 Months) ---
        $chartData = $this->getMonthlyData();

        // --- 3. PIE CHART DATA (Branch Distribution) ---
        $branchData = BranchService::select('branchService', DB::raw('count(*) as count'))
            ->whereNotNull('branchService')
            ->where('branchService', '!=', '')
            ->groupBy('branchService')
            ->orderByDesc('count')
            ->limit(6)
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
                'totalLoanIncome'    => $totalLoanIncome, // <--- Passed to View
            ],
            'chartData'  => $chartData,
            'branchData' => $branchData
        ]);
    }

    private function getMonthlyData()
    {
        $months = collect(range(5, 0))->map(function ($i) {
            return Carbon::now()->subMonths($i);
        });

        return $months->map(function ($date) {
            $monthName = $date->format('M');
            $endOfMonth = $date->copy()->endOfMonth(); 

            // 1. MEMBERS 
            $members = Member::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->count();

            // 2. SHARE CAPITAL (Net)
            $capital = CapitalContribution::whereIn('status', ['Paid', 'Posted'])
                ->where('created_at', '<=', $endOfMonth)
                ->sum('amount');

            // 3. SAVINGS (Net)
            $savings = SavingsDeposit::whereIn('status', ['Paid', 'Posted'])
                ->where('created_at', '<=', $endOfMonth)
                ->sum('amount');

            // 4. TIME DEPOSIT (Net)
            $timePrincipal = TimeDeposit::where('created_at', '<=', $endOfMonth)->sum('principal');
            $timeWithdrawals = TimeDepositWithdrawal::where('created_at', '<=', $endOfMonth)->sum('amount');
            $time = $timePrincipal - $timeWithdrawals;

            // 5. LOAN INCOME
            $loanIncome = Loan::where('status', 'released')
                ->whereMonth('updated_at', $date->month)
                ->whereYear('updated_at', $date->year)
                ->sum('income');

            return [
                'name'        => $monthName,
                'members'     => $members,
                'capital'     => (float) $capital,
                'savings'     => (float) $savings,
                'time'        => (float) $time,
                'loan_income' => (float) $loanIncome,
            ];
        })->values();
    }
}