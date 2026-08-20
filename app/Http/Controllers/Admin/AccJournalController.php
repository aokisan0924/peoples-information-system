<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccGeneralLedger;
use App\Models\AccJournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AccJournalController extends Controller
{
    public function index(Request $request): Response
    {
        $status = trim((string) $request->input('status', 'pending_review'));
        $search = trim((string) $request->input('search', ''));
        $perPage = max(1, min(50, (int) $request->input('perPage', 15)));

        $lines = AccJournalEntry::query()
            ->with(['member:id,firstName,lastName,username', 'reviewer:id,name'])
            ->where('source_type', 'loan')
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('batch_reference', 'like', "%{$search}%")
                        ->orWhere('particulars', 'like', "%{$search}%")
                        ->orWhereHas('member', function ($memberQuery) use ($search) {
                            $memberQuery->where('firstName', 'like', "%{$search}%")
                                ->orWhere('lastName', 'like', "%{$search}%")
                                ->orWhere('username', 'like', "%{$search}%");
                        });
                });
            })
            ->latest('created_at')
            ->get();

        $batches = $lines
            ->groupBy('batch_reference')
            ->map(function (Collection $batchLines): array {
                $first = $batchLines->first();

                return [
                    'batch_reference' => $first->batch_reference,
                    'source_type' => $first->source_type,
                    'member' => $first->member,
                    'branch' => $first->branch,
                    'amount' => round((float) $batchLines->sum('debit'), 2),
                    'status' => $first->status,
                    'submitted_date' => optional($batchLines->min('created_at'))->toDateTimeString(),
                    'reviewer' => $first->reviewer,
                    'reviewed_at' => optional($first->reviewed_at)->toDateTimeString(),
                ];
            })
            ->values();

        $page = max(1, (int) $request->input('page', 1));
        $paginator = new LengthAwarePaginator(
            $batches->forPage($page, $perPage)->values(),
            $batches->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Admin/Accounting/JournalEntryIndex', [
            'batches' => $paginator,
            'filters' => compact('status', 'search', 'perPage'),
        ]);
    }

    public function show(string $batchReference): Response
    {
        $lines = AccJournalEntry::query()
            ->with(['member:id,firstName,lastName,username,accountStatus', 'reviewer:id,name'])
            ->where('source_type', 'loan')
            ->where('batch_reference', $batchReference)
            ->orderBy('id')
            ->get();

        abort_if($lines->isEmpty(), 404, 'Journal batch not found.');

        $totalDebit = round((float) $lines->sum('debit'), 2);
        $totalCredit = round((float) $lines->sum('credit'), 2);

        return Inertia::render('Admin/Accounting/JournalEntryReview', [
            'batchReference' => $batchReference,
            'lines' => $lines,
            'member' => $lines->first()->member,
            'totalDebit' => $totalDebit,
            'totalCredit' => $totalCredit,
            'isBalanced' => abs($totalDebit - $totalCredit) < 0.005,
            'batchStatus' => $lines->first()->status,
        ]);
    }

    public function updateLine(Request $request, string $batchReference): JsonResponse
    {
        $validated = $request->validate([
            'line_id' => ['required', 'integer'],
            'account_code' => ['required', 'string', 'max:20'],
            'account_name' => ['required', 'string', 'max:200'],
            'debit' => ['required', 'numeric', 'min:0'],
            'credit' => ['required', 'numeric', 'min:0'],
            'particulars' => ['nullable', 'string', 'max:500'],
        ]);

        $debit = round((float) $validated['debit'], 2);
        $credit = round((float) $validated['credit'], 2);
        if (($debit > 0 && $credit > 0) || ($debit <= 0 && $credit <= 0)) {
            return response()->json([
                'ok' => false,
                'message' => 'A journal line must contain either a debit or a credit amount, but not both.',
            ], 422);
        }

        $line = AccJournalEntry::query()
            ->where('source_type', 'loan')
            ->where('batch_reference', $batchReference)
            ->where('status', 'pending_review')
            ->find($validated['line_id']);

        if (!$line) {
            return response()->json([
                'ok' => false,
                'message' => 'Journal line not found in this pending loan batch.',
            ], 404);
        }

        $line->update([
            'account_code' => $validated['account_code'],
            'account_name' => $validated['account_name'],
            'debit' => $debit,
            'credit' => $credit,
            'particulars' => $validated['particulars'] ?? null,
        ]);

        $batchLines = AccJournalEntry::query()
            ->where('source_type', 'loan')
            ->where('batch_reference', $batchReference)
            ->get();
        $totalDebit = round((float) $batchLines->sum('debit'), 2);
        $totalCredit = round((float) $batchLines->sum('credit'), 2);

        return response()->json([
            'ok' => true,
            'message' => 'Journal line updated.',
            'line' => $line->fresh(),
            'totalDebit' => $totalDebit,
            'totalCredit' => $totalCredit,
            'isBalanced' => abs($totalDebit - $totalCredit) < 0.005,
        ]);
    }

    public function approve(Request $request, string $batchReference): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($batchReference, $validated): void {
            $lines = AccJournalEntry::query()
                ->where('source_type', 'loan')
                ->where('batch_reference', $batchReference)
                ->where('status', 'pending_review')
                ->lockForUpdate()
                ->orderBy('id')
                ->get();

            abort_if($lines->isEmpty(), 404, 'Journal batch not found or already reviewed.');

            $totalDebit = round((float) $lines->sum('debit'), 2);
            $totalCredit = round((float) $lines->sum('credit'), 2);
            abort_if(abs($totalDebit - $totalCredit) >= 0.005, 422, 'Journal batch is not balanced.');

            $reviewedAt = now();
            $adminId = Auth::guard('admin')->id();

            foreach ($lines as $line) {
                abort_if(blank($line->branch), 422, 'Journal line is missing an office branch.');

                AccGeneralLedger::create([
                    'branch' => $line->branch,
                    'referenceNo' => $line->batch_reference,
                    'memberId' => $line->memberId,
                    'accountCode' => $line->account_code,
                    'accountName' => $line->account_name,
                    'debit' => $line->debit,
                    'credit' => $line->credit,
                    'particulars' => $line->particulars,
                    'transactionDate' => $line->transaction_date,
                ]);

                $line->update([
                    'status' => 'approved',
                    'reviewed_by' => $adminId,
                    'reviewed_at' => $reviewedAt,
                    'reviewer_notes' => $validated['notes'] ?? null,
                ]);
            }
        });

        return response()->json([
            'ok' => true,
            'message' => 'Loan journal batch approved and posted to the general ledger.',
        ]);
    }

    public function reject(Request $request, string $batchReference): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($batchReference, $validated): void {
            $lines = AccJournalEntry::query()
                ->where('source_type', 'loan')
                ->where('batch_reference', $batchReference)
                ->where('status', 'pending_review')
                ->lockForUpdate()
                ->get();

            abort_if($lines->isEmpty(), 404, 'Journal batch not found or already reviewed.');

            $reviewedAt = now();
            $adminId = Auth::guard('admin')->id();
            foreach ($lines as $line) {
                $line->update([
                    'status' => 'rejected',
                    'reviewed_by' => $adminId,
                    'reviewed_at' => $reviewedAt,
                    'reviewer_notes' => $validated['notes'],
                ]);
            }
        });

        return response()->json([
            'ok' => true,
            'message' => 'Loan journal batch rejected.',
        ]);
    }
}
