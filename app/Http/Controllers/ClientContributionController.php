<?php

namespace App\Http\Controllers;

use App\Models\CapitalContribution;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

class ClientContributionController extends Controller
{
    public function showShareCapital() {
        return Inertia::render('Client/ClientCapitalContribution');
    }

    public function shareCapitalData(Request $request) {
        $member = Auth::guard('member')->user();

        if (!$member) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $memberId = $member->id;

        // Raw inputs
        $dateFrom = (string) $request->string('dateFrom');
        $dateTo   = (string) $request->string('dateTo');
        // Clamp perPage for security
        $perPage = (int) $request->integer('perPage', 10);
        $page = (int) $request->integer('page', 1);

        // Base query – only this member & only posted/paid contributions
        $query = CapitalContribution::where('memberId', $memberId)
            ->whereIn('status', ['posted', 'Posted', 'POSTED'])
            ->orderBy('created_at', 'asc');

        // Date filters (using paidAt; falls back to created_at ordering)
        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        // Fetch all matching transactions (for correct running balance)
        $rows = $query->get([
            'id',
            'transactionType',
            'amount',
            'status',
            'reference_number',
            'paid_at',
            'created_at',
        ]);

        $runningBalance     = 0.0;
        $totalDeposits      = 0.0;
        $totalWithdrawals   = 0.0;
        $processedRows      = [];

        foreach ($rows as $row) {
            $isDeposit    = $row->transactionType === 'deposit';
            $isWithdrawal = $row->transactionType === 'withdrawal';

            $amountAbs = abs((float) $row->amount);

            $credit = $isDeposit ? $amountAbs : 0.0;
            $debit  = $isWithdrawal ? $amountAbs : 0.0;

            $runningBalance   += ($credit - $debit);
            $totalDeposits    += $credit;
            $totalWithdrawals += $debit;

            $processedRows[] = [
                'id' => $row->id,
                'date' => optional($row->created_at)->format('d M Y'),
                'datePosted' => optional($row->paid_at)->format('d M Y'),
                'referenceNumber' => $row->reference_number,
                'transactionType' => $row->transactionType,
                'credit' => $credit,
                'debit' => $debit,
                'runningBalance' => $runningBalance,
            ];
        }

        $processedRows = array_reverse($processedRows);

        // Manual pagination on processed rows
        $total = count($processedRows);
        $offset = ($page - 1) * $perPage;

        $paginatedRows = array_slice($processedRows, $offset, $perPage);

        $paginated = new LengthAwarePaginator(
            $paginatedRows,
            $total,
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query()
            ]
        );

        $summary = [
            'totalDeposits' => $totalDeposits,
            'totalWithdrawals' => $totalWithdrawals,
            'currentBalance' => $runningBalance,
            'transactionCount' => $total
        ];

        $filters = [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'perPage' => $perPage
        ];

        return Inertia::render('Client/ClientCapitalContribution',[
            'filters' => $filters,
            'shareCapitalSummary' => $summary,
            'shareCapitalRows' => $paginated
        ]);     
    }
}
