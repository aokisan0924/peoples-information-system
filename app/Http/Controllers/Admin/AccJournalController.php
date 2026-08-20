<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccGeneralLedger;
use App\Models\AccBankRecord;
use App\Models\AccEWallet;
use App\Models\AccJournalEntry;
use App\Models\AccPettyCashFund;
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
    private const SOURCE_TYPES = [
        'membership', 'capital', 'savings', 'memcap', 'loan',
        'petty_cash', 'ewallet', 'bank', 'ppe',
    ];

    public function index(Request $request): Response
    {
        $status = trim((string) $request->input('status', 'pending_review'));
        $search = trim((string) $request->input('search', ''));
        $sourceType = $this->validatedSourceType($request);
        $perPage = max(1, min(50, (int) $request->input('perPage', 15)));

        $lines = AccJournalEntry::query()
            ->with(['member:id,firstName,lastName,username', 'reviewer:id,name'])
            ->when($sourceType !== '', fn ($query) => $query->where('source_type', $sourceType))
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
            ->groupBy(fn (AccJournalEntry $line) => "{$line->source_type}|{$line->source_record_id}|{$line->branch}|{$line->batch_reference}")
            ->map(function (Collection $batchLines): array {
                $first = $batchLines->first();

                return [
                    'batch_reference' => $first->batch_reference,
                    'source_type' => $first->source_type,
                    'source_record_id' => $first->source_record_id,
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
            'filters' => compact('status', 'search', 'sourceType', 'perPage'),
            'sourceTypes' => self::SOURCE_TYPES,
        ]);
    }

    public function show(Request $request, string $batchReference): Response
    {
        $sourceType = $this->validatedSourceType($request);
        $sourceRecordId = $request->integer('source_record_id') ?: null;
        $branch = trim((string) $request->input('branch', ''));
        $lines = AccJournalEntry::query()
            ->with(['member:id,firstName,lastName,username,accountStatus', 'reviewer:id,name'])
            ->where('batch_reference', $batchReference)
            ->when($sourceType !== '', fn ($query) => $query->where('source_type', $sourceType))
            ->when($sourceRecordId !== null, fn ($query) => $query->where('source_record_id', $sourceRecordId))
            ->when($branch !== '', fn ($query) => $query->where('branch', $branch))
            ->orderBy('id')
            ->get();

        abort_if($lines->isEmpty(), 404, 'Journal batch not found.');
        abort_if($lines->map(fn ($line) => [$line->source_type, $line->source_record_id, $line->branch])->unique()->count() > 1, 409, 'Specify the source identity for this batch reference.');

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
            'sourceType' => $lines->first()->source_type,
            'sourceRecordId' => $lines->first()->source_record_id,
            'branch' => $lines->first()->branch,
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

        $sourceType = $this->validatedSourceType($request);
        $line = AccJournalEntry::query()
            ->where('batch_reference', $batchReference)
            ->where('status', 'pending_review')
            ->when($sourceType !== '', fn ($query) => $query->where('source_type', $sourceType))
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
            ->where('batch_reference', $batchReference)
            ->where('source_type', $line->source_type)
            ->where('branch', $line->branch)
            ->when($line->source_record_id === null, fn ($query) => $query->whereNull('source_record_id'), fn ($query) => $query->where('source_record_id', $line->source_record_id))
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
        $sourceType = $this->validatedSourceType($request);
        $sourceRecordId = $request->integer('source_record_id') ?: null;
        $branch = trim((string) $request->input('branch', ''));
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($batchReference, $validated, $sourceType, $sourceRecordId, $branch): void {
            $lines = AccJournalEntry::query()
                ->where('batch_reference', $batchReference)
                ->where('status', 'pending_review')
                ->when($sourceType !== '', fn ($query) => $query->where('source_type', $sourceType))
                ->when($sourceRecordId !== null, fn ($query) => $query->where('source_record_id', $sourceRecordId))
                ->when($branch !== '', fn ($query) => $query->where('branch', $branch))
                ->lockForUpdate()
                ->orderBy('id')
                ->get();

            abort_if($lines->isEmpty(), 404, 'Journal batch not found or already reviewed.');
            abort_if($lines->map(fn ($line) => [$line->source_type, $line->source_record_id, $line->branch])->unique()->count() > 1, 409, 'Specify the source identity for this batch reference.');

            $totalDebit = round((float) $lines->sum('debit'), 2);
            $totalCredit = round((float) $lines->sum('credit'), 2);
            abort_if(abs($totalDebit - $totalCredit) >= 0.005, 422, 'Journal batch is not balanced.');

            $reviewedAt = now();
            $adminId = Auth::guard('admin')->id();

            foreach ($lines as $line) {
                abort_if(blank($line->branch), 422, 'Journal line is missing an office branch.');

                $ledgerData = [
                    'branch' => $line->branch,
                    'referenceNo' => $line->batch_reference,
                    'memberId' => $line->memberId,
                    'accountCode' => $line->account_code,
                    'accountName' => $line->account_name,
                    'debit' => $line->debit,
                    'credit' => $line->credit,
                    'particulars' => $line->particulars,
                    'transactionDate' => $line->transaction_date,
                ];

                if ($line->source_type === 'petty_cash') {
                    $ledgerData['petty_cash_id'] = $line->source_record_id;
                } elseif ($line->source_type === 'ewallet') {
                    $ledgerData['e_wallet_id'] = $line->source_record_id;
                } elseif ($line->source_type === 'bank') {
                    $ledgerData['bank_record_id'] = $line->source_record_id;
                }

                AccGeneralLedger::create($ledgerData);

                $line->update([
                    'status' => 'approved',
                    'reviewed_by' => $adminId,
                    'reviewed_at' => $reviewedAt,
                    'reviewer_notes' => $validated['notes'] ?? null,
                ]);
            }

            $this->markSourceRecordsPosted($lines, true);
        });

        return response()->json([
            'ok' => true,
            'message' => 'Journal batch approved and posted to the general ledger.',
        ]);
    }

    public function reject(Request $request, string $batchReference): JsonResponse
    {
        $sourceType = $this->validatedSourceType($request);
        $sourceRecordId = $request->integer('source_record_id') ?: null;
        $branch = trim((string) $request->input('branch', ''));
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($batchReference, $validated, $sourceType, $sourceRecordId, $branch): void {
            $lines = AccJournalEntry::query()
                ->where('batch_reference', $batchReference)
                ->where('status', 'pending_review')
                ->when($sourceType !== '', fn ($query) => $query->where('source_type', $sourceType))
                ->when($sourceRecordId !== null, fn ($query) => $query->where('source_record_id', $sourceRecordId))
                ->when($branch !== '', fn ($query) => $query->where('branch', $branch))
                ->lockForUpdate()
                ->get();

            abort_if($lines->isEmpty(), 404, 'Journal batch not found or already reviewed.');
            abort_if($lines->map(fn ($line) => [$line->source_type, $line->source_record_id, $line->branch])->unique()->count() > 1, 409, 'Specify the source identity for this batch reference.');

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

            $this->markSourceRecordsPosted($lines, false);
        });

        return response()->json([
            'ok' => true,
            'message' => 'Journal batch rejected.',
        ]);
    }

    private function validatedSourceType(Request $request): string
    {
        $sourceType = trim((string) $request->input('source_type', ''));
        abort_if($sourceType !== '' && !in_array($sourceType, self::SOURCE_TYPES, true), 422, 'Invalid journal source type.');

        return $sourceType;
    }

    private function markSourceRecordsPosted(Collection $lines, bool $posted): void
    {
        $sourceType = $lines->first()->source_type;
        $sourceIds = $lines->pluck('source_record_id')->filter()->unique()->values();
        if ($sourceIds->isEmpty()) {
            return;
        }

        if ($sourceType === 'petty_cash') {
            AccPettyCashFund::whereIn('id', $sourceIds)->update(['is_posted' => $posted]);
        } elseif ($sourceType === 'ewallet') {
            AccEWallet::whereIn('id', $sourceIds)->update(['is_posted' => $posted]);
        } elseif ($sourceType === 'bank') {
            AccBankRecord::whereIn('id', $sourceIds)->update(['is_journalized' => $posted]);
        }
    }
}
