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
        $now = Carbon::now();
        $startOfCurrentMonth = $now->copy()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        $totalMembers = Member::count();
        $totalShareCapital = (float) CapitalContribution::whereIn('status', ['Paid', 'Posted'])->sum('amount');
        $totalSavings = (float) SavingsDeposit::whereIn('status', ['Paid', 'Posted'])->sum('amount');
        $totalTimeDeposits = (float) TimeDeposit::sum('principal') - (float) TimeDepositWithdrawal::sum('amount');
        $totalLoanIncome = (float) Loan::where('status', 'released')->sum('income');
        
        $currentMonthIncome = (float) Loan::where('status', 'released')
            ->whereBetween('updated_at', [$startOfCurrentMonth, $now])
            ->sum('income');

        $prevMembers = Member::where('created_at', '<', $startOfCurrentMonth)->count();
        $prevShareCapital = (float) CapitalContribution::whereIn('status', ['Paid', 'Posted'])
            ->where('created_at', '<=', $endOfLastMonth)->sum('amount');
        $prevSavings = (float) SavingsDeposit::whereIn('status', ['Paid', 'Posted'])
            ->where('created_at', '<=', $endOfLastMonth)->sum('amount');
        $prevTimeDeposits = (float) TimeDeposit::where('created_at', '<=', $endOfLastMonth)->sum('principal') 
            - (float) TimeDepositWithdrawal::where('created_at', '<=', $endOfLastMonth)->sum('amount');
        $prevMonthIncome = (float) Loan::where('status', 'released')
            ->whereBetween('updated_at', [$now->copy()->subMonth()->startOfMonth(), $endOfLastMonth])
            ->sum('income');

        $calcTrend = function($current, $prev) {
            if ($prev <= 0) return $current > 0 ? '+100%' : '0%';
            $diff = (($current - $prev) / $prev) * 100;
            return ($diff >= 0 ? '+' : '') . number_format($diff, 1) . '%';
        };

        $genderData = Member::select(DB::raw("
            CASE 
                WHEN UPPER(gender) IN ('M', 'MALE') THEN 'Male'
                WHEN UPPER(gender) IN ('F', 'FEMALE') THEN 'Female'
                ELSE 'Unspecified'
            END as normalized_name
        "), DB::raw('count(*) as value'))
        ->groupBy('normalized_name')
        ->get()
        ->map(fn($item) => [
            'name' => $item->normalized_name,
            'value' => (int) $item->value
        ]);

        $membersBirthdays = Member::whereNotNull('dob')->pluck('dob');
        $ageBins = ['18-30' => 0, '31-45' => 0, '46-60' => 0, '61+' => 0];
        foreach ($membersBirthdays as $bday) {
            try {
                $age = Carbon::parse($bday)->age;
                if ($age >= 18 && $age <= 30) $ageBins['18-30']++;
                elseif ($age >= 31 && $age <= 45) $ageBins['31-45']++;
                elseif ($age >= 46 && $age <= 60) $ageBins['46-60']++;
                elseif ($age >= 61) $ageBins['61+']++;
            } catch (\Exception $e) { continue; }
        }
        
        $accountStatusData = Member::select('accountStatus', DB::raw('count(*) as value'))
            ->groupBy('accountStatus')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => ucfirst(strtolower($item->accountStatus ?: 'Unverified')),
                    'value' => (int) $item->value
                ];
            })
            ->values()
            ->toArray();

        return Inertia::render('Admin/AdminDashboard', [
            'dashboardSummary' => [
                'totalMembers' => $totalMembers,
                'totalShareCapital' => $totalShareCapital,
                'totalSavings' => $totalSavings,
                'totalTimeDeposits' => $totalTimeDeposits,
                'totalLoanIncome' => $totalLoanIncome,
                'trends' => [
                    'members' => $calcTrend($totalMembers, $prevMembers),
                    'capital' => $calcTrend($totalShareCapital, $prevShareCapital),
                    'savings' => $calcTrend($totalSavings, $prevSavings),
                    'time' => $calcTrend($totalTimeDeposits, $prevTimeDeposits),
                    'income' => $calcTrend($currentMonthIncome, $prevMonthIncome),
                ]
            ],
            'chartData' => $this->getMonthlyData(),
            'branchData' => $this->getBranchData(),
            'genderData' => $genderData,
            'ageData' => collect($ageBins)->map(fn($count, $range) => ['range' => $range, 'count' => $count])->values(),
            'accountStatusData' => $accountStatusData,
        ]);
    }

    private function getMonthlyData() {
        return collect(range(5, 0))->map(function ($i) {
            $date = Carbon::now()->subMonths($i);
            return [
                'name' => $date->format('M'),
                'loan_income' => (float) Loan::where('status', 'released')->whereMonth('updated_at', $date->month)->sum('income'),
                'capital' => (float) CapitalContribution::whereIn('status', ['Paid', 'Posted'])->where('created_at', '<=', $date->endOfMonth())->sum('amount'),
            ];
        });
    }

    private function getBranchData() {
        return BranchService::select('branchService', DB::raw('count(*) as value'))
            ->whereNotNull('branchService')->groupBy('branchService')
            ->orderByDesc('value')->limit(6)->get()
            ->map(fn($item) => ['name' => $item->branchService, 'value' => $item->value]);
    }
}