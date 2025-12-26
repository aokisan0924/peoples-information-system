<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavingsDeposit extends Model
{
    use HasFactory;

    protected $fillable = [
        'memberId', 'transactionType', 'amount',
        'referenceNumber', 'status', 'isPaid', 'paidAt', 'processed_by',

        'isWithdrawalRequest', 'withdrawalBankName', 'withdrawalAccountName',
        'withdrawalAccountNumber', 'withdrawalRemarks', 'requestStatus', 
        'requestReference', 'approvedAt', 'rejectedAt','payoutMethod',
        'payoutChannel', 
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'isPaid' => 'boolean',
        'paidAt' => 'date',
        'approvedAt' => 'datetime',
        'rejectedAt' => 'datetime',
    ];

    public function member() {
        return $this->belongsTo(Member::class, 'memberId');
    }

    public function processor() {
        // Change User::class to Admin::class
        return $this->belongsTo(Admin::class, 'processed_by');
    }
}
