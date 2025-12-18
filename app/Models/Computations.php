<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Computations extends Model
{
    protected $fillable = [
        'title',
        'category',
        'termMonths',
        'annualRateFormula',
        'monthlyRateFormula',
        'serviceFeeFormula',
        'insuranceFormula',
        'advanceInterestFormula',
        'effectiveRateFormula',
        'isActive',
        'notes',
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'termMonths' => 'integer',
    ];
}
