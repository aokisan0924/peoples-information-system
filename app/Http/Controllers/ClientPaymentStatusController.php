<?php

namespace App\Http\Controllers;

use App\Models\MembershipPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientPaymentStatusController extends Controller
{
    public function checkMembershipPaymentStatus() {
        $memberId = Auth::guard('member')->id();

        $hasPaid = MembershipPayment::where('memberId', $memberId)
            ->where('amount', 300)
            ->where('is_paid', true)
            ->exists();

        return response()->json([
            'hasPaidMembership' => $hasPaid, 
        ]);
    }
}
