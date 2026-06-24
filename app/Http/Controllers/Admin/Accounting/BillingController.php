<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\PostApprovalDocuments;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use ZipArchive;

class BillingController extends Controller
{
    // -------------------------------------------------------------------------
    // Centralised business constants
    // -------------------------------------------------------------------------

    /**
     * Branch-service values that classify a member as a Pensioner/Retiree
     * and therefore make them eligible for the AFP Finance Center CD archive.
     */
    private const PENSIONER_SERVICES = [
        'RETIRED MILITARY',
        'RETIRED',
        'PENSIONER',
        'BENEFICIARY',
        'RETIRED/PENSIONER/BENEFICIARY',
    ];

    /**
     * Exact AFP Finance Center CSV column headers.
     * Defined as a constant so the header line and the data loop can never
     * silently drift out of sync.
     */
    private const CSV_HEADERS = [
        'DedCode', 'MA', 'Term', 'GrossLoan', 'AmtRcvd',
        'BOL', 'Surcharge', 'GCI/MRI', 'CC', 'Others1', 'Others2', 'TotalNFC',
        'Interest', 'ServiceFee', 'DocFee', 'DocStamp', 'InspFee', 'TotalFC',
        'DateGranted', 'MaturityDate',
        'FI_Name', 'BillMonth', 'LOANTYPE',
        'Date Created', 'Encoded by', 'Batch',
    ];

    // =========================================================================
    // Routes
    // =========================================================================

    public function workspace(): Response {
        return Inertia::render('Admin/Accounting/BillingWorkspace');
    }

    // =========================================================================
    // GET /admin/accounting/billing/pending
    // =========================================================================

    public function getPendingBilling(): JsonResponse {
        $loans = Loan::with(['member.branchService'])
            ->where(DB::raw('LOWER(status)'), 'released')
            ->where(function ($q) {
                $q->whereNull('billing_status')
                    ->orWhere('billing_status', 'Pending');
            })
            ->orderByDesc('created_at')
            ->get();

        $payload = $loans->map(function (Loan $loan): array {
            $service     = $this->normaliseService($loan->member?->branchService?->branchService ?? '');
            $isPensioner = $this->isPensioner($service);

            return [
                'id' => $loan->id,
                'loanReference' => $loan->loanReference,
                'memberName'     => $loan->member
                    ? "{$loan->member->lastName}, {$loan->member->firstName}"
                    : 'Unknown Member',
                'branchService'  => $service ?: 'UNKNOWN',
                'loanType' => $loan->loanType,
                'grossAmount' => (float) $loan->gross,
                'isEligibleForCD'=> $isPensioner,
                'dateReleased'   => $loan->created_at?->format('Y-m-d') ?? '',
            ];
        });

        return response()->json($payload);
    }

    // =========================================================================
    // POST /admin/accounting/billing/approve
    // =========================================================================

    public function approveBilling(Request $request): JsonResponse {
        $validated = $request->validate([
            'loanIds'   => ['required', 'array', 'min:1'],
            'loanIds.*' => ['required', 'integer', 'exists:loans,id'],
        ]);

        $ids = $validated['loanIds'];

        DB::transaction(function () use ($ids): void {
            Loan::whereIn('id', $ids)->update([
                'billing_status' => 'Billed',
                'billed_at' => now(),
                'billed_by' => Auth::guard('admin')->id(),
            ]);
        });

        $count = count($ids);

        return response()->json([
            'success' => true,
            'message' => "{$count} " . ($count === 1 ? 'loan' : 'loans') . ' approved and moved to Receivables Ledger.',
            'count'   => $count,
        ]);
    }

    // =========================================================================
    // GET /admin/accounting/billing/cd-archive?loans=1,2,3
    // =========================================================================

