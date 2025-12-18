<!doctype html>
<html>
    <head>
        <meta charset="utf-8"/>
        <style>
            *{ font-family: Arial, Helvetica, sans-serif; }
            body{ font-size: 12px; color:#111; }
            h1,h2,h3{ margin: 0; }
            .title{ font-weight:700; font-size:16px; text-align:center; }
            .subtitle{ text-align:center; margin-bottom:8px; }
            .section{ border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:10px; }
            .grid2{ width:100%; border-collapse: collapse; }
            .grid2 td{ padding:4px 6px; vertical-align:top; }
            .label{ color:#555; width:33%; }
            .val{ font-weight:600; }
            .muted{ color:#666; font-size:11px; }
            .hr{ height:1px; background:#e5e5e5; margin:8px 0; }
        </style>
    </head>
    <body>
        <div class="title">LOAN APPLICATION FORM</div>
        <div class="subtitle">{{ $coopName }}<br>{{ $coopAddress }}</div>

        <div class="section">
            <h3>BORROWER'S INFORMATION</h3>
            <table class="grid2">
                <tr><td class="label">Loan Reference</td><td class="val">{{ $loanReference }}</td></tr>
                <tr><td class="label">Date</td><td class="val">{{ $date }}</td></tr>
                <tr><td class="label">Name</td>
                    <td class="val">{{ $member['lastName'] }}, {{ $member['firstName'] }} {{ $member['middleName'] }} {{ $member['suffix'] }}</td></tr>
                <tr><td class="label">Username</td><td class="val">{{ $member['username'] }}</td></tr>
                <tr><td class="label">Email</td><td class="val">{{ $member['email'] }}</td></tr>
            </table>
        </div>

        <div class="section">
            <h3>APPLICATION DETAILS</h3>
            <table class="grid2">
                <tr><td class="label">Amount Applied</td><td class="val">₱{{ number_format($loanAmount,2) }}</td></tr>
                <tr><td class="label">Monthly Amortization</td><td class="val">₱{{ number_format($monthlyAmortization,2) }}</td></tr>
                <tr><td class="label">Term</td><td class="val">{{ $termMonths }} Months</td></tr>
            </table>
        </div>

        <div class="section">
            <h3>NOTIFICATION CLAUSE</h3>
            <p class="muted">
                I hereby acknowledge and authorize the People's Multi-Purpose Cooperative (PMPC) for the regular submission and disclosure of my basic credit
                data to the CIC and sharing with lenders/credit reporting agencies, and certify the truthfulness of the information provided. (Summary of your form content) 
            </p>
            <div class="hr"></div>
            <p class="muted"><strong>Promissory Note</strong> — For value received, the undersigned promises to pay the sum in equal monthly installments, subject to penalties and conditions as provided. (Per your back page wording.)</p>
        </div>

        <div style="margin-top:30px;">
            <table class="grid2">
            <tr><td class="label">Borrower’s Signature</td><td class="val">____________________________</td></tr>
            <tr><td class="label">Date</td><td class="val">____________________________</td></tr>
            </table>
        </div>
    </body>
</html>
