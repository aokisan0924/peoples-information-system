<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberTransaction extends Model
{
    protected $table = 'member_transactions';

    protected $fillable = [
        'memberId',
        'module',
        'transactionType',
        'description',
        'referenceNumber',
        'sourceId',
        'debit',
        'credit',
        'transactionDate',
        'status',
        'meta',
    ];

    protected $casts = [
        'transactionDate' => 'datetime',
        'meta'            => 'array',
        'debit'           => 'decimal:2',
        'credit'          => 'decimal:2',
    ];

    public function member() {
        return $this->belongsTo(Member::class, 'memberId');
    }
}
