<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function sendOtp(string $phoneNumber, string $message): void
    {
        $apiKey     = config('services.semaphore.api_key');
        $senderName = config('services.semaphore.sender_name', 'PeoplesCoop');

        if (!$apiKey) {
            Log::error('Semaphore API key is not set.');
            return;
        }

        $formattedNumber = $this->formatNumber($phoneNumber);

        try {
            $response = Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
                'apikey'     => $apiKey,
                'number'     => $formattedNumber,
                'message'    => $message,
                'sendername' => $senderName,
            ]);

            if (!$response->successful()) {
                Log::error('Semaphore OTP send failed', [
                    'phone'    => $formattedNumber,
                    'response' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Semaphore OTP error', [
                'phone'   => $formattedNumber,
                'error'   => $e->getMessage(),
            ]);
        }
    }

    private function formatNumber(string $phone): string
    {
        // Strip non-digits
        $digits = preg_replace('/\D+/', '', $phone ?? '');

        // 11-digit PH mobile, e.g. 09xxxxxxxxx
        if (strlen($digits) === 11 && str_starts_with($digits, '0')) {
            return '+63' . substr($digits, 1);
        }

        // Already 639xxxxxxxxx
        if (strlen($digits) === 12 && str_starts_with($digits, '63')) {
            return '+' . $digits;
        }

        // Fallback: just prefix "+"
        return '+' . $digits;
    }
}
