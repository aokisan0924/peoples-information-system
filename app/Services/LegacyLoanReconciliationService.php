<?php

namespace App\Services;

use App\Models\Loan;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LegacyLoanReconciliationService
{
    public const VERSION = 'LEGACY-INFERRED-V1';

    public function preview(Loan $loan): array
    {
        $principal = (float) $loan->loanAmount;
        $payment = (float) $loan->monthlyAmortization;
        $months = (int) ($loan->numberOfPayments ?: $loan->termYears * 12);
        if ($principal <= 0 || $payment <= 0 || $months <= 0 || $payment * $months < $principal) {
            throw ValidationException::withMessages([
                'loan' => "{$loan->loanReference} has insufficient contractual figures for reconciliation.",
            ]);
        }

        $monthlyRate = $this->inferMonthlyRate($principal, $payment, $months);
        return [
            'calculationVersion' => self::VERSION,
            'legacyReconciliation' => true,
            'source' => 'Stored loan amount, monthly amortization, and number of payments',
            'termYears' => (int) $loan->termYears,
            'termMonths' => $months,
            'netProceeds' => (float) $loan->netProceeds,
            'loanAmount' => $principal,
            'monthlyAmortization' => $payment,
            'gross' => round($payment * $months, 2),
            'annualInterestRate' => $monthlyRate * 12,
            'monthlyInterestRate' => $monthlyRate,
            'effectiveInterestRate' => pow(1 + $monthlyRate, 12) - 1,
            'advanceInterestMonths' => (int) $loan->advanceInterestMonths,
        ];
    }

    public function apply(Loan $loan): array
    {
        $snapshot = $this->preview($loan);
        $releaseDate = $loan->release_date ?? $loan->created_at;
        $firstDueDate = $releaseDate->copy()->addMonthsNoOverflow(1 + $snapshot['advanceInterestMonths']);
        $schedule = app(LoanCalculator::class)->buildSchedule($snapshot, $firstDueDate);

        DB::transaction(function () use ($loan, $snapshot, $schedule, $releaseDate): void {
            $loan->update([
                'calculation_version' => self::VERSION,
                'calculation_snapshot' => $snapshot,
                'annual_interest_rate' => $snapshot['annualInterestRate'],
                'monthlyInterestRate' => $snapshot['monthlyInterestRate'],
                'effectiveInterestRate' => $snapshot['effectiveInterestRate'],
                'release_date' => $loan->release_date ?? $releaseDate,
            ]);
            DB::table('loan_amortization_schedules')->where('loanId', $loan->id)->delete();
            DB::table('loan_amortization_schedules')->insert(collect($schedule)->map(fn (array $row) => $row + [
                'loanId' => $loan->id, 'status' => 'unpaid', 'amountPaid' => 0,
                'principalPaid' => 0, 'interestPaid' => 0, 'createdAt' => now(), 'updatedAt' => now(),
            ])->all());
        });

        return $snapshot;
    }

    private function inferMonthlyRate(float $principal, float $payment, int $months): float
    {
        if (abs($payment * $months - $principal) < 0.005) return 0.0;
        $low = 0.0;
        $high = 0.10;
        for ($iteration = 0; $iteration < 120; $iteration++) {
            $rate = ($low + $high) / 2;
            $factor = pow(1 + $rate, $months);
            $candidate = $principal * (($factor * $rate) / ($factor - 1));
            if ($candidate > $payment) $high = $rate; else $low = $rate;
        }
        return ($low + $high) / 2;
    }
}
