<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanAmortizationSchedule extends Model
{
    protected $guarded = [];
    
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function loan() {
        return $this->belongsTo(Loan::class, 'loanId', 'id');
    }
}
