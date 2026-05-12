<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>President's Report</title>
    <style>
        @page { margin: 0.6in 0.5in; }
        
        /* GLOBAL TYPOGRAPHY */
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9.5pt; color: #222; line-height: 1.5; background-color: #fff; }
        
        /* HEADER & BRANDING */
        .header-table { width: 100%; border-bottom: 2px solid #047857; padding-bottom: 15px; margin-bottom: 25px; }
        .logo-cell { width: 80px; vertical-align: middle; }
        .text-cell { text-align: center; vertical-align: middle; }
        .coop-name { font-size: 14pt; font-weight: 900; color: #047857; letter-spacing: 1px; margin-bottom: 4px; }
        .address-block { font-size: 7.5pt; color: #555; line-height: 1.4; }
        .address-line { display: block; }

        /* FORMAL MEMO BLOCK */
        .memo-container { margin-bottom: 30px; }
        .memo-title { font-size: 16pt; font-weight: bold; color: #111; padding-bottom: 10px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; letter-spacing: -0.5px; }
        .memo-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
        .memo-table td { padding: 5px 0; border-bottom: 1px solid #f9fafb; vertical-align: top; }
        .memo-label { font-weight: bold; width: 80px; color: #64748b; text-transform: uppercase; font-size: 8pt; letter-spacing: 0.5px; }
        .memo-value { font-weight: bold; color: #111; }
        
        /* AI EXECUTIVE SUMMARY */
        .ai-section { text-align: justify; margin-bottom: 40px; }
        .ai-section h3 { color: #047857; font-size: 10pt; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; }
        .ai-section p { margin-bottom: 12px; color: #333; }

        /* DUAL SIGNATURE BLOCK */
        .signature-table { width: 100%; margin-top: 50px; page-break-inside: avoid; border: none; }
        .signature-table td { width: 50%; vertical-align: bottom; border: none; padding: 0; }
        .sig-label { font-size: 8.5pt; color: #64748b; margin-bottom: 40px; }
        .sig-name { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #222; display: inline-block; min-width: 250px; padding-bottom: 2px; }
        .sig-title { font-size: 8.5pt; margin-top: 4px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

        /* CLEAN EXECUTIVE TABLES */
        .page-break { page-break-before: always; }
        .section-title { font-size: 11pt; font-weight: bold; color: #111; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #047857; padding-bottom: 8px; margin-bottom: 20px; margin-top: 10px;}
        
        .data-table, .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; page-break-inside: avoid; }
        .data-table th, .summary-table th { padding: 10px 8px; font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #cbd5e1; text-align: right; letter-spacing: 0.5px; }
        .data-table th:first-child, .summary-table th:first-child { text-align: left; }
        
        .data-table td, .summary-table td { padding: 9px 8px; font-size: 9pt; border-bottom: 1px solid #f1f5f9; color: #222; text-align: right; }
        .data-table td.label { text-align: left; font-weight: bold; color: #334155; }
        .data-table tr:last-child td, .summary-table tr:last-child td { border-bottom: 2px solid #cbd5e1; }
        
        .data-table .sub-header td { text-align: left; font-weight: bold; padding: 15px 8px 6px 8px; color: #047857; text-transform: uppercase; font-size: 8pt; letter-spacing: 1px; border-bottom: 1px solid #cbd5e1; border-top: none; }
        .totals-row td { font-weight: bold; color: #047857; background-color: #f8fafc; border-top: 1px solid #cbd5e1; }

        /* BRANCH HEADERS */
        .branch-header { font-size: 9pt; font-weight: bold; margin-top: 30px; margin-bottom: 8px; color: #047857; text-transform: uppercase; letter-spacing: 1px; }

        /* MODERN PROGRESS BAR */
        .pis-container { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 40px; page-break-inside: avoid; }
        .progress-header-table { width: 100%; margin-bottom: 10px; border: none; }
        .progress-header-table td { border: none; padding: 0; }
        .progress-title { font-weight: bold; font-size: 9pt; color: #334155; text-transform: uppercase; letter-spacing: 1px; text-align: left; }
        .progress-percentage { text-align: right; font-size: 14pt; font-weight: 900; color: #047857; }
        
        .progress-bar-wrapper { width: 100%; background-color: #f1f5f9; border-radius: 10px; height: 10px; margin-bottom: 20px; overflow: hidden; }
        .progress-bar-fill { height: 10px; background-color: #047857; width: 82%; border-radius: 10px; }
        
        .pis-milestones { font-size: 8.5pt; color: #64748b; width: 100%; border: none; }
        .pis-milestones td { border: none; padding: 0; }
        .pis-milestones ul { margin: 0; padding-left: 15px; list-style-type: none; }
        .pis-milestones li { margin-bottom: 6px; }
        .milestone-done { color: #047857; font-weight: bold; display: inline-block; width: 85px; }
        .milestone-pend { color: #94a3b8; font-weight: bold; display: inline-block; width: 85px; }
        
        /* FOOTER */
        .footer { margin-top: 40px; font-size: 7.5pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td class="logo-cell"></td>
            <td class="text-cell">
                <div class="coop-name">People's Multi-Purpose Cooperative</div>
                <div class="address-block">
                    <span class="address-line"><strong>Main:</strong> Stall#2, Principe Bldg., Upi, Gamu, Isabela (+63) 965-953-2196</span>
                    <span class="address-line"><strong>Cubao:</strong> 20-E Main Ave. cor. 15th Ave., Brgy. San Roque, Murphy, Quezon City</span>
                    <span class="address-line"><strong>Fort Magsaysay:</strong> Purok 3, Brgy. Militar, Fort Magsaysay, Palayan City</span>
                </div>
            </td>
            <td class="logo-cell"></td>
        </tr>
    </table>

    <div class="memo-container">
        <div class="memo-title">Executive Monthly Report</div>
        <table class="memo-table">
            <tr><td class="memo-label">To:</td><td class="memo-value">PMPC Board of Directors</td></tr>
            <tr><td class="memo-label">From:</td><td class="memo-value">Col. Alexander L. Feria (RET), CPA, MNSA</td></tr>
            <tr><td class="memo-label">Date:</td><td class="memo-value">{{ $date }}</td></tr>
            <tr><td class="memo-label">Period:</td><td class="memo-value" style="color:#047857;">{{ strtoupper($monthName) }}</td></tr>
        </table>
    </div>

    <div class="ai-section">
        {!! $aiContent !!}
        
        <table class="signature-table">
            <tr>
                <td style="padding-right: 20px;">
                    <div class="sig-label">Prepared by:</div>
                    <div class="sig-name">Jeffrae A. Sapla</div>
                    <div class="sig-title">Board Secretary & IT Specialist</div>
                </td>
                <td style="padding-left: 20px;">
                    <div class="sig-label">Submitted by:</div>
                    <div class="sig-name">Col. Alexander L. Feria (RET), CPA, MNSA</div>
                    <div class="sig-title">President</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="page-break"></div>

    <div class="section-title">Consolidated Financial Overview</div>
    
    @php
        $t_loans_count = $stats['Cubao']['loans_released_count'] + $stats['Fort Magsaysay']['loans_released_count'] + $stats['Isabela']['loans_released_count'];
        $t_loans_gross = ($stats['Cubao']['loans_released_gross'] ?? 0) + ($stats['Fort Magsaysay']['loans_released_gross'] ?? 0) + ($stats['Isabela']['loans_released_gross'] ?? 0);
        $t_income = ($stats['Cubao']['total_income'] ?? 0) + ($stats['Fort Magsaysay']['total_income'] ?? 0) + ($stats['Isabela']['total_income'] ?? 0);
        $t_share_cap = ($stats['Cubao']['share_cap_deposit'] ?? 0) + ($stats['Fort Magsaysay']['share_cap_deposit'] ?? 0) + ($stats['Isabela']['share_cap_deposit'] ?? 0);
        $t_savings = ($stats['Cubao']['savings_deposit'] ?? 0) + ($stats['Fort Magsaysay']['savings_deposit'] ?? 0) + ($stats['Isabela']['savings_deposit'] ?? 0);
    @endphp

    <table class="data-table">
        <thead>
            <tr>
                <th>Performance Metric</th>
                <th>Cubao (Main)</th>
                <th>Fort Magsaysay</th>
                <th>Isabela</th>
                <th>System Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="label">Loans Released (Qty)</td>
                <td>{{ $stats['Cubao']['loans_released_count'] }}</td>
                <td>{{ $stats['Fort Magsaysay']['loans_released_count'] }}</td>
                <td>{{ $stats['Isabela']['loans_released_count'] }}</td>
                <td class="totals-row">{{ $t_loans_count }}</td>
            </tr>
            <tr>
                <td class="label">Total Gross Disbursed</td>
                <td>P{{ number_format($stats['Cubao']['loans_released_gross'] ?? 0, 2) }}</td>
                <td>P{{ number_format($stats['Fort Magsaysay']['loans_released_gross'] ?? 0, 2) }}</td>
                <td>P{{ number_format($stats['Isabela']['loans_released_gross'] ?? 0, 2) }}</td>
                <td class="totals-row">P{{ number_format($t_loans_gross, 2) }}</td>
            </tr>
            <tr>
                <td class="label">Total Income Generated</td>
                <td>P{{ number_format($stats['Cubao']['total_income'] ?? 0, 2) }}</td>
                <td>P{{ number_format($stats['Fort Magsaysay']['total_income'] ?? 0, 2) }}</td>
                <td>P{{ number_format($stats['Isabela']['total_income'] ?? 0, 2) }}</td>
                <td class="totals-row">P{{ number_format($t_income, 2) }}</td>
            </tr>
            
            <tr class="sub-header"><td colspan="5">Share Capital & Deposits</td></tr>
            <tr>
                <td class="label">Share Capital Deposits</td>
                <td>P{{ number_format($stats['Cubao']['share_cap_deposit'] ?? 0, 2) }}</td>
                <td>P{{ number_format($stats['Fort Magsaysay']['share_cap_deposit'] ?? 0, 2) }}</td>
                <td>P{{ number_format($stats['Isabela']['share_cap_deposit'] ?? 0, 2) }}</td>
                <td class="totals-row">P{{ number_format($t_share_cap, 2) }}</td>
            </tr>
            <tr>
                <td class="label">Savings Deposits</td>
                <td>P{{ number_format($stats['Cubao']['savings_deposit'] ?? 0, 2) }}</td>
                <td>P{{ number_format($stats['Fort Magsaysay']['savings_deposit'] ?? 0, 2) }}</td>
                <td>P{{ number_format($stats['Isabela']['savings_deposit'] ?? 0, 2) }}</td>
                <td class="totals-row">P{{ number_format($t_savings, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title" style="margin-top: 40px;">Operational Breakdown by Branch</div>

    @foreach(['Cubao', 'Fort Magsaysay', 'Isabela'] as $branch)
        @php $stat = $stats[$branch]; @endphp
        
        <div class="branch-header">{{ $branch }} Branch Activity</div>
        
        <table class="summary-table">
            <thead>
                <tr>
                    <th style="text-align: left; width: 30%;">Metric Category</th>
                    <th style="width: 35%;">Volume / Quantity</th>
                    <th style="width: 35%;">Financial Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="label">Total Loan Disbursements</td>
                    <td style="text-align: right;">{{ $stat['loans_released_count'] }} Transactions</td>
                    <td style="color: #047857; font-weight: bold;">P{{ number_format($stat['loans_released_gross'] ?? 0, 2) }} Gross</td>
                </tr>
                <tr>
                    <td class="label">Net Loan Proceeds</td>
                    <td style="text-align: right;">—</td>
                    <td style="color: #047857; font-weight: bold;">P{{ number_format($stat['loans_released_net'] ?? 0, 2) }} Net</td>
                </tr>
                <tr>
                    <td class="label">Membership Growth</td>
                    <td style="text-align: right;">+{{ $stat['new_members'] }} New Applications</td>
                    <td style="text-align: right; color:#dc2626;">-{{ $stat['dismembers'] }} Terminations</td>
                </tr>
            </tbody>
        </table>
    @endforeach

    <div class="pis-container">
        <table class="progress-header-table">
            <tr>
                <td class="progress-title">PIS Digital Transformation Progress</td>
                <td class="progress-percentage">82%</td>
            </tr>
        </table>
        
        <div class="progress-bar-wrapper">
            <div class="progress-bar-fill"></div>
        </div>

        <table class="pis-milestones">
            <tr>
                <td width="50%" style="vertical-align: top;">
                    <ul>
                        <li><span class="milestone-done">✓ Phase 1:</span> Core Member Database</li>
                        <li><span class="milestone-done">✓ Phase 2:</span> Loan Origination System</li>
                        <li><span class="milestone-done">✓ Phase 3:</span> General Ledger & Accounting</li>
                    </ul>
                </td>
                <td width="50%" style="vertical-align: top;">
                    <ul>
                        <li><span class="milestone-done">✓ Phase 4:</span> Fixed Asset Mgt. (PPE)</li>
                        <li><span class="milestone-pend">⧗ Phase 5:</span> Analytics & Exec. Reports</li>
                        <li><span class="milestone-pend">☐ Phase 6:</span> Public Member Portal</li>
                    </ul>
                </td>
            </tr>
        </table>
    </div>

    <div class="footer">
        Confidential & Proprietary • Generated automatically by PMPC PIS on {{ $date }}
    </div>

</body>
</html>