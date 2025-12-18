<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\BranchService;
use App\Models\AfpInfo;
use App\Models\ParentsInfo;
use App\Models\IdentificationInfo;
use App\Models\SpouseInfo;
use App\Models\EmergencyContact;
use App\Models\Dependent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MemberDataController extends Controller
{
    // Export Function
    public function exportSpreadsheet() {
        $spreadsheet = new Spreadsheet();

        // Sheet 1: Members
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
            $membersSheet->fromArray([
                $member->id, $member->username, $member->firstName, $member->middleName, $member->lastName, $member->suffix, $member->nickname, $member->dob, $member->religion, $member->age, $member->gender, $member->civilStatus, $member->nationality, $member->email, $member->contact, $member->fullAddress, $member->region, $member->province, $member->city, $member->barangay,
                $member->branchService->branchService ?? '', $member->branchService->subBranch ?? '',
                $member->afpInfo->afpsn ?? '', $member->afpInfo->rank ?? '', $member->afpInfo->designation ?? '', $member->afpInfo->afpId ?? '', $member->afpInfo->presentAssignment ?? '', $member->afpInfo->controlNo ?? '', $member->afpInfo->yearsInService ?? '', $member->afpInfo->cadEnlistment ?? '', $member->afpInfo->retirementDate ?? '', $member->afpInfo->pensionDate ?? '',
                $member->parentsInfo->motherName ?? '', $member->parentsInfo->motherAge ?? '', $member->parentsInfo->fatherName ?? '', $member->parentsInfo->fatherAge ?? '',
                $member->identificationInfo->tinNo ?? '', $member->identificationInfo->gsisNo ?? '', $member->identificationInfo->crnUmidNo ?? '',
                $member->spouseInfo->spouseName ?? '', $member->spouseInfo->spouseAge ?? '', $member->spouseInfo->spouseDob ?? '', $member->spouseInfo->dateMarriage ?? '',
                $member->emergencyContact->contactPersonName ?? '', $member->emergencyContact->contactPersonAddress ?? '', $member->emergencyContact->contactPersonPhone ?? '', $member->emergencyContact->contactPersonRelation ?? ''
            ], NULL, 'A'.$row);
            $row++;
        }

        // Sheet 2: Dependents
        $dependentsSheet = $spreadsheet->createSheet();
        $dependentsSheet->setTitle('Dependents');
        $dependentsSheet->fromArray(['Member ID', 'Name', 'DOB', 'Gender'], NULL, 'A1');

        $dependents = Dependent::all();
        $row = 2;
        foreach ($dependents as $dependent) {
            $dependentsSheet->fromArray([
                $dependent->memberId, $dependent->name, $dependent->dob, $dependent->gender
            ], NULL, 'A'.$row);
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'PIS_Member_Export_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
        $temp_file = tempnam(sys_get_temp_dir(), $filename);
        $writer->save($temp_file);

        return Response::download($temp_file, $filename)->deleteFileAfterSend(true);
    }

    // Import function
    public function importSpreadsheet(Request $request) {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        $file = $request->file('file');
            
        DB::transaction(function () use ($file) {
            $spreadsheet     = IOFactory::load($file->getPathname());
            $membersSheet    = $spreadsheet->getSheetByName('Members');
            $dependentsSheet = $spreadsheet->getSheetByName('Dependents');


            $importKeyMap = [];

            /**
             * =========================
             *   MEMBERS SHEET IMPORT
             * =========================
             */
            if ($membersSheet) {
                $membersData = $membersSheet->toArray(null, true, true, true);

                foreach (array_slice($membersData, 1) as $row) {
                    $importKey = isset($row['A']) ? trim((string) $row['A']) : null;

                    // Same skip condition you already use
                    if (empty($row['A']) && empty($row['C']) && empty($row['E'])) {
                        continue;
                    }

                    $plainPassword  = Str::random(10);
                    $hashedPassword = bcrypt($plainPassword);

                    $member = Member::create([
                        'firstName'   => $row['C'] ?? null,
                        'middleName'  => $row['D'] ?? null,
                        'lastName'    => $row['E'] ?? null,
                        'suffix'      => $row['F'] ?? null,
                        'nickname'    => $row['G'] ?? null,
                        'dob'         => $row['H'] ?? null,
                        'religion'    => $row['I'] ?? null,
                        'age'         => $row['J'] ?? null,
                        'gender'      => $row['K'] ?? null,
                        'civilStatus' => $row['L'] ?? null,
                        'nationality' => $row['M'] ?? null,
                        'email'       => $row['N'] ?? null,
                        'contact'     => $row['O'] ?? null,
                        'fullAddress' => $row['P'] ?? null,
                        'region'      => $row['Q'] ?? null,
                        'province'    => $row['R'] ?? null,
                        'city'        => $row['S'] ?? null,
                        'barangay'    => $row['T'] ?? null,
                        'password'    => $hashedPassword,
                    ]);

                    $username = 'PMPC-' . str_pad($member->id, 3, '0', STR_PAD_LEFT);
                    $member->username = $username;
                    $member->save();

                    BranchService::updateOrCreate(
                        ['memberId' => $member->id],
                        [
                            'branchService' => $row['U'] ?? null,
                            'subBranch'     => $row['V'] ?? null,
                        ]
                    );

                    AfpInfo::updateOrCreate(
                        ['memberId' => $member->id],
                        [
                            'afpsn'             => $row['W'] ?? null,
                            'rank'              => $row['X'] ?? null,
                            'designation'       => $row['Y'] ?? null,
                            'afpId'             => $row['Z'] ?? null,
                            'presentAssignment' => $row['AA'] ?? null,
                            'controlNo'         => $row['AB'] ?? null,
                            'yearsInService'    => $row['AC'] ?? null,
                            'cadEnlistment'     => $row['AD'] ?? null,
                            'retirementDate'    => $row['AE'] ?? null,
                            'pensionDate'       => $row['AF'] ?? null,
                        ]
                    );

                    ParentsInfo::updateOrCreate(
                        ['memberId' => $member->id],
                        [
                            'motherName' => $row['AG'] ?? null,
                            'motherAge'  => $row['AH'] ?? null,
                            'fatherName' => $row['AI'] ?? null,
                            'fatherAge'  => $row['AJ'] ?? null,
                        ]
                    );

                    IdentificationInfo::updateOrCreate(
                        ['memberId' => $member->id],
                        [
                            'tinNo'     => $row['AK'] ?? null,
                            'gsisNo'    => $row['AL'] ?? null,
                            'crnUmidNo' => $row['AM'] ?? null,
                        ]
                    );

                    SpouseInfo::updateOrCreate(
                        ['memberId' => $member->id],
                        [
                            'spouseName'   => $row['AN'] ?? null,
                            'spouseAge'    => $row['AO'] ?? null,
                            'spouseDob'    => $row['AP'] ?? null,
                            'dateMarriage' => $row['AQ'] ?? null,
                        ]
                    );

                    EmergencyContact::updateOrCreate(
                        ['memberId' => $member->id],
                        [
                            'contactPersonName'     => $row['AR'] ?? null,
                            'contactPersonAddress'  => $row['AS'] ?? null,
                            'contactPersonPhone'    => $row['AT'] ?? null,
                            'contactPersonRelation' => $row['AU'] ?? null,
                        ]
                    );

                    // map importKey → memberId for Dependents
                    if (!empty($importKey)) {
                        $importKeyMap[$importKey] = $member->id;
                    }

                    /**
                     * ======================================
                     *   PER-MEMBER EMAIL + SMS NOTIFICATION
                     * ======================================
                     */

                    if (!empty($member->email)) {
                        $emailBody =
                            "Welcome to People's Multi-Purpose Cooperative!\n\n" .
                            "Your PMPC Online Access credentials are ready.\n\n" .
                            "Login Link: https://peoplesmpcoop.com/\n\n" .
                            "USERNAME: {$member->username}\n" .
                            "PASSWORD: {$plainPassword}\n\n" .
                            "-----------------------------------------\n" .
                            " DO'S AND DON'TS (IMPORTANT)\n" .
                            "-----------------------------------------\n" .
                            "✔ DO change your password immediately after logging in.\n" .
                            "✔ DO keep your username and password confidential.\n" .
                            "✔ DO report any suspicious activity to PMPC Admin.\n\n" .
                            "✘ DON'T share your login details with anyone.\n" .
                            "✘ DON'T use easily guessed passwords (e.g., birthdays).\n" .
                            "✘ DON'T log in on public or untrusted devices.\n\n" .
                            "This account is strictly for your personal use. Protect your credentials at all times.\n\n" .
                            "Thank you for being part of PMPC!";

                        Mail::raw($emailBody, function ($message) use ($member) {
                            $message->to($member->email)
                                ->subject('Your PMPC Login Credentials & Important Reminders');
                        });
                    }

                    if (!empty($member->contact)) {
                        $number          = trim($member->contact);
                        $formattedNumber = preg_replace('/^0/', '63', $number);

                        $smsMessage =
                            "Welcome to People's Multi-Purpose Cooperative!\n\n" .
                            "Your PMPC Online Access credentials are ready.\n\n" .
                            "USERNAME: {$member->username}\n" .
                            "PASSWORD: {$plainPassword}\n\n" .
                            "Login: peoplesmpcoop.com\n\n" .
                            "REMINDERS:\n" .
                            "✔ Change your password ASAP.\n" .
                            "✔ Keep your account private.\n" .
                            "✘ Don't share your password with anyone.\n" .
                            "This account is strictly for your personal use. Protect your credentials at all times.\n\n" .
                            "Thank you for being part of PMPC!";

                        Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
                            'apikey'     => config('services.semaphore.api_key'),
                            'number'     => $formattedNumber,
                            'message'    => $smsMessage,
                            'sendername' => config('services.semaphore.sender_name', 'PeoplesCoop'),
                        ]);
                    }
                }
            }

            /**
             * ==========================
             *   DEPENDENTS SHEET IMPORT
             * ==========================
             */
            if ($dependentsSheet && !empty($importKeyMap)) {
                $dependentsData = $dependentsSheet->toArray(null, true, true, true);

                foreach (array_slice($dependentsData, 1) as $row) {
                    $importKey     = isset($row['A']) ? trim((string) $row['A']) : null;
                    $dependentName = isset($row['B']) ? trim((string) $row['B']) : null;
                    $dob           = $row['C'] ?? null;
                    $gender        = $row['D'] ?? null;

                    if (empty($importKey) || empty($dependentName)) {
                        continue;
                    }

                    if (!isset($importKeyMap[$importKey])) {
                        Log::warning('Dependent import: no member found for importKey ' . $importKey);
                        continue;
                    }

                    $memberId = $importKeyMap[$importKey];

                    Dependent::updateOrCreate(
                        [
                            'memberId' => $memberId,
                            'name'     => $dependentName,
                        ],
                        [
                            'dob'    => $dob,
                            'gender' => $gender,
                        ]
                    );
                }
            }
        });

        return back()->with('success', 'Import success');
    }
}