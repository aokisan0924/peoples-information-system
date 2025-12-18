<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class postApprovalDocuments extends Model
{
    protected $fillable = [
        'loanId','docsType',
        'originalName','mimeType',
        'size','disk','path'
    ];

    public function loan(): BelongsTo {
        return $this->belongsTo(Loan::class, 'loanId', 'id');
    }
}