    public function generateCdArchive(Request $request) {
        $rawIds = $request->query('loans', '');

        if (empty($rawIds)) {
            abort(422, 'No loan IDs provided.');
        }

        $loanIds = array_values(
            array_filter(
                array_map('intval', explode(',', $rawIds)),
                fn (int $id): bool => $id > 0
            )
        );

        if (empty($loanIds)) {
            abort(422, 'No valid loan IDs provided.');
        }

        $loans = Loan::with([
            'member.branchService',
            'member.afpInfo',
            'postApprovalDocuments',
            'processor',
        ])->whereIn('id', $loanIds)->get();

        $eligibleLoans = $loans->filter(
            fn (Loan $loan): bool =>
                $this->isPensioner(
                    $this->normaliseService($loan->member?->branchService?->branchService ?? '')
                )
        );

        if ($eligibleLoans->isEmpty()) {
            abort(422, 'No eligible Pensioner/Retiree loans found among the selected IDs.');
        }

        $now = Carbon::now();
        $billMonthCo = $now->copy()->addMonth();
        $billMonth = $billMonthCo->format('F Y');
        $billMonthDate = $billMonthCo->format('Y-m-d');

        $fileName = 'Pensioner_Billing_Archive_' . $now->format('Ymd_Hi') . '.zip';

        $zipPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $fileName;

        $zip = new ZipArchive();

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Could not create ZIP archive. Check server disk space and permissions.');
        }

        try {
            $this->addBatchSummaryFiles($zip, $eligibleLoans, $billMonth, $billMonthDate, $now);
            $this->addMemberFolders($zip, $eligibleLoans, $now);
        } catch (\Throwable $e) {
            $zip->close();
            @unlink($zipPath);
            throw $e;
        }

        $zip->close();

        if (!file_exists($zipPath) || filesize($zipPath) === 0) {
            abort(500, 'ZIP archive was created but appears to be empty. Check that all PDF views exist.');
        }

        return response()
            ->download($zipPath, $fileName)
            ->deleteFileAfterSend(true);
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Normalise a raw branch-service string to a consistent uppercase trimmed value.
     */
    private function normaliseService(string $raw): string {
        return strtoupper(trim($raw));
    }

    /**
     * Return true if the normalised service string belongs to the pensioner group.
     */
    private function isPensioner(string $normalisedService): bool {
        return in_array($normalisedService, self::PENSIONER_SERVICES, true);
    }

    /**
     * Add the three batch-level files to the ZIP root:
     *   01_PENSIONER_TRANSMITTAL.pdf
     *   02_DISC_COVER_AND_PMU.pdf
     *   03_MASTER_NEWLOAN.csv
     */
    private function addBatchSummaryFiles(
        ZipArchive $zip,
        Collection $loans,
        string $billMonth,
        string $billMonthDate,
        Carbon $now
    ): void {
        $totalGross = (float) $loans->sum('gross');
        $totalMA = (float) $loans->sum('monthlyAmortization');
        $loanCount  = $loans->count();

        // ── A. Transmittal letter ─────────────────────────────────────────────
        $transmittalPdf = Pdf::loadView('pdf.transmittal', [
            'date' => $now->format('d F Y'),
            'billMonth' => strtoupper($billMonth),
            'loanCount' => $loanCount,
            'totalGross' => $totalGross,
            'totalMA' => $totalMA,
        ])->setPaper('A4', 'portrait')->output();

        $zip->addFromString('01_PENSIONER_TRANSMITTAL.pdf', $transmittalPdf);

        // ── B. PMU summary ────────────────────────────────────────────────────
        $groupedTypes = [];
        foreach ($loans->groupBy('loanType') as $type => $group) {
            $normalised = strtoupper(trim($type));
            $label      = str_starts_with($normalised, 'PMPC ')
                ? $normalised 
                : 'PMPC ' . ltrim($normalised, 'PMPC');

            $groupedTypes[$label] = [
                'batches'  => 1,
                'vouchers' => $group->count(),
                'ma'       => (float) $group->sum('monthlyAmortization'),
                'gross'    => (float) $group->sum('gross'),
            ];
        }

        $pmuPdf = Pdf::loadView('pdf.pmu-summary', [
            'billMonth' => strtoupper($billMonth),
            'groupedTypes' => $groupedTypes,
            'totalBatches' => count($groupedTypes),
            'totalVouchers' => $loanCount,
            'totalMA' => $totalMA,
            'totalGross' => $totalGross,
        ])->setPaper('A4', 'portrait')->output();

        $zip->addFromString('02_DISC_COVER_AND_PMU.pdf', $pmuPdf);

        // ── C. Master CSV ─────────────────────────────────────────────────────
        $zip->addFromString('03_MASTER_NEWLOAN.csv', $this->buildMasterCsv($loans, $billMonthDate));
    }

