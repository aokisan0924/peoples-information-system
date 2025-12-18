<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MembershipPayment;
use App\Models\CapitalContribution;
use App\Models\Member;
use App\Models\MemberNotification;
use App\Models\SavingsDeposit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PayMongoController extends Controller
{
    private string $secretKey;
    private string $publicKey;
    private string $webhookSecret;
    private string $baseUrl;

    public function __construct() {
        $this->secretKey     = config('services.paymongo.secret');
        $this->publicKey     = config('services.paymongo.public');
        $this->webhookSecret = config('services.paymongo.webhook');
        $this->baseUrl       = config('services.paymongo.base_url', 'https://api.paymongo.com/v1');
    }

    /* ===============================================================
     * 1) MEMBERSHIP CHECKOUT (₱300 Only)
     * =============================================================== */
    public function createMembershipCheckout(Request $request) {
        try {
            $member = Auth::guard('member')->user();
            if (!$member) return response()->json(['error' => 'Unauthorized'], 401);
        
            // 1. Calculate Fees (300 Membership + 1.5% Fee)
            $membershipFee = 300.00;
            $processingFee = $membershipFee * 0.015; 
            $totalAmount   = round($membershipFee + $processingFee, 2);
        
            // 2. Check for existing pending payment
            $pending = MembershipPayment::where('memberId', $member->id)
                ->where('is_paid', false)
                ->where('status', 'Pending')
                ->first();
        
            if ($pending) {
                // Reuse reference but UPDATE the amount (Fixes issue if old record was 1300)
                $referenceNumber = $pending->reference_number;
                $pending->update(['amount' => $totalAmount]);
            } else {
                // Create new record
                $referenceNumber = $this->makeReference("MEM", $member->id);
        
                MembershipPayment::create([
                    'memberId'         => $member->id,
                    'amount'           => $totalAmount,
                    'reference_number' => $referenceNumber,
                    'is_paid'          => false,
                    'status'           => 'Pending',
                ]);
            }
        
            // 3. Generate PayMongo Link
            return $this->createPayMongoLink(
                $totalAmount,
                "Membership Payment - {$referenceNumber}",
                [
                    'paymentType' => 'membership',
                    'reference'   => $referenceNumber,
                    'memberId'    => $member->id,
                    'rawAmount'   => $totalAmount,
                ]
            );

        } catch (\Throwable $e) {
            Log::error("Membership Checkout Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to initiate checkout.'], 500);
        }
    }

    /* ===============================================================
     * 2) SHARE CAPITAL CHECKOUT
     * =============================================================== */
    public function createCapitalCheckout(Request $request) {
        try {
            $member = Auth::guard('member')->user();
            if (!$member) return response()->json(['error' => 'Unauthorized'], 401);

            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:500|max:750000'
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()->first()], 422);
            }

            $amount         = (float) $request->amount;
            $convenienceFee = round($amount * 0.015, 2);
            $totalAmount    = $amount + $convenienceFee;

            $referenceNumber = $this->makeReference("CC", $member->id);

            CapitalContribution::create([
                'memberId'         => $member->id,
                'transactionType'  => 'deposit',
                'amount'           => $amount,
                'reference_number' => $referenceNumber,
                'remarks'          => 'capital_deposit',
                'is_paid'          => false,
                'status'           => 'Pending',
            ]);

            return $this->createPayMongoLink(
                $totalAmount,
                "Capital Contribution - {$referenceNumber}",
                [
                    'paymentType' => 'capital',
                    'reference'   => $referenceNumber,
                    'memberId'    => $member->id,
                    'rawAmount'   => $amount,
                ]
            );
        } catch (\Throwable $e) {
            Log::error("Capital Checkout Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to initiate checkout.'], 500);
        }
    }

    /* ===============================================================
     * 3) SAVINGS DEPOSIT CHECKOUT
     * =============================================================== */
    public function createSavingsCheckout(Request $request) {
        try {
            $member = Auth::guard('member')->user();
            if (!$member) return response()->json(['error' => 'Unauthorized'], 401);

            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:50|max:750000'
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()->first()], 422);
            }

            $amount         = (float) $request->amount;
            $convenienceFee = round($amount * 0.015, 2);
            $totalAmount    = $amount + $convenienceFee;

            $referenceNumber = $this->makeReference("SD", $member->id);

            SavingsDeposit::create([
                'memberId'        => $member->id,
                'transactionType' => 'deposit',
                'amount'          => $amount,
                'referenceNumber' => $referenceNumber,
                'isPaid'          => false,
                'status'          => 'Pending',
            ]);

            return $this->createPayMongoLink(
                $totalAmount,
                "Savings Deposit - {$referenceNumber}",
                [
                    'paymentType' => 'savings',
                    'reference'   => $referenceNumber,
                    'memberId'    => $member->id,
                    'rawAmount'   => $amount,
                ]
            );
        } catch (\Throwable $e) {
            Log::error("Savings Checkout Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to initiate checkout.'], 500);
        }
    }

    /* ===============================================================
     * SHARED HELPER FOR PAYMONGO LINK CREATION
     * =============================================================== */
    private function createPayMongoLink(float $totalAmount, string $description, array $metadata) {
        // Ensure integer cents for API to avoid float errors
        $amountInCents = (int) round($totalAmount * 100);

        $payload = [
            'data' => [
                'attributes' => [
                    'amount' => $amountInCents,
                    'description' => $description,
                    'currency' => 'PHP',
                    'remarks' => 'PMPC Payment',
                    'metadata' => $metadata,
                    'redirect' => [
                        'success' => url('/client/dashboard'),
                        'failed' => url('/client/dashboard'),
                    ]
                ],
            ],
        ];

        $response = Http::withBasicAuth($this->secretKey, '')
            ->post($this->baseUrl . '/links', $payload);

        if (!$response->successful()) {
            Log::error('PayMongo API Error', ['status' => $response->status(), 'body' => $response->body()]);
            return response()->json(['error' => 'Unable to create payment link. Please try again later.'], 500);
        }

        return response()->json([
            'checkoutUrl' => $response->json('data.attributes.checkout_url')
        ]);
    }

    /* ===============================================================
     * SHARED WEBHOOK
     * =============================================================== */
    public function webhook(Request $request)
    {
        try {
            $payment = $request->input('data.attributes.data');

            if (!$payment) {
                return response()->json(['message' => 'No payment data'], 400);
            }

            $attributes = $payment['attributes'] ?? [];
            $metadata   = $attributes['metadata'] ?? [];

            $description = (string) ($attributes['description'] ?? '');
            $amountCents = (float) ($attributes['amount'] ?? 0);
            $rawAmount   = isset($metadata['rawAmount'])
                ? (float) $metadata['rawAmount']
                : ($amountCents / 100);

            // Extract reference
            $reference = $metadata['reference'] ?? null;

            if (!$reference && preg_match('/(MEM-|CC-|SD-)[0-9\-]+/', $description, $match)) {
                $reference = $match[0];
            }

            if (!$reference) {
                return response()->json(['ok' => true]);
            }

            // Detect payment type
            $paymentType = $metadata['paymentType'] ?? null;

            if (!$paymentType) {
                if (str_starts_with($reference, 'MEM-')) $paymentType = 'membership';
                elseif (str_starts_with($reference, 'CC-')) $paymentType = 'capital';
                elseif (str_starts_with($reference, 'SD-')) $paymentType = 'savings';
            }

            if (!$paymentType) {
                return response()->json(['ok' => true]);
            }

            /* ========================== MEMBERSHIP ========================== */
            if ($paymentType === 'membership') {
                $updated = MembershipPayment::where('reference_number', $reference)
                    ->where(fn($q) => $q->where('is_paid', false)
                        ->orWhere('status', '!=', 'Paid'))
                    ->update([
                        'is_paid' => true,
                        'status'  => 'Paid',
                        'paid_at' => now(),
                    ]);

                if ($updated > 0) {
                    $memberId = (int) MembershipPayment::where('reference_number', $reference)->value('memberId');
                    if ($memberId) {
                        $this->notify($memberId, 'Membership Payment Successful', 'Your membership fee has been successfully paid.');
                        $this->sendSms($memberId, "PMPC: Your membership payment of ₱" . number_format($rawAmount, 2) . " has been received. Ref: {$reference}.");
                    }
                }

            /* ========================== CAPITAL ========================== */
            } elseif ($paymentType === 'capital') {
                $updated = CapitalContribution::where('reference_number', $reference)
                    ->where(fn($q) => $q->where('is_paid', false)
                        ->orWhere('status', '!=', 'Posted'))
                    ->update([
                        'is_paid' => true,
                        'status'  => 'Posted',
                        'paid_at' => now(),
                    ]);

                if ($updated > 0) {
                    $memberId = (int) CapitalContribution::where('reference_number', $reference)->value('memberId');
                    if ($memberId) {
                        $this->notify($memberId, 'Capital Contribution Posted', "Your capital contribution of ₱" . number_format($rawAmount, 2) . " has been posted.");
                        $this->sendSms($memberId, "PMPC: Your capital contribution of ₱" . number_format($rawAmount, 2) . " has been posted. Ref: {$reference}.");
                    }
                }

            /* ========================== SAVINGS ========================== */
            } elseif ($paymentType === 'savings') {
                $updated = SavingsDeposit::where('referenceNumber', $reference)
                    ->where(fn($q) => $q->where('isPaid', false)
                        ->orWhere('status', '!=', 'Posted'))
                    ->update([
                        'isPaid' => true,
                        'status' => 'Posted',
                        'paidAt' => now(),
                    ]);

                if ($updated > 0) {
                    $memberId = (int) SavingsDeposit::where('referenceNumber', $reference)->value('memberId');
                    if ($memberId) {
                        $this->notify($memberId, 'Savings Deposit Posted', "Your savings deposit of ₱" . number_format($rawAmount, 2) . " has been posted.");
                        $this->sendSms($memberId, "PMPC: Your savings deposit of ₱" . number_format($rawAmount, 2) . " has been posted. Ref: {$reference}.");
                    }
                }
            }

            return response()->json(['ok' => true]);

        } catch (\Throwable $e) {
            Log::error("Webhook Error: " . $e->getMessage());
            return response()->json(['error' => 'Server Error'], 500);
        }
    }

    private function notify($memberId, $title, $message) {
        if (!$memberId) return;
        MemberNotification::create([
            'memberId' => $memberId,
            'title'    => $title,
            'message'  => $message,
            'type'     => 'payment',
            'isRead'   => 0
        ]);
    }

    private function sendSms(?int $memberId, string $message): void
    {
        if (!$memberId) return;

        try {
            $member = Member::find($memberId);
            if (!$member) return;

            $mobile = $member->mobile ?? $member->contact ?? null;
            if (!$mobile) return;

            $enabled = config('services.semaphore.enabled', true);
            $apiKey  = config('services.semaphore.api_key');
            $sender  = config('services.semaphore.sender_name', 'PeoplesCoop');
            $url     = config('services.semaphore.url', 'https://api.semaphore.co/api/v4/messages');

            if (!$enabled || !$apiKey || !$url) return;

            Http::asForm()->post($url, [
                'apikey' => $apiKey,
                'sendername' => $sender,
                'number' => $mobile,
                'message' => $message,
            ]);
        } catch (\Throwable $e) {
            Log::error('Semaphore SMS sending failed', [
                'memberId' => $memberId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function makeReference(string $prefix, int $memberId) {
        $ymd = date('Ymd');
        return "{$prefix}-{$ymd}-" . sprintf("%06d", rand(1,999999));
    }
}