<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccGeneralLedger extends Model
{
    
    protected $table = 'acc_general_ledgers';
    protected $fillable = [
        'branch', 'referenceNo', 'memberId', 'accountCode', 'accountName', 
        'debit', 'credit', 'particulars', 'transactionDate', 'petty_cash_id',
        'e_wallet_id', 'bank_record_id', 'is_adjustment'
    ];

    protected $casts = [
        'transactionDate' => 'datetime',
    ];

    public function bankRecord(){
        return $this->belongsTo(AccBankRecord::class, 'bank_record_id');
    }
    
}
