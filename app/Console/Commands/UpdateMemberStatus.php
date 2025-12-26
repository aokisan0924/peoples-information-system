<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Member;
use App\Models\CapitalContribution; 
use Carbon\Carbon;

class UpdateMemberStatus extends Command
{
    protected $signature = 'members:update-status';
    protected $description = 'Updates member accountStatus based on tenure and share capital';

    public function handle()
    {
        $this->info('Updating Member Statuses...');

        Member::chunk(100, function ($members) {
            foreach ($members as $member) {
                // 1. Calculate Membership Duration (in Years)
                $yearsAsMember = $member->created_at->diffInYears(Carbon::now());

                // 2. Calculate Total Share Capital (Deposits - Withdrawals)
                // FIX: Using singular 'capitalContribution' to match your Model
                $deposits = $member->capitalContribution() 
                    ->where('transactionType', 'Deposit') 
                    ->sum('amount');
                
                $withdrawals = $member->capitalContribution()
                    ->where('transactionType', 'Withdrawal')
                    ->sum('amount');

                $totalShareCapital = $deposits - $withdrawals;

                // 3. Check for Membership Fee (300.00)
                // We check if they have a MembershipPayment record
                $hasPaidFee = $member->membershipPayment()->exists();

                // 4. APPLY LOGIC
                $status = 'Unverified'; // Default

                if ($hasPaidFee) {
                    // Default to Verified if fee is paid
                    $status = 'Verified Member';

                    // Check for Associate (5k capital)
                    if ($totalShareCapital >= 5000) {
                        $status = 'Associate Member';
                    }

                    // Check for Regular (2 years AND 35k capital)
                    // Regular overrides Associate if both conditions are met
                    if ($yearsAsMember >= 2 && $totalShareCapital >= 35000) {
                        $status = 'Regular Member';
                    }
                } else {
                    // If no membership fee paid, they remain Unverified
                    $status = 'Unverified';
                }

                // 5. UPDATE RECORD
                if ($member->accountStatus !== $status) {
                    $member->accountStatus = $status;
                    $member->save();
                }
            }
        });

        $this->info('Member statuses updated successfully.');
    }
}