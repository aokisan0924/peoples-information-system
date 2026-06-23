<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PMU Summary</title>
    <style>
        @page { margin: 1in; }
        body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; margin: 0; }
        
        .header-box { 
            border: 2px solid black; 
            padding: 10px; 
            text-align: center; 
            font-weight: bold; 
            margin-bottom: 30px; 
            line-height: 1.5;
        }
        
        .data-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 50px; 
        }
        .data-table th, .data-table td { 
            border: 1px solid black; 
            padding: 6px 8px; 
        }
        .data-table th { 
            font-weight: bold; 
            text-align: center; 
            text-transform: uppercase;
        }
        .data-table td.num { 
            text-align: right; 
        }
        .data-table td.center { 
            text-align: center; 
        }
        .font-bold { font-weight: bold; }
        
        .sig-table { 
            width: 100%; 
            margin-top: 60px; 
        }
        .sig-table td { 
            width: 50%; 
            vertical-align: top; 
        }
        .sig-name {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 2px;
        }
    </style>
</head>
<body>

    <!-- EXACT BORDERED HEADER -->
    <div class="header-box">
        SUMMARY - PMU COPY<br>
        PMPC<br>
        PENSION BILLING TO EFFECT {{ $billMonth }}
    </div>

    <!-- EXACT TABLE LAYOUT -->
    <table class="data-table">
        <thead>
            <tr>
                <th>TYPE OF LOAN</th>
                <th># OF BATCHES</th>
                <th>#OF VOUCHER</th>
                <th>MA</th>
                <th>GROSS AMT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($groupedTypes as $type => $data)
            <tr>
                <td>{{ $type }}</td>
                <td class="center">{{ $data['batches'] }}</td>
                <td class="center">{{ $data['vouchers'] }}</td>
                <td class="num">{{ number_format($data['ma'], 2) }}</td>
                <td class="num">{{ number_format($data['gross'], 2) }}</td>
            </tr>
            @endforeach
            
            <!-- FALLBACK EMPTY ROWS TO MATCH EXCEL APPEARANCE IF NEEDED -->
            @if(count($groupedTypes) < 4)
                @for($i = 0; $i < (4 - count($groupedTypes)); $i++)
                <tr>
                    <td>&nbsp;</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
                @endfor
            @endif

            <tr class="font-bold">
                <td>GRAND TOTAL</td>
                <td class="center">{{ $totalBatches }}</td>
                <td class="center">{{ $totalVouchers }}</td>
                <td class="num">{{ number_format($totalMA, 2) }}</td>
                <td class="num">{{ number_format($totalGross, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <!-- EXACT SIGNATORY LAYOUT -->
    <table class="sig-table">
        <tr>
            <td>
                <div class="font-bold" style="margin-bottom: 40px;">PREPARED BY:</div>
                <div style="text-align: left;">
                    <div class="sig-name">MICHAELA P. MAUANAY</div>
                    <div style="padding-left: 20px;">Accounting Clerk</div>
                </div>
            </td>
            <td>
                <div class="font-bold" style="margin-bottom: 40px;">NOTED BY:</div>
                <div style="text-align: center;">
                    <div class="sig-name">ALEXANDER L. FERIA CPA, MNSA</div>
                    <div>President</div>
                </div>
            </td>
        </tr>
    </table>

</body>
</html>