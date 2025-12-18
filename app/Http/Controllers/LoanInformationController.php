<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class LoanInformationController extends Controller
{
    public function showLoanInfo() {
        return Inertia::render('LoanInformation');
    }
}
