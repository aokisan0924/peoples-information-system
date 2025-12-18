<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeDepositWithdrawal extends Model
{
    protected $fillable = [
        'timeDepositId',
        'amount',
        'withdrawnDate',
        'remarks',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'withdrawnDate'=> 'date',
    ];

    public function timeDeposit()
    {
        return $this->belongsTo(TimeDeposit::class, 'timeDepositId');
    }
}
