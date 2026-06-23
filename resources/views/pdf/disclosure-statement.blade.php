<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Disclosure Statement</title>
    <style>
        /* Force smaller margins on the PDF document itself to ensure 1-page fit */
        @page { margin: 0.4in 0.5in; }
        
        /* Reduced base font size and tightened line height */
        body { font-family: Arial, sans-serif; font-size: 8.5pt; line-height: 1.15; margin: 0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        
        .header-table { width: 100%; margin-bottom: 10px; border-bottom: 2px solid #047857; padding-bottom: 5px; }
        .coop-name { font-size: 10pt; font-weight: bold; color: #047857; text-transform: uppercase; margin-bottom: 2px; }
        .address-block { font-size: 7pt; color: #444; line-height: 1.1; }
        .address-line { display: block; }
        
        .doc-title { text-align: center; font-weight: bold; margin: 10px 0 2px 0; font-size: 11pt; }
        .doc-sub { text-align: center; font-size: 8pt; margin-bottom: 12px; }
        
        .grid-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .grid-table td { padding: 2px; vertical-align: top; }
        
        .box-section { margin-top: 8px; border-top: 1px solid black; padding-top: 6px; }
        .line-val { border-bottom: 1px solid black; display: inline-block; min-width: 180px; font-weight: bold; margin-bottom: 2px; }
        .indent-text { text-align: justify; font-size: 8.5pt; text-indent: 40px; margin-top: 8px; }
        
        .sig-block { margin-top: 15px; }
        .sig-label { font-size: 7.5pt; }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('/images/logo/pis_logo.png'); 
        $logoData = file_exists($logoPath) ? 'data:image/' . pathinfo($logoPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($logoPath)) : '';
    @endphp

    <table class="header-table">
        <tr>
            <td width="60" style="vertical-align: middle;">
                @if($logoData) <img src="{{ $logoData }}" style="width: 55px; height: auto;"/> @endif
            </td>
            <td class="text-center">
                <div class="coop-name">PEOPLE'S MULTI-PURPOSE COOPERATIVE</div>
                <div class="address-block">
                    <span class="address-line"><strong>Main Office:</strong> stall#2, Principe Bldg., Upi, Gamu, Isabela (+63) 965-953-2196</span>
                    <span class="address-line"><strong>Cubao Satellite Office:</strong> 20-E Main Ave. cor. 15th Ave., Brgy. San Roque, Murphy, Cubao, Quezon City (02) 8848-9760, (+63) 953-033-1580</span>
                    <span class="address-line"><strong>Fort Magsaysay Satellite Office:</strong> Purok 3, Brgy. Militar, Fort Magsaysay, Palayan City, Nueva Ecija (+63) 968-263-5186</span>
                </div>
            </td>
            <td width="60"></td>
        </tr>
    </table>

    <div class="doc-title">DISCLOSURE STATEMENT ON LOAN/CREDIT TRANSACTION</div>
    <div class="doc-sub">As Required Under R.A. 3765, Truth in Lending Act</div>

    <table class="grid-table">
        <tr>
            <td width="15%">Rank:</td><td width="35%" class="font-bold">{{ $member->afpInfo->rank ?? 'N/A' }}</td>
            <td width="20%">Name of Borrower:</td><td width="30%" class="font-bold uppercase">{{ $member->firstName }} {{ $member->lastName }}</td>
        </tr>
        <tr>
            <td>Contact No.:</td><td class="font-bold">{{ $member->contact ?? 'N/A' }}</td>
            <td>Address:</td><td class="font-bold uppercase">{{ $member->fullAddress ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td>PN #:</td><td class="font-bold">{{ $loan->lrvNumber ?? 'N/A' }}</td>
            <td>Loan Code:</td><td class="font-bold">{{ $loan->deductionCode ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td>Principal Amount:</td><td class="font-bold">Php {{ number_format($loan->loanAmount, 2) }}</td>
            <td>Loan Balance:</td><td class="font-bold">Php 0.00</td>
        </tr>
        <tr>
            <td>Term:</td><td class="font-bold">{{ $termMonths ?? ($loan->termYears * 12) }} Months</td>
            <td>Monthly Amortization:</td><td class="font-bold">Php {{ number_format($loan->monthlyAmortization, 2) }}</td>
        </tr>
        <tr>
            <td>Interest Rate:</td><td class="font-bold">{{ number_format($loan->monthlyInterestRate * 100, 2) }}%</td>
            <td>EIR (Per AFPFIAB):</td><td class="font-bold">{{ number_format($loan->effectiveInterestRate * 100, 2) }}%</td>
        </tr>
        <tr>
            <td>Start of Payment:</td><td class="font-bold">{{ $startPayment ?? '-' }}</td>
            <td>End of Payment:</td><td class="font-bold">{{ $endPayment ?? '-' }}</td>
        </tr>
        <tr>
            <td>Amount Received:</td><td class="font-bold">Php {{ number_format($loan->netProceeds, 2) }}</td>
            <td></td><td></td>
        </tr>
    </table>

    <table class="grid-table box-section">
        <tr>
            <td width="50%" class="font-bold">FINANCE CHARGES</td>
            <td width="50%" class="font-bold">NON-FINANCE CHARGES</td>
        </tr>
        <tr>
            <td>
                <table width="100%">
                    <tr><td width="60%">Interest:</td><td width="40%" class="text-right">Php {{ number_format($loan->gross - $loan->loanAmount, 2) }}</td></tr>
                    <tr><td>Service Fee:</td><td class="text-right">Php {{ number_format($loan->serviceFee, 2) }}</td></tr>
                    <tr><td>Doc Fee:</td><td class="text-right">Php 0.00</td></tr>
                    <tr><td>Doc Stamp:</td><td class="text-right">Php 0.00</td></tr>
                    <tr><td>Insp Fee:</td><td class="text-right">Php 0.00</td></tr>
                    <tr><td class="font-bold">Total Finance:</td><td class="text-right font-bold" style="text-decoration: underline;">Php {{ number_format(($loan->gross - $loan->loanAmount) + $loan->serviceFee, 2) }}</td></tr>
                </table>
            </td>
            <td>
                <table width="100%">
                    <tr><td width="60%">Advance Interest:</td><td width="40%" class="text-right">Php {{ number_format($loan->advanceInterest, 2) }}</td></tr>
                    <tr><td>Insurance:</td><td class="text-right">Php {{ number_format($loan->insurance, 2) }}</td></tr>
                    <tr><td>Savings Deposit:</td><td class="text-right">Php 0.00</td></tr>
                    <tr><td>Retention Deposit:</td><td class="text-right">Php 0.00</td></tr>
                    <tr><td>&nbsp;</td><td></td></tr>
                    <tr><td class="font-bold">Total Non-Finance:</td><td class="text-right font-bold" style="text-decoration: underline;">Php {{ number_format($loan->advanceInterest + $loan->insurance, 2) }}</td></tr>
                </table>
            </td>
        </tr>
    </table>

    <table style="width: 100%;" class="sig-block">
        <tr>
            <td width="50%">
                <div style="margin-bottom: 12px;">Prepared by:</div>
                <div class="text-center">
                    <div class="line-val uppercase">{{ $processedBy ?? 'Denise Joy F. Antolin' }}</div>
                    <div class="sig-label">Loan Processor/Cashier</div>
                </div>
            </td>
            <td width="50%">
                <div style="margin-bottom: 12px;">Certified Correct:</div>
                <div class="text-center">
                    <div class="line-val">Alexander A. Feria Jr</div>
                    <div class="sig-label">Verifier/PELVAMS Liaison</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="box-section indent-text">
        I ACKNOWLEDGE RECEIPT OF A COPY OF THIS STATEMENT BEFORE THE CONSUMMATION OF THE CREDIT TRANSACTION AND THAT I UNDERSTAND AND FULLY AGREE TO THE TERMS AND CONDITIONS THEREOF.
    </div>

    <table style="width: 100%;" class="sig-block">
        <tr>
            <td width="60%" class="text-center">
                <div class="line-val uppercase">{{ $member->firstName }} {{ $member->lastName }}</div>
                <div class="sig-label">Signature of Borrower over Printed Name</div>
            </td>
            <td width="40%" class="text-center">
                <div class="line-val">{{ $date }}</div>
                <div class="sig-label">Date</div>
            </td>
        </tr>
    </table>

    <div class="text-center font-bold" style="margin-top: 15px; margin-bottom: 5px;">CONFORME</div>
    <div class="indent-text" style="margin-top: 5px;">
        By signing below, I am agreeing to the People's Multi-Purpose Cooperative Privacy Notice and giving my consent to the collection and processing of my personal data in accordance with the law.
    </div>

    <div class="text-center sig-block" style="margin-top: 20px;">
        <div class="line-val uppercase">{{ $member->firstName }} {{ $member->lastName }}</div>
        <div class="sig-label">Name of Borrower</div>
    </div>
</body>
</html>