import React, { useState } from 'react';
import { Head } from '@inertiajs/react';

// ─── Branch → signatory mapping ──────────────────────────────────────────────
function getSignatory(branch = '') {
    const b = branch.toLowerCase();
    if (b.includes('cubao') || b.includes('aguinaldo')) {
        return { name: 'DENISE JOY F. ANTOLIN', designation: 'Loan Processor/Cashier' };
    }
    if (b.includes('fort') || b.includes('magsaysay') || b.includes('palayan') || b.includes('nueva ecija')) {
        return { name: 'MARIEL S. LUCERO', designation: 'Bookkeeper' };
    }
    // Default: Main Office / Upi / Gamu / any other branch
    return { name: 'JEROME A. SANTOS', designation: 'Bookkeeper' };
}

function getBranchAddress(branch = '') {
    const b = branch.toLowerCase();
    if (b.includes('cubao') || b.includes('aguinaldo')) {
        return '20E 2nd Camarilla St. Brgy. San Roque, Murphy, Cubao, QC';
    }
    if (b.includes('fort') || b.includes('magsaysay') || b.includes('palayan') || b.includes('nueva ecija')) {
        return 'Purok 3, Brgy. Militar, Fort Magsaysay, Palayan City, Nueva Ecija';
    }
    return 'Stall#2 Principe Bldg., Maharlika Highway, Upi, Gamu, Isabela 3301';
}

