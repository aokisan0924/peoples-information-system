<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactMessage;
use Inertia\Inertia;

class ContactController extends Controller
{

    public function showContactPage() {
        return Inertia::render('Contact');
    }
    public function send(Request $request) {
        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['required', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);
    
        // Get contact recipient from config, with safety fallback
        $contactTo = config('mail.contact_to');
    
        if (empty($contactTo)) {
            // Fallback to from address or a hard-coded safe default
            $contactTo = config('mail.from.address') ?: 'peoplesmpcooperative@gmail.com';
        }
    
        Mail::to($contactTo)->send(new ContactMessage(
            $validated['name'],
            $validated['email'],
            $validated['message']
        ));
    
        return response()->json(['message' => 'Message sent']);
    }
}
