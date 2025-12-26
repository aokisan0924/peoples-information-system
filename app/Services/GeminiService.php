<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key');
        $this->baseUrl = config('services.gemini.base_url');
    }

    public function generateContent(string $prompt): string
    {
        if (!$this->apiKey) {
            $msg = "DEBUG: API Key is missing. Check .env and config/services.php";
            echo "\033[31m$msg\033[0m\n"; 
            return "<p><em>AI Analysis Unavailable: $msg</em></p>";
        }

        try {
            // Added withoutVerifying() to prevent SSL errors on local setups
            $response = Http::withoutVerifying()
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post("{$this->baseUrl}?key={$this->apiKey}", [
                    'contents' => [['parts' => [['text' => $prompt]]]]
                ]);

            if ($response->failed()) {
                $error = "DEBUG: Google API Error (" . $response->status() . "): " . $response->body();
                echo "\033[31m$error\033[0m\n"; 
                return "<p><em>AI Analysis Unavailable: Google API Error ({$response->status()})</em></p>";
            }

            $data = $response->json();
            
            return $data['candidates'][0]['content']['parts'][0]['text'] 
                ?? "<p><em>AI Analysis Unavailable: Valid response but no text found.</em></p>";

        } catch (\Exception $e) {
            $error = "DEBUG: System Error: " . $e->getMessage();
            echo "\033[31m$error\033[0m\n";
            return "<p><em>AI Analysis Unavailable: System Error.</em></p>";
        }
    }
}