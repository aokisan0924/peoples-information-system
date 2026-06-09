<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

// Models
use App\Models\Member;
use App\Models\BranchService;
use App\Models\CapitalContribution;
use App\Models\Dependent;
use App\Models\Loan;
use App\Models\SavingsDeposit;
use App\Models\TimeDeposit;
use App\Models\MembershipPayment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class MemberDataController extends Controller
{
    // =========================================================================
    // 1. EXPORT FUNCTION
    // =========================================================================
    public function exportSpreadsheet() {
        $spreadsheet = new Spreadsheet();
        $membersSheet = $spreadsheet->setActiveSheetIndex(0);
        $membersSheet->setTitle('Members');

        $headers = [
            'ID','Username','First Name','Middle Name','Last Name','Suffix','Nickname','DOB','Religion',
            'Age','Gender','Civil Status','Nationality','Email','Contact','Full Address','Region',
            'Province','City','Barangay','Branch Service','Sub Branch','AFPSN','Rank','Designation',
            'AFP ID','Present Assignment','Control No','Years In Service','Cad Enlistment',
            'Retirement Date','Pension Date','Mother Name','Mother Age','Father Name','Father Age',
            'TIN No','GSIS No','CRN UMID No','Spouse Name','Spouse Age','Spouse DOB','Date Marriage',
            'Emergency Contact Name','Emergency Contact Address','Emergency Contact Phone','Emergency Contact Relation'
        ];

        $membersSheet->fromArray($headers, NULL, 'A1');

        $members = Member::with([
            'branchService','afpInfo','parentsInfo',
            'identificationInfo','spouseInfo','emergencyContact'
        ])->get();

        $row = 2;
        foreach ($members as $member) {
            $data = [
                $member->id, $member->username, $member->firstName, $member->middleName, $member->lastName, $member->suffix, $member->nickname, $member->dob, $member->religion, $member->age, $member->gender, $member->civilStatus, $member->nationality, $member->email, $member->contact, $member->fullAddress, $member->region, $member->province, $member->city, $member->barangay,
                $member->branchService->branchService ?? '', $member->branchService->subBranch ?? '',
                $member->afpInfo->afpsn ?? '', $member->afpInfo->rank ?? '', $member->afpInfo->designation ?? '', $member->afpInfo->afpId ?? '', $member->afpInfo->presentAssignment ?? '', $member->afpInfo->controlNo ?? '', $member->afpInfo->yearsInService ?? '', $member->afpInfo->cadEnlistment ?? '', $member->afpInfo->retirementDate ?? '', $member->afpInfo->pensionDate ?? '',
                $member->parentsInfo->motherName ?? '', $member->parentsInfo->motherAge ?? '', $member->parentsInfo->fatherName ?? '', $member->parentsInfo->fatherAge ?? '',
                $member->identificationInfo->tinNo ?? '', $member->identificationInfo->gsisNo ?? '', $member->identificationInfo->crnUmidNo ?? '',
                $member->spouseInfo->spouseName ?? '', $member->spouseInfo->spouseAge ?? '', $member->spouseInfo->spouseDob ?? '', $member->spouseInfo->dateMarriage ?? '',
                $member->emergencyContact->contactPersonName ?? '', $member->emergencyContact->contactPersonAddress ?? '', $member->emergencyContact->contactPersonPhone ?? '', $member->emergencyContact->contactPersonRelation ?? ''
            ];
            $membersSheet->fromArray($data, NULL, 'A'.$row);
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'PIS_Member_Export_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
        $temp_file = tempnam(sys_get_temp_dir(), $filename);
        $writer->save($temp_file);

        return Response::download($temp_file, $filename)->deleteFileAfterSend(true);
    }

    // =========================================================================
    // 2. IMPORT FUNCTION
    // =========================================================================
    public function importSpreadsheet(Request $request) {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls']]);

        $file = $request->file('file');
            
        DB::transaction(function () use ($file) {
            $spreadsheet = IOFactory::load($file->getPathname());
            $importKeyMap = [];

            // -----------------------------------------------------------------
            // SHEET 1: MEMBERS
            // -----------------------------------------------------------------
            $membersSheet = $spreadsheet->getSheetByName('Members');
            if ($membersSheet) {
                $rows = $membersSheet->toArray(null, true, true, true);
                
                foreach (array_slice($rows, 1) as $row) {
                    $importKey = trim((string)($row['A'] ?? ''));
                    if (!$importKey && empty($row['C']) && empty($row['E'])) continue;

                    // MAPPING
                    $firstName = $row['C'] ?? 'Unknown';
                    $lastName  = $row['E'] ?? 'Member';
                    
                    // FIXED: Date of Birth Parsing
                    $dob = $this->parseDate($row['H'] ?? null) ?? '1900-01-01';
                    
                    // Auto-Compute Age
                    try {
                        $age = Carbon::parse($dob)->age;
                    } catch (\Exception $e) {
                        $age = 0;
                    }

                    $email     = !empty($row['N']) ? trim($row['N']) : null;
                    $contact   = !empty($row['O']) ? trim($row['O']) : null;
                    $address   = !empty($row['P']) ? $row['P'] : 'To be updated';
                    
                    // FIXED: Membership Date Parsing
                    $joinedAt  = $this->parseDate($row['Q'] ?? null) ?? now(); 

                    $member = Member::create([
                        'firstName'   => $firstName,
                        'middleName'  => $row['D'] ?? null,
                        'lastName'    => $lastName,
                        'suffix'      => $row['F'] ?? null,
                        'nickname'    => $row['G'] ?? null,
                        
                        'dob'         => $dob,
                        'age'         => $age,
                        'religion'    => $row['I'] ?? null,
                        'gender'      => $row['K'] ?? 'Unspecified',
                        'civilStatus' => $row['L'] ?? 'Single',
                        'nationality' => $row['M'] ?? 'Filipino',
                        
                        'email'       => $email,
                        'contact'     => $contact,
                        'fullAddress' => $address,
                        
                        'password'    => bcrypt(Str::random(10)),
                        'created_at'  => $joinedAt,
                        'updated_at'  => now(),
                    ]);

                    $member->update(['username' => 'PMPC-' . str_pad($member->id, 3, '0', STR_PAD_LEFT)]);

                    if ($importKey) $importKeyMap[$importKey] = $member->id;

                    MembershipPayment::create([
                        'memberId'         => $member->id,
                        'amount'           => 300, 
                        'reference_number' => 'IMP-'.$importKey,
                        'status'           => 'Posted',
                        'is_paid'          => true,
                        'paid_at'          => $joinedAt,
                        'created_at'       => $joinedAt,
                    ]);

                    BranchService::updateOrCreate(['memberId' => $member->id], [
                        'branchService' => $row['U'] ?? 'Main Office',
                        'subBranch'     => $row['V'] ?? null
                    ]);
                }
            }

            // -----------------------------------------------------------------
            // SHEET: DEPENDENTS
            // -----------------------------------------------------------------
            $depSheet = $spreadsheet->getSheetByName('Dependents');
            if ($depSheet && !empty($importKeyMap)) {
                $rows = $depSheet->toArray(null, true, true, true);
                foreach (array_slice($rows, 1) as $row) {
                    $key = $row['A'] ?? null;
                    if ($key && isset($importKeyMap[$key])) {
                        Dependent::create([
                            'memberId' => $importKeyMap[$key],
                            'name'     => $row['B'] ?? 'Unknown',
                            'dob'      => $this->parseDate($row['C'] ?? null),
                            'gender'   => $row['D'] ?? null,
                        ]);
                    }
                }
            }

            // -----------------------------------------------------------------
            // SHEET: LOANS
            // -----------------------------------------------------------------
            $loansSheet = $spreadsheet->getSheetByName('Loans');
            if ($loansSheet && !empty($importKeyMap)) {
                $rows = $loansSheet->toArray(null, true, true, true);
                foreach (array_slice($rows, 1) as $row) {
                    $key = $row['A'] ?? null;
                    if ($key && isset($importKeyMap[$key])) {
                        
                        $loanType       = $row['B'] ?? 'Legacy';
                        $loanClass      = $row['C'] ?? 'Salary Loan';
                        $deductionCode  = $row['D'] ?? 'MIGRATION';
                        
                        $netProceeds    = (float) ($row['E'] ?? 0);
                        $loanAmount     = (float) ($row['F'] ?? $netProceeds);
                        $grossAmount    = (float) ($row['G'] ?? $loanAmount);
                        $monthlyAmort   = (float) ($row['H'] ?? 0);
                        
                        $termYears      = (int)   ($row['I'] ?? 1);
                        $advInterestMos = (int)   ($row['J'] ?? 0);
                        
                        // FIXED: Loan Dates Parsing
                        $dateApplied    = $this->parseDate($row['K'] ?? null) ?? now();
                        $dateReleased   = $this->parseDate($row['L'] ?? null) ?? now();
                        $status         = $row['M'] ?? 'Released';

                        Loan::create([
                            'memberId'              => $importKeyMap[$key],
                            'loanReference'         => 'MIG-' . Str::upper(Str::random(6)) . '-' . $key,
                            'loanType'              => $loanType,
                            'loanClassification'    => $loanClass,
                            'deductionCode'         => $deductionCode,
                            'netProceeds'           => $netProceeds,
                            'loanAmount'            => $loanAmount,
                            'gross'                 => $grossAmount,
                            'monthlyAmortization'   => $monthlyAmort,
                            'termYears'             => $termYears,
                            'advanceInterestMonths' => $advInterestMos,
                            'status'                => $status,
                            'created_at'            => $dateApplied,
                            'releasedAt'            => $dateReleased,

                            'numberOfPayments'      => $termYears * 12,
                            'income'                => $grossAmount - $netProceeds,

                            'serviceFee'            => 0,
                            'insurance'             => 0,
                            'advanceInterest'       => 0,
                            'effectiveInterestRate' => 0,
                            'monthlyInterestRate'   => 0,
                            'processed_by'          => null,
                        ]);
                    }
                }
            }
            
            // -----------------------------------------------------------------
            // FINANCIAL SHEETS
            // -----------------------------------------------------------------
            $sheets = [
                'ShareCapital'   => CapitalContribution::class, 
                'SavingsDeposit' => SavingsDeposit::class, 
                'TimeDeposit'    => TimeDeposit::class
            ];

            foreach ($sheets as $sheetName => $Model) {
                $sheet = $spreadsheet->getSheetByName($sheetName);
                if ($sheet && !empty($importKeyMap)) {
                    $rows = $sheet->toArray(null, true, true, true);
                    foreach (array_slice($rows, 1) as $row) {
                        $key = $row['A'] ?? null;
                        if ($key && isset($importKeyMap[$key])) {
                            $data = [
                                'memberId' => $importKeyMap[$key],
                                'amount'   => $row['B'] ?? 0,
                                'status'   => 'Posted'
                            ];

                            // FIXED: Financial Date Parsing
                            if ($sheetName === 'TimeDeposit') {
                                $data['start_date']    = $this->parseDate($row['C'] ?? null) ?? now();
                                $data['maturity_date'] = $this->parseDate($row['D'] ?? null) ?? now()->addYear();
                                $data['interest_rate'] = $row['E'] ?? 0.05;
                                $data['status']        = 'active';
                            } else {
                                $data['date']      = $this->parseDate($row['C'] ?? null) ?? now();
                                $data['reference'] = $row['D'] ?? 'Beginning Balance';
                            }

                            $Model::create($data);
                        }
                    }
                }
            }
        });

        return back()->with('success', 'Import Completed Successfully.');
    }

    // =========================================================================
    // HELPER: DATE PARSER (Fixes the "Incorrect date value" error)
    // =========================================================================
    private function parseDate($value) {
        if (empty($value)) return null;

        try {
            // Case 1: Excel Serial Date (e.g. 44562)
            if (is_numeric($value)) {
                return ExcelDate::excelToDateTimeObject($value)->format('Y-m-d');
            }

            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    // =========================================================================
    // 3. BULK SEND CREDENTIALS
    // =========================================================================
    public function bulkSendCredentials(Request $request) {
        $members = Member::whereNull('password')
            ->where(function ($q) {
                $q->whereNotNull('email')->orWhereNotNull('contact');
            })->get();

        if ($members->isEmpty()) {
            return back()->with('error', 'No new members require credentials. All existing members have already been sent.');
        }

        $sentCount = 0;
        foreach ($members as $member) {
            $password = Str::random(10);
            $member->update(['password' => bcrypt($password)]);

            $msg = "Welcome to PMPC!\nUser: {$member->username}\nPass: {$password}\nLogin: peoplesmpcoop.com\n\nREMINDERS:\n- Change pass ASAP\n- Update info\n- Keep secure.";

            // 1. Email
            if ($member->email) {
                try {
                    Mail::raw($msg, fn($m) => $m->to($member->email)->subject('PMPC Account Credentials'));
                } catch (\Exception $e) { Log::error("Email failed for {$member->email}"); }
            }

            // 2. SMS
            if ($member->contact) {
                try {
                    Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
                        'apikey'     => config('services.semaphore.api_key'),
                        'number'     => preg_replace('/^0/', '63', trim($member->contact)),
                        'message'    => $msg,
                        'sendername' => config('services.semaphore.sender_name', 'PeoplesCoop'),
                    ]);
                } catch (\Exception $e) { Log::error("SMS failed for {$member->contact}"); }
            }
            $sentCount++;
        }

        return back()->with('success', "Credentials successfully generated and sent to {$sentCount} new members.");
    }

    // =========================================================================
    // SINGLE SEND CREDENTIALS (SUPER-ADMIN PROTECTED)
    // =========================================================================
    public function sendSingleCredential(Request $request, $id) {
        // 1. Validate the incoming request
        $request->validate([
            'password' => ['required', 'string']
        ]);

        // 2. Verify the Super-Admin's password
        if (!Hash::check($request->password, Auth::user()->password)) {
            return back()->with('error', 'Unauthorized: Incorrect Admin Password.');
        }

        // 3. Process the Member
        $member = Member::findOrFail($id);

        if (!$member->email && !$member->contact) {
            return back()->with('error', "Member has no email or contact number on file.");
        }

        $password = Str::random(10);
        $member->password = Hash::make($password); 
        $member->save();

        $msg = "PMPC Account Recovery\nUser: {$member->username}\nNew Pass: {$password}\nLogin: peoplesmpcoop.com\n\nPlease change this immediately upon logging in.";

        $sentVia = [];

        // Email
        if ($member->email) {
            try {
                Mail::raw($msg, fn($m) => $m->to($member->email)->subject('PMPC Password Reset'));
                $sentVia[] = 'Email';
            } catch (\Exception $e) { Log::error("Email fail: " . $e->getMessage()); }
        }

        // SMS
        if ($member->contact) {
            try {
                Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
                    'apikey'     => config('services.semaphore.api_key'),
                    'number'     => preg_replace('/^0/', '63', trim($member->contact)),
                    'message'    => $msg,
                    'sendername' => config('services.semaphore.sender_name', 'PeoplesCoop'),
                ]);
                $sentVia[] = 'SMS';
            } catch (\Exception $e) { Log::error("SMS fail: " . $e->getMessage()); }
        }

        if (empty($sentVia)) {
            return back()->with('error', "Failed to send credentials. Check SMTP/Semaphore configurations.");
        }

        $channels = implode(' and ', $sentVia);
        return back()->with('success', "New credentials authorized and sent via {$channels}.");
    }

    // =========================================================================
    // 4. DOWNLOAD TEMPLATE FUNCTION
    // =========================================================================
    public function downloadTemplate() {
        $spreadsheet = new Spreadsheet();

        // --- SHEET 1: MEMBERS ---
        $sheet = $spreadsheet->setActiveSheetIndex(0);
        $sheet->setTitle('Members');
        $sheet->setCellValue('A1', 'Import Key (Required)');
        $sheet->setCellValue('B1', '(Ignored)');
        $sheet->setCellValue('C1', 'First Name');
        $sheet->setCellValue('D1', 'Middle Name');
        $sheet->setCellValue('E1', 'Last Name');
        $sheet->setCellValue('F1', 'Suffix');
        $sheet->setCellValue('G1', 'Nickname');
        $sheet->setCellValue('H1', 'DOB (YYYY-MM-DD)');
        $sheet->setCellValue('I1', 'Religion');
        $sheet->setCellValue('J1', 'Age');
        $sheet->setCellValue('K1', 'Gender');
        $sheet->setCellValue('L1', 'Civil Status');
        $sheet->setCellValue('M1', 'Nationality');
        $sheet->setCellValue('N1', 'Email');
        $sheet->setCellValue('O1', 'Contact No');
        $sheet->setCellValue('P1', 'Address');
        $sheet->setCellValue('Q1', 'Membership Date (YYYY-MM-DD)');

        // Add example row
        $sheet->setCellValue('A2', 'MEM-001');
        $sheet->setCellValue('C2', 'Juan');
        $sheet->setCellValue('E2', 'Dela Cruz');
        $sheet->setCellValue('H2', '1980-01-01');
        $sheet->setCellValue('N2', 'juan@example.com');
        $sheet->setCellValue('O2', '09171234567');
        $sheet->setCellValue('AV2', '2023-01-15');

        // --- SHEET 2: LOANS ---
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Loans');
        $headers = [
            'A' => 'Import Key', 
            'B' => 'Loan Type', 
            'C' => 'Classification', 
            'D' => 'Deduction Code', 
            'E' => 'Net Proceeds', 
            'F' => 'Loan Amount', 
            'G' => 'Gross Amount', 
            'H' => 'Monthly Amort', 
            'I' => 'Term (Years)', 
            'J' => 'Adv. Interest (Mos)', 
            'K' => 'Date Applied', 
            'L' => 'Date Released', 
            'M' => 'Status'
        ];
        foreach($headers as $col => $val) $sheet->setCellValue($col.'1', $val);
        // Example
        $sheet->setCellValue('A2', 'MEM-001');
        $sheet->setCellValue('B2', 'Salary Loan');
        $sheet->setCellValue('C2', 'New');
        $sheet->setCellValue('D2', '578 SL');
        $sheet->setCellValue('E2', 20000);
        $sheet->setCellValue('F2', 25000);
        $sheet->setCellValue('G2', 25000);
        $sheet->setCellValue('H2', 2083.33);
        $sheet->setCellValue('I2', 1);
        $sheet->setCellValue('J2', 0);
        $sheet->setCellValue('K2', '2023-11-01');
        $sheet->setCellValue('L2', '2023-11-05');
        $sheet->setCellValue('M2', 'Released');

        // --- SHEET 3: SHARE CAPITAL ---
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('ShareCapital');
        $sheet->setCellValue('A1', 'Import Key');
        $sheet->setCellValue('B1', 'Amount');
        $sheet->setCellValue('C1', 'Date');
        $sheet->setCellValue('D1', 'Reference');
        // Example
        $sheet->setCellValue('A2', 'MEM-001');
        $sheet->setCellValue('B2', 15000);
        $sheet->setCellValue('C2', '2023-01-15');
        $sheet->setCellValue('D2', 'Beginning Balance');

        // --- SHEET 4: SAVINGS DEPOSIT ---
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('SavingsDeposit');
        $sheet->setCellValue('A1', 'Import Key');
        $sheet->setCellValue('B1', 'Amount');
        $sheet->setCellValue('C1', 'Date');
        $sheet->setCellValue('D1', 'Reference');
        // Example
        $sheet->setCellValue('A2', 'MEM-001');
        $sheet->setCellValue('B2', 5000);
        $sheet->setCellValue('C2', '2023-01-15');
        $sheet->setCellValue('D2', 'Deposit');

        // --- SHEET 5: TIME DEPOSIT ---
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('TimeDeposit');
        $sheet->setCellValue('A1', 'Import Key');
        $sheet->setCellValue('B1', 'Amount');
        $sheet->setCellValue('C1', 'Start Date');
        $sheet->setCellValue('D1', 'Maturity Date');
        $sheet->setCellValue('E1', 'Rate');
        // Example
        $sheet->setCellValue('A2', 'MEM-001');
        $sheet->setCellValue('B2', 50000);
        $sheet->setCellValue('C2', '2023-06-01');
        $sheet->setCellValue('D2', '2024-06-01');
        $sheet->setCellValue('E2', 0.05);

        // --- SHEET 6: DEPENDENTS ---
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Dependents');
        $sheet->setCellValue('A1', 'Import Key');
        $sheet->setCellValue('B1', 'Name');
        $sheet->setCellValue('C1', 'DOB');
        $sheet->setCellValue('D1', 'Gender');
        // Example
        $sheet->setCellValue('A2', 'MEM-001');
        $sheet->setCellValue('B2', 'Junior Doe');
        $sheet->setCellValue('C2', '2015-05-20');
        $sheet->setCellValue('D2', 'Male');

        // Download
        $writer = new Xlsx($spreadsheet);
        $filename = 'PMPC_Import_Template.xlsx';
        
        return response()->streamDownload(function() use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }
}