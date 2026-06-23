<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\PasswordResetOtp;
use App\Services\SmsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * MemberChangePasswordController
 *
 * Handles OTP-verified password changes for already-authenticated members.
 *
 * Flow:
 *  1. POST /client/settings/change-password/send-otp
 *     → Validates current password, sends OTP via the member's registered channel (email or SMS).
 *     → Returns { otpToken, channel, destinationMask }.
 *
 *  2. POST /client/settings/change-password/verify
 *     → Validates OTP code + new password, updates the member's password.
 *
 * This is intentionally separate from MemberPasswordResetController (Auth\) which
 * serves unauthenticated "forgot password" requests. Mixing them would loosen the
 * security model: reset requires no current-password knowledge; change does.
 */
class MemberChangePasswordController extends Controller
{
    // OTP channel used for this specific flow.
    // Reuses the same PasswordResetOtp model but stores a distinct purpose tag.
    private const PURPOSE = 'change_password';

    protected SmsService $smsService;

    public function __construct(SmsService $smsService) {
        $this->smsService = $smsService;
    }

    // =========================================================================
    // STEP 1 — Validate current password, then send OTP
    // =========================================================================

    public function sendOtp(Request $request): JsonResponse {
        $request->validate([
            'current_password' => ['required', 'string'],
        ]);

        /** @var Member $member */
        $member = Auth::guard('member')->user();

        // Verify the current password BEFORE sending any OTP.
        // This is the key difference from the reset flow.
        if (!Hash::check($request->current_password, $member->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Your current password is incorrect.',
                'errors'  => ['current_password' => ['The current password you entered is incorrect.']],
            ], 422);
        }

        // Resolve the OTP delivery channel and destination.
        [$channel, $destination] = $this->resolveChannel($member);

        if (!$channel) {
            return response()->json([
                'success' => false,
                'message' => 'No verified email or mobile number is linked to your account. Please contact support.',
            ], 422);
        }

        // Clean up any previous unused change-password OTPs for this member
        // to avoid table bloat and prevent confusion from stale tokens.
        PasswordResetOtp::where('memberId', $member->id)
            ->where('purpose', self::PURPOSE)
            ->where(function ($q) {
                $q->where('isVerified', true)
                    ->orWhere('expiresAt', '<', Carbon::now());
            })
            ->delete();

        // Block if a valid un-verified OTP was issued within the last 60 seconds
        // to prevent OTP flooding without leaking timing information.
        $recentOtp = PasswordResetOtp::where('memberId', $member->id)
            ->where('purpose', self::PURPOSE)
            ->where('isVerified', false)
            ->where('expiresAt', '>', Carbon::now())
            ->where('created_at', '>', Carbon::now()->subSeconds(60))
            ->first();

        if ($recentOtp) {
            return response()->json([
                'success' => false,
                'message' => 'A verification code was already sent. Please wait 60 seconds before requesting another.',
            ], 429);
        }

        // Generate OTP
        $otpToken  = (string) Str::uuid();
        $otpCode   = (string) random_int(100000, 999999);
        $expiresAt = Carbon::now()->addMinutes(5);

        PasswordResetOtp::create([
            'memberId'      => $member->id,
            'otpToken'      => $otpToken,
            'channel'       => $channel,
            'destination'   => $destination,
            'purpose'       => self::PURPOSE,
            'otpCodeHashed' => Hash::make($otpCode),
            'isVerified'    => false,
            'attempts'      => 0,
            'maxAttempts'   => 5,
            'expiresAt'     => $expiresAt,
        ]);

        // Deliver the OTP
        $this->deliverOtp($channel, $destination, $otpCode, $member);

