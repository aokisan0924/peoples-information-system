<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class TimeDepositCalculatorController extends Controller
{

    public function showClientTimeDeposit(){
        return Inertia::render('Client/TimeDeposit');
    }
    /**
     * Annual interest rates per term (years).
     *
     * @var array<int,float>
     */
    private array $rateTable = [
        1 => 0.063,
        2 => 0.065,
        3 => 0.070,
        4 => 0.073,
        5 => 0.075,
    ];

    public function showTimeDeposit(Request $request): Response {
        $amount = (float) $request->input('amount', 100000);
        $termYears = (int) $request->input('termYears', 1);

        if ($amount < 0) {
            $amount = 0;
        }

        if ($termYears < 1 || $termYears > 5) {
            $termYears = 1;
        }

        $summary = $this->compute($amount, $termYears);

        $rateLadder = $this->buildRateLadder();

        return Inertia::render('TimeDeposit', [
            'initialAmount'   => number_format($amount, 2, '.', ''),
            'initialTermYears'=> $termYears,
            'rateLadder'      => $rateLadder,
            'summary'         => $summary,
        ]);
    }

    public function calculate(Request $request): JsonResponse {
        $validated = $request->validate([
            'amount'    => ['required', 'numeric', 'min:0', 'max:1000000000'],
            'termYears' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $amount = (float) $validated['amount'];
        $termYears = (int) $validated['termYears'];

        $summary = $this->compute($amount, $termYears);

        return response()->json([
            'amount'    => number_format($amount, 2, '.', ''),
            'termYears' => $termYears,
            'summary'   => $summary,
        ]);
    }

    /**
     * Core computation: maturity with annual compounding.
     */
    private function compute(float $amount, int $termYears): array {
        $rate = $this->rateTable[$termYears] ?? 0.0;
        $ratePercent = $rate * 100;

        $maturityAmount = $amount * pow(1 + $rate, $termYears);
        $interestAmount = $maturityAmount - $amount;

        return [
            [
                'key'         => 'principal',
                'title'       => 'Principal Amount',
                'value'       => $this->formatCurrency($amount),
                'description' => 'Initial placement in your time deposit account.',
                'highlight'   => false,
            ],
            [
                'key'         => 'termAndRate',
                'title'       => 'Term & Rate',
                'value'       => sprintf('%d year(s) • %.2f%% p.a.', $termYears, $ratePercent),
                'description' => 'Fixed rate for the chosen term, compounded annually.',
                'highlight'   => false,
            ],
            [
                'key'         => 'interestEarned',
                'title'       => 'Total Interest at Maturity',
                'value'       => $this->formatCurrency($interestAmount),
                'description' => sprintf(
                    'Total interest earned at %.2f%% per year, compounded annually for %d year(s).',
                    $ratePercent,
                    $termYears
                ),
                'highlight'   => true,
            ],
            [
                'key'         => 'maturityAmount',
                'title'       => 'Maturity Value',
                'value'       => $this->formatCurrency($maturityAmount),
                'description' => 'Principal plus all compounded interest at the end of the term.',
                'highlight'   => true,
            ],
        ];
    }

    /**
     * Build rate ladder for display only.
     *
     * @return array<int,array<string,string|int>>
     */
    private function buildRateLadder(): array {
        $ladder = [];

        foreach ($this->rateTable as $termYears => $rate) {
            $ladder[] = [
                'termYears' => $termYears,
                'label'     => $termYears . ' year' . ($termYears > 1 ? 's' : ''),
                'rateLabel' => sprintf('%.2f%% per year', $rate * 100),
                'value'     => $termYears,
            ];
        }

        return $ladder;
    }

    private function formatCurrency(float $value): string {
        return '₱ ' . number_format($value, 2, '.', ',');
    }
}
