<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Services\LoanAccountingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LoanCollectionController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Accounting/LoanCollection');
    }

    public function searchMembers(Request $request)
    {
        $search = trim((string) $request->input('search', ''));

        return response()->json(DB::table('loans')
            ->join('members', 'loans.memberId', '=', 'members.id')
            ->select('loans.id as loanId', 'loans.loanReference', 'loans.loanAmount', 'loans.loanType',
                'members.id as memberId', 'members.firstName', 'members.lastName')
            ->whereRaw('LOWER(loans.status) = ?', ['released'])
            ->where(function ($query) use ($search) {
                $query->where('members.firstName', 'like', "%{$search}%")
                    ->orWhere('members.lastName', 'like', "%{$search}%")
                    ->orWhere('members.id', 'like', "%{$search}%")
                    ->orWhere('loans.loanReference', 'like', "%{$search}%");
            })->limit(15)->get());
    }

    public function getMemberLoanDetails(Request $request, $memberId)
    {
        $loans = Loan::query()->where('memberId', $memberId)
            ->whereRaw('LOWER(status) = ?', ['released'])->get();
        $activeLoan = $request->integer('loanId')
            ? $loans->firstWhere('id', $request->integer('loanId'))
            : $loans->first();
        $schedule = $activeLoan
            ? DB::table('loan_amortization_schedules')->where('loanId', $activeLoan->id)->orderBy('installmentNumber')->get()
            : collect();

        return response()->json([
            'loans' => $loans,
            'activeLoan' => $activeLoan,
            'schedule' => $schedule,
            'legacyWarning' => $activeLoan && blank($activeLoan->calculation_version)
                ? 'Legacy loan: reconcile its contractual rate and opening balance before collecting.' : null,
        ]);
    }

    public function postAmortization(Request $request, LoanAccountingService $accounting)
    {
        $data = $request->validate([
            'loanId' => ['required', 'exists:loans,id'],
            'installmentNumber' => ['required', 'integer', 'min:1'],
            'amountPaid' => ['required', 'numeric', 'min:0.01'],
            'referenceNumber' => ['nullable', 'string', 'max:255'],
            'paymentDate' => ['nullable', 'date'],
        ]);
        $payment = $this->recordPayment($data, $accounting);

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded and sent to accounting review.',
            'payment' => $payment,
        ]);
    }

    public function postBulkAmortization(Request $request, LoanAccountingService $accounting)
    {
        $data = $request->validate([
            'payments' => ['required', 'array', 'min:1'],
            'payments.*.loanId' => ['required', 'exists:loans,id'],
            'payments.*.installmentNumber' => ['required', 'integer', 'min:1'],
            'payments.*.amountPaid' => ['required', 'numeric', 'min:0.01'],
            'payments.*.referenceNumber' => ['nullable', 'string', 'max:255'],
            'payments.*.paymentDate' => ['nullable', 'date'],
        ]);
        foreach ($data['payments'] as $item) {
            $this->recordPayment($item, $accounting);
        }

        return response()->json([
            'success' => true,
            'message' => count($data['payments']).' payments recorded and sent to accounting review.',
        ]);
    }

    private function recordPayment(array $data, LoanAccountingService $accounting): LoanPayment
    {
        return DB::transaction(function () use ($data, $accounting) {
            $loan = Loan::with('member')->lockForUpdate()->findOrFail($data['loanId']);
            if (strtolower((string) $loan->status) !== 'released') {
                throw ValidationException::withMessages(['loanId' => 'Only released loans can accept payments.']);
            }
            if (blank($loan->member?->branch)) {
                throw ValidationException::withMessages(['loanId' => 'Set the member office branch before collecting.']);
            }
            if (blank($loan->calculation_version)) {
                throw ValidationException::withMessages(['loanId' => 'This legacy loan must be reconciled before payments can be posted.']);
            }

            $rows = DB::table('loan_amortization_schedules')
                ->where('loanId', $loan->id)
                ->where('installmentNumber', '>=', $data['installmentNumber'])
                ->whereIn('status', ['unpaid', 'partial', 'overdue'])
                ->lockForUpdate()->orderBy('installmentNumber')->get();
            if ($rows->isEmpty()) {
                throw ValidationException::withMessages(['installmentNumber' => 'No outstanding schedule exists from this period.']);
            }

            $remaining = round((float) $data['amountPaid'], 2);
            $principalTotal = 0.0;
            $interestTotal = 0.0;
            $allocations = [];
            foreach ($rows as $row) {
                if ($remaining <= 0) break;
                $interestOutstanding = max(0, (float) $row->interestDue - (float) ($row->interestPaid ?? 0));
                $principalOutstanding = max(0, (float) $row->principalDue - (float) ($row->principalPaid ?? 0));
                $interestPaid = min($remaining, $interestOutstanding);
                $remaining = round($remaining - $interestPaid, 2);
                $principalPaid = min($remaining, $principalOutstanding);
                $remaining = round($remaining - $principalPaid, 2);
                $newInterestPaid = round((float) ($row->interestPaid ?? 0) + $interestPaid, 2);
                $newPrincipalPaid = round((float) ($row->principalPaid ?? 0) + $principalPaid, 2);
                $newAmountPaid = round($newInterestPaid + $newPrincipalPaid, 2);
                $isPaid = $newAmountPaid + 0.005 >= (float) $row->amountDue;

                DB::table('loan_amortization_schedules')->where('id', $row->id)->update([
                    'interestPaid' => $newInterestPaid,
                    'principalPaid' => $newPrincipalPaid,
                    'amountPaid' => $newAmountPaid,
                    'status' => $isPaid ? 'paid' : 'partial',
                    'paidAt' => $isPaid ? ($data['paymentDate'] ?? now()->toDateString()) : null,
                    'referenceNumber' => $data['referenceNumber'] ?? null,
                    'updatedAt' => now(),
                ]);
                $principalTotal += $principalPaid;
                $interestTotal += $interestPaid;
                $allocations[] = ['installmentNumber' => $row->installmentNumber,
                    'principal' => round($principalPaid, 2), 'interest' => round($interestPaid, 2)];
            }
            if ($remaining > 0.005) {
                throw ValidationException::withMessages(['amountPaid' => 'Payment exceeds the remaining scheduled balance.']);
            }

            $payment = LoanPayment::create([
                'loan_id' => $loan->id,
                'batch_reference' => 'LPAY-'.$loan->id.'-'.strtoupper(Str::random(10)),
                'reference_number' => $data['referenceNumber'] ?? null,
                'payment_date' => Carbon::parse($data['paymentDate'] ?? now()),
                'amount' => round((float) $data['amountPaid'], 2),
                'principal_amount' => round($principalTotal, 2),
                'interest_amount' => round($interestTotal, 2),
                'allocation_snapshot' => $allocations,
                'received_by' => Auth::guard('admin')->id(),
            ]);
            $accounting->enqueuePayment($loan, $payment);

            if (!DB::table('loan_amortization_schedules')->where('loanId', $loan->id)->where('status', '!=', 'paid')->exists()) {
                $loan->update(['status' => 'Completed']);
            }
            return $payment;
        });
    }
}
