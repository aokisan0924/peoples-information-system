<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanSetting extends Model
{
    protected $fillable = [
        'term',
        'annual_interest_rate',
        'service_fee_rate',
        'insurance_rate_per_1000',
        'advance_interest_months',
    ];

    public $timestamps = true;
}