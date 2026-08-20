<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanAmortizationSchedule extends Model
{
    protected $guarded = [];

    protected $casts = [
        'dueDate' => 'date',
        'amountDue' => 'float',
        'amountPaid' => 'float',
        'openingBalance' => 'float',
        'principalDue' => 'float',
        'interestDue' => 'float',
        'closingBalance' => 'float',
        'principalPaid' => 'float',
        'interestPaid' => 'float',
    ];
    
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function loan() {
        return $this->belongsTo(Loan::class, 'loanId', 'id');
    }
}
