import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

export default function FinancialStatement({ assets, liabilities, equity, netSurplus, branch, period }) {
    
    useEffect(() => {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    const formatNum = (val) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

    const totalAssets = Object.values(assets || {}).reduce((sum, item) => sum + item.balance, 0);
    const totalLiab = Object.values(liabilities || {}).reduce((sum, item) => sum + item.balance, 0);
    const totalEq = Object.values(equity || {}).reduce((sum, item) => sum + item.balance, 0) + netSurplus;

    return (
        <div className="bg-white text-black min-h-screen p-8">
            <Head title={`Financial Condition`} />
            
            <style type="text/css" media="print">
                {`
                    @page { size: portrait; margin: 1in; }
                    body { font-family: 'Times New Roman', serif; color: black; background: white; }
                    .print-btn { display: none; }
                `}
            </style>

            <button onClick={() => window.print()} className="print-btn mb-8 flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white font-bold rounded shadow hover:bg-emerald-500 transition-all">
                <Printer size={18} /> Print Document
            </button>

            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8 leading-snug">
                    <div className="font-bold text-lg uppercase tracking-wide">PEOPLE'S MULTI-PURPOSE COOPERATIVE</div>
                    <div>Upi, Gamu, Isabela</div>
                    <div>CDA Registration No. 9520-02008847</div>
                    <div className="font-bold mt-4 uppercase">STATEMENT OF FINANCIAL CONDITION</div>
                    <div className="uppercase">({branch})</div>
                    <div>{period}</div>
                    <div className="italic">(Amounts in Philippine Pesos)</div>
                </div>

                <table className="w-full text-[11pt] border-collapse">
                    <tbody>
                        <tr><td colSpan="4" className="font-bold py-2">ASSETS</td></tr>
                        {Object.keys(assets || {}).map(code => (
                            <tr key={code}>
                                <td className="w-20 pl-4">{code}</td>
                                <td>{assets[code].name}</td>
                                <td className="w-32"></td>
                                <td className="w-32 text-right">{formatNum(assets[code].balance)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td></td><td className="font-bold uppercase py-2">TOTAL ASSETS</td><td></td>
                            <td className="text-right font-bold border-t border-b-4 border-black border-double">{formatNum(totalAssets)}</td>
                        </tr>

                        <tr><td colSpan="4" className="py-6"></td></tr>

                        <tr><td colSpan="4" className="font-bold py-2">LIABILITIES & EQUITY</td></tr>
                        <tr><td colSpan="4" className="font-bold pl-4">Liabilities</td></tr>
                        {Object.keys(liabilities || {}).map(code => (
                            <tr key={code}>
                                <td className="w-20 pl-8">{code}</td>
                                <td>{liabilities[code].name}</td>
                                <td className="w-32"></td>
                                <td className="w-32 text-right">{formatNum(liabilities[code].balance)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td></td><td className="font-bold uppercase py-2 pl-4">Total Liabilities</td><td></td>
                            <td className="text-right font-bold border-t border-black">{formatNum(totalLiab)}</td>
                        </tr>

                        <tr><td colSpan="4" className="py-2"></td></tr>

                        <tr><td colSpan="4" className="font-bold pl-4">Equity</td></tr>
                        {Object.keys(equity || {}).map(code => (
                            <tr key={code}>
                                <td className="w-20 pl-8">{code}</td>
                                <td>{equity[code].name}</td>
                                <td className="w-32"></td>
                                <td className="w-32 text-right">{formatNum(equity[code].balance)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td className="w-20 pl-8"></td>
                            <td>Current Year Net Surplus/(Deficit)</td>
                            <td className="w-32"></td>
                            <td className="w-32 text-right">{formatNum(netSurplus)}</td>
                        </tr>
                        <tr>
                            <td></td><td className="font-bold uppercase py-2 pl-4">Total Equity</td><td></td>
                            <td className="text-right font-bold border-t border-black">{formatNum(totalEq)}</td>
                        </tr>

                        <tr><td colSpan="4" className="py-4"></td></tr>
                        
                        <tr>
                            <td></td><td className="font-bold uppercase py-2">TOTAL LIABILITIES & EQUITY</td><td></td>
                            <td className="text-right font-bold border-t border-b-4 border-black border-double">{formatNum(totalLiab + totalEq)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}