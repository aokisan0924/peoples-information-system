<?php

namespace App\Http\Controllers;

use App\Models\CapitalContribution;
use App\Models\MembershipPayment;
use Illuminate\Http\Request;

class MemberPaymentStatusController extends Controller
{
    public function showPaymentStatus(Request $request){
        $member = auth()->guard('member')->user();

        if (!$member) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $memberId = $member->id;

        $hasPaidMembership = MembershipPayment::where('memberId', $memberId)
            ->where('is_paid', true)
            ->exists();

        $totalCapConPaid = CapitalContribution::where('memberId', $memberId)
            ->where('is_paid', true)
            ->sum('amount');

        $hasInitialCapCon = $totalCapConPaid >= 1000;

        return response()->json([
            'membershipPayment' => [
                'is_paid' => $hasPaidMembership,
            ],
            'capitalContribution' => [
                'is_paid' => $hasInitialCapCon,
            ],
            'firstName' => $member->firstName ?? '',
            'lastName'  => $member->lastName ?? '',
            'email'     => $member->email ?? '',
            'contact'   => $member->contact ?? '',
        ]);
    }
}
