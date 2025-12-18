<?php

namespace App\Services;

use App\Models\MemberTransaction;
use App\Models\SavingsDeposit;
use App\Models\CapitalContribution;
use App\Models\Loan;
use App\Models\TimeDeposit;
use App\Models\MembershipPayment;
use Carbon\Carbon;

class MemberTransactionLogger
{
    /**
     * Savings deposit (client / admin / Maya)
     */
    public function logSavingsDeposit(SavingsDeposit $deposit): void
    {
        MemberTransaction::create([
            'memberId'        => $deposit->memberId,
            'module'          => 'savings',
            'transactionType' => 'deposit',
            'description'     => 'Savings deposit',
            'referenceNumber' => $deposit->referenceNumber ?? null,
            'sourceId'        => $deposit->id,
            'debit'           => 0,
            'credit'          => (float) $deposit->amount,
            'transactionDate' => $deposit->created_at ?? Carbon::now(),
            'status'          => strtolower($deposit->status ?? ['posted', 'Posted', 'POSTED']),
            'meta'            => [
                'sourceTable' => 'savings_deposits',
            ],
        ]);
    }

    /**
     * Savings withdrawal
     */
    public function logSavingsWithdrawal(SavingsDeposit $withdrawal): void
    {
        MemberTransaction::create([
            'memberId'        => $withdrawal->memberId,
            'module'          => 'savings',
            'transactionType' => 'withdrawal',
            'description'     => 'Savings withdrawal',
            'referenceNumber' => $withdrawal->referenceNumber ?? null,
            'sourceId'        => $withdrawal->id,
            'debit'           => (float) $withdrawal->amount,
            'credit'          => 0,
            'transactionDate' => $withdrawal->created_at ?? Carbon::now(),
            'status'          => strtolower($withdrawal->status ?? ['posted', 'Posted', 'POSTED']),
            'meta'            => [
                'sourceTable' => 'savings_deposits',
            ],
        ]);
    }

    /**
     * Share capital / capcon (OTC, Maya, etc.)
     */
    public function logShareCapital(CapitalContribution $contribution, string $description = 'Share capital contribution'): void
    {
        MemberTransaction::create([
            'memberId'        => $contribution->memberId,
            'module'          => 'shareCapital',
            'transactionType' => 'deposit',
            'description'     => $description,
            'referenceNumber' => $contribution->referenceNumber ?? $contribution->reference_number ?? null,
            'sourceId'        => $contribution->id,
            'debit'           => 0,
            'credit'          => (float) $contribution->amount,
            'transactionDate' => $contribution->created_at ?? Carbon::now(),
            'status'          => strtolower($contribution->status ?? ['posted', 'Posted', 'POSTED']),
            'meta'            => [
                'sourceTable' => 'capital_contributions',
            ],
        ]);
    }

    /**
     * Loan release only (payments will come from accounting system later)
     */
    public function logLoanRelease(Loan $loan, float $amount, ?string $description = null): void
    {
        MemberTransaction::create([
            'memberId'        => $loan->memberId,
            'module'          => 'loan',
            'transactionType' => 'loanRelease',
            'description'     => $description ?? ('Loan release - ' . ($loan->loanReference ?? '')),
            'referenceNumber' => $loan->loanReference ?? null,
            'sourceId'        => $loan->id,
            'debit'           => 0,
            'credit'          => $amount,
            'transactionDate' => $loan->created_at ?? Carbon::now(),
            'status'          => strtolower($loan->status ?? 'released'),
            'meta'            => [
                'termYears'    => $loan->termYears ?? null,
                'product'      => $loan->loanClassification ?? null,
                'sourceTable'  => 'loans',
            ],
        ]);
    }

    /**
     * Time deposit placement
     */
    public function logTimeDepositPlacement(TimeDeposit $timeDeposit): void
    {
        MemberTransaction::create([
            'memberId'        => $timeDeposit->memberId,
            'module'          => 'timeDeposit',
            'transactionType' => 'deposit',
            'description'     => 'Time deposit placement',
            'referenceNumber' => $timeDeposit->referenceNumber ?? null,
            'sourceId'        => $timeDeposit->id,
            'debit'           => 0,
            'credit'          => (float) $timeDeposit->principal,
            'transactionDate' => $timeDeposit->created_at ?? Carbon::now(),
            'status'          => strtolower($timeDeposit->status ?? 'active'),
            'meta'            => [
                'termMonths'   => $timeDeposit->termMonths ?? null,
                'interestRate' => $timeDeposit->interestRate ?? null,
                'sourceTable'  => 'time_deposits',
            ],
        ]);
    }

    /**
     * Membership payment (₱300) – OTC or via Maya
     */
    public function logMembershipPayment(MembershipPayment $payment, string $description = 'Membership fee payment'): void
    {
        MemberTransaction::create([
            'memberId'        => $payment->memberId,
            'module'          => 'membership',
            'transactionType' => 'fee',
            'description'     => $description,
            'referenceNumber' => $payment->reference_number ?? null,
            'sourceId'        => $payment->id,
            'debit'           => 0,
            'credit'          => (float) $payment->amount,
            'transactionDate' => $payment->paid_at ?? $payment->created_at ?? Carbon::now(),
            'status'          => strtolower($payment->status ?? ['posted', 'Posted', 'POSTED']),
            'meta'            => [
                'sourceTable' => 'membership_payments',
            ],
        ]);
    }
}
