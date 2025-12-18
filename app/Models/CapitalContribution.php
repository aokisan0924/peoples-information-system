<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CapitalContribution extends Model
{

    use HasFactory;

    protected $fillable = [
        'memberId',
        'amount',
        'reference_number',
        'is_paid',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_paid' => 'boolean',
        'paid_at' => 'datetime'
    ];

    protected $attributes = [
        'status' => 'Pending',
    ];
    
    public function member() {
        return $this->belongsTo(Member::class, 'memberId');
    }

    public function scopePosted($q) {
        return $q->where(function ($qq) {
            $qq->where('is_paid', true)->overWhereRaw('LOWER(status) = ?', ['posted']);
        });
    }

    public function scopeSearch($q, ?string $term) {
        if (!$term)
            return $q;

        $term = trim($term);
        return $q->where(function ($w) use ($term) {
            $w->where('reference_number', 'like', "%{$term}%")
                ->orWhereHas('member', function($mq) use ($term) {
                    $mq->where('firstName', 'like', "%{$term}%")
                    ->orWhere('lastName', 'like', "%{$term}%")
                    ->orWhere('username', 'like', "%{$term}%");
            });
        });
    }
}
