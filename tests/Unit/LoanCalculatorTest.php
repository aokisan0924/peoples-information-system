<?php

namespace Tests\Unit;

use App\Services\LoanCalculator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class LoanCalculatorTest extends TestCase
{
    #[DataProvider('rateCases')]
    public function test_official_rates_are_used_for_every_supported_term(int $months, float $annualRate): void
    {
        $result = (new LoanCalculator())->calculate(100_000, $months);

        $this->assertSame(LoanCalculator::VERSION, $result['calculationVersion']);
        $this->assertEqualsWithDelta($annualRate, $result['annualInterestRate'], 0.000000001);
        $this->assertEqualsWithDelta($annualRate / 12, $result['monthlyInterestRate'], 0.000000001);
        $this->assertSame($months, $result['termMonths']);
    }

    public static function rateCases(): array
    {
        return [
            [12, 0.0750], [24, 0.0812], [36, 0.0850], [48, 0.0878], [60, 0.0900],
        ];
    }

    public function test_workbook_five_year_example_and_ledger_match(): void
    {
        $calculator = new LoanCalculator();
        $result = $calculator->calculate(155_836.50, 60, null, 300);

        $this->assertSame(17_531.61, $result['serviceFee']);
        $this->assertSame(11_687.74, $result['insurance']);
        $this->assertSame(2_337.55, $result['advanceInterest']);
        $this->assertSame(192_693.39, $result['loanAmount']);
        $this->assertSame(4_000.00, $result['monthlyAmortization']);
        $this->assertSame(239_999.87, $result['gross']);

        $schedule = $calculator->buildSchedule($result, new \DateTimeImmutable('2026-11-20'));
        $this->assertCount(60, $schedule);
        $this->assertSame(192_693.39, $schedule[0]['openingBalance']);
        $this->assertSame(1_445.20, $schedule[0]['interestDue']);
        $this->assertSame(2_554.80, $schedule[0]['principalDue']);
        $this->assertSame(190_138.59, $schedule[0]['closingBalance']);
        $this->assertEqualsWithDelta(192_693.39, array_sum(array_column($schedule, 'principalDue')), 0.001);
        $this->assertSame(0.0, $schedule[59]['closingBalance']);
    }

    public function test_capital_contribution_thresholds_are_deterministic(): void
    {
        $calculator = new LoanCalculator();

        $this->assertSame(5_000.0, $calculator->capitalContributionFor(299_999.99));
        $this->assertSame(10_000.0, $calculator->capitalContributionFor(300_000));
        $this->assertSame(35_000.0, $calculator->capitalContributionFor(1_000_000));
    }
}
