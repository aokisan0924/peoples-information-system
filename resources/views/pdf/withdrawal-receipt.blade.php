<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Withdrawal Receipt &ndash; {{ $withdrawal->referenceNumber }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            color: #1e293b;
            background: #ffffff;
            padding: 20px; /* Add padding to body instead of relying on page */
        }

        /* ─── PAGE ─────────────────────────────────────── */
        .page {
            /* Removed width: 100% to prevent dompdf box-model overflow */
            padding: 24px 32px; 
            border: 1.5px solid #e2e8f0;
            margin: 0 auto;
        }

        /* ─── HEADER ────────────────────────────────────── */
        .header {
            border-bottom: 3px solid #059669;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .header table { width: 100%; border-collapse: collapse; }
        .header td   { padding: 0; vertical-align: middle; }
        .header-text   { padding-left: 12px; }
        .org-name      { font-size: 16px; font-weight: 800; color: #059669; letter-spacing: -0.3px; }
        .org-sub       { font-size: 9px; color: #64748b; margin-top: 2px; letter-spacing: 0.5px; text-transform: uppercase; }
        .receipt-title { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; text-align: right; }
        .receipt-sub   { font-size: 9px; color: #94a3b8; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.8px; text-align: right; }

        /* ─── STATUS BANNER ─────────────────────────────── */
        .status-banner {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            padding: 8px 14px;
            margin-bottom: 16px;
        }
        .status-banner table { width: 100%; border-collapse: collapse; }
        .status-banner td    { padding: 0; vertical-align: middle; }
        .dot {
            width: 8px; height: 8px;
            background: #16a34a;
            border-radius: 50%;
        }
        .status-text {
            padding-left: 8px;
            font-size: 11px;
            font-weight: 700;
            color: #16a34a;
        }
        .status-ref {
            text-align: right;
            font-size: 10px;
            color: #64748b;
            font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
            /* Removed nowrap so it doesn't force table wider than page */
        }

        /* ─── SECTION LABEL ─────────────────────────────── */
        .section-label {
            font-size: 8px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid #f1f5f9;
        }

        /* ─── AMOUNT HERO ───────────────────────────────── */
        .amount-hero {
            background: #059669;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 16px;
            text-align: center;
            color: #ffffff;
        }
        .amount-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: rgba(255,255,255,0.75);
            margin-bottom: 6px;
        }
        .amount-value {
            font-size: 30px;
            font-weight: 800;
            letter-spacing: -1px;
            font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
            color: #ffffff;
        }
        .amount-method {
            font-size: 10px;
            color: rgba(255,255,255,0.75);
            margin-top: 6px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        /* ─── INFO GRIDS ──────────────────── */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        .info-table td {
            width: 50%;
            padding: 0 12px 10px 0;
            vertical-align: top;
        }
        .info-table td.right-col {
            padding: 0 0 10px 12px;
            border-left: 1px solid #f1f5f9;
        }
        .info-key {
            font-size: 8.5px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
        }
        .info-val {
            font-size: 11.5px;
            font-weight: 600;
            color: #0f172a;
        }
        .info-val-mono {
            font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
            font-size: 11px;
            color: #0f172a;
        }

        /* ─── DIVIDER ────────────────────────────────────── */
        .divider {
            border: none;
            border-top: 1px dashed #e2e8f0;
            margin: 12px 0;
        }

        /* ─── BALANCE SUMMARY ───────────────────────────── */
        .balance-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
        }
        .balance-table td {
            padding: 8px 12px;
            font-size: 11px;
            border-bottom: 1px solid #f1f5f9;
        }
        .balance-table tr:last-child td {
            border-bottom: none;
        }
        .balance-label {
            color: #64748b;
            font-weight: 600;
            width: 60%;
        }
        .balance-value {
            text-align: right;
            font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
            font-weight: 700;
            color: #0f172a;
            width: 40%;
            white-space: nowrap;
        }
        .balance-net-label {
            color: #0f172a;
            font-weight: 800;
            width: 60%;
        }
        .balance-net-value {
            text-align: right;
            font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
            font-weight: 800;
            color: #059669;
            font-size: 13px;
            width: 40%;
            white-space: nowrap;
        }
        .balance-debit-value {
            color: #dc2626;
        }

        /* ─── FOOTER ─────────────────────────────────────── */
        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            text-align: center;
            font-size: 8.5px;
            color: #94a3b8;
            line-height: 1.6;
        }
        .footer strong { color: #64748b; }

        /* ─── WATERMARK ──────────────────────────────────── */
        .watermark {
            position: fixed;
            top: 45%;
            left: 20%;
            font-size: 80px;
            font-weight: 900;
            color: rgba(5, 150, 105, 0.04);
            letter-spacing: 8px;
            z-index: 0;
            pointer-events: none;
            transform: rotate(-30deg);
        }
    </style>
</head>
<body>
    <div class="watermark">PMPC</div>

    <div class="page">

        {{-- ── HEADER ──────────────────────────────────────── --}}
        <div class="header">
            <table>
                <tr>
                    <td style="width:60px;">
                        @php
                            $path = public_path('images/logo/pis_logo.png');
                            if (file_exists($path)) {
                                $type = pathinfo($path, PATHINFO_EXTENSION);
                                $data = file_get_contents($path);
                                $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                            } else {
                                $base64 = ''; 
                            }
                        @endphp
                        
                        @if($base64)
                            <img src="{{ $base64 }}" alt="PMPC Logo" style="width:52px; height:auto;">
                        @else
                            <div class="logo-circle" style="width: 52px; height: 52px; background: #059669; border-radius: 50%; text-align: center; line-height: 52px; color: #fff; font-size: 18px; font-weight: 800;">PM</div>
                        @endif
                    </td>
                    <td class="header-text">
                        <div class="org-name">{{ config('app.name', 'PMPC') }}</div>
                        <div class="org-sub">Multi-Purpose Cooperative</div>
                    </td>
                    <td style="text-align:right;">
                        <div class="receipt-title">Official Receipt</div>
                        <div class="receipt-sub">Savings Withdrawal</div>
                    </td>
                </tr>
            </table>
        </div>

        {{-- ── STATUS BANNER ───────────────────────────────── --}}
        <div class="status-banner">
            <table>
                <tr>
                    <td style="width:10px;"><div class="dot"></div></td>
                    <td class="status-text">FUNDS RELEASED</td>
                    <td class="status-ref">
                        Ref: {{ $withdrawal->referenceNumber }}
                        &nbsp;&nbsp;
                        {{ \Carbon\Carbon::parse($withdrawal->paidAt ?? $withdrawal->updated_at)->format('F j, Y  g:i A') }}
                    </td>
                </tr>
            </table>
        </div>

        {{-- ── AMOUNT HERO ──────────────────────────────────── --}}
        <div class="amount-hero">
            <div class="amount-label">Amount Withdrawn</div>
            <div class="amount-value">
                PHP {{ number_format(abs((float)$withdrawal->amount), 2) }}
            </div>
            <div class="amount-method">
                via {{ strtoupper($withdrawal->payoutMethod ?? 'N/A') }}
            </div>
        </div>

        {{-- ── MEMBER INFORMATION ───────────────────────────── --}}
        <div class="section-label">Member Information</div>
        <table class="info-table">
            <tr>
                <td>
                    <div class="info-key">Full Name</div>
                    <div class="info-val">
                        {{ $member->firstName }}
                        {{ $member->middleName ? $member->middleName . ' ' : '' }}{{ $member->lastName }}
                    </div>
                </td>
                <td class="right-col">
                    <div class="info-key">Member ID / Username</div>
                    <div class="info-val-mono">{{ $member->username }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="info-key">Contact Number</div>
                    <div class="info-val-mono">{{ $member->contact ?? '-' }}</div>
                </td>
                <td class="right-col">
                    <div class="info-key">Email Address</div>
                    <div class="info-val">{{ $member->email ?? '-' }}</div>
                </td>
            </tr>
        </table>

        <hr class="divider">

        {{-- ── PAYOUT DETAILS ──────────────────────────────── --}}
        <div class="section-label">Payout Details</div>
        <table class="info-table">
            <tr>
                <td>
                    <div class="info-key">Payout Channel</div>
                    <div class="info-val">{{ strtoupper($withdrawal->payoutMethod ?? 'N/A') }}</div>
                </td>
                <td class="right-col">
                    <div class="info-key">Account Name</div>
                    <div class="info-val">{{ $withdrawal->withdrawalAccountName ?? '-' }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="info-key">Account Number</div>
                    <div class="info-val-mono">{{ $withdrawal->withdrawalAccountNumber ?? '-' }}</div>
                </td>
                <td class="right-col">
                    <div class="info-key">Bank / Provider</div>
                    <div class="info-val">{{ $withdrawal->withdrawalBankName ?? '-' }}</div>
                </td>
            </tr>
            @if(!empty($withdrawal->paymongoReferenceId))
            <tr>
                <td>
                    <div class="info-key">PayMongo Reference</div>
                    <div class="info-val-mono">{{ $withdrawal->paymongoReferenceId }}</div>
                </td>
                <td class="right-col"></td>
            </tr>
            @endif
        </table>

        <hr class="divider">

        {{-- ── BALANCE SUMMARY ──────────────────────────────── --}}
        <div class="section-label">Balance Summary</div>
        <table class="balance-table">
            <tr>
                <td class="balance-label">Balance Before Withdrawal</td>
                <td class="balance-value">PHP {{ number_format((float)$balanceBefore, 2) }}</td>
            </tr>
            <tr>
                <td class="balance-label">Amount Withdrawn</td>
                <td class="balance-value balance-debit-value">
                    &ndash;&nbsp;PHP {{ number_format(abs((float)$withdrawal->amount), 2) }}
                </td>
            </tr>
            <tr>
                <td class="balance-net-label">Remaining Balance</td>
                <td class="balance-net-value">PHP {{ number_format((float)$balanceAfter, 2) }}</td>
            </tr>
        </table>

        {{-- ── FOOTER ───────────────────────────────────────── --}}
        <div class="footer">
            <strong>{{ config('app.name', 'PMPC') }}</strong>
            &nbsp;|&nbsp;
            This is an official receipt for your records. Please keep this document for future reference.<br>
            For inquiries, contact PMPC support.
            &nbsp;|&nbsp;
            Generated: {{ now()->format('F j, Y g:i A') }}
        </div>

    </div>
</body>
</html>