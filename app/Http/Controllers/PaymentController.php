<?php

namespace App\Http\Controllers;

use App\Models\CapitalContribution;
use App\Models\CapitalTransaction;
use App\Models\MembershipPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function success () {
        return Inertia::render('Payment/PaymentSuccess');
    }

    public function cancel (Request $request) {
        $referenceNumber = $request->query('ref');
        $memberId = Auth::guard('member')->id();

        if (!$referenceNumber) {
            return redirect('/client/dashboard')->with('error', 'Missing reference number.');
        }

        MembershipPayment::where('memberId', $memberId)
            ->where('reference_number', $referenceNumber)
            ->where('is_paid', false)
            ->where('status', 'Pending')
            ->update(['status' => 'Canceled']);

        CapitalContribution::where('memberId', $memberId)
            ->where('reference_number', $referenceNumber)
            ->where('is_paid', false)
            ->where('status', 'Pending')
            ->update(['status' => 'Canceled']);

        return Inertia::render('Payment/PaymentCancel', [
            'referenceNumber' => $referenceNumber,
        ]);
    }

    public function failure () {
        return Inertia::render('Payment/PaymentFailure');
    }
}
