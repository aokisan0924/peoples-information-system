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
use Illuminate\Support\Facades\Mail;

class PayMongoController extends Controller
{
    private string $secretKey;
    private string $webhookSecret;
    private string $baseUrl;
    private const CONVENIENCE_FEE_RATE = 0.015;

    public function __construct() {
        $this->secretKey = config('services.paymongo.secret') ?? '';
        $this->webhookSecret = config('services.paymongo.webhook') ?? '';
        
        $url = rtrim(config('services.paymongo.base_url') ?? 'https://api.paymongo.com/v1', '/');
        $this->baseUrl = str_ends_with($url, '/v1') ? $url : $url . '/v1';
    }

    /* ===============================================================
     * RESUME PENDING PAYMENT (Universal - For Transaction History)
     * =============================================================== */
    public function continuePayment(Request $request) {
        try {
            if (!$member = $this->getMember()) return $this->unauthorized();
            
            $reference = $request->input('referenceNumber');
            $category  = $request->input('category'); // <--- READ IT HERE
            
            if (!$reference) return response()->json(['error' => 'Reference number required'], 400);

            $totalRaw = 0;
            $description = "";
            $paymentType = ""; // We will set this for the PayMongo metadata

            // USE THE REACT CATEGORY TO ROUTE IT
            if ($category === 'membership') {
                // Determine if this is a combined MEMCAP or just MEM
                if (str_starts_with($reference, 'MEMCAP-')) {
                    $paymentType = 'memcap';
                    $mem = MembershipPayment::where('reference_number', $reference)->whereIn('status', ['Pending', 'pending'])->first();
                    $cap = CapitalContribution::where('reference_number', $reference)->whereIn('status', ['Pending', 'pending'])->first();
                    if (!$mem && !$cap) return response()->json(['error' => 'Transaction not found.'], 404);
                    
                    $totalRaw = ($mem->amount ?? 0) + ($cap->amount ?? 0);
                    $description = "Initial Onboarding - {$reference}";
                } else {
                    $paymentType = 'membership';
                    $mem = MembershipPayment::where('reference_number', $reference)->whereIn('status', ['Pending', 'pending'])->first();
                    if (!$mem) return response()->json(['error' => 'Transaction not found.'], 404);
                    
                    $totalRaw = $mem->amount;
                    $description = "Membership Payment - {$reference}";
                }
                
            } elseif ($category === 'shareCapital') { // <--- MATCHES REACT EXACTLY
                $paymentType = 'capital';
                $cap = CapitalContribution::where('reference_number', $reference)->whereIn('status', ['Pending', 'pending'])->first();
                if (!$cap) return response()->json(['error' => 'Transaction not found.'], 404);
                
                $totalRaw = $cap->amount;
                $description = "Capital Contribution - {$reference}";
                
            } elseif ($category === 'savings') {
                $paymentType = 'savings';
                $sav = SavingsDeposit::where(function($q) use ($reference) {
                    $q->where('referenceNumber', $reference);
                })->whereIn('status', ['Pending', 'pending'])->first();
                if (!$sav) return response()->json(['error' => 'Transaction not found.'], 404);
                
                $totalRaw = $sav->amount;
                $description = "Savings Deposit - {$reference}";
            }

            $totalWithFee = $this->calculateAmountWithFee($totalRaw);

            return $this->createPayMongoLink($totalWithFee, $description, [
                'paymentType' => $paymentType, 'reference' => $reference, 'memberId' => $member->id, 'rawAmount' => $totalRaw,
            ]);

        } catch (\Throwable $e) {
            Log::error("Continue Payment Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to initiate checkout.'], 500);
        }
    }

    /* ===============================================================
     * COMBINED ONBOARDING CHECKOUT (Membership + Share Capital)
     * =============================================================== */
    public function createOnboardingCheckout(Request $request) {
        try {
            if (!$member = $this->getMember()) return $this->unauthorized();
            
            $membershipFee = (float) $request->input('membershipFee', 300);
            $shareCapital  = (float) $request->input('shareCapital', 1000);
            
            $totalRaw = $membershipFee + $shareCapital;
            $totalWithFee = $this->calculateAmountWithFee($totalRaw);
            
            // 1. Check for EXISTING Pending Onboarding Payment
            $pendingMembership = MembershipPayment::where('memberId', $member->id)
                ->where('is_paid', false)
                ->where('status', 'Pending')
                ->where('reference_number', 'LIKE', 'MEMCAP-%')
                ->first();

            $pendingCapital = CapitalContribution::where('memberId', $member->id)
                ->where('is_paid', false)
                ->where('status', 'Pending')
                ->where('reference_number', 'LIKE', 'MEMCAP-%')
                ->first();

            // 2. Reuse or Create Reference
            if ($pendingMembership && $pendingCapital && $pendingMembership->reference_number === $pendingCapital->reference_number) {
                $parentReference = $pendingMembership->reference_number;
                $pendingMembership->update(['amount' => $membershipFee]);
                $pendingCapital->update(['amount' => $shareCapital]);
            } else {
                $parentReference = $this->makeReference("MEMCAP", $member->id);

                MembershipPayment::create([
                    'memberId'         => $member->id,
                    'amount'           => $membershipFee,
                    'reference_number' => $parentReference,
                    'is_paid'          => false,
                    'status'           => 'Pending',
                ]);

                CapitalContribution::create([
                    'memberId'         => $member->id,
                    'transactionType'  => 'deposit',
                    'amount'           => $shareCapital,
                    'reference_number' => $parentReference,
                    'remarks'          => 'initial_capital',
                    'is_paid'          => false,
                    'status'           => 'Pending',
                ]);
            }

            return $this->createPayMongoLink($totalWithFee, "Initial Onboarding - {$parentReference}", [
                'paymentType' => 'memcap',
                'reference'   => $parentReference,
                'memberId'    => $member->id,
                'rawAmount'   => $totalRaw,
            ]);

        } catch (\Throwable $e) {
            Log::error("Onboarding Checkout Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to initiate onboarding checkout.'], 500);
        }
    }

    /* ===============================================================
     * 1) MEMBERSHIP CHECKOUT (₱300 base fee)
     * =============================================================== */
    public function createMembershipCheckout(Request $request) {
        try {
            if (!$member = $this->getMember()) return $this->unauthorized();
        
            $totalAmount = $this->calculateAmountWithFee(300.00);
        
            $pending = MembershipPayment::where('memberId', $member->id)
                ->where('is_paid', false)
                ->where('status', 'Pending')
                ->first();
        
            if ($pending) {
                $referenceNumber = $pending->reference_number;
                $pending->update(['amount' => $totalAmount]);
            } else {
                $referenceNumber = $this->makeReference("MEM", $member->id);
                MembershipPayment::create([
                    'memberId'         => $member->id,
                    'amount'           => $totalAmount,
                    'reference_number' => $referenceNumber,
                    'is_paid'          => false,
                    'status'           => 'Pending',
                ]);
            }
        
            return $this->createPayMongoLink($totalAmount, "Membership Payment - {$referenceNumber}", [
                'paymentType' => 'membership',
                'reference'   => $referenceNumber,
                'memberId'    => $member->id,
                'rawAmount'   => $totalAmount,
            ]);

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
            if (!$member = $this->getMember()) return $this->unauthorized();
            if ($errorResponse = $this->validateAmount($request, 500)) return $errorResponse;

            $amount      = (float) $request->amount;
            $totalAmount = $this->calculateAmountWithFee($amount);
            $reference   = $this->makeReference("CC", $member->id);

            CapitalContribution::create([
                'memberId'         => $member->id,
                'transactionType'  => 'deposit',
                'amount'           => $amount,
                'reference_number' => $reference,
                'remarks'          => 'capital_deposit',
                'is_paid'          => false,
                'status'           => 'Pending',
            ]);

            return $this->createPayMongoLink($totalAmount, "Capital Contribution - {$reference}", [
                'paymentType' => 'capital',
                'reference'   => $reference,
                'memberId'    => $member->id,
                'rawAmount'   => $amount,
            ]);
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
            if (!$member = $this->getMember()) return $this->unauthorized();
            if ($errorResponse = $this->validateAmount($request, 50)) return $errorResponse;

            $amount      = (float) $request->amount;
            $totalAmount = $this->calculateAmountWithFee($amount);
            $reference   = $this->makeReference("SD", $member->id);

            SavingsDeposit::create([
                'memberId'        => $member->id,
                'transactionType' => 'deposit',
                'amount'          => $amount,
                'referenceNumber' => $reference,
                'is_paid'         => false,
                'status'          => 'Pending',
            ]);

            return $this->createPayMongoLink($totalAmount, "Savings Deposit - {$reference}", [
                'paymentType' => 'savings',
                'reference'   => $reference,
                'memberId'    => $member->id,
                'rawAmount'   => $amount,
            ]);
        } catch (\Throwable $e) {
            Log::error("Savings Checkout Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to initiate checkout.'], 500);
        }
    }

    /* ===============================================================
     * SHARED WEBHOOK
     * =============================================================== */
    public function webhook(Request $request) {
        try {
            Log::info('Webhook received from PayMongo!', ['payload' => $request->getContent()]);

            // 1. Security Check
            if (!$this->isSignatureValid($request)) {
                return response()->json(['error' => 'Invalid Signature'], 401);
            }

            // 2. Event Filtering
            $eventType = $request->input('data.attributes.type');
            if (!in_array($eventType, ['payment.paid', 'link.payment.paid'])) {
                return response()->json(['message' => 'Ignored event: ' . $eventType]);
            }

            // 3. Payload Normalization
            $paymentData = $request->input('data.attributes.data.attributes');
            if (!$paymentData || ($paymentData['status'] ?? '') !== 'paid') {
                return response()->json(['message' => 'Invalid or unpaid status context.'], 200);
            }

            $metadata    = $paymentData['metadata'] ?? [];
            $description = (string) ($paymentData['description'] ?? '');
            $rawAmount   = $metadata['rawAmount'] ?? ($paymentData['amount'] / 100);

            // Extract reference key strings
            $reference = $metadata['reference'] ?? null;
            if (!$reference && preg_match('/(MEMCAP-|MEM-|CC-|SD-)[0-9\-]+/', $description, $match)) {
                $reference = $match[0];
            }

            if (!$reference) {
                Log::error('Could not find reference number in webhook context data');
                return response()->json(['ok' => true]);
            }

            $paymentType = $metadata['paymentType'] ?? $this->deducePaymentType($reference);
            if (!$paymentType) {
                Log::error("Unresolved payment model target context for: {$reference}");
                return response()->json(['ok' => true]);
            }

            // 4. State Synchronization Processing Pipeline
            $this->processDatabaseUpdate($paymentType, $reference, (float) $rawAmount);

            return response()->json(['ok' => true]);

        } catch (\Throwable $e) {
            Log::error("Webhook Handling Execution Error: " . $e->getMessage());
            return response()->json(['error' => 'Server Error'], 500);
        }
    }

    /* ===============================================================
     * PRIVATE INTERNALS & DATABASE DATA SYNC PIPELINES
     * =============================================================== */
    private function processDatabaseUpdate(string $type, string $reference, float $rawAmount): void  {
        Log::info("Processing Payment Database Layer Updates for [{$type}]: {$reference}");

        switch ($type) {
            case 'memcap':
                try {
                    $memUpdated = MembershipPayment::where('reference_number', $reference)
                        ->where(fn($q) => $q->where('is_paid', false)->orWhere('status', '!=', 'Paid'))
                        ->update(['is_paid' => true, 'status' => 'Paid', 'paid_at' => now()]);
                } catch (\Exception $e) {
                    Log::error("MemCap Webhook Error (Membership): " . $e->getMessage());
                    $memUpdated = 0;
                }

                try {
                    $capUpdated = CapitalContribution::where('reference_number', $reference)
                        ->where(fn($q) => $q->where('is_paid', false)->orWhere('status', '!=', 'Posted'))
                        ->update(['is_paid' => true, 'status' => 'Posted', 'paid_at' => now()]);
                } catch (\Exception $e) {
                    Log::error("MemCap Webhook Error (Capital): " . $e->getMessage());
                    $capUpdated = 0;
                }

                Log::info("MemCap Update Result - Membership: {$memUpdated}, Capital: {$capUpdated}");

                if ($memUpdated > 0 || $capUpdated > 0) {
                    // Fetch Member ID from whichever table updated successfully
                    $memberId = (int) MembershipPayment::where('reference_number', $reference)->value('memberId') 
                            ?: (int) CapitalContribution::where('reference_number', $reference)->value('memberId');

                    $this->finalizeTransaction(
                        $memberId, 
                        'Onboarding Payment Successful', 
                        "Your membership fee and initial share capital have been successfully posted.", 
                        "PMPC: Your onboarding payment of ₱" . number_format($rawAmount, 2) . " has been received and posted. Ref: {$reference}."
                    );
                }
                break;

            case 'membership':
                $updated = MembershipPayment::where('reference_number', $reference)
                    ->where(fn($q) => $q->where('is_paid', false)->orWhere('status', '!=', 'Paid'))
                    ->update(['is_paid' => true, 'status' => 'Paid', 'paid_at' => now()]);

                if ($updated > 0) {
                    $memberId = (int) MembershipPayment::where('reference_number', $reference)->value('memberId');
                    $this->finalizeTransaction($memberId, 'Membership Payment Successful', 'Your membership fee has been successfully paid.', "PMPC: Your membership payment of ₱" . number_format($rawAmount, 2) . " has been received. Ref: {$reference}.");
                }
                break;

            case 'capital':
                $updated = CapitalContribution::where('reference_number', $reference)
                    ->where(fn($q) => $q->where('is_paid', false)->orWhere('status', '!=', 'Posted'))
                    ->update(['is_paid' => true, 'status' => 'Posted', 'paid_at' => now()]);

                if ($updated > 0) {
                    $memberId = (int) CapitalContribution::where('reference_number', $reference)->value('memberId');
                    $this->finalizeTransaction($memberId, 'Capital Contribution Posted', "Your capital contribution of ₱" . number_format($rawAmount, 2) . " has been posted.", "PMPC: Your capital contribution of ₱" . number_format($rawAmount, 2) . " has been posted. Ref: {$reference}.");
                }
                break;

            case 'savings':
                $updated = SavingsDeposit::where('referenceNumber', $reference)
                    ->where(fn($q) => $q->where('isPaid', false)->orWhere('status', '!=', 'Posted'))
                    ->update(['isPaid' => true, 'status' => 'Posted', 'paidAt' => now()]);

                if ($updated > 0) {
                    $memberId = (int) SavingsDeposit::where('referenceNumber', $reference)->value('memberId');
                    $this->finalizeTransaction($memberId, 'Savings Deposit Posted', "Your savings deposit of ₱" . number_format($rawAmount, 2) . " has been posted.", "PMPC: Your savings deposit of ₱" . number_format($rawAmount, 2) . " has been posted. Ref: {$reference}.");
                }
                break;
        }
    }

    private function finalizeTransaction(int $memberId, string $title, string $notifMsg, string $smsMsg): void  {
        if (!$memberId) return;
        
        // Internal DB Notification Panel
        MemberNotification::create([
            'memberId' => $memberId,
            'title'    => $title,
            'message'  => $notifMsg,
            'type'     => 'payment',
            'isRead'   => 0
        ]);

        // Semaphore SMS Integration
        $this->sendSms($memberId, $smsMsg);
    }

    private function isSignatureValid(Request $request): bool {
        if (!$signatureHeader = $request->header('Paymongo-Signature')) {
            Log::warning('PayMongo Webhook Execution Request missing cryptographic validation headers');
            return false;
        }

        $parsedSignature = [];
        foreach (explode(',', $signatureHeader) as $part) {
            $segments = explode('=', $part, 2);
            if (count($segments) === 2) $parsedSignature[$segments[0]] = $segments[1];
        }

        $timestamp    = $parsedSignature['t'] ?? '';
        $hashToVerify = app()->environment('production') ? ($parsedSignature['li'] ?? '') : ($parsedSignature['te'] ?? '');
        $expectedHash = hash_hmac('sha256', $timestamp . '.' . $request->getContent(), $this->webhookSecret);

        return hash_equals($expectedHash, $hashToVerify) || app()->environment('local');
    }

    private function createPayMongoLink(float $totalAmount, string $description, array $metadata) {
        $payload = [
            'data' => [
                'attributes' => [
                    'amount'      => (int) round($totalAmount * 100),
                    'description' => $description,
                    'currency'    => 'PHP',
                    'remarks'     => 'PMPC Payment',
                    'metadata'    => $metadata,
                    'redirect'    => [
                        'success' => url('/client/dashboard'),
                        'failed'  => url('/client/dashboard'),
                    ]
                ],
            ],
        ];

        $response = Http::withBasicAuth($this->secretKey, '')->post($this->baseUrl . '/links', $payload);

        if (!$response->successful()) {
            Log::error('PayMongo Endpoint Response Fault Exception Trace', ['status' => $response->status(), 'body' => $response->body()]);
            return response()->json(['error' => 'Unable to create payment link. Please try again later.'], 500);
        }

        return response()->json(['checkoutUrl' => $response->json('data.attributes.checkout_url')]);
    }

    private function validateAmount(Request $request, int $minAmount) {
        $validator = Validator::make($request->all(), [
            'amount' => "required|numeric|min:{$minAmount}|max:750000"
        ]);

        return $validator->fails() ? response()->json(['error' => $validator->errors()->first()], 422) : null;
    }

    private function calculateAmountWithFee(float $amount): float {
        return round($amount + ($amount * self::CONVENIENCE_FEE_RATE), 2);
    }

    private function deducePaymentType(string $reference): ?string {
        if (str_starts_with($reference, 'MEMCAP-')) return 'memcap';
        if (str_starts_with($reference, 'MEM-')) return 'membership';
        if (str_starts_with($reference, 'CC-'))  return 'capital';
        if (str_starts_with($reference, 'SD-'))  return 'savings';
        return null;
    }

    private function sendSms(?int $memberId, string $message): void {
        if (!$memberId || !config('services.semaphore.enabled', true)) return;

        try {
            if (!$member = Member::find($memberId)) return;
            if (!$mobile = $member->mobile ?? $member->contact) return;

            Http::asForm()->post(config('services.semaphore.url', 'https://api.semaphore.co/api/v4/messages'), [
                'apikey'     => config('services.semaphore.api_key'),
                'sendername' => config('services.semaphore.sender_name', 'PeoplesCoop'),
                'number'     => $mobile,
                'message'    => $message,
            ]);
        } catch (\Throwable $e) {
            Log::error("Semaphore Gateway Exception execution trace: {$e->getMessage()}", ['memberId' => $memberId]);
        }
    }

    private function getMember() { 
        return Auth::guard('member')->user(); 
    }

    private function unauthorized() {
        return response()->json(['error' => 'Unauthorized'], 401);
    }

    private function makeReference(string $prefix, int $memberId): string {
        return sprintf("%s-%s-%06d", $prefix, date('Ymd'), rand(1, 999999));
    }

    private function sendEmailInvoice(?int $memberId, string $subject, string $bodyText): void {
        if (!$memberId) return;

        try {
            $member = Member::find($memberId);
            if ($member && $member->email) {
                Mail::raw($bodyText, function ($message) use ($member, $subject) {
                    $message->to($member->email)->subject($subject);
                });
            }
        } catch (\Throwable $e) {
            Log::error('Email invoice delivery failed: ' . $e->getMessage());
        }
    }
}