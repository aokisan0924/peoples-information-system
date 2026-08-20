<?php

namespace App\Console\Commands;

use App\Models\Loan;
use App\Services\LegacyLoanReconciliationService;
use Illuminate\Console\Command;

class ReconcileLegacyLoans extends Command
{
    protected $signature = 'loans:reconcile-legacy {loanReference?} {--apply : Persist inferred rates and rebuilt schedules}';
    protected $description = 'Preview or explicitly reconcile released legacy loans without applying the new-loan formula';

    public function handle(LegacyLoanReconciliationService $service): int
    {
        $query = Loan::query()->whereRaw('LOWER(status) = ?', ['released'])->whereNull('calculation_version');
        if ($reference = $this->argument('loanReference')) {
            $query->where('loanReference', $reference);
        }
        $loans = $query->orderBy('id')->get();
        if ($loans->isEmpty()) {
            $this->info('No unreconciled legacy loans matched.');
            return self::SUCCESS;
        }

        $rows = [];
        foreach ($loans as $loan) {
            try {
                $snapshot = $this->option('apply') ? $service->apply($loan) : $service->preview($loan);
                $rows[] = [$loan->loanReference, $snapshot['termMonths'], number_format($snapshot['monthlyInterestRate'] * 100, 6).'%', $this->option('apply') ? 'reconciled' : 'preview'];
            } catch (\Throwable $exception) {
                $rows[] = [$loan->loanReference, '—', '—', 'blocked: '.$exception->getMessage()];
            }
        }
        $this->table(['Loan', 'Months', 'Inferred monthly rate', 'Result'], $rows);
        if (!$this->option('apply')) {
            $this->warn('Dry run only. Re-run with --apply after accounting validates the inferred contractual rates.');
        }
        return self::SUCCESS;
    }
}
