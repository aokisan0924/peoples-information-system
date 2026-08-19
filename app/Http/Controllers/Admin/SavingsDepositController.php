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
use App\Mail\WithdrawalReceiptMail;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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
                $q->whereDate('paidAt', '>=', $dateFrom);
            })
            ->when($dateTo, function ($q) use ($dateTo) {
                $q->whereDate('paidAt', '<=', $dateTo);
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
        ->whereIn('status', ['posted', 'Posted', 'POSTED'])
        ->sum('amount');

        $totalWithdrawals = (float) SavingsDeposit::where('memberId', $memberId)
            ->where('transactionType', 'withdrawal')
            ->whereIn('status', ['posted', 'Posted', 'POSTED'])
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
        // --- UPDATED: Added processor relationship and selected processed_by column
        $all = SavingsDeposit::with('processor') 
            ->where('memberId', $memberId)
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
                'processed_by', // <--- IMPORTANT: Needed for the relationship to work
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
                // effective transaction date (admin-entered, can be backdated)
                'date'            => optional($r->paidAt ?? $r->created_at)->toDateString(),
                // posted/paid date — kept for backward compatibility, same as 'date' for posted rows
                'datePosted'      => optional($r->paidAt)->toDateString(),
                // when this row was actually keyed into the system (audit trail, not shown by default)
                'dateRecorded'    => optional($r->created_at)->toDateString(),

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
                
                // --- UPDATED: Return processor info
                'processor'       => $r->processor,
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
            'transactionDate' => ['nullable', 'date', 'before_or_equal:today'],
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

        $now = now();

        // Effective transaction date: admin-selected date (can be backdated), with the
        // current time-of-day kept for natural same-day ordering. created_at is left
        // alone so it still reflects when the record was actually keyed into the system.
        $paidAt = $request->filled('transactionDate')
            ? Carbon::parse($request->transactionDate)->setTime($now->hour, $now->minute, $now->second)
            : $now->copy();

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
        
        // --- UPDATED: Save Processed By using Admin Guard ---
        if (Auth::guard('admin')->check()) {
            $entry->processed_by = Auth::guard('admin')->id(); 
        }
        
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
                    'paidAt' => $periodEnd->toDateString(),
                    // Optional: Track Interest posting user
                    'processed_by' => Auth::guard('admin')->id() 
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
                $q->whereDate('paidAt', '>=', $dateFrom);
            })
            ->when($dateTo, function ($q) use ($dateTo) {
                $q->whereDate('paidAt', '<=', $dateTo);
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

        if (strtolower($withdrawal->status) !== 'pending') {
            return response()->json([
                'error'   => true,
                'message' => 'This request has already been processed.',
            ], 422);
        }

        // Re-check balance against posted rows only
        $balance = $this->computePostedBalance($withdrawal->memberId);

        if ($balance < abs($withdrawal->amount)) {
            return response()->json([
                'error'   => true,
                'message' => 'Insufficient balance. Withdrawal cannot be approved.',
            ], 422);
        }

        $withdrawal->update([
            'status'       => 'Approved',
            'adminStatus'  => 'Approved',
            'processed_by' => Auth::guard('admin')->id(),
        ]);

        // In-app notification
        MemberNotification::create([
            'memberId' => $withdrawal->memberId,
            'title'    => 'Withdrawal Approved',
            'message'  => sprintf(
                'Your savings withdrawal request (Ref: %s) for %s has been approved and is being processed.',
                $withdrawal->referenceNumber,
                '₱' . number_format(abs($withdrawal->amount), 2)
            ),
            'type'     => 'withdrawal_approved',
            'isRead'   => false,
            'linkUrl'  => route('member.savings.index'),
        ]);

        // SMS notification
        $this->sendWithdrawalSms(
            $withdrawal->member->contact,
            sprintf(
                'Hi %s, your PMPC savings withdrawal (Ref: %s) for ₱%s has been approved. Funds will be released shortly.',
                $withdrawal->member->firstName,
                $withdrawal->referenceNumber,
                number_format(abs($withdrawal->amount), 2)
            )
        );

        return response()->json([
            'error'   => false,
            'message' => 'Withdrawal request approved.',
        ]);
    }

    /**
     * ADMIN: RELEASE WITHDRAWAL
     * - Digital channels (bank/gcash/maya): triggers PayMongo disbursement
     * - Cash: marks as released immediately, no payout API call
     * - On PayMongo failure: keeps status as Approved, returns error to admin
     */
    public function releaseWithdrawal(Request $request, $memberId) {
        $withdrawal = SavingsDeposit::with('member')->findOrFail($memberId);

        if ($withdrawal->status !== 'Approved') {
            return response()->json([
                'error'   => true,
                'message' => 'Withdrawal must be approved before releasing.',
            ], 422);
        }

        // Re-check balance
        $balance = $this->computePostedBalance($withdrawal->memberId);

        if ($balance < abs($withdrawal->amount)) {
            return response()->json([
                'error'   => true,
                'message' => 'Insufficient balance. Unable to release withdrawal.',
            ], 422);
        }

        $method = strtolower($withdrawal->payoutMethod ?? '');

        // ── Mark as Released (all channels — manual payout in effect) ─────────
        // TODO: Swap the digital block below for PayMongoController::disburseSavingsWithdrawal()
        //       once PayMongo enables Disbursements API on this account.
        $withdrawal->update([
            'status'       => 'Released',
            'adminStatus'  => 'Released',
            'isPaid'       => true,
            'paidAt'       => now(),
            'processed_by' => Auth::guard('admin')->id(),
        ]);

        // ── Send PDF receipt email ────────────────────────────────────────────
        try {
            $balanceBefore = $this->computePostedBalance($withdrawal->memberId) + abs((float) $withdrawal->amount);
            $balanceAfter  = $this->computePostedBalance($withdrawal->memberId);

            $adminUser  = \App\Models\Admin::find($withdrawal->processed_by);
            $processedBy = $adminUser ? ($adminUser->name ?? $adminUser->username ?? 'Authorized Officer') : 'Authorized Officer';

            Mail::to($withdrawal->member->email)
                ->send(new WithdrawalReceiptMail(
                    member:        $withdrawal->member,
                    withdrawal:    $withdrawal,
                    balanceBefore: $balanceBefore,
                    balanceAfter:  $balanceAfter,
                    processedBy:   $processedBy,
                ));
        } catch (\Throwable $e) {
            Log::warning('Withdrawal receipt email failed', [
                'withdrawal_id' => $withdrawal->id,
                'error'         => $e->getMessage(),
            ]);
            // Non-fatal — release already succeeded
        }

        // In-app notification
        MemberNotification::create([
            'memberId' => $withdrawal->memberId,
            'title'    => 'Withdrawal Released',
            'message'  => sprintf(
                'Your savings withdrawal (Ref: %s) for %s has been released via %s.',
                $withdrawal->referenceNumber,
                '₱' . number_format(abs($withdrawal->amount), 2),
                strtoupper($method)
            ),
            'type'     => 'withdrawal_released',
            'isRead'   => false,
            'linkUrl'  => route('member.savings.index'),
        ]);

        // SMS notification
        $cashNote = $method === 'cash' ? ' Please collect at the PMPC office.' : '';
        $this->sendWithdrawalSms(
            $withdrawal->member->contact,
            sprintf(
                'Hi %s, your PMPC savings withdrawal (Ref: %s) for ₱%s has been released via %s.%s',
                $withdrawal->member->firstName,
                $withdrawal->referenceNumber,
                number_format(abs($withdrawal->amount), 2),
                strtoupper($method),
                $cashNote
            )
        );

        return response()->json([
            'error'   => false,
            'message' => 'Withdrawal released successfully.',
        ]);
    }

    /**
     * ADMIN: DECLINE WITHDRAWAL REQUEST
     */
    public function declineWithdrawal(Request $request, $memberId) {
        $withdrawal = SavingsDeposit::with('member')->findOrFail($memberId);

        if (strtolower($withdrawal->status) !== 'pending') {
            return response()->json([
                'error'   => true,
                'message' => 'Only pending requests can be declined.',
            ], 422);
        }

        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $reason = $request->input('reason', 'No reason provided.');

        $withdrawal->update([
            'status'          => 'Declined',
            'adminStatus'     => 'Declined',
            'withdrawalRemarks' => $reason,
            'processed_by'    => Auth::guard('admin')->id(),
        ]);

        // In-app notification
        MemberNotification::create([
            'memberId' => $withdrawal->memberId,
            'title'    => 'Withdrawal Declined',
            'message'  => sprintf(
                'Your savings withdrawal request (Ref: %s) has been declined. Reason: %s',
                $withdrawal->referenceNumber,
                $reason
            ),
            'type'     => 'withdrawal_declined',
            'isRead'   => false,
            'linkUrl'  => route('member.savings.index'),
        ]);

        // SMS notification
        $this->sendWithdrawalSms(
            $withdrawal->member->contact,
            sprintf(
                'Hi %s, your PMPC savings withdrawal (Ref: %s) has been declined. Reason: %s. Contact support for assistance.',
                $withdrawal->member->firstName,
                $withdrawal->referenceNumber,
                $reason
            )
        );

        return response()->json([
            'error'   => false,
            'message' => 'Withdrawal request declined.',
        ]);
    }

    /**
     * MEMBER PORTAL: Download withdrawal receipt as PDF
     * Only the owning member can download their own receipt.
     */
    public function downloadWithdrawalReceipt(int $id) {
        $member     = Auth::guard('member')->user();
        $withdrawal = SavingsDeposit::with('member')
            ->where('id', $id)
            ->where('memberId', $member->id)
            ->whereIn('status', ['Released', 'released', 'Posted', 'posted'])
            ->firstOrFail();

        $balanceBefore = $this->computePostedBalance($member->id) + abs((float) $withdrawal->amount);
        $balanceAfter  = $this->computePostedBalance($member->id);

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

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function computePostedBalance(int $memberId): float {
        return (float) SavingsDeposit::where('memberId', $memberId)
            ->whereIn('status', ['posted', 'Posted', 'POSTED'])
            ->get()
            ->reduce(function ($carry, $row) {
                $credit = $row->transactionType === 'deposit'    ? abs((float) $row->amount) : 0.0;
                $debit  = $row->transactionType === 'withdrawal' ? abs((float) $row->amount) : 0.0;
                return $carry + ($credit - $debit);
            }, 0.0);
    }

    private function sendWithdrawalSms(string $mobile, string $message): void {
        try {
            Http::post('https://api.semaphore.co/api/v4/messages', [
                'apikey'     => config('services.semaphore.api_key'),
                'number'     => $mobile,
                'message'    => $message,
                'sendername' => config('services.semaphore.sender_name', 'SEMAPHORE'),
            ]);
        } catch (\Throwable $e) {
            // SMS failure is non-fatal — log and continue
            Log::warning('Withdrawal SMS failed', [
                'mobile'  => $mobile,
                'error'   => $e->getMessage(),
            ]);
        }
    }

    /** PRINT REQUEST */
    public function printWithdrawal($memberId) {
        $withdrawal = SavingsDeposit::with('member')->findOrFail($memberId);

        return Inertia::render('Admin/SavingsWithdrawalPrint', [
            'withdrawal' => $withdrawal,
        ]);
    }
}