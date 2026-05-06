import React from 'react';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

export default function StatementOfOperation({ data, branch, period }) {
    // Ihiwalay ang Revenue (4000) at Expenses (5000)
    const revenues = data.filter(d => d.accountCode.toString().startsWith('4'));
    const expenses = data.filter(d => d.accountCode.toString().startsWith('5'));

    // Normal balance ng Revenue ay Credit
    const totalRevenue = revenues.reduce((sum, item) => sum + parseFloat(item.total_credit || 0) - parseFloat(item.total_debit || 0), 0);
    
    // Normal balance ng Expense ay Debit
    const totalExpense = expenses.reduce((sum, item) => sum + parseFloat(item.total_debit || 0) - parseFloat(item.total_credit || 0), 0);
    
    const netIncome = totalRevenue - totalExpense;

    const formatVal = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans">
            <Head title={`Statement of Operation - ${period}`} />
            
            {/* Print Button (Hidden kapag piniprint na) */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden">
                <button onClick={() => window.print()} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg hover:bg-indigo-500 active:scale-95 transition-all">
                    <Printer size={18} /> Print Document
                </button>
            </div>

            {/* Printable Document */}
            <div className="max-w-4xl mx-auto bg-white p-12 shadow-sm border border-slate-200 min-h-[1056px] print:shadow-none print:border-none print:p-0">
                
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-black text-slate-900 uppercase">People's Multi-Purpose Cooperative</h1>
                    <p className="text-sm font-bold text-slate-600 mt-1 uppercase tracking-widest">{branch}</p>
                    <h2 className="text-xl font-bold text-indigo-700 mt-4 uppercase tracking-widest">Statement of Operation</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">For the period of {period}</p>
                </div>

                <div className="space-y-8 text-sm">
                    {/* Revenues Section */}
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-3">Revenues</h3>
                        <div className="space-y-2">
                            {revenues.map(item => {
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
                            <span>Total Revenues</span>
                            <span className="font-mono">{formatVal(totalRevenue)}</span>
                        </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-3 mt-8">Operating Expenses</h3>
                        <div className="space-y-2">
                            {expenses.map(item => {
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
                            <span>Total Operating Expenses</span>
                            <span className="font-mono">{formatVal(totalExpense)}</span>
                        </div>
                    </div>

                    {/* Net Income Summary */}
                    <div className="flex justify-between items-center px-4 py-4 mt-8 bg-slate-50 border-y-2 border-slate-900">
                        <span className="font-black text-lg text-slate-900 uppercase tracking-widest">Net Income (Loss)</span>
                        <span className={`font-mono font-black text-xl ${netIncome < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatVal(netIncome)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}