        return response()->json([
            'success'         => true,
            'otpToken'        => $otpToken,
            'channel'         => $channel,
            'destinationMask' => $this->maskDestination($channel, $destination),
            'expiresInSeconds'=> 300,
            'message'         => 'A verification code has been sent to your registered ' . ($channel === 'email' ? 'email address' : 'mobile number') . '.',
        ]);
    }

    // =========================================================================
    // STEP 2 — Verify OTP and apply the new password
    // =========================================================================

    public function verifyAndChange(Request $request): JsonResponse {
        $request->validate([
            'otpToken'             => ['required', 'string', 'uuid'],
            'otpCode'              => ['required', 'string', 'digits:6'],
            'password'             => ['required', 'string', 'min:8', 'max:191'],
            'password_confirmation'=> ['required', 'same:password'],
        ]);

        /** @var Member $member */
        $member = Auth::guard('member')->user();

        // Locate the OTP record — scoped to this member AND this purpose
        // so one member cannot consume another member's token.
        $otp = PasswordResetOtp::where('otpToken', $request->otpToken)
            ->where('memberId', $member->id)
            ->where('purpose', self::PURPOSE)
            ->first();

        if (!$otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification request.',
            ], 422);
        }

        if ($otp->isVerified) {
            return response()->json([
                'success' => false,
                'message' => 'This verification code has already been used.',
            ], 422);
        }

        if ($otp->expiresAt->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'The verification code has expired. Please request a new one.',
            ], 422);
        }

        if ($otp->attempts >= $otp->maxAttempts) {
            return response()->json([
                'success' => false,
                'message' => 'Too many incorrect attempts. Please request a new code.',
            ], 429);
        }

        // Increment attempts BEFORE checking to prevent timing attacks
        $otp->increment('attempts');

        if (!Hash::check($request->otpCode, $otp->otpCodeHashed)) {
            $remaining = $otp->maxAttempts - $otp->attempts;
            return response()->json([
                'success' => false,
                'message' => "Incorrect verification code. {$remaining} " . ($remaining === 1 ? 'attempt' : 'attempts') . ' remaining.',
            ], 422);
        }

        // OTP is valid — apply the new password
        $member->password = Hash::make($request->password);
        $member->save();

        // Mark the OTP as consumed
        $otp->isVerified = true;
        $otp->save();

        // Send a confirmation notification
        $this->sendChangeConfirmation($member);

        return response()->json([
            'success' => true,
            'message' => 'Your password has been updated successfully.',
        ]);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Resolve the best delivery channel for the authenticated member.
     * Prefer email; fall back to SMS via contact number.
     *
     * @return array{string|null, string|null} [$channel, $destination]
     */
    private function resolveChannel(Member $member): array {
        // Prefer email if it is available and looks valid
        if (!empty($member->email) && filter_var($member->email, FILTER_VALIDATE_EMAIL)) {
            return ['email', $member->email];
        }

        // Fall back to the contact number (SMS)
        $raw    = trim($member->contact ?? '');
        $digits = preg_replace('/\D+/', '', $raw);

        if ($digits === '') {
            return [null, null];
        }

        // Normalize PH number: leading 0 → 63 country code
        $normalized = preg_replace('/^0/', '63', $digits);

        return ['sms', $normalized];
    }

    /**
     * Deliver the OTP code to the member via the resolved channel.
     */
    private function deliverOtp(string $channel, string $destination, string $code, Member $member): void {
        $firstName = $member->firstName ?? 'Member';

        if ($channel === 'email') {
            $subject = 'PMPC — Password Change Verification';
            $body    = implode("\n", [
                "Hi {$firstName},",
                "",
                "You requested to change your PMPC account password.",
                "",
                "Your verification code is: {$code}",
                "",
                "This code will expire in 5 minutes.",
                "",
                "If you did not request this change, please contact PMPC support immediately.",
            ]);

            Mail::raw($body, fn ($msg) => $msg->to($destination)->subject($subject));
        } else {
            $sms = "PMPC: Your password-change verification code is {$code}. It expires in 5 minutes. Do not share this code.";
            $this->smsService->sendOtp($destination, $sms);
        }
    }

    /**
     * Send a post-change confirmation so the member is alerted
     * if the change was not initiated by them.
     */
    private function sendChangeConfirmation(Member $member): void {
        if (empty($member->email) || !filter_var($member->email, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        $firstName = $member->firstName ?? 'Member';
        $time      = Carbon::now()->setTimezone('Asia/Manila')->format('F j, Y \a\t h:i A T');

        $subject = 'PMPC — Your Password Was Changed';
        $body    = implode("\n", [
            "Hi {$firstName},",
            "",
            "Your PMPC account password was successfully changed on {$time}.",
            "",
            "If you did not make this change, please contact PMPC support immediately.",
        ]);

        Mail::raw($body, fn ($msg) => $msg->to($member->email)->subject($subject));
    }

    /**
     * Mask the destination string for safe display in the frontend.
     * Mirrors the logic in MemberPasswordResetController for consistency.
     */
    private function maskDestination(string $channel, string $destination): string {
        if ($channel === 'email') {
            $parts = explode('@', $destination);
            if (count($parts) !== 2) {
                return '***@***';
            }
            [$name, $domain] = $parts;
            $visible = substr($name, 0, 2);
            return $visible . str_repeat('*', max(1, strlen($name) - 2)) . '@' . $domain;
        }

        // SMS: show first 2 and last 2 digits
        $digits = preg_replace('/\D+/', '', $destination);
        $len    = strlen($digits);

        if ($len <= 4) {
            return str_repeat('*', $len);
        }

        return substr($digits, 0, 2)
            . str_repeat('*', $len - 4)
            . substr($digits, -2);
    }
}