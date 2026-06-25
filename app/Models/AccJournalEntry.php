<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccJournalEntry extends Model
{
    use SoftDeletes;

    protected $table = 'acc_journal_entries';

    protected $fillable = [
        'batch_reference',
        'source_type',
        'member_id',
        'branch',
        'account_code',
        'account_name',
        'debit',
        'credit',
        'particulars',
        'transaction_date',
        'status',
        'reviewed_by',
        'reviewed_at',
        'reviewer_notes',
    ];

    protected $casts = [
        'debit'           => 'float',
        'credit'          => 'float',
        'transaction_date'=> 'date',
        'reviewed_at'     => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────────

    public function member(): BelongsTo {
        return $this->belongsTo(Member::class, 'memberId');
    }

    public function reviewer(): BelongsTo {
        return $this->belongsTo(Admin::class, 'reviewed_by');
    }

    // ── Scopes ───────────────────────────────────────────────────

    public function scopePendingReview($query) {
        return $query->where('status', 'pending_review');
    }

    public function scopeApproved($query) {
        return $query->where('status', 'approved');
    }

    // ── Helpers ──────────────────────────────────────────────────

    public function isPendingReview(): bool  { return $this->status === 'pending_review'; }
    public function isApproved(): bool       { return $this->status === 'approved'; }
}
