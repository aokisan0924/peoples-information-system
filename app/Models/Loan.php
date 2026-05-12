<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    protected $fillable = [
        'memberId','loanReference','deductionCode','netProceeds','capCon',
        'membershipFee','termYears','advanceInterestMonths',
        'serviceFee','insurance','advanceInterest','loanAmount',
        'monthlyAmortization','gross','income','percentIncome',
        'effectiveInterestRate','monthlyInterestRate','numberOfPayments',
        'status', 'downloadsAcknowledged', 'loanType', 'loanClassification', 
        'processed_by', 'lrvNumber', 'journal_entries',
    ];

    protected $casts = [
        'journal_entries' => 'array',
    ];

    public function member(){
        return $this->belongsTo(Member::class, 'memberId', 'id');
    }

    public function loanDocuments() {
        return $this->hasMany(LoanDocuments::class, 'loanId', 'id');
    }

    public function postApprovalDocuments() {
        return $this->hasMany(PostApprovalDocuments::class, 'loanId', 'id');
    }

    public function processor() {
        return $this->belongsTo(Admin::class, 'processed_by');
    }
}
