<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\TimeDeposit;
use App\Models\TimeDepositInterest;
use App\Models\TimeDepositWithdrawal;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TimeDepositController extends Controller
{
    private function getInterestRateDecimal(int $termYears): float {
        return match ($termYears) {
            1 => 0.063,
            2 => 0.065,
            3 => 0.070,
            4 => 0.073,
            5 => 0.075,
            default => 0.0,
        };
    }

    private function getInterestRatePercent (int $termYears): float {
        return $this->getInterestRateDecimal($termYears) * 100.0;
    }

    private function computeMaturityValue(float $principal, int $termYears): float {
        $r = $this->getInterestRateDecimal($termYears);

        return round($principal * pow(1 + $r, $termYears), 2);
    }

    public function showtimeDepositPage(Request $request) {
        $search   = (string) $request->query('search', '');
        $dateFrom = (string) $request->query('dateFrom', '');
        $dateTo   = (string) $request->query('dateTo', '');
        $perPage  = (int) $request->query('perPage', 10);

        $totalPrincipal = (float) TimeDeposit::query()->sum('principal');
        $totalMaturity  = (float) TimeDeposit::query()->sum('maturityValue');
        $thisYearDeposits = (float) TimeDeposit::query()
            ->whereYear('startDate', now()->year)
            ->sum('principal');
        $depositorCount = (int) TimeDeposit::query()
            ->distinct('memberId')
            ->count('memberId');

        $stats = [
            'totalTimeDepositPrincipal' => $totalPrincipal,
            'totalTimeDepositMaturity'  => $totalMaturity,
            'thisYearTimeDeposit'       => $thisYearDeposits,
            'depositorCount'            => $depositorCount,
        ];

        $defaults = [
            'search'   => $search,
            'dateFrom' => $dateFrom,
            'dateTo'   => $dateTo,
            'perPage'  => $perPage,
        ];

        return Inertia::render('Admin/TimeDeposit', [
            'stats'    => $stats,
            'defaults' => $defaults,
        ]);
    }

    public function apiIndex(Request $request) {
        $search   = (string) $request->query('search', '');
        $dateFrom = (string) $request->query('dateFrom', '');
        $dateTo   = (string) $request->query('dateTo', '');
        $perPage  = (int) $request->integer('perPage', 10);

        $query = TimeDeposit::query()->with('member');

        if ($search !== '') {
            $query->whereHas('member', function ($q) use ($search) {
                $q->where('firstName', 'like', "%{$search}%")
                    ->orWhere('lastName', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($dateFrom !== '') {
            $query->whereDate('startDate', '>=', $dateFrom);
        }

        if ($dateTo !== '') {
            $query->whereDate('startDate', '<=', $dateTo);
        }

        $paginator = $query
            ->orderByDesc('startDate')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->appends($request->query());

        $rows = $paginator->getCollection()->map(function (TimeDeposit $td) {
            $member = $td->member;
            $memberName = $member
                ? trim("{$member->lastName}, {$member->firstName} {$member->middleName}")
                : 'Unknown Member';

            return [
                'id'            => $td->id,
                'memberId'      => $td->memberId,
                'memberName'    => $memberName,
                'username'      => $member->username ?? null,
                'principal'     => (float) $td->principal,
                'termYears'     => (int) $td->termYears,
                'interestRate'  => (float) $td->interestRate,
                'maturityValue' => (float) $td->maturityValue,
                'startDate'     => optional($td->startDate)->toDateString(),
                'maturityDate'  => optional($td->maturityDate)->toDateString(),
            ];
        });

        $meta = [
            'currentPage' => $paginator->currentPage(),
            'lastPage'    => $paginator->lastPage(),
            'perPage'     => $paginator->perPage(),
            'total'       => $paginator->total(),
        ];

        return response()->json([
            'rows' => $rows,
            'meta' => $meta,
        ]);
    }

    public function apiMembersMin(Request $request) {
        $search = (string) $request->query('search', '');

        $query = Member::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('firstName', 'like', "%{$search}%")
                    ->orWhere('lastName', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        $members = $query
            ->orderBy('lastName')
            ->orderBy('firstName')
            ->limit(200)
            ->get();

        $rows = $members->map(function (Member $m) {
            $label = trim("{$m->lastName}, {$m->firstName} {$m->middleName}");
            if (!empty($m->username)) {
                $label .= " ({$m->username})";
            }

            return [
                'id'    => $m->id,
                'label' => $label,
            ];
        });

        return response()->json([
            'rows' => $rows,
        ]);
    }

    public function storeTimeDeposit(Request $request) {
        $data = $request->validate([
            'memberId'  => ['required', 'integer', 'exists:members,id'],
            'principal' => ['required', 'numeric', 'min:1000'],
            'termYears' => ['required', 'integer', 'min:1', 'max:5'],
            'startDate' => ['required', 'date'],
        ]);

        $memberId  = (int) $data['memberId'];
        $principal = (float) $data['principal'];
        $termYears = (int) $data['termYears'];
        $startDate = Carbon::parse($data['startDate']);

        $interestRatePercent = $this->getInterestRatePercent($termYears);
        if ($interestRatePercent <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid term selected.',
            ], 422);
        }

        $maturityValue = $this->computeMaturityValue($principal, $termYears);
        $maturityDate  = $startDate->copy()->addYears($termYears);

        TimeDeposit::create([
            'memberId'      => $memberId,
            'principal'     => $principal,
            'termYears'     => $termYears,
            'creditedYears' => 0,
            'interestRate'  => $interestRatePercent,
            'startDate'     => $startDate,
            'maturityDate'  => $maturityDate,
            'maturityValue' => $maturityValue,
        ]);

        $totalPrincipal = (float) TimeDeposit::query()->sum('principal');
        $totalMaturity  = (float) TimeDeposit::query()->sum('maturityValue');
        $thisYearDeposits = (float) TimeDeposit::query()
            ->whereYear('startDate', now()->year)
            ->sum('principal');
        $depositorCount = (int) TimeDeposit::query()
            ->distinct('memberId')
            ->count('memberId');

        $stats = [
            'totalTimeDepositPrincipal' => $totalPrincipal,
            'totalTimeDepositMaturity'  => $totalMaturity,
            'thisYearTimeDeposit'       => $thisYearDeposits,
            'depositorCount'            => $depositorCount,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Time deposit created successfully.',
            'stats'   => $stats,
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse {
        $search = (string) $request->query('search', '');
        $dateFrom = (string) $request->query('dateFrom', '');
        $dateTo = (string) $request->query('dateTo', '');

        $query = TimeDeposit::query()->with('member');

        if ($search !== '') {
            $query->whereHas('member', function ($q) use ($search) {
                $q->where('firstName', 'like', "%{$search}")
                    ->orWhere('lastName', 'like', "%{$search}")
                    ->orWhere('username', 'like', "%{$search}");
            });
        }

        if ($dateFrom !== '') {
            $query->whereDate('startDate', '>=', $dateFrom);
        }

        if ($dateTo !== '') {
            $query->whereDate('startDate', '<=', $dateTo);
        }

        $fileName = 'time-deposit.csv';

        return new StreamedResponse(function () use ($query) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Member',
                'Username',
                'Principal',
                'Term (years)',
                'Interest Rate (%)',
                'Start Date',
                'Maturity Date',
                'Maturity Value',
            ]);

            $query->orderBy('memberId')->chunk(500, function ($chunk) use ($handle) {
                foreach ($chunk as $td) {
                    $member = $td->member;
                    $memberName = $member
                        ? trim("{$member->lastName}, {$member->firstName}, {$member->middleName}, {$member->suffix}")
                        : 'Unknown Member';
    
                    fputcsv($handle, [
                        $memberName,
                        $member->username ?? '',
                        $td->principal,
                        $td->termYears,
                        $td->interestRate,
                        optional($td->startDate)->toDateString(),
                        optional($td->maturityDate)->toDateString(),
                        $td->maturityValue
                    ]);
                }
            });

            fclose($handle);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    public function showMemberTimeDeposit(int $id) {
        $deposit = TimeDeposit::with([
            'member',
            'interests' => function ($q) {
                $q->orderBy('yearNumber')->orderBy('creditedDate')->orderBy('id');
            },
            'withdrawals' => function ($q) {
                $q->orderBy('withdrawnDate')->orderBy('id');
            },
        ])->findOrFail($id);

        $member = $deposit->member;

        $memberName = $member
            ? trim("{$member->lastName}, {$member->firstName} {$member->middleName}")
            : 'Unknown Member';

        $username = $member->username ?? null;

        $transactions = [];
        $runningBalance = 0.0;

        // Opening principal (CREDIT) – principal is locked
        $principal = (float) $deposit->principal;
        if ($principal > 0) {
            $runningBalance += $principal;

            $transactions[] = [
                'date'         => optional($deposit->startDate)->toDateString(),
                'description'  => 'Opening Time Deposit (Principal)',
                'type'         => 'credit',
                'credit'       => $principal,
                'debit'        => 0.0,
                'balanceAfter' => $runningBalance,
            ];
        }

        // Yearly interest credits
        foreach ($deposit->interests as $interest) {
            $interestAmount = (float) $interest->interestAmount;
            $runningBalance += $interestAmount;

            $transactions[] = [
                'date'         => optional($interest->creditedDate)->toDateString(),
                'description'  => "Year {$interest->yearNumber} Interest",
                'type'         => 'credit',
                'credit'       => $interestAmount,
                'debit'        => 0.0,
                'balanceAfter' => $runningBalance,
            ];
        }

        // Interest withdrawals (DEBIT) – only from interest, principal remains locked
        foreach ($deposit->withdrawals as $w) {
            $amount = (float) $w->amount;
            $runningBalance -= $amount;

            $desc = 'Interest Withdrawal';
            if (!empty($w->remarks)) {
                $desc .= " - {$w->remarks}";
            }

            $transactions[] = [
                'date'         => optional($w->withdrawnDate)->toDateString(),
                'description'  => $desc,
                'type'         => 'debit',
                'credit'       => 0.0,
                'debit'        => $amount,
                'balanceAfter' => $runningBalance,
            ];
        }

        usort($transactions, function ($a, $b) {
            return strcmp($a['date'] ?? '', $b['date'] ?? '');
        });

        $totalInterest = (float) TimeDepositInterest::query()
            ->where('timeDepositId', $deposit->id)
            ->sum('interestAmount');

        $totalInterestWithdrawn = (float) TimeDepositWithdrawal::query()
            ->where('timeDepositId', $deposit->id)
            ->sum('amount');

        $currentBalance = $runningBalance;
        $availableInterest = max(0.0, $totalInterest - $totalInterestWithdrawn);

        $summary = [
            'memberName'        => $memberName,
            'username'          => $username,
            'principal'         => $principal,
            'currentBalance'    => $currentBalance,
            'totalInterest'     => max(0.0, $currentBalance - $principal),
            'termYears'         => (int) $deposit->termYears,
            'interestRate'      => (float) $deposit->interestRate,
            'startDate'         => optional($deposit->startDate)->toDateString(),
            'maturityDate'      => optional($deposit->maturityDate)->toDateString(),
            'creditedYears'     => (int) $deposit->creditedYears,
            'availableInterest' => $availableInterest,
        ];

        return Inertia::render('Admin/TimeDepositView', [
            'deposit'      => [
                'id'       => $deposit->id,
                'memberId' => $deposit->memberId,
                'summary'  => $summary,
            ],
            'transactions' => $transactions,
        ]);
    }

    public function withdrawInterest(Request $request, int $memberId) {
        $data = $request->validate([
            'amount'   => ['required', 'numeric', 'min:0.01'],
            'remarks'  => ['nullable', 'string', 'max:255'],
            'date'     => ['nullable', 'date'],
        ]);

        $deposit = TimeDeposit::with(['interests', 'withdrawals'])->findOrFail($memberId);

        $amount = (float) $data['amount'];
        $withdrawnDate = !empty($data['date'])
            ? Carbon::parse($data['date'])
            : Carbon::today();

        $totalInterest = (float) TimeDepositInterest::query()
            ->where('timeDepositId', $deposit->id)
            ->sum('interestAmount');

        $totalInterestWithdrawn = (float) TimeDepositWithdrawal::query()
            ->where('timeDepositId', $deposit->id)
            ->sum('amount');

        $availableInterest = max(0.0, $totalInterest - $totalInterestWithdrawn);

        if ($amount > $availableInterest) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal exceeds available interest. Principal is locked until term end.',
            ], 422);
        }

        TimeDepositWithdrawal::create([
            'timeDepositId' => $deposit->id,
            'amount'        => $amount,
            'withdrawnDate' => $withdrawnDate,
            'remarks'       => $data['remarks'] ?? null,
        ]);

        return $this->viewJson($deposit->id);
    }

    private function viewJson(int $memberId) {
        $deposit = TimeDeposit::with([
            'member',
            'interests' => function ($q) {
                $q->orderBy('yearNumber')->orderBy('creditedDate')->orderBy('id');
            },
            'withdrawals' => function ($q) {
                $q->orderBy('withdrawnDate')->orderBy('id');
            },
        ])->findOrFail($memberId);

        $member = $deposit->member;

        $memberName = $member
            ? trim("{$member->lastName}, {$member->firstName} {$member->middleName}")
            : 'Unknown Member';

        $username = $member->username ?? null;

        $transactions = [];
        $runningBalance = 0.0;

        $principal = (float) $deposit->principal;
        if ($principal > 0) {
            $runningBalance += $principal;
            $transactions[] = [
                'date'         => optional($deposit->startDate)->toDateString(),
                'description'  => 'Opening Time Deposit (Principal)',
                'type'         => 'credit',
                'credit'       => $principal,
                'debit'        => 0.0,
                'balanceAfter' => $runningBalance,
            ];
        }

        foreach ($deposit->interests as $interest) {
            $interestAmount = (float) $interest->interestAmount;
            $runningBalance += $interestAmount;

            $transactions[] = [
                'date'         => optional($interest->creditedDate)->toDateString(),
                'description'  => "Year {$interest->yearNumber} Interest",
                'type'         => 'credit',
                'credit'       => $interestAmount,
                'debit'        => 0.0,
                'balanceAfter' => $runningBalance,
            ];
        }

        foreach ($deposit->withdrawals as $w) {
            $amount = (float) $w->amount;
            $runningBalance -= $amount;

            $desc = 'Interest Withdrawal';
            if (!empty($w->remarks)) {
                $desc .= " - {$w->remarks}";
            }

            $transactions[] = [
                'date'         => optional($w->withdrawnDate)->toDateString(),
                'description'  => $desc,
                'type'         => 'debit',
                'credit'       => 0.0,
                'debit'        => $amount,
                'balanceAfter' => $runningBalance,
            ];
        }

        usort($transactions, function ($a, $b) {
            return strcmp($a['date'] ?? '', $b['date'] ?? '');
        });

        $totalInterest = (float) TimeDepositInterest::query()
            ->where('timeDepositId', $deposit->id)
            ->sum('interestAmount');

        $totalInterestWithdrawn = (float) TimeDepositWithdrawal::query()
            ->where('timeDepositId', $deposit->id)
            ->sum('amount');

        $currentBalance = $runningBalance;
        $availableInterest = max(0.0, $totalInterest - $totalInterestWithdrawn);

        $summary = [
            'memberName'        => $memberName,
            'username'          => $username,
            'principal'         => $principal,
            'currentBalance'    => $currentBalance,
            'totalInterest'     => max(0.0, $currentBalance - $principal),
            'termYears'         => (int) $deposit->termYears,
            'interestRate'      => (float) $deposit->interestRate,
            'startDate'         => optional($deposit->startDate)->toDateString(),
            'maturityDate'      => optional($deposit->maturityDate)->toDateString(),
            'creditedYears'     => (int) $deposit->creditedYears,
            'availableInterest' => $availableInterest,
        ];

        return response()->json([
            'success'      => true,
            'summary'      => $summary,
            'transactions' => $transactions,
        ]);
    }
}
