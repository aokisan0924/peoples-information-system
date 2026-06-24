<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class LoansReceivableController extends Controller
{
    public function index(): Response {
        return Inertia::render('Admin/Accounting/LoansReceivable');
    }

    // =========================================================================
    // GET /admin/accounting/receivables/api/data
    // Returns JSON array consumed by LoansReceivable.jsx via axios
    // =========================================================================
    public function getReceivablesData(): JsonResponse {
        try {
            $loans = Loan::with(['member'])
                ->whereRaw('LOWER(billing_status) = ?', ['billed'])
                ->orderByDesc('billed_at')
                ->get();

            $receivables = $loans->map(fn(Loan $loan) => $this->mapLoan($loan));

            return response()->json($receivables);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Map a single Loan model to the shape the JSX expects.
     *
     * JSX reads these exact keys:
     *   id, loanReference, memberName, gross, loanAmount,
     *   termMonths, billedAt, ledger[]
     */
    private function mapLoan(Loan $loan): array {
        $termMonths = (int) (
            $loan->termMonths
            ?? $loan->term_months
            ?? (($loan->termYears ?? $loan->term_years ?? 0) * 12)
        );

        $advanceMonths = (int) (
            $loan->advanceInterestMonths
            ?? $loan->advance_interest_months
            ?? 0
        );
        $baseDate = $loan->release_date
            ?? $loan->releaseDate
            ?? $loan->billed_at
            ?? $loan->created_at;

        return [
            'id'            => $loan->id,
            'loanReference' => $loan->loanReference,

            // JSX avatar uses memberName[0] — guard against null member
            'memberName'    => $loan->member
                ? "{$loan->member->lastName}, {$loan->member->firstName}"
                : 'Unknown Member',

            'gross'         => (float) ($loan->gross       ?? 0),
            'loanAmount'    => (float) ($loan->loanAmount   ?? 0),
            'termMonths'    => $termMonths,

            'billedAt'      => $loan->billed_at ? Carbon::parse($loan->billed_at)->format('M d, Y') : null,

            'ledger'        => ($baseDate && $termMonths > 0)
                ? $this->buildSchedule($loan, $termMonths, $advanceMonths, $baseDate instanceof Carbon ? $baseDate : Carbon::parse($baseDate))
                : [],
        ];
    }

    /**
     * Build the full amortisation schedule for one loan.
     *
     * Status logic (consumed by JSX StatusBadge):
     *   'paid'       → green
     *   'partial'    → sky blue
     *   'unpaid'     → gray  (future period, not yet due)
     *   'overdue'    → rose  (due date passed, not collected)
     *   'restructured' → amber
     *
     * NOTE: This builds a PROJECTED schedule. To show real paid/overdue
     * status per period, you need to load the loan collections relation
     * and pass paidPeriods into this method. See the commented block below.
     */
    private function buildSchedule(
        Loan   $loan,
        int    $termMonths,
        int    $advanceMonths,
        Carbon $baseDate
    ): array {
        $balance     = (float) ($loan->loanAmount         ?? 0);
        $installment = (float) ($loan->monthlyAmortization ?? 0);

        $monthlyRate = (float) ($loan->monthlyInterestRate ?? 0);

        if ($termMonths <= 0 || $installment <= 0) {
            return [];
        }

        $today    = Carbon::today();
        $schedule = [];

        // ── Optional: load paid periods from collections ──────────────────────
        // If you have a loanCollections / loanPayments relation that tracks
        // which period numbers have been collected, eager-load it in
        // getReceivablesData() and use it here to mark real paid/overdue rows.
        //
        // Example (adjust relation & column names to your schema):
        //   $paidPeriods = $loan->loanCollections->pluck('period_number')->flip();
        //
        // Then inside the loop replace the status block with:
        //   if ($paidPeriods->has($i))       $status = 'paid';
        //   elseif ($dueDate->lt($today))     $status = 'overdue';
        //   else                              $status = 'unpaid';
        // ─────────────────────────────────────────────────────────────────────

        for ($i = 1; $i <= $termMonths; $i++) {
            $interest  = round($balance * $monthlyRate, 10);
            $principal = $installment - $interest;
            $isFinal   = ($i === $termMonths);

            if ($isFinal) {
                $principal = $balance;
                $balance   = 0.0;
            } else {
                $balance = max(0.0, $balance - $principal);
            }

            $dueDate = $baseDate->copy()->addMonths($i + $advanceMonths);
            $status = $dueDate->lt($today) ? 'overdue' : 'unpaid';

            $schedule[] = [
                'period'      => $i,
                'dueDate'     => $dueDate->format('F Y'),
                'installment' => round($installment, 2),
                'principal'   => round($principal, 2),
                'interest'    => round($interest, 2),
                'balance'     => round($balance, 2),
                'status'      => $status,
            ];
        }

        return $schedule;
    }
}