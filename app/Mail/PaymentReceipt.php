<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReceipt extends Mailable
{
    use Queueable, SerializesModels;

    public $member;
    public $referenceNumber;
    public $amount;
    public $description;
    public $items;

    public function __construct($member, $referenceNumber, $amount, $description = null, $items = [])
    {
        $this->member = $member;
        $this->referenceNumber = $referenceNumber;
        $this->amount = $amount;
        $this->description = $description;
        $this->items = $items;
    }

    public function build() {
        return $this->subject('PMPC Payment Receipt')
            ->view('emails.payment_receipt');
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
