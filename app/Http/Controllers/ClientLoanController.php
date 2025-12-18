<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Admin\LoanController as AdminLoanController;
use App\Models\CapitalContribution;
use App\Models\Loan;
use App\Models\Computations;
use App\Models\LoanDocuments;
use App\Models\MembershipPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClientLoanController extends Controller
{
    /**
     * Show loan application page with summary stats.
     */
    public function index()
    {
        $memberId = Auth::guard('member')->id();

        $totalLoans = Loan::where('memberId', $memberId)->count();

        $totalPending = (float) Loan::where('memberId', $memberId)
            ->where('status', 'Pending')
            ->sum('netProceeds');

        $totalReleased = (float) Loan::where('memberId', $memberId)
            ->where('status', 'Released')
            ->sum('netProceeds');

        return Inertia::render('Client/ClientLoanApplication', [
            'loanStats' => [
                'totalLoans'    => $totalLoans,
                'totalPending'  => $totalPending,
                'totalReleased' => $totalReleased,
            ],
        ]);
    }

    public function list(Request $request): JsonResponse
    {
        $memberId = Auth::guard('member')->id();

        $search  = trim((string) $request->string('search'));
        $perPage = (int) $request->integer('perPage', 10);
        $page    = max(1, (int) $request->integer('page', 1));

        $search  = $search !== '' ? $search : null;
        $perPage = $perPage > 0 ? $perPage : 10;

        $query = Loan::where('memberId', $memberId);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('loanReference', 'like', "%{$search}%")
                    ->orWhere('loanClassification', 'like', "%{$search}%")
                    ->orWhere('loanType', 'like', "%{$search}%");
            });
        }

        $paginator = $query
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        $rows = collect($paginator->items())->map(function (Loan $loan) {
            return [
                'loanReference'      => $loan->loanReference,
                'loanClassification' => $loan->loanClassification,
                'loanType'           => $loan->loanType,
                'loanTerm'           => $loan->termYears . ' year' . ($loan->termYears > 1 ? 's' : ''),
                'amount'             => (float) $loan->netProceeds,
                'status'             => $loan->status,
                'remarks'            => $loan->remarks ?? '',
                'dateApplied'        => optional($loan->created_at)->format('d M Y'),
            ];
        });

        return response()->json([
            'rows' => $rows,
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage'    => $paginator->lastPage(),
                'perPage'     => $paginator->perPage(),
                'total'       => $paginator->total(),
            ],
        ]);
    }

    public function compute(Request $request): JsonResponse
    {
        $member = Auth::guard('member')->user();

        $data = $request->validate([
            'netProceeds' => ['required', 'numeric', 'min:1'],
            'termYears'   => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $netProceeds = (float) $data['netProceeds'];
        $termYears   = (int) $data['termYears'];
        $termMonths  = $termYears * 12;

        $branchServiceName = $this->getBranchServiceName($member);
        $category          = $this->mapCategoryByBranchServiceName($branchServiceName);

        // Check if membership fee already paid
        $hasPaidMembership = MembershipPayment::where('memberId', $member->id)
            ->where('is_paid', true)
            ->exists();

        $membershipFee = $hasPaidMembership ? 0.0 : 300.0;

        $capCon                = 5000.0;
        $advanceInterestMonths = 2;

        $hasComputation = Computations::query()
            ->where('category', $category)
            ->where('termMonths', $termMonths)
            ->where('isActive', true)
            ->exists();

        if (!$hasComputation) {
            return response()->json([
                'message' => "No active computation settings for {$category} at {$termMonths} months.",
            ], 422);
        }

        $adminPayload = [
            'category'              => $category,
            'netProceeds'           => $netProceeds,
            'capCon'                => $capCon,
            'membershipFee'         => $membershipFee,
            'terms'                 => $termMonths,
            'advanceInterestMonths' => $advanceInterestMonths,
        ];

        $fakeRequest = Request::create(
            '/admin/loans/api-compute',
            'POST',
            $adminPayload
        );

        /** @var AdminLoanController $adminController */
        $adminController = app(AdminLoanController::class);

        /** @var JsonResponse $response */
        $response = $adminController->compute($fakeRequest);
        $payload  = $response->getData(true);

        $payload['membershipFee']       = $membershipFee;
        $payload['capCon']              = $capCon;
        $payload['termYears']           = $termYears;
        $payload['termMonths']          = $termMonths;
        $payload['branchService']       = $branchServiceName ?: 'N/A';
        $payload['preLoanRequirements'] = $this->mapPreRequirementsByBranchService(
            (string) ($branchServiceName ?? '')
        );

        if (isset($payload['gross']) && !isset($payload['grossAmount'])) {
            $payload['grossAmount'] = $payload['gross'];
        }

        return response()->json($payload);
    }

    public function submit(Request $request): JsonResponse
    {
        $member = Auth::guard('member')->user();

        $data = $request->validate([
            'netProceeds'        => ['required', 'numeric', 'min:1'],
            'termYears'          => ['required', 'integer', 'min:1', 'max:5'],
            'loanClassification' => ['required', 'string', 'max:100'],
            'loanType'           => ['required', 'string', 'max:100'],
            'purpose'            => ['nullable', 'string', 'max:500'],
        ]);

        $netProceeds = (float) $data['netProceeds'];
        $termYears   = (int) $data['termYears'];
        $termMonths  = $termYears * 12;

        $branchServiceName = $this->getBranchServiceName($member);
        $category          = $this->mapCategoryByBranchServiceName($branchServiceName);

        $hasPaidMembership = MembershipPayment::where('memberId', $member->id)
            ->where('is_paid', true)
            ->exists();

        $membershipFee = $hasPaidMembership ? 0.0 : 300.0;

        $capCon                = 5000.0;
        $advanceInterestMonths = 2;

        $hasComputation = Computations::query()
            ->where('category', $category)
            ->where('termMonths', $termMonths)
            ->where('isActive', true)
            ->exists();

        if (!$hasComputation) {
            return response()->json([
                'message' => "No active computation settings for {$category} at {$termMonths} months.",
            ], 422);
        }

        $adminPayload = [
            'category'              => $category,
            'netProceeds'           => $netProceeds,
            'capCon'                => $capCon,
            'membershipFee'         => $membershipFee,
            'terms'                 => $termMonths,
            'advanceInterestMonths' => $advanceInterestMonths,
        ];

        $fakeRequest = Request::create(
            '/admin/loans/api-compute',
            'POST',
            $adminPayload
        );

        /** @var AdminLoanController $adminController */
        $adminController = app(AdminLoanController::class);

        /** @var JsonResponse $computeResponse */
        $computeResponse = $adminController->compute($fakeRequest);
        $computed        = $computeResponse->getData(true);

        $serviceFee          = (float) ($computed['serviceFee'] ?? 0);
        $insurance           = (float) ($computed['insurance'] ?? 0);
        $advanceInterest     = (float) ($computed['advanceInterest'] ?? 0);
        $loanAmount          = (float) ($computed['loanAmount'] ?? 0);
        $monthlyAmortization = (float) ($computed['monthlyAmortization'] ?? 0);
        $grossAmount         = (float) ($computed['grossAmount'] ?? ($computed['gross'] ?? $loanAmount));
        $income = (float) ($computed['income']) ?? 0;
        $percentIncome =  round(($income / $grossAmount) * 100, 2);
        $effectiveInterestRate = round($computed['effectiveInterestRate'], 5);
        $monthlyInterestRate = round($computed['monthlyInterestRate'], 5);

        $loan = new Loan();
        $loan->memberId              = $member->id;
        $loan->loanReference         = $this->makeLoanReference();
        $loan->loanClassification    = $data['loanClassification'];
        $loan->loanType              = $data['loanType'];
        $loan->termYears             = $termYears;
        $loan->numberOfPayments      = $termMonths;
        $loan->netProceeds           = $netProceeds;
        $loan->serviceFee            = $serviceFee;
        $loan->insurance             = $insurance;
        $loan->advanceInterest       = $advanceInterest;
        $loan->loanAmount            = $loanAmount;
        $loan->gross                 = $grossAmount;
        $loan->income = $income;
        $loan->percentIncome = $percentIncome;
        $loan->effectiveInterestRate = $effectiveInterestRate;
        $loan->monthlyInterestRate = $monthlyInterestRate;
        $loan->monthlyAmortization = $monthlyAmortization;
        $loan->advanceInterestMonths = $advanceInterestMonths;
        $loan->status = 'Pending';
        $loan->save();

        if ($capCon > 0) {
            CapitalContribution::create([
                'memberId'        => $member->id,
                'transactionType' => 'deposit',
                'amount'          => round($capCon, 2),
                'reference_number'=> $loan->loanReference,
                'is_paid'         => 0,
                'status'          => 'Pending',
            ]);
        }

        if ($membershipFee > 0) {
            MembershipPayment::create([
                'memberId'        => $member->id,
                'amount'          => round($membershipFee, 2),
                'reference_number'=> $loan->loanReference,
                'is_paid'         => 0,
                'status'          => 'Pending',
            ]);
        }

        return response()->json([
            'message'       => 'Loan application submitted successfully.',
            'loanReference' => $loan->loanReference,
        ], 201);
    }

    /**
     * JSON details for the action modal in ClientLoanApplication.jsx
     */
    public function showDetailJson(string $loanReference): JsonResponse{
        $member = Auth::guard('member')->user();

        $loan = Loan::where('memberId', $member->id)
            ->where('loanReference', $loanReference)
            ->firstOrFail();

        $branchServiceName = $this->getBranchServiceName($member);

        $requirementsRaw = $this->mapPreRequirementsByBranchService(
            (string) ($branchServiceName ?? '')
        );

        $reqData = $this->buildRequirementViewData(
            $loan,
            $member->id,
            $branchServiceName,
            $requirementsRaw
        );

        $capConAmount = (float) CapitalContribution::where('reference_number', $loan->loanReference)
            ->sum('amount');

        $membershipFeeAmount = (float) MembershipPayment::where('reference_number', $loan->loanReference)
            ->sum('amount');

        $loanData = [
            'loanReference'       => $loan->loanReference,
            'loanClassification'  => $loan->loanClassification,
            'loanType'            => $loan->loanType,
            'termYears'           => $loan->termYears,
            'numberOfPayments'    => $loan->numberOfPayments,
            'netProceeds'         => (float) $loan->netProceeds,
            'loanAmount'          => (float) $loan->loanAmount,
            'monthlyAmortization' => (float) $loan->monthlyAmortization,
            'status'              => $loan->status,
            'createdAt'           => optional($loan->created_at)->format('d M Y'),
            'updatedAt'           => optional($loan->updated_at)->format('d M Y'),
        ];

        $requirements = array_map(function (array $req) {
            return [
                'key'        => $req['key'],
                'label'      => $req['label'],
                'isUploaded' => (bool) $req['isUploaded'],
                'fileName'   => $req['fileName'],
                'uploadedAt' => $req['uploadedAt'],
            ];
        }, $reqData['requirements']);

        return response()->json([
            'loan'                => $loanData,
            'branchService'       => $reqData['branchService'],
            'requirements'        => $requirements,
            'capConAmount'        => $capConAmount,
            'membershipFeeAmount' => $membershipFeeAmount,
        ]);
    }

    /**
     * Step 2: show upload requirements page
     */
    public function showRequirements(string $loanReference)
    {
        $member = Auth::guard('member')->user();

        $loan = Loan::where('memberId', $member->id)
            ->where('loanReference', $loanReference)
            ->firstOrFail();

        $branchServiceName = $this->getBranchServiceName($member);
        $requirementsRaw   = $this->mapPreRequirementsByBranchService((string) ($branchServiceName ?? ''));

        $viewData = $this->buildRequirementViewData(
            $loan,
            $member->id,
            $branchServiceName,
            $requirementsRaw
        );

        return Inertia::render('Client/ClientLoanUploadRequirements', $viewData);
    }

    /**
     * Handle upload/replace of requirements
     */
    public function uploadRequirements(Request $request, string $loanReference): JsonResponse{
        $member = Auth::guard('member')->user();

        $loan = Loan::where('memberId', $member->id)
            ->where('loanReference', $loanReference)
            ->firstOrFail();

        $branchServiceName = $this->getBranchServiceName($member);
        $requirementsRaw   = $this->mapPreRequirementsByBranchService(
            (string) ($branchServiceName ?? '')
        );

        // 1) Build validation rules based on canonical keys
        $rules = [];

        foreach ($requirementsRaw as $label) {
            $key = $this->makeRequirementKey($label);

            if ($request->hasFile("documents.$key")) {
                $rules["documents.$key"] = ['file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'];
            }
        }

        if (empty($rules)) {
            return response()->json([
                'message' => 'No documents uploaded.',
            ], 422);
        }

        // 2) Validate only the keys that actually have files
        $request->validate($rules);

        // 3) Store/update per requirement using docsType
        foreach ($requirementsRaw as $label) {
            $key = $this->makeRequirementKey($label);

            if (!$request->hasFile("documents.$key")) {
                continue;
            }

            $file = $request->file("documents.$key");
            if (!$file) {
                continue;
            }

            $path = $file->store("loans/{$loan->loanReference}", 'public');

            LoanDocuments::updateOrCreate(
                [
                    'loanId'  => $loan->id,
                    'docsType'=> $key, // 🔥 use docsType, not documentKey
                ],
                [
                    'originalName' => $file->getClientOriginalName(),
                    'path'         => $path,
                    'mimeType'     => $file->getClientMimeType(),
                    'size'         => $file->getSize(),
                ]
            );
        }

        // 4) Rebuild requirement view so frontend gets fresh statuses
        $viewData = $this->buildRequirementViewData(
            $loan,
            $member->id,
            $branchServiceName,
            $requirementsRaw
        );

        return response()->json([
            'message'       => 'Documents uploaded successfully.',
            'requirements'  => $viewData['requirements'],
            'uploadedCount' => $viewData['uploadedCount'],
            'totalRequired' => $viewData['totalRequired'],
            'allUploaded'   => $viewData['allUploaded'],
            'loanStatus'    => $viewData['loan']['status'],
        ]);
    }

    public function submitForEvaluation(Request $request, string $loanReference): JsonResponse {
        $member = Auth::guard('member')->user();

        $loan = Loan::where('memberId', $member->id)
            ->where('loanReference', $loanReference)
            ->firstOrFail();

        $branchServiceName = $this->getBranchServiceName($member);
        $requirementsRaw   = $this->mapPreRequirementsByBranchService(
            (string) ($branchServiceName ?? '')
        );

        $reqData = $this->buildRequirementViewData(
            $loan,
            $member->id,
            $branchServiceName,
            $requirementsRaw
        );

        $missing = collect($reqData['requirements'])
            ->filter(fn (array $req) => !$req['isUploaded'])
            ->values();

        if ($missing->isNotEmpty()) {
            return response()->json([
                'message' => 'Please upload all required documents before submitting for evaluation.',
                'missing' => $missing->pluck('label'),
            ], 422);
        }

        $loan->status = 'Pending';
        $loan->save();

        return response()->json([
            'message'       => 'Loan documents submitted for evaluation.',
            'loanStatus'    => $loan->status,
            'requirements'  => $reqData['requirements'],
            'uploadedCount' => $reqData['uploadedCount'],
            'totalRequired' => $reqData['totalRequired'],
            'allUploaded'   => $reqData['allUploaded'],
        ]);
    }

    // ============================
    // Helpers
    // ============================

    protected function getBranchServiceName($member): ?string
    {
        if (!$member) {
            return null;
        }

        return optional($member->branchService)->branchService;
    }

    protected function normalizeBranchService(string $branchService): string
    {
        return strtoupper(trim($branchService));
    }

    protected function mapCategoryByBranchServiceName(?string $branchService): string
    {
        $key = $this->normalizeBranchService($branchService ?? '');

        if (in_array($key, [
            'PMPC',
            'ACTIVE MILITARY',
            'RETIRED',
            'PENSIONER',
            'BENEFICIARY',
            'RETIRED/PENSIONER/BENEFICIARY',
        ], true)) {
            return 'ACTIVE_PENSIONER_V1';
        }

        if ($key === 'CDEA') {
            return 'CDEA';
        }

        // default for now
        return 'ACTIVE_PENSIONER_V1';
    }

    protected function mapPreRequirementsByBranchService(string $branchService): array
    {
        $key = $this->normalizeBranchService($branchService);

        switch ($key) {
            case 'ACTIVE MILITARY':
                return [
                    '2 latest payslips',
                    'AFP/Company ID (clear copy, front and back)',
                    'Latest Assignment Order / COE',
                    'Valid government ID with 3 specimen signatures',
                ];

            case 'RETIRED MILITARY':
                return [
                    'Retirement Order / Pension documents',
                    '2 latest pension bank statements or passbook pages',
                    'Valid government ID with 3 specimen signatures',
                    '2 Latest 2x2 Picture'
                ];

            case 'BENEFICIARY':
                return [
                    'Retirement Order / Pension documents',
                    'Declaration of Beneficiaries',
                    'Pensioners ID & Any Govt Issued ID with 3 signature',
                    '2 Latest 2x2 Picture',
                    'Marriage Contract / Birth Certificate',
                    'Death Certificate',
                    'ATM Photocopy w/ 3 signature'
                ];

            case 'RESERVIST':
                return [
                    'Reservist ID',
                    'Proof of income (2 latest payslips or bank statements)',
                    'Valid government ID with 3 specimen signatures',
                ];

            case 'RESERVIST':
                return [
                    'Order of Commission or Enlistment',
                    '2 Latest 2x2 Picture',
                    'Authenticated Assignment Order',
                    'Holding units Clearance and Commanders Approval',
                    'Postdated Check / Auto Debit Account',
                    'Reservist ID with 3 signature',
                    '2 Govt Issued ID with 3 Signature'
                ];

            case 'CDEA':
                return [
                    'Company ID / Cooperative ID',
                    '2 latest payslips or income documents',
                    'Valid government ID with 3 specimen signatures',
                ];

            case 'PMPC':
                return [
                    'Regularization',
                    'Company ID with 3 signature',
                    '2x2 Picture',
                ];

            default:
                return [];
        }
    }

    protected function makeRequirementKey(string $label): string {
        $key = strtolower($label);
        $key = preg_replace('/[^a-z0-9]+/', '-', $key);
        $key = trim($key, '-');
    
        return $key !== '' ? $key : 'document';
    }

    protected function buildRequirementViewData(
        Loan $loan,
        int $memberId,
        ?string $branchServiceName,
        array $requirementsRaw
    ): array {
        $documents = LoanDocuments::where('loanId', $loan->id)->get();

        $byType = $documents->keyBy('docsType');
    
        $requirements = array_map(function (string $label) use ($byType) {
            $key = $this->makeRequirementKey($label);
            $doc = $byType->get($key);
    
            return [
                'key'        => $key,
                'label'      => $label,
                'isUploaded' => $doc !== null,
                'fileName'   => $doc ? $doc->originalName : null,
                'fileUrl'    => $doc ? asset('storage/' . $doc->path) : null,
                'uploadedAt' => $doc && $doc->created_at
                    ? $doc->created_at->format('d M Y, h:i A')
                    : null,
            ];
        }, $requirementsRaw);
    
        $uploadedCount = collect($requirements)->where('isUploaded', true)->count();
        $totalRequired = count($requirements);
        $allUploaded   = $totalRequired > 0 && $uploadedCount === $totalRequired;
    
        return [
            'loan' => [
                'loanReference'      => $loan->loanReference,
                'loanType'           => $loan->loanType,
                'loanClassification' => $loan->loanClassification,
                'termYears'          => $loan->termYears,
                'netProceeds'        => (float) $loan->netProceeds,
                'status'             => $loan->status,
            ],
            'branchService'  => $branchServiceName ?: 'N/A',
            'requirements'   => $requirements,
            'uploadedCount'  => $uploadedCount,
            'totalRequired'  => $totalRequired,
            'allUploaded'    => $allUploaded,
        ];
    }    

    private function makeLoanReference(): string
    {
        $prefix = 'LOAN-' . now()->format('Ymd') . '-';

        do {
            $ref = $prefix . str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (Loan::where('loanReference', $ref)->exists());

        return $ref;
    }
}
