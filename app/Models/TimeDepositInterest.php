<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeDepositInterest extends Model
{
    protected $fillable = [
        'timeDepositId',
        'yearNumber',
        'interestAmount',
        'balanceAfter',
        'creditedDate',
    ];

    protected $casts = [
        'interestAmount' => 'decimal:2',
        'balanceAfter'   => 'decimal:2',
        'creditedDate'   => 'date',
    ];

    public function timeDeposit()
    {
        return $this->belongsTo(TimeDeposit::class, 'timeDepositId');
    }
}
