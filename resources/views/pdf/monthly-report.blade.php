<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>President's Report</title>
    <style>
        @page { margin: 0.5in; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 9pt; color: #111; line-height: 1.3; }
        
        .header-table { width: 100%; border-bottom: 2px solid #047857; padding-bottom: 10px; margin-bottom: 20px; }
        .logo-cell { width: 80px; vertical-align: middle; }
        .text-cell { text-align: center; vertical-align: middle; }
        .logo-img { width: 70px; height: auto; }
        .coop-name { font-size: 12pt; font-weight: bold; color: #047857; text-transform: uppercase; }
        
        /* NEW ADDRESS BLOCK STYLES */
        .address-block { font-size: 7pt; color: #444; line-height: 1.2; margin-top: 5px; }
        .address-line { display: block; margin-bottom: 1px; }

        /* MEMO HEADER STYLES */
        .memo-container { margin-bottom: 20px; }
        .memo-title { font-size: 14pt; font-weight: bold; color: #047857; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
        .memo-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        .memo-table td { padding: 4px 0; vertical-align: top; }
        .memo-label { font-weight: bold; width: 60px; }
        
        /* DATA TABLE */
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 6px; text-align: right; }
        .data-table th { background-color: #047857; color: white; text-align: center; font-size: 8pt; text-transform: uppercase; }
        .data-table td.label { text-align: left; font-weight: bold; background-color: #f9fafb; width: 25%; }
        
        .ai-section h3 { border-bottom: 1px solid #eee; padding-bottom: 5px; color: #047857; font-size: 11pt; margin-top: 15px; }
        .ai-section p { text-align: justify; margin-bottom: 10px; }

        /* SIGNATURE BLOCK */
        .signature-block { margin-top: 40px; page-break-inside: avoid; }
        .sig-name { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; display: inline-block; min-width: 250px; margin-top: 50px; }
        .sig-title { font-size: 9pt; margin-top: 5px; color: #333; }

        /* LOGS */
        .page-break { page-break-before: always; }
        .log-header { background-color: #eee; padding: 5px; font-weight: bold; margin-top: 15px; border-bottom: 1px solid #ccc; }
        .log-table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 10px; }
        .log-table th { text-align: left; border-bottom: 1px solid #aaa; padding: 4px; }
        .log-table td { border-bottom: 1px solid #eee; padding: 4px; }
        .empty-log { font-style: italic; color: #888; padding: 5px; font-size: 8pt; }
        .branch-section { margin-bottom: 30px; }
        .branch-title { font-size: 12pt; font-weight: bold; color: #047857; border-bottom: 2px solid #047857; padding-bottom: 5px; margin-bottom: 10px; margin-top: 20px;}
    </style>
</head>
<body>

    @php
        $logoPath = public_path('images/logo/pis_logo.png');
        $logoData = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';
    @endphp

    <table class="header-table">
        <tr>
            <td class="logo-cell">@if($logoData) <img src="{{ $logoData }}" class="logo-img"/> @endif</td>
            <td class="text-cell">
                <div class="coop-name">PEOPLE'S MULTI-PURPOSE COOPERATIVE</div>
                
                {{-- UPDATED ADDRESS BLOCK --}}
                <div class="address-block">
                    <span class="address-line"><strong>Main Office:</strong> stall#2, Principe Bldg., Upi, Gamu, Isabela (+63) 965-953-2196</span>
                    <span class="address-line"><strong>Cubao Satellite Office:</strong> 20-E Main Ave. cor. 15th Ave., Brgy. San Roque, Murphy, Cubao, Quezon City (02) 8848-9760, (+63) 953-033-1580</span>
                    <span class="address-line"><strong>Fort Magsaysay Satellite Office:</strong> Purok 3, Brgy. Militar, Fort Magsaysay, Palayan City, Nueva Ecija (+63) 968-263-5186</span>
                </div>
            </td>
            <td class="logo-cell"></td>
        </tr>
    </table>

    {{-- HARDCODED MEMO HEADER --}}
    <div class="memo-container">
        <div class="memo-title">President's Report - {{ $monthName }}</div>
        <table class="memo-table">
            <tr>
                <td class="memo-label">To:</td>
                <td>PMPC Board of Directors</td>
            </tr>
            <tr>
                <td class="memo-label">From:</td>
                <td>COL. ALEXANDER L. FERIA (RET), CPA, MNSA</td>
            </tr>
            <tr>
                <td class="memo-label">Date:</td>
                <td>{{ $date }}</td>
            </tr>
            <tr>
                <td class="memo-label">Subject:</td>
                <td>President's Report - {{ $monthName }}</td>
            </tr>
        </table>
    </div>

    {{-- AI CONTENT SECTION (Start with Executive Summary) --}}
    <div class="ai-section">
        {!! $aiContent !!}
        
        <div class="signature-block">
            <p>Respectfully prepared by:</p>
            <div class="sig-name">Col. Alexander L. Feria (RET), CPA, MNSA</div>
            <div class="sig-title">President</div>
        </div>
    </div>

    <div class="page-break"></div>

    <div class="report-title" style="margin-top: 20px;">Detailed Statistical Data</div>
    
    {{-- STATS TABLE --}}
    <table class="data-table">
        <thead>
            <tr>
                <th>Metric</th>
                <th>Cubao (Main)</th>
                <th>Fort Magsaysay</th>
                <th>Isabela</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="label">Loans Released (Qty)</td>
                <td>{{ $stats['Cubao']['loans_released_count'] }}</td>
                <td>{{ $stats['Fort Magsaysay']['loans_released_count'] }}</td>
                <td>{{ $stats['Isabela']['loans_released_count'] }}</td>
                <td><strong>{{ $stats['Cubao']['loans_released_count'] + $stats['Fort Magsaysay']['loans_released_count'] + $stats['Isabela']['loans_released_count'] }}</strong></td>
            </tr>
            <tr>
                <td class="label">Total Gross (&#8369;)</td>
                <td>&#8369;{{ number_format($stats['Cubao']['loans_released_amount'], 2) }}</td>
                <td>&#8369;{{ number_format($stats['Fort Magsaysay']['loans_released_amount'], 2) }}</td>
                <td>&#8369;{{ number_format($stats['Isabela']['loans_released_amount'], 2) }}</td>
                <td><strong>&#8369;{{ number_format($stats['Cubao']['loans_released_amount'] + $stats['Fort Magsaysay']['loans_released_amount'] + $stats['Isabela']['loans_released_amount'], 2) }}</strong></td>
            </tr>
            <tr>
                <td class="label">Total Income (&#8369;)</td>
                <td>&#8369;{{ number_format($stats['Cubao']['total_income'], 2) }}</td>
                <td>&#8369;{{ number_format($stats['Fort Magsaysay']['total_income'], 2) }}</td>
                <td>&#8369;{{ number_format($stats['Isabela']['total_income'], 2) }}</td>
                <td><strong>&#8369;{{ number_format($stats['Cubao']['total_income'] + $stats['Fort Magsaysay']['total_income'] + $stats['Isabela']['total_income'], 2) }}</strong></td>
            </tr>
            
            <tr><td colspan="5" style="background-color: #e5e7eb; text-align: center; font-weight: bold; padding: 4px;">SHARE CAPITAL</td></tr>
            <tr>
                <td class="label">Deposits</td>
                <td>&#8369;{{ number_format($stats['Cubao']['share_cap_deposit'], 2) }}</td>
                <td>&#8369;{{ number_format($stats['Fort Magsaysay']['share_cap_deposit'], 2) }}</td>
                <td>&#8369;{{ number_format($stats['Isabela']['share_cap_deposit'], 2) }}</td>
                <td><strong>&#8369;{{ number_format($stats['Cubao']['share_cap_deposit'] + $stats['Fort Magsaysay']['share_cap_deposit'] + $stats['Isabela']['share_cap_deposit'], 2) }}</strong></td>
            </tr>
            <tr>
                <td class="label">Withdrawals</td>
                <td style="color: red;">(&#8369;{{ number_format($stats['Cubao']['share_cap_withdrawal'], 2) }})</td>
                <td style="color: red;">(&#8369;{{ number_format($stats['Fort Magsaysay']['share_cap_withdrawal'], 2) }})</td>
                <td style="color: red;">(&#8369;{{ number_format($stats['Isabela']['share_cap_withdrawal'], 2) }})</td>
                <td style="color: red;"><strong>(&#8369;{{ number_format($stats['Cubao']['share_cap_withdrawal'] + $stats['Fort Magsaysay']['share_cap_withdrawal'] + $stats['Isabela']['share_cap_withdrawal'], 2) }})</strong></td>
            </tr>

            <tr><td colspan="5" style="background-color: #e5e7eb; text-align: center; font-weight: bold; padding: 4px;">SAVINGS DEPOSIT</td></tr>
            <tr>
                <td class="label">Deposits</td>
                <td>&#8369;{{ number_format($stats['Cubao']['savings_deposit'], 2) }}</td>
                <td>&#8369;{{ number_format($stats['Fort Magsaysay']['savings_deposit'], 2) }}</td>
                <td>&#8369;{{ number_format($stats['Isabela']['savings_deposit'], 2) }}</td>
                <td><strong>&#8369;{{ number_format($stats['Cubao']['savings_deposit'] + $stats['Fort Magsaysay']['savings_deposit'] + $stats['Isabela']['savings_deposit'], 2) }}</strong></td>
            </tr>
            <tr>
                <td class="label">Withdrawals</td>
                <td style="color: red;">(&#8369;{{ number_format($stats['Cubao']['savings_withdrawal'], 2) }})</td>
                <td style="color: red;">(&#8369;{{ number_format($stats['Fort Magsaysay']['savings_withdrawal'], 2) }})</td>
                <td style="color: red;">(&#8369;{{ number_format($stats['Isabela']['savings_withdrawal'], 2) }})</td>
                <td style="color: red;"><strong>(&#8369;{{ number_format($stats['Cubao']['savings_withdrawal'] + $stats['Fort Magsaysay']['savings_withdrawal'] + $stats['Isabela']['savings_withdrawal'], 2) }})</strong></td>
            </tr>

            <tr><td colspan="5" style="background-color: #e5e7eb; text-align: center; font-weight: bold; padding: 4px;">TIME DEPOSIT</td></tr>
            <tr>
                <td class="label">New Placements</td>
                <td>&#8369;{{ number_format($stats['Cubao']['time_deposit_amount'], 2) }}</td>
                <td>&#8369;{{ number_format($stats['Fort Magsaysay']['time_deposit_amount'], 2) }}</td>
                <td>&#8369;{{ number_format($stats['Isabela']['time_deposit_amount'], 2) }}</td>
                <td><strong>&#8369;{{ number_format($stats['Cubao']['time_deposit_amount'] + $stats['Fort Magsaysay']['time_deposit_amount'] + $stats['Isabela']['time_deposit_amount'], 2) }}</strong></td>
            </tr>

            <tr><td colspan="5" style="background-color: #e5e7eb; text-align: center; font-weight: bold; padding: 4px;">MEMBERSHIP</td></tr>
            <tr>
                <td class="label">New Members</td>
                <td>{{ $stats['Cubao']['new_members'] }}</td>
                <td>{{ $stats['Fort Magsaysay']['new_members'] }}</td>
                <td>{{ $stats['Isabela']['new_members'] }}</td>
                <td><strong>{{ $stats['Cubao']['new_members'] + $stats['Fort Magsaysay']['new_members'] + $stats['Isabela']['new_members'] }}</strong></td>
            </tr>
            <tr>
                <td class="label">Dismembers</td>
                <td style="color: red;">{{ $stats['Cubao']['dismembers'] }}</td>
                <td style="color: red;">{{ $stats['Fort Magsaysay']['dismembers'] }}</td>
                <td style="color: red;">{{ $stats['Isabela']['dismembers'] }}</td>
                <td style="color: red;"><strong>{{ $stats['Cubao']['dismembers'] + $stats['Fort Magsaysay']['dismembers'] + $stats['Isabela']['dismembers'] }}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="page-break"></div>
    <div class="report-title">Detailed Transaction Activity</div>
    <div class="report-subtitle">Member List by Branch</div>

    @foreach($logs as $branchName => $log)
    <div class="branch-section">
        <div class="branch-title">{{ $branchName }} Branch</div>

        <div class="log-header">Loans Released</div>
        @if(count($log['loans']) > 0)
        <table class="log-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Member Name</th>
                    <th style="text-align:right;">Gross</th>
                    <th style="text-align:right;">Net</th>
                    <th style="text-align:right;">Monthly</th>
                </tr>
            </thead>
            <tbody>
                @foreach($log['loans'] as $item)
                <tr>
                    <td>{{ $item['date'] }}</td>
                    <td>{{ $item['name'] }}</td>
                    <td style="text-align:right;">&#8369;{{ number_format($item['gross'], 2) }}</td>
                    <td style="text-align:right;">&#8369;{{ number_format($item['net'], 2) }}</td>
                    <td style="text-align:right;">&#8369;{{ number_format($item['amortization'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty-log">No loans released this month.</div>
        @endif

        <div class="log-header">Share Capital Activity</div>
        @if(count($log['share_capital']) > 0)
        <table class="log-table">
            <thead><tr><th>Date</th><th>Member Name</th><th>Type</th><th style="text-align:right;">Amount</th></tr></thead>
            <tbody>
                @foreach($log['share_capital'] as $item)
                <tr>
                    <td>{{ $item['date'] }}</td>
                    <td>{{ $item['name'] }}</td>
                    <td>{{ $item['type'] }}</td>
                    <td style="text-align:right;">&#8369;{{ number_format($item['amount'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty-log">No share capital transactions.</div>
        @endif

        <div class="log-header">Savings Activity</div>
        @if(count($log['savings']) > 0)
        <table class="log-table">
            <thead><tr><th>Date</th><th>Member Name</th><th>Type</th><th style="text-align:right;">Amount</th></tr></thead>
            <tbody>
                @foreach($log['savings'] as $item)
                <tr>
                    <td>{{ $item['date'] }}</td>
                    <td>{{ $item['name'] }}</td>
                    <td>{{ $item['type'] }}</td>
                    <td style="text-align:right;">&#8369;{{ number_format($item['amount'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty-log">No savings transactions.</div>
        @endif

        <div class="log-header">Time Deposit Placements</div>
        @if(count($log['time_deposit']) > 0)
        <table class="log-table">
            <thead><tr><th>Date</th><th>Member Name</th><th style="text-align:right;">Principal</th></tr></thead>
            <tbody>
                @foreach($log['time_deposit'] as $item)
                <tr>
                    <td>{{ $item['date'] }}</td>
                    <td>{{ $item['name'] }}</td>
                    <td style="text-align:right;">&#8369;{{ number_format($item['amount'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty-log">No new time deposits.</div>
        @endif

        <div class="log-header">Membership Updates</div>
        @if(count($log['new_members']) > 0 || count($log['dismembers']) > 0)
        <table class="log-table">
            <thead><tr><th>Status</th><th>Member Name</th></tr></thead>
            <tbody>
                @foreach($log['new_members'] as $name)
                <tr>
                    <td style="color:green;">New Member</td>
                    <td>{{ $name }}</td>
                </tr>
                @endforeach
                @foreach($log['dismembers'] as $name)
                <tr>
                    <td style="color:red;">Terminated</td>
                    <td>{{ $name }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty-log">No membership changes.</div>
        @endif

    </div>
    @endforeach

    <div style="margin-top: 30px; font-size: 8pt; color: #777; border-top: 1px solid #eee; padding-top: 5px;">
        Generated automatically on {{ $date }}
    </div>

</body>
</html>