<?php

namespace Tests\Feature;

use App\Services\LoanCalculator;
use Tests\TestCase;

class PublicCalculatorTest extends TestCase
{
    public function test_public_calculator_uses_the_authoritative_calculator_without_database_configuration(): void
    {
        $response = $this->postJson(route('public.calculator.activePensionerV1'), [
            'netProceeds' => 155_836.50,
            'term' => 60,
            'membershipFee' => 300,
            'capitalContribution' => 5000,
        ]);

        $response->assertOk()->assertJson([
            'calculationVersion' => LoanCalculator::VERSION,
            'monthlyAmortization' => 4000,
            'membershipFee' => 300,
            'capitalContribution' => 5000,
            'netProceeds' => 155_836.50,
        ]);
    }

    public function test_public_calculator_uses_the_capital_threshold_when_no_override_is_supplied(): void
    {
        $this->postJson(route('public.calculator.activePensionerV1'), [
            'netProceeds' => 300_000,
            'term' => 12,
        ])->assertOk()->assertJsonPath('capitalContribution', 10_000);
    }
}
