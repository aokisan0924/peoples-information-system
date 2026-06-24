<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Pensioner Authority</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .header-table { width: 100%; margin-bottom: 30px; border-bottom: 2px solid #047857; padding-bottom: 10px; }
        .coop-name { font-size: 11pt; font-weight: bold; color: #047857; text-transform: uppercase; margin-bottom: 2px; }
        .address-block { font-size: 7.5pt; color: #444; line-height: 1.2; }
        .address-line { display: block; }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('/images/logo/pis_logo.png'); 
        $logoData = file_exists($logoPath) ? 'data:image/' . pathinfo($logoPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($logoPath)) : '';
    @endphp

    <table class="header-table">
        <tr>
            <td width="70" style="vertical-align: middle;">
                @if($logoData) <img src="{{ $logoData }}" style="width: 65px; height: auto;"/> @endif
            </td>
            <td class="text-center">
                <div class="coop-name">PEOPLE'S MULTI-PURPOSE COOPERATIVE</div>
                <div class="address-block">
                    <span class="address-line"><strong>Main Office:</strong> stall#2, Principe Bldg., Upi, Gamu, Isabela (+63) 965-953-2196</span>
                    <span class="address-line"><strong>Cubao Satellite Office:</strong> 20-E Main Ave. cor. 15th Ave., Brgy. San Roque, Murphy, Cubao, Quezon City (02) 8848-9760, (+63) 953-033-1580</span>
                    <span class="address-line"><strong>Fort Magsaysay Satellite Office:</strong> Purok 3, Brgy. Militar, Fort Magsaysay, Palayan City, Nueva Ecija (+63) 968-263-5186</span>
                </div>
            </td>
            <td width="70"></td>
        </tr>
    </table>

    <h3 class="text-center font-bold">AUTHORIZATION FOR PENSION DEDUCTION</h3>
    
    <div style="text-align: right; margin-top: 20px;">
        <strong>{{ $date }}</strong>
    </div>
    
    <p style="margin-top: 20px;">To whom it may concern:</p>
    
    <p style="text-indent: 40px; text-align: justify;">
        I hereby authorize that the amount of <span class="font-bold" style="text-decoration:underline;">Php {{ number_format($loan->monthlyAmortization, 2) }}</span> be deducted from my monthly pension for a period of <span class="font-bold" style="text-decoration:underline;">{{ $loan->termYears * 12 }}</span> months with the total amount of <span class="font-bold" style="text-decoration:underline;">Php {{ number_format($loan->gross, 2) }}</span>. Furthermore, I hereby irrevocably assign/appoint the <strong>Chief, AFP Finance Center</strong> as my attorney in fact to ensure the implementation of such deduction until the full settlement of my loan obligation with People’s Multi – Purpose Cooperative (PMPC).
    </p>
    
    <table style="width: 100%; margin-top: 40px;">
        <tr>
            <td width="50%"></td>
            <td width="50%" class="text-center">
                <div class="font-bold uppercase" style="border-bottom: 1px solid black; margin-bottom: 2px;">{{ $member->firstName . ' ' . $member->lastName }}</div>
                <div style="font-size: 10pt;">(Signature Over Printed Name)<br>Borrower</div>
            </td>
        </tr>
    </table>

    <p style="margin-top: 40px;">To whom it may concern:</p>
    
    <p style="text-indent: 40px; text-align: justify;">
        I hereby undertake to deduct the amount indicated in the foregoing authorization and cause the remittance of same to People’s Multi – Purpose Cooperative (PMPC).
    </p>

    <table style="width: 100%; margin-top: 50px;">
        <tr>
            <td width="50%" style="vertical-align: bottom;">
                <div class="font-bold" style="margin-bottom: 15px;">VALIDATED</div>
                <div style="margin-bottom: 10px;">RMB: ___________________</div>
                <div>DATE: __________________</div>
            </td>
            <td width="50%" class="text-center" style="vertical-align: bottom;">
                <div class="font-bold uppercase" style="border-bottom: 1px solid black; margin-bottom: 2px;">LTC JESSILYN T. AYUYAO (AGS) PA</div>
                <div style="font-size: 10pt;">CO, RMU</div>
            </td>
        </tr>
    </table>
</body>
</html>