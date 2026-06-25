<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdrawal Receipt</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 32px 16px; }
        .card { background: #fff; border-radius: 16px; max-width: 480px; margin: 0 auto; overflow: hidden; }
        .header { background: linear-gradient(135deg, #059669, #0d9488); padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 13px; }
        .body { padding: 28px 32px; }
        .greeting { font-size: 15px; color: #334155; margin-bottom: 16px; }
        .amount-box { background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .amount-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 600; }
        .amount-value { font-size: 36px; font-weight: 800; color: #059669; font-family: 'Courier New', monospace; margin-top: 4px; }
        .amount-method { font-size: 12px; color: #94a3b8; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #94a3b8; font-weight: 600; }
        .detail-value { color: #334155; font-weight: 600; font-family: 'Courier New', monospace; }
        .balance-after { background: #f8fafc; border-radius: 10px; padding: 14px 18px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
        .balance-label { font-size: 12px; color: #64748b; font-weight: 600; }
        .balance-value { font-size: 16px; font-weight: 800; color: #059669; font-family: 'Courier New', monospace; }
        .note { background: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #854d0e; margin-top: 20px; }
        .attachment-note { text-align: center; font-size: 12px; color: #64748b; margin-top: 16px; }
        .footer { border-top: 1px solid #f1f5f9; padding: 18px 32px; font-size: 11px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>Withdrawal Successful</h1>
            <p>{{ config('app.name') }}</p>
        </div>
        <div class="body">
            <p class="greeting">Hi {{ $member->firstName }},</p>
            <p style="font-size:14px; color:#475569; line-height:1.6;">
                Your savings withdrawal request has been processed. The official receipt is attached to this email as a PDF.
            </p>

            <div class="amount-box">
                <div class="amount-label">Amount Released</div>
                <div class="amount-value">₱{{ number_format(abs((float)$withdrawal->amount), 2) }}</div>
                <div class="amount-method">via {{ strtoupper($withdrawal->payoutMethod ?? 'N/A') }}</div>
            </div>

            <div class="detail-row">
                <span class="detail-label">Reference No.</span>
                <span class="detail-value">{{ $withdrawal->referenceNumber }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date Released</span>
                <span class="detail-value">
                    {{ \Carbon\Carbon::parse($withdrawal->paidAt ?? $withdrawal->updated_at)->format('M j, Y') }}
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Account Name</span>
                <span class="detail-value">{{ $withdrawal->withdrawalAccountName ?? '—' }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Account No.</span>
                <span class="detail-value">{{ $withdrawal->withdrawalAccountNumber ?? '—' }}</span>
            </div>

            <div class="balance-after">
                <span class="balance-label">Remaining Balance</span>
                <span class="balance-value">₱{{ number_format($balanceAfter, 2) }}</span>
            </div>

            <div class="note">
                <strong>Keep this email for your records.</strong> Your official PDF receipt is attached.
                For questions, contact PMPC support.
            </div>

            <p class="attachment-note">📎 Attachment: <strong>withdrawal-receipt-{{ $withdrawal->referenceNumber }}.pdf</strong></p>
        </div>
        <div class="footer">
            This is an automated message from {{ config('app.name') }}. Please do not reply.
        </div>
    </div>
</body>
</html>