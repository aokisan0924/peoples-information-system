<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccBankRecord extends Model
{
    protected $fillable = [
        'referenceNo', 'memberId', 'accountCode', 'accountName',
        'debit', 'credit', 'particulars', 'transactionDate'
    ];
}
