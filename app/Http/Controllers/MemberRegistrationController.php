<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\SpouseInfo;
use App\Models\ParentsInfo;
use App\Models\AFPInfo;
use App\Models\BranchService;
use App\Models\CapitalContribution;
use App\Models\IdentificationInfo;
use App\Models\EmergencyContact;
use App\Models\Dependent;
use App\Models\MembershipPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MemberRegistrationController extends Controller
{
    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            Log::info('Incoming Registration Request', $request->all());

            $validated = $request->validate([
                // Member Info
                'firstName' => 'required|string|max:255',
                'lastName' => 'required|string|max:255',
                'middleName' => 'nullable|string|max:255',
                'suffix' => 'nullable|string|max:10',
                'nickname' => 'nullable|string|max:255',
                'dob' => 'required|date',
                'religion' => 'nullable|string|max:255',
                'age' => 'nullable|numeric|min:0|max:120',
                'gender' => 'required|string|max:20',
                'civilStatus' => 'required|string|max:50',
                'nationality' => 'nullable|string|max:100',
                'email' => 'required|email|unique:members,email',
                'contact' => 'required|string|max:20',
                'region' => 'nullable|string',
                'regionName' => 'nullable|string',
                'province' => 'nullable|string',
                'provinceName' => 'nullable|string',
                'city' => 'nullable|string',
                'cityName' => 'nullable|string',
                'barangay' => 'nullable|string',
                'barangayName' => 'nullable|string',
                'fullAddress' => 'nullable|string|max:500',
                'profileImage' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'signatureData' => 'nullable|string',

                // AFP Info
                'afpsn' => 'nullable|string|max:100',
                'rank' => 'nullable|string|max:100',
                'designation' => 'nullable|string|max:100',
                'afpId' => 'nullable|string|max:100',
                'presentAssignment' => 'nullable|string|max:255',
                'controlNo' => 'nullable|string|max:100',
                'yearsInService' => 'nullable|numeric|min:0|max:70',
                'cadEnlistment' => 'nullable|date',
                'retirementDate' => 'nullable|date|after_or_equal:cadEnlistment',
                'pensionDate' => 'nullable|date|after_or_equal:retirementDate',

                // Branch
                'branchService' => 'nullable|string|max:100',
                'subBranch' => 'nullable|string|max:100',

                // Parents
                'motherName' => 'nullable|string|max:255',
                'motherAge' => 'nullable|numeric|min:10|max:120',
                'fatherName' => 'nullable|string|max:255',
                'fatherAge' => 'nullable|numeric|min:10|max:120',

                // IDs
                'tinNo' => 'nullable|string|max:25',
                'gsisNo' => 'nullable|string|max:25',
                'crnUmidNo' => 'nullable|string|max:25',

                // Spouse
                'spouseName' => 'nullable|string|max:255',
                'spouseAge' => 'nullable|numeric|min:10|max:120',
                'spouseDob' => 'nullable|date',
                'dateMarriage' => 'nullable|date|before_or_equal:today',

                // Emergency Contact
                'contactPersonName' => 'required|string|max:255',
                'contactPersonAddress' => 'required|string|max:255',
                'contactPersonPhone' => 'required|string|max:20',
                'contactPersonRelation' => 'required|string|max:100',

                // Dependents
                'dependents' => 'nullable|array',
                'dependents.*.name' => 'required_with:dependents|string|max:255',
                'dependents.*.dob' => 'required_with:dependents|date',
                'dependents.*.gender' => 'required_with:dependents|string|in:Male,Female,Other',
            ]);

            if ($request->hasFile('profileImage')) {
                $validated['profileImage'] = $request->file('profileImage')->store('profile_images', 'public');
            }

            // Signature Image (base64)
            if ($request->filled('signatureData')) {
                $signature = explode(',', $request->input('signatureData'))[1] ?? null;
                if ($signature) {
                    $signatureBinary = base64_decode($signature);
                    $signaturePath = 'signatures/' . uniqid() . '.png';
                    Storage::disk('public')->put($signaturePath, $signatureBinary);
                    $validated['signaturePath'] = $signaturePath;
                }
            }

            // Generate credentials
            $generatedPassword = Str::random(10);

            // Create member
            $member = Member::create([
                ...$validated,
                'username' => 'temp', // placeholder
                'password' => Hash::make($generatedPassword),
            ]);

            // Update username with formatted ID
            $member->update([
                'username' => 'PMPC-' . str_pad($member->id, 3, '0', STR_PAD_LEFT),
            ]);

            // Related info
            AFPInfo::create(['memberId' => $member->id] + $request->only([
                'afpsn', 'rank', 'designation', 'afpId', 'presentAssignment',
                'controlNo', 'yearsInService', 'cadEnlistment', 'retirementDate', 'pensionDate'
            ]));

            BranchService::create(['memberId' => $member->id] + $request->only(['branchService', 'subBranch']));
            ParentsInfo::create(['memberId' => $member->id] + $request->only(['motherName', 'motherAge', 'fatherName', 'fatherAge']));
            IdentificationInfo::create(['memberId' => $member->id] + $request->only(['tinNo', 'gsisNo', 'crnUmidNo']));
            SpouseInfo::create(['memberId' => $member->id] + $request->only(['spouseName', 'spouseAge', 'spouseDob', 'dateMarriage']));
            EmergencyContact::create(['memberId' => $member->id] + $request->only(['contactPersonName', 'contactPersonAddress', 'contactPersonPhone', 'contactPersonRelation']));

            // Dependents
            foreach ($request->input('dependents', []) as $dependent) {
                Dependent::create([
                    'memberId' => $member->id,
                    'name' => $dependent['name'],
                    'dob' => $dependent['dob'],
                    'gender' => $dependent['gender'],
                ]);
            }

            // Email Notification
            Mail::raw("Welcome to PMPC!\nUsername: {$member->username}\nPassword: $generatedPassword", function ($message) use ($member) {
                $message->to($member->email)->subject('Your PMPC Login Credentials');
            });

            // SMS Notification
            try {
                $response = Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
                    'apikey'     => config('services.semaphore.api_key'),
                    'number'     => preg_replace('/^0/', '63', $member->contact),
                    'message'    => "Welcome to PMPC, {$member->firstName}! Username: {$member->username} | Password: $generatedPassword",
                    'sendername' => config('services.semaphore.sender_name', 'PeoplesCoop'), 
                ]);

                if ($response->successful()) {
                    Log::info('Semaphore SMS sent successfully', [
                        'status' => $response->status(),
                        'body'   => $response->body(),
                    ]);
                } else {
                    Log::error('Semaphore SMS failed', [
                        'status' => $response->status(),
                        'body'   => $response->body(),
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('SMS sending exception: ' . $e->getMessage());
            }
            

            DB::commit();

            return redirect()->route('login')->with('message', 'Registration successful!');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Registration failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return redirect()->back()->withErrors([
                'form' => 'Registration failed. Please try again.',
                'exception' => $e->getMessage()
            ])->withInput();
        }
    }
}
