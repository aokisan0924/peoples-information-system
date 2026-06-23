<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>GHQ Declaration</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .header-table { width: 100%; margin-bottom: 30px; border-bottom: 2px solid #047857; padding-bottom: 10px; }
        .coop-name { font-size: 11pt; font-weight: bold; color: #047857; text-transform: uppercase; margin-bottom: 2px; }
        .address-block { font-size: 7.5pt; color: #444; line-height: 1.2; }
        .address-line { display: block; }
        .doc-title { text-align: center; font-weight: bold; margin: 25px 0; font-size: 13pt; text-decoration: underline; }
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

    <div class="doc-title">DATA PRIVACY CONSENT AND DECLARATIONS</div>

    <p style="text-indent: 40px; margin-top: 30px; text-align: justify;">
        I, <strong>{{ strtoupper($member->firstName . ' ' . $member->lastName) }}</strong> understands and hereby give consent to the Finance Center GHQ to collect, store, and disclose to <strong>PEOPLE’S MULTI-PURPOSE COOPERATIVE</strong> my personal data, such as my pay allowances, pension details, loan status, or any related financial transactions to facilitate the processing, monitoring, and validation of loan/other services which I availed from <strong>PEOPLE’S MULTI-PURPOSE COOPERATIVE</strong>.
    </p>

    <p style="text-indent: 40px; margin-top: 20px; text-align: justify;">
        Further, I understand that the disclosure of my personal data to the <strong>PEOPLE’S MULTI-PURPOSE COOPERATIVE</strong> is subject to strict confidentiality and will be retained as long as necessary for the specified purpose.
    </p>

    <p style="margin-top: 40px;">
        Done this <strong style="text-decoration:underline;">&nbsp;{{ now()->format('dS') }}&nbsp;</strong> day of <strong style="text-decoration:underline;">&nbsp;{{ now()->format('F') }}&nbsp;</strong> {{ now()->format('Y') }} at ____________________________.
    </p>

    <div style="margin-top: 80px; margin-left: 50%;">
        <p style="font-weight: bold; border-bottom: 1px solid black; text-align: center; margin-bottom: 2px;">{{ strtoupper($member->firstName . ' ' . $member->lastName) }}</p>
        <p style="text-align: center; margin-top: 0;">Printed Name and Signature</p>
    </div>
</body>
</html>