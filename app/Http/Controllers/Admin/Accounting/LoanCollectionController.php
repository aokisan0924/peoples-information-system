<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LoanCollectionController extends Controller
{
    public function index() {
        return Inertia::render('Admin/Accounting/LoanCollection');
    }

    public function searchMembers(Request $request) {
        $search = $request->input('search');

        // We select the specific LOANS, not just the member groupings.
        $results = DB::table('loans')
            ->join('members', 'loans.memberId', '=', 'members.id')
            ->select(
                'loans.id as loanId', 
                'loans.loanReference', 
                'loans.loanAmount', 
                'loans.loanType',
                'members.id as memberId', 
                'members.firstName', 
                'members.lastName'
            )
            ->whereRaw('LOWER(loans.status) = ?', ['released'])
            ->where(function($q) use ($search) {
                $q->where('members.firstName', 'LIKE', "%{$search}%")
                    ->orWhere('members.lastName', 'LIKE', "%{$search}%")
                    ->orWhere('members.id', 'LIKE', "%{$search}%")
                    ->orWhere('loans.loanReference', 'LIKE', "%{$search}%");
            })
            ->take(15)
            ->get();

        return response()->json($results);
    }

    public function getMemberLoanDetails(Request $request, $memberId) {
        // 1. Fetch all active loans for the member
        $loans = DB::table('loans')
            ->where('memberId', $memberId)
            ->whereRaw('LOWER(status) = ?', ['released'])
            ->get();

        // 2. Check if the frontend specifically requested a certain loanId via dropdown
        $loanId = $request->query('loanId');
        $activeLoan = null;

        if ($loanId) {
            $activeLoan = $loans->firstWhere('id', $loanId);
        }
        
        // Default to the first one if none requested
        if (!$activeLoan) {
            $activeLoan = $loans->first();
        }

        $schedule = [];

        // 3. Fetch the schedule for the targeted active loan
        if ($activeLoan) {
            $schedule = DB::table('loan_amortization_schedules')
                ->where('loanId', $activeLoan->id)
                ->orderBy('installmentNumber', 'asc')
                ->get();
        }

        return response()->json([
            'loans' => $loans,
            'activeLoan' => $activeLoan,
            'schedule' => $schedule
        ]);
    }

    public function postAmortization(Request $request) {
        $request->validate([
            'loanId' => ['required', 'exists:loans,id'],
            'installmentNumber' => ['required', 'integer'],
            'amountPaid' => ['required', 'numeric', 'min:0.01'],
            'referenceNumber' => ['nullable', 'string', 'max:255'],
        ]);

        $loanId = $request->input('loanId');
        $instNo = $request->input('installmentNumber');
        $amountPaid = (float)$request->input('amountPaid');
        $refNo = $request->input('referenceNumber');
        $postingDate = Carbon::now();

        DB::beginTransaction();
        try {
            $affected = DB::table('loan_amortization_schedules')
                ->where('loanId', $loanId)
                ->where('installmentNumber', $instNo)
                ->update([
                    'status' => 'paid',
                    'amountPaid' => $amountPaid,
                    'paidAt' => $postingDate,
                    'referenceNumber' => $refNo,
                    'updatedAt' => Carbon::now(),
                ]);
            
            if (!$affected) {
                throw new \Exception("Installment row {$instNo} not found for this loan.");
            }
            
            $unpaidCount = DB::table('loan_amortization_schedules')
                ->where('loanId', $loanId)
                ->where('status', '!=', 'paid')
                ->count();

            if ($unpaidCount === 0) {
                DB::table('loans')
                    ->where('id', $loanId)
                    ->update([
                        'status' => 'paid',
                        'updated_at' => Carbon::now(),
                    ]);
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => "Installment {$instNo} successfully marked as paid!"]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to update schedule: ' . $e->getMessage()], 500);
        }
    }

    public function postBulkAmortization(Request $request) {
        $request->validate([
            'payments' => ['required','array','min:1'],
            'payments.*.loanId' => ['required','exists:loans,id'],
            'payments.*.installmentNumber' => ['required','integer'],
            'payments.*.amountPaid' => ['required','numeric','min:0.01'],
            'payments.*.referenceNumber' => ['nullable','string'],
        ]);

        DB::beginTransaction();
        try {
            $postingDate = Carbon::now();
            $processedLoans = [];

            // 1. Process every payment in the array
            foreach ($request->input('payments') as $payment) {
                $affected = DB::table('loan_amortization_schedules')
                    ->where('loanId', $payment['loanId'])
                    ->where('installmentNumber', $payment['installmentNumber'])
                    ->update([
                        'status' => 'paid',
                        'amountPaid' => $payment['amountPaid'],
                        'paidAt' => $postingDate,
                        'referenceNumber' => $payment['referenceNumber'] ?? null,
                        'updatedAt' => Carbon::now()
                    ]);

                if (!$affected) {
                    throw new \Exception("Installment {$payment['installmentNumber']} for Loan ID {$payment['loanId']} not found or already paid.");
                }

                $processedLoans[] = $payment['loanId'];
            }

            // 2. Check if any of these loans are now fully completed
            $processedLoans = array_unique($processedLoans);
            foreach ($processedLoans as $loanId) {
                $unpaidCount = DB::table('loan_amortization_schedules')
                    ->where('loanId', $loanId)
                    ->where('status', '!=', 'paid')
                    ->count();
                    
                if ($unpaidCount === 0) {
                    DB::table('loans')->where('id', $loanId)->update([
                        'status' => 'Completed', 
                        'updated_at' => Carbon::now()
                    ]);
                }
            }

            DB::commit();
            return response()->json([
                'success' => true, 
                'message' => count($request->input('payments')) . " remittances successfully posted to the ledger!"
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false, 
                'message' => 'Bulk posting failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
