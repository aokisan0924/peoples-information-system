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
    protected $description = 'Generates the AI Monthly Executive Report by Branch (Pure Eloquent)';

    public function handle(GeminiService $gemini){
        if ($this->option('month') && $this->option('year')) {
            $targetDate = Carbon::createFromDate($this->option('year'), $this->option('month'), 1);
            $this->info('Generating report for specific month: ' . $targetDate->format('F Y'));
        } elseif ($this->option('current')) {
            $targetDate = Carbon::now();
            $this->info('Generating report for the CURRENT month...');
        } else {
            $targetDate = Carbon::now()->subMonth();
            $this->info('Generating report for the PREVIOUS month...');
        }
        
        $start = $targetDate->copy()->startOfMonth();
        $end = $targetDate->copy()->endOfMonth();
        $monthName = $targetDate->format('F Y');
        $reportTitle = "President's Report - " . $monthName;

        $branches = ['Cubao', 'Fort Magsaysay', 'Isabela'];
        $stats = [];
        $logs = []; 

        foreach ($branches as $branch) {
            $stats[$branch] = [
                'loans_released_count' => 0, 'loans_released_amount' => 0,
                'total_income' => 0, 'share_cap_deposit' => 0, 'share_cap_withdrawal' => 0,
                'savings_deposit' => 0, 'savings_withdrawal' => 0,
                'time_deposit_amount' => 0, 'new_members' => 0, 'dismembers' => 0,
            ];
            $logs[$branch] = [
                'loans' => [], 'share_capital' => [], 'savings' => [],
                'time_deposit' => [], 'new_members' => [], 'dismembers' => []
            ];
        }

        // 3. GATHER DATA
        $loans = Loan::where('status', 'released')->whereBetween('updated_at', [$start, $end])->with(['member.branchService'])->get();
        foreach ($loans as $loan) {
            $b = $this->getBranch($loan->member);
            if (isset($stats[$b])) {
                $stats[$b]['loans_released_count']++;
                $stats[$b]['loans_released_amount'] += $loan->gross;
                $stats[$b]['total_income'] += $loan->income;
                $logs[$b]['loans'][] = [
                    'name' => $this->getMemberName($loan->member),
                    'gross' => $loan->gross, 'net' => $loan->net,
                    'amortization' => $loan->monthlyAmortization, 'date' => $loan->updated_at->format('M d')
                ];
            }
        }

        $caps = CapitalContribution::whereBetween('created_at', [$start, $end])->with(['member.branchService'])->get();
        foreach ($caps as $cap) {
            $b = $this->getBranch($cap->member);
            if (isset($stats[$b])) {
                $type = strtolower($cap->transactionType);
                if ($type === 'deposit') $stats[$b]['share_cap_deposit'] += $cap->amount;
                elseif ($type === 'withdrawal') $stats[$b]['share_cap_withdrawal'] += $cap->amount;
                $logs[$b]['share_capital'][] = [
                    'name' => $this->getMemberName($cap->member), 'type' => ucfirst($type),
                    'amount' => $cap->amount, 'date' => $cap->created_at->format('M d')
                ];
            }
        }

        $savings = SavingsDeposit::whereBetween('created_at', [$start, $end])->with(['member.branchService'])->get();
        foreach ($savings as $saving) {
            $b = $this->getBranch($saving->member);
            if (isset($stats[$b])) {
                $type = strtolower($saving->transactionType);
                if ($type === 'deposit') $stats[$b]['savings_deposit'] += $saving->amount;
                elseif ($type === 'withdrawal') $stats[$b]['savings_withdrawal'] += $saving->amount;
                $logs[$b]['savings'][] = [
                    'name' => $this->getMemberName($saving->member), 'type' => ucfirst($type),
                    'amount' => $saving->amount, 'date' => $saving->created_at->format('M d')
                ];
            }
        }

        $tds = TimeDeposit::whereBetween('created_at', [$start, $end])->with(['member.branchService'])->get();
        foreach ($tds as $td) {
            $b = $this->getBranch($td->member);
            if (isset($stats[$b])) {
                $stats[$b]['time_deposit_amount'] += $td->principal;
                $logs[$b]['time_deposit'][] = [
                    'name' => $this->getMemberName($td->member),
                    'amount' => $td->principal, 'date' => $td->created_at->format('M d')
                ];
            }
        }

        $newMembers = Member::whereBetween('created_at', [$start, $end])->with('branchService')->get();
        foreach ($newMembers as $mem) {
            $b = $this->getBranch($mem);
            if (isset($stats[$b])) {
                $stats[$b]['new_members']++;
                $logs[$b]['new_members'][] = $this->getMemberName($mem);
            }
        }
        $dismembers = Member::whereBetween('updated_at', [$start, $end])->where('accountStatus', 'Terminated')->with('branchService')->get();
        foreach ($dismembers as $mem) {
            $b = $this->getBranch($mem);
            if (isset($stats[$b])) {
                $stats[$b]['dismembers']++;
                $logs[$b]['dismembers'][] = $this->getMemberName($mem);
            }
        }

        $prompt = "You are Col. Alexander L. Feria (RET), CPA, MNSA. Analyze the PMPC Branch Data for {$monthName}.\n";
        
        foreach ($stats as $branch => $data) {
            $prompt .= "BRANCH: {$branch}\n";
            $prompt .= "- Loans: {$data['loans_released_count']} released (₱" . number_format($data['loans_released_amount']) . ")\n";
            $prompt .= "- Income: ₱" . number_format($data['total_income']) . "\n";
            $prompt .= "- Share Capital: +₱" . number_format($data['share_cap_deposit']) . " / -₱" . number_format($data['share_cap_withdrawal']) . "\n";
            $prompt .= "- Savings: +₱" . number_format($data['savings_deposit']) . " / -₱" . number_format($data['savings_withdrawal']) . "\n";
            $prompt .= "- Time Deposit: ₱" . number_format($data['time_deposit_amount']) . "\n";
            $prompt .= "- Membership: +{$data['new_members']} new, -{$data['dismembers']} left\n\n";
        }

        $prompt .= "INSTRUCTIONS:\n";
        $prompt .= "1. Output valid HTML (<h3>, <p>, <ul>). Do NOT use Markdown.\n";
        $prompt .= "2. DO NOT include a Header (To/From/Date/Subject). Start directly with the Executive Summary.\n"; 
        $prompt .= "3. DO NOT sign the document at the bottom. The signature block is already pre-printed.\n";
        $prompt .= "4. Write an 'Executive Summary' comparing the branches.\n";
        $prompt .= "5. Write a 'Branch Analysis' highlighting the top performing branch.\n";
        $prompt .= "6. Provide 'Recommendations' for growth.\n";
        $prompt .= "7. Write a 'Conclusion'.\n";

        $this->info("Contacting Gemini AI...");

        try {
            $aiContent = $gemini->generateContent($prompt);
            
            $aiContent = str_replace('₱', '&#8369;', $aiContent);
            
            $aiContent = preg_replace('/```(html)?/i', '', $aiContent);
            $aiContent = trim($aiContent);

            $aiContent = str_ireplace(
                ['From: Chief Financial Analyst', 'To: PMPC Board', 'Subject:', 'Date:', 'Executive Report:'], 
                '', 
                $aiContent
            );
        } catch (\Exception $e) {
            Log::error('Gemini AI Report Failed: ' . $e->getMessage());
            $this->error("AI Generation failed. Using fallback text.");
            
            $aiContent = "<h3>Executive Summary</h3><p>The automated AI analysis could not be generated at this time due to an API timeout. Please review the attached numerical data logs for the performance of the branches this month.</p>";
        }

        $pdf = Pdf::loadView('pdf.monthly-report', [
            'stats' => $stats,
            'logs' => $logs,
            'aiContent' => $aiContent,
            'monthName' => $monthName,
            'date' => now()->format('F d, Y')
        ])->setPaper('A4', 'portrait');

        $fileName = 'reports/Presidents_Report_' . str_replace(' ', '_', $monthName) . '_' . time() . '.pdf';
        Storage::disk('public')->put($fileName, $pdf->output());

        Report::updateOrCreate(
            ['report_month' => $start->format('Y-m-d')],
            [
                'title' => $reportTitle,
                'file_path' => $fileName
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