<!doctype html>
<html>
    <head>
        <meta charset="utf-8"/>
        <style>
            *{ font-family: Arial, Helvetica, sans-serif; }
            body{ font-size: 12px; color:#111; }
            .title{ font-weight:700; font-size:16px; text-align:center; }
            .muted{ color:#666; }
            .section{ border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:10px; }
            table{ width:100%; border-collapse: collapse; }
            th, td{ padding:6px; border:1px solid #e5e5e5; font-size:11px; }
            th{ background:#f6f6f6; text-transform:uppercase; }
            .right{ text-align:right; }
        </style>
    </head>
    <body>
    <div class="title">LOAN LEDGER CARD</div>

    <div class="section">
        <table>
            <tr>
                <td><strong>Name:</strong> {{ $borrowerName }}</td>
                <td><strong>Loan Voucher No.:</strong> {{ $lvNo }}</td>
            </tr>
            <tr>
                <td><strong>Address:</strong> {{ $address }}</td>
                <td><strong>Amount:</strong> ₱{{ number_format($loanAmount,2) }}</td>
            </tr>
            <tr>
                <td><strong>Date of Loan:</strong> {{ $dateOfLoan }}</td>
                <td><strong>Maturity Date:</strong> {{ $maturityDate }}</td>
            </tr>
            <tr>
                <td><strong>Term:</strong> {{ $termMonths }} MOS</td>
                <td></td>
            </tr>
        </table>
    </div>

        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Inst#</th>
                    <th class="right">Loan Installment</th>
                    <th class="right">Principal</th>
                    <th class="right">EIR</th>
                    <th class="right">Balance</th>
                </tr>
            </thead>
            <tbody>
            @foreach($schedule as $row)
                <tr>
                <td>{{ $row['dateLabel'] }}</td>
                <td class="right">{{ $row['period'] }}</td>
                <td class="right">₱{{ number_format($row['installment'],2) }}</td>
                <td class="right">{{ number_format($row['principal'],0) }}</td>
                <td class="right">{{ number_format($row['eir'],0) }}</td>
                <td class="right">{{ number_format($row['balance'],0) }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </body>
</html>
