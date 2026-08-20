<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccChartOfAccount;
use App\Models\AccGeneralLedger;
use App\Models\AccJournalEntry;
use App\Models\CapitalContribution;
use App\Models\Computations;
use App\Models\Loan;
use App\Models\LoanDocuments;
use App\Models\PostApprovalDocuments;
use App\Models\Member;
use App\Models\MemberNotification;
use App\Models\MembershipPayment;
use App\Services\LoanAccountingService;
use App\Services\LoanCalculator;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LoanController extends Controller
{

    public function showLoanPage(Request $request) {
        $releasedLoans = Loan::query()
        ->where('status', 'released');

        $loanStats = [
            'totalGross'  => (float) $releasedLoans->sum('gross'),
            'totalNet'    => (float) $releasedLoans->sum('netProceeds'),
            'loanAmount' => (float) $releasedLoans->sum('loanAmount'),
        ];

        $members = Member::query()
            ->select('id', 'username', 'firstName', 'middleName', 'lastName', 'suffix')
            ->orderBy('lastName')
            ->get();

        $chartOfAccount = AccChartOfAccount::select('id', 'accountCode', 'accountName')
            ->orderBy('accountCode')
            ->get();

        return Inertia::render('Admin/Loan', [
            'loanStats' => $loanStats,
            'members'   => $members,
            'chartOfAccounts' => $chartOfAccount,
        ]);
    }

    public function showLoanDetails(Request $request, string $loanReference) {
        return Inertia::render('Admin/LoanDetails', [
            'loanReference' => $loanReference,
        ]);
    }

    public function apiList(Request $request) {
        $search = trim((string) $request->get('search', ''));
        $perPage = max(1, min(100, (int)$request->get('perPage', 10)));

        $query = Loan::query()
            ->select('loans.*')
            ->with([
                'member:id,firstName,lastName,username',
                'processor:id,name'
            ])
            ->when($search, function($q) use ($search) {
                $q->where('loanReference', 'like', "%{$search}%")
                ->orWhereHas('member', function($m) use ($search) {
                    $m->where('firstName', 'like', "%{$search}%")
                    ->orWhere('lastName', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('loans.created_at');

        $page = (int) $request->get('page', 1);
        $p = $query->paginate($perPage, ['*'], 'page', $page);

        $rows = $p->items();
        $data = array_map(function ($loan){
            return [
                'id' => $loan->id,
                'deductionCode' => $loan->deductionCode,
                'loanReference' => $loan->loanReference,
                'firstName' => $loan->member->firstName ?? '',
                'lastName' => $loan->member->lastName ?? '',
                'grossAmount' => (float) $loan->gross,
                'monthlyAmortization' => (float) $loan->monthlyAmortization,
                'status' => $loan->status,
                'processor' => $loan->processor ? ($loan->processor->name ?? $loan->processor->username) : null,
            ];
        }, $rows);

        return response()->json([
            'rows' => $data,
            'meta' => [
                'total' => $p->total(),
                'perPage' => $p->perPage(),
                'currentPage' => $p->currentPage()
            ],
        ]);
    }

    public function apiDetails(Request $request, string $loanReference) {
        $loan = Loan::with([
            'member:id,username,email,firstName,middleName,lastName,suffix',
            'member.branchService:id,memberId,branchService',
        ])
        ->where('loanReference', $loanReference)
        ->first();

        if (!$loan) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $member = $loan->member;
        $branchServiceName = $this->getBranchServiceName($member);

        $capCon = CapitalContribution::where('reference_number', $loanReference)->value('amount') ?? 0;
        $membershipFee = MembershipPayment::where('reference_number', $loanReference)->value('amount') ?? 0;

        if (strtolower($loan->status) === 'released') {
            $journalEntries = AccGeneralLedger::where('referenceNo', $loanReference)
                ->orderBy('debit', 'desc')
                ->get();
        } else {
            $journalEntries = collect($loan->journal_entries ?? [])->map(fn ($e) => (object) $e)->values();
        }

        $requiredLabels = $this->mapPreRequirementsByBranchService(
            (string) $branchServiceName
        );

        $requiredType = array_map(
            fn (string $label) => $this->makeRequirementKey($label),
            $requiredLabels
        );

        $preDocs  = LoanDocuments::where('loanId', $loan->id)->get();
        $postDocs = PostApprovalDocuments::where('loanId', $loan->id)->get();

        $mapPreDoc = function ($doc) {
            return [
                'id'           => $doc->id,
                'docsType'     => $doc->docsType ?? $doc->documentType ?? null,
                'originalName' => $this->nameOf($doc),
                'mimeType'     => $doc->mimeType,
                'size'         => (float) ($doc->size ?? 0),
                'path'         => $doc->path ?? $doc->filePath ?? null,
                'isPost'       => false,
            ];
        };

        $mapPostDoc = function ($doc) {
            return [
                'id'           => $doc->id,
                'docsType'     => $doc->docsType ?? $doc->documentType ?? null,
                'originalName' => $this->nameOf($doc),
                'mimeType'     => $doc->mimeType,
                'size'         => (float) ($doc->size ?? 0),
                'path'         => $doc->path ?? $doc->filePath ?? null,
                'isPost'       => true,
            ];
        };

        return response()->json([
            'loan' => [
                'id'                    => $loan->id,
                'loanReference'         => $loan->loanReference,
                'memberId'              => $loan->memberId,
                'status'                => $loan->status,
                'downloadsAcknowledged' => (bool) $loan->downloadsAcknowledged,

                // Financials
                'loanAmount'            => (float) $loan->loanAmount,
                'grossAmount'           => (float) $loan->gross,
                'netProceeds'           => (float) $loan->netProceeds,
                'monthlyAmortization'   => (float) $loan->monthlyAmortization,
                'serviceFee'            => (float) $loan->serviceFee,
                'insurance'             => (float) $loan->insurance,
                'advanceInterest'       => (float) $loan->advanceInterest,
                'capCon'                => (float) $capCon,
                'membershipFee'         => (float) $membershipFee,
                'monthlyInterestRate'   => (float) $loan->monthlyInterestRate,
                'effectiveInterestRate' => (float) $loan->effectiveInterestRate,

                // Classifications
                'termYears'             => $loan->termYears,
                'loanType'              => $loan->loanType,
                'loanClassification'    => $loan->loanClassification,
                'deductionCode'         => $loan->deductionCode,

                'created_at'            => $loan->created_at,
                'processed_by'          => $loan->processed_by,
                'processor'             => $loan->processor ? ($loan->processor->name ?? 'Admin') : 'System',
            ],
            'member' => [
                'id'            => $member?->id,
                'username'      => $member?->username,
                'email'         => $member?->email,
                'firstName'     => $member?->firstName,
                'middleName'    => $member?->middleName,
                'lastName'      => $member?->lastName,
                'suffix'        => $member?->suffix,
                'branchService' => $branchServiceName,
            ],
            'journalEntries'        => $journalEntries,
            'requiredType'          => $requiredType,
            'existingDocuments'     => $preDocs->map($mapPreDoc)->values(),
            'postApprovalDocuments' => $postDocs->map($mapPostDoc)->values(),
        ]);
    }

    public function downloadAccountingEntry(Request $request, string $loanReference) {
        $loan = Loan::with(['member', 'processor'])->where('loanReference', $loanReference)->firstOrFail();
        $memberName = $loan->member->firstName . ', ' . $loan->member->lastName;

        if (strtolower($loan->status) === 'released') {
            $journalEntries = AccGeneralLedger::where('referenceNo', $loanReference)
                ->orderBy('debit', 'desc')
                ->orderBy('id', 'asc')
                ->get();
        } else {
            $journalEntries = collect($loan->journal_entries ?? [])->map(function ($item) {
                return (object) $item;
            })->sortByDesc('debit')->values();
        }

        $totalDebits = $journalEntries->sum('debit');
        $totalCredits = $journalEntries->sum('credit');

        $data = [
            'coopName' => "PEOPLE'S MULTI-PURPOSE COOPERATIVE",
            'loanRef'  => $loan->loanReference,
            'lvNo' => $loan->lrvNumber ?? '—',
            'date' => ($loan->created_at ? Carbon::parse($loan->created_at) : now())->format('d-M-Y'),
            'borrowerName' => strtoupper(($loan->member->firstName ?? '').' '.($loan->member->middleName ?? '').' '.($loan->member->lastName ?? '')),
            'particulars' => "Loan Release of {$memberName} - {$loan->loanType}",
            'entries' => $journalEntries,
            'totalDebits' => $totalDebits,
            'totalCredits' => $totalCredits,
            'processedBy' => $loan->processor ? strtoupper($loan->processor->name) : 'SYSTEM PROCESSOR',
        ];

        $pdf = Pdf::loadView('pdf.loan-accounting-entry', $data)->setPaper('A4', 'portrait');
        return $pdf->stream('loan-accounting-entry-'.$loanReference.'.pdf');
    }

    public function compute(Request $request) {
        $data = $request->validate([
            'netProceeds' =>  ['required','numeric','min:1'],
            'capCon' => ['nullable', 'numeric','min:0'],
            'membershipFee' => ['nullable','numeric','min:0'],
            'memberId' => ['nullable', 'exists:members,id'],
            'terms' => ['required', 'integer', 'in:12,24,36,48,60'],
            'advanceInterestMonths' => ['nullable', 'integer', 'min:0', 'max:12'],
        ]);

        $membershipFee = array_key_exists('memberId', $data)
            ? (MembershipPayment::where('memberId', $data['memberId'])->where('is_paid', true)->exists() ? 0.0 : 300.0)
            : (float) ($data['membershipFee'] ?? 0);
        $result = app(LoanCalculator::class)->calculate(
            (float) $data['netProceeds'],
            (int) $data['terms'],
            null,
            $membershipFee,
            (int) ($data['advanceInterestMonths'] ?? 2),
        );

        return response()->json($result + [
            'grossAmount' => $result['gross'],
            'incomePercentDisplay' => number_format($result['incomePercent'] * 100, 2) . '%',
            'effectiveInterestRateDisplay' => number_format($result['effectiveInterestRate'] * 100, 2) . '%',
        ]);
    }

    public function recompute(Request $request)
    {
        $data = $request->validate([
            'loanReference' => ['required', 'exists:loans,loanReference'],
            'netProceeds' => ['required', 'numeric', 'min:1'],
            'termYears' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $loan = Loan::where('loanReference', $data['loanReference'])->firstOrFail();
        if (strtolower((string) $loan->status) !== 'pending') {
            return response()->json(['message' => 'Only pending applications may be recomputed.'], 422);
        }

        $membershipFee = MembershipPayment::where('memberId', $loan->memberId)
            ->where('is_paid', true)->exists() ? 0.0 : 300.0;
        $calculation = app(LoanCalculator::class)->calculate(
            (float) $data['netProceeds'],
            (int) $data['termYears'] * 12,
            null,
            $membershipFee,
            2,
        );

        DB::transaction(function () use ($loan, $data, $calculation): void {
            $loan->update([
                'termYears' => $data['termYears'],
                'numberOfPayments' => $calculation['termMonths'],
                'netProceeds' => $calculation['netProceeds'],
                'serviceFee' => $calculation['serviceFee'],
                'insurance' => $calculation['insurance'],
                'advanceInterest' => $calculation['advanceInterest'],
                'loanAmount' => $calculation['loanAmount'],
                'monthlyAmortization' => $calculation['monthlyAmortization'],
                'monthlyInterestRate' => $calculation['monthlyInterestRate'],
                'annual_interest_rate' => $calculation['annualInterestRate'],
                'effectiveInterestRate' => $calculation['effectiveInterestRate'],
                'gross' => $calculation['gross'],
                'income' => $calculation['income'],
                'percentIncome' => $calculation['incomePercent'] * 100,
                'calculation_version' => $calculation['calculationVersion'],
                'calculation_snapshot' => $calculation,
                'advanceInterestMonths' => 2,
            ]);

            CapitalContribution::updateOrCreate(
                ['memberId' => $loan->memberId, 'reference_number' => $loan->loanReference],
                ['transactionType' => 'deposit', 'amount' => $calculation['capCon'], 'is_paid' => false, 'status' => 'Pending']
            );
            if ($calculation['membershipFee'] > 0) {
                MembershipPayment::updateOrCreate(
                    ['memberId' => $loan->memberId, 'reference_number' => $loan->loanReference],
                    ['amount' => $calculation['membershipFee'], 'is_paid' => false, 'status' => 'Pending']
                );
            } else {
                MembershipPayment::where('memberId', $loan->memberId)
                    ->where('reference_number', $loan->loanReference)->where('is_paid', false)->delete();
            }
        });

        return response()->json(['message' => 'Pending loan recomputed.', 'calculation' => $calculation]);
    }

    public function storeLoan(Request $request){
        $data = $request->validate([
            'applicationDate' => ['required', 'date'],
            'memberId' => ['required', 'exists:members,id'],
            'deductionCode' => ['required', 'string'],
            'loanType' => ['required','string','max:50'],
            'loanClassification' => ['required','string','max:50'],
            'termYears' => ['required','integer','min:1','max:5'],

            'netProceeds' => ['required','numeric','min:1'],
            'capCon' => ['nullable','numeric','min:0'],
            'membershipFee' => ['nullable','numeric','min:0'],
            'advanceInterestMonths' => ['nullable','integer','min:0','max:12'],
        ]);

        $months = (int)$data['termYears'] * 12;
        $appDate = Carbon::parse($data['applicationDate'])->toDateTimeString();
        $membershipFee = MembershipPayment::where('memberId', $data['memberId'])->where('is_paid', true)->exists() ? 0.0 : 300.0;
        $calculation = app(LoanCalculator::class)->calculate(
            (float) $data['netProceeds'],
            $months,
            null,
            $membershipFee,
            (int) ($data['advanceInterestMonths'] ?? 2),
        );

        $loan = Loan::create([
            'memberId' => $data['memberId'],
            'deductionCode' => $data['deductionCode'],
            'loanType' => $data['loanType'],
            'loanClassification' => $data['loanClassification'],
            'termYears' => $data['termYears'],

            'netProceeds' => $calculation['netProceeds'],
            'serviceFee' => $calculation['serviceFee'],
            'insurance' => $calculation['insurance'],
            'advanceInterest' => $calculation['advanceInterest'],
            'loanAmount' => $calculation['loanAmount'],
            'monthlyAmortization' => $calculation['monthlyAmortization'],
            'monthlyInterestRate' => $calculation['monthlyInterestRate'],
            'annual_interest_rate' => $calculation['annualInterestRate'],
            'effectiveInterestRate' => $calculation['effectiveInterestRate'],
            'gross' => $calculation['gross'],
            'income' => $calculation['income'],
            'percentIncome' => $calculation['incomePercent'] * 100,
            'calculation_version' => $calculation['calculationVersion'],
            'calculation_snapshot' => $calculation,

            'numberOfPayments' => $months,
            'status' => 'Pending',
            'loanReference' => $this->makeLoanReference(),
            'processed_by' => Auth::guard('admin')->id(),

            'advanceInterestMonths' => $calculation['advanceInterestMonths'],
            'journal_entries' => null,
            'created_at' => $appDate,
            'updated_at' => $appDate,
        ]);

        if ($calculation['capCon'] > 0) {
            CapitalContribution::create([
                'memberId' => $data['memberId'],
                'transactionType' => 'deposit',
                'amount' => $calculation['capCon'],
                'reference_number' => $loan->loanReference,
                'is_paid' => '0',
                'status' => 'Pending',
                'processed_by' => Auth::guard('admin')->id(),
                'created_at' => $appDate,
                'updated_at' => $appDate,
            ]);
        }

        if ($calculation['membershipFee'] > 0) {
            MembershipPayment::create([
                'memberId' => $data['memberId'],
                'amount' => $calculation['membershipFee'],
                'reference_number' => $loan->loanReference,
                'is_paid' => '0',
                'status' => 'Pending',
                'created_at' => $appDate,
                'updated_at' => $appDate,
            ]);
        }

        return redirect()->route('admin.loans.showLoan', ['loanReference' => $loan->loanReference]);
    }

    public function storePreApprovalDocuments(Request $request, string $loanReference) {
        $loan = Loan::where('loanReference', $loanReference)
        ->with('member')
        ->firstOrFail();

        $member = $loan->member;

        if (!$member) {
            return response()->json(['message' => 'Member not found for this loan'], 404);
        }

        $request->validate([
            'files'            => ['required', 'array', 'min:1'],
            'files.*.file'     => ['required', 'file', 'max:20480'],
            'files.*.docsType' => ['nullable', 'string'],
        ]);

        $folderName = preg_replace(
            '/[^A-Za-z0-9_\-]/',
            '_',
            "{$member->username}-{$member->lastName}, {$member->firstName} {$member->middleName} {$member->suffix}"
        );

        $uploadDir = "uploads/pre-approval/{$folderName}";

        $files = $request->file('files', []);

        foreach ($files as $idx => $meta) {
            $file = is_array($meta) ? ($meta['file'] ?? null) : $meta;
            if (!$file) {
                continue;
            }

            $docsType = $request->input("files.$idx.docsType") ?? 'Unknown';
            $path     = $file->store($uploadDir, 'public');

            LoanDocuments::create([
                'loanId'       => $loan->id,
                'docsType'     => $docsType,
                'originalName' => $file->getClientOriginalName(),
                'mimeType'     => $file->getClientMimeType(),
                'size'         => $file->getSize(),
                'path'         => $path,
            ]);
        }

        return response()->json(['message' => 'Requirements uploaded'], 201);
    }

    public function storePostApprovalDocs(Request $request, string $loanReference) {
        $loan = Loan::where('loanReference', $loanReference)
        ->with('member')
        ->firstOrFail();

        $member = $loan->member;

        if (!$member) {
            return response()->json(['message' => 'Member not found for this loan'], 404);
        }

        $request->validate([
            'files'            => ['required', 'array', 'min:1'],
            'files.*.file'     => ['required', 'file', 'max:20480'],
            'files.*.docsType' => ['required', 'string', 'in:signedApplication,releaseVoucher,borrowerPhoto,scannedCheck,authorityToDeduct,dataPrivacyConsent,disclosureStatement,ghqDeclaration'],
        ]);

        $folderName = preg_replace(
            '/[^A-Za-z0-9_\-]/',
            '_',
            "{$member->username}-{$member->lastName}, {$member->firstName} {$member->middleName} {$member->suffix}"
        );

        $uploadDir = "uploads/post-approval/{$folderName}";

        $files = $request->file('files', []);

        try {
        foreach ($files as $idx => $meta) {
            $file = is_array($meta) ? ($meta['file'] ?? null) : $meta;
            if (!$file) {
                continue;
            }

            $docsType = $request->input("files.$idx.docsType") ?? 'Unknown';

            // FIX: $file->store() returns false if the public disk or storage symlink
            // is not configured. Storing false as path crashes on the DB NOT NULL
            // constraint, producing a 500. Guard here and return a clear error.
            $path = $file->store($uploadDir, 'public');

            if ($path === false) {
                \Illuminate\Support\Facades\Log::error("Post-approval doc upload failed: storage disk error", [
                    'loanReference' => $loanReference,
                    'docsType'      => $docsType,
                    'file'          => $file->getClientOriginalName(),
                ]);
                return response()->json([
                    'message' => 'File upload failed. Please ensure server storage is configured correctly (run: php artisan storage:link).',
                ], 500);
            }

            PostApprovalDocuments::create([
                'loanId'       => $loan->id,
                'docsType'     => $docsType,
                'originalName' => $file->getClientOriginalName(),
                'mimeType'     => $file->getClientMimeType(),
                'size'         => $file->getSize(),
                'path'         => $path,
            ]);
        }

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("storePostApprovalDocs exception: " . $e->getMessage(), [
                'loanReference' => $loanReference,
            ]);
            return response()->json(['message' => 'An unexpected error occurred during upload.'], 500);
        }

        return response()->json(['message' => 'Document uploaded successfully'], 201);

    }

    public function previewPreApprovalDocuments(Request $request, string $loanReference, string $documentId) {
        $loan = Loan::where('loanReference', $loanReference)->firstOrFail();

        $doc = LoanDocuments::where('loanId', $loan->id)
            ->where('id', $documentId)
            ->first();

        if (!$doc || empty($doc->path)) {
            abort(404, 'File not found');
        }

        if (!Storage::disk('public')->exists($doc->path)) {
            abort(404, 'File not found');
        }

        $stream = Storage::disk('public')->readStream($doc->path);

        return Response::stream(function () use ($stream) {
            fpassthru($stream);
        }, 200, [
            'Content-Type'        => $doc->mimeType ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="' . $doc->originalName . '"',
        ]);
    }

    public function previewPostApprovalDocument(Request $request, string $loanReference, string $documentId) {
        $loan = Loan::where('loanReference', $loanReference)->firstOrFail();

        $doc = PostApprovalDocuments::where('loanId', $loan->id)
            ->where('id', $documentId)
            ->first();

        if (!$doc || empty($doc->path)) {
            abort(404, 'File not found');
        }

        if (!Storage::disk('public')->exists($doc->path)) {
            abort(404, 'File not found');
        }

        $stream = Storage::disk('public')->readStream($doc->path);

        return Response::stream(function () use ($stream) {
            fpassthru($stream);
        }, 200, [
            'Content-Type'        => $doc->mimeType ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="' . $doc->originalName . '"',
        ]);
    }

    public function acknowledgeDownloads(Request $request, string $loanReference) {
        $loan = Loan::where('loanReference', $loanReference)->firstOrFail();
        $loan->downloadsAcknowledged  = true;
        $loan->save();

        return response()->json([
            'message' => 'Acknowledged',
            'downloadsAcknowledged ' => (bool) $loan->downloadsAcknowledged ,
        ], 200);
    }

    public function approve(Request $request, string $loanReference) {
        $loan = Loan::with([
            'member' => function ($query) {
                $query->select('id', 'username', 'firstName', 'middleName', 'lastName', 'suffix');
            },
            'member.branchService' => function ($query) {
                $query->select('id', 'memberId', 'branchService', 'subBranch');
            },
        ])
        ->where('loanReference', $loanReference)
        ->firstOrFail();

        if (strtolower((string) $loan->status) !== 'pending') {
            return response()->json(['message' => 'Only pending loans can be approved'], 422);
        }

        $member = $loan->member;
        $branchService = $this->getBranchServiceName($member);

        // 1) Get requirements
        $requiredPreLabels = $this->mapPreRequirementsByBranchService((string) $branchService);

        // 2) Map to keys (e.g. "2-latest-payslips")
        $requiredPre = array_map(
            fn (string $label) => $this->makeRequirementKey($label),
            $requiredPreLabels
        );

        // 3) Get uploaded document types
        $havePre = LoanDocuments::where('loanId', $loan->id)
            ->pluck('docsType')
            ->filter()
            ->unique()
            ->values()
            ->all();

        // 4) Check for missing documents
        $missingDocs = array_diff($requiredPre, $havePre);

        if (!empty($missingDocs)) {
            // Find the original human-readable labels for the missing keys to show in the error
            $missingLabels = array_filter($requiredPreLabels, function($label) use ($missingDocs) {
                return in_array($this->makeRequirementKey($label), $missingDocs);
            });

            return response()->json([
                'message' => 'Missing documents: ' . implode(', ', $missingLabels),
                'missing_keys' => array_values($missingDocs)
            ], 422);
        }

        // 5) Generate LRV Number
        // Use raw query to ensure we get the mathematical max even if it's a string column
        $maxLrv = Loan::whereNotNull('lrvNumber')->orderByRaw('CAST(lrvNumber AS UNSIGNED) DESC')->value('lrvNumber');
        $nextLrv = $maxLrv ? ((int)$maxLrv + 1) : 1;
        $formattedLrv = str_pad($nextLrv, 6, '0', STR_PAD_LEFT);

        // 6) Update Loan
        $loan->status = 'approved';
        $loan->downloadsAcknowledged = false;
        $loan->processed_by = Auth::guard('admin')->id();
        $loan->lrvNumber = $formattedLrv;
        $loan->save();

        // 7) Notify Member
        MemberNotification::create([
            'memberId' => $loan->memberId,
            'title' => 'Loan Approved',
            'message' => sprintf(
                'Your loan application (Ref: %s) has been approved. Please review and sign the documents in your portal.',
                $loan->loanReference
            ),
            'type' => 'loan',
            'isRead' => false,
            'linkUrl' => route('member.loans.index')
        ]);

        return response()->json(['message' => 'Loan approved successfully', 'lrv' => $formattedLrv]);
    }

    public function decline(Request $request, string $loanReference) {
        $loan = Loan::where('loanReference', $loanReference)->firstOrFail();

        $loan->update([
            'status' => 'Declined',
            'processed_by' => Auth::guard('admin')->id()
        ]);

        // Optional remarks from admin (reason)
        $reason = trim((string) $request->input('remarks', ''));

        MemberNotification::create([
            'memberId' => $loan->memberId,
            'title'    => 'Loan Declined',
            'message'  => $reason !== ''
                ? sprintf(
                    'Your loan application (Ref: %s) has been declined. Reason: %s',
                    $loan->loanReference,
                    $reason
                )
                : sprintf(
                    'Your loan application (Ref: %s) has been declined.',
                    $loan->loanReference
                ),
            'type'   => 'loan',
            'isRead' => false,
            'linkUrl' => route('member.loans.index'),
        ]);

        return response()->json(['message' => 'Loan declined']);
    }

    public function release(Request $request, string $loanReference) {
        $loan = Loan::with(['postApprovalDocuments', 'member.branchService'])
            ->where('loanReference', $loanReference)
            ->firstOrFail();

        if (strtolower((string)$loan->status) !== 'approved') {
            return response()->json(['message' => 'Only approved loans can be released'], 422);
        }

        $memberBranch = trim((string) $loan->member?->branch);
        if ($memberBranch === '') {
            return response()->json([
                'message' => 'Set the member\'s office branch before releasing this loan.',
            ], 422);
        }

        if (!(bool)($loan->downloadsAcknowledged ?? false)) {
            return response()->json(['message' => 'Please confirm downloads first'], 422);
        }

        $requiredPost = $this->getRequiredPostDocs($loan);

        $havePost = PostApprovalDocuments::where('loanId', $loan->id)
            ->pluck('docsType')
            ->unique()
            ->values()
            ->all();

        if (!$this->hasAllRequired($requiredPost, $havePost)) {
            return response()->json([
                'message' => 'Please complete all post-approval documents (signedApplication, releaseVoucher, borrowerPhoto, scannedCheck).'
            ], 422);
        }

        $now = now();
        $memberName = $loan->member->firstName . ', ' . $loan->member->lastName;

        $capConDate = $now->day <= 3
            ? $now->copy()
            : $now->copy()->startOfMonth()->addMonth();

        // Capital Contribution Deposit
        CapitalContribution::where('reference_number', $loan->loanReference)
            ->where('memberId', $loan->memberId)
            ->where('status', 'Pending')
            ->update([
                'is_paid' => true,
                'status' => 'Posted',
                'paid_at' => $capConDate,
                'processed_by' => Auth::guard('admin')->id()
            ]);

        // mark related membership fee as paid
        MembershipPayment::where('reference_number', $loan->loanReference)
            ->where('memberId', $loan->memberId)
            ->where('status', 'Pending')
            ->update([
                'is_paid' => true,
                'status'  => 'Posted',
                'paid_at' => $now,
            ]);

        $hasAuthoritativeCalculation = $loan->calculation_version === LoanCalculator::VERSION
            && is_array($loan->calculation_snapshot);

        if ($hasAuthoritativeCalculation) {
            app(LoanAccountingService::class)->enqueueRelease($loan);
        } elseif (!empty($loan->journal_entries)) {
            $applicationDate = $loan->created_at;

            // CHANGED: this no longer writes straight to AccGeneralLedger.
            // Loan releases now go through the same clerk-review queue as
            // membership, capital, savings, and memcap transactions — an
            // accounting clerk must approve this batch via
            // AccJournalController::approve() before it posts to the ledger.
            foreach ($loan->journal_entries as $entry) {
                AccJournalEntry::create([
                    'batch_reference'  => $loan->loanReference,
                    'source_type'      => 'loan',
                    'memberId'         => $loan->memberId,
                    'branch'           => $memberBranch,
                    'account_code'     => $entry['accountCode'],
                    'account_name'     => $entry['accountName'] ?? 'Unknown Account',
                    'debit'            => round($entry['debit'], 2),
                    'credit'           => round($entry['credit'], 2),
                    'particulars'      => "Loan Release of {$memberName} - {$loan->loanType}",
                    'transaction_date' => $applicationDate,
                    'status'           => 'pending_review',
                ]);
            }
        }

        $loan->status = 'released';
        $loan->processed_by = Auth::guard('admin')->id();
        if (Schema::hasColumn('loans', 'release_date')) {
            $loan->release_date = $now;
        }
        $loan->save();

        DB::table('loan_amortization_schedules')->where('loanId', $loan->id)->delete();
        $firstDueDate = $now->copy()->addMonthsNoOverflow(1 + (int) $loan->advanceInterestMonths);
        if ($hasAuthoritativeCalculation) {
            $scheduleData = collect(app(LoanCalculator::class)->buildSchedule($loan->calculation_snapshot, $firstDueDate))
                ->map(function (array $row) use ($loan) {
                    $row['loanId'] = $loan->id;
                    $row['status'] = 'unpaid';
                    $row['createdAt'] = now();
                    $row['updatedAt'] = now();
                    return $row;
                })->all();
        } else {
            $scheduleData = [];
            for ($i = 1; $i <= (int) ($loan->termYears * 12); $i++) {
                $scheduleData[] = [
                    'loanId' => $loan->id,
                    'installmentNumber' => $i,
                    'dueDate' => $firstDueDate->copy()->addMonthsNoOverflow($i - 1)->toDateString(),
                    'amountDue' => $loan->monthlyAmortization,
                    'status' => 'unpaid',
                    'createdAt' => now(),
                    'updatedAt' => now(),
                ];
            }
        }
        DB::table('loan_amortization_schedules')->insert($scheduleData);

        MemberNotification::create([
            'memberId' => $loan->memberId,
            'title'    => 'Loan Released',
            'message'  => sprintf(
                'Your loan (Ref: %s) has been released. Please check your crediting details.',
                $loan->loanReference
            ),
            'type' => 'loan',
            'isRead' => false,
            'linkUrl' => route('member.loans.index'),
        ]);

        return response()->json(['message' => 'Loan released']);
    }

    public function downloadApplication(Request $request, string $loanReference) {
        // 1. Fetch Loan with Member & Branch
    $loan = Loan::with(['member.branchService', 'member.afpInfo'])
    ->where('loanReference', $loanReference)
    ->firstOrFail();

    // 2. Prepare Data for the View
    $data = [
        'date' => now()->format('F d, Y'),
        'loanReference' => $loan->loanReference,
        'lvNo'             => $loan->lrvNumber ?? '—',
        'loanType' => $loan->loanType,
        'loanClass' => $loan->loanClassification,
        'termMonths' => (int)($loan->termYears * 12),
        'loanAmount' => (float)$loan->loanAmount,
        'monthlyAmortization' => (float)$loan->monthlyAmortization,
        'netProceeds' => (float)$loan->netProceeds,
        'processedBy' => Auth::user()->name ?? 'Loan Processor',

        // Pass member as an array or object (View supports both)
        'member' => [
            'firstName' => strtoupper($loan->member->firstName),
            'middleName' => strtoupper($loan->member->middleName ?? ''),
            'lastName' => strtoupper($loan->member->lastName),
            'suffix' => strtoupper($loan->member->suffix ?? ''),
            'username' => $loan->member->username,
            'email' => $loan->member->email,
            'contact' => $loan->member->contact,
            'dob' => $loan->member->dob,
            'age' => $loan->member->age,
            'fullAddress' => strtoupper($loan->member->fullAddress ?? $loan->member->address ?? ''),
            // Safe access for relations
            'afpsn' => $loan->member->afpInfo->afpsn ?? 'N/A',
            'rank' => $loan->member->afpInfo->rank ?? 'N/A',
            'branchService' => $loan->member->branchService->branchService ?? 'N/A',
            'unit' => $loan->member->afpInfo->presentAssignment ?? 'N/A',
        ],
    ];

    // 3. Load the CORRECT View ('pdf.loan-application')
    $pdf = Pdf::loadView('pdf.loan-application', $data)
        ->setPaper('A4', 'portrait');

    return $pdf->stream('loan-application-'.$loanReference.'.pdf');
    }

    public function downloadReleaseVoucher(Request $request, string $loanReference) {
        $loan = Loan::with(['member.afpInfo'])->where('loanReference', $loanReference)->firstOrFail();
        $termMonths = (int) ($loan->termYears * 12);

        // Calculate Base Date & First Payment
        $baseDate = $loan->created_at ? Carbon::parse($loan->created_at) : now();
        $advanceMonths = (int) $loan->advanceInterestMonths;
        // Fix: First payment is Start + 1 month + Advance months
        $firstPaymentDate = $baseDate->copy()->addMonths(1 + $advanceMonths);
        // Fix: Maturity is Start + Total Term + Advance months
        $maturityDate = $baseDate->copy()->addMonths($termMonths + $advanceMonths);

        $data = [
            'coopName'         => "PEOPLE'S MULTI-PURPOSE COOPERATIVE",
            'coopAddress'      => 'Purok 3, Brgy. Militar, Fort Magsaysay, Palayan City, Nueva Ecija',
            'title'            => 'LOAN RELEASE VOUCHER',
            'date'             => $baseDate->format('d-M-y'), // e.g. 10-Oct-25
            'lvNo'             => $loan->lrvNumber ?? '—',

            'borrowerName'     => strtoupper(($loan->member->firstName ?? '').' '.($loan->member->middleName ?? '').' '.($loan->member->lastName ?? '')),
            'serialNo'         => $loan->member->afpInfo->afpsn ?? '—',
            'address'          => $loan->member->fullAddress  ?? '—',

            'principalAmount'  => (float) $loan->loanAmount,
            'balanceOldLoans'  => (float) ($loan->balanceOldLoans ?? 0),
            'membershipFee'    => (float) ($loan->membershipFee ?? 300),
            'paidUpCapital'    => (float) ($loan->capCon ?? 0),
            'serviceFee'       => (float) ($loan->serviceFee ?? 0),
            'insurancePremium' => (float) ($loan->insurance ?? 0),
            'advanceInterest'  => (float) ($loan->advanceInterest ?? 0),
            'netProceeds'      => (float) $loan->netProceeds,

            'termMonths'       => $termMonths,
            'monthlyAmort'     => (float) $loan->monthlyAmortization,
            'firstPayment'     => $firstPaymentDate->format('m/d/Y'),
            'maturity'         => $maturityDate->format('m/d/Y'),
            'eirPercent'       => (float) ($loan->effectiveInterestRate ?? 0) * 100,
            'interestPerMonth' => (float) ($loan->monthlyInterestRate ?? 0) * 100,
            'signatories'      => [
                'processedBy' => $loan->processor ? $loan->processor->name : 'Loan Processor',
                'verifiedBy'  => 'ALEXANDER A. FERIA JR',
                'receivedBy'  => '—',
                'approvedBy'  => 'COL. ALEXANDER L. FERIA (RET), CPA, MNSA',
            ],
        ];

        $pdf = Pdf::loadView('pdf.loan-release-voucher', $data)->setPaper('A4', 'portrait');
        return $pdf->stream('loan-release-voucher-'.$loanReference.'.pdf');
    }

    public function downloadLedger(Request $request, string $loanReference) {
        $loan = Loan::with('member')->where('loanReference', $loanReference)->firstOrFail();
        $termMonths = (int) ($loan->termYears * 12);

        // --- FIXED: DETERMINE DATE BASE AND PASS TO BUILDER ---
        $baseDate = $loan->created_at ? Carbon::parse($loan->created_at) : now();
        $rows = $this->buildLedgerRows($loan, $termMonths, $baseDate);

        $data = [
            'borrowerName'  => ($loan->member->firstName ?? '').' '.($loan->member->middleName ?? '').' '.($loan->member->lastName ?? ''),
            'address'       => $loan->member->fullAddress ?? '—',
            'lvNo'          => $loan->lvNo ?? '—',
            'loanRef'       => $loan->loanReference,
            'loanAmount'    => (float) $loan->loanAmount,

            // UPDATED: d (Day), M (Short Month), Y (Year) -> 19-Dec-2025
            'dateOfLoan'    => $baseDate->format('d-M-Y'),
            'maturityDate'  => $baseDate->copy()->addMonths($termMonths + (int)$loan->advanceInterestMonths)->format('d-M-Y'),

            'termMonths'    => $termMonths,
            'schedule'      => $rows,
        ];

        $pdf = Pdf::loadView('pdf.loan-ledger', $data)->setPaper('A4', 'portrait');
        return $pdf->stream('loan-ledger'.$loanReference.'.pdf');
    }

    // --- UPDATED LEDGER LOGIC WITH ADVANCE INTEREST SKIPPING ---
    private function buildLedgerRows(Loan $loan, int $termMonths, Carbon $startDate): array {
        $rows = [];
        $balance = (float) $loan->loanAmount;
        $installment = (float) $loan->monthlyAmortization;
        $monthlyRate = (float) ($loan->monthlyInterestRate ?? 0);
        $advanceMonths = (int) $loan->advanceInterestMonths;

        for ($i = 1; $i <= $termMonths; $i++) {
            $interest = $balance * $monthlyRate;
            $principal = $installment - $interest;

            if ($i == $termMonths) {
                $principal = $balance;
                $balance = 0.0;
            } else {
                $balance = max(0, $balance - $principal);
            }

            // DATE CALCULATION: Start Date + 1 (next month) + Advance Months
            $paymentDate = $startDate->copy()->addMonths($i + $advanceMonths);

            $rows[] = [
                'period'      => $i,
                'installment' => round($installment, 2),
                'principal'   => round($principal, 2),
                'eir'         => round($interest, 2),
                'balance'     => round($balance, 2),
                'dateLabel'   => $paymentDate->format('M-Y'),
            ];
        }

        return $rows;
    }

    private function makeLoanReference(): string {
        $prefix = 'LOAN-'.now()->format('Ymd').'-';
        do {
            $ref = $prefix . str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (Loan::where('loanReference', $ref)->exists());

        return $ref;
    }

    private function normalizeBranchService(?string $raw): string {
        return strtoupper(trim((string) $raw));
    }

    private function getBranchServiceName(Member $member): ?string {
        if (!$member) {
            return null;
        }

        if (!$member->relationLoaded('branchService')) {
            $member->load(['branchService:id,memberId,branchService']);
        }
        return $member->branchService?->branchService;
    }

    private function mapPreRequirementsByBranchService(string $branchService): array {
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

    private function getRequiredPostDocs(Loan $loan): array {
        $required = ['signedApplication', 'releaseVoucher', 'borrowerPhoto', 'scannedCheck', 'authorityToDeduct', 'dataPrivacyConsent', 'disclosureStatement'];

        $service = strtoupper(trim($loan->member->branchService->branchService ?? ''));
        if (in_array($service, ['RETIRED MILITARY', 'RETIRED', 'PENSIONER', 'BENEFICIARY', 'RETIRED/PENSIONER/BENEFICIARY'])) {
            $required[] = 'ghqDeclaration';
        }
        return $required;
    }

    private function hasAllRequired(array $required, array $have): bool {
        $haveNorm = array_map(
            fn ($v) => mb_strtoupper(trim((string) $v)),
            $have
        );

        $haveNorm = array_unique($haveNorm);

        foreach ($required as $r) {
            $rNorm = mb_strtoupper(trim((string) $r));
            if (!in_array($rNorm, $haveNorm, true)) {
                return false;
            }
        }

        return true;
    }

    private function nameOf($doc): string {
        if (!empty($doc->originalName)) {
            return $doc->originalName;
        }

        if (!empty($doc->path)) {
            return basename($doc->path);
        }

        if (!empty($doc->filePath)) {
            return basename($doc->filePath);
        }

        return 'document';
    }

    /**
     * Annual interest rate per term, as hardcoded in 'DATA ENTRY' (row 13) /
     * 'Computation Table' (C11/C37/C64/C90/C116) of NEW_LOAN_TABLE_5_21_26.xlsx.
     */
    private function excelDefaultRates(): array {
        return [
            12 => 0.075,
            24 => 0.0812,
            36 => 0.085,
            48 => 0.0878,
            60 => 0.09,
        ];
    }

    /**
     * Fallback Computations row built directly from NEW_LOAN_TABLE_5_21_26.xlsx.
     * Used only when no admin-configured, active Computations row exists for the
     * requested category/term — keeps the calculator working "out of the box"
     * with the exact numbers the coop's Excel table produces.
     *
     * Formula sources (Computation Table sheet, per-term block):
     *   annualRateFormula      -> C11 / C37 / C64 / C90 / C116 (hardcoded per term)
     *   monthlyRateFormula     -> =C11/12
     *   serviceFeeFormula      -> =NET*(0.0225*TermYears)
     *   insuranceFormula       -> =(NET/1000)*1.25*n   (n = number of monthly payments)
     *   advanceInterestFormula -> =MonthlyRate*NET*2   (column C multiplier; the "5"
     *                              multiplier seen in the sheet's E/F/G scenario
     *                              columns was an inconsistency in the workbook and
     *                              is intentionally NOT reproduced here)
     *   effectiveRateFormula   -> =(1+AnnualRate/n)^n-1 (reproduced as-is, including
     *                              the workbook's use of n — number of payments —
     *                              as the compounding divisor instead of 12; this
     *                              only matches the standard effective-annual-rate
     *                              definition for the 12-month term)
     */
    private function excelDefaultComputation(int $termMonths): ?object {
        $rates = $this->excelDefaultRates();

        if (!isset($rates[$termMonths])) {
            return null;
        }

        return (object) [
            'id' => null,
            'title' => "Excel Loan Table Default ({$termMonths} mos)",
            'category' => null,
            'termMonths' => $termMonths,
            'isActive' => true,
            'annualRateFormula' => (string) $rates[$termMonths],
            'monthlyRateFormula' => 'annualInterestRate / 12',
            'serviceFeeFormula' => 'netProceeds * (0.0225 * (terms / 12))',
            'insuranceFormula' => '(netProceeds / 1000) * 1.25 * terms',
            'advanceInterestFormula' => 'monthlyInterestRate * netProceeds * advanceInterestMonths',
            'effectiveRateFormula' => 'pow(1 + (annualInterestRate / terms), terms) - 1',
        ];
    }

    private function evaluateFormulaSafely (string $formula, array $variables): float {
        $allowedFunctions = ['min','max','round','floor','ceil','pow','abs'];

        if (preg_match('/[^0-9\.\+\-\*\/\%\(\)\,\s\^\_a-zA-Z]/', $formula)) {
            throw ValidationException::withMessages(['formula' => 'Formula contains invalid characters.']);
        }

        while (strpos($formula, '^') !== false) {
            $formula = preg_replace_callback(
                '/(\([^()]*\)|[a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?)[\s]*\^[\s]*(\([^()]*\)|[a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?)/',
                fn($m) => 'pow(' . $m[1] . ',' . $m[2] . ')',
                $formula
            );

            if (strpos($formula, '^') !== false) {
                throw ValidationException::withMessages(['formula' => 'Unsupported exponent syntax. Use pow(a,b).']);
            }
        }

        if (preg_match_all('/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/', $formula, $m)) {
            foreach ($m[1] as $fn) {
                if (!in_array($fn, $allowedFunctions, true) && !array_key_exists($fn, $variables)) {
                    throw ValidationException::withMessages(['formula' => "Function {$fn} is not allowed."]);
                }
            }
        }

        foreach ($variables as $name => $value) {
            if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $name)) {
                throw ValidationException::withMessages(["variables.$name" => "Invalid variable name: {$name}"]);
            }

            if (!is_numeric($value)) {
                throw ValidationException::withMessages(["variables.$name" => "Variable {$name} must be numeric."]);
            }

            $formula = preg_replace('/\b' . preg_quote($name, '/') . '\b/', (string)(float)$value, $formula);
        }

        $finalCheck = '/^([0-9\.\+\-\*\/\%\(\)\,\s]|' . implode('|', array_map('preg_quote', $allowedFunctions)) . ')+$/';
        if (!preg_match($finalCheck, str_replace(' ', '', $formula))) {
            throw ValidationException::withMessages(['formula' => 'Formula failed safety check.']);
        }

        set_error_handler(function(){});
        try {
            $min = fn(...$args) => min(...$args);
            $max = fn(...$args) => max(...$args);
            $round = fn(...$args) => round(...$args);
            $floor = fn($x) => floor($x);
            $ceil = fn($x) => ceil($x);
            $pow = fn($a,$b) => pow($a,$b);
            $abs = fn($x) => abs($x);


            $result = eval('return(' . $formula . ');');
        } finally {
            restore_error_handler();
        }

        if (!is_numeric($result)) {
            throw ValidationException::withMessages(['formula' => 'Formula did not produce a numeric result.']);
        }

        return (float) $result;
    }

    public function apiSearchMembers(Request $request) {
        $q = trim((string) $request->query('q', ''));
        $members = Member::select('id', 'username', 'firstName', 'lastName')
            ->when($q !== '', function ($s) use ($q) {
                $s->where('username', 'like', "%{$q}%")
                ->orWhere('firstName', 'like', "%{$q}%")
                ->orWhere('lastName', 'like', "%{$q}%");
            })
            ->limit(10)
            ->get()
            ->map(fn ($m) => [
                'value' => $m->id,
                'label' => "{$m->username} - {$m->lastName}, {$m->firstName}",
            ]);

        return response()->json(['data' => $members]);
    }

    private function makeRequirementKey(string $label): string {
        $key = strtolower($label);
        $key = preg_replace('/[^a-z0-9]+/', '-', $key);
        $key = trim($key, '-');

        return $key !== '' ? $key : 'document';
    }

    public function downloadAuthorityToDeduct(Request $request, string $loanReference) {
        $loan = Loan::with(['member.branchService'])->where('loanReference', $loanReference)->firstOrFail();
        $service = strtoupper(trim($loan->member->branchService->branchService ?? ''));
        $isPensioner = in_array($service, ['RETIRED MILITARY', 'RETIRED', 'PENSIONER', 'BENEFICIARY', 'RETIRED/PENSIONER/BENEFICIARY']);
        $view = $isPensioner ? 'pdf.authority-to-deduct-pensioner' : 'pdf.authority-to-deduct-active';

        // Updated format here
        $pdf = Pdf::loadView($view, ['loan' => $loan, 'member' => $loan->member, 'date' => now()->format('d F Y')])->setPaper('A4', 'portrait');
        return $pdf->stream('authority-to-deduct-'.$loanReference.'.pdf');
    }

    public function downloadDataPrivacy(Request $request, string $loanReference) {
        $loan = Loan::with(['member'])->where('loanReference', $loanReference)->firstOrFail();

        // Updated format here
        $pdf = Pdf::loadView('pdf.data-privacy', ['loan' => $loan, 'member' => $loan->member, 'date' => now()->format('d F Y')])->setPaper('A4', 'portrait');
        return $pdf->stream('data-privacy-'.$loanReference.'.pdf');
    }

    public function downloadGhqDeclaration(Request $request, string $loanReference) {
        $loan = Loan::with(['member.branchService'])->where('loanReference', $loanReference)->firstOrFail();
        $service = strtoupper(trim($loan->member->branchService->branchService ?? ''));
        if (!in_array($service, ['RETIRED MILITARY', 'RETIRED', 'PENSIONER', 'BENEFICIARY', 'RETIRED/PENSIONER/BENEFICIARY'])) abort(403, 'GHQ Declaration is only for Pensioners.');

        // Updated format here
        $pdf = Pdf::loadView('pdf.ghq-declaration', ['loan' => $loan, 'member' => $loan->member, 'date' => now()->format('d F Y')])->setPaper('A4', 'portrait');
        return $pdf->stream('ghq-declaration-'.$loanReference.'.pdf');
    }

    public function downloadDisclosureStatement(Request $request, string $loanReference) {
        $loan = Loan::with(['member.afpInfo'])->where('loanReference', $loanReference)->firstOrFail();

        $termMonths = (int)($loan->termYears * 12);
        $totalNonFinance = (float)$loan->advanceInterest + (float)$loan->insurance;
        $totalFinance = (float)($loan->gross - $loan->loanAmount) + (float)$loan->serviceFee;

        $baseDate = $loan->created_at ? Carbon::parse($loan->created_at) : now();
        $advanceMonths = (int)$loan->advanceInterestMonths;
        $startPayment = $baseDate->copy()->addMonths(1 + $advanceMonths);
        $endPayment = $baseDate->copy()->addMonths($termMonths + $advanceMonths);

        $data = [
            'loan' => $loan,
            'member' => $loan->member,
            'date' => now()->format('d F Y'), // Updated format
            'termMonths' => $termMonths,
            'totalFinance' => $totalFinance,
            'totalNonFinance' => $totalNonFinance,
            'startPayment' => $startPayment->format('d F Y'), // Updated format
            'endPayment' => $endPayment->format('d F Y'),     // Updated format
            'processedBy' => $loan->processor ? $loan->processor->name : 'Denise Joy F. Antolin',
        ];

        $pdf = Pdf::loadView('pdf.disclosure-statement', $data)->setPaper('A4', 'portrait');
        return $pdf->stream('disclosure-statement-'.$loanReference.'.pdf');
    }
}
