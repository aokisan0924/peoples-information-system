<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccBankRecord;
use App\Models\AccChartOfAccount;
use App\Models\AccEWallet;
use App\Models\AccPettyCashFund;
use App\Models\AFPInfo;
use App\Models\BranchService;
use App\Models\CapitalContribution;
use App\Models\Dependent;
use App\Models\EmergencyContact;
use App\Models\IdentificationInfo;
use App\Models\Loan;
use App\Models\Member;
use App\Models\MembershipPayment;
use App\Models\ParentsInfo;
use App\Models\SavingsDeposit;
use App\Models\SpouseInfo;
use App\Models\TimeDeposit;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MemberController extends Controller
{
    public function showMemberPage() {
        $totalActiveMembers = BranchService::whereIn('branchService', ['ACTIVE MILITARY', 'Active Military', 'active military'])->count();
        $totalRetiredMembers = BranchService::whereIn('branchService', ['RETIRED MILITARY', 'Retired Military', 'retired military'])->count();
        $totalPmpcMembers = BranchService::whereIn('branchService', ['PMPC', 'Pmpc', 'pmpc'])->count();
        $totalBeneficiaryMembers = BranchService::whereIn('branchService', ['BENEFICIARY', 'Beneficiary', 'beneficiary'])->count();
        $totalCivilianMembers = BranchService::whereIn('branchService', ['CIVILIAN EMPLOYEES', 'Civilian Employees', 'civilian employees', 'civ emp'])->count();
        $totalCdeaMembers = BranchService::whereIn('branchService', ['Cdea', 'CDEA', 'cdea', 'DND', 'Dnd', 'dnd'])->count();

        // ADD THIS: Calculate the true total member count
        $totalMembersCount = Member::count();

        $rawMembers = Member::query()
            ->leftJoin('afp_infos', 'afp_infos.memberId', '=', 'members.id')
            ->leftJoin('branch_services', 'branch_services.memberId', '=', 'members.id')
            ->select(
                'members.id',
                'members.username',
                'members.firstName',
                'members.middleName',
                'members.lastName',
                'members.suffix',
                'afp_infos.afpsn',
                'branch_services.branchService'
            )
            ->orderByDesc('members.username')
            ->get();

        $members = $rawMembers->map(function ($member) {
            return [
                'id'            => $member->id,
                'username'      => $member->username,
                'firstName'     => $member->firstName,
                'middleName'    => $member->middleName,
                'lastName'      => $member->lastName,
                'suffix'        => $member->suffix,
                'afpsn'         => $member->afpsn,
                'branchService' => $member->branchService,
            ];
        });

        return Inertia::render('Admin/Members', [
            'memberSummary' => [
                'total'           => $totalMembersCount,
                'activeMilitary'  => $totalActiveMembers,
                'retiredMilitary' => $totalRetiredMembers,
                'pmpc'            => $totalPmpcMembers,
                'beneficiary'     => $totalBeneficiaryMembers,
                'civilian'        => $totalCivilianMembers,
                'cdea'            => $totalCdeaMembers
            ],
            'members' => $members,
        ]);
    }

    public function store(Request $request) {
        $validated = $request->validate([
            // Profile fields
            'lastName'      => ['required', 'string', 'max:255'],
            'firstName'     => ['required', 'string', 'max:255'],
            'dob'           => ['required', 'date'],
            'email'         => ['required', 'email', 'max:255'],
            'gender'        => ['required', 'string', 'max:20', 'in:Male,Female'],
            'contact'       => ['required', 'string', 'max:20'],
            // Payment fields
            'membershipFee'   => ['required', 'numeric', 'min:0'],
            'shareCapital'    => ['required', 'numeric', 'min:0'],
            'savingsDeposit'  => ['nullable', 'numeric', 'min:0'],
            'paymentMethod'   => ['required', 'string', 'in:cash,bank,e-wallet'],
            'referenceNumber' => ['required', 'string', 'max:150']
        ]);

        $officeBranch = trim((string) Auth::guard('admin')->user()?->branch);
        if ($officeBranch === '') {
            return response()->json([
                'message' => 'Your admin account must have an office branch before registering a member.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $plainPassword = Str::random(10);
            $validated['password'] = bcrypt($plainPassword);
            $validated['branch'] = $officeBranch;

            $member = Member::create($validated);

            $username = 'PMPC-' . str_pad((string) $member->id, 3, '0', STR_PAD_LEFT);
            $member->username = $username;
            $member->age = Carbon::parse($validated['dob'])->age;
            $member->save();

            $totalAmount = $request->membershipFee + $request->shareCapital + ($request->savingsDeposit ?? 0);
            $particulars = "New Member Initial Deposit: Membership Fee: " . number_format($request->membershipFee, 2) . 
                        ", Share Capital: " . number_format($request->shareCapital, 2) . 
                        ", Savings Deposit: " . number_format($request->savingsDeposit ?? 0, 2);
            $branch = $officeBranch;

            if ($request->paymentMethod === 'cash') {
                AccPettyCashFund::create([
                    'branch' => $branch,
                    'transactionDate' => now()->toDateString(),
                    'orNumber' => $request->referenceNumber,
                    'particulars' => $particulars,
                    'debit' => $totalAmount, 
                    'credit' => 0,
                    'is_posted' => false,
                ]);
            } elseif ($request->paymentMethod === 'e-wallet') {
                AccEWallet::create([
                    'branch' => $branch,
                    'transactionDate' => now()->toDateString(),
                    'referenceNo' => $request->referenceNumber,
                    'particulars' => $particulars,
                    'walletType' => 'GCash/Maya',
                    'debit' => $totalAmount, 
                    'credit' => 0,
                    'is_posted' => false,
                ]);
            } else {
                $bankAccounts = AccChartOfAccount::where('accountName', 'LIKE', '%Bank%')->get();
                $userBranchStr = strtolower($branch);
                
                if (str_contains($userBranchStr, 'cubao')) {
                    $selectedBank = $bankAccounts->filter(fn($b) => str_contains(strtolower($b->accountName), 'aguinaldo'))->first();
                } elseif (str_contains($userBranchStr, 'magsaysay') || str_contains($userBranchStr, 'fort')) {
                    $selectedBank = $bankAccounts->filter(fn($b) => str_contains(strtolower($b->accountName), 'fort mag'))->first();
                } else {
                    $selectedBank = $bankAccounts->filter(fn($b) => str_contains(strtolower($b->accountName), 'ilagan'))->first();
                }

                AccBankRecord::create([
                    'branch' => $branch,
                    'bank_account_code' => $selectedBank ? $selectedBank->accountCode : '', 
                    'transaction_date' => now()->toDateString(),
                    'reference_no' => $request->referenceNumber,
                    'particulars' => $particulars,
                    'debit' => 0,
                    'credit' => $totalAmount,
                    'is_journalized' => false,
                ]);
            }

            $refNumber = $request->referenceNumber;

            if ($request->membershipFee > 0) {
                MembershipPayment::create([
                    'memberId' => $member->id,
                    'amount' => $request->membershipFee,
                    'reference_number' => $refNumber,
                    'is_paid' => true,
                    'paid_at' => now(),
                ]);
            }

            if ($request->shareCapital > 0) {
                CapitalContribution::create([
                    'memberId' => $member->id,
                    'date' => now()->toDateString(),
                    'reference_number' => $refNumber,
                    'amount' => $request->shareCapital,
                    'transactionType' => 'deposit',
                    'is_paid' => true,
                    'status' => 'Posted',
                    'processed_by' => $request->user()->id,
                    'paid_at' => now()->toDateString()
                ]);
            }

            if ($request->savingsDeposit > 0) {
                SavingsDeposit::create([
                    'memberId' => $member->id,
                    'date' => now()->toDateString(),
                    'referenceNumber' => $refNumber,
                    'amount' => $request->savingsDeposit,
                    'transactionType' => 'deposit',
                    'status' => 'Posted',
                    'isPaid' => true,
                    'paidAt' => now(),
                    'processed_by' => $request->user()->id
                ]);
            }

            DB::commit();

            if (!empty($member->email)) {
                $emailBody =
                    "Welcome to People's Multi-Purpose Cooperative!\n\n" .
                    "Your PMPC Online Access credentials are ready.\n\n" .
                    "Login Link: https://peoplesmpcoop.com/\n\n" .
                    "USERNAME: {$member->username}\n" .
                    "PASSWORD: {$plainPassword}\n\n" .
                    "-----------------------------------------\n" .
                    " DO'S AND DON'TS (IMPORTANT)\n" .
                    "-----------------------------------------\n" .
                    "✔ DO change your password immediately after logging in.\n" .
                    "✔ DO keep your username and password confidential.\n" .
                    "✔ DO report any suspicious activity to PMPC Admin.\n\n" .
                    "✘ DON'T share your login details with anyone.\n" .
                    "✘ DON'T use easily guessed passwords (e.g., birthdays).\n" .
                    "✘ DON'T log in on public or untrusted devices.\n\n" .
                    "This account is strictly for your personal use. Protect your credentials at all times.\n\n" .
                    "Thank you for being part of PMPC!";

                Mail::raw($emailBody, function ($message) use ($member) {
                    $message->to($member->email)
                        ->subject('Your PMPC Login Credentials & Important Reminders');
                });
            }

            $contact = $member->contactNumber ?? $member->contact;

            if (!empty($contact)) {
                $number  = trim($contact);
                $digits  = preg_replace('/\D+/', '', $number);
                $formattedNumber = preg_replace('/^0/', '63', $digits);

                $smsMessage =
                    "Welcome to People's Multi-Purpose Cooperative!\n\n" .
                    "Your PMPC Online Access credentials are ready.\n\n" .
                    "USERNAME: {$member->username}\n" .
                    "PASSWORD: {$plainPassword}\n\n" .
                    "Login: peoplesmpcoop.com\n\n" .
                    "REMINDERS:\n" .
                    "✔ Change your password ASAP.\n" .
                    "✔ Keep your account private.\n" .
                    "✘ Don't share your password with anyone.\n" .
                    "This account is strictly for your personal use. Protect your credentials at all times.\n\n" .
                    "Thank you for being part of PMPC!";

                Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
                    'apikey'     => config('services.semaphore.api_key'),
                    'number'     => $formattedNumber,
                    'message'    => $smsMessage,
                    'sendername' => config('services.semaphore.sender_name', 'PeoplesCoop'),
                ]);
            }

            return response()->json([
                'success' => true, 
                'message' => 'Profile created successfully. ID: ' . $username
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false, 
                'message' => 'Failed to create member: ' . $e->getMessage()
            ], 500);
        }
    }

    public function showMemberDetail($id) {
        $member = Member::findOrFail($id);
        
        $basicInfoData = [
            'id' => $member->id,
            'username' => $member->username,
            'branch' => $member->branch,
            'firstName' => $member->firstName,
            'middleName' => $member->middleName,
            'lastName' => $member->lastName,
            'suffix' => $member->suffix,
            'nickname' => $member->nickname,
            'gender' => $member->gender,
            'dob' => $member->dob,
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
            'encrypted' => $id,
            'membershipDate' => $member->created_at ? $member->created_at->format('Y-m-d') : null,
        ];

        $branchService = BranchService::where('memberId', $id)->first();
        $branServiceData = [
            'branchService' => $branchService?->branchService,
            'subBranch' => $branchService?->subBranch
        ];

        $afpInfo = AFPInfo::where('memberId', $id)->first();
        $afpData = [
            'afpsn' => $afpInfo?->afpsn,
            'rank' => $afpInfo?->rank,
            'designation' => $afpInfo?->designation,
            'afpId' => $afpInfo?->afpId,
            'presentAssignment' => $afpInfo?->presentAssignment,
            'controlNo' => $afpInfo?->controlNo,
            'yearsInService' => $afpInfo?->yearsInService,
            'cadEnlistment' => $afpInfo?->cadEnlistment,
            'retirementDate' => $afpInfo?->retirementDate,
            'pensionDate' => $afpInfo?->pensionDate
        ];

        $spouseInfo = SpouseInfo::where('memberId', $id)->first();
        $spouseData = [
            'spouseName' => $spouseInfo?->spouseName,
            'spouseDob' => $spouseInfo?->spouseDob,
            'spouseAge' => $spouseInfo?->spouseAge,
            'dateMarriage' => $spouseInfo?->dateMarriage,
        ];

        $parentsInfo = ParentsInfo::where('memberId', $id)->first();
        $parentsData = [
            'motherName' => $parentsInfo?->motherName,
            'motherAge' => $parentsInfo?->motherAge,
            'fatherName' => $parentsInfo?->fatherName,
            'fatherAge' => $parentsInfo?->fatherAge
        ];

        $identificationInfo = IdentificationInfo::where('memberId', $id)->first();
        $identificationData = [
            'tinNo' => $identificationInfo?->tinNo,
            'gsisNo' => $identificationInfo?->gsisNo,
            'crnUmidNo' => $identificationInfo?->crnUmidNo
        ];

        $emergencyInfo = EmergencyContact::where('memberId', $id)->first();
        $emergencyData = [
            'contactPersonName' => $emergencyInfo?->contactPersonName,
            'contactPersonAddress' => $emergencyInfo?->contactPersonAddress,
            'contactPersonPhone' => $emergencyInfo?->contactPersonPhone,
            'contactPersonRelation' => $emergencyInfo?->contactPersonRelation
        ];

        $dependentsInfo = Dependent::where('memberId', $id)
            ->orderBy('dob')
            ->get(['id', 'name', 'dob', 'gender']);

        $dependentsData = $dependentsInfo->map(function ($dep){
            return [
                'id' => $dep->id,
                'name' => $dep->name,
                'dob' => $dep->dob ? Carbon::parse($dep->dob)->toDateString() : null,
                'gender' => $dep->gender
            ];
        })->values();

        $releasedLoans = Loan::where('memberId', $id)
            ->whereIn('status', ['released', 'Released', 'RELEASED'])
            ->orderByDesc('created_at')
            ->get([
                'id', 'loanReference', 'loanType', 'loanClassification', 'status', 
                'gross', 'netProceeds', 'monthlyAmortization', 
                'loanAmount', 'termYears', 'created_at',
            ]);
        
        $releasedLoansData = $releasedLoans->map(function (Loan $loan) {
            return [
                'id' => $loan->id,
                'loanReference' => $loan->loanReference,
                'loanType'  => $loan->loanType,
                'loanClassification' => $loan->loanClassification,
                'status' => $loan->status,
                'gross' => number_format((float) $loan->gross, 2, '.', ','),
                'netProceeds' => number_format((float) $loan->netProceeds, 2, '.', ','),
                'monthlyAmortization' => number_format((float) $loan->monthlyAmortization, 2, '.', ','),
                'loanAmount' => number_format((float) $loan->loanAmount, 2, '.', ','),
                'termYears' => (int) $loan->termYears,
                'releasedDate' => $loan->created_at
                    ? Carbon::parse($loan->created_at)->format('d F Y')
                    : null,
            ];
        })->values();

        $shareCapital = CapitalContribution::where('memberId', $id)
            ->whereIn('status', ['posted', 'Posted', 'POSTED'])
            ->orderBy('created_at', 'asc')
            ->get();

        $runningBalance = 0.0;
        $totalDeposits = 0.0;
        $totalWithdrawals = 0.0;
        $shareRows = [];

        foreach ($shareCapital as $capCon) {
            $isDeposit = $capCon->transactionType === 'deposit';
            $isWithdrawal = $capCon->transactionType === 'withdrawal';

            $amountAbs = (float) abs($capCon->amount);
            $credit = $isDeposit ? $amountAbs : 0.0;
            $debit = $isWithdrawal ? $amountAbs : 0.0;

            $runningBalance += ($credit - $debit);
            $totalDeposits += $credit;
            $totalWithdrawals += $debit;

            $shareRows[] = [
                'id' => $capCon->id,
                'transactionType' => $capCon->transactionType,
                'status' => $capCon->status,
                'referenceNumber' => $capCon->reference_number,
                'transactionDate' => $capCon->created_at ? $capCon->created_at->format('d M y') : null,
                'postedDate' => $capCon->paid_at ? Carbon::parse($capCon->paid_at)->format('d M y') : null,
                'debit' => $debit > 0 ? number_format($debit, 2, '.', ',') : null,
                'credit' => $credit > 0 ? number_format($credit, 2, '.', ',') : null,
                'balance' => number_format($runningBalance, 2, '.', ',')
            ];
        }

        $shareRows = array_reverse($shareRows);
        $shareSummary = [
            'totalBalance'     => number_format($runningBalance, 2, '.', ','),
            'totalDeposits'    => number_format($totalDeposits, 2, '.', ','),
            'totalWithdrawals' => number_format($totalWithdrawals, 2, '.', ','),
            'paidCapital'      => number_format($runningBalance > 0 ? ($runningBalance / 500) : 0, 2, '.', ','),
        ];
        $shareCapitalData = ['rows' => $shareRows, 'summary' => $shareSummary];

        $savingsDeposit = SavingsDeposit::where('memberId', $id)
            ->whereIn('status', ['posted', 'Posted', 'POSTED'])
            ->orderBy('created_at', 'asc')
            ->get();

        $savingsRunningBalance = 0.0;
        $savingsTotalDeposits = 0.0;
        $savingsTotalWithdrawals = 0.0;
        $savingsRow = [];

        foreach ($savingsDeposit as $savings) {
            $isDeposit = $savings->transactionType === 'deposit';
            $isWithdrawal = $savings->transactionType === 'withdrawal';

            $amountAbs = (float) abs($savings->amount);
            $credit = $isDeposit ? $amountAbs : 0.0;
            $debit = $isWithdrawal ? $amountAbs : 0.0;

            $savingsRunningBalance += ($credit - $debit);
            $savingsTotalDeposits += $credit;
            $savingsTotalWithdrawals += $debit;

            $savingsRow[] = [
                'id' => $savings->id,
                'transactionType' => $savings->transactionType,
                'status' => $savings->status,
                'referenceNumber' => $savings->referenceNumber,
                'transactionDate' => $savings->created_at ? $savings->created_at->format('d M y') : null,
                'postedDate' => $savings->paidAt ? Carbon::parse($savings->paidAt)->format('d M y') : ($savings->created_at ? $savings->created_at->format('d M y') : null),
                'debit' => $debit > 0 ? number_format($debit, 2, '.', ',') : null,
                'credit' => $credit > 0 ? number_format($credit, 2, '.', ',') : null,
                'balance' => number_format($savingsRunningBalance, 2, '.', '.')
            ];
        }

        $savingsRow = array_reverse($savingsRow);
        $savingsSummary = [
            'totalBalance' => number_format($savingsRunningBalance, 2, '.', ','),
            'totalDeposits' => number_format($savingsTotalDeposits, 2, '.', ','),
            'totalWithdrawals' => number_format($savingsTotalWithdrawals, 2, '.', ',')
        ];
        $savingsData = ['rows' => $savingsRow, 'summary' => $savingsSummary];

        // TIME DEPOSITS
        $timeDeposits = TimeDeposit::with([
            'member',
            'interests' => function ($q) { $q->orderBy('yearNumber')->orderBy('creditedDate')->orderBy('id'); },
            'withdrawals' => function ($q) { $q->orderBy('withdrawnDate')->orderBy('id'); },
        ])
        ->where('memberId', $id)
        ->orderBy('startDate')
        ->get();

        $allTimeDeposits = [];
        $totalPrincipal = 0.0;
        $totalCurrBalance = 0.0;
        $totalAvailInterest = 0.0;

        foreach ($timeDeposits as $td) {
            $member = $td->member;
            $principal = (float) $td->principal;
            $memberName = $member ? trim("{$member->lastName}, {$member->firstName} {$member->middleName}") : 'Unknown Member';
            $username = $member->username ?? null;

            $transactions = [];
            $runningBalance = 0.0;

            if ($principal > 0) {
                $runningBalance += $principal;
                $transactions[] = [
                    'date' => optional($td->startDate)->toDateString(),
                    'description' => 'Opening Time Deposit (Principal)',
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
                $desc = 'Interest Withdrawal';
                if ($remarks !== '') $desc .= " - {$remarks}";

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

            $sumInterest = (float) $td->interests->sum('interestAmount');
            $sumWithdrawn = (float) $td->withdrawals->sum('amount');
            $currBalance = $runningBalance;
            $availInterest = max(0.0, $sumInterest - $sumWithdrawn);
            $totalInterest = max(0.0, $currBalance - $principal);

            $totalPrincipal += $principal;
            $totalCurrBalance += $currBalance;
            $totalAvailInterest += $availInterest;

            $summaryDisplay = [
                'timeDepositId' => $td->id,
                'timeDepositCode' => 'TD-' . str_pad((string) $td->id, 4, '0', STR_PAD_LEFT),
                'memberName' => $memberName,
                'username' => $username,
                'principal' => number_format($principal, 2, '.', ','),
                'currentBalance' => number_format($currBalance, 2, '.', ','),
                'totalInterest' => number_format($totalInterest, 2, '.', ','),
                'availableInterest' => number_format($availInterest, 2, '.', ','),
                'termYears' => (int) $td->termYears,
                'interestRate' => number_format((float) $td->interestRate, 2, '.', ',') . ' %',
                'startDate' => $td->startDate ? $td->startDate->format('d M y') : null,
                'maturityDate' => $td->maturityDate ? $td->maturityDate->format('d M y') : null,
                'creditedYears' => (int) $td->creditedYears,
            ];

            $transactionRows = array_map(function (array $t) {
                return [
                    'date' => $t['date'] ? Carbon::parse($t['date'])->format('d M y') : null,
                    'description' => $t['description'] ?? '',
                    'type' => $t['type'] ?? null,
                    'debit' => ($t['debit'] ?? 0.0) > 0 ? number_format((float) $t['debit'], 2, '.', ',') : null,
                    'credit' => ($t['credit'] ?? 0.0) > 0 ? number_format((float) $t['credit'], 2, '.', ',') : null,
                    'balance' => number_format((float) ($t['balanceAfter'] ?? 0.0), 2, '.', ','),
                ];
            }, $transactions);

            $allTimeDeposits[] = ['summary' => $summaryDisplay, 'transactions' => $transactionRows];
        }

        $timeDepositSummaryAll = [
            'totalPrincipal' => number_format($totalPrincipal, 2, '.', ','),
            'totalCurrentBalance' => number_format($totalCurrBalance, 2, '.', ','),
            'totalAvailableInterest'=> number_format($totalAvailInterest, 2, '.', ','),
            'totalCount' => count($allTimeDeposits),
        ];
        $timeDepositData = ['summaryAll' => $timeDepositSummaryAll, 'deposits' => $allTimeDeposits];

        return Inertia::render('Admin/MemberView', [
            'MemberData' => [
                'basicInfoData' => $basicInfoData,
                'branchServiceData' => $branServiceData,
                'afpData' => $afpData,
                'spouseData' => $spouseData,
                'parentsData' => $parentsData,
                'identificationData' => $identificationData,
                'emergencyData' => $emergencyData,
                'dependentsData' => $dependentsData,
                'releasedLoansData' => $releasedLoansData,
                'shareCapitalData' => $shareCapitalData,
                'savingsData' => $savingsData,
                'timeDepositData' => $timeDepositData
            ]
        ]);
    }

    public function updateBasicInfo(Request $request, $id) {
        $member = Member::findOrFail($id);
        
        $v = Validator::make($request->all(), [
            'firstName' => ['required','string','max:100'],
            'lastName' => ['required','string','max:100'],
            'middleName' => ['nullable','string','max:100'],
            'suffix' => ['nullable','string','max:10'],
            'nickname' => ['nullable','string','max:100'],
            'gender' => ['required','string'],
            'dob' => ['required','date'],
            'religion' => ['nullable','string','max:100'],
            'civilStatus' => ['nullable','string','max:100'],
            'nationality' => ['nullable','string','max:100'],
            'email' => ['required','email'],
            'contact' => ['nullable','string','max:20'],
            'fullAddress' => ['nullable','string','max:255'],
            'region' => ['nullable','string','max:100'],
            'province' => ['nullable','string','max:100'],
            'city' => ['nullable','string','max:100'],
            'barangay' => ['nullable','string','max:100'],
            'membershipDate' => ['nullable','date'],
            'branch' => ['required', 'string', Rule::in(Member::OFFICE_BRANCHES)],
        ]);

        if ($v->fails()) {
            return response()->json(['success' => false,'message' => 'Validation failed','errors' => $v->errors()]);
        }

        $validated = $v->validated();
        $validated['age'] = Carbon::parse($validated['dob'])->age;
        
        $membershipDate = null;
        if (array_key_exists('membershipDate', $validated)) {
            $membershipDate = $validated['membershipDate'];
            unset($validated['membershipDate']);
        }

        // Update standard fields
        $member->fill($validated);
        
        if ($membershipDate) {
            $member->created_at = $membershipDate;
        }

        $member->save();
        
        return response()->json(['success' => true, 'message' => 'Updated successfully']);
    }

    public function updateBranchService(Request $request, $id) {
        $member = Member::findOrFail($id);
    
        $v = Validator::make($request->all(), [
            'branchService' => ['required', 'string', 'max:100'],
            'subBranch'     => ['nullable', 'string', 'max:100'],
        ]);
    
        if ($v->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed.', 'errors' => $v->errors()], 422);
        }
    
        $member->branchService()->updateOrCreate(['memberId' => $member->id], $v->validated());
        return response()->json(['success' => true, 'message' => 'Updated successfully.']);
    }

    public function updateAfpInfo(Request $request, $id) {
        $member = Member::findOrFail($id);
    
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
            return response()->json(['success' => false, 'message' => 'Validation failed.', 'errors' => $v->errors()], 422);
        }
    
        $member->afpInfo()->updateOrCreate(['memberId' => $member->id], $v->validated());
        return response()->json(['success' => true, 'message' => 'Updated successfully.']);
    }

    public function updateSpouseInfo(Request $request, $id) {
        $member = Member::findOrFail($id);
    
        $v = Validator::make($request->all(), [
            'spouseName'   => ['required', 'string', 'max:50'],
            'spouseDob'    => ['required', 'date'],
            'dateMarriage' => ['nullable', 'date'],
        ]);
    
        if ($v->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed.', 'errors' => $v->errors()], 422);
        }
    
        $validated = $v->validated();
        $validated['spouseAge'] = Carbon::parse($validated['spouseDob'])->age;
    
        $member->SpouseInfo()->updateOrCreate(['memberId' => $member->id], $validated);
        return response()->json(['success' => true, 'message' => 'Updated successfully.']);
    }

    public function updateParentsInfo(Request $request, $id) {
        $member = Member::findOrFail($id);
        $v = Validator::make($request->all(), [
            'fatherName' => ['required', 'string', 'max:50'],
            'fatherAge' => ['nullable', 'int'],
            'motherName' => ['required', 'string', 'max:50'],
            'motherAge' => ['nullable','int'],
        ]);
    
        if ($v->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed.', 'errors' => $v->errors()], 422);
        }
    
        $member->ParentsInfo()->updateOrCreate(['memberId' => $member->id], $v->validated());
        return response()->json(['success' => true, 'message' => 'Updated successfully.']);
    }

    public function updateIdentificationInfo(Request $request, $id) {
        $member = Member::findOrFail($id);
        $v = Validator::make($request->all(), [
            'tinNo' => ['required','string','max:50'],
            'gsisNo' => ['nullable','string','max:50'],
            'crnUmidNo' => ['nullable','string','max:50']
        ]);
    
        if ($v->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed.', 'errors' => $v->errors()], 422);
        }
    
        $member->IdentificationInfo()->updateOrCreate(['memberId' => $member->id], $v->validated());
        return response()->json(['success' => true, 'message' => 'Updated successfully.']);
    }

    public function updateEmergencyInfo(Request $request, $id) {
        $member = Member::findOrFail($id);
        $v = Validator::make($request->all(), [
            'contactPersonName' => ['required','string','max:50'],
            'contactPersonAddress' => ['required','string','max:50'],
            'contactPersonPhone' => ['required','string','max:50'],
            'contactPersonRelation' => ['nullable','string','max:50']
        ]);
    
        if ($v->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed.', 'errors' => $v->errors()], 422);
        }
    
        $member->EmergencyContact()->updateOrCreate(['memberId' => $member->id], $v->validated());
        return response()->json(['success' => true, 'message' => 'Updated successfully.']);
    }

    public function updateDependents(Request $request, $id) {
        $member = Member::findOrFail($id);
    
        $v = Validator::make($request->all(), [
            'dependents'          => ['required', 'array', 'min:1'],
            'dependents.*.id'     => ['nullable', 'integer', 'exists:dependents,id'],
            'dependents.*.name'   => ['required', 'string', 'max:100'],
            'dependents.*.dob'    => ['required', 'date'],
            'dependents.*.gender' => ['required', 'in:Male,Female'],
        ]);
    
        if ($v->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed.', 'errors' => $v->errors()], 422);
        }
    
        $validated = $v->validated();
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
        return response()->json(['success' => true, 'message' => 'Dependents updated successfully.']);
    }

    public function updatePhoto(Request $request, $id) {
        $request->validate([
            'profile_image' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:5120']
        ]);

        $member = Member::findOrFail($id);

        if ($request->hasFile('profile_image')) {
            // Delete old image if exists
            if ($member->profileImage && Storage::disk('public')->exists($member->profileImage)) {
                Storage::disk('public')->delete($member->profileImage);
            }

            $path = $request->file('profile_image')->store('profile_images', 'public');
            $member->update(['profileImage' => $path]);
        }

        return response()->json([
            'success' => true, 
            'message' => 'Profile image updated successfully.',
            'profileImage' => $path ?? null
        ]);
    }
}
