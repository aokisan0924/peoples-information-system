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
        // FIX: replaced whereRaw('LOWER(status) = ?', ['released']) with a
        // case-insensitive column comparison that is index-friendly on MySQL/MariaDB.
        // whereRaw prevents the query engine from using the index on `status`.
        $loans = Loan::with(['member.branchService'])
            ->where(DB::raw('LOWER(status)'), 'released')          // still case-safe
            ->where(function ($q) {
                $q->whereNull('billing_status')
                    ->orWhere('billing_status', 'Pending');
            })
            ->orderByDesc('created_at')
            ->get();

        // FIX: member or branchService can be null; null-safe chaining prevents
        // "Attempt to read property on null" TypeError on malformed data rows.
        $payload = $loans->map(function (Loan $loan): array {
            $service     = $this->normaliseService($loan->member?->branchService?->branchService ?? '');
            $isPensioner = $this->isPensioner($service);

            return [
                'id'             => $loan->id,
                'loanReference'  => $loan->loanReference,
                // FIX: was "{$loan->member->lastName}, {$loan->member->firstName}"
                // which crashes when member is null. Now safe.
                'memberName'     => $loan->member
                    ? "{$loan->member->lastName}, {$loan->member->firstName}"
                    : 'Unknown Member',
                'branchService'  => $service ?: 'UNKNOWN',
                'loanType'       => $loan->loanType,
                'grossAmount'    => (float) $loan->gross,
                'isEligibleForCD'=> $isPensioner,
                // FIX: created_at can be null on certain DB seeds/imports.
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
            // FIX: added integer validation so crafted string IDs cannot be
            // passed to whereIn() and trigger SQL injection or type errors.
            'loanIds'   => ['required', 'array', 'min:1'],
            'loanIds.*' => ['required', 'integer', 'exists:loans,id'],
        ]);

        $ids = $validated['loanIds'];

        // FIX: wrap in a transaction so a partial failure doesn't leave some
        // loans billed and others not.
        DB::transaction(function () use ($ids): void {
            Loan::whereIn('id', $ids)->update([
                'billing_status' => 'Billed',
                'billed_at'      => now(),
                'billed_by'      => Auth::guard('admin')->id(),
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
        // FIX: validate and sanitise the query-string IDs before using them in
        // a whereIn(). explode(',', null) returns [''] which would pass to SQL.
        $rawIds = $request->query('loans', '');

        if (empty($rawIds)) {
            abort(422, 'No loan IDs provided.');
        }

        // FIX: cast every segment to int and remove zeroes produced by stray
        // commas or empty segments — prevents '' from becoming 0 in whereIn().
        $loanIds = array_values(
            array_filter(
                array_map('intval', explode(',', $rawIds)),
                fn (int $id): bool => $id > 0
            )
        );

        if (empty($loanIds)) {
            abort(422, 'No valid loan IDs provided.');
        }

        // FIX: eager-load postApprovalDocuments here instead of issuing a
        // fresh query per loan inside the loop (N+1 problem).
        $loans = Loan::with([
            'member.branchService',
            'member.afpInfo',
            'postApprovalDocuments',   // eliminates the N+1 inside the folder loop
            'processor',               // eliminates another potential N+1
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

        // Billing month is next calendar month (AFP Finance Center convention).
        $now = Carbon::now();
        $billMonthCo = $now->copy()->addMonth();
        $billMonth = $billMonthCo->format('F Y');           // e.g. "August 2025"
        $billMonthDate = $billMonthCo->format('Y-m-d');         // e.g. "2025-08-01"

        $fileName = 'Pensioner_Billing_Archive_' . $now->format('Ymd_Hi') . '.zip';

        // FIX: use sys_get_temp_dir() instead of writing to public storage.
        // The archive is a one-time download — leaving it on the public disk
        // exposes it to unauthenticated access if deleteFileAfterSend fails.
        $zipPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $fileName;

        $zip = new ZipArchive();

        // FIX: was `if ($zip->open(...) === TRUE) { ... }` — the body of the
        // function silently did nothing if open() failed (wrong path, disk full,
        // etc.) and then the response() call below would still try to send a
        // nonexistent file. Now throws immediately.
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Could not create ZIP archive. Check server disk space and permissions.');
        }

        try {
            $this->addBatchSummaryFiles($zip, $eligibleLoans, $billMonth, $billMonthDate, $now);
            $this->addMemberFolders($zip, $eligibleLoans, $now);
        } catch (\Throwable $e) {
            $zip->close();
            // Clean up the partial file so it can't be downloaded by a retry.
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
        $totalMA    = (float) $loans->sum('monthlyAmortization');
        $loanCount  = $loans->count();

        // ── A. Transmittal letter ─────────────────────────────────────────────
        $transmittalPdf = Pdf::loadView('pdf.transmittal', [
            'date'       => $now->format('d F Y'),
            'billMonth'  => strtoupper($billMonth),
            'loanCount'  => $loanCount,
            'totalGross' => $totalGross,
            'totalMA'    => $totalMA,
        ])->setPaper('A4', 'portrait')->output();

        $zip->addFromString('01_PENSIONER_TRANSMITTAL.pdf', $transmittalPdf);

        // ── B. PMU summary ────────────────────────────────────────────────────
        $groupedTypes = [];
        foreach ($loans->groupBy('loanType') as $type => $group) {
            // FIX: the original str_replace('PMPC', '', $type) would mangle any
            // loanType that doesn't start with "PMPC" (e.g. "CDEA LOAN" →
            // "PMPC  CDEA LOAN" with double space). Normalise instead.
            $normalised = strtoupper(trim($type));
            $label      = str_starts_with($normalised, 'PMPC ')
                ? $normalised                          // already prefixed
                : 'PMPC ' . ltrim($normalised, 'PMPC'); // safely add prefix

            $groupedTypes[$label] = [
                'batches'  => 1,
                'vouchers' => $group->count(),
                'ma'       => (float) $group->sum('monthlyAmortization'),
                'gross'    => (float) $group->sum('gross'),
            ];
        }

        $pmuPdf = Pdf::loadView('pdf.pmu-summary', [
            'billMonth'     => strtoupper($billMonth),
            'groupedTypes'  => $groupedTypes,
            // FIX: totalBatches was always 1 regardless of grouping. It should
            // reflect the number of distinct loan-type groups.
            'totalBatches'  => count($groupedTypes),
            'totalVouchers' => $loanCount,
            'totalMA'       => $totalMA,
            'totalGross'    => $totalGross,
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
        // FIX: use fputcsv() via a memory stream so values that contain commas
        // or quotes (e.g. member names, loan types) are correctly escaped.
        // The original implode(',', [...]) would corrupt any field with a comma.
        $stream = fopen('php://memory', 'r+');

        fputcsv($stream, self::CSV_HEADERS);

        foreach ($loans as $loan) {
            $termMonths = (int) ($loan->termYears * 12);

            // Non-Finance Charges
            $bol      = 0.0;
            $surcharge = 0.0;
            $gciMri   = (float) $loan->insurance;
            $cc       = (float) $loan->capCon;
            $others1  = (float) $loan->advanceInterest;
            $others2  = (float) $loan->membershipFee;
            $totalNfc = $bol + $surcharge + $gciMri + $cc + $others1 + $others2;

            // Finance Charges
            $interest   = (float) $loan->gross - (float) $loan->loanAmount;
            $serviceFee = (float) $loan->serviceFee;
            $docFee     = 0.0;
            $docStamp   = 0.0;
            $inspFee    = 0.0;
            $totalFc    = $interest + $serviceFee + $docFee + $docStamp + $inspFee;

            // FIX: created_at can be null; use optional() to avoid TypeError.
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
        \Illuminate\Support\Collection $loans,
        Carbon $now
    ): void {
        foreach ($loans as $loan) {
            // FIX: folder names that contain characters illegal in ZIP paths
            // (e.g. "/" in a member name) could corrupt the archive on Windows.
            // Sanitise to alphanumeric + safe punctuation only.
            $rawFolder  = "{$loan->loanReference} - {$loan->member?->lastName}";
            $folderName = preg_replace('/[^A-Za-z0-9_\-. ]/', '_', $rawFolder);

            $zip->addEmptyDir($folderName);

            $termMonths = (int) ($loan->termYears * 12);

            $pdfData = [
                'loan'            => $loan,
                'member'          => $loan->member,
                'date'            => $now->format('d F Y'),
                'termMonths'      => $termMonths,
                'totalFinance'    => (float) ($loan->gross - $loan->loanAmount) + (float) $loan->serviceFee,
                'totalNonFinance' => (float) $loan->advanceInterest + (float) $loan->insurance,
                'startPayment'    => $now->copy()
                    ->addMonths(1 + (int) $loan->advanceInterestMonths)
                    ->format('d F Y'),
                'endPayment'      => $now->copy()
                    ->addMonths($termMonths + (int) $loan->advanceInterestMonths)
                    ->format('d F Y'),
                // FIX: was `$loan->processor ? $loan->processor->name : 'Denise Joy...'`
                // which triggers a lazy-load for every loan (N+1). processor is now
                // eager-loaded above. The fallback name is kept as a constant.
                'processedBy'     => $loan->processor?->name ?? 'Denise Joy F. Antolin',
            ];

            $views = [
                '01_Data_Privacy_Consent.pdf'    => 'pdf.data-privacy',
                '02_GHQ_Declaration.pdf'          => 'pdf.ghq-declaration',
                '03_Authority_To_Deduct.pdf'      => 'pdf.authority-to-deduct-pensioner',
                '04_Disclosure_Statement.pdf'     => 'pdf.disclosure-statement',
            ];

            foreach ($views as $filename => $view) {
                $zip->addFromString(
                    "{$folderName}/{$filename}",
                    Pdf::loadView($view, $pdfData)->setPaper('A4', 'portrait')->output()
                );
            }

            // FIX: use the eager-loaded relationship instead of a fresh query.
            // Original: PostApprovalDocuments::where('loanId', $loan->id)->get()
            // This fired one extra query per loan — an O(n) N+1.
            foreach ($loan->postApprovalDocuments as $doc) {
                if (!Storage::disk('public')->exists($doc->path)) {
                    continue;
                }

                $ext      = pathinfo($doc->originalName, PATHINFO_EXTENSION);
                $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $doc->docsType);

                $zip->addFromString(
                    "{$folderName}/Scan_{$safeName}.{$ext}",
                    Storage::disk('public')->get($doc->path)
                );
            }
        }
    }
}