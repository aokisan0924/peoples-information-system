<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transmittal Letter</title>
    <style>
        @page { margin: 0.5in 0.6in; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; margin: 0; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        
        .header-table { width: 100%; margin-bottom: 30px; border-bottom: 2px solid #047857; padding-bottom: 10px; }
        .coop-name { font-size: 12pt; font-weight: bold; color: #047857; text-transform: uppercase; margin-bottom: 2px; }
        .address-block { font-size: 8pt; color: #444; line-height: 1.2; }
        .address-line { display: block; }
        
        .indent-text { text-align: justify; text-indent: 40px; margin-top: 15px; margin-bottom: 15px; }
        
        /* NEW TABLE STYLES TO MATCH IMAGE */
        .stats-table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: center; }
        .stats-table th, .stats-table td { border: 1px solid black; padding: 6px; }
        .stats-table th { font-weight: normal; } /* Image shows regular weight headers */
        
        .totals-table { width: 100%; margin-top: 20px; margin-bottom: 20px; border-collapse: collapse; }
        .totals-table td { padding: 5px 0; }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('/images/logo/pis_logo.png'); 
        $logoData = file_exists($logoPath) ? 'data:image/' . pathinfo($logoPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($logoPath)) : '';
    @endphp

    <table class="header-table">
        <tr>
            <td width="75" style="vertical-align: middle;">
                @if($logoData) <img src="{{ $logoData }}" style="width: 70px; height: auto;"/> @endif
            </td>
            <td class="text-center">
                <div class="coop-name">PEOPLE'S MULTI-PURPOSE COOPERATIVE</div>
                <div class="address-block">
                    <span class="address-line"><strong>Main Office:</strong> stall#2, Principe Bldg., Upi, Gamu, Isabela (+63) 965-953-2196</span>
                    <span class="address-line"><strong>Cubao Satellite Office:</strong> 20-E Main Ave. cor. 15th Ave., Brgy. San Roque, Murphy, Cubao, Quezon City (02) 8848-9760, (+63) 953-033-1580</span>
                    <span class="address-line"><strong>Fort Magsaysay Satellite Office:</strong> Purok 3, Brgy. Militar, Fort Magsaysay, Palayan City, Nueva Ecija (+63) 968-263-5186</span>
                </div>
            </td>
            <td width="75"></td>
        </tr>
    </table>

    <p style="margin-top: 30px; margin-bottom: 30px;"><strong>{{ $date }}</strong></p>

    <p style="margin-bottom: 20px;">
        <strong>THE COMMANDING OFFICER</strong><br>
        Chief, AFP Finance Center<br>
        Camp Gen Emilio Aguinaldo, Quezon City
    </p>

    <p style="margin-bottom: 20px;">Dear Sir:</p>

    <p class="indent-text">
        Submitted herewith is the AFP Active Personnel Billing for the month of <strong>{{ $billMonth }}</strong> - NEW LOAN AND RELOAN corresponding supporting documents for deduction from the AFP Monthly Salary.
    </p>

    <!-- EXACT HORIZONTAL LAYOUT FROM YOUR IMAGE -->
    <table class="stats-table">
        <tr>
            <th style="width: 25%;">Number of<br>Voucher</th>
            <th style="width: 25%;">No. of Transmittal<br>Content</th>
            <th style="width: 25%;">No. of CD<br>Content</th>
            <th style="width: 25%;">Remarks</th>
        </tr>
        <tr>
            <td>{{ $loanCount }}</td>
            <td>{{ $loanCount }}</td>
            <td>{{ $loanCount }}</td>
            <td></td>
        </tr>
        <tr>
            <!-- Empty row to match the visual padding shown in the excel image -->
            <td style="padding: 10px;"></td>
            <td style="padding: 10px;"></td>
            <td style="padding: 10px;"></td>
            <td style="padding: 10px;"></td>
        </tr>
    </table>

    <table class="totals-table">
        <tr>
            <td style="width: 25%;" class="font-bold">Total Loans Granted:</td>
            <td style="width: 25%;" class="font-bold">Php {{ number_format($totalGross, 2) }}</td>
            <td style="width: 25%; text-align: center;" class="font-bold">Total M/A:</td>
            <td style="width: 25%; text-align: center;" class="font-bold">Php {{ number_format($totalMA, 2) }}</td>
        </tr>
    </table>

    <p class="indent-text">
        Please acknowledge receipt and inform PMPC of any changes in assignment and paying jurisdiction of borrowers/ status of loan application for military personnel.
    </p>

    <p style="margin-top: 20px;">Thank you & God bless.</p>

    <p style="margin-top: 40px;">Very truly yours,</p>

    <div style="margin-top: 50px;">
        <p class="font-bold" style="margin-bottom: 0;">ALEXANDER L. FERIA CPA, MNSA</p>
        <p style="margin-top: 0;">President</p>
    </div>
</body>
</html>