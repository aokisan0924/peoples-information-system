<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeDeposit extends Model
{
    protected $fillable = [
        'memberId',
        'principal',
        'termYears',
        'creditedYears',
        'interestRate',
        'startDate',
        'maturityDate',
        'maturityValue',
    ];

    protected $casts = [
        'startDate'     => 'date',
        'maturityDate'  => 'date',
        'principal'     => 'decimal:2',
        'maturityValue' => 'decimal:2',
        'interestRate'  => 'decimal:2',
    ];

    public function member() {
        return $this->belongsTo(Member::class, 'memberId');
    }

    public function interests() {
        return $this->hasMany(TimeDepositInterest::class, 'timeDepositId');
    }
    
    public function withdrawals() {
        return $this->hasMany(TimeDepositWithdrawal::class, 'timeDepositId');
    }
}
