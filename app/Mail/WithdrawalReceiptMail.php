<?php

namespace App\Mail;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Attachment;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WithdrawalReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly object $member,
        public readonly object $withdrawal,
        public readonly float  $balanceBefore,
        public readonly float  $balanceAfter,
        public readonly string $processedBy = 'Authorized Officer',
    ) {}

    public function envelope(): Envelope {
        return new Envelope(
            subject: 'Your Savings Withdrawal Receipt – ' . $this->withdrawal->referenceNumber,
        );
    }

    public function content(): Content {
        return new Content(
            view: 'emails.withdrawal-receipt-body', // simple HTML email body
            with: [
                'member'     => $this->member,
                'withdrawal' => $this->withdrawal,
                'balanceAfter' => $this->balanceAfter,
            ],
        );
    }

    public function attachments(): array {
        $pdf = Pdf::loadView('pdf.withdrawal-receipt', [
            'member'        => $this->member,
            'withdrawal'    => $this->withdrawal,
            'balanceBefore' => $this->balanceBefore,
            'balanceAfter'  => $this->balanceAfter,
            'processedBy'   => $this->processedBy,
        ])->setPaper('a4', 'portrait');

        return [
            Attachment::fromData(
                fn () => $pdf->output(),
                'withdrawal-receipt-' . $this->withdrawal->referenceNumber . '.pdf'
            )->withMime('application/pdf'),
        ];
    }
}