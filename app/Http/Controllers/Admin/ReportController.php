<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReportController extends Controller
{
    // Display the list of generated reports
    public function index() {
        $reports = Report::orderBy('report_month', 'desc')->get();
        return Inertia::render('Admin/Reports', ['reports' => $reports]);
    }

    // Download the PDF file
    public function download(Report $report) {
        // 1. Check existence using Storage facade
        if (!Storage::disk('public')->exists($report->file_path)) {
            abort(404, 'File not found on server.');
        }
        
        $fullPath = Storage::disk('public')->path($report->file_path);

        // 3. Use the global response download helper
        return response()->download($fullPath, $report->title . '.pdf');
    }
}
