<?php

namespace App\Http\Controllers;

use App\Models\SavingsDeposit;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SavingsDepositController extends Controller
{
    private float $interestRateYear = 0.0609;
    private int $periodsPerYear = 2;

    public function showSavingsDeposit(Request $request): Response {
        $amount = (float) $request->input('amount', 10000);

        if ($amount < 0) {
            $amount = 0;
        }

        $projections = $this->buildProjections($amount);

        return Inertia::render('SavingsDeposit', [
            'initialAmount' => number_format($amount, 2, '.', ','),
            'interestrateYear' => $this->interestRateYear,
            'periodsPerYear' => $this->periodsPerYear,
            'projections' => $projections
        ]);
    }

    public function calculateSavings(Request $request): JsonResponse {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0', 'max:100000000'],
        ]);

        $amount = (float) $validated['amount'];

        $projections = $this->buildProjections($amount);

        return response()->json([
            'amount'      => number_format($amount, 2, '.', ''),
            'projections' => $projections,
        ]);
    }

    private function buildProjections(float $amount): array {
        $periodRate = $this->interestRateYear / $this->periodsPerYear;

        $targets = [
            [
                'key'          => 'sixMonths',
                'title'        => 'After 6 months',
                'subtitle'     => '1 compounding period',
                'years'        => 0.5,
                'highlight'    => false,
            ],
            [
                'key'          => 'oneYear',
                'title'        => 'After 1 year',
                'subtitle'     => '2 compounding periods',
                'years'        => 1,
                'highlight'    => false,
            ],
            [
                'key'          => 'threeYears',
                'title'        => 'After 3 years',
                'subtitle'     => '6 compounding periods',
                'years'        => 3,
                'highlight'    => false,
            ],
            [
                'key'          => 'fiveYears',
                'title'        => 'After 5 years',
                'subtitle'     => '10 compounding periods',
                'years'        => 5,
                'highlight'    => true,
            ],
        ];

        $results = [];

        foreach ($targets as $target) {
            $periods = (int) round($target['years'] * $this->periodsPerYear);
            $balance = $amount * pow(1 + $periodRate, $periods);
            $interest = $balance - $amount;

            $results[] = [
                'key'          => $target['key'],
                'title'        => $target['title'],
                'subtitle'     => $target['subtitle'],
                'highlight'    => $target['highlight'],
                'balanceLabel' => 'Projected balance',
                'interestLabel'=> 'Total interest earned',
                'balance'      => $this->formatCurrency($balance),
                'interest'     => $this->formatCurrency($interest),
            ];
        }

        return $results;
    }

    public function memberIndex(Request $request){
        $member = Auth::guard('member')->user();
        if (!$member) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $memberId = $member->id;
    
        // FILTERS
        $search     = trim((string) $request->string('search'));
        $dateFrom   = (string) $request->string('dateFrom');
        $dateTo     = (string) $request->string('dateTo');
        $perPage    = (int) $request->integer('perPage', 10);
        $page       = (int) $request->integer('page', 1);
    
        // Normalize
        $dateFrom = $dateFrom !== '' ? $dateFrom : null;
        $dateTo   = $dateTo   !== '' ? $dateTo   : null;
        $search   = $search   !== '' ? $search   : null;
    
        // 1) Base query
        $query = SavingsDeposit::where('memberId', $memberId)
            ->whereIn('status', ['posted', 'Posted', 'POSTED'])
            ->orderBy('created_at', 'asc');    // IMPORTANT for running balance
    
        // Apply date filters
        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
    
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }
    
        // Optional search by reference number
        if ($search) {
            $query->where('referenceNumber', 'LIKE', "%{$search}%");
        }
    
        // Fetch all rows first (unpaginated so we can compute running balance)
        $rows = $query->get([
            'id',
            'transactionType',
            'amount',
            'referenceNumber',
            'created_at',
            'paidAt',
        ]);
    
        // 2) Compute balances
        $runningBalance      = 0.0;
        $totalDeposits       = 0.0;
        $totalWithdrawals    = 0.0;
        $processedRows       = [];
    
        foreach ($rows as $row) {
    
            $isDeposit    = $row->transactionType === 'deposit';
            $isWithdrawal = $row->transactionType === 'withdrawal';
    
            $amountAbs = abs((float) $row->amount);
    
            $credit = $isDeposit ? $amountAbs : 0;
            $debit  = $isWithdrawal ? $amountAbs : 0;
    
            $runningBalance += ($credit - $debit);
            $totalDeposits  += $credit;
            $totalWithdrawals += $debit;
    
            $processedRows[] = [
                'id' => $row->id,
                'date' => optional($row->created_at)->format('d M Y'),
                'paidAt' => optional($row->paidAt)->format('d M Y'),
                'referenceNumber' => $row->referenceNumber,
                'transactionType' => $row->transactionType,
                'credit' => $credit,
                'debit' => $debit,
                'runningBalance' => $runningBalance,
            ];
        }
    
        // 3) Latest on top
        $processedRows = array_reverse($processedRows);
    
        // 4) Paginate
        $total = count($processedRows);
        $offset = ($page - 1) * $perPage;
    
        $paginatedRows = array_slice($processedRows, $offset, $perPage);
    
        $paginated = new LengthAwarePaginator(
            $paginatedRows,
            $total,
            $perPage,
            $page,
            [
                'path'  => $request->url(),
                'query' => $request->query(),
            ]
        );
    
        // 5) Summary
        $summary = [
            'totalDeposits'    => $totalDeposits,
            'totalWithdrawals' => $totalWithdrawals,
            'currentBalance'   => $runningBalance,
            'transactionCount' => $total,
        ];
    
        // 6) RETURN FILTERS (same structure as ShareCapital)
        $filters = [
            'search'   => $search,
            'dateFrom' => $dateFrom,
            'dateTo'   => $dateTo,
            'perPage'  => $perPage,
        ];
    
        return Inertia::render('Client/SavingsDeposit', [
            'filters'        => $filters,
            'savingsSummary' => $summary,
            'savingsRows'    => $paginated,
        ]);
    }

    public function createWithdrawalRequest(Request $request) {
        $member = Auth::guard('member')->user();

        if (!$member) {
            return response()->json([
                'error' => true,
                'message' => 'Unauthorized.',
            ], 401);
        }
    
        $request->validate([
            'amount'         => ['required', 'numeric', 'min:1'],
            'payoutMethod' => ['required', 'in:bank,gcash,maya,cash'],
            'accountName'     => ['nullable', 'string'],
            'accountNumber'   => ['nullable', 'string'],
            'remarks'         => ['nullable', 'string'],
            'bankName'        => ['nullable', 'string'], // only for bank
        ]);
    
        // If BANK → bankName & accountNumber are required
        if ($request->payoutMethod === 'bank') {
            if (!$request->bankName) {
                return response()->json([
                    'error'   => true,
                    'message' => 'Please select a bank.',
                ], 422);
            }

            if (!$request->accountNumber) {
                return response()->json([
                    'error'   => true,
                    'message' => 'Bank account number is required.',
                ], 422);
            }
        }
    
        // If GCASH/MAYA → mobile number must be valid
        if (in_array($request->payoutMethod, ['gcash', 'maya'])) {
            if (!preg_match('/^09\d{9}$/', (string) $request->accountNumber)) {
                return response()->json([
                    'error'   => true,
                    'message' => 'Wallet mobile number must be valid (starts with 09...).',
                ], 422);
            }
        }
    
        // TRUE BALANCE
        $trueBalance = SavingsDeposit::where('memberId', $member->id)
            ->whereIn('status', ['Posted', 'posted', 'POSTED'])
            ->get()
            ->reduce(function ($balance, $row) {
                $credit = $row->transactionType === 'deposit' ? abs($row->amount) : 0;
                $debit  = $row->transactionType === 'withdrawal' ? abs($row->amount) : 0;
    
                return $balance + ($credit - $debit);
            }, 0);
    
        if ($request->amount > $trueBalance) {
            return response()->json([
                'error' => true,
                'message' => 'Insufficient savings balance.',
            ], 422);
        }
    
        // Generate unique reference
        $reference = $this->makeWithdrawalReference();

        // Normalize some fields for CASH vs non-CASH
        $payoutMethod = $request->payoutMethod;
        $bankName = $payoutMethod === 'bank' ? $request->bankName : null;
        $accountName = $payoutMethod === 'cash'
            ? ($request->accountName ?: trim($member->firstName . ' ' . $member->lastName))
            : $request->accountName;
        $accountNumber = $payoutMethod === 'cash' ? null : $request->accountNumber;
    
        // Create the withdrawal request
        $withdrawal = SavingsDeposit::create([
            'memberId'        => $member->id,
            'transactionType' => 'withdrawal',
            'amount'          => -abs($request->amount),
            'referenceNumber' => $reference,
            'status'          => 'Pending',
            'isPaid'          => false,
    
            'isWithdrawalRequest' => true,
            'requestReference'    => $reference,
            'withdrawalRemarks'   => $request->remarks,
    
            // NEW FIELDS
            'payoutMethod'  => $payoutMethod,
            'payoutChannel' => $payoutMethod === 'bank'
                                ? $bankName
                                : strtoupper($payoutMethod),
    
            'withdrawalBankName'      => $bankName,
            'withdrawalAccountName'   => $accountName,
            'withdrawalAccountNumber' => $accountNumber,
        ]);
    
        return response()->json([
            'error'        => false,
            'message'      => 'Withdrawal request submitted.',
            'withdrawalId' => $withdrawal->id,
        ], 200);
    }

    public function printWithdrawal($memberId) {
        $withdrawal = SavingsDeposit::findOrFail($memberId);

        return Inertia::render('Client/PrintableSavingsWithdrawal', [
            'withdrawal' => [
                'id' => $withdrawal->id,
                'amount' => abs($withdrawal->amount),
                'bankName' => $withdrawal->withdrawalBankName,
                'accountName' => $withdrawal->withdrawalAccountName,
                'accountNumber' => $withdrawal->withdrawalAccountNumber,
                'remarks' => $withdrawal->withdrawalRemarks,
                'requestedAt' => $withdrawal->created_at->format('F d, Y'),
                'member' => [
                    'fullName' => trim($withdrawal->member->firstName.' '.$withdrawal->member->lastName),
                    'username' => $withdrawal->member->username,
                    'contact' => $withdrawal->member->contact,
                ],
            ]
        ]);
    }

    private function formatCurrency(float $value): string {
        return '₱ ' . number_format($value, 2, '.', ',');
    }

    private function makeWithdrawalReference(): string {
        $prefix = 'WD-' . now()->format('Ymd') . '-';

        do {
            $ref = $prefix . str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (
            SavingsDeposit::where('referenceNumber', $ref)->exists()
        );

        return $ref;
    }
}
