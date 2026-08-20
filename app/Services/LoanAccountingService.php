<?php

namespace App\Services;

use App\Models\AccJournalEntry;
use App\Models\Loan;
use App\Models\LoanPayment;

class LoanAccountingService
{
    public function __construct(private AccountingJournalQueue $queue)
    {
    }

    public function enqueueRelease(Loan $loan): void
    {
        $snapshot = $loan->calculation_snapshot ?? [];
        $branch = trim((string) $loan->member?->branch);
        $shareCapital = strtolower((string) $loan->member?->accountStatus) === 'regular'
            ? ['code' => '30110', 'name' => 'Subscribed Share Capital - Common']
            : ['code' => '30210', 'name' => 'Subscribed Share Capital - Preferred'];
        $receivable = (int) $loan->numberOfPayments <= 12
            ? ['code' => '11211', 'name' => 'Loan Receivables - Short Term']
            : ['code' => '11210', 'name' => 'Loan Receivables - Long Term'];

        $roundedServiceFee = round((float) $loan->loanAmount
            - (float) $loan->netProceeds
            - (float) $loan->insurance
            - (float) ($snapshot['capCon'] ?? 0)
            - (float) ($snapshot['membershipFee'] ?? 0)
            - (float) $loan->advanceInterest, 2);

        $entries = [
            $this->line($receivable, (float) $loan->loanAmount, 0),
            $this->line($this->cashAccount($branch), 0, (float) $loan->netProceeds),
            $this->line(['code' => '40120', 'name' => 'Service Fees'], 0, $roundedServiceFee),
            $this->line(['code' => '40740', 'name' => 'Insurance Premium'], 0, (float) $loan->insurance),
            $this->line($shareCapital, 0, (float) ($snapshot['capCon'] ?? 0)),
            $this->line(['code' => '40620', 'name' => 'Membership Fee'], 0, (float) ($snapshot['membershipFee'] ?? 0)),
            $this->line(['code' => '40110', 'name' => 'Interest Income from Loans'], 0, (float) $loan->advanceInterest),
        ];

        $entries = array_values(array_filter($entries, fn (array $line) => $line['debit'] > 0 || $line['credit'] > 0));
        $this->queue->enqueue(
            'loan',
            $loan->loanReference,
            $loan->id,
            $branch,
            optional($loan->release_date ?? now())->toDateString(),
            "Loan release {$loan->loanReference}",
            $entries,
            true,
            $loan->memberId,
        );
    }

    public function enqueuePayment(Loan $loan, LoanPayment $payment): void
    {
        $branch = trim((string) $loan->member?->branch);
        $receivable = (int) $loan->numberOfPayments <= 12
            ? ['code' => '11211', 'name' => 'Loan Receivables - Short Term']
            : ['code' => '11210', 'name' => 'Loan Receivables - Long Term'];

        $this->queue->enqueue(
            'loan_payment',
            $payment->batch_reference,
            $payment->id,
            $branch,
            $payment->payment_date->toDateString(),
            "Loan payment {$loan->loanReference}",
            [
                $this->line($this->cashAccount($branch), (float) $payment->amount, 0),
                $this->line($receivable, 0, (float) $payment->principal_amount),
                $this->line(['code' => '40110', 'name' => 'Interest Income from Loans'], 0, (float) $payment->interest_amount),
            ],
            false,
            $loan->memberId,
        );
    }

    private function cashAccount(string $branch): array
    {
        $key = strtolower($branch);
        if (str_contains($key, 'aguinaldo')) {
            return ['code' => '11115', 'name' => 'Cash on Hand - Aguinaldo'];
        }
        if (str_contains($key, 'fort')) {
            return ['code' => '11120', 'name' => 'Cash on Hand - Fort Mag'];
        }

        return AccJournalEntry::cashOnHandAccounts()['upi'];
    }

    private function line(array $account, float $debit, float $credit): array
    {
        return [
            'accountCode' => $account['code'],
            'accountName' => $account['name'],
            'debit' => round($debit, 2),
            'credit' => round($credit, 2),
        ];
    }
}
