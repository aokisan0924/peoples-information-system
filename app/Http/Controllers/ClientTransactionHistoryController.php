<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CapitalContribution;
use App\Models\SavingsDeposit;
use App\Models\TimeDeposit;
use App\Models\Loan;
use App\Models\MembershipPayment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ClientTransactionHistoryController extends Controller
{
    public function index() {
        return Inertia::render('Client/ClientTransactions');
    }

    public function getTransactionHistory(Request $request)
    {
        $member = Auth::guard('member')->user();

        if (!$member) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $memberId = $member->id;

        $dateFrom = (string) $request->string('dateFrom');
        $dateTo   = (string) $request->string('dateTo');
        $category = (string) $request->string('category', 'all');
        $status   = (string) $request->string('status', 'all');
        $perPage  = (int) $request->integer('perPage', 10);
        $page     = max(1, (int) $request->integer('page', 1));
        $preview  = $request->boolean('preview', false);

        $dateFrom = $dateFrom !== '' ? $dateFrom : null;
        $dateTo   = $dateTo   !== '' ? $dateTo   : null;
        $category = $category !== '' ? $category : 'all';
        $status   = $status   !== '' ? $status   : 'all';

        // 1) SHARE CAPITAL
        $shareCapitalTx = CapitalContribution::where('memberId', $memberId)
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->get()
            ->map(function (CapitalContribution $row) {
                $transactionType = $row->transactionType ?? null;
                $isWithdrawal    = $transactionType === 'withdrawal' || (float) $row->amount < 0;
                $amount          = (float) abs($row->amount);
                $rawStatus       = $row->status ?? ($row->is_paid || $row->is_Paid ? 'posted' : 'pending');
                $status          = strtolower((string) $rawStatus);
                $referenceNumber = $row->reference_number ?? $row->referenceNumber ?? null;
                $date            = $row->paid_at ?? $row->created_at;

                return [
                    'id'              => 'shareCapital-' . $row->id,
                    'sourceModel'     => 'CapitalContribution',
                    'sourceId'        => $row->id,          // ← used by cancel fix
                    'date'            => optional($date)->toDateTimeString(),
                    'category'        => 'shareCapital',
                    'type'            => $isWithdrawal ? 'Share Capital Withdrawal' : 'Share Capital Deposit',
                    'description'     => $isWithdrawal ? 'Share capital withdrawal' : 'Share capital contribution',
                    'amount'          => $amount,
                    'direction'       => $isWithdrawal ? 'debit' : 'credit',
                    'status'          => $status,
                    'referenceNumber' => $referenceNumber,
                ];
            });

        // 2) SAVINGS
        $savingsTx = SavingsDeposit::where('memberId', $memberId)
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->get()
            ->map(function (SavingsDeposit $row) {
                $transactionType = $row->transactionType ?? null;
                $isWithdrawal    = $transactionType === 'withdrawal';
                $amount          = (float) abs($row->amount);
                $rawStatus       = $row->status ?? 'posted';
                $status          = strtolower((string) $rawStatus);
                $referenceNumber = $row->referenceNumber ?? $row->reference_number ?? null;
                $date            = $row->paidAt ?? $row->paid_at ?? $row->created_at;

                return [
                    'id'              => 'savings-' . $row->id,
                    'sourceModel'     => 'SavingsDeposit',
                    'sourceId'        => $row->id,
                    'date'            => optional($date)->toDateTimeString(),
                    'category'        => 'savings',
                    'type'            => $isWithdrawal ? 'Savings Withdrawal' : 'Savings Deposit',
                    'description'     => $isWithdrawal ? 'Savings withdrawal' : 'Savings deposit',
                    'amount'          => $amount,
                    'direction'       => $isWithdrawal ? 'debit' : 'credit',
                    'status'          => $status,
                    'referenceNumber' => $referenceNumber,
                ];
            });

        // 3) TIME DEPOSIT
        $timeDepositTx = TimeDeposit::where('memberId', $memberId)
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->get()
            ->map(function (TimeDeposit $row) {
                $term            = $row->termYears ?? null;
                $rawStatus       = $row->status ?? 'active';
                $status          = strtolower((string) $rawStatus);
                $referenceNumber = $row->referenceNumber ?? $row->reference_number ?? null;

                return [
                    'id'              => 'timeDeposit-' . $row->id,
                    'sourceModel'     => 'TimeDeposit',
                    'sourceId'        => $row->id,
                    'date'            => optional($row->created_at)->toDateTimeString(),
                    'category'        => 'timeDeposit',
                    'type'            => 'Time Deposit Placement',
                    'description'     => $term ? "Time deposit placement - {$term} year(s)" : 'Time deposit placement',
                    'amount'          => (float) $row->amount,
                    'direction'       => 'credit',
                    'status'          => $status,
                    'referenceNumber' => $referenceNumber,
                ];
            });

        // 4) LOANS
        $loanTx = Loan::where('memberId', $memberId)
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->get()
            ->map(function (Loan $row) {
                $rawStatus       = $row->status ?? 'pending';
                $status          = strtolower((string) $rawStatus);
                $referenceNumber = $row->loanReference ?? $row->referenceNumber ?? null;
                $amount          = (float) ($row->loanAmount ?? $row->approvedAmount ?? 0);

                $description = match ($status) {
                    'approved' => 'Loan approved',
                    'released' => 'Loan released',
                    'declined' => 'Loan application declined',
                    default    => 'Loan application',
                };

                return [
                    'id'              => 'loan-' . $row->id,
                    'sourceModel'     => 'Loan',
                    'sourceId'        => $row->id,
                    'date'            => optional($row->created_at)->toDateTimeString(),
                    'category'        => 'loan',
                    'type'            => 'Loan Application',
                    'description'     => $description,
                    'amount'          => $amount,
                    'direction'       => 'credit',
                    'status'          => $status,
                    'referenceNumber' => $referenceNumber,
                ];
            });

        // 5) MEMBERSHIP
        $membershipTx = MembershipPayment::where('memberId', $memberId)
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->get()
            ->map(function (MembershipPayment $row) {
                $amount = (float) ($row->amount ?? (
                    ($row->membershipFee ?? 0)
                    + ($row->initialCapital ?? 0)
                    + ($row->convenienceFee ?? 0)
                ));
                $rawStatus       = $row->status ?? ($row->is_paid ? 'Paid' : 'Pending');
                $status          = strtolower((string) $rawStatus);
                $referenceNumber = $row->reference_number ?? $row->paymentReference ?? $row->paymentReferenceNumber ?? null;

                return [
                    'id'              => 'membership-' . $row->id,
                    'sourceModel'     => 'MembershipPayment',
                    'sourceId'        => $row->id,
                    'date'            => optional($row->created_at)->toDateTimeString(),
                    'category'        => 'membership',
                    'type'            => 'Membership Payment',
                    'description'     => 'Membership fee and initial capital contribution',
                    'amount'          => $amount,
                    'direction'       => 'credit',
                    'status'          => $status,
                    'referenceNumber' => $referenceNumber,
                ];
            });

        // MERGE & FILTER
        $transactions = collect()
            ->merge($shareCapitalTx)
            ->merge($savingsTx)
            ->merge($timeDepositTx)
            ->merge($loanTx)
            ->merge($membershipTx);

        if ($category !== 'all') {
            $transactions = $transactions->filter(fn ($tx) => $tx['category'] === $category);
        }

        if ($status !== 'all') {
            $targetStatus = strtolower($status);
            $transactions = $transactions->filter(
                fn ($tx) => strtolower((string) $tx['status']) === $targetStatus
            );
        }

        $transactions = $transactions->sortByDesc('date')->values();

        // PREVIEW MODE
        if ($preview) {
            $previewItems = $transactions->take(5)->map(function (array $tx) {
                $dateTime = $tx['date'] ? Carbon::parse($tx['date']) : null;
                return [
                    'date'            => optional($dateTime)->format('Y-m-d'),
                    'time'            => optional($dateTime)->format('H:i'),
                    'type'            => $tx['type'] ?? null,
                    'particulars'     => $tx['description'] ?? null,
                    'amount'          => (float) ($tx['amount'] ?? 0),
                    'status'          => $tx['status'] ?? null,
                    'referenceNumber' => $tx['referenceNumber'] ?? null,
                ];
            })->values();

            return response()->json($previewItems);
        }

        // PAGINATE
        $total    = $transactions->count();
        $offset   = ($page - 1) * $perPage;
        $items    = $transactions->slice($offset, $perPage)->values();
        $lastPage = $perPage > 0 ? (int) ceil($total / $perPage) : 1;

        $paginator = new LengthAwarePaginator($items, $total, $perPage, $page, [
            'path'  => $request->url(),
            'query' => $request->query(),
        ]);

        return response()->json([
            'data'    => $paginator->items(),
            'meta'    => [
                'currentPage' => $paginator->currentPage(),
                'perPage'     => $paginator->perPage(),
                'lastPage'    => $paginator->lastPage(),
                'total'       => $paginator->total(),
            ],
            'filters' => [
                'dateFrom' => $dateFrom,
                'dateTo'   => $dateTo,
                'category' => $category,
                'status'   => $status,
                'perPage'  => $perPage,
            ],
        ]);
    }

    /**
     * FIX: Cancel now uses sourceId (the real PK) instead of referenceNumber.
     * referenceNumber can be null for some records, causing silent WHERE = null matches.
     * sourceId is always present and unambiguous.
     */
    public function cancelTransaction(Request $request)
    {
        try {
            $member = Auth::guard('member')->user();

            if (!$member) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $sourceId = (int) $request->input('sourceId');
            $category = (string) $request->input('category');

            if (!$sourceId || !$category) {
                return response()->json(['error' => 'Invalid cancel request: sourceId and category are required.'], 422);
            }

            $updated = 0;

            if ($category === 'shareCapital') {
                $updated = CapitalContribution::where('id', $sourceId)
                    ->where('memberId', $member->id)
                    ->whereIn('status', ['Pending', 'pending'])
                    ->update(['status' => 'Cancelled']);

            } elseif ($category === 'savings') {
                $updated = SavingsDeposit::where('id', $sourceId)
                    ->where('memberId', $member->id)
                    ->whereIn('status', ['Pending', 'pending'])
                    ->update(['status' => 'Cancelled']);

            } elseif ($category === 'loan') {
                $updated = Loan::where('id', $sourceId)
                    ->where('memberId', $member->id)
                    ->whereIn('status', ['Pending', 'pending'])
                    ->update(['status' => 'Declined']);

            } else {
                return response()->json(['error' => 'This transaction type cannot be cancelled.'], 400);
            }

            if ($updated === 0) {
                return response()->json([
                    'error' => 'Transaction could not be cancelled. It may have already been processed or does not belong to your account.'
                ], 422);
            }

            return response()->json(['success' => true, 'message' => 'Transaction cancelled successfully.']);

        } catch (\Exception $e) {
            Log::error("Cancel Transaction Error: " . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred. Please try again.'], 500);
        }
    }
}