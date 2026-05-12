<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AccGeneralLedger;
use Carbon\Carbon;

class AccGeneralLedgerSampleSeeder extends Seeder
{
    public function run(): void
    {
        $branch = 'Main Office';
        $date = Carbon::create(2026, 1, 15); // Mid-Jan 2026
        $adjDate = Carbon::create(2026, 1, 31); // End-Jan 2026

        $transactions = [
            // --- NORMAL DAILY TRANSACTIONS (is_adjustment = false) ---
            
            // 1. Members deposited Share Capital (Cash In)
            ['date' => $date, 'ref' => 'OR-1001', 'code' => '11130', 'name' => 'Cash in Bank', 'dr' => 150000, 'cr' => 0, 'adj' => false],
            ['date' => $date, 'ref' => 'OR-1001', 'code' => '30110', 'name' => 'Share Capital - Common', 'dr' => 0, 'cr' => 150000, 'adj' => false],

            // 2. Members deposited Savings (Cash In)
            ['date' => $date->copy()->addDay(), 'ref' => 'OR-1002', 'code' => '11130', 'name' => 'Cash in Bank', 'dr' => 50000, 'cr' => 0, 'adj' => false],
            ['date' => $date->copy()->addDay(), 'ref' => 'OR-1002', 'code' => '21110', 'name' => 'Savings Deposit', 'dr' => 0, 'cr' => 50000, 'adj' => false],

            // 3. Released a Loan to a member (Cash Out)
            ['date' => $date->copy()->addDays(2), 'ref' => 'CV-2001', 'code' => '11210', 'name' => 'Loans Receivable', 'dr' => 100000, 'cr' => 0, 'adj' => false],
            ['date' => $date->copy()->addDays(2), 'ref' => 'CV-2001', 'code' => '11130', 'name' => 'Cash in Bank', 'dr' => 0, 'cr' => 100000, 'adj' => false],

            // 4. Collected Loan Payment with Interest & Fees (Cash In)
            ['date' => $date->copy()->addDays(5), 'ref' => 'OR-1003', 'code' => '11130', 'name' => 'Cash in Bank', 'dr' => 25000, 'cr' => 0, 'adj' => false],
            ['date' => $date->copy()->addDays(5), 'ref' => 'OR-1003', 'code' => '11210', 'name' => 'Loans Receivable', 'dr' => 0, 'cr' => 20000, 'adj' => false],
            ['date' => $date->copy()->addDays(5), 'ref' => 'OR-1003', 'code' => '40110', 'name' => 'Interest Income From Loans', 'dr' => 0, 'cr' => 4000, 'adj' => false],
            ['date' => $date->copy()->addDays(5), 'ref' => 'OR-1003', 'code' => '40120', 'name' => 'Service Fees', 'dr' => 0, 'cr' => 1000, 'adj' => false],

            // 5. Paid Office Salaries & Supplies (Cash Out)
            ['date' => $date->copy()->addDays(10), 'ref' => 'CV-2002', 'code' => '73160', 'name' => 'Salaries and Wages', 'dr' => 30000, 'cr' => 0, 'adj' => false],
            ['date' => $date->copy()->addDays(10), 'ref' => 'CV-2002', 'code' => '73240', 'name' => 'Office Supplies', 'dr' => 5000, 'cr' => 0, 'adj' => false],
            ['date' => $date->copy()->addDays(10), 'ref' => 'CV-2002', 'code' => '11130', 'name' => 'Cash in Bank', 'dr' => 0, 'cr' => 35000, 'adj' => false],


            // --- MONTH-END ADJUSTMENTS (is_adjustment = true) ---
            
            // 6. Depreciation of Transport Equipment (Non-Cash)
            ['date' => $adjDate, 'ref' => 'ADJ-001', 'code' => '73375', 'name' => 'Depreciation - Transport Eqpt', 'dr' => 15000, 'cr' => 0, 'adj' => true],
            ['date' => $adjDate, 'ref' => 'ADJ-001', 'code' => '14215', 'name' => 'Accumulated Deprn - Transport', 'dr' => 0, 'cr' => 15000, 'adj' => true],

            // 7. Provision for Probable Loan Losses (Non-Cash)
            ['date' => $adjDate, 'ref' => 'ADJ-002', 'code' => '71100', 'name' => 'Provision for Probable Losses', 'dr' => 54071.77, 'cr' => 0, 'adj' => true],
            ['date' => $adjDate, 'ref' => 'ADJ-002', 'code' => '11242', 'name' => 'Allowance for Probable Losses', 'dr' => 0, 'cr' => 54071.77, 'adj' => true],
        ];

        foreach ($transactions as $t) {
            AccGeneralLedger::create([
                'branch'          => $branch,
                'transactionDate' => $t['date'],
                'referenceNo'     => $t['ref'],
                'particulars'     => 'Sample Transaction',
                'accountCode'     => $t['code'],
                'accountName'     => $t['name'],
                'debit'           => $t['dr'],
                'credit'          => $t['cr'],
                'is_adjustment'   => $t['adj'],
            ]);
        }
    }
}