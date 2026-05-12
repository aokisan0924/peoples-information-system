<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccBankRecord extends Model
{
    protected $fillable = [
        'branch', 'bank_account_code', 'transaction_date', 
        'reference_no', 'particulars', 'debit', 'credit', 'is_journalized'
    ];

    public function ledgerEntries() {
        return $this->hasMany(AccGeneralLedger::class, 'bank_record_id');
    }
}
