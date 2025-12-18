<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\RegistrationOtp;
use App\Services\SmsService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

class RegisterController extends Controller
{
    protected SmsService $smsService;

    public function __construct(SmsService $smsService) {
        $this->smsService = $smsService;
    }

    public function showForm(): Response {
        $genderOptions = [
            ['value' => 'male',   'label' => 'Male'],
            ['value' => 'female', 'label' => 'Female'],
            ['value' => 'other',  'label' => 'Prefer not to say'],
        ];

        return Inertia::render('Auth/Register', [
            'genderOptions' => $genderOptions,
        ]);
    }

    public function sendOtp(Request $request): JsonResponse {
        $validated = $request->validate([
            'firstName' => ['required', 'string', 'max:100'],
            'middleName' => ['nullable', 'string', 'max:100'],
            'lastName' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:members,email'],
            'phoneNumber' => ['required', 'string', 'max:30', 'unique:members,contact'],
            'gender' => ['required', 'string', 'in:male,female,other'],
            'dateOfBirth' => ['required', 'date'],
        ]);

        $normalizedPhoneNumber = preg_replace('/\D+/', '', $validated['phoneNumber']);

        RegistrationOtp::where('phoneNumber', $normalizedPhoneNumber)
            ->where('isVerified', false)
            ->where('expiresAt', '<', Carbon::now())
            ->delete();

        $otpCode   = (string) random_int(100000, 999999);
        $otpToken  = (string) Str::uuid();
        $expiresAt = Carbon::now()->addMinutes(5);

        RegistrationOtp::create([
            'otpToken' => $otpToken,
            'phoneNumber'  => $normalizedPhoneNumber,
            'otpCodeHashed' => Hash::make($otpCode),
            'formData' => [
                'firstName' => $validated['firstName'],
                'middleName' => $validated['middleName'] ?? null,
                'lastName' => $validated['lastName'],
                'suffix' => $validated['suffix'] ?? null,
                'email' => $validated['email'],
                'phoneNumber' => $normalizedPhoneNumber,
                'gender' => $validated['gender'],
                'dob' => $validated['dateOfBirth'],
            ],
            'isVerified' => false,
            'attempts' => 0,
            'maxAttempts' => 5,
            'expiresAt' => $expiresAt,
        ]);

        $message = 'Your People\'s MP Cooperative verification code is: ' . $otpCode . '. It will expire in 5 minutes.';

        $this->smsService->sendOtp($normalizedPhoneNumber, $message);

        return response()->json([
            'success'   => true,
            'otpToken'  => $otpToken,
            'phoneMask' => $this->maskPhoneNumber($normalizedPhoneNumber),
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse {
        $validated = $request->validate([
            'otpToken' => ['required', 'string'],
            'otpCode'  => ['required', 'string', 'digits:6'],
        ]);

        /** @var RegistrationOtp|null $otpRecord */
        $otpRecord = RegistrationOtp::where('otpToken', $validated['otpToken'])->first();

        if (!$otpRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification request.',
            ], 422);
        }

        if ($otpRecord->isVerified) {
            return response()->json([
                'success' => false,
                'message' => 'This verification was already used.',
            ], 422);
        }

        if ($otpRecord->attempts >= $otpRecord->maxAttempts) {
            return response()->json([
                'success' => false,
                'message' => 'Maximum attempts reached. Please restart registration.',
            ], 429);
        }

        if ($otpRecord->expiresAt->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Verification code has expired. Please restart registration.',
            ], 422);
        }

        $otpRecord->attempts += 1;
        $otpRecord->save();

        if (!Hash::check($validated['otpCode'], $otpRecord->otpCodeHashed)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code.',
            ], 422);
        }

        $member        = null;
        $plainPassword = null;

        DB::transaction(function () use (&$member, &$plainPassword, $otpRecord) {
            $data = $otpRecord->formData;

            // compute age from dateOfBirth
            $age = null;
            if (!empty($data['dob'])) {
                try {
                    $age = Carbon::parse($data['dob'])->age;
                } catch (\Throwable $e) {
                    $age = null;
                }
            }

            $plainPassword  = Str::random(10);
            $hashedPassword = bcrypt($plainPassword);

            $member = Member::create([
                'firstName' => $data['firstName'],
                'middleName' => $data['middleName'] ?? null,
                'lastName' => $data['lastName'],
                'suffix' => $data['suffix'] ?? null,
                'email' => $data['email'],
                'contact' => $data['phoneNumber'],
                'gender' => $data['gender'],
                'dob' => $data['dob'],
                'age' => $age,
                'password' => $hashedPassword,
                'status' => 'pending_profile',
            ]);

            $username         = 'PMPC-' . str_pad($member->id, 3, '0', STR_PAD_LEFT);
            $member->username = $username;
            $member->save();

            $otpRecord->isVerified = true;
            $otpRecord->save();

            $this->sendCredentials($member, $plainPassword);
        });

        return response()->json([
            'success'  => true,
            'message'  => 'Registration successful. Your login credentials have been sent to your email and mobile number.',
            'redirect' => route('login'),
        ]);
    }

    protected function sendCredentials(Member $member, string $plainPassword): void {
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
            $number  = trim($member->contact);
            $digits  = preg_replace('/\D+/', '', $number);
            $formattedNumber = preg_replace('/^0/', '63', $digits);

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

    public function resendOtp(Request $request): JsonResponse {
        $validated = $request->validate([
            'otpToken' => ['required', 'string'],
        ]);

        $otpRecord = RegistrationOtp::where('otpToken', $validated['otpToken'])->first();

        if (!$otpRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP session.',
            ], 422);
        }

        if ($otpRecord->isVerified) {
            return response()->json([
                'success' => false,
                'message' => 'This OTP session is already verified.',
            ], 422);
        }

        if ($otpRecord->expiresAt->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Your OTP session expired. Please restart registration.',
            ], 422);
        }

        // Generate a fresh OTP
        $newOtp   = (string) random_int(100000, 999999);
        $otpRecord->otpCodeHashed = Hash::make($newOtp);
        $otpRecord->attempts      = 0; // reset attempts
        $otpRecord->save();

        // Send via Semaphore
        $message = "Your PMPC verification code is: {$newOtp}. It will expire in 5 minutes.";

        $this->smsService->sendOtp($otpRecord->phoneNumber, $message);

        return response()->json([
            'success' => true,
            'message' => 'A new OTP has been sent to your mobile number.',
        ]);
    }

    protected function maskPhoneNumber(string $phoneNumber): string {
        $length = strlen($phoneNumber);

        if ($length <= 4) {
            return str_repeat('*', $length);
        }

        $visibleStart = substr($phoneNumber, 0, 2);
        $visibleEnd   = substr($phoneNumber, -2);
        $maskLength   = max(0, $length - 4);

        return $visibleStart . str_repeat('*', $maskLength) . $visibleEnd;
    }
}