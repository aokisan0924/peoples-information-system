<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\PasswordResetOtp;
use App\Services\SmsService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MemberPasswordResetController extends Controller
{
    protected SmsService $smsService;

    public function __construct(SmsService $smsService) {
        $this->smsService = $smsService;
    }

    public function showForgotForm(): Response {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function sendResetOtp(Request $request){
        $validated = $request->validate([
            'identifier' => ['required', 'string', 'max:255'], // email or contact number
        ]);

        $identifier = trim($validated['identifier']);

        // Try find by email
        $memberQuery = Member::query();

        $memberQuery->where(function ($q) use ($identifier) {
            $q->where('email', $identifier);

            // Also try contact
            $digits = preg_replace('/\D+/', '', $identifier);
            if ($digits !== '') {
                $normalized = preg_replace('/^0/', '63', $digits);
                $q->orWhere('contact', $digits)
                    ->orWhere('contact', $normalized);
            }
        });

        /** @var Member|null $member */
        $member = $memberQuery->first();

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'We could not find a member with that email or mobile number.',
            ], 422);
        }

        // Decide channel
        $channel     = null;
        $destination = null;

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL) && !empty($member->email)) {
            $channel     = 'email';
            $destination = $member->email;
        } else {
            // default to SMS via contact
            $number   = trim($member->contact ?? '');
            $digits   = preg_replace('/\D+/', '', $number);
            if ($digits === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'No valid mobile number is linked to this account.',
                ], 422);
            }
            $destination = preg_replace('/^0/', '63', $digits);
            $channel     = 'sms';
        }

        // Clean old unverified/password reset OTPs for this member
        PasswordResetOtp::where('memberId', $member->id)
            ->where('isVerified', false)
            ->where('expiresAt', '<', Carbon::now())
            ->delete();

        $otpToken  = (string) Str::uuid();
        $otpCode   = (string) random_int(100000, 999999);
        $expiresAt = Carbon::now()->addMinutes(5);

        PasswordResetOtp::create([
            'memberId'      => $member->id,
            'otpToken'      => $otpToken,
            'channel'       => $channel,
            'destination'   => $destination,
            'otpCodeHashed' => Hash::make($otpCode),
            'isVerified'    => false,
            'attempts'      => 0,
            'maxAttempts'   => 5,
            'expiresAt'     => $expiresAt,
        ]);

        if ($channel === 'email') {
            $subject = 'PMPC Password Reset Code';
            $body    = "Your PMPC password reset code is: {$otpCode}\n\nThis code will expire in 5 minutes.";

            Mail::raw($body, function ($message) use ($destination, $subject) {
                $message->to($destination)->subject($subject);
            });
        } else {
            $smsMessage = "Your PMPC password reset code is: {$otpCode}. It will expire in 5 minutes.";
            $this->smsService->sendOtp($destination, $smsMessage);
        }

        return response()->json([
            'success'        => true,
            'otpToken'       => $otpToken,
            'channel'        => $channel,
            'destinationMask'=> $this->maskDestination($channel, $destination),
            'message'        => 'We sent a verification code to your registered contact.',
        ]);
    }

    public function verifyResetOtp(Request $request) {
        $validated = $request->validate([
            'otpToken'                => ['required', 'string'],
            'otpCode'                 => ['required', 'string', 'digits:6'],
            'newPassword'             => ['required', 'string', 'min:8', 'max:191'],
            'confirmNewPassword'      => ['required', 'same:newPassword'],
        ]);

        /** @var PasswordResetOtp|null $otpRecord */
        $otpRecord = PasswordResetOtp::where('otpToken', $validated['otpToken'])->first();

        if (!$otpRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired reset request.',
            ], 422);
        }

        if ($otpRecord->isVerified) {
            return response()->json([
                'success' => false,
                'message' => 'This reset link has already been used.',
            ], 422);
        }

        if ($otpRecord->expiresAt->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'The verification code has expired. Please request a new one.',
            ], 422);
        }

        if ($otpRecord->attempts >= $otpRecord->maxAttempts) {
            return response()->json([
                'success' => false,
                'message' => 'Maximum attempts reached. Please request a new code.',
            ], 429);
        }

        $otpRecord->attempts += 1;
        $otpRecord->save();

        if (!Hash::check($validated['otpCode'], $otpRecord->otpCodeHashed)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code.',
            ], 422);
        }

        $member = $otpRecord->member;
        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Member account not found.',
            ], 422);
        }

        $member->password = bcrypt($validated['newPassword']);
        $member->save();

        $otpRecord->isVerified = true;
        $otpRecord->save();

        return response()->json([
            'success'  => true,
            'message'  => 'Your password has been reset successfully. You can now log in.',
            'redirect' => route('login'),
        ]);
    }

    protected function maskDestination(string $channel, string $destination): string {
        if ($channel === 'email') {
            $parts = explode('@', $destination);
            if (count($parts) !== 2) {
                return '***';
            }
            $name     = $parts[0];
            $domain   = $parts[1];
            $visible  = substr($name, 0, 2);
            return $visible . str_repeat('*', max(1, strlen($name) - 2)) . '@' . $domain;
        }

        // sms masking
        $digits = preg_replace('/\D+/', '', $destination);
        $length = strlen($digits);
        if ($length <= 4) {
            return str_repeat('*', $length);
        }
        $visibleStart = substr($digits, 0, 2);
        $visibleEnd   = substr($digits, -2);
        $maskLength   = max(0, $length - 4);

        return $visibleStart . str_repeat('*', $maskLength) . $visibleEnd;
    }
}
