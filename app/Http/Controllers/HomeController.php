<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\Member;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Request $request) {
        $totalMembers = (int) Member::count();

        $totalLoanAvailment = (float) Loan::sum('gross');

        return Inertia::render('Home', [
            'stats' => [
                'totalMembers' => $totalMembers,
                'totalLoanAvailment' => $totalLoanAvailment
            ]
        ]);
    }
}
