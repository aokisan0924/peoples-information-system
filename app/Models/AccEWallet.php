<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccEWallet extends Model
{
    protected $table = 'acc_e_wallets';
    protected $fillable = [
        'branch', 'transactionDate', 'referenceNo', 
        'particulars', 'walletType', 'debit', 'credit', 'is_posted'
    ];
}
