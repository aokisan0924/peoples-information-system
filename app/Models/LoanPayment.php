<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanPayment extends Model
{
    protected $guarded = [];

    protected $casts = [
        'payment_date' => 'date',
        'allocation_snapshot' => 'array',
        'amount' => 'float',
        'principal_amount' => 'float',
        'interest_amount' => 'float',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class, 'loan_id');
    }
}
