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

        // We now select the specific LOANS, not just the member groupings.
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
            ->where('loans.status', 'Released')
            ->where(function($q) use ($search) {
                $q->where('members.firstName', 'LIKE', "%{$search}%")
                    ->orWhere('members.lastName', 'LIKE', "%{$search}%")
                    ->orWhere('members.id', 'LIKE', "%{$search}%")
                    ->orWhere('loans.loanReference', 'LIKE', "%{$search}%"); // Search by Reference Number
            })
            ->take(10)
            ->get();

        return response()->json($results);
    }

    public function getMemberLoanDetails(Request $request, $memberId) {
        // 1. Fetch all active loans for the member
        $loans = DB::table('loans')
            ->where('memberId', $memberId)
            ->where('status', 'Released')
            ->get();

        // 2. Check if the frontend specifically requested a certain loanId
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
}
