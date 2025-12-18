<?php

namespace App\Http\Controllers;

use App\Models\Computations;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class PublicCalculatorController extends Controller
{
    public function publicCalculatorIndex() {
        return Inertia::render('Calculator');
    }

    public function activePensionerV1(Request $request) : JsonResponse {
        // Validate public inputs
        $data = $request->validate([
            'netProceeds' => ['required', 'numeric', 'min:1'],
            'term'        => ['required', 'integer', 'in:12,24,36,48,60'],
        ]);

        $netProceeds = (float) $data['netProceeds'];
        $termMonths  = (int) $data['term'];

        // Fixed values for PUBLIC computation
        $membershipFee       = 300;
        $capitalContribution = 5000;
        $advanceMonths       = 2;
        $category            = 'ACTIVE_PENSIONER_V1';

        // Fetch active computation row
        $comp = Computations::where('category', $category)
            ->where('termMonths', $termMonths)
            ->where('isActive', true)
            ->first();

        if (!$comp) {
            return response()->json([
                'message' => "No active computation found for {$category} (term {$termMonths})."
            ], 422);
        }

        // Variables for formula engine
        $vars = [
            'netProceeds'           => $netProceeds,
            'capCon'                => $capitalContribution,
            'membershipFee'         => $membershipFee,
            'terms'                 => $termMonths,
            'advanceInterestMonths' => $advanceMonths,
        ];

        // Evaluate formulas using your real safe evaluation engine
        $annualRate     = (float) $this->evaluateFormulaSafely($comp->annualRateFormula, $vars);
        $vars['annualInterestRate'] = $annualRate;

        $monthlyRate    = (float) $this->evaluateFormulaSafely($comp->monthlyRateFormula, $vars);
        $vars['monthlyInterestRate'] = $monthlyRate;

        $serviceFee      = (float) $this->evaluateFormulaSafely($comp->serviceFeeFormula, $vars);
        $insurance       = (float) $this->evaluateFormulaSafely($comp->insuranceFormula, $vars);
        $advanceInterest = (float) $this->evaluateFormulaSafely($comp->advanceInterestFormula, $vars);

        // Compute loanAmount from netProceeds + all deductions
        $loanAmount = $netProceeds
                    + $serviceFee
                    + $insurance
                    + $capitalContribution
                    + $membershipFee
                    + $advanceInterest;

        // PMT / Monthly Amortization Formula
        $r = $monthlyRate;
        $n = (float) $termMonths;

        $pow = pow(1 + $r, $n);
        $numerator   = $pow * $r;
        $denominator = $pow - 1.0;
        $ratio       = ($denominator != 0.0) ? ($numerator / $denominator) : 0.0;

        $monthlyAmortization = round($loanAmount * $ratio, 2);

        // Return ONLY the 4 values needed by public calculator
        return response()->json([
            'monthlyAmortization' => $monthlyAmortization,
            'membershipFee'       => round($membershipFee, 2),
            'capitalContribution' => round($capitalContribution, 2),
            'netProceeds'         => round($netProceeds, 2),
        ]);
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
}
