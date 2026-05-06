<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index() {
        $reports = Report::orderBy('report_month', 'desc')->get();
        return Inertia::render('Admin/Reports', ['reports' => $reports]);
    }

    public function download(Report $report) {
        if (!Storage::disk('public')->exists($report->file_path)) {
            abort(404, 'File not found on server.');
        }
        
        $fullPath = Storage::disk('public')->path($report->file_path);

        return response()->download($fullPath, $report->title . '.pdf');
    }

    public function generateReportNow(Request $request) {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2100',
        ]);

        try {
            set_time_limit(120);

            Artisan::call('report:generate-monthly', [
                '--month' => $request->month,
                '--year' => $request->year
            ]);
            
            return redirect()->back()->with('success', 'Report generated successfully.');

        } catch (\Exception $e) {
            Log::error('Manual Report Generation Failed: ' . $e->getMessage());

            return redirect()->back()->withErrors([
                'error' => 'Failed to generate report. The AI service might be busy. Please try again.'
            ]);
        }
    }
}
