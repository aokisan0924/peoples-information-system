<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanDocuments extends Model
{
    protected $fillable = [
        'loanId','docsType',
        'originalName','path',
        'mimeType','size'
    ];

    public function loan() {
        return $this->belongsTo(Loan::class, 'loanId', 'id');
    }
}
