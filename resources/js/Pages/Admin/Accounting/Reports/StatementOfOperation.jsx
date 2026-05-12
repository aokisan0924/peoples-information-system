import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

export default function StatementOfOperation({ revenues, expenses, totalRevenue, totalExpense, netSurplus, branch, periodLabel }) {
    
    useEffect(() => {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    const formatNum = (val) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

    return (
        <div className="bg-white text-black min-h-screen p-8">
            <Head title={`Statement of Operation`} />
            
            <style type="text/css" media="print">
                {`
                    @page { size: portrait; margin: 1in; }
                    body { font-family: 'Times New Roman', serif; color: black; background: white; }
                    .print-btn { display: none; }
                `}
            </style>

            <button onClick={() => window.print()} className="print-btn mb-8 flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-500 transition-all">
                <Printer size={18} /> Print Document
            </button>

            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8 leading-snug">
                    <div className="font-bold text-lg uppercase tracking-wide">PEOPLE'S MULTI-PURPOSE COOPERATIVE</div>
                    <div>Upi, Gamu, Isabela</div>
                    <div>CDA Registration No. 9520-02008847</div>
                    <div className="font-bold mt-4 uppercase">STATEMENT OF OPERATION</div>
                    <div className="uppercase">({branch})</div>
                    <div>{periodLabel}</div>
                    <div className="italic">(Amounts in Philippine Pesos)</div>
                </div>

                <table className="w-full text-[11pt] border-collapse">
                    <tbody>
                        <tr><td colSpan="4" className="font-bold text-center py-2">REVENUES</td></tr>
                        {Object.keys(revenues || {}).map(code => (
                            <tr key={code}>
                                <td className="w-20 pl-4">{code}</td>
                                <td>{revenues[code].name}</td>
                                <td className="w-32"></td>
                                <td className="w-32 text-right">{formatNum(revenues[code].balance)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td></td><td className="font-bold uppercase py-2">GROSS INCOME FROM OPERATIONS</td><td></td>
                            <td className="text-right font-bold border-t border-black">{formatNum(totalRevenue)}</td>
                        </tr>

                        <tr><td colSpan="4" className="py-4"></td></tr>
                        
                        <tr><td colSpan="4" className="font-bold text-center py-2">LESS: EXPENSES</td></tr>
                        <tr><td colSpan="4" className="font-bold pl-4">Administrative Costs</td></tr>
                        {Object.keys(expenses || {}).map(code => (
                            <tr key={code}>
                                <td className="w-20 pl-4">{code}</td>
                                <td>{expenses[code].name}</td>
                                <td className="w-32"></td>
                                <td className="w-32 text-right">{formatNum(expenses[code].balance)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td></td><td className="font-bold uppercase py-2 pl-8">Total Administrative Costs</td><td></td>
                            <td className="text-right font-bold border-t border-black">{formatNum(totalExpense)}</td>
                        </tr>

                        <tr><td colSpan="4" className="py-4"></td></tr>
                        
                        <tr>
                            <td></td><td className="font-bold uppercase py-2">NET SURPLUS/(DEFICIT)</td><td></td>
                            <td className="text-right font-bold border-b-4 border-black border-double">{formatNum(netSurplus)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}