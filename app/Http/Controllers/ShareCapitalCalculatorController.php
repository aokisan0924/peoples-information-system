<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class ShareCapitalCalculatorController extends Controller
{
    private float $interestRateYear = 0.0908; // 9.08% declared for 2024

    public function showShareCapital(): Response
    {
        $average = 0;
        $summary = $this->compute($average);

        return Inertia::render('ShareCapitalDeposit', [
            'initialAverage' => number_format($average, 2, '.', ''),
            'interestRate'   => $this->interestRateYear,
            'summary'        => $summary,
        ]);
    }

    public function calculate(Request $request): JsonResponse {
        $request->validate([
            'average' => ['required', 'numeric', 'min:0', 'max:9999999999'],
        ]);

        $average = (float) $request->average;

        return response()->json([
            'average' => number_format($average, 2, '.', ''),
            'summary' => $this->compute($average),
        ]);
    }

    private function compute(float $average): array {
        $interest = $average * $this->interestRateYear;
        $newBalance = $average + $interest;

        return [
            [
                'title' => 'Average Share Capital',
                'value' => $this->format($average),
                'description' => 'The average share capital used for dividend computation.',
                'highlight' => false,
            ],
            [
                'title' => 'Interest / Dividend (2024)',
                'value' => $this->format($interest),
                'description' => 'Computed at the annual declared rate of 9.08% for the year 2024.',
                'highlight' => true,
            ],
            [
                'title' => 'New Total Share Capital',
                'value' => $this->format($newBalance),
                'description' => 'Average share capital plus 2024 declared dividend.',
                'highlight' => true,
            ],
        ];
    }

    private function format(float $value): string {
        return '₱ ' . number_format($value, 2, '.', ',');
    }
}
