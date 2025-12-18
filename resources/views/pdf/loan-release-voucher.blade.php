<!doctype html>
<html>
    <head>
        <meta charset="utf-8"/>
        <style>
            *{ font-family: Arial, Helvetica, sans-serif; }
            body{ font-size: 12px; color:#111; }
            .title{ font-weight:700; font-size:16px; text-align:center; }
            .subtitle{ text-align:center; margin-bottom:8px; }
            .section{ border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:10px; }
            table{ width:100%; border-collapse: collapse; }
            td{ padding:4px 6px; vertical-align:top; }
            .th{ font-weight:700; text-transform:uppercase; font-size:12px; padding:6px 0; }
            .label{ color:#555; width:45%; }
            .num{ text-align:right; font-weight:600; }
            .muted{ color:#666; }
        </style>
    </head>
    <body>
        <div class="title">{{ $title }}</div>
        <div class="subtitle">{{ $coopName }}<br>{{ $coopAddress }}</div>

        <div class="section">
            <table>
                <tr><td class="label">Date</td><td>{{ $date }}</td><td class="label">LV No.</td><td>{{ $lvNo }}</td></tr>
                <tr><td class="label">Name of Borrower</td><td>{{ $borrowerName }}</td><td class="label">Serial No.</td><td>{{ $serialNo }}</td></tr>
                <tr><td class="label">Address</td><td colspan="3">{{ $address }}</td></tr>
            </table>
        </div>

        <div class="section">
            <div class="th">Release Breakdown</div>
            <table>
                <tr><td class="label">Principal Amount</td><td class="num">₱{{ number_format($principalAmount,2) }}</td></tr>
                <tr><td class="label">(-) Balance Old Loan(s)</td><td class="num">₱{{ number_format($balanceOldLoans,2) }}</td></tr>
                <tr><td class="label">(-) Membership Fee</td><td class="num">₱{{ number_format($membershipFee,2) }}</td></tr>
                <tr><td class="label">(-) Paid Up Capital</td><td class="num">₱{{ number_format($paidUpCapital,2) }}</td></tr>
                <tr><td class="label">(-) Service Fee</td><td class="num">₱{{ number_format($serviceFee,2) }}</td></tr>
                <tr><td class="label">(-) Insurance Premium</td><td class="num">₱{{ number_format($insurancePremium,2) }}</td></tr>
                <tr><td class="label">(-) Advance Interest</td><td class="num">₱{{ number_format($advanceInterest,2) }}</td></tr>
                <tr><td class="label"><strong>NET PROCEEDS (Php)</strong></td><td class="num"><strong>₱{{ number_format($netProceeds,2) }}</strong></td></tr>
            </table>
        </div>

        <div class="section">
            <div class="th">Payment Terms</div>
            <table>
                <tr><td class="label">Term of Loan in months</td><td>{{ $termMonths }}</td></tr>
                <tr><td class="label">Monthly Amortization</td><td>₱{{ number_format($monthlyAmort,2) }}</td></tr>
                <tr><td class="label">First Payment Due On</td><td>{{ $firstPayment }}</td></tr>
                <tr><td class="label">Maturity</td><td>{{ $maturity }}</td></tr>
                <tr><td class="label">EIR (%)</td><td>{{ number_format($eirPercent,2) }}%</td></tr>
                <tr><td class="label">Interest Rate per Month (%)</td><td>{{ number_format($interestPerMonth,2) }}%</td></tr>
            </table>
        </div>

        <div class="section">
            <div class="th">Signatories</div>
            <table>
                <tr>
                    <td style="width:25%;">Processed & Verified by</td>
                    <td style="width:25%;">{{ $signatories['processedBy'] }}</td>
                    <td style="width:25%;">Verified by</td>
                    <td style="width:25%;">{{ $signatories['verifiedBy'] }}</td>
                </tr>
                <tr><td colspan="4" style="height:26px;"></td></tr>
                <tr>
                    <td>Received By</td>
                    <td>{{ $signatories['receivedBy'] }}</td>
                    <td>Approved By</td>
                    <td>{{ $signatories['approvedBy'] }}</td>
                </tr>
            </table>
        </div>
    </body>
</html>
