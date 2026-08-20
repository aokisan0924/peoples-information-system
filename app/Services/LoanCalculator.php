<?php

namespace App\Services;

use InvalidArgumentException;

class LoanCalculator
{
    public const VERSION = 'PMPC-2026-05-21';

    private const ANNUAL_RATES = [
        12 => 0.0750,
        24 => 0.0812,
        36 => 0.0850,
        48 => 0.0878,
        60 => 0.0900,
    ];

    public function calculate(
        float $netProceeds,
        int $termMonths,
        ?float $capCon = null,
        float $membershipFee = 0.0,
        int $advanceInterestMonths = 2,
    ): array {
        if ($netProceeds <= 0 || !isset(self::ANNUAL_RATES[$termMonths])) {
            throw new InvalidArgumentException('Net proceeds and loan term are invalid.');
        }

        $annualRate = self::ANNUAL_RATES[$termMonths];
        $monthlyRate = $annualRate / 12;
        $termYears = $termMonths / 12;
        $capCon ??= $this->capitalContributionFor($netProceeds);

        $serviceFee = $netProceeds * 0.0225 * $termYears;
        $insurance = ($netProceeds / 1000) * 1.25 * $termMonths;
        $advanceInterest = $netProceeds * $monthlyRate * $advanceInterestMonths;
        $money = static fn (float $value): float => round($value, 2);
        $loanAmount = $netProceeds + $serviceFee + $insurance + $capCon + $membershipFee + $advanceInterest;
        $factor = pow(1 + $monthlyRate, $termMonths);
        $monthlyAmortization = $loanAmount * (($factor * $monthlyRate) / ($factor - 1));
        $gross = $monthlyAmortization * $termMonths;
        $income = $gross - $netProceeds;

        return [
            'calculationVersion' => self::VERSION,
            'termYears' => (int) $termYears,
            'termMonths' => $termMonths,
            'netProceeds' => $money($netProceeds),
            'annualInterestRate' => $annualRate,
            'monthlyInterestRate' => $monthlyRate,
            'effectiveInterestRate' => pow(1 + ($annualRate / $termMonths), $termMonths) - 1,
            'serviceFee' => $money($serviceFee),
            'insurance' => $money($insurance),
            'capCon' => $money($capCon),
            'membershipFee' => $money($membershipFee),
            'advanceInterestMonths' => $advanceInterestMonths,
            'advanceInterest' => $money($advanceInterest),
            'loanAmount' => $money($loanAmount),
            'monthlyAmortization' => $money($monthlyAmortization),
            'gross' => $money($gross),
            'income' => $money($income),
            'incomePercent' => $gross > 0 ? $income / $gross : 0.0,
            'policy' => [
                'serviceFeeRatePerYear' => 0.0225,
                'insurancePerThousandPerMonth' => 1.25,
                'capitalContributionRule' => 'Below 300,000: 5,000; 300,000-999,999.99: 10,000; 1,000,000+: 35,000',
            ],
        ];
    }

    public function capitalContributionFor(float $netProceeds): float
    {
        if ($netProceeds >= 1_000_000) {
            return 35_000;
        }

        return $netProceeds >= 300_000 ? 10_000 : 5_000;
    }

    public function buildSchedule(array $calculation, \DateTimeInterface $firstDueDate): array
    {
        $balance = (float) $calculation['loanAmount'];
        $payment = (float) $calculation['monthlyAmortization'];
        $rate = (float) $calculation['monthlyInterestRate'];
        $months = (int) $calculation['termMonths'];
        $dueDate = \Carbon\Carbon::instance(\DateTime::createFromInterface($firstDueDate));
        $rows = [];
        $roundedPrincipalTotal = 0.0;

        for ($period = 1; $period <= $months; $period++) {
            $opening = $balance;
            $interest = $opening * $rate;
            $principal = $payment - $interest;
            $installment = $payment;

            if ($period === $months || $principal > $opening) {
                $principal = $opening;
                $installment = $principal + $interest;
            }

            $balance = max(0.0, $opening - $principal);
            $principalForRow = $period === $months
                ? round((float) $calculation['loanAmount'] - $roundedPrincipalTotal, 2)
                : round($principal, 2);
            $interestForRow = round($interest, 2);
            $roundedPrincipalTotal += $principalForRow;
            $rows[] = [
                'installmentNumber' => $period,
                'dueDate' => $dueDate->copy()->addMonthsNoOverflow($period - 1)->toDateString(),
                'openingBalance' => round($opening, 2),
                'amountDue' => round($principalForRow + $interestForRow, 2),
                'principalDue' => $principalForRow,
                'interestDue' => $interestForRow,
                'closingBalance' => round($balance, 2),
            ];
        }

        return $rows;
    }
}
