<!doctype html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Loan Application Form</title>
    <style>
        /* COMPACT MARGINS TO FIT 2 PAGES */
        @page { margin: 0.3in 0.4in; }
        
        body { 
            font-family: 'DejaVu Sans', sans-serif; 
            font-size: 9pt; 
            color: #000; 
            line-height: 1.1; 
        }
        
        /* UTILITIES */
        .w-full { width: 100%; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .text-xs { font-size: 7pt; }
        .text-sm { font-size: 8pt; }
        
        /* HEADER */
        .header-table { width: 100%; margin-bottom: 5px; border-bottom: 2px solid #047857; padding-bottom: 5px; }
        .logo-cell { width: 70px; vertical-align: middle; }
        .logo-img { width: 60px; height: auto; }
        
        .coop-name { 
            font-size: 11pt; 
            font-weight: bold; 
            color: #047857; 
            text-transform: uppercase; 
            margin-bottom: 2px;
        }
        
        /* ADDRESS BLOCK */
        .address-block { 
            font-size: 6.5pt; 
            color: #444; 
            line-height: 1.1;
        }
        .address-line { display: block; margin-bottom: 1px; }

        .form-title {
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid #000;
            background-color: #f3f4f6;
            padding: 3px;
            margin: 5px 0 10px 0;
        }

        /* SECTIONS */
        .section-header { 
            background-color: #047857; 
            color: white;
            font-weight: bold; 
            font-size: 8pt; 
            padding: 2px 5px; 
            text-transform: uppercase;
            margin-top: 10px;
            margin-bottom: 3px;
            border: 1px solid #047857;
        }
        
        /* DATA GRIDS */
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table td { vertical-align: top; padding: 2px; } 
        
        /* FIELDS */
        .field-label { 
            display: block; 
            font-size: 6.5pt; 
            color: #555; 
            text-transform: uppercase; 
            margin-bottom: 0;
        }
        .field-value { 
            display: block; 
            font-size: 9pt; 
            font-weight: bold; 
            border-bottom: 1px solid #999; 
            min-height: 14px; 
            padding-bottom: 0;
        }

        /* CHECKBOX TABLES */
        .cb-table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
        .cb-table td { border: 1px solid #000; padding: 3px; font-size: 8pt; vertical-align: top; }
        .cb-header { 
            text-align: center; font-weight: bold; background-color: #e5e7eb; 
            font-size: 7pt; text-transform: uppercase; padding: 2px;
            border-bottom: 1px solid #000;
        }
        .checkbox { font-family: 'DejaVu Sans', sans-serif; font-size: 10pt; margin-right: 2px; }

        /* LEGAL TEXT */
        .legal-box { 
            border: 1px solid #000; 
            padding: 5px 8px; 
            font-size: 8pt; 
            text-align: justify; 
            line-height: 1.2;
        }
        .indent { text-indent: 20px; margin-top: 3px; margin-bottom: 3px;}

        /* APPROVAL BOX */
        .approval-table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 5px; }
        .approval-table td { border: 1px solid #000; padding: 3px; vertical-align: top; }
        
        .page-break { page-break-after: always; }
        .hr-dashed { border-top: 1px dashed #000; margin: 15px 0; }
        
        .footer {
            position: fixed; 
            bottom: 0; 
            width: 100%; 
            border-top: 1px solid #ccc; 
            font-size: 6pt; 
            padding-top: 2px; 
            color: #777;
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
                @if($logoData) <img src="{{ $logoData }}" class="logo-img"/> @endif
            </td>
            <td class="text-center">
                <div class="coop-name">PEOPLE'S MULTI-PURPOSE COOPERATIVE</div>
                
                <div class="address-block">
                    <span class="address-line"><strong>Main Office:</strong> stall#2, Principe Bldg., Upi, Gamu, Isabela (+63) 965-953-2196</span>
                    <span class="address-line"><strong>Cubao Satellite Office:</strong> 20-E Main Ave. cor. 15th Ave., Brgy. San Roque, Murphy, Cubao, Quezon City (02) 8848-9760, (+63) 953-033-1580</span>
                    <span class="address-line"><strong>Fort Magsaysay Satellite Office:</strong> Purok 3, Brgy. Militar, Fort Magsaysay, Palayan City, Nueva Ecija (+63) 968-263-5186</span>
                </div>
            </td>
            <td class="logo-cell"></td>
        </tr>
    </table>

    <div class="form-title">LOAN APPLICATION FORM</div>

    <div class="text-right text-xs" style="margin-bottom: 5px;">
        <strong>Date:</strong> {{ $date }}
    </div>

    <table class="cb-table">
        <tr>
            <td width="25%">
                <div class="cb-header">APPLICATION TYPE</div>
                <div><span class="checkbox">@if($loanType == 'New') &#9745; @else &#9744; @endif</span> New</div>
                <div><span class="checkbox">@if($loanType == 'Renewal') &#9745; @else &#9744; @endif</span> Renewal</div>
                <div><span class="checkbox">@if($loanType == 'Additional') &#9745; @else &#9744; @endif</span> Additional</div>
                <div><span class="checkbox">@if($loanType == 'Restructure') &#9745; @else &#9744; @endif</span> Restructure</div>
            </td>
            <td width="25%">
                <div class="cb-header">CLASSIFICATION</div>
                <div><span class="checkbox">@if(str_contains($loanClass, 'Salary')) &#9745; @else &#9744; @endif</span> Salary Loan</div>
                <div><span class="checkbox">@if(str_contains($loanClass, 'Pension')) &#9745; @else &#9744; @endif</span> Pension Loan</div>
                <div><span class="checkbox">@if(str_contains($loanClass, 'Emergency')) &#9745; @else &#9744; @endif</span> Emergency</div>
                <div><span class="checkbox">@if(str_contains($loanClass, 'Health')) &#9745; @else &#9744; @endif</span> Health Asst.</div>
            </td>
            <td width="20%">
                <div class="cb-header">TERM</div>
                <div><span class="checkbox">@if($termMonths == 12) &#9745; @else &#9744; @endif</span> 12 Months</div>
                <div><span class="checkbox">@if($termMonths == 24) &#9745; @else &#9744; @endif</span> 24 Months</div>
                <div><span class="checkbox">@if($termMonths == 36) &#9745; @else &#9744; @endif</span> 36 Months</div>
                <div><span class="checkbox">@if(!in_array($termMonths, [12,24,36])) &#9745; @else &#9744; @endif</span> Other: {{ $termMonths }}</div>
            </td>
            <td width="30%">
                <div class="cb-header">AMOUNT</div>
                <div style="margin-top: 3px;">
                    <span class="field-label">Amount Applied</span>
                    <span class="field-value">&#8369;{{ number_format($loanAmount, 2) }}</span>
                </div>
                <div style="margin-top: 5px;">
                    <span class="field-label">Monthly Amortization</span>
                    <span class="field-value">&#8369;{{ number_format($monthlyAmortization, 2) }}</span>
                </div>
            </td>
        </tr>
    </table>

    <div class="section-header">BORROWER'S INFORMATION</div>
    <div style="border: 1px solid #000; padding: 5px;">
        <table class="data-table">
            <tr>
                <td width="30%">
                    <span class="field-label">Last Name</span>
                    <span class="field-value">{{ $member['lastName'] }}</span>
                </td>
                <td width="30%">
                    <span class="field-label">First Name</span>
                    <span class="field-value">{{ $member['firstName'] }}</span>
                </td>
                <td width="25%">
                    <span class="field-label">Middle Name</span>
                    <span class="field-value">{{ $member['middleName'] ?? '' }}</span>
                </td>
                <td width="15%">
                    <span class="field-label">Suffix</span>
                    <span class="field-value">{{ $member['suffix'] ?? '' }}</span>
                </td>
            </tr>
        </table>
        
        <table class="data-table" style="margin-top: 3px;">
            <tr>
                <td width="25%">
                    <span class="field-label">Rank/Position</span>
                    <span class="field-value">{{ $member['rank'] ?? 'N/A' }}</span>
                </td>
                <td width="25%">
                    <span class="field-label">Serial No.</span>
                    <span class="field-value">{{ $member['afpsn'] ?? 'N/A' }}</span>
                </td>
                <td width="25%">
                    <span class="field-label">Branch of Service</span>
                    <span class="field-value">{{ $member['branchService'] ?? 'N/A' }}</span>
                </td>
                <td width="25%">
                    <span class="field-label">Date of Birth (Age)</span>
                    <span class="field-value">{{ $member['dob'] ?? '' }} ({{ $member['age'] ?? '' }})</span>
                </td>
            </tr>
        </table>

        <table class="data-table" style="margin-top: 3px;">
            <tr>
                <td width="35%">
                    <span class="field-label">Unit Assignment</span>
                    <span class="field-value">{{ $member['unit'] ?? '' }}</span>
                </td>
                <td width="30%">
                    <span class="field-label">Contact Number</span>
                    <span class="field-value">{{ $member['contact'] ?? '' }}</span>
                </td>
                <td width="35%">
                    <span class="field-label">Email Address</span>
                    <span class="field-value">{{ $member['email'] ?? '' }}</span>
                </td>
            </tr>
        </table>

        <table class="data-table" style="margin-top: 3px;">
            <tr>
                <td width="100%">
                    <span class="field-label">Present Address</span>
                    <span class="field-value">{{ $member['fullAddress'] ?? '' }}</span>
                </td>
            </tr>
        </table>
    </div>

    <div class="section-header">NOTIFICATION CLAUSE</div>
    <div class="legal-box">
        <p style="margin: 0;">
            I hereby acknowledge and authorize the <strong>People's Multi-Purpose Cooperative (PMPC)</strong> for the following: 1) the regular submission and disclosure of my basic credit data (as defined under Republic Act Nr 9510 and its Implementing Rules and Regulations) to the Credit Information Corporation (CIC) as well as any updates or corrections thereof; and 2) the sharing of my basic data with other lenders authorized by the CIC, and credit reporting agencies duly accredited by the CIC.
        </p>
    </div>
    
    <table style="margin-top: 20px; width: 100%;">
        <tr>
            <td width="10%"></td>
            <td width="35%" class="text-center">
                <div class="field-value">{{ $member['firstName'] }} {{ $member['lastName'] }}</div>
                <div class="field-label">Signature of Borrower</div>
            </td>
            <td width="10%"></td>
            <td width="35%" class="text-center">
                <div class="field-value" style="border-bottom: 1px solid #000;">&nbsp;</div>
                <div class="field-label">Certifying Officer</div>
            </td>
            <td width="10%"></td>
        </tr>
    </table>

    <div class="section-header">LOAN PROCESSING & APPROVAL</div>
    <table class="approval-table">
        <tr style="background-color: #f3f4f6;">
            <td width="25%" class="text-center font-bold text-xs">LOAN AMOUNT</td>
            <td width="25%" class="text-center font-bold text-xs">MONTHLY AMORT</td>
            <td width="25%" class="text-center font-bold text-xs">TERM</td>
            <td width="25%" class="text-center font-bold text-xs">NET PROCEEDS</td>
        </tr>
        <tr>
            <td class="text-center text-sm font-bold">&#8369;{{ number_format($loanAmount, 2) }}</td>
            <td class="text-center text-sm font-bold">&#8369;{{ number_format($monthlyAmortization, 2) }}</td>
            <td class="text-center text-sm font-bold">{{ $termMonths }} Months</td>
            <td class="text-center text-sm font-bold">&#8369;{{ number_format($netProceeds ?? 0, 2) }}</td>
        </tr>
    </table>
    
    {{-- UPDATED SIGNATORIES WITH NAMES --}}
    <table class="approval-table" style="border-top: none;">
        <tr>
            <td width="50%" class="text-center">
                <div class="text-left text-xs text-gray-500" style="margin-bottom: 10px;">Processed By:</div>
                <div style="font-weight:bold; font-size: 9pt; text-transform: uppercase;">{{ $processedBy }}</div>
                <div style="border-bottom: 1px solid #000; width: 80%; margin: 0 auto;"></div>
                <div class="text-center text-xs">Loan Processor</div>
            </td>
            <td width="50%" class="text-center">
                <div class="text-left text-xs text-gray-500" style="margin-bottom: 10px;">Approved By:</div>
                <div style="font-weight:bold; font-size: 9pt; text-transform: uppercase;">Col. Alexander L. Feria (RET), CPA, MNSA</div>
                <div style="border-bottom: 1px solid #000; width: 80%; margin: 0 auto;"></div>
                <div class="text-center text-xs">Approving Officer</div>
            </td>
        </tr>
    </table>

    <div class="page-break"></div>

    <div class="text-center" style="margin-top: 10px;">
        <h2 style="font-size: 12pt; font-weight: bold; text-decoration: underline;">PROMISSORY NOTE</h2>
        <div class="text-right text-xs">PN No: <strong>{{ $lvNo }}</strong></div>
    </div>

    <div class="legal-box" style="margin-top: 10px; border: none; padding: 0;">
        <p class="indent">
            FOR VALUE RECEIVED, the undersigned promises to pay the <strong>People's Multi-Purpose Cooperative (PMPC)</strong> the sum of <strong>&#8369;{{ number_format($loanAmount, 2) }}</strong> in equal monthly installments of <strong>&#8369;{{ number_format($monthlyAmortization, 2) }}</strong>.
        </p>
        <p class="indent">
            I hereby waive presentment for payment and notice of dishonor. PMPC may accept partial payment reserving its right of recourse against me. PMPC is hereby authorized and empowered to set off or apply without notice what is due under this Note from whatever funds I have in the Cooperative.
        </p>
        <p class="indent">
            It is further agreed that in case of separation from the service of whatever cause, the unpaid balance with its accumulated surcharges and interest as stipulated above be deducted from my last payment, commutation of leave/furlough and/or from my pension.
        </p>
        <p class="indent">
            It is further agreed that when installments are not paid when due and payable, the whole of the principal sum remaining unpaid shall forthwith become due and payable at the election of the Cooperative. I promise and agree to pay for a reasonable attorney's fee if this note is not paid according to its legal tenor and effect when placed in a lawyer's hand for collection. In case litigation, venue shall be vested in the competent court as may be allowed by the Rules of Court at the sole option of PMPC.
        </p>
    </div>

    <table style="margin-top: 40px; width: 100%;">
        <tr>
            <td width="60%"></td>
            <td width="40%" class="text-center">
                <div class="field-value">{{ $member['firstName'] }} {{ $member['lastName'] }}</div>
                <div class="field-label">Signature over Printed Name</div>
            </td>
        </tr>
    </table>

    <div class="hr-dashed"></div>

    <div class="text-center">
        <h3 style="font-size: 12pt; font-weight: bold; text-decoration: underline;">AUTHORITY TO DEDUCT</h3>
    </div>

    <div class="legal-box" style="margin-top: 10px; border: none; padding: 0;">
        <p class="indent">
            In connection with my loan described above, I hereby authorize the Finance/Agent/Disbursing Officer of the AFP Finance Center, subdivision or instrumentality of the Government or any other office to which I may subsequently be detailed, assigned or appointed to deduct and/or withhold from my monthly payment of <strong>&#8369;{{ number_format($monthlyAmortization, 2) }}</strong> for a period of <strong>{{ $termMonths }} months</strong>.
        </p>
        <p class="indent">
            Likewise, I hereby authorize the above-mentioned official to deduct and/or withhold part of my pension, commutation, salary or any amount due me and my heirs for the payment of said loan together with the surcharges interest, if any, until the same have been paid in fully.
        </p>
    </div>

    {{-- UPDATED AUTHORITY TO DEDUCT SIGNATURE --}}
    <table style="margin-top: 40px; width: 100%;">
        <tr>
            <td width="10%"></td>
            <td width="35%" class="text-center">
                <div class="field-value">{{ $member['firstName'] }} {{ $member['lastName'] }}</div>
                <div class="field-label">Signature of Borrower</div>
            </td>
            <td width="10%"></td>
            <td width="35%" class="text-center">
                <div class="field-value" style="border-bottom: 1px solid #000;">&nbsp;</div>
                <div class="field-label">Finance/Disbursing Officer</div>
            </td>
            <td width="10%"></td>
        </tr>
    </table>

    <div class="footer">
        <table width="100%">
            <tr>
                <td>System Generated: {{ now()->format('F d, Y h:i A') }} | Ref: {{ $loanReference }}</td>
                <td class="text-right">Page <span class="page-number"></span></td>
            </tr>
        </table>
    </div>

</body>
</html>