<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Computations;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminComputationController extends Controller
{
    public function showLoanSettings () {
        return Inertia::render('Admin/AdminLoanSettings');
    }

    public function computationList( Request $request ) {
        $category = (string) $request->query('category', '');
        $query = Computations::query()->orderByDesc('isActive')->orderBy('termMonths');

        if ($category !== '') {
            $query->where('category', strtoupper($category));
        }

        return response()->json([
            'message' => 'OK',
            'data' => $query->get(),
        ]);
    }

    public function storeComputation( Request $request ) {
        $validated = $this->validatePayload($request);

        if (!empty($validated['category'])) {
            $validated['category'] = strtoupper($validated['category']);
        }

        $comp = Computations::create($validated);

        return response()->json(['message' => 'Computation created successfully', 'data' => $comp]);
    }

    public function updateComputation( Request $request, $id ) {
        $comp = Computations::findOrFail($id);

        $validated = $this->validatePayload($request, true);

        if (!empty($validated['category'])) {
            $validated['category'] = strtoupper($validated['category']);
        }

        $comp->fill($validated)->save();

        return response()->json(['mesasge' => 'Computation updated successfully', 'data' => $comp]);
    }

    public function setActive($id) {
        $comp = Computations::findOrFailt($id);

        DB::transaction(function () use ($comp) {
            Computations::where('category', $comp->category)
                ->where('isActive', true)
                ->update(['isActive => false']);

            $comp->isActive = true;
            $comp->save();
        });

        return response()->json(['message' => 'Computation activated', 'data' => $comp]);
    }

    public function destroyComputation($id) {
        $comp = Computations::findOrFail($id);

        if ($comp->isActive) {
            return response()->json(['message' => 'Cannot delete an active computation. Deactivate first'], 422);
        }
        $comp->delete();

        return response()->json(['message' => 'Computation deleted']);
    }

    private function validatePayload(Request $request, bool $isUpdate = false): array{
        $rules = [
            'title' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'termMonths' => 'required|integer|in:12,24,36,48,60',
            'annualRateFormula' => 'required|string',
            'monthlyRateFormula' => 'required|string',
            'serviceFeeFormula' => 'required|string',
            'insuranceFormula' => 'required|string',
            'advanceInterestFormula' => 'required|string',
            'effectiveRateFormula' => 'nullable|string',
            'isActive' => 'boolean',
            'notes' => 'nullable|string',
        ];

        return $request->validate($rules);
    }
}
