<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Loan Ledger - {{ $loanRef }}</title>
    <style>
        /* BASE STYLES */
        @page { margin: 0.5in; }
        body { 
            font-family: 'DejaVu Sans', sans-serif; 
            font-size: 9pt; 
            color: #1f2937;
            line-height: 1.3;
        }

        /* HEADER TABLE LAYOUT */
        .header-table { width: 100%; margin-bottom: 10px; border-bottom: 2px solid #047857; padding-bottom: 10px; }
        .logo-cell { width: 90px; text-align: left; vertical-align: middle; }
        .text-cell { text-align: center; vertical-align: middle; }
        .logo-img { width: 80px; height: auto; }

        .coop-name { 
            font-size: 13pt; 
            font-weight: bold; 
            color: #047857; /* Emerald Green */
            text-transform: uppercase; 
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        .address-block { 
            font-size: 7pt; 
            color: #4b5563; 
            margin-bottom: 5px;
        }
        .address-line { display: block; margin-bottom: 2px; }
        
        .doc-title { 
            font-size: 11pt; 
            font-weight: bold; 
            text-transform: uppercase; 
            border-bottom: 2px solid #047857; 
            display: inline-block; 
            padding-bottom: 3px;
            margin-top: 15px;
            margin-bottom: 15px;
        }

        /* DETAILS GRID */
        .details-container { 
            width: 100%; 
            margin-bottom: 20px; 
            border: 1px solid #e5e7eb; 
            padding: 10px 15px; 
            border-radius: 4px; 
        }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table td { vertical-align: top; padding: 3px 0; }
        
        .label { 
            font-size: 8pt; 
            font-weight: bold; 
            color: #6b7280; 
            text-transform: uppercase; 
            width: 90px;
        }
        .value { 
            font-weight: bold; 
            color: #111827;
            border-bottom: 1px dotted #d1d5db; 
            padding-bottom: 1px; 
            display: block;
            margin-right: 20px;
            font-size: 9pt;
        }

        /* LEDGER TABLE */
        .ledger-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        .ledger-table th { 
            background-color: #047857; 
            color: #ffffff; 
            font-size: 8pt; 
            font-weight: bold; 
            text-transform: uppercase; 
            padding: 6px; 
            text-align: left;
        }
        .ledger-table td { 
            padding: 5px 6px; 
            border-bottom: 1px solid #f3f4f6; 
            font-size: 9pt;
        }
        .ledger-table tr:nth-child(even) { background-color: #f9fafb; }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-gray { color: #9ca3af; }
        
        .footer {
            position: fixed; bottom: 0px; left: 0px; right: 0px;
            height: 20px; font-size: 7pt; color: #9ca3af;
            border-top: 1px solid #e5e7eb; padding-top: 5px;
        }
    </style>
</head>
<body>

    {{-- PHP: Encode Image to Base64 for Reliable PDF Rendering --}}
    @php
        $logoPath = public_path('/images/logo/pis_logo.png'); 
        $logoData = '';
        if (file_exists($logoPath)) {
            $type = pathinfo($logoPath, PATHINFO_EXTENSION);
            $data = file_get_contents($logoPath);
            $logoData = 'data:image/' . $type . ';base64,' . base64_encode($data);
        }
    @endphp

    <table class="header-table">
        <tr>
            <td class="logo-cell">
                @if($logoData)
                    <img src="{{ $logoData }}" class="logo-img" alt="Logo"/>
                @endif
            </td>
            
            <td class="text-cell">
                <div class="coop-name">PEOPLE'S MULTI-PURPOSE COOPERATIVE</div>
                <div class="address-block">
                    <span class="address-line"><strong>Main Office:</strong> stall#2, Principe Bldg., Upi, Gamu, Isabela (+63) 965-953-2196</span>
                    <span class="address-line"><strong>Cubao Satellite Office:</strong> 20-E Main Ave. cor. 15th Ave., Brgy. San Roque, Murphy, Cubao, Quezon City (02) 8848-9760, (+63) 953-033-1580/span>
                    <span class="address-line"><strong>Fort Magsaysay Satellite Office:</strong> Purok 3, Brgy. Militar, Fort Magsaysay, Palayan City, Nueva Ecija (+63) 968-263-5186</span>
                </div>
            </td>

            <td class="logo-cell"></td>
        </tr>
    </table>

    <div class="text-center">
        <div class="doc-title">Loan Ledger Card</div>
    </div>

    <div class="details-container">
        <table class="details-table">
            <tr>
                <td width="55%">
                    <table width="100%">
                        <tr>
                            <td class="label">Borrower</td>
                            <td><span class="value">{{ $borrowerName }}</span></td>
                        </tr>
                        <tr>
                            <td class="label">Address</td>
                            <td><span class="value">{{ $address }}</span></td>
                        </tr>
                        <tr>
                            <td class="label">Ref No.</td>
                            <td><span class="value">{{ $loanRef }}</span></td>
                        </tr>
                        <tr>
                            <td class="label">Voucher No.</td>
                            <td><span class="value">{{ $lvNo }}</span></td>
                        </tr>
                    </table>
                </td>
                
                <td width="45%">
                    <table width="100%">
                        <tr>
                            <td class="label">Principal</td>
                            <td><span class="value text-right">₱{{ number_format($loanAmount, 2) }}</span></td>
                        </tr>
                        <tr>
                            <td class="label">Date Granted</td>
                            <td><span class="value text-right">{{ $dateOfLoan }}</span></td>
                        </tr>
                        <tr>
                            <td class="label">Maturity</td>
                            <td><span class="value text-right">{{ $maturityDate }}</span></td>
                        </tr>
                        <tr>
                            <td class="label">Term</td>
                            <td><span class="value text-right">{{ $termMonths }} Months</span></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    <table class="ledger-table">
        <thead>
            <tr>
                <th class="text-center" width="5%">No.</th>
                <th width="20%">Due Date</th>
                <th class="text-right" width="20%">Installment</th>
                <th class="text-right" width="15%">Principal</th>
                <th class="text-right" width="15%">Interest</th>
                <th class="text-right" width="25%">Outstanding Bal.</th>
            </tr>
        </thead>
        <tbody>
            {{-- ROW 0: BEGINNING BALANCE --}}
            <tr>
                <td class="text-center">-</td>
                <td>{{ $dateOfLoan }}</td>
                <td class="text-right text-gray">-</td>
                <td class="text-right text-gray">-</td>
                <td class="text-right text-gray">-</td>
                <td class="text-right font-bold">₱{{ number_format($loanAmount, 2) }}</td>
            </tr>

            @foreach($schedule as $row)
            <tr>
                <td class="text-center">{{ $row['period'] }}</td>
                <td>{{ $row['dateLabel'] }}</td>
                <td class="text-right">₱{{ number_format($row['installment'], 2) }}</td>
                <td class="text-right">{{ number_format($row['principal'], 2) }}</td>
                <td class="text-right">{{ number_format($row['eir'], 2) }}</td>
                <td class="text-right font-bold">
                    {{ $row['balance'] <= 0 ? '-' : number_format($row['balance'], 2) }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <table width="100%">
            <tr>
                <td>Printed by System | {{ now()->format('F d, Y h:i A') }}</td>
                <td class="text-right">Page 1 of 1</td>
            </tr>
        </table>
    </div>

</body>
</html>