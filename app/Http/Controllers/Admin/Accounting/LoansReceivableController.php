<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoansReceivableController extends Controller
{
    public function index() {
        return Inertia::render('Admin/Accounting/LoansReceivable');
    }

    public function getReceivablesData() {
        $receivables = Loan::with(['member'])
            ->where('billing_status', 'Billed') 
            ->select('id', 'memberId', 'loanReference', 'loanAmount', 'gross', 'netProceeds', 'billed_at')
            ->orderBy('billed_at', 'desc')
            ->get()
            ->map(function ($loan) {
                return [
                    'id' => $loan->id,
                    'loanReference' => $loan->loanReference,
                    'memberName' => "{$loan->member->lastName}, {$loan->member->firstName}",
                    'gross' => (float) $loan->gross,
                    // SAFELY PARSE THE DATE HERE:
                    'billedAt' => $loan->billed_at ? Carbon::parse($loan->billed_at)->format('Y-m-d H:i') : null,
                ];
            });

        return response()->json($receivables);
    }
}
