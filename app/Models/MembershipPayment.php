<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MembershipPayment extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'memberId',
        'amount',
        'reference_number',
        'is_paid',
        'paid_at',
    ];

    protected $attributes = [
        'status' => 'Pending',
    ];
    
    public function member() {
        return $this->belongsTo(Member::class, 'memberId');
    }
}
