<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class PettyCashController extends Controller
{

    private float $monthlyTotalRate      = 0.05;  // 5% / month
    private float $monthlyServiceRate    = 0.02;  // 2% / month
    private float $monthlyInterestRate   = 0.03;  // 3% / month
    private float $shareCapitalRequired  = 500.00;
    private float $membershipRequired    = 300.00;
    private int   $maxTermMonths         = 3;

    public function showPettyCash(Request $request): Response {
        $amount     = 10000.00;
        $termMonths = 3;

        $breakdown = $this->buildBreakdown($amount, $termMonths);

        return Inertia::render('PettyCash', [
            'initialAmount'     => number_format($amount, 2, '.', ''),
            'initialTermMonths' => $termMonths,
            'maxTermMonths'     => $this->maxTermMonths,
            'rates'             => $this->getRatesMeta(),
            'breakdown'         => $breakdown,
        ]);
    }

    public function calculate(Request $request): JsonResponse {
        $validated = $request->validate([
            'amount'     => ['required', 'numeric', 'min:0', 'max:30000'],
            'termMonths' => ['required', 'integer', 'min:1', 'max:3'],
        ]);

        $amount     = (float) $validated['amount'];
        $termMonths = (int) $validated['termMonths'];

        if ($amount > 30000) {
            return response()->json([
                'error' => true,
                'message' => 'Maximum petty cash loanable amount is ₱30,000.00.',
            ], 422);
        }
        
        $breakdown = $this->buildBreakdown($amount, $termMonths);

        return response()->json([
            'amount'     => number_format($amount, 2, '.', ''),
            'termMonths' => $termMonths,
            'rates'      => $this->getRatesMeta(),
            'breakdown'  => $breakdown,
        ]);
    }

    private function buildBreakdown(float $amount, int $termMonths): array {
        $serviceRateTotal  = $this->monthlyServiceRate  * $termMonths;
        $interestRateTotal = $this->monthlyInterestRate * $termMonths;

        $serviceFeeAmount  = $amount * $serviceRateTotal;
        $interestAmount    = $amount * $interestRateTotal;

        $shareCapital      = $this->shareCapitalRequired;
        $membershipFee     = $this->membershipRequired;

        $totalDeductions   = $serviceFeeAmount + $shareCapital + $membershipFee;
        $netProceeds       = $amount - $totalDeductions;

        return [
            'card' => [
                'netProceeds'   => $this->formatCurrency($netProceeds),
                'serviceFee'    => $this->formatCurrency($serviceFeeAmount),
                'interest'      => $this->formatCurrency($interestAmount),
                'membership'    => $this->formatCurrency($membershipFee),
                'shareCapital'  => $this->formatCurrency($shareCapital),
                'termMonths'    => $termMonths,
                'amount'        => $this->formatCurrency($amount),
            ],
        ];
    }

    private function getRatesMeta(): array {
        return [
            'monthlyTotalRate'    => $this->monthlyTotalRate,
            'monthlyServiceRate'  => $this->monthlyServiceRate,
            'monthlyInterestRate' => $this->monthlyInterestRate,
            'shareCapital'        => $this->shareCapitalRequired,
            'membershipFee'       => $this->membershipRequired,
            'maxTermMonths'       => $this->maxTermMonths,
        ];
    }

    private function formatCurrency(float $value): string {
        return '₱ ' . number_format($value, 2, '.', ',');
    }
}
