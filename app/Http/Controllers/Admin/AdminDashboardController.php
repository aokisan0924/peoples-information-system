<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CapitalContribution;
use App\Models\Loan;
use App\Models\Member;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function showDashboard() {
        $totalMembers = Member::count();
        $totalShareCapital = (float)CapitalContribution::where('status', 'Paid')->sum('amount');

        return Inertia::render('Admin/AdminDashboard', [
            'dashboarSummary' => [
                'totalMembers' => $totalMembers,
                'totalShareCapital' => $totalShareCapital,
                'revenue' => 5000000,
            ]
        ]);
    }
}