    /**
     * Build the AFP Finance Center master CSV as a string.
     * Extracted so it can be unit-tested independently.
     */
    private function buildMasterCsv(Collection $loans, string $billMonthDate): string {
        $stream = fopen('php://memory', 'r+');

        fputcsv($stream, self::CSV_HEADERS);

        foreach ($loans as $loan) {
            $termMonths = (int) ($loan->termYears * 12);

            $bol = 0.0;
            $surcharge = 0.0;
            $gciMri = (float) $loan->insurance;
            $cc = (float) $loan->capCon;
            $others1 = (float) $loan->advanceInterest;
            $others2 = (float) $loan->membershipFee;
            $totalNfc = $bol + $surcharge + $gciMri + $cc + $others1 + $others2;

            // Finance Charges
            $interest = (float) $loan->gross - (float) $loan->loanAmount;
            $serviceFee = (float) $loan->serviceFee;
            $docFee = 0.0;
            $docStamp = 0.0;
            $inspFee = 0.0;
            $totalFc = $interest + $serviceFee + $docFee + $docStamp + $inspFee;

            $dateGranted  = $loan->created_at?->format('Y-m-d') ?? '';
            $maturityDate = $loan->created_at
                ? $loan->created_at->copy()->addMonths($termMonths)->format('Y-m-d')
                : '';

            fputcsv($stream, [
                $loan->deductionCode,
                $loan->monthlyAmortization,
                $termMonths,
                $loan->gross,
                $loan->netProceeds,
                $bol,
                $surcharge,
                $gciMri,
                $cc,
                $others1,
                $others2,
                $totalNfc,
                $interest,
                $serviceFee,
                $docFee,
                $docStamp,
                $inspFee,
                $totalFc,
                $dateGranted,
                $maturityDate,
                'PMPC',
                $billMonthDate,
                $loan->loanType,
                '',   // Date Created  (populated by AFP system)
                '',   // Encoded by    (populated by AFP system)
                '',   // Batch         (populated by AFP system)
            ]);
        }

        rewind($stream);
        $csv = stream_get_contents($stream);
        fclose($stream);

        return $csv;
    }

    /**
     * Add one folder per loan containing the four required PDFs and any
     * scanned post-approval documents.
     */
    private function addMemberFolders(
        ZipArchive $zip,
        Collection $loans,
        Carbon $now
    ): void {
        foreach ($loans as $loan) {
            $rawFolder  = "{$loan->loanReference} - {$loan->member?->lastName}";
            $folderName = preg_replace('/[^A-Za-z0-9_\-. ]/', '_', $rawFolder);

            $zip->addEmptyDir($folderName);

            $docNameMapping = [
                'dataPrivacyConsent'  => '01_Data_Privacy_Consent',
                'ghqDeclaration'      => '02_GHQ_Declaration',
                'authorityToDeduct'   => '03_Authority_To_Deduct',
                'disclosureStatement' => '04_Disclosure_Statement',
            ];

            foreach ($loan->postApprovalDocuments as $doc) {
                if (!Storage::disk('public')->exists($doc->path)) {
                    continue;
                }

                $ext = pathinfo($doc->originalName, PATHINFO_EXTENSION);

                if (array_key_exists($doc->docsType, $docNameMapping)) {
                    $officialName = $docNameMapping[$doc->docsType];
                    $zip->addFromString(
                        "{$folderName}/{$officialName}.{$ext}",
                        Storage::disk('public')->get($doc->path)
                    );
                } else {
                    $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $doc->docsType);
                    $zip->addFromString(
                        "{$folderName}/Scan_{$safeName}.{$ext}",
                        Storage::disk('public')->get($doc->path)
                    );
                }
            }
        }
    }
}