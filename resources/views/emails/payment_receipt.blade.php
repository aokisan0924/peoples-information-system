<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PMPC Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f6f8;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 5px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 20px; font-size: 13px; color: #666;">
                            <table width="100%">
                                <tr>
                                    <td align="left">
                                        <img src="https://cdn.maya.ph/images/maya-logo-green.png" alt="Maya Logo" style="height: 32px;">
                                    </td>
                                    <td align="right">
                                        {{ now()->format('d M Y, h:i A') }} (PHT)<br>
                                        <span style="font-size: 12px;">Request Ref. No.: <span style="color: #8b3ffc; font-weight: 500;">{{ $referenceNumber }}</span></span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px; font-size: 14px;">
                            <p style="margin-bottom: 10px;">Hi, <strong style="text-transform: uppercase;">{{ $member->firstName }}</strong>!</p>
                            <p>You sent <strong>₱{{ number_format($amount, 2) }}</strong> as payment to <strong>People’s Multi-Purpose Cooperative</strong>.</p>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding: 20px;">
                            <img src="{{ asset('/images/logo/pis_logo.png') }}" alt="PMPC Logo" style="height: 36px; margin-bottom: 10px;">
                            <div style="font-size: 28px; font-weight: bold; color: #006241;">₱{{ number_format($amount, 2) }}</div>
                            <div style="color: #666;">PMPC PAYMENT</div>
                        </td>
                    </tr>

                    <!-- TRANSACTION DETAILS -->
                    <tr>
                        <td style="padding: 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 12px; padding: 20px; font-size: 14px; font-family: 'Segoe UI', sans-serif; color: #333;">
                                <tr>
                                    <td colspan="2" style="padding-bottom: 10px; font-weight: bold; font-size: 13px; letter-spacing: 0.5px;">TRANSACTION DETAILS</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;">Status</td>
                                    <td align="right" style="padding: 8px 0;">
                                        <img src="https://img.icons8.com/emoji/16/000000/check-mark-emoji.png" alt="Paid"> <span style="color: green; font-weight: bold;">Paid</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-top: 1px solid #eaeaea;">Payment Date and Time</td>
                                    <td style="padding: 8px 0; border-top: 1px solid #eaeaea;" align="right">{{ now()->format('d M Y, h:i A') }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-top: 1px solid #eaeaea;">Transaction No.</td>
                                    <td style="padding: 8px 0; border-top: 1px solid #eaeaea;" align="right">{{ $referenceNumber }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-top: 1px solid #eaeaea;">Payment Method</td>
                                    <td style="padding: 8px 0; border-top: 1px solid #eaeaea;" align="right">Maya Checkout</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- PURCHASE DETAILS -->
                    <tr>
                        <td style="padding: 0 24px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 12px; padding: 20px; font-size: 14px; font-family: 'Segoe UI', sans-serif; color: #333;">
                                <tr>
                                    <td colspan="2" style="padding-bottom: 10px; font-weight: bold; font-size: 13px; letter-spacing: 0.5px;">PURCHASE DETAILS</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;">Subtotal</td>
                                    <td style="padding: 8px 0;" align="right">₱{{ number_format($amount, 2) }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px; font-size: 12px; color: #888; text-align: center;">
                            This is a system-generated receipt. Please do not reply.<br>
                            If you have any questions, email <a href="mailto:{{ $member->email }}" style="color: #0066cc;">{{ $member->email }}</a> or visit the PMPC Office.
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px 0; text-align: center; font-size: 12px; color: #aaa;">
                            &copy; {{ now()->year }} People’s Multi-Purpose Cooperative. All rights reserved.
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
