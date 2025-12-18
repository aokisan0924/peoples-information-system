<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LoanSetting;
use Illuminate\Http\Request;

class LoanSettingController extends Controller
{
    public function index() {
        $settings = LoanSetting::orderBy('term')->get();
        return inertia('Admin/AdminLoanSettings', ['settings' => $settings]);
    }

    public function update(Request $request) {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.term' => 'required|integer|min:1|max:255',
            'settings.*.annual_interest_rate' => 'required|numeric|min:0|max:1',
            'settings.*.service_fee_rate' => 'required|numeric|min:0|max:1',
            'settings.*.insurance_rate_per_1000' => 'required|numeric|min:0|max:1000',
            'settings.*.advance_interest_months' => 'required|integer|min:1|max:12',
        ]);

        foreach ($request->settings as $setting) {
            LoanSetting::updateOrCreate(
                ['term' => $setting['term']],
                [
                    'annual_interest_rate' => $setting['annual_interest_rate'],
                    'service_fee_rate' => $setting['service_fee_rate'],
                    'insurance_rate_per_1000' => $setting['insurance_rate_per_1000'],
                    'advance_interest_months' => $setting['advance_interest_months'],
                ]
            );
        }
        return back();
    }
}
