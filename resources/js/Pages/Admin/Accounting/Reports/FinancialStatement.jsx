import React from 'react';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

export default function FinancialStatement({ data, branch, period }) {
    // Grouping
    const assets = data.filter(d => d.accountCode.toString().startsWith('1'));
    const liabilities = data.filter(d => d.accountCode.toString().startsWith('2'));
    const equity = data.filter(d => d.accountCode.toString().startsWith('3'));

    // Balances
    const totalAssets = assets.reduce((sum, item) => sum + parseFloat(item.total_debit || 0) - parseFloat(item.total_credit || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + parseFloat(item.total_credit || 0) - parseFloat(item.total_debit || 0), 0);
    const totalEquity = equity.reduce((sum, item) => sum + parseFloat(item.total_credit || 0) - parseFloat(item.total_debit || 0), 0);

    const formatVal = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans">
            <Head title={`Financial Statement - ${period}`} />
            
            <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden">
                <button onClick={() => window.print()} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg hover:bg-emerald-500 active:scale-95 transition-all">
                    <Printer size={18} /> Print Document
                </button>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-12 shadow-sm border border-slate-200 min-h-[1056px] print:shadow-none print:border-none print:p-0">
                
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-black text-slate-900 uppercase">People's Multi-Purpose Cooperative</h1>
                    <p className="text-sm font-bold text-slate-600 mt-1 uppercase tracking-widest">{branch}</p>
                    <h2 className="text-xl font-bold text-emerald-700 mt-4 uppercase tracking-widest">Financial Statement</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">As of {period}</p>
                </div>

                <div className="space-y-8 text-sm">
                    {/* Assets */}
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-3">Assets</h3>
                        <div className="space-y-2">
                            {assets.map(item => {
                                const balance = parseFloat(item.total_debit) - parseFloat(item.total_credit);
                                return (
                                    <div key={item.accountCode} className="flex justify-between px-2 text-slate-700">
                                        <span>{item.accountCode} - {item.accountName}</span>
                                        <span className="font-mono">{formatVal(balance)}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between px-2 mt-4 pt-3 border-t border-slate-300 font-bold text-slate-900">
                            <span>Total Assets</span>
                            <span className="font-mono text-emerald-700">{formatVal(totalAssets)}</span>
                        </div>
                    </div>

                    {/* Liabilities */}
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-3 mt-8">Liabilities</h3>
                        <div className="space-y-2">
                            {liabilities.map(item => {
                                const balance = parseFloat(item.total_credit) - parseFloat(item.total_debit);
                                return (
                                    <div key={item.accountCode} className="flex justify-between px-2 text-slate-700">
                                        <span>{item.accountCode} - {item.accountName}</span>
                                        <span className="font-mono">{formatVal(balance)}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between px-2 mt-4 pt-3 border-t border-slate-300 font-bold text-slate-900">
                            <span>Total Liabilities</span>
                            <span className="font-mono">{formatVal(totalLiabilities)}</span>
                        </div>
                    </div>

                    {/* Equity */}
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-3 mt-8">Equity</h3>
                        <div className="space-y-2">
                            {equity.map(item => {
                                const balance = parseFloat(item.total_credit) - parseFloat(item.total_debit);
                                return (
                                    <div key={item.accountCode} className="flex justify-between px-2 text-slate-700">
                                        <span>{item.accountCode} - {item.accountName}</span>
                                        <span className="font-mono">{formatVal(balance)}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between px-2 mt-4 pt-3 border-t border-slate-300 font-bold text-slate-900">
                            <span>Total Equity</span>
                            <span className="font-mono">{formatVal(totalEquity)}</span>
                        </div>
                    </div>

                    {/* Balance Check */}
                    <div className="flex justify-between items-center px-4 py-4 mt-8 bg-slate-50 border-y-2 border-slate-900">
                        <span className="font-black text-lg text-slate-900 uppercase tracking-widest">Total Liabilities & Equity</span>
                        <span className="font-mono font-black text-xl text-emerald-700">
                            {formatVal(totalLiabilities + totalEquity)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}