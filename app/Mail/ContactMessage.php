<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactMessage extends Mailable
{
    use Queueable, SerializesModels;

    public string $name;
    public string $email;
    public string $messageText;

    public function __construct($name, $email, $messageText)
    {
        $this->name        = $name;
        $this->email       = $email;
        $this->messageText = $messageText;
    }

    public function build()
    {
        return $this->subject("New System Message - People's MPC")
            ->view('emails.contact-message');
    }
}
