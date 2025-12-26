<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $title }} - {{ $lvNo }}</title>
    <style>
        /* COMPACT PAGE SETTINGS */
        @page { margin: 0.25in; }
        
        body { 
            font-family: 'DejaVu Sans', sans-serif; 
            font-size: 10pt; 
            color: #000;
            line-height: 1.2;
        }

        /* HEADER TABLE */
        .header-table { width: 100%; margin-bottom: 15px; border-bottom: 2px solid #047857; padding-bottom: 10px; }
        .logo-cell { width: 90px; text-align: left; vertical-align: middle; }
        .text-cell { text-align: center; vertical-align: middle; }
        .logo-img { width: 80px; height: auto; }

        .coop-name { 
            font-size: 12pt; 
            font-weight: bold; 
            text-transform: uppercase;
            color: #047857; 
            margin-bottom: 4px;
        }
        
        /* ADDRESS BLOCK */
        .address-block { 
            font-size: 8pt; 
            color: #4b5563; 
            margin-bottom: 5px;
        }
        .address-line { display: block; margin-bottom: 2px; }

        .doc-title { 
            font-size: 14pt; 
            font-weight: bold; 
            text-transform: uppercase; 
            text-decoration: underline;
            margin-top: 25px;
            margin-bottom: 15px;
        }

        /* UTILS */
        .w-100 { width: 100%; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .border-bottom { border-bottom: 1px solid #000; }
        
        /* SPACING */
        .mb-5 { margin-bottom: 5px; }
        .mb-10 { margin-bottom: 10px; }
        .mt-10 { margin-top: 10px; }
        .mt-20 { margin-top: 20px; }
        
        /* DATA TABLES */
        table.data-table { border-collapse: collapse; width: 100%; }
        table.data-table td { vertical-align: bottom; padding: 3px 2px; }

        /* ALIGNMENT CLASS: Ensures both tables line up perfectly */
        .amount-col { width: 140px; text-align: right; }
        
        /* SIGNATORIES */
        .signatory-box { margin-top: 30px; }
        .sig-name { 
            font-weight: bold; 
            text-transform: uppercase; 
            border-bottom: 1px solid #000; 
            display: inline-block; 
            min-width: 190px; 
            text-align: center;
            margin-top: 35px; 
        }
        .sig-title { font-size: 8pt; margin-top: 4px; text-align: center; }
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
        <div class="doc-title">{{ $title }}</div>
    </div>

    <table class="data-table mb-10">
        <tr>
            <td width="18%" class="font-bold">Name of Borrower:</td>
            <td width="42%" class="border-bottom font-bold">{{ $borrowerName }}</td>
            <td width="10%" class="text-right font-bold">Date:</td>
            <td width="30%" class="border-bottom text-center">{{ $date }}</td>
        </tr>
        <tr>
            <td class="font-bold">Serial No.:</td>
            <td class="border-bottom">{{ $serialNo }}</td>
            <td class="text-right font-bold">LV No.:</td>
            <td class="border-bottom text-center font-bold">{{ $lvNo }}</td>
        </tr>
        <tr>
            <td class="font-bold">Address:</td>
            <td colspan="3" class="border-bottom">{{ $address }}</td>
        </tr>
    </table>

    <table class="data-table mb-10">
        <tr>
            <td colspan="2" class="font-bold" style="padding-bottom: 8px; font-size: 11pt;">PAYMENT</td>
        </tr>
        
        <tr>
            <td>Principal Amount</td>
            <td class="amount-col font-bold">₱{{ number_format($principalAmount, 2) }}</td>
        </tr>

        @if($balanceOldLoans > 0)
        <tr>
            <td>(-) Balance Old Loan(s)</td>
            <td class="amount-col border-bottom">{{ number_format($balanceOldLoans, 2) }}</td>
        </tr>
        @endif

        @if($membershipFee > 0)
        <tr>
            <td>(-) Membership Fee:</td>
            <td class="amount-col border-bottom">{{ number_format($membershipFee, 2) }}</td>
        </tr>
        @endif

        @if($paidUpCapital > 0)
        <tr>
            <td>(-) Paid up Capital:</td>
            <td class="amount-col border-bottom">{{ number_format($paidUpCapital, 2) }}</td>
        </tr>
        @endif

        @if($serviceFee > 0)
        <tr>
            <td>(-) Service Fee</td>
            <td class="amount-col border-bottom">{{ number_format($serviceFee, 2) }}</td>
        </tr>
        @endif

        @if($insurancePremium > 0)
        <tr>
            <td>(-) Insurance Premium</td>
            <td class="amount-col border-bottom">{{ number_format($insurancePremium, 2) }}</td>
        </tr>
        @endif

        @if($advanceInterest > 0)
        <tr>
            <td>(-) Advance Interest</td>
            <td class="amount-col border-bottom">{{ number_format($advanceInterest, 2) }}</td>
        </tr>
        @endif

        <tr>
            <td class="font-bold" style="padding-top: 8px;">NET PROCEEDS (Php):</td>
            <td class="amount-col font-bold" style="padding-top: 8px; border-bottom: 3px double #000;">
                ₱{{ number_format($netProceeds, 2) }}
            </td>
        </tr>
    </table>

    <table class="data-table mt-20 mb-10">
        <tr>
            <td>Term of loan in months:</td>
            <td class="amount-col border-bottom font-bold">{{ $termMonths }} months</td>
        </tr>
        <tr>
            <td>Monthly Amortization:</td>
            <td class="amount-col border-bottom font-bold">₱{{ number_format($monthlyAmort, 2) }}</td>
        </tr>
        <tr>
            <td>First Payment Due On:</td>
            <td class="amount-col border-bottom">{{ $firstPayment }}</td>
        </tr>
        <tr>
            <td>Maturity:</td>
            <td class="amount-col border-bottom">{{ $maturity }}</td>
        </tr>
        <tr>
            <td>EIR (%):</td>
            <td class="amount-col border-bottom">{{ number_format($eirPercent, 2) }}%</td>
        </tr>
        <tr>
            <td>Interest Rate per Month (%):</td>
            <td class="amount-col border-bottom">{{ number_format($interestPerMonth, 4) }}%</td>
        </tr>
    </table>

    <div class="signatory-box">
        <table style="width: 100%;">
            <tr>
                <td width="50%" class="text-center">
                    <div style="text-align: left; margin-bottom: 10px; font-size: 9pt;">Certified & Corrected by:</div>
                    <span class="sig-name">{{ $signatories['processedBy'] }}</span>
                    <div class="sig-title">Loan Processor</div>
                </td>
                <td width="50%" class="text-center">
                    <div style="text-align: left; margin-bottom: 10px; font-size: 9pt;">Verified by:</div>
                    <span class="sig-name">{{ $signatories['verifiedBy'] }}</span>
                    <div class="sig-title">Verifier / PELVAMS Liaison</div>
                </td>
            </tr>
            <tr>
                <td class="text-center" style="padding-top: 20px;">
                    <div style="text-align: left; margin-bottom: 10px; font-size: 9pt;">Received By:</div>
                    <span class="sig-name">{{ $borrowerName }}</span>
                    <div class="sig-title">Signature Over Printed Name/Date</div>
                </td>
                <td class="text-center" style="padding-top: 20px;">
                    <div style="text-align: left; margin-bottom: 10px; font-size: 9pt;">Approved By:</div>
                    <span class="sig-name">{{ $signatories['approvedBy'] }}</span>
                    <div class="sig-title">President</div>
                </td>
            </tr>
        </table>
    </div>

</body>
</html>