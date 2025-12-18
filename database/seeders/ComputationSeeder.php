<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Computations;

class ComputationSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            // 5y
            [
                'title' => 'Active & Pensioner • 5y v1',
                'category' => 'ACTIVE_PENSIONER_V1',
                'termMonths' => 60,
                'annualRateFormula' => '0.09',
                'monthlyRateFormula' => 'annualInterestRate/12',
                'serviceFeeFormula' => 'netProceeds*0.121',
                'insuranceFormula' => '(netProceeds/1000)*terms',
                'advanceInterestFormula' => 'monthlyInterestRate*netProceeds*advanceInterestMonths',
                'effectiveRateFormula' => '(1+annualInterestRate/terms)^terms-1',
                'isActive' => true,
                'notes' => 'Service fee 12.1%'
            ],
            // 4y
            [
                'title' => 'Active & Pensioner • 4y v1',
                'category' => 'ACTIVE_PENSIONER_V1',
                'termMonths' => 48,
                'annualRateFormula' => '0.0878',
                'monthlyRateFormula' => 'annualInterestRate/12',
                'serviceFeeFormula' => 'netProceeds*0.08',
                'insuranceFormula' => '(netProceeds/1000)*terms',
                'advanceInterestFormula' => 'monthlyInterestRate*netProceeds*advanceInterestMonths',
                'effectiveRateFormula' => '(1+annualInterestRate/terms)^terms-1',
                'isActive' => true,
                'notes' => 'Service fee 8%'
            ],
            // 3y
            [
                'title' => 'Active & Pensioner • 3y v1',
                'category' => 'ACTIVE_PENSIONER_V1',
                'termMonths' => 36,
                'annualRateFormula' => '0.085',
                'monthlyRateFormula' => 'annualInterestRate/12',
                'serviceFeeFormula' => 'netProceeds*0.08',
                'insuranceFormula' => '(netProceeds/1000)*terms',
                'advanceInterestFormula' => 'monthlyInterestRate*netProceeds*advanceInterestMonths',
                'effectiveRateFormula' => '(1+annualInterestRate/terms)^terms-1',
                'isActive' => true
            ],
            // 2y
            [
                'title' => 'Active & Pensioner • 2y v1',
                'category' => 'ACTIVE_PENSIONER_V1',
                'termMonths' => 24,
                'annualRateFormula' => '0.0812',
                'monthlyRateFormula' => 'annualInterestRate/12',
                'serviceFeeFormula' => 'netProceeds*0.075',
                'insuranceFormula' => '(netProceeds/1000)*terms',
                'advanceInterestFormula' => 'monthlyInterestRate*netProceeds*advanceInterestMonths',
                'effectiveRateFormula' => '(1+annualInterestRate/terms)^terms-1',
                'isActive' => true
            ],
            // 1y
            [
                'title' => 'Active & Pensioner • 1y v1',
                'category' => 'ACTIVE_PENSIONER_V1',
                'termMonths' => 12,
                'annualRateFormula' => '0.075',
                'monthlyRateFormula' => 'annualInterestRate/12',
                'serviceFeeFormula' => 'netProceeds*0.07',
                'insuranceFormula' => '(netProceeds/1000)*terms',
                'advanceInterestFormula' => 'monthlyInterestRate*netProceeds*advanceInterestMonths',
                'effectiveRateFormula' => '(1+annualInterestRate/terms)^terms-1',
                'isActive' => true
            ],
        ];

        foreach ($rows as $row) {
            Computations::updateOrCreate(
                ['category' => $row['category'], 'termMonths' => $row['termMonths'], 'title' => $row['title']],
                $row
            );
        }
    }
}
