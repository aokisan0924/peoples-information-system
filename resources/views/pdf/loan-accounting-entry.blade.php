<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Accounting Entry - {{ $loanRef }}</title>
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
            font-size: 13pt; 
            font-weight: bold; 
            text-transform: uppercase; 
            letter-spacing: 2px;
            border-bottom: 2px solid #047857; 
            display: inline-block; 
            padding-bottom: 3px;
            margin-top: 15px;
            margin-bottom: 20px;
        }

        /* DETAILS GRID */
        .details-container { 
            width: 100%; 
            margin-bottom: 20px; 
            border: 1px solid #e5e7eb; 
            padding: 12px 15px; 
            border-radius: 4px; 
        }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table td { vertical-align: top; padding: 4px 0; }
        
        .label { 
            font-size: 8pt; 
            font-weight: bold; 
            color: #6b7280; 
            text-transform: uppercase; 
            width: 80px;
        }
        .value { 
            font-weight: bold; 
            color: #111827;
            border-bottom: 1px solid #e5e7eb; 
            padding-bottom: 2px; 
            display: block;
            margin-right: 20px;
            font-size: 9pt;
        }

        /* LEDGER TABLE */
        .ledger-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #111; }
        .ledger-table th { 
            background-color: #047857; 
            color: #ffffff; 
            font-size: 8pt; 
            font-weight: bold; 
            text-transform: uppercase; 
            padding: 8px 10px; 
            text-align: center; /* Centered Headers */
            border: 1px solid #111;
        }
        .ledger-table td { 
            padding: 8px 10px; 
            font-size: 9pt;
            border-right: 1px solid #111;
        }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }

        /* SIGNATURES */
        .signatures { margin-top: 50px; width: 100%; }
        .signatures td { width: 33.33%; text-align: center; vertical-align: bottom; }
        .sign-action {
            font-size: 8pt;
            color: #4b5563;
            text-align: left;
            margin-bottom: 45px; /* Creates space for the physical signature */
            font-style: italic;
        }
        .sign-line { 
            width: 80%; 
            margin: 0 auto; 
            border-bottom: 1px solid #111; 
            margin-bottom: 5px; 
            height: 40px; 
        }
        .sign-title { font-size: 8pt; font-weight: bold; color: #111; }
        .sign-sub { font-size: 7pt; color: #6b7280; }

        .footer {
            position: fixed; bottom: 0px; left: 0px; right: 0px;
            height: 20px; font-size: 7pt; color: #9ca3af;
            border-top: 1px solid #e5e7eb; padding-top: 5px;
        }
    </style>
</head>
<body>

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
                    <span class="address-line"><strong>Cubao Satellite Office:</strong> 20-E Main Ave. cor. 15th Ave., Brgy. San Roque, Murphy, Cubao, Quezon City (02) 8848-9760, (+63)953-033-1580</span>
                    <span class="address-line"><strong>Fort Magsaysay Satellite Office:</strong> Purok 3, Brgy. Militar, Fort Magsaysay, Palayan City, Nueva Ecija (+63) 968-263-5186</span>
                </div>
            </td>

            <td class="logo-cell"></td>
        </tr>
    </table>

    <div class="text-center">
        <div class="doc-title">ACCOUNTING ENTRY</div>
    </div>

    <div class="details-container">
        <table class="details-table">
            <tr>
                <td width="60%">
                    <table width="100%">
                        <tr>
                            <td class="label">Payee / Name</td>
                            <td><span class="value">{{ $borrowerName }}</span></td>
                        </tr>
                    </table>
                </td>
                
                <td width="40%">
                    <table width="100%">
                        <tr>
                            <td class="label">Date</td>
                            <td><span class="value text-right">{{ $date }}</span></td>
                        </tr>
                        <tr>
                            <td class="label">Ref No.</td>
                            <td><span class="value text-right">{{ $loanRef }}</span></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    <table class="ledger-table">
        <thead>
            <tr>
                <th width="20%">Account Code</th>
                <th width="40%">Account Title</th>
                <th width="20%">Debit</th>
                <th width="20%">Credit</th>
            </tr>
        </thead>
        <tbody>
            @if(count($entries) > 0)
                @foreach($entries as $entry)
                <tr>
                    <td class="text-center" style="font-family: monospace;">{{ $entry->accountCode }}</td>
                    
                    {{-- Dynamically Indent Credits by 25px --}}
                    <td @if($entry->credit > 0) style="padding-left: 25px;" @endif>
                        {{ $entry->accountName }}
                    </td>

                    <td class="text-right font-bold">{{ $entry->debit > 0 ? number_format($entry->debit, 2) : '' }}</td>
                    <td class="text-right font-bold">{{ $entry->credit > 0 ? number_format($entry->credit, 2) : '' }}</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="4" class="text-center" style="padding: 20px;">No accounting entries found for this transaction.</td>
                </tr>
            @endif
        </tbody>
        <tfoot>
            <tr>
                {{-- Particulars moved here instead of Totals --}}
                <td colspan="4" style="padding: 15px 15px; font-size: 9pt; border-top: 1px solid #111;">
                    <div style="margin-bottom: 5px;"><b>PARTICULARS:</b> {{ $particulars }}</div>
                </td>
            </tr>
        </tfoot>
    </table>

    <table class="signatures">
        <tr>
            <td>
                <div class="sign-action">Prepared By:</div>
                <div class="sign-line"></div>
                <div class="sign-title">DENISE JOY F. ANTOLIN</div>
                <div class="sign-sub">Loan Processor</div>
            </td>
            <td>
                <div class="sign-action">Verified/Indexed By:</div>
                <div class="sign-line"></div>
                <div class="sign-title">MICHAELA P. MAUANAY</div>
                <div class="sign-sub">Accounting Clerk</div>
            </td>
            <td>
                <div class="sign-action">Approved By:</div>
                <div class="sign-line"></div>
                <div class="sign-title">COL. ALEXANDER L. FERIA (RET)</div>
                <div class="sign-sub">President</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        <table width="100%">
            <tr>
                <td>System Generated Document | Printed: {{ now()->format('F d, Y h:i A') }}</td>
                <td class="text-right">Page 1 of 1</td>
            </tr>
        </table>
    </div>

</body>
</html>