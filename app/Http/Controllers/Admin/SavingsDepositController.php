<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\MemberNotification;
use App\Models\SavingsDeposit;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SavingsDepositController extends Controller
{
    public function showSavingsDepositPage(Request $request) {
        $perPage = (int) $request->integer('perPage', 10);
        $dateColumn = 'paidAt';

        $totalSavingsDeposit = (float) SavingsDeposit::query()
            ->sum('amount');

        $thisMonthSavingsDeposit = (float) SavingsDeposit::query()
            ->whereMonth($dateColumn, now()->month)
            ->whereYear($dateColumn, now()->year)
            ->sum('amount');

        $contributorCount = (int) SavingsDeposit::query()
            ->distinct('memberId')
            ->count('memberId');
    
        return Inertia::render('Admin/SavingsDeposit', [
            'stats' => [
                'totalSavingsDeposit'     => $totalSavingsDeposit,
                'thisMonthSavingsDeposit' => $thisMonthSavingsDeposit,
                'contributorCount'        => $contributorCount,
            ],
            'defaults' => [
                'search'   => (string) $request->string('search'),
                'dateFrom' => $request->string('dateFrom'),
                'dateTo'   => $request->string('dateTo'),
                'perPage'  => $perPage,
            ],
        ]);
    }

    public function apiIndex (Request $request) {
        $search = trim((string) $request->string('search'));
        $status   = (string) $request->string('status');
        $dateFrom = (string) $request->string('dateFrom');
        $dateTo   = (string) $request->string('dateTo');
        $perPage  = (int) $request->integer('perPage', 10);
        $page     = max(1, (int) $request->integer('page', 1));

        $search   = $search !== '' ? $search : null;
        $status   = $status !== '' ? $status : 'all';
        $dateFrom = $dateFrom !== '' ? $dateFrom : null;
        $dateTo   = $dateTo !== '' ? $dateTo : null;

        $query = SavingsDeposit::with(['member:id,firstName,middleName,lastName,username'])
            ->where(function ($q) {
                $q->where('isPaid', true)
                    ->orWhere('status', 'posted');
            })
            ->when($status !== 'all', function ($q) use ($status) {
                if ($status === 'posted') {
                    $q->where(function ($w) {
                        $w->where('isPaid', true)
                            ->orWhere('status', 'posted');
                    });
                } else if ($status === 'failed'
                    || $status === 'void'
                    || $status === 'pending'
                    || $status === 'cancelled') {
                    
                    $q->where('status', $status);
                }
            })
            ->when($dateFrom, function ($q) use ($dateFrom) {
                $q->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($dateTo, function ($q) use ($dateTo) {
                $q->whereDate('created_at', '<=', $dateTo);
            })
            ->when($search, function ($q) use ($search) {
                $q->where(function ($w) use ($search) {
                    $w->whereHas('member', function ($m) use ($search) {
                        $m->where('firstName', 'like', "%{$search}%")
                            ->orWhere('middleName', 'like', "%{$search}")
                            ->orWhere('lastName', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%");
                    })->orWhere('referenceNumber', 'like', "%{$search}");
                });
            });
        $memberIds = (clone $query)->select('memberId')->distinct()->pluck('memberId');

        $slice = $memberIds->forPage($page, $perPage)->values();

        $rowsRaw = SavingsDeposit::with(['member:id,firstName,lastName,middleName,username'])
            ->whereIn('memberId', $slice)
            ->where(function ($q) {
                $q->where('isPaid', true)
                    ->orWhere('status', 'posted');
            })
            ->orderBy('memberId')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        $grouped = $rowsRaw->groupBy('memberId')->map(function ($rows, $memberId) {
            $first  = $rows->first();
            $member = optional($first->member);

            $totalDeposits    = 0.0;
            $totalWithdrawals = 0.0;

            foreach ($rows as $r) {
                $amt = (float) $r->amount;
                if ($r->transactionType === 'deposit') {
                    $totalDeposits += $amt;
                } elseif ($r->transactionType === 'withdrawal') {
                    $totalWithdrawals += $amt;
                }
            }

            $totalWithdrawalsAbs = abs($totalWithdrawals);
            $balance             = $totalDeposits + $totalWithdrawals;

            return [
                'memberId'         => (int) $memberId,
                'memberName'       => $member ? trim("{$member->lastName}, {$member->firstName} {$member->middleName}") : '',
                'username'         => $member ? (string) $member->username : '',
                'totalDeposits'    => $totalDeposits,
                'totalWithdrawals' => $totalWithdrawalsAbs,
                'balance'          => $balance,
            ];
        })->values();

        return response()->json([
            'rows' => $grouped,
            'meta' => [
                'currentPage' => $page,
                'lastPage'    => (int) ceil(max(1, $memberIds->count()) / max(1, $perPage)),
                'perPage'     => $perPage,
                'total'       => $memberIds->count(),
            ],
        ]);
    }

    public function showMemberSavings(Request $request, int $memberId) {
        $member = Member::select('id', 'firstName', 'middleName', 'lastName', 'username','email')->findOrFail($memberId);

        $totalDeposits = (float) SavingsDeposit::where('memberId', $memberId)
        ->where('transactionType', 'deposit')
        ->where('status', ['posted', 'Posted', 'POSTED'])
        ->sum('amount');

        $totalWithdrawals = (float) SavingsDeposit::where('memberId', $memberId)
            ->where('transactionType', 'withdrawal')
            ->where('status', ['posted', 'Posted', 'POSTED'])
            ->sum('amount');

        $totalSavings = $totalDeposits + $totalWithdrawals;

        $stats = [
            'totalSavings'      => $totalSavings,
            'totalDeposits'     => $totalDeposits,
            'totalWithdrawals'  => $totalWithdrawals,
        ];

        return Inertia::render('Admin/SavingsDepositView', [
            'member' => [
                'id'       => $member->id,
                'name'     => trim("{$member->lastName}, {$member->firstName} {$member->middleName}"),
                'username' => $member->username,
                'email'    => $member->email,
            ],
            'stats' => [
                'stats'  => $stats,
            ],
        ]);
    }

    public function apiMemberSavings(Request $request, int $memberId) {
        $perPage = (int) $request->integer('perPage', 10);
        $page    = max(1, (int) $request->integer('page', 1));

        // Get ALL rows for the member, latest first
        $all = SavingsDeposit::where('memberId', $memberId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get([
                'id',
                'transactionType',   // "deposit" or "withdrawal"
                'amount',
                'status',
                'isPaid',
                'referenceNumber',
                'paidAt',
                'created_at',
            ]);

        // Compute total net balance first
        $totalNet = 0.0;
        foreach ($all as $r) {
            $amt = (float) abs($r->amount);
            $isDeposit = strtolower((string) $r->transactionType) === 'deposit';
            $totalNet += $isDeposit ? $amt : -$amt;
        }

        // Walk from latest → oldest, assigning runningBalance
        $running = $totalNet;

        $rows = $all->map(function ($r) use (&$running) {
            $type   = strtolower((string) $r->transactionType);
            $amount = (float) abs($r->amount);

            $credit = $type === 'deposit'    ? $amount : null;
            $debit  = $type === 'withdrawal' ? $amount : null;

            $balanceNow = $running;
            $signed     = ($credit ?? 0.0) - ($debit ?? 0.0);
            $running   -= $signed;

            return [
                'id'              => $r->id,
                // original transaction date
                'date'            => optional($r->created_at)->toDateString(),
                // posted/paid date
                'datePosted'      => optional($r->paidAt)->toDateString(),

                // main fields the frontend uses
                'transactionType' => $r->transactionType,
                'amount'          => $amount,
                'referenceNumber' => $r->referenceNumber,
                'runningBalance'  => $balanceNow,

                // extra status flags (still processed)
                'status'          => $r->status,
                'isPaid'          => (bool) $r->isPaid,

                // already-processed credit / debit (frontend can show directly)
                'credit'          => $credit,
                'debit'           => $debit,
            ];
        });

        $total = $rows->count();
        $last  = (int) ceil(max(1, $total) / max(1, $perPage));
        $paged = $rows
            ->slice(($page - 1) * $perPage, $perPage)
            ->values();

        return response()->json([
            'rows' => $paged,
            'meta' => [
                'currentPage' => $page,
                'lastPage'    => $last,
                'perPage'     => $perPage,
                'total'       => $total,
            ],
        ]);
    }

    public function apiMembersMin() {
        $rows = Member::orderBy('lastName')->limit(500)
            ->get(['id','firstName','middleName','lastName','username'])
            ->map(function ($m) {
                $label = trim("{$m->lastName}, {$m->firstName} {$m->middleName}") . ($m->username ? " ({$m->username})" : '');
                return ['id' => $m->id, 'label' => $label];
            });

        return response()->json(['rows' => $rows]);
    }

    // Save Savings Deposit Transaction
    public function storeSavingsDeposit(Request $request) {
        $v = Validator::make($request->all(), [
            'memberId'        => ['required', 'integer', 'exists:members,id'],
            'transactionType' => ['required', 'in:deposit,withdrawal'],
            'amount'          => ['required', 'numeric', 'min:0.01'],
            'referenceNumber' => ['nullable', 'string', 'max:120'],
        ]);

        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $v->errors(),
            ], 422);
        }

        $memberId = (int) $request->memberId;
        $type     = $request->transactionType;
        $amount   = (float) $request->amount;

        $reference = $request->referenceNumber ?: $this->makeSavingsReference($memberId);

        $now    = now();
        $paidAt = $now->copy();

        if ($type === 'withdrawal') {
            $postedBalance = (float) SavingsDeposit::where('memberId', $memberId)
                ->where(function ($q) {
                    $q->where('isPaid', true)
                        ->orWhere('status', 'posted');
                })
                ->sum('amount');

            if ($amount > $postedBalance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Withdrawal amount exceeds available posted savings balance.',
                    'errors'  => [
                        'amount' => ['Withdrawal amount exceeds available posted savings balance.'],
                    ],
                ], 422);
            }
        }

        $entry                   = new SavingsDeposit();
        $entry->memberId         = $memberId;
        $entry->transactionType  = $type;
        $entry->amount           = $type === 'withdrawal' ? -1 * abs($amount) : abs($amount);
        $entry->referenceNumber  = $reference;
        $entry->status           = 'posted';
        $entry->isPaid           = true;
        $entry->paidAt           = $paidAt;
        $entry->save();

        $dateColumn = 'paidAt';

        // === Recompute global stats for cards ===
        $totalSavingsDeposit = (float) SavingsDeposit::query()
        ->sum('amount');

        $thisMonthSavingsDeposit = (float) SavingsDeposit::query()
            ->whereMonth($dateColumn, now()->month)
            ->whereYear($dateColumn, now()->year)
            ->sum('amount');

        $contributorCount = (int) SavingsDeposit::query()
            ->distinct('memberId')
            ->count('memberId');

        $stats = [
            'totalSavingsDeposit'     => $totalSavingsDeposit,
            'thisMonthSavingsDeposit' => $thisMonthSavingsDeposit,
            'contributorCount'        => $contributorCount,
        ];

        // === Per-member stats (if you use them somewhere else) ===
        $memberTotal = (float) SavingsDeposit::where('memberId', $memberId)->sum('amount');

        $memberPosted = (float) SavingsDeposit::where('memberId', $memberId)
            ->where(function ($q) {
                $q->where('isPaid', true)
                    ->orWhere('status', 'posted');
            })
            ->sum('amount');

        $lastTx = SavingsDeposit::where('memberId', $memberId)
            ->orderByDesc('paidAt')
            ->orderByDesc('created_at')
            ->first();

        $memberStats = [
            'totalSavingsDeposit'   => $memberTotal,
            'postedSavingsDeposit'  => $memberPosted,
            'lastTransactionDate'   => $lastTx
                ? ($lastTx->paidAt?->toDateString() ?? $lastTx->created_at?->toDateString())
                : null,
        ];

        return response()->json([
            'success'       => true,
            'message'       => 'Savings transaction recorded.',
            'id'            => $entry->id,
            'referenceNumber' => $reference,
            'paidAt'        => $entry->paidAt?->toDateString(),
            'stats'         => $stats,
            'memberStats'   => $memberStats,
        ]);
    }

    private function makeSavingsReference(int $memberId): string {
        $ym  = now()->format('Ymd');
        $seq = SavingsDeposit::where('memberId', $memberId)
            ->whereYear('created_at', now()->year)
            ->count() + 1;

        return sprintf('SD-%s-%06d', $ym, $seq);
    }

    /**
     * Semiannual interest posting – 6.09% annual, compounded.
     *
     * Rules:
     *  - Annual rate: 6.09%
     *  - Per semester: 6.09 / 2 = 3.045%
     *  - For each member:
     *      - Compute month-end balances for the 6 months of the semester
     *      - avgBalance = sum(monthEndBalances) / 6
     *      - interest = avgBalance * (0.0609 / 2)
     *      - Post interest as a SavingsDeposit row (transactionType = 'deposit', ref = "INT-YYYY-Hx")
     */
    public function postSemiAnnualInterest(Request $request) {
        $data = $request->validate([
            'year'     => ['nullable', 'integer', 'min:2000', 'max:' . now()->year],
            'semester' => ['nullable', Rule::in([1, 2])],
            'preview'  => ['nullable', 'boolean'],
        ]);

        $year = $data['year'] ?? now()->year;
        $semester = $data['semester'] ?? (now()->month <= 6 ? 1 : 2);
        $preview = (bool) ($data['preview'] ?? false);

        if ($semester === 1) {
            $fromMonth = 1;
            $toMonth = 6; 
        } else {
            $fromMonth = 7;
            $toMonth = 12;
        }

        $periodStart = now()->setDate($year, $fromMonth, 1)->startOfDay();
        $periodEnd = now()->setDate($year, $toMonth, 1)->endOfMonth()->endOfDay();

        $semiAnnualRate = 0.0609 / 2;

        $memberIds = SavingsDeposit::query()
            ->where('isPaid', true)
            ->where('paidAt', '<=', $periodEnd->toDateString())
            ->distinct()
            ->pluck('memberId');

        $results = [];

        foreach ($memberIds as $memberId) {
            $transactions = SavingsDeposit::query()
                ->where('memberId', $memberId)
                ->where('isPaid', true)
                ->where('paidAt', '<=', $periodEnd->toDateString())
                ->orderBy('paidAt')
                ->orderBy('id')
                ->get();

            if ($transactions->isEmpty()) {
                continue;
            }

            $runningBalance = 0.0;
            $monthEndBalances = [];
            $txIndex = 0;
            $txCount = $transactions->count();

            for ($m = 1; $m <= 12; $m++) {
                while ($txIndex < $txCount) {
                    $tx = $transactions[$txIndex];
                    $txMonth = (int) date('n', strtotime($tx->paidAt));

                    if ($txMonth > $m) {
                        break;
                    }

                    if ($txMonth === $m) {
                        $amount = (float) $tx->amount;

                        if ($tx->transactionType === 'deposit' || $tx->transactionType === 'interest') {
                            $runningBalance += $amount;
                        } else if ($tx->transactionType === 'withdrawal') {
                            $runningBalance += $amount;
                        }
                    }

                    $txIndex++;
                }

                if ($m >= $fromMonth && $m <= $toMonth) {
                    $monthEndBalances[$m] = $runningBalance;
                }
            }

            if (empty($monthEndBalances)) {
                continue;
            }

            $monthsCount = count($monthEndBalances);
            $sumBalances = array_sum($monthEndBalances);
            $avgBalance = $sumBalances / $monthsCount;

            if ($avgBalance <= 0) {
                continue;
            }

            $interestAmount = round($avgBalance * $semiAnnualRate, 2);
            if ($interestAmount <= 0) {
                continue;
            }

            $results[] = [
                'memberId' => $memberId,
                'avgBalance' => round($avgBalance, 2),
                'interestAmount' => $interestAmount,
                'year' => $year,
                'semester' => $semester
            ];

            if (!$preview) {
                SavingsDeposit::create([
                    'memberId' => $memberId,
                    'transactionType' => 'deposit',
                    'amount' => $interestAmount,
                    'referenceNumber' => sprintf('INT-%d-H%d, $year, $semester'),
                    'status' => 'posted',
                    'isPaid' => true,
                    'paidAt' => $periodEnd->toDateString()
                ]);
            }
        }

        if ($preview) {
            return response()->json([
                'year' => $year,
                'semester' => $semester,
                'rate' => $semiAnnualRate,
                'results' => $results
            ]);
        }

        return redirect()
            ->back()
            ->with('success', 'Semi-Annual Savings Interest recorded successfully');
    }

    public function exportCsv(Request $request) {
        $exportDate      = now();
        $formattedHeader = $exportDate->format('d F Y');
        $fileDate        = $exportDate->format('Y-m-d');

        $search   = trim((string) $request->string('search')) ?: null;
        $status   = (string) $request->string('status', 'all') ?: 'all';
        $dateFrom = (string) $request->string('dateFrom') ?: null;
        $dateTo   = (string) $request->string('dateTo') ?: null;

        $base = SavingsDeposit::with(['member:id,firstName,middleName,lastName,username'])
            ->where(function ($q) {
                $q->where('isPaid', true)->orWhere('status', 'posted');
            })
            ->when($status !== 'all', function ($q) use ($status) {
                if ($status === 'posted') {
                    $q->where(function ($w) {
                        $w->where('isPaid', true)
                            ->orWhere('status', 'posted');
                    });
                } else if ($status === 'failed'
                    || $status === 'void'
                    || $status === 'pending'
                    || $status === 'cancelled') {
                    $q->where('status', $status);
                }
            })
            ->when($dateFrom, function ($q) use ($dateFrom) {
                $q->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($dateTo, function ($q) use ($dateTo) {
                $q->whereDate('created_at', '<=', $dateTo);
            })
            ->when($search, function ($q) use ($search) {
                $q->where(function ($w) use ($search) {
                    $w->whereHas('member', function ($m) use ($search) {
                        $m->where('firstName', 'like', "%{$search}%")
                            ->orWhere('middleName', 'like', "%{$search}%")
                            ->orWhere('lastName', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%");
                    })->orWhere('referenceNumber', 'like', "%{$search}%");
                });
            });

        $all = $base->orderBy('memberId')->orderBy('created_at')
            ->get(['memberId', 'amount']);

        $byMember = $all->groupBy('memberId');

        $csv = fopen('php://temp', 'r+');
        fputcsv($csv, ['Member', 'Username', "As of {$formattedHeader}", 'Balance']);

        foreach ($byMember as $memberId => $rows) {
            $first  = $rows->first();
            $member = optional($first->member);

            $name = $member
                ? trim("{$member->lastName}, {$member->firstName} {$member->middleName}")
                : "Member #{$memberId}";

            $username = $member ? (string) $member->username : '';

            $balance = 0.0;
            foreach ($rows as $r) {
                $balance += (float) $r->amount;
            }

            fputcsv($csv, [
                $name,
                $username,
                $formattedHeader,
                number_format($balance, 2, '.', ''),
            ]);
        }

        rewind($csv);
        $content = stream_get_contents($csv);

        return response($content, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="savings-deposit-balance-' . $fileDate . '.csv"',
        ]);
    }

    /**
     * ADMIN: LIST WITHDRAWAL REQUESTS TABLE
     */
    public function withdrawalIndex(Request $request) {
        $search   = trim((string) $request->string('search'));
        $status   = (string) $request->string('status', 'all');
        $perPage  = (int) $request->integer('perPage', 10);

        $query = SavingsDeposit::with(['member:id,firstName,lastName,username'])
            ->where('isWithdrawalRequest', true);

        if ($status !== 'all') {
            $query->where('adminStatus', ucfirst($status));
        }

        if ($search !== '') {
            $query->whereHas('member', function ($q) use ($search) {
                $q->where('firstName', 'like', "%{$search}%")
                    ->orWhere('lastName', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        $withdrawals = $query
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->appends($request->only('search', 'status', 'perPage'));

        return inertia('Admin/SavingsWithdrawalIndex', [
            'withdrawals' => $withdrawals,
            'filters'     => [
                'search'  => $search,
                'status'  => $status,
                'perPage' => $perPage,
            ],
        ]);
    }

    /**
     * ADMIN: API FETCH — DETAILS FOR MODAL
     */
    public function showMemberWithdrawal($memberId) {
        $withdrawal = SavingsDeposit::with([
            'member:id,firstName,lastName,username,email,contact'
        ])
        ->where('id', $memberId)
        ->where('isWithdrawalRequest', true)
        ->firstOrFail();

        return response()->json([
            'withdrawal' => $withdrawal
        ]);
    }

    /**
     * ADMIN: APPROVE WITHDRAWAL REQUEST
     */
    public function approveWithdrawal(Request $request, $memberId) {
        $withdrawal = SavingsDeposit::with('member')->findOrFail($memberId);

        // Check if pending
        if (strtolower($withdrawal->status) !== 'pending') {
            return response()->json([
                'error' => true,
                'message' => 'This request has already been processed.'
            ], 422);
        }

        // Compute current available balance
        $balance = SavingsDeposit::where('memberId', $withdrawal->memberId)
            ->where('status', 'Posted')
            ->sum('amount');

        // Check insufficient funds
        if ($balance < abs($withdrawal->amount)) {
            return response()->json([
                'error' => true,
                'message' => 'Insufficient balance. Withdrawal cannot be approved.'
            ], 422);
        }

        // APPROVE
        $withdrawal->update([
            'status'   => 'Approved',
        ]);

        // Notify member
        MemberNotification::create([
            'memberId' => $withdrawal->memberId,
            'title'    => 'Withdrawal Approved',
            'message'  => sprintf(
                'Your savings withdrawal request (Ref: %s) has been approved.',
                $withdrawal->referenceNumber
            ),
            'type'     => 'withdrawal_approved',
            'isRead'   => false,
            'linkUrl'  => route('member.savings.index'),
        ]);

        return response()->json([
            'error' => false,
            'message' => 'Withdrawal request approved.'
        ]);
    }

    /**
     * ADMIN: RELEASE WITHDRAWAL (Cash / GCash / Maya / Bank)
     */
    public function releaseWithdrawal(Request $request, $memberId) {
        $withdrawal = SavingsDeposit::with('member')->findOrFail($memberId);

        if ($withdrawal->status !== 'Approved') {
            return response()->json([
                'error' => true,
                'message' => 'Withdrawal must be approved before releasing.'
            ], 422);
        }

        // Compute current balance BEFORE releasing
        $balance = SavingsDeposit::where('memberId', $withdrawal->memberId)
            ->where('status', 'Posted')
            ->sum('amount');
        
        // Check insufficient funds
        if ($balance < abs($withdrawal->amount)) {
            return response()->json([
                'error' => true,
                'message' => 'Insufficient balance. Unable to release withdrawal.'
            ], 422);
        }

        DB::transaction(function () use ($withdrawal) {

            $withdrawal->update([
                'status' => 'Posted',
                'isPaid' => true,
                'status' => 'posted',
                'paidAt' => now(),
            ]);
        });

        /**
         * 🔔 NOTIFICATION — WITHDRAWAL RELEASED
         */
        MemberNotification::create([
            'memberId' => $withdrawal->memberId,
            'title' => 'Withdrawal Released',
            'message' => sprintf(
                'Your savings withdrawal (Ref: %s) has been released.',
                $withdrawal->referenceNumber
            ),
            'type' => 'withdrawal_released',
            'isRead' => false,
            'linkUrl' => route('member.savings.index'),
        ]);

        return response()->json([
            'error' => false,
            'message' => 'Withdrawal released successfully.'
        ]);
    }

    /**
     * ADMIN: DECLINE WITHDRAWAL REQUEST
     */
    public function declineWithdrawal(Request $request, $memberId) {
        $withdrawal = SavingsDeposit::with('member')->findOrFail($memberId);

        if ($withdrawal->status !== 'Pending') {
            return response()->json([
                'error' => true,
                'message' => 'Only pending requests can be declined.'
            ], 422);
        }

        $withdrawal->update([
            'status' => 'Declined',
            'adminStatus'   => 'Declined',
        ]);

        /**
         * 🔔 NOTIFICATION — WITHDRAWAL DECLINED
         */
        MemberNotification::create([
            'memberId' => $withdrawal->memberId,
            'title'    => 'Withdrawal Declined',
            'message'  => sprintf(
                'Your savings withdrawal request (Ref: %s) has been declined.',
                $withdrawal->referenceNumber
            ),
            'type'     => 'withdrawal_declined',
            'isRead'   => false,
            'linkUrl'  => route('member.savings.index'),
        ]);

        return response()->json([
            'error'   => false,
            'message' => 'Withdrawal request declined.'
        ]);
    }

    /** PRINT REQUEST */
    public function printWithdrawal($memberId) {
        $withdrawal = SavingsDeposit::with('member')->findOrFail($memberId);

        return Inertia::render('Admin/SavingsWithdrawalPrint', [
            'withdrawal' => $withdrawal,
        ]);
    }
}
