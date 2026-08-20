<?php

namespace App\Http\Controllers;

use App\Services\LoanCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicCalculatorController extends Controller
{
    public function publicCalculatorIndex()
    {
        return Inertia::render('Calculator');
    }

    public function activePensionerV1(Request $request, LoanCalculator $calculator): JsonResponse
    {
        $data = $request->validate([
            'netProceeds' => ['required', 'numeric', 'min:1'],
            'term' => ['required', 'integer', 'in:12,24,36,48,60'],
            'membershipFee' => ['nullable', 'numeric', 'min:0'],
            'capitalContribution' => ['nullable', 'numeric', 'min:0'],
        ]);

        $netProceeds = (float) $data['netProceeds'];
        $termMonths = (int) $data['term'];
        $membershipFee = isset($data['membershipFee']) && $data['membershipFee'] !== ''
            ? (float) $data['membershipFee']
            : 300.0;
        $capitalContribution = isset($data['capitalContribution']) && $data['capitalContribution'] !== ''
            ? (float) $data['capitalContribution']
            : null;

        $result = $calculator->calculate(
            $netProceeds,
            $termMonths,
            $capitalContribution,
            $membershipFee,
        );

        return response()->json([
            'calculationVersion' => $result['calculationVersion'],
            'monthlyAmortization' => $result['monthlyAmortization'],
            'membershipFee' => $result['membershipFee'],
            'capitalContribution' => $result['capCon'],
            'netProceeds' => $result['netProceeds'],
        ]);
    }
}