export default function PrintVoucher({ vouchers, perPage }) {
    const [manualData, setManualData] = useState(
        vouchers.map(v => ({
            payee:      v.record.particulars || '',
            addressee:  'Local Market',
            voucherNo:  `00${v.record.id}`,
            remarks:    'To record payment for ' + (v.record.particulars || '')
        }))
    );

    const handleManualChange = (index, field, value) => {
        const newData = [...manualData];
        newData[index][field] = value;
        setManualData(newData);
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(val);

    const formatShortDate = (dateString) => {
        const date = new Date(dateString);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${months[date.getMonth()]}-${date.getDate()}`;
    };

    const formatFullDate = (dateString) =>
        new Date(dateString).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });

    return (
        <div className="bg-white min-h-screen pb-20 font-serif">
            <Head title="Journal Vouchers">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <style dangerouslySetInnerHTML={{ __html: `
                /* ── PRINT ─────────────────────────────────────────── */
                @media print {
                    @page { size: portrait; margin: 0.1in; }
                    .voucher-unit {
                        min-height: ${vouchers.length === 1 ? 'auto' : `${98 / perPage}vh`};
                        page-break-inside: avoid;
                        border-bottom: ${vouchers.length > 1 ? '1px dashed #000' : 'none'};
                        padding: 10px 0;
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                    }
                    .no-print { display: none !important; }
                    input {
                        border: none !important;
                        font-weight: bold !important;
                        background: transparent !important;
                        -webkit-print-color-adjust: exact;
                    }
                    .voucher-inner { border: 2px solid #000 !important; flex-grow: 1; }
                }

                /* ── SCREEN ────────────────────────────────────────── */
                .voucher-inner {
                    border: 2px solid #000;
                    padding: 15px;
                    position: relative;
                }
                input {
                    border-bottom: 1px solid #eee;
                    outline: none;
                    width: 100%;
                    font-family: serif;
                }

                /* Mobile: stack the info grid vertically */
                @media (max-width: 639px) {
                    .info-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
                    .info-right { text-align: left !important; }
                    .info-right > div { justify-content: flex-start !important; }
                    .sig-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
                    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                }
            `}} />

            {/* ── SCREEN TOOLBAR ──────────────────────────────────── */}
            <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <span className="text-sm font-bold text-gray-700">
                    {vouchers.length} Voucher{vouchers.length !== 1 ? 's' : ''} — edit fields below, then print.
                </span>
                <button
                    onClick={() => window.print()}
                    className="bg-black text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-transform active:scale-95 text-sm"
                >
                    🖨 Generate Print
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4">
                {vouchers.map((v, i) => {
                    const signatory    = getSignatory(v.record.branch);
                    const branchAddress = getBranchAddress(v.record.branch);

                    return (
                        <div key={i} className="voucher-unit mb-4 sm:mb-6">
                            <div className="voucher-inner">

                                {/* ── HEADER ────────────────────────────── */}
                                <div className="flex flex-col xs:flex-row justify-between items-start border-b-2 border-black pb-2 mb-3 gap-2">
                                    <div className="flex gap-3">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 border border-black flex items-center justify-center p-0.5 shrink-0">
                                            <img
                                                src="/images/logo/pis_logo.png"
                                                alt="P Cooperative"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div>
                                            <h1 className="font-bold text-[10px] uppercase leading-tight">
                                                People's Multi-Purpose Cooperative
                                            </h1>
                                            <p className="text-[7px] leading-tight font-bold italic mt-0.5">
                                                {branchAddress}<br />
                                                CDA Registration No.: 9520-0200-8847
                                            </p>
                                        </div>
                                    </div>
                                    <h2 className="text-sm sm:text-base font-black italic uppercase tracking-tighter shrink-0">
                                        Journal Entry
                                    </h2>
                                </div>

                                {/* ── INFO ROW ──────────────────────────── */}
                                <div className="info-grid grid grid-cols-2 text-[9px] mb-3 gap-x-6 sm:gap-x-10">
                                    <div className="space-y-1">
                                        <div className="flex gap-1.5">
                                            <span className="shrink-0">Payee:</span>
                                            <input
                                                value={manualData[i].payee}
                                                onChange={e => handleManualChange(i, 'payee', e.target.value)}
                                                className="uppercase border-b border-black/20 min-w-0"
                                            />
                                        </div>
                                        <div className="flex gap-1.5">
                                            <span className="shrink-0">Addressee:</span>
                                            <input
                                                value={manualData[i].addressee}
                                                onChange={e => handleManualChange(i, 'addressee', e.target.value)}
                                                className="border-b border-black/20 min-w-0"
                                            />
                                        </div>
                                    </div>
                                    <div className="info-right space-y-1 text-right">
                                        <div className="flex gap-1.5 justify-end">
                                            <span className="shrink-0">Voucher No.:</span>
                                            <input
                                                className="w-20 text-right border-b border-black/20"
                                                value={manualData[i].voucherNo}
                                                onChange={e => handleManualChange(i, 'voucherNo', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-1.5 justify-end">
                                            <span className="shrink-0">Voucher Date:</span>
                                            <span className="font-bold border-b border-black w-20 text-right">
                                                {formatShortDate(v.record.transactionDate)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* ── LEDGER TABLE ──────────────────────── */}
                                <div className="table-wrap">
                                    <table className="w-full border-collapse border-2 border-black text-[9px]" style={{ minWidth: '480px' }}>
                                        <thead>
                                            <tr className="border-b-2 border-black bg-slate-50 font-bold">
                                                <th className="border-r border-black p-1 w-14 text-center">Date</th>
                                                <th className="border-r border-black p-1 w-16 text-center">Ref No.</th>
                                                <th className="border-r border-black p-1 text-left px-3">Account Name</th>
                                                <th className="border-r border-black p-1 w-14 text-center">Code</th>
                                                <th className="border-r border-black p-1 w-16 text-right">DR</th>
                                                <th className="p-1 w-16 text-right">CR</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {v.ledgerEntries.map((e, idx) => (
                                                <tr key={idx} className="border-b border-black/10">
                                                    <td className="border-r border-black p-1 text-center font-mono">
                                                        {idx === 0 ? formatShortDate(v.record.transactionDate) : ''}
                                                    </td>
                                                    <td className="border-r border-black p-1 text-center font-mono">
                                                        {e.referenceNo}
                                                    </td>
                                                    <td className={`border-r border-black p-1 px-3 font-bold ${e.credit > 0 ? 'pl-8 italic' : ''}`}>
                                                        {e.accountName}
                                                    </td>
                                                    <td className="border-r border-black p-1 text-center font-mono">
                                                        {e.accountCode}
                                                    </td>
                                                    <td className="border-r border-black p-1 text-right font-bold">
                                                        {e.debit > 0 ? formatCurrency(e.debit) : ''}
                                                    </td>
                                                    <td className="p-1 text-right font-bold">
                                                        {e.credit > 0 ? formatCurrency(e.credit) : ''}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="h-6">
                                                <td className="border-r border-black" />
                                                <td className="border-r border-black" />
                                                <td colSpan="4" className="px-3">
                                                    <input
                                                        className="text-[8px] italic !font-normal !border-none"
                                                        value={manualData[i].remarks}
                                                        onChange={e => handleManualChange(i, 'remarks', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* ── SIGNATURES ────────────────────────── */}
                                <div className="sig-grid grid grid-cols-2 gap-6 sm:gap-10 mt-6 text-[8px]">
                                    <div className="text-center relative">
                                        <p className="border-b border-black font-bold uppercase pt-3">
                                            {signatory.name}
                                        </p>
                                        <p className="text-slate-600">{signatory.designation}</p>
                                        <p className="text-[7px] text-slate-400 mt-1 sm:absolute sm:-bottom-4 sm:left-0">
                                            Date Posted: {formatFullDate(v.record.transactionDate)}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="border-b border-black font-bold uppercase pt-3">
                                            ALEXANDER L. FERIA CPA, MNSA
                                        </p>
                                        <p className="text-slate-600 font-bold">President</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── FLOATING PRINT BUTTON (small screens fallback) ── */}
            <div className="fixed bottom-6 right-6 no-print sm:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-black text-white px-6 py-3 rounded-xl font-bold shadow-2xl transition-transform active:scale-95 text-sm"
                >
                    🖨 Print
                </button>
            </div>
        </div>
    );
}