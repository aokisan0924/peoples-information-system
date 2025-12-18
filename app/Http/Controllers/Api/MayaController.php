<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PaymentReceipt;
use App\Models\CapitalContribution;
use App\Models\LoginMember;
use App\Models\MembershipPayment;
use App\Models\SavingsDeposit;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class MayaController extends Controller
{
    /**
     * Membership Fee + Initial Capital Contribution (₱300 + ₱1,000)
     */
    public function initiateMembershipPayment(Request $request){
        $validator = Validator::make($request->all(), [
            'firstName' => 'required|string|max:50',
            'lastName'  => 'required|string|max:50',
            'email'     => 'required|email',
            'phone'     => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $member = Auth::guard('member')->user();

        if (!$member) {
            $member = LoginMember::where('email', $request->email)->first();

            if (!$member) {
                return response()->json(['message' => 'Member not found for given email.'], 404);
            }
        }

        $membershipFee  = 300;
        $initialCapital = 1000;
        $baseAmount     = $membershipFee + $initialCapital;
        $convenienceFee = round($baseAmount * 0.015, 2);
        $totalAmount    = $baseAmount + $convenienceFee;

        $membership = MembershipPayment::where('memberId', $member->id)
            ->where('is_paid', false)
            ->where('status', 'Pending')
            ->first();

        $capital = CapitalContribution::where('memberId', $member->id)
            ->where('is_paid', false)
            ->where('status', 'Pending')
            ->first();

        // Try to reuse reference number or generate a new one
        if ($membership && !empty($membership->reference_number)) {
            $referenceNumber = $membership->reference_number;
        } elseif ($capital && !empty($capital->reference_number)) {
            $referenceNumber = $capital->reference_number;
        } else {
            $referenceNumber = $this->makeMembershipPaymentReference($member->id);
        }

        // Create missing records if needed
        if (!$membership) {
            MembershipPayment::create([
                'memberId'         => $member->id,
                'amount'           => $membershipFee,
                'reference_number' => $referenceNumber,
                'is_paid'          => false,
                'status'           => 'Pending',
            ]);
        }

        if (!$capital) {
            CapitalContribution::create([
                'memberId'         => $member->id,
                'amount'           => $initialCapital,
                'reference_number' => $referenceNumber,
                'remarks'          => 'initial_registration',
                'is_paid'          => false,
                'status'           => 'Pending',
            ]);
        }

        // Maya config from services.php + .env
        $mayaKey     = config('services.maya.public_key');
        $checkoutUrl = config('services.maya.checkout_url');

        if (empty($mayaKey) || empty($checkoutUrl)) {
            Log::error('Maya configuration missing for membership payment.', [
                'memberId' => $member->id,
            ]);

            return response()->json([
                'error'   => 'Payment gateway not configured',
                'message' => 'Please contact support.',
            ], 500);
        }

        $payload = [
            'totalAmount' => [
                'value'    => $totalAmount,
                'currency' => 'PHP',
            ],
            'buyer' => [
                'firstName' => $request->firstName,
                'lastName'  => $request->lastName,
                'contact'   => [
                    'email' => $request->email,
                    'phone' => '+63' . ltrim($request->phone, '0'),
                ],
            ],
            'redirectUrl' => [
                'success' => url('/client/payment/success'),
                'failure' => url('/client/payment/failure'),
                'cancel'  => url('/client/payment/cancel?ref=' . urlencode($referenceNumber)),
            ],
            'requestReferenceNumber' => (string) $referenceNumber,
            'description'            => 'Membership Registration Payment',
            'items'                  => [
                [
                    'name'        => 'Capital Contribution',
                    'code'        => 'CAPITAL',
                    'description' => 'Initial Capital Share',
                    'quantity'    => 1,
                    'amount'      => ['value' => $initialCapital],
                    'totalAmount' => ['value' => $initialCapital],
                ],
                [
                    'name'        => 'Membership Fee',
                    'code'        => 'MEMBERSHIP',
                    'description' => 'Cooperative Membership',
                    'quantity'    => 1,
                    'amount'      => ['value' => $membershipFee],
                    'totalAmount' => ['value' => $membershipFee],
                ],
                [
                    'name'        => 'Convenience Fee',
                    'code'        => 'SYSFEE',
                    'description' => 'Convenience Fee (1.5%)',
                    'quantity'    => 1,
                    'amount'      => ['value' => $convenienceFee],
                    'totalAmount' => ['value' => $convenienceFee],
                ],
            ],
        ];

        try {
            $response = Http::withBasicAuth($mayaKey, '')
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($checkoutUrl, $payload);

            if ($response->successful()) {
                return response()->json([
                    'checkoutUrl'     => $response['redirectUrl'],
                    'referenceNumber' => $referenceNumber,
                    'membershipFee'   => $membershipFee,
                    'initialCapital'  => $initialCapital,
                    'convenienceFee'  => $convenienceFee,
                    'totalAmount'     => $totalAmount,
                ]);
            }

            Log::error('Maya membership checkout failed.', [
                'memberId' => $member->id,
                'status'   => $response->status(),
                'body'     => $response->json(),
            ]);

            return response()->json([
                'error'   => 'Maya API request failed',
                'message' => $response->json(),
            ], $response->status());
        } catch (\Exception $e) {
            Log::error('Maya Checkout Error (membership): ' . $e->getMessage(), [
                'memberId' => $member->id,
            ]);

            return response()->json(['message' => 'Server error'], 500);
        }
    }

    /**
     * Additional Share Capital Deposit (client-side "Deposit Capital" button)
     */
    public function createCapitalCheckout(Request $request) {
        $member = Auth::guard('member')->user();

        if (!$member) {
            return response()->json(['error' => 'Unauthorized'], 400);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:500|max:750000',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Invalid amount'], 422);
        }

        $memberId       = (int) $member->id;
        $amount         = (float) $request->amount;
        $convenienceFee = round($amount * 0.015, 2);
        $totalAmount    = $amount + $convenienceFee;

        $referenceNumber = $request->referenceNumber ?: $this->makeShareCapitalReference($memberId);

        CapitalContribution::create([
            'memberId'         => $member->id,
            'amount'           => $amount,
            'reference_number' => $referenceNumber,
            'remarks'          => 'capital_deposit',
            'is_paid'          => false,
            'status'           => 'Pending',
        ]);

        $mayaKey     = config('services.maya.public_key');
        $checkoutUrl = config('services.maya.checkout_url');

        if (empty($mayaKey) || empty($checkoutUrl)) {
            Log::error('Maya configuration missing for capital checkout.', [
                'memberId' => $member->id,
            ]);

            return response()->json([
                'error'   => 'Payment gateway not configured',
                'message' => 'Please contact support.',
            ], 500);
        }

        $payload = [
            'totalAmount' => [
                'value'    => $totalAmount,
                'currency' => 'PHP',
            ],
            'buyer' => [
                'firstName' => $member->firstName,
                'lastName'  => $member->lastName,
                'contact'   => [
                    'phone' => $member->mobile ?? $member->contact,
                    'email' => $member->email,
                ],
            ],
            'items' => [
                [
                    'name'        => 'Capital Contribution',
                    'code'        => 'CAPITAL',
                    'description' => 'Deposit of Share Capital',
                    'quantity'    => 1,
                    'amount'      => ['value' => $amount],
                    'totalAmount' => ['value' => $amount],
                ],
                [
                    'name'        => 'Convenience Fee',
                    'code'        => 'SYSFEE',
                    'description' => 'Convenience Fee (1.5%)',
                    'quantity'    => 1,
                    'amount'      => ['value' => $convenienceFee],
                    'totalAmount' => ['value' => $convenienceFee],
                ],
            ],
            'redirectUrl' => [
                'success' => url('/client/payment/success'),
                'failure' => url('/client/payment/failure'),
                'cancel'  => url('/client/payment/cancel?ref=' . urlencode($referenceNumber)),
            ],
            'requestReferenceNumber' => (string) $referenceNumber,
            'description'            => 'Share Capital Contribution',
        ];

        try {
            $response = Http::withBasicAuth($mayaKey, '')
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($checkoutUrl, $payload);

            if ($response->successful()) {
                return response()->json([
                    'checkoutUrl'     => $response->json('redirectUrl'),
                    'referenceNumber' => $referenceNumber,
                    'baseAmount'      => $amount,
                    'convenience'     => $convenienceFee,
                    'totalAmount'     => $totalAmount,
                ]);
            }

            Log::error('Maya capital checkout failed.', [
                'memberId' => $member->id,
                'status'   => $response->status(),
                'body'     => $response->json(),
            ]);

            return response()->json([
                'error'   => 'Maya API request failed',
                'message' => $response->json(),
            ], $response->status());
        } catch (\Exception $e) {
            Log::error('Maya Checkout Error (capital): ' . $e->getMessage(), [
                'memberId' => $member->id,
            ]);

            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function createSavingsCheckout(Request $request) {
        $member = Auth::guard('member')->user();

        if (!$member) {
            return response()->json(['error' => 'Unauthorized'], 400);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:500|max:750000',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Invalid amount'], 422);
        }

        $memberId = (int) $member->id;
        $amount   = (float) $request->amount;

        $convenienceFee = round($amount * 0.015, 2);
        $totalAmount    = $amount + $convenienceFee;

        $referenceNumber = $this->makeSavingsDepositReference($memberId);

        SavingsDeposit::create([
            'memberId'        => $member->id,
            'transactionType' => 'deposit',
            'amount'          => $amount,
            'referenceNumber' => $referenceNumber,
            'status'          => 'Pending',
            'isPaid'          => false,
            'paidAt'          => null,
        ]);

        $mayaKey     = config('services.maya.public_key');
        $checkoutUrl = config('services.maya.checkout_url');

        if (empty($mayaKey) || empty($checkoutUrl)) {
            Log::error('Maya configuration missing for savings checkout.', [
                'memberId' => $member->id,
            ]);

            return response()->json([
                'error'   => 'Payment gateway not configured',
                'message' => 'Please contact support.',
            ], 500);
        }

        $payload = [
            'totalAmount' => [
                'value'    => $totalAmount,
                'currency' => 'PHP',
            ],
            'buyer' => [
                'firstName' => $member->firstName,
                'lastName'  => $member->lastName,
                'contact'   => [
                    'phone' => $member->mobile ?? $member->contact,
                    'email' => $member->email,
                ],
            ],
            'items' => [
                [
                    'name'        => 'Savings Deposit',
                    'code'        => 'SAVINGS',
                    'description' => 'Savings deposit via Maya',
                    'quantity'    => 1,
                    'amount'      => ['value' => $amount],
                    'totalAmount' => ['value' => $amount],
                ],
                [
                    'name'        => 'Convenience Fee',
                    'code'        => 'SYSFEE',
                    'description' => 'Convenience Fee (1.5%)',
                    'quantity'    => 1,
                    'amount'      => ['value' => $convenienceFee],
                    'totalAmount' => ['value' => $convenienceFee],
                ],
            ],
            'redirectUrl' => [
                'success' => url('/client/payment/success'),
                'failure' => url('/client/payment/failure'),
                'cancel'  => url('/client/payment/cancel?ref=' . urlencode($referenceNumber)),
            ],
            'requestReferenceNumber' => (string) $referenceNumber,
            'description'            => 'Savings Deposit',
        ];

        try {
            $response = Http::withBasicAuth($mayaKey, '')
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($checkoutUrl, $payload);

            if ($response->successful()) {
                return response()->json([
                    'checkoutUrl'     => $response->json('redirectUrl'),
                    'referenceNumber' => $referenceNumber,
                    'baseAmount'      => $amount,
                    'convenience'     => $convenienceFee,
                    'totalAmount'     => $totalAmount,
                ]);
            }

            Log::error('Maya savings checkout failed.', [
                'memberId' => $member->id,
                'status'   => $response->status(),
                'body'     => $response->json(),
            ]);

            return response()->json([
                'error'   => 'Maya API request failed',
                'message' => $response->json(),
            ], $response->status());
        } catch (\Exception $e) {
            Log::error('Maya savings checkout exception.', [
                'memberId' => $member->id,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'error'   => 'Unexpected error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Webhook handler from Maya
     */
    public function handleWebhook(Request $request) {
        // Do NOT log raw body for security in production
        $rawPayload = file_get_contents('php://input');
        $payload    = json_decode($rawPayload, true);

        $referenceNumber = Arr::get($payload, 'requestReferenceNumber');
        $status          = Arr::get($payload, 'status') ?: Arr::get($payload, 'paymentStatus');
        $email           = Arr::get($payload, 'paymentDetails.paymentMethod.paymentToken.email', 'unknown');

        if (!$referenceNumber || !$status) {
            Log::warning('Maya webhook invalid: missing reference or status.', [
                'referenceNumber' => $referenceNumber,
                'status'          => $status,
            ]);

            return response()->json(['message' => 'Invalid payload'], 400);
        }

        Log::info('Maya Webhook Received', [
            'referenceNumber' => $referenceNumber,
            'status'          => $status,
            'email'           => $email,
        ]);

        if (strtoupper($status) === 'PAYMENT_SUCCESS' || strtolower($status) === 'paid') {
            $contribution = CapitalContribution::where('reference_number', $referenceNumber)->first();
            $membership   = MembershipPayment::where('reference_number', $referenceNumber)->first();
            $savings = SavingsDeposit::where('referenceNumber', $referenceNumber)->first();

            if ($contribution && !$contribution->is_paid) {
                $contribution->is_paid = true;
                $contribution->status  = 'Posted';
                $contribution->paid_at = now();
                $contribution->save();
            }

            if ($membership && !$membership->is_paid) {
                $membership->is_paid = true;
                $membership->status  = 'Posted';
                $membership->paid_at = now();
                $membership->save();
            }

            if ($savings && !$savings->isPaid) {
                $savings->isPaid = true;
                $savings->status = 'Posted';
                $savings->paidAt = now();
                $savings->save();
            }

            if ($contribution && $membership) {
                $member = LoginMember::find($contribution->memberId);

                if ($member && $member->email) {
                    Mail::to($member->email)->send(new PaymentReceipt(
                        $member,
                        $referenceNumber,
                        1319.50,
                        'Membership + Capital Contribution',
                        [
                            ['label' => 'Membership Fee',          'value' => 300],
                            ['label' => 'Capital Contribution',    'value' => 1000],
                            ['label' => 'Convenience Fee (1.5%)',  'value' => 19.50],
                        ]
                    ));
                }

                // SMS receipt (Semaphore)
                if ($member && $member->contact) {
                    $datetime = Carbon::now()->format('F d, Y h:i A');

                    $sms = "Hello {$member->firstName}, your payment of ₱1,300.00 for Membership and Capital Contribution has been received on {$datetime}. Ref#: {$referenceNumber}. Thank you! - PMPC.";

                    Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
                        'apikey'     => config('services.semaphore.api_key'),
                        'number'     => $member->contact,
                        'message'    => $sms,
                        'sendername' => config('services.semaphore.sender_name', 'PMPC'),
                    ]);
                }
            }

            return response()->json(['message' => 'Payment received. Thank you!'], 200);
        }

        // For any other statuses, just acknowledge.
        return response()->json(['message' => 'Unhandled status'], 200);
    }

    private function makeShareCapitalReference(int $memberId): string{
        $ym  = now()->format('Ymd');
        $seq = CapitalContribution::where('memberId', $memberId)
            ->whereYear('created_at', now()->year)
            ->count() + 1;

        return sprintf('SC-%s-%06d', $ym, $seq);
    }

    private function makeSavingsDepositReference(int $memberId): string{
        $ym  = now()->format('Ymd');
        $seq = CapitalContribution::where('memberId', $memberId)
            ->whereYear('created_at', now()->year)
            ->count() + 1;

        return sprintf('SD-%s-%06d', $ym, $seq);
    }

    private function makeMembershipPaymentReference(int $memberId): string {
        $ym  = now()->format('Ymd');
        $seq = MembershipPayment::where('memberId', $memberId)
            ->whereYear('created_at', now()->year)
            ->count() + 1;

        return sprintf('MEM-%s-%06d', $ym, $seq);
    }
}
