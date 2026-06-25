<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use App\Models\SavingsDeposit;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class SavingsDepositController extends Controller
{
    private float $interestRateYear = 0.0609;
    private int $periodsPerYear = 2;

    // ─────────────────────────────────────────────
    //  Calculator (public / unauthenticated)
    // ─────────────────────────────────────────────

    public function showSavingsDeposit(Request $request): Response {
        $amount = (float) $request->input('amount', 10000);
        if ($amount < 0) $amount = 0;

        return Inertia::render('SavingsDeposit', [
            'initialAmount'    => number_format($amount, 2, '.', ','),
            'interestrateYear' => $this->interestRateYear,
            'periodsPerYear'   => $this->periodsPerYear,
            'projections'      => $this->buildProjections($amount),
        ]);
    }

    public function calculateSavings(Request $request): JsonResponse {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0', 'max:100000000'],
        ]);

        $amount = (float) $validated['amount'];

        return response()->json([
            'amount'      => number_format($amount, 2, '.', ''),
            'projections' => $this->buildProjections($amount),
        ]);
    }

    // ─────────────────────────────────────────────
    //  Member: transaction history
    // ─────────────────────────────────────────────

    public function memberIndex(Request $request): Response {
        $member = Auth::guard('member')->user();
        if (!$member) abort(401);

        $memberId = $member->id;

        $search   = trim((string) $request->string('search')) ?: null;
        $dateFrom = (string) $request->string('dateFrom') ?: null;
        $dateTo   = (string) $request->string('dateTo')   ?: null;
        $perPage  = (int) $request->integer('perPage', 10);
        $page     = (int) $request->integer('page', 1);

        $query = SavingsDeposit::where('memberId', $memberId)
            ->whereIn('status', ['posted', 'Posted', 'POSTED', 'Released', 'released', 'RELEASED'])
            ->orderBy('created_at', 'asc');

        if ($dateFrom) $query->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo)   $query->whereDate('created_at', '<=', $dateTo);
        if ($search)   $query->where('referenceNumber', 'LIKE', "%{$search}%");

        $rows = $query->get([
            'id', 'transactionType', 'amount', 'referenceNumber', 'status', 'created_at', 'paidAt',
        ]);

        $runningBalance   = 0.0;
        $totalDeposits    = 0.0;
        $totalWithdrawals = 0.0;
        $processedRows    = [];

        foreach ($rows as $row) {
            $isDeposit    = $row->transactionType === 'deposit';
            $isWithdrawal = $row->transactionType === 'withdrawal';
            $amountAbs    = abs((float) $row->amount);

            $credit = $isDeposit    ? $amountAbs : 0.0;
            $debit  = $isWithdrawal ? $amountAbs : 0.0;

            $runningBalance   += ($credit - $debit);
            $totalDeposits    += $credit;
            $totalWithdrawals += $debit;

            $processedRows[] = [
                'id'              => $row->id,
                'date'            => optional($row->created_at)->format('d M Y'),
                'paidAt'          => optional($row->paidAt)->format('d M Y'),
                'referenceNumber' => $row->referenceNumber,
                'transactionType' => $row->transactionType,
                'status'          => $row->status,
                'credit'          => $credit,
                'debit'           => $debit,
                'runningBalance'  => $runningBalance,
            ];
        }

        $processedRows = array_reverse($processedRows);
        $total         = count($processedRows);
        $offset        = ($page - 1) * $perPage;
        $paginatedRows = array_slice($processedRows, $offset, $perPage);

        $paginated = new LengthAwarePaginator(
            $paginatedRows, $total, $perPage, $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Client/SavingsDeposit', [
            'filters'        => compact('search', 'dateFrom', 'dateTo', 'perPage'),
            'savingsSummary' => [
                'totalDeposits'    => $totalDeposits,
                'totalWithdrawals' => $totalWithdrawals,
                'currentBalance'   => $runningBalance,
                'transactionCount' => $total,
            ],
            'savingsRows'    => $paginated,
        ]);
    }

    // ─────────────────────────────────────────────
    //  OTP: send
    // ─────────────────────────────────────────────

    public function sendWithdrawalOtp(Request $request): JsonResponse {
        $member = Auth::guard('member')->user();
        if (!$member) {
            return response()->json(['error' => true, 'message' => 'Unauthorized.'], 401);
        }

        // Throttle: max 3 OTP sends per 10 minutes
        $throttleKey = "otp_throttle_member_{$member->id}";
        $attempts    = (int) Cache::get($throttleKey, 0);

        if ($attempts >= 3) {
            return response()->json([
                'error'   => true,
                'message' => 'Too many OTP requests. Please wait a few minutes before trying again.',
            ], 429);
        }

        // Validate amount early so we don't send an OTP for an invalid request
        $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
        ]);

        $trueBalance = $this->computeTrueBalance($member->id);

        if ((float) $request->amount > $trueBalance) {
            return response()->json([
                'error'   => true,
                'message' => 'Insufficient savings balance.',
            ], 422);
        }

        // Generate and cache OTP (6-digit, expires in 10 minutes)
        $otp     = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $cacheKey = "withdrawal_otp_member_{$member->id}";

        Cache::put($cacheKey, $otp, now()->addMinutes(10));
        Cache::put($throttleKey, $attempts + 1, now()->addMinutes(10));

        // Send OTP via Semaphore SMS
        $appName = config('app.name', 'PMPC');
        Http::post('https://api.semaphore.co/api/v4/otp', [
            'apikey'     => config('services.semaphore.api_key'),
            'number'     => $member->contact,
            'message'    => "Your {$appName} withdrawal OTP is {otp}. It expires in 10 minutes. Do not share this with anyone.",
            'code'       => $otp,
            'sendername' => config('services.semaphore.sender_name', 'SEMAPHORE'),
        ]);

        return response()->json([
            'error'       => false,
            'maskedPhone' => $this->maskPhone($member->contact),
            'message'     => "OTP sent to {$this->maskPhone($member->contact)}. It expires in 10 minutes.",
        ]);
    }

    // ─────────────────────────────────────────────
    //  OTP: verify
    // ─────────────────────────────────────────────

    public function verifyWithdrawalOtp(Request $request): JsonResponse {
        $member = Auth::guard('member')->user();
        if (!$member) {
            return response()->json(['error' => true, 'message' => 'Unauthorized.'], 401);
        }

        $request->validate([
            'otp' => ['required', 'string', 'size:6'],
        ]);

        $cacheKey   = "withdrawal_otp_member_{$member->id}";
        $failKey    = "otp_fail_member_{$member->id}";
        $storedOtp  = Cache::get($cacheKey);
        $failCount  = (int) Cache::get($failKey, 0);

        if ($failCount >= 5) {
            Cache::forget($cacheKey);
            return response()->json([
                'error'   => true,
                'message' => 'Too many incorrect attempts. Please request a new OTP.',
            ], 429);
        }

        if (!$storedOtp) {
            return response()->json([
                'error'   => true,
                'message' => 'OTP has expired. Please request a new one.',
            ], 422);
        }

        if ($request->otp !== $storedOtp) {
            Cache::put($failKey, $failCount + 1, now()->addMinutes(10));
            $remaining = 5 - ($failCount + 1);
            return response()->json([
                'error'     => true,
                'message'   => "Incorrect OTP. {$remaining} attempt(s) remaining.",
            ], 422);
        }

        // OTP is valid — mint a short-lived token so the submit step can confirm intent
        $token    = bin2hex(random_bytes(16));
        $tokenKey = "withdrawal_verified_member_{$member->id}";

        Cache::put($tokenKey, $token, now()->addMinutes(15));
        Cache::forget($cacheKey);
        Cache::forget($failKey);

        return response()->json([
            'error'   => false,
            'message' => 'OTP verified.',
            'token'   => $token,
        ]);
    }

    // ─────────────────────────────────────────────
    //  Withdrawal: create request (requires verified token)
    // ─────────────────────────────────────────────

    public function createWithdrawalRequest(Request $request): JsonResponse {
        $member = Auth::guard('member')->user();
        if (!$member) {
            return response()->json(['error' => true, 'message' => 'Unauthorized.'], 401);
        }

        // Verify OTP token
        $tokenKey     = "withdrawal_verified_member_{$member->id}";
        $storedToken  = Cache::get($tokenKey);

        if (!$storedToken || $request->input('otpToken') !== $storedToken) {
            return response()->json([
                'error'   => true,
                'message' => 'Your session has expired. Please verify your OTP again.',
            ], 403);
        }

        $request->validate([
            'amount'        => ['required', 'numeric', 'min:1'],
            'payoutMethod'  => ['required', 'in:bank,gcash,maya,cash'],
            'accountName'   => ['nullable', 'string', 'max:200'],
            'accountNumber' => ['nullable', 'string', 'max:100'],
            'remarks'       => ['nullable', 'string', 'max:500'],
            'bankName'      => ['nullable', 'string', 'max:200'],
        ]);

        if ($request->payoutMethod === 'bank') {
            if (!$request->bankName) {
                return response()->json(['error' => true, 'message' => 'Please select a bank.'], 422);
            }
            if (!$request->accountNumber) {
                return response()->json(['error' => true, 'message' => 'Bank account number is required.'], 422);
            }
        }

        if (in_array($request->payoutMethod, ['gcash', 'maya'])) {
            if (!preg_match('/^09\d{9}$/', (string) $request->accountNumber)) {
                return response()->json(['error' => true, 'message' => 'Mobile number must start with 09 and be 11 digits.'], 422);
            }
        }

        // Re-check balance at submission time (balance may have changed)
        $trueBalance = $this->computeTrueBalance($member->id);

        if ((float) $request->amount > $trueBalance) {
            return response()->json(['error' => true, 'message' => 'Insufficient savings balance.'], 422);
        }

        $reference     = $this->makeWithdrawalReference();
        $payoutMethod  = $request->payoutMethod;
        $bankName      = $payoutMethod === 'bank' ? $request->bankName : null;
        $accountName   = $payoutMethod === 'cash'
            ? ($request->accountName ?: trim("{$member->firstName} {$member->lastName}"))
            : $request->accountName;
        $accountNumber = $payoutMethod === 'cash' ? null : $request->accountNumber;

        $withdrawal = SavingsDeposit::create([
            'memberId'               => $member->id,
            'transactionType'        => 'withdrawal',
            'amount'                 => -abs((float) $request->amount),
            'referenceNumber'        => $reference,
            'status'                 => 'Pending',
            'isPaid'                 => false,

            'isWithdrawalRequest'    => true,
            'requestReference'       => $reference,
            'withdrawalRemarks'      => $request->remarks,

            'payoutMethod'           => $payoutMethod,
            'payoutChannel'          => $payoutMethod === 'bank'
                                            ? $bankName
                                            : strtoupper($payoutMethod),

            'withdrawalBankName'     => $bankName,
            'withdrawalAccountName'  => $accountName,
            'withdrawalAccountNumber'=> $accountNumber,
        ]);

        // Consume the verified token so it cannot be reused
        Cache::forget($tokenKey);

        // Notify admin of new withdrawal request
        AdminNotification::create([
            'type'      => 'withdrawal_request',
            'title'     => 'New Withdrawal Request',
            'message'   => sprintf(
                '%s %s has requested a withdrawal of ₱%s via %s (Ref: %s).',
                $member->firstName,
                $member->lastName,
                number_format(abs((float) $request->amount), 2),
                strtoupper($payoutMethod),
                $reference
            ),
            'linkUrl'   => route('admin.savings.withdrawal.index'),
            'relatedId' => $withdrawal->id,
            'isRead'    => false,
        ]);

        return response()->json([
            'error'        => false,
            'message'      => 'Withdrawal request submitted successfully.',
            'withdrawalId' => $withdrawal->id,
            'reference'    => $reference,
        ]);
    }

    // ─────────────────────────────────────────────
    //  Print slip
    // ─────────────────────────────────────────────

    public function printWithdrawal(int $id) {
        $withdrawal = SavingsDeposit::findOrFail($id);

        return Inertia::render('Client/PrintableSavingsWithdrawal', [
            'withdrawal' => [
                'id'            => $withdrawal->id,
                'amount'        => abs($withdrawal->amount),
                'bankName'      => $withdrawal->withdrawalBankName,
                'accountName'   => $withdrawal->withdrawalAccountName,
                'accountNumber' => $withdrawal->withdrawalAccountNumber,
                'remarks'       => $withdrawal->withdrawalRemarks,
                'requestedAt'   => $withdrawal->created_at->format('F d, Y'),
                'member'        => [
                    'fullName' => trim("{$withdrawal->member->firstName} {$withdrawal->member->lastName}"),
                    'username' => $withdrawal->member->username,
                    'contact'  => $withdrawal->member->contact,
                ],
            ],
        ]);
    }

    public function downloadWithdrawalReceipt(int $id) {
        $member = Auth::guard('member')->user();

        $withdrawal = SavingsDeposit::where('id', $id)
            ->where('memberId', $member->id)
            ->whereIn('status', ['Released', 'released', 'RELEASED', 'Posted', 'posted', 'POSTED'])
            ->firstOrFail();

        // Balance before = current balance + the withdrawn amount
        $balanceAfter  = $this->computeTrueBalance($member->id);
        $balanceBefore = $balanceAfter + abs((float) $withdrawal->amount);

        $pdf = Pdf::loadView('pdf.withdrawal-receipt', [
            'member'        => $member,
            'withdrawal'    => $withdrawal,
            'balanceBefore' => $balanceBefore,
            'balanceAfter'  => $balanceAfter,
            'processedBy'   => 'Authorized Officer',
        ])->setPaper('a4', 'portrait');

        $filename = 'withdrawal-receipt-' . $withdrawal->referenceNumber . '.pdf';

        return $pdf->download($filename);
    }

    // ─────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────

    private function computeTrueBalance(int $memberId): float {
        return (float) SavingsDeposit::where('memberId', $memberId)
            ->whereIn('status', ['Posted', 'posted', 'POSTED', 'Released', 'released', 'RELEASED'])
            ->get()
            ->reduce(function ($carry, $row) {
                $credit = $row->transactionType === 'deposit'    ? abs((float) $row->amount) : 0.0;
                $debit  = $row->transactionType === 'withdrawal' ? abs((float) $row->amount) : 0.0;
                return $carry + ($credit - $debit);
            }, 0.0);
    }

    private function maskPhone(string $phone): string {
        $phone = preg_replace('/\D/', '', $phone);
        if (strlen($phone) < 7) return $phone;
        return substr($phone, 0, 4) . str_repeat('*', strlen($phone) - 7) . substr($phone, -3);
    }

    private function buildProjections(float $amount): array {
        $periodRate = $this->interestRateYear / $this->periodsPerYear;

        $targets = [
            ['key' => 'sixMonths',   'title' => 'After 6 months',  'subtitle' => '1 compounding period',   'years' => 0.5, 'highlight' => false],
            ['key' => 'oneYear',     'title' => 'After 1 year',    'subtitle' => '2 compounding periods',  'years' => 1,   'highlight' => false],
            ['key' => 'threeYears',  'title' => 'After 3 years',   'subtitle' => '6 compounding periods',  'years' => 3,   'highlight' => false],
            ['key' => 'fiveYears',   'title' => 'After 5 years',   'subtitle' => '10 compounding periods', 'years' => 5,   'highlight' => true],
        ];

        return array_map(function ($target) use ($amount, $periodRate) {
            $periods  = (int) round($target['years'] * $this->periodsPerYear);
            $balance  = $amount * pow(1 + $periodRate, $periods);
            $interest = $balance - $amount;

            return [
                'key'           => $target['key'],
                'title'         => $target['title'],
                'subtitle'      => $target['subtitle'],
                'highlight'     => $target['highlight'],
                'balanceLabel'  => 'Projected balance',
                'interestLabel' => 'Total interest earned',
                'balance'       => $this->formatCurrency($balance),
                'interest'      => $this->formatCurrency($interest),
            ];
        }, $targets);
    }

    private function formatCurrency(float $value): string {
        return '₱ ' . number_format($value, 2, '.', ',');
    }

    private function makeWithdrawalReference(): string {
        $prefix = 'WD-' . now()->format('Ymd') . '-';

        do {
            $ref = $prefix . str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (SavingsDeposit::where('referenceNumber', $ref)->exists());

        return $ref;
    }
}