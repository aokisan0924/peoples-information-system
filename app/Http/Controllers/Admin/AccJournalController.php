<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccJournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AccJournalController extends Controller
{
    /**
     * Unified journal index — all source types, filterable.
     */
    public function index(Request $request): Response
    {
        $status     = $request->input('status', 'pending_review');
        $sourceType = $request->input('source_type', '');
        $search     = $request->input('search', '');
        $perPage    = (int) $request->input('perPage', 15);

        $query = AccJournalEntry::with(['member', 'reviewer'])
            ->when($status,     fn($q) => $q->where('status', $status))
            ->when($sourceType, fn($q) => $q->where('source_type', $sourceType))
            ->when($search,     fn($q) => $q->where(function ($q) use ($search) {
                $q->where('batch_reference', 'like', "%{$search}%")
                  ->orWhere('particulars', 'like', "%{$search}%");
            }))
            ->orderBy('created_at', 'desc');

        // Group by batch_reference so each batch shows as one row
        $batches = $query->get()
            ->groupBy('batch_reference')
            ->map(function ($lines) {
                $first = $lines->first();
                $dr    = $lines->firstWhere('debit', '>', 0);
                $cr    = $lines->firstWhere('credit', '>', 0);
                return [
                    'batch_reference'  => $first->batch_reference,
                    'source_type'      => $first->source_type,
                    'memberId'         => $first->memberId,
                    'member'           => $first->member,
                    'branch'           => $first->branch,
                    'transaction_date' => optional($first->transaction_date)->toDateString(),
                    'status'           => $first->status,
                    'particulars'      => $first->particulars,
                    'amount'           => $dr?->debit ?? 0,
                    'debit_line'       => $dr,
                    'credit_line'      => $cr,
                    'reviewed_by'      => $first->reviewer,
                    'reviewed_at'      => optional($first->reviewed_at)->toDateTimeString(),
                    'reviewer_notes'   => $first->reviewer_notes,
                    'created_at'       => optional($first->created_at)->toDateTimeString(),
                ];
            })
            ->values();

        // Manual pagination
        $page      = (int) $request->input('page', 1);
        $paged     = $batches->forPage($page, $perPage);
        $paginator = new LengthAwarePaginator(
            $paged, $batches->count(), $perPage, $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Admin/AccJournalIndex', [
            'entries'  => $paginator,
            'filters'  => compact('status', 'sourceType', 'search', 'perPage'),
            'accounts' => AccJournalEntry::allAssetAccounts(),
            'liabilities' => AccJournalEntry::allLiabilityAccounts(),
        ]);
    }

    /**
     * Edit a journal batch (clerk corrects accounts/amounts before approving).
     */
    public function update(Request $request, string $batchReference): JsonResponse
    {
        $request->validate([
            'debit_account_code'  => ['required', 'string', 'max:20'],
            'debit_account_name'  => ['required', 'string', 'max:200'],
            'credit_account_code' => ['required', 'string', 'max:20'],
            'credit_account_name' => ['required', 'string', 'max:200'],
            'amount'              => ['required', 'numeric', 'min:0.01'],
            'particulars'         => ['nullable', 'string', 'max:500'],
        ]);

        $lines = AccJournalEntry::where('batch_reference', $batchReference)
            ->where('status', 'pending_review')
            ->get();

        if ($lines->isEmpty()) {
            return response()->json(['error' => true, 'message' => 'Entry not found or already reviewed.'], 404);
        }

        $amount = (float) $request->amount;

        foreach ($lines as $line) {
            if ($line->debit > 0) {
                $line->update([
                    'account_code' => $request->debit_account_code,
                    'account_name' => $request->debit_account_name,
                    'debit'        => $amount,
                    'credit'       => 0,
                    'particulars'  => $request->particulars ?? $line->particulars,
                ]);
            } else {
                $line->update([
                    'account_code' => $request->credit_account_code,
                    'account_name' => $request->credit_account_name,
                    'debit'        => 0,
                    'credit'       => $amount,
                    'particulars'  => $request->particulars ?? $line->particulars,
                ]);
            }
        }

        return response()->json(['error' => false, 'message' => 'Journal entry updated.']);
    }

    /**
     * Approve & post to general ledger.
     */
    public function approve(Request $request, string $batchReference): JsonResponse
    {
        $lines = AccJournalEntry::where('batch_reference', $batchReference)
            ->where('status', 'pending_review')
            ->get();

        if ($lines->isEmpty()) {
            return response()->json(['error' => true, 'message' => 'Entry not found or already reviewed.'], 404);
        }

        $adminId = Auth::guard('admin')->id();

        foreach ($lines as $line) {
            $line->update([
                'status'         => 'approved',
                'reviewed_by'    => $adminId,
                'reviewed_at'    => now(),
                'reviewer_notes' => $request->input('notes'),
            ]);
        }

        return response()->json([
            'error'   => false,
            'message' => 'Entry approved and posted to general ledger.',
        ]);
    }

    /**
     * Reject — requires a reason.
     */
    public function reject(Request $request, string $batchReference): JsonResponse
    {
        $request->validate([
            'notes' => ['required', 'string', 'max:500'],
        ]);

        $lines = AccJournalEntry::where('batch_reference', $batchReference)
            ->where('status', 'pending_review')
            ->get();

        if ($lines->isEmpty()) {
            return response()->json(['error' => true, 'message' => 'Entry not found or already reviewed.'], 404);
        }

        $adminId = Auth::guard('admin')->id();

        foreach ($lines as $line) {
            $line->update([
                'status'         => 'rejected',
                'reviewed_by'    => $adminId,
                'reviewed_at'    => now(),
                'reviewer_notes' => $request->notes,
            ]);
        }

        return response()->json(['error' => false, 'message' => 'Entry rejected.']);
    }
}