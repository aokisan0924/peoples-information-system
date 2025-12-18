<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MemberCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public $username;
    public $password;

    public function __construct($username, $password)
    {
        $this->username = $username;
        $this->password = $password;
    }

    public function build()
    {
        return $this->subject('Your Membership Login Credentials')
                    ->markdown('emails.member_credentials');
    }
}
