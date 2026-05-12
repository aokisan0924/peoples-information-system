<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Loan;
use App\Models\Report;
use App\Models\Member;
use App\Models\CapitalContribution;
use App\Models\SavingsDeposit;
use App\Models\TimeDeposit;
use App\Services\GeminiService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class AutoGenerateMonthlyReport extends Command
{
    protected $signature = 'report:generate-monthly {--month=} {--year=} {--current : Generate for the current month instead of previous}';
    protected $description = 'Generates the AI Monthly Executive Report by Branch';

    public function handle(GeminiService $gemini){
        if ($this->option('month') && $this->option('year')) {
            $targetDate = Carbon::createFromDate($this->option('year'), $this->option('month'), 1);
        } elseif ($this->option('current')) {
            $targetDate = Carbon::now();
        } else {
            $targetDate = Carbon::now()->subMonth();
        }
        
        $start = $targetDate->copy()->startOfMonth();
        $end = $targetDate->copy()->endOfMonth();
        $monthName = $targetDate->format('F Y');
        $reportTitle = "President's Report - " . $monthName;

        $branches = ['Cubao', 'Fort Magsaysay', 'Isabela'];
        $stats = [];

        foreach ($branches as $branch) {
            $stats[$branch] = [
                'loans_released_count' => 0, 
                'loans_released_gross' => 0,
                'loans_released_net' => 0,
                'total_income' => 0,
                'share_cap_deposit' => 0,
                'savings_deposit' => 0,
                'new_members' => 0, 
                'dismembers' => 0,
            ];
        }

        $loans = Loan::where('status', 'released')->whereBetween('updated_at', [$start, $end])->with(['member.branchService'])->get();
        
        foreach ($loans as $loan) {
            $b = $this->getBranch($loan->member);
            if (isset($stats[$b])) {
                $stats[$b]['loans_released_count']++;
                $stats[$b]['loans_released_gross'] += $loan->gross;
                $stats[$b]['loans_released_net'] += $loan->netProceeds; 
                $stats[$b]['total_income'] += $loan->income;
            }
        }

        $caps = CapitalContribution::whereBetween('created_at', [$start, $end])->with(['member.branchService'])->get();
        foreach ($caps as $cap) {
            $b = $this->getBranch($cap->member);
            if (isset($stats[$b]) && strtolower($cap->transactionType) === 'deposit') {
                $stats[$b]['share_cap_deposit'] += $cap->amount;
            }
        }

        $savings = SavingsDeposit::whereBetween('created_at', [$start, $end])->with(['member.branchService'])->get();
        foreach ($savings as $saving) {
            $b = $this->getBranch($saving->member);
            if (isset($stats[$b]) && strtolower($saving->transactionType) === 'deposit') {
                $stats[$b]['savings_deposit'] += $saving->amount;
            }
        }

        $newMembers = Member::whereBetween('created_at', [$start, $end])->with('branchService')->get();
        foreach ($newMembers as $mem) {
            $b = $this->getBranch($mem);
            if (isset($stats[$b])) { $stats[$b]['new_members']++; }
        }
        
        $dismembers = Member::whereBetween('updated_at', [$start, $end])->where('accountStatus', 'Terminated')->with('branchService')->get();
        foreach ($dismembers as $mem) {
            $b = $this->getBranch($mem);
            if (isset($stats[$b])) { $stats[$b]['dismembers']++; }
        }

        $prompt = "You are Col. Alexander L. Feria (RET), CPA, MNSA, the President of PMPC. Write your Monthly Executive Report to the Board of Directors for {$monthName}.\n";
        
        foreach ($stats as $branch => $data) {
            $prompt .= "BRANCH: {$branch}\n";
            $prompt .= "- Loans: {$data['loans_released_count']} transactions (Gross: P" . number_format($data['loans_released_gross'], 2) . ", Net: P" . number_format($data['loans_released_net'], 2) . ")\n";
            $prompt .= "- Membership: +{$data['new_members']} new, -{$data['dismembers']} left\n\n";
        }
        
        $prompt .= "CRITICAL INSTRUCTIONS:\n";
        $prompt .= "1. Output valid HTML (<h3>, <p>, <ul>). DO NOT use Markdown.\n";
        $prompt .= "2. Write strictly in the first-person as the President ('I', 'we', 'our cooperative').\n";
        $prompt .= "3. DO NOT refer to yourself as an 'analyst', 'AI', or third-party observer. You are the President.\n";
        $prompt .= "4. DO NOT include memo headers (To/From/Subject). Start directly with <h3>Executive Summary</h3>.\n";
        $prompt .= "5. DO NOT sign the document at the end. Provide the summary and recommendations only.\n";

        $this->info("Contacting Gemini AI...");
        
        $maxRetries = 3;
        $attempt = 0;
        $success = false;
        $aiContent = '';

        while ($attempt < $maxRetries && !$success) {
            try {
                $attempt++;
                $aiContent = $gemini->generateContent($prompt);
                
                if (str_contains(strtolower($aiContent), 'error 503') || str_contains(strtolower($aiContent), 'unavailable')) {
                    throw new \Exception("API returned 503 Unavailable string.");
                }
                
                // Replace peso symbols with P to prevent DomPDF question marks
                $aiContent = str_replace(['₱', '&#8369;'], 'P', $aiContent);
                $aiContent = preg_replace('/```(html)?/i', '', $aiContent);
                $aiContent = trim($aiContent);

                $aiContent = str_ireplace(
                    ['From: Office of the PMPC President', 'To: PMPC Board', 'Subject:', 'Date:', 'Presidents Report:'], 
                    '', 
                    $aiContent
                );

                $success = true;

            } catch (\Exception $e) {
                Log::warning("Gemini AI Report Failed (Attempt {$attempt}): " . $e->getMessage());
                
                if ($attempt >= $maxRetries) {
                    $this->error("AI Generation failed. Using fallback text.");
                    $aiContent = "<h3>Executive Summary</h3><p>The automated AI analysis could not be generated at this time due to an API timeout. Please review the attached numerical data logs for the performance of the branches this month.</p>";
                } else {
                    sleep(5);
                }
            }
        }

        // GENERATE PDF
        $pdf = Pdf::loadView('pdf.monthly-report', [
            'stats' => $stats,
            'aiContent' => $aiContent,
            'monthName' => $monthName,
            'date' => now()->format('F d, Y')
        ])->setPaper('legal', 'portrait');

        $fileName = 'reports/Presidents_Report_' . str_replace(' ', '_', $monthName) . '_' . time() . '.pdf';
        Storage::disk('public')->put($fileName, $pdf->output());

        Report::updateOrCreate(
            [
                'report_month' => $start->format('Y-m-d')
            ], 
            [
                'title' => $reportTitle, 'file_path' => $fileName
            ]
        );
        $this->info("Generated Report: {$reportTitle}");
    }

    private function getBranch($member) {
        if (!$member || !$member->branchService) return 'Cubao'; 
        $input = strtolower($member->branchService->branchService);
        if (str_contains($input, 'magsaysay')) return 'Fort Magsaysay';
        if (str_contains($input, 'isabela') || str_contains($input, 'santiago')) return 'Isabela';
        return 'Cubao';
    }

    private function getMemberName($member) {
        if (!$member) return 'Unknown Member';
        return $member->firstName . ' ' . $member->lastName;
    }
}