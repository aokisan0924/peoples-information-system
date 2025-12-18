<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CapitalContribution;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // <--- Import Auth
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ShareCapitalController extends Controller
{
    public function showShareCapital(Request $request) {
        $totalShareCapital   = (float) CapitalContribution::sum('amount');
        $postedShareCapital  = (float) CapitalContribution::where(function ($q) {
            $q->where('is_Paid', true)->orWhere('status', 'posted');
        })->sum('amount');

        $now = now();
        $thisMonthShareCapital = (float) CapitalContribution::whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->sum('amount');

        $contributorCount = (int) CapitalContribution::distinct('memberId')->count('memberId');

        return Inertia::render('Admin/ShareCapital', [
            'stats' => [
                'totalShareCapital'  => $totalShareCapital,
                'postedShareCapital' => $postedShareCapital,
                'thisMonthShareCapital' => $thisMonthShareCapital,
                'contributorCount'   => $contributorCount,
            ],
            'defaults' => [
                'search'  => (string) $request->string('search'),
                'status'  => $request->string('status', 'all'),
                'dateFrom'=> $request->string('dateFrom'),
                'dateTo'  => $request->string('dateTo'),
                'perPage' => (int) $request->integer('perPage', 10),
            ],
        ]);
    }

    // --- KEEPING YOUR WORKING API INDEX LOGIC ---
    public function apiIndex(Request $request) {
        $search   = trim((string) $request->string('search'));
        $status   = (string) $request->string('status');
        $dateFrom = (string) $request->string('dateFrom');
        $dateTo   = (string) $request->string('dateTo');
        $perPage  = (int) $request->integer('perPage', 10);
        $page     = max(1, (int) $request->integer('page', 1));

        $search   = $search !== '' ? $search : null;
        $status   = $status !== '' ? $status : 'all';
        $dateFrom = $dateFrom !== '' ? $dateFrom : null;
        $dateTo   = $dateTo !== '' ? $dateTo : null;

        $query = CapitalContribution::with(['member:id,firstName,middleName,lastName,username'])
            ->where(function ($q) {
                $q->where('is_Paid', true)
                    ->orWhere('status', 'posted');
            })
            ->when($status !== 'all', function ($q) use ($status) {
                if ($status === 'posted') {
                    $q->where(function ($w) {
                        $w->where('is_Paid', true)
                            ->orWhere('status', 'posted');
                    });
                } else if ($status === 'failed') {
                    $q->where('status', 'failed');
                }
            })
            ->when($dateFrom !== null, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo   !== null, fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->when($search   !== null, function ($q) use ($search) {
                $q->where(function ($w) use ($search) {
                    $w->whereHas('member', function ($m) use ($search) {
                        $m->where('firstName', 'like', "%{$search}%")
                            ->orWhere('middleName', 'like', "%{$search}%")
                            ->orWhere('lastName', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%");
                    })->orWhere('reference_number', 'like', "%{$search}%");
                });
            });

        $memberIds = (clone $query)->select('memberId')->distinct()->pluck('memberId');

        $slice = $memberIds->forPage($page, $perPage)->values();

        $rowsRaw = CapitalContribution::with(['member:id,firstName,middleName,lastName,username'])
            ->whereIn('memberId', $slice)
            ->where(function ($q) {
                $q->where('is_Paid', true)
                    ->orWhere('status', 'posted');
            })
            ->get();

        $grouped = $rowsRaw->groupBy('memberId')->map(function ($rows, $memberId) {
            $member = optional($rows->first()->member);

            $normalizeType  = function ($t) {
                $t = trim((string) $t);
                return $t === '' ? null : strtolower($t);
            };

            $totalDeposits = (float) $rows->sum(function ($r) use ($normalizeType) {
                $amt = (float) $r->amount;
                $t = $normalizeType($r->transactionType);
                if ($t === 'deposit') return abs($amt);
                if ($t === 'withdrawal') return 0.0;
                return $amt > 0 ? abs($amt) : 0.0;
            });

            $totalWithdrawalsAbs = (float) $rows->sum(function ($r) use ($normalizeType) {
                $amt = (float) $r->amount;
                $t = $normalizeType($r->transactionType);
                if ($t === 'withdrawal') return abs($amt);
                if ($t === 'deposit') return 0.0;
                return $amt < 0 ? abs($amt) : 0.0;
            });

            $balance = (float) $rows->sum('amount');

            return [
                'memberId'         => (int) $memberId,
                'member'           => $member ? trim("{$member->lastName}, {$member->firstName} {$member->middleName}") : '',
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

    public function showMemberContributions(Request $request, int $memberId) {
        $member = Member::select('id','firstName','middleName','lastName','username','email')->findOrFail($memberId);

        $total = (float) CapitalContribution::where('memberId', $memberId)->sum('amount');
        $posted = (float) CapitalContribution::where('memberId', $memberId)
            ->where(function ($q) {
                $q->where('is_Paid', true)->orWhere('status', 'posted');
            })->sum('amount');

        return Inertia::render('Admin/ShareCapitalView', [
            'member' => [
                'id'       => $member->id,
                'name'     => trim("{$member->lastName}, {$member->firstName} {$member->middleName}"),
                'username' => $member->username,
                'email'    => $member->email,
            ],
            'stats' => [
                'total'  => $total,
                'posted' => $posted,
            ],
        ]);
    }

    public function apiMemberContributions(Request $request, int $memberId) {
        $perPage = (int) $request->integer('perPage', 10);
        $page    = max(1, (int) $request->integer('page', 1));

        // --- UPDATED: Added processor relationship ---
        $all = CapitalContribution::with('processor:id,name') 
            ->where('memberId', $memberId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(['id','transactionType','amount','status','is_Paid','reference_number','paid_at','created_at','processed_by']); // Make sure to select processed_by

        $totalNet = 0.0;
        foreach ($all as $r) {
            $amt = (float) abs($r->amount);
            $totalNet += $r->transactionType === 'deposit' ? $amt : -$amt;
        }

        $running = $totalNet;

        $rows = $all->map(function ($r) use (&$running) {
            $credit = $r->transactionType === 'deposit'    ? (float) abs($r->amount) : null;
            $debit  = $r->transactionType === 'withdrawal' ? (float) abs($r->amount) : null;

            $balanceNow = $running;
            $signed     = ($credit ?? 0.0) - ($debit ?? 0.0);
            $running   -= $signed;

            return [
                'id'               => $r->id,
                'date'             => $r->created_at?->toDateString(),
                'datePosted'       => $r->paid_at?->toDateString(),
                'reference_number' => $r->reference_number,
                'credit'           => $credit,
                'debit'            => $debit,
                'balance'          => $balanceNow,
                'status'           => $r->status ?? 'pending',
                // --- NEW: Processor info for frontend ---
                'processor'        => $r->processor ? ['name' => $r->processor->name] : null,
            ];
        });

        $total = $rows->count();
        $last  = (int) ceil(max(1, $total) / max(1, $perPage));
        $paged = $rows->slice(($page - 1) * $perPage, $perPage)->values();

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

    public function storeShareCapital(Request $request) {
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

        $reference = $request->referenceNumber ?: $this->makeShareCapitalReference($memberId);

        $now = now();

        if ($type === 'deposit') {
            $paidAt = $now->day <= 3
                ? $now->copy()
                : $now->copy()->startOfMonth()->addMonth();
        } else {
            $paidAt = $now->copy();
        }

        if ($type === 'withdrawal') {
            $postedBalance = (float) CapitalContribution::where('memberId', $memberId)
                ->where(function ($q) {
                    $q->where('is_Paid', true)
                        ->orWhere('status', 'posted');
                })
                ->sum('amount');

            if ($amount > $postedBalance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Withdrawal amount exceeds available posted balance.',
                    'errors'  => [
                        'amount' => ['Withdrawal amount exceeds available posted balance.'],
                    ],
                ], 422);
            }
        }

        $entry = new CapitalContribution();
        $entry->memberId        = $memberId;
        $entry->transactionType = $type; // Ensure this is saving
        $entry->amount          = $type === 'withdrawal' ? -1 * abs($amount) : abs($amount);
        $entry->reference_number = $reference; 
        $entry->status          = 'posted';
        $entry->is_Paid         = true;
        $entry->paid_at         = $paidAt;
        $entry->processed_by    = Auth::id(); // <--- TRACKING: Save Admin ID
        $entry->save();

        $totalShareCapital = (float) CapitalContribution::sum('amount');

        $postedShareCapital = (float) CapitalContribution::where(function ($q) {
            $q->where('is_Paid', true)->orWhere('status', 'posted');
        })->sum('amount');

        $thisMonthShareCapital = (float) CapitalContribution::whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->sum('amount');

        $contributorCount = (int) CapitalContribution::distinct('memberId')->count('memberId');

        $stats = [
            'totalShareCapital'     => $totalShareCapital,
            'postedShareCapital'    => $postedShareCapital,
            'thisMonthShareCapital' => $thisMonthShareCapital,
            'contributorCount'      => $contributorCount,
        ];

        return response()->json([
            'success'         => true,
            'message'         => 'Transaction recorded.',
            'id'              => $entry->id,
            'referenceNumber' => $reference,
            'paidAt'          => $entry->paid_at?->toDateString(),
            'stats'           => $stats,
        ]);
    }

    private function makeShareCapitalReference(int $memberId): string {
        $ym  = now()->format('Ymd');
        $seq = CapitalContribution::where('memberId', $memberId)
            ->whereYear('created_at', now()->year)
            ->count() + 1;

        return sprintf('SC-%s-%06d', $ym, $seq);
    }

    public function exportCsv(Request $request) {
        // (Keep your existing exportCsv logic intact here)
        $exportDate      = now();
        $formattedHeader = $exportDate->format('d F Y');
        $fileDate        = $exportDate->format('Y-m-d');

        $search   = trim((string) $request->string('search')) ?: null;
        $status   = (string) $request->string('status', 'all') ?: 'all';
        $dateFrom = (string) $request->string('dateFrom') ?: null;
        $dateTo   = (string) $request->string('dateTo') ?: null;

        $base = CapitalContribution::with(['member:id,firstName,middleName,lastName,username'])
            ->where(function ($q) {
                $q->where('is_Paid', true)->orWhere('status', 'posted');
            })
            ->when($status !== 'all', function ($q) use ($status) {
                if ($status === 'posted') {
                    $q->where(function ($w) {
                        $w->where('is_Paid', true)->orWhere('status', 'posted');
                    });
                } elseif ($status === 'failed') {
                    $q->where('status', 'failed');
                }
            })
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
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
                : '—';

            $username = $member ? (string) $member->username : '';

            $balance = (float) $rows->sum('amount');

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
            'Content-Disposition' => 'attachment; filename="share-capital-balance-' . $fileDate . '.csv"',
        ]);
    }
}