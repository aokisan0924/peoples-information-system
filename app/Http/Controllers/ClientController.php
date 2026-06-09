<?php

namespace App\Http\Controllers;

use App\Models\AFPInfo;
use App\Models\BranchService;
use App\Models\CapitalContribution;
use App\Models\Dependent;
use App\Models\EmergencyContact;
use App\Models\IdentificationInfo;
use App\Models\Loan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\ParentsInfo;
use Carbon\Carbon;
use App\Models\SavingsDeposit;
use App\Models\SpouseInfo;
use App\Models\TimeDeposit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\BinaryFileResponse;


class ClientController extends Controller
{
    public function showMemberProfile() {
        $loginMember = Auth::guard('member')->user();

        if (!$loginMember || !$loginMember->member) {
            abort(404);
        }
    
        // 1. EAGER LOAD EVERYTHING IN ONE DATABASE QUERY
        $member = $loginMember->member->load([
            'branchService', 'afpInfo', 'spouseInfo', 'parentsInfo', 
            'identificationInfo', 'emergencyContact', 'dependents'
        ]);
        
        $memberId = $member->id;

        // BASIC INFO
        $basicInfoData = [
            'id' => $member->id,
            'username' => $member->username,
            'firstName' => $member->firstName,
            'middleName' => $member->middleName,
            'lastName' => $member->lastName,
            'suffix' => $member->suffix,
            'nickname' => $member->nickname,
            'accountStatus' => $member->accountStatus,
            'gender' => $member->gender,
            'dob'  => $member->dob,
            'age' => $member->age,
            'religion' => $member->religion,
            'civilStatus' => $member->civilStatus,
            'nationality' => $member->nationality,
            'email' => $member->email,
            'contact' => $member->contact,
            'fullAddress' => $member->fullAddress,
            'region' => $member->region,
            'province' => $member->province,
            'city' => $member->city,
            'barangay' => $member->barangay,
            'profileImage' => $member->profileImage,
        ];
    
        $branchServiceData = $member->branchService ? [
            'branchService' => $member->branchService->branchService,
            'subBranch' => $member->branchService->subBranch,
        ] : null;
    
        $afpData = $member->afpInfo ? [
            'afpsn' => $member->afpInfo->afpsn,
            'rank' => $member->afpInfo->rank,
            'designation' => $member->afpInfo->designation,
            'afpId' => $member->afpInfo->afpId,
            'presentAssignment' => $member->afpInfo->presentAssignment,
            'controlNo' => $member->afpInfo->controlNo,
            'yearsInService' => $member->afpInfo->yearsInService,
            'cadEnlistment' => $member->afpInfo->cadEnlistment,
            'retirementDate' => $member->afpInfo->retirementDate,
            'pensionDate' => $member->afpInfo->pensionDate,
        ] : null;
    
        $spouseData = $member->spouseInfo ? [
            'spouseName' => $member->spouseInfo->spouseName,
            'spouseDob' => $member->spouseInfo->spouseDob,
            'spouseAge' => $member->spouseInfo->spouseAge,
            'dateMarriage' => $member->spouseInfo->dateMarriage
        ] : null;
    
        $parentsData = $member->parentsInfo ? [
            'motherName' => $member->parentsInfo->motherName,
            'motherAge' => $member->parentsInfo->motherAge,
            'fatherName' => $member->parentsInfo->fatherName,
            'fatherAge' => $member->parentsInfo->fatherAge,
        ] : null;
    
        $identificationData = $member->identificationInfo ? [
            'tinNo' => $member->identificationInfo->tinNo,
            'gsisNo' => $member->identificationInfo->gsisNo,
            'crnUmidNo' => $member->identificationInfo->crnUmidNo,
        ] : null;
    
        $emergencyData = $member->emergencyContact ? [
            'contactPersonName' => $member->emergencyContact->contactPersonName,
            'contactPersonAddress' => $member->emergencyContact->contactPersonAddress,
            'contactPersonPhone' => $member->emergencyContact->contactPersonPhone,
            'contactPersonRelation' => $member->emergencyContact->contactPersonRelation,
        ] : null;
    
        // DEPENDENTS
        $dependentsData = $member->dependents->sortBy('dob')->map(function ($dep) {
            return [
                'id' => $dep->id,
                'name' => $dep->name,
                'dob' => $dep->dob,
                'gender' => $dep->gender,
            ];
        })->values();
    
        // RELEASED LOANS
        $releasedLoansData = Loan::where('memberId', $memberId)
            ->whereIn('status', ['released', 'Released', 'RELEASED'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Loan $loan) {
                return [
                    'id' => $loan->id,
                    'loanReference' => $loan->loanReference,
                    'loanType' => $loan->loanType,
                    'loanClassification' => $loan->loanClassification,
                    'status' => $loan->status,
                    'gross' => number_format((float) $loan->gross, 2, '.', ','),
                    'netProceeds' => number_format((float) $loan->netProceeds, 2, '.', ','),
                    'monthlyAmortization' => number_format((float) $loan->monthlyAmortization, 2, '.', ','),
                    'loanAmount' => number_format((float) $loan->loanAmount, 2, '.', ','),
                    'termYears' => (int) $loan->termYears,
                    'releasedDate' => $loan->created_at ? $loan->created_at->format('d M y') : null,
                ];
            });
    
        // ---------------------------------------------------------
        // FINANCIAL LEDGERS 
        // ---------------------------------------------------------
        
        // SHARE CAPITAL
        $shareCapital = CapitalContribution::where('memberId', $memberId)
            ->whereIn('status', ['posted', 'Posted', 'POSTED'])
            ->orderBy('created_at', 'asc')
            ->get();
    
        $runningBalance = 0.0;
        $totalDeposits = 0.0;
        $totalWithdrawals = 0.0;
        $shareRows = [];
    
        foreach ($shareCapital as $capCon) {
            $isDeposit = strtolower($capCon->transactionType) === 'deposit';
            $amountAbs = (float) abs($capCon->amount);
            
            $credit = $isDeposit ? $amountAbs : 0.0;
            $debit = !$isDeposit ? $amountAbs : 0.0;
    
            $runningBalance += ($credit - $debit);
            $totalDeposits += $credit;
            $totalWithdrawals += $debit;
    
            $shareRows[] = [
                'id'  => $capCon->id,
                'transactionType' => $capCon->transactionType,
                'status' => $capCon->status,
                'referenceNumber' => $capCon->reference_number,
                'transactionDate' => $capCon->created_at ? $capCon->created_at->format('d M y') : null,
                'postedDate' => $capCon->paid_at ? \Carbon\Carbon::parse($capCon->paid_at)->format('d M y') : null,
                'debit' => $debit > 0 ? number_format($debit, 2, '.', ',') : null,
                'credit' => $credit > 0 ? number_format($credit, 2, '.', ',') : null,
                'balance' => number_format($runningBalance, 2, '.', ','),
            ];
        }
    
        $shareCapitalData = [
            'rows' => array_reverse($shareRows),
            'summary' => [
                'totalBalance' => number_format($runningBalance, 2, '.', ','),
                'totalDeposits' => number_format($totalDeposits, 2, '.', ','),
                'totalWithdrawals' => number_format($totalWithdrawals, 2, '.', ','),
                'paidCapital' => number_format($runningBalance > 0 ? ($runningBalance / 500) : 0, 2, '.', ','),
            ],
        ];
    
        // SAVINGS DEPOSIT
        $savingsDeposit = SavingsDeposit::where('memberId', $memberId)
            ->whereIn('status', ['posted', 'Posted', 'POSTED'])
            ->orderBy('created_at', 'asc')
            ->get();
    
        $savingsRunningBalance = 0.0;
        $savingsTotalDeposits = 0.0;
        $savingsTotalWithdrawals = 0.0;
        $savingsRow = [];
    
        foreach ($savingsDeposit as $savings) {
            $isDeposit = strtolower($savings->transactionType) === 'deposit';
            $amountAbs = (float) abs($savings->amount);
            
            $credit = $isDeposit ? $amountAbs : 0.0;
            $debit = !$isDeposit ? $amountAbs : 0.0;
    
            $savingsRunningBalance += ($credit - $debit);
            $savingsTotalDeposits += $credit;
            $savingsTotalWithdrawals += $debit;
    
            $savingsRow[] = [
                'id' => $savings->id,
                'transactionType' => $savings->transactionType,
                'status' => $savings->status,
                'referenceNumber' => $savings->referenceNumber,
                'transactionDate' => $savings->created_at ? $savings->created_at->format('d M y') : null,
                'postedDate' => $savings->paidAt ? \Carbon\Carbon::parse($savings->paidAt)->format('d M y') : ($savings->created_at ? $savings->created_at->format('d M y') : null),
                'debit' => $debit > 0 ? number_format($debit, 2, '.', ',') : null,
                'credit' => $credit > 0 ? number_format($credit, 2, '.', ',') : null,
                'balance' => number_format($savingsRunningBalance, 2, '.', ','),
            ];
        }
    
        $savingsData = [
            'rows' => array_reverse($savingsRow),
            'summary' => [
                'totalBalance' => number_format($savingsRunningBalance, 2, '.', ','),
                'totalDeposits' => number_format($savingsTotalDeposits, 2, '.', ','),
                'totalWithdrawals' => number_format($savingsTotalWithdrawals, 2, '.', ','),
            ],
        ];
    
        // TIME DEPOSITS
        $timeDeposits = TimeDeposit::with([
            'interests' => fn($q) => $q->orderBy('yearNumber')->orderBy('creditedDate')->orderBy('id'),
            'withdrawals' => fn($q) => $q->orderBy('withdrawnDate')->orderBy('id')
        ])->where('memberId', $memberId)->orderBy('startDate')->get();
    
        $allTimeDeposits = [];
        $totalPrincipal = 0.0;
        $totalCurrBalance = 0.0;
        $totalAvailInterest = 0.0;
    
        $memberName = trim("{$member->lastName}, {$member->firstName} {$member->middleName}");
    
        foreach ($timeDeposits as $td) {
            $principal = (float) $td->principal;
            $transactions = [];
            $runningBalance = 0.0;
    
            if ($principal > 0) {
                $runningBalance += $principal;
                $transactions[] = [
                    'date' => optional($td->startDate)->toDateString(),
                    'description'  => 'Opening Time Deposit (Principal)',
                    'type' => 'credit',
                    'credit' => $principal,
                    'debit' => 0.0,
                    'balanceAfter' => $runningBalance,
                ];
            }
    
            foreach ($td->interests as $interest) {
                $amount = (float) $interest->interestAmount;
                if ($amount <= 0) continue;
    
                $runningBalance += $amount;
                $yearNumber = $interest->yearNumber ?? null;
    
                $transactions[] = [
                    'date' => optional($interest->creditedDate)->toDateString(),
                    'description' => $yearNumber ? "Interest Credit (Year {$yearNumber})" : 'Interest Credit',
                    'type' => 'credit',
                    'credit' => $amount,
                    'debit' => 0.0,
                    'balanceAfter' => $runningBalance,
                ];
            }
    
            foreach ($td->withdrawals as $withdrawal) {
                $amount = (float) $withdrawal->amount;
                if ($amount <= 0) continue;
    
                $runningBalance -= $amount;
                $remarks = trim((string) ($withdrawal->remarks ?? ''));
                $desc = 'Interest Withdrawal' . ($remarks !== '' ? " - {$remarks}" : '');
    
                $transactions[] = [
                    'date' => optional($withdrawal->withdrawnDate)->toDateString(),
                    'description' => $desc,
                    'type' => 'debit',
                    'credit' => 0.0,
                    'debit' => $amount,
                    'balanceAfter' => $runningBalance,
                ];
            }
    
            usort($transactions, fn($a, $b) => strcmp($a['date'] ?? '', $b['date'] ?? ''));
    
            $sumInterest  = (float) $td->interests->sum('interestAmount');
            $sumWithdrawn = (float) $td->withdrawals->sum('amount');
            $currBalance  = $runningBalance;
            $availInterest= max(0.0, $sumInterest - $sumWithdrawn);
            
            $totalPrincipal += $principal;
            $totalCurrBalance += $currBalance;
            $totalAvailInterest  += $availInterest;
    
            $allTimeDeposits[] = [
                'summary' => [
                    'timeDepositId' => $td->id,
                    'timeDepositCode'  => 'TD-' . str_pad((string) $td->id, 4, '0', STR_PAD_LEFT),
                    'memberName' => $memberName,
                    'username' => $member->username,
                    'principal' => number_format($principal, 2, '.', ','),
                    'currentBalance' => number_format($currBalance, 2, '.', ','),
                    'totalInterest' => number_format(max(0.0, $currBalance - $principal), 2, '.', ','),
                    'availableInterest' => number_format($availInterest, 2, '.', ','),
                    'termYears' => (int) $td->termYears,
                    'interestRate' => number_format((float) $td->interestRate, 2, '.', ',') . ' %',
                    'startDate' => $td->startDate ? $td->startDate->format('d M y') : null,
                    'maturityDate' => $td->maturityDate ? $td->maturityDate->format('d M y') : null,
                    'creditedYears' => (int) $td->creditedYears,
                ],
                'transactions' => array_map(function (array $t) {
                    $date = $t['date'] ?? null;
                    return [
                        'date' => $date ? \Carbon\Carbon::parse($date)->format('d M y') : null,
                        'description' => $t['description'] ?? '',
                        'type' => $t['type'] ?? null,
                        'debit' => ($t['debit'] ?? 0.0) > 0 ? number_format((float) $t['debit'], 2, '.', ',') : null,
                        'credit' => ($t['credit'] ?? 0.0) > 0 ? number_format((float) $t['credit'], 2, '.', ',') : null,
                        'balance' => number_format((float) ($t['balanceAfter'] ?? 0.0), 2, '.', ','),
                    ];
                }, $transactions),
            ];
        }
    
        return Inertia::render('Client/ClientProfile', [
            'MemberData' => [
                'basicInfoData' => $basicInfoData,
                'branchServiceData' => $branchServiceData,
                'afpData' => $afpData,
                'spouseData' => $spouseData,
                'parentsData' => $parentsData,
                'identificationData' => $identificationData,
                'emergencyData' => $emergencyData,
                'dependentsData' => $dependentsData,
                'releasedLoansData' => $releasedLoansData,
                'shareCapitalData' => $shareCapitalData,
                'savingsData' => $savingsData,
                'timeDepositData' => [
                    'summaryAll' => [
                        'totalPrincipal' => number_format($totalPrincipal, 2, '.', ','),
                        'totalCurrentBalance' => number_format($totalCurrBalance, 2, '.', ','),
                        'totalAvailableInterest' => number_format($totalAvailInterest, 2, '.', ','),
                        'totalCount' => count($allTimeDeposits),
                    ],
                    'deposits' => $allTimeDeposits,
                ],
            ],
        ]);
    }

