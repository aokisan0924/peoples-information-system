import React, { useState } from 'react';
import { Head } from '@inertiajs/react';

export default function PrintVoucher({ vouchers, perPage }) {
    const [manualData, setManualData] = useState(
        vouchers.map(v => ({
            payee: v.record.particulars || '',
            addressee: 'Local Market',
            voucherNo: `00${v.record.id}`,
            remarks: 'To record payment for ' + (v.record.particulars || '')
        }))
    );

    const handleManualChange = (index, field, value) => {
        const newData = [...manualData];
        newData[index][field] = value;
        setManualData(newData);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(val);

    const formatShortDate = (dateString) => {
        const date = new Date(dateString);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[date.getMonth()]}-${date.getDate()}`;
    };

    const formatFullDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    return (
        <div className="bg-white min-h-screen pb-20 font-serif">
            <Head title="Journal Vouchers">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <style dangerouslySetInnerHTML={{ __html: `
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
                    .no-print { display: none; }
                    input { border: none !important; font-weight: bold !important; background: transparent !important; }
                    .voucher-inner { border: 2px solid #000 !important; flex-grow: 1; }
                }
                .voucher-inner { border: 2px solid #000; padding: 15px; position: relative; }
                input { border-bottom: 1px solid #eee; outline: none; width: 100%; font-family: serif; }
            `}} />

            <div className="max-w-4xl mx-auto">
                {vouchers.map((v, i) => {
                    // Branch-based Logic for Address and Signatories
                    const isCubao = v.record.branch?.toLowerCase().includes('cubao');
                    
                    const branchAddress = isCubao 
                        ? "20E 2nd Camarilla St. Brgy. San Roque, Murphy, Cubao, QC" 
                        : "Stall#2 Principe Bldg., Maharlika Highway, Upi, Gamu, Isabela 3301";
                    
                    const preparedBy = isCubao ? "DENISE JOY F. ANTOLIN" : "JEROME A. SANTOS";
                    const designation = isCubao ? "Loan Processor/Cashier" : "Bookkeeper";

                    return (
                        <div key={i} className="voucher-unit">
                            <div className="voucher-inner">
                                {/* --- HEADER --- */}
                                <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-3">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 border border-black flex items-center justify-center p-0.5">
                                            <img src="/images/logo/pis_logo.png" alt="P Cooperative" className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <h1 className="font-bold text-[10px] uppercase">People's Multi-Purpose Cooperative</h1>
                                            <p className="text-[7px] leading-tight font-bold italic">
                                                {branchAddress}<br/>
                                                CDA Registration No.: 9520-0200-8847
                                            </p>
                                        </div>
                                    </div>
                                    <h2 className="text-base font-black italic uppercase tracking-tighter">Journal Entry</h2>
                                </div>

                                {/* --- INFO --- */}
                                <div className="grid grid-cols-2 text-[9px] mb-3 gap-x-10">
                                    <div className="space-y-1">
                                        <div className="flex gap-2">Payee: <input value={manualData[i].payee} onChange={e => handleManualChange(i, 'payee', e.target.value)} className="uppercase border-b border-black/20"/></div>
                                        <div className="flex gap-2">Addressee: <input value={manualData[i].addressee} onChange={e => handleManualChange(i, 'addressee', e.target.value)} className="border-b border-black/20"/></div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <div className="flex gap-2 justify-end">Voucher No.: <input className="w-20 text-right border-b border-black/20" value={manualData[i].voucherNo} onChange={e => handleManualChange(i, 'voucherNo', e.target.value)}/></div>
                                        <div className="flex gap-2 justify-end">Voucher Date: <span className="font-bold border-b border-black w-20 text-right">{formatShortDate(v.record.transactionDate)}</span></div>
                                    </div>
                                </div>

                                {/* --- TABLE --- */}
                                <table className="w-full border-collapse border-2 border-black text-[9px]">
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
                                                <td className="border-r border-black p-1 text-center font-mono">{idx === 0 ? formatShortDate(v.record.transactionDate) : ''}</td>
                                                <td className="border-r border-black p-1 text-center font-mono">{e.referenceNo}</td>
                                                <td className={`border-r border-black p-1 px-3 font-bold ${e.credit > 0 ? 'pl-8 italic' : ''}`}>{e.accountName}</td>
                                                <td className="border-r border-black p-1 text-center font-mono">{e.accountCode}</td>
                                                <td className="border-r border-black p-1 text-right font-bold">{e.debit > 0 ? formatCurrency(e.debit) : ''}</td>
                                                <td className="p-1 text-right font-bold">{e.credit > 0 ? formatCurrency(e.credit) : ''}</td>
                                            </tr>
                                        ))}
                                        <tr className="h-6">
                                            <td className="border-r border-black"></td>
                                            <td className="border-r border-black"></td>
                                            <td colSpan="4" className="px-3">
                                                <input className="text-[8px] italic !font-normal !border-none" value={manualData[i].remarks} onChange={e => handleManualChange(i, 'remarks', e.target.value)} />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* --- SIGNATURES --- */}
                                <div className="grid grid-cols-2 gap-10 mt-6 text-[8px]">
                                    <div className="text-center relative">
                                        <p className="border-b border-black font-bold uppercase pt-3">{preparedBy}</p>
                                        <p className="text-slate-600">{designation}</p>
                                        <p className="text-[7px] text-slate-400 absolute -bottom-4 left-0">
                                            Date Posted: {formatFullDate(v.record.transactionDate)}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="border-b border-black font-bold uppercase pt-3">ALEXANDER L. FERIA CPA, MNSA</p>
                                        <p className="text-slate-600 font-bold">President</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="fixed bottom-6 right-6 no-print">
                <button onClick={() => window.print()} className="bg-black text-white px-8 py-3 rounded-xl font-bold shadow-2xl transition-transform active:scale-95">
                    Generate Print
                </button>
            </div>
        </div>
    );
}