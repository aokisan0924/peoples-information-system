<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccPettyCashFund extends Model
{
    protected $table = 'acc_petty_cash_funds';
    protected $fillable = ['branch', 'transactionDate', 'orNumber', 'particulars', 'debit', 'credit', 'is_posted'];
}