    public function updateBasicInfo(Request $request) {
        $loginMember = Auth::guard('member')->user();

        if (!$loginMember || !$loginMember->member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $member = $loginMember->member;

        $v = Validator::make($request->all(), [
            'firstName'   => ['required', 'string', 'max:100'],
            'lastName'    => ['required', 'string', 'max:100'],
            'middleName'  => ['nullable', 'string', 'max:100'],
            'suffix'      => ['nullable', 'string', 'max:10'],
            'nickname'    => ['nullable', 'string', 'max:100'],
            'gender'      => ['required', 'string'],
            'dob'         => ['required', 'date'],
            'religion'    => ['nullable', 'string', 'max:100'],
            'civilStatus' => ['nullable', 'string', 'max:100'],
            'nationality' => ['nullable', 'string', 'max:100'],
            'email'       => ['required', 'email'],
            'contact'     => ['nullable', 'string', 'max:20'],
            'fullAddress' => ['nullable', 'string', 'max:255'],
            'region'      => ['nullable', 'string', 'max:100'],
            'province'    => ['nullable', 'string', 'max:100'],
            'city'        => ['nullable', 'string', 'max:100'],
            'barangay'    => ['nullable', 'string', 'max:100'],
        ]);

        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $v->errors(),
            ], 422);
        }

        $payload = $request->all();

        if (!empty($payload['dob'])) {
            $payload['age'] = Carbon::parse($payload['dob'])->age;
        }

        $member->forceFill($payload)->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully',
        ]);
    }

    public function updateBranchService(Request $request) {
        $loginMember = Auth::guard('member')->user();

        if (!$loginMember || !$loginMember->member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $member = $loginMember->member;
    
        $v = Validator::make($request->all(), [
            'branchService' => ['required', 'string', 'max:100'],
            'subBranch'     => ['nullable', 'string', 'max:100'],
        ]);
    
        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $v->errors(),
            ], 422);
        }
    
        $validated = $v->validated();
    
        $member->branchService()->updateOrCreate(
            ['memberId' => $member->id],
            $validated
        );
    
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully.',
        ]);
    }

    public function updateIdentificationInfo(Request $request) {
        $loginMember = Auth::guard('member')->user();

        if (!$loginMember || !$loginMember->member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $member = $loginMember->member;

        $v = Validator::make($request->all(), [
            'tinNo' => ['required','string','max:50'],
            'gsisNo' => ['nullable','string','max:50'],
            'crnUmidNo' => ['nullable','string','max:50']
        ]);
    
        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $v->errors(),
            ], 422);
        }
    
        $validated = $v->validated();
    
        $member->IdentificationInfo()->updateOrCreate(
            ['memberId' => $member->id],
            $validated
        );
    
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully.',
        ]);
    }

    public function updateAfpInfo(Request $request) {
        $loginMember = Auth::guard('member')->user();

        if (!$loginMember || !$loginMember->member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $member = $loginMember->member;
    
        $v = Validator::make($request->all(), [
            'afpsn'             => ['nullable', 'string', 'max:100'],
            'rank'              => ['nullable', 'string', 'max:100'],
            'designation'       => ['nullable', 'string', 'max:150'],
            'afpId'             => ['nullable', 'string', 'max:100'],
            'presentAssignment' => ['nullable', 'string', 'max:150'],
            'controlNo'         => ['nullable', 'string', 'max:100'],
            'yearsInService'    => ['nullable', 'string', 'max:50'],
            'cadEnlistment'     => ['nullable', 'date'],
            'retirementDate'    => ['nullable', 'date'],
            'pensionDate'       => ['nullable', 'date'],
        ]);
    
        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $v->errors(),
            ], 422);
        }
    
        $data = $v->validated();
        $member->afpInfo()->updateOrCreate(
            ['memberId' => $member->id],
            $data
        );
    
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully.',
        ]);
    }

    public function updateSpouseInfo(Request $request) {
        $loginMember = Auth::guard('member')->user();

        if (!$loginMember || !$loginMember->member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $member = $loginMember->member;
    
        $v = Validator::make($request->all(), [
            'spouseName'   => ['required', 'string', 'max:50'],
            'spouseDob'    => ['nullable', 'date'],
            'dateMarriage' => ['nullable', 'date'],
        ]);
    
        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $v->errors(),
            ], 422);
        }
    
        $validated = $v->validated();
        $validated['spouseAge'] = Carbon::parse($validated['spouseDob'])->age;
    
        $member->SpouseInfo()->updateOrCreate(
            ['memberId' => $member->id],
            $validated
        );
    
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully.',
        ]);
    }

    public function updateParentsInfo(Request $request) {
        $loginMember = Auth::guard('member')->user();

        if (!$loginMember || !$loginMember->member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $member = $loginMember->member;

        $v = Validator::make($request->all(), [
            'fatherName' => ['required', 'string', 'max:50'],
            'fatherAge' => ['nullable', 'int'],
            'motherName' => ['required', 'string', 'max:50'],
            'motherAge' => ['nullable','int'],
        ]);
    
        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $v->errors(),
            ], 422);
        }
    
        $validated = $v->validated();
    
        $member->ParentsInfo()->updateOrCreate(
            ['memberId' => $member->id],
            $validated
        );
    
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully.',
        ]);
    }

    public function updateEmergencyInfo(Request $request) {
        $loginMember = Auth::guard('member')->user();

        if (!$loginMember || !$loginMember->member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $member = $loginMember->member;

        $v = Validator::make($request->all(), [
            'contactPersonName' => ['required','string','max:50'],
            'contactPersonAddress' => ['required','string','max:50'],
            'contactPersonPhone' => ['required','string','max:50'],
            'contactPersonRelation' => ['nullable','string','max:50']
        ]);
    
        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $v->errors(),
            ], 422);
        }
    
        $validated = $v->validated();
    
        $member->EmergencyContact()->updateOrCreate(
            ['memberId' => $member->id],
            $validated
        );
    
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully.',
        ]);
    }

    public function updateDependents(Request $request) {
        $loginMember = Auth::guard('member')->user();

        if (!$loginMember || !$loginMember->member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $member = $loginMember->member;
    
        $v = Validator::make($request->all(), [
            'dependents'          => ['required', 'array', 'min:1'],
            'dependents.*.id'     => ['nullable', 'integer', 'exists:dependents,id'],
            'dependents.*.name'   => ['required', 'string', 'max:100'],
            'dependents.*.dob'    => ['required', 'date'],
            'dependents.*.gender' => ['required', 'in:Male,Female'],
        ]);
    
        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $v->errors(),
            ], 422);
        }
    
        $validated    = $v->validated();
        $submittedIds = [];
    
        foreach ($validated['dependents'] as $row) {
            $payload = [
                'name'   => $row['name'],
                'dob'    => Carbon::parse($row['dob'])->toDateString(),
                'gender' => $row['gender'],
            ];
    
            if (!empty($row['id'])) {
                $member->dependents()->where('id', $row['id'])->update($payload);
                $submittedIds[] = $row['id'];
            } else {
                $new = $member->dependents()->create($payload);
                $submittedIds[] = $new->id;
            }
        }

        $member->dependents()->whereNotIn('id', $submittedIds)->delete();
    
        return response()->json([
            'success' => true,
            'message' => 'Dependents updated successfully.',
        ]);
    }

    public function updateProfilePhoto(Request $request) {
        $loginMember = Auth::guard('member')->user();

        if (!$loginMember || !$loginMember->member) {
            return response()->json([
                'success' => false,
                'message' => 'Member profile not found.',
            ], 404);
        }

        $member = $loginMember->member;

        $validated = $request->validate([
            'profileImage' => ['required', 'image', 'max:2048'], // 2MB
        ]);

        $file = $validated['profileImage'];

        // Store in public disk in a dedicated folder
        $path = $file->store('profile_images', 'public');

        // Delete old image if present
        if (!empty($member->profileImage) && Storage::disk('public')->exists($member->profileImage)) {
            Storage::disk('public')->delete($member->profileImage);
        }

        $member->profileImage = $path;
        $member->save();

        return response()->json([
            'success'         => true,
            'message'         => 'Profile photo updated.',
            'profileImage'    => $path,
            'profileImageUrl' => route('member.showProfilePhoto'),
        ]);
    }

    public function showProfilePhoto(): BinaryFileResponse{
        $loginMember = Auth::guard('member')->user();

        if (!$loginMember || !$loginMember->member) {
            abort(404);
        }

        $member = $loginMember->member;

        if (empty($member->profileImage) || !Storage::disk('public')->exists($member->profileImage)) {
            abort(404);
        }

        $fullPath = Storage::disk('public')->path($member->profileImage);

        return response()->file($fullPath);
    }
}