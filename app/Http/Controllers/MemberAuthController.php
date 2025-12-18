<?php

namespace App\Http\Controllers;

use App\Models\CapitalContribution;
use App\Models\MembershipPayment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MemberAuthController extends Controller{

    public function memberLogin(Request $request) {
        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);
        
        $remember = $request->boolean('remember');
    
        if (Auth::guard('member')->attempt($credentials, $remember)) {
            $request->session()->regenerate();
    
            $this->initializeFees(Auth::guard('member')->id());
    
            return redirect()->intended('/client/dashboard');
        }
    
        return back()
            ->withErrors([
                'username' => 'The provided credentials do not match our records.',
            ])
            ->withInput($request->only('username', 'remember'));
    }

    public function memberLogout(Request $request) {
        Auth::guard('member')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
    }

    protected function initializeFees($memberId){
        // Generate unique reference number
        $today = Carbon::now()->format('Ymd');
        $time = Carbon::now()->format('His');
        $txnCount = CapitalContribution::whereDate('created_at', Carbon::today())->count() + 1;
        $txnCode = str_pad($txnCount, 3, '0', STR_PAD_LEFT);
        $referenceNumber = "MEMCAP-{$today}{$time}{$txnCode}";

        // MEMBERSHIP PAYMENT
        $membership = MembershipPayment::firstOrCreate(
            ['memberId' => $memberId, 'is_paid' => false],
            ['amount' => 300, 'status' => 'Pending']
        );

        if (empty($membership->reference_number)) {
            $membership->reference_number = $referenceNumber;
            $membership->save();
        }

        // CAPITAL CONTRIBUTION
        $capital = CapitalContribution::firstOrCreate(
            ['memberId' => $memberId, 'is_paid' => false],
            ['amount' => 1000, 'status' => 'Pending']
        );

        if (empty($capital->reference_number)) {
            $capital->reference_number = $referenceNumber;
            $capital->save();
        }
    }

}