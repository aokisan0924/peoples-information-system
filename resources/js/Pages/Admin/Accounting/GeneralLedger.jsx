import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { BookOpen, Calculator, FileText, Printer, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GeneralLedger({ summaries, filters }) {
    const [month, setMonth] = useState(filters.month);
    const [year, setYear] = useState(filters.year);

    const months = [
        { val: '01', label: 'January' }, { val: '02', label: 'February' },
        { val: '03', label: 'March' }, { val: '04', label: 'April' },
        { val: '05', label: 'May' }, { val: '06', label: 'June' },
        { val: '07', label: 'July' }, { val: '08', label: 'August' },
        { val: '09', label: 'September' }, { val: '10', label: 'October' },
        { val: '11', label: 'November' }, { val: '12', label: 'December' }
    ];

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('admin.accounting.ledger.index'), { month, year }, { preserveState: true });
    };

    // Helper to format currency or return "-" if zero
    const formatValue = (amount) => {
        const val = parseFloat(amount || 0);
        if (val === 0) return "-";
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
    };

    const grandTotalDebit = summaries.reduce((sum, s) => sum + parseFloat(s.total_debit || 0), 0);
    const grandTotalCredit = summaries.reduce((sum, s) => sum + parseFloat(s.total_credit || 0), 0);
    const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 0.01;

    return (
        <AdminSidebarLayout>
            <Head title={`General Ledger - ${filters.monthName} ${year}`}>
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            
            <div className="max-w-[90rem] mx-auto p-6 space-y-6 animate-in fade-in duration-500">
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <BookOpen className="text-indigo-600" size={28} /> {filters.monthName} {year} Summary
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Verify total debits and credits across all accounts.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                            <FileText size={16} className="text-blue-500" /> Statement of Operation
                        </button>
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                            <Calculator size={16} className="text-emerald-500" /> Financial Statement
                        </button>
                    </div>
                </div>

                {/* --- PERIOD SELECTOR --- */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center gap-3">
                    <form onSubmit={handleFilter} className="flex flex-1 gap-2 w-full">
                        <select value={month} onChange={e => setMonth(e.target.value)} className="rounded-xl border-slate-200 text-sm font-bold dark:bg-slate-800 dark:text-white min-w-[140px]">
                            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                        <select value={year} onChange={e => setYear(e.target.value)} className="rounded-xl border-slate-200 text-sm font-bold dark:bg-slate-800 dark:text-white">
                            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all">Generate Report</button>
                    </form>
                </div>

                {/* --- SUMMARY TABLE --- */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Account Code</th>
                                <th className="px-6 py-4">Account Name</th>
                                <th className="px-6 py-4 text-right">Total Debit</th>
                                <th className="px-6 py-4 text-right">Total Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {summaries.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-slate-400 font-bold italic">No data found for the selected period.</td>
                                </tr>
                            ) : (
                                <>
                                    {summaries.map(s => (
                                        <tr key={s.accountCode} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">{s.accountCode}</td>
                                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{s.accountName}</td>
                                            {/* Updated to display "-" if zero */}
                                            <td className="px-6 py-4 text-right font-mono text-emerald-600 font-bold">{formatValue(s.total_debit)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-rose-600 font-bold">{formatValue(s.total_credit)}</td>
                                        </tr>
                                    ))}
                                    
                                    <tr className={`${isBalanced ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30'} border-t-2 border-slate-200 dark:border-white/10`}>
                                        <td colSpan="2" className="px-6 py-5 text-right font-black uppercase tracking-widest text-[10px]">
                                            <div className="flex items-center justify-end gap-2">
                                                {isBalanced ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
                                                {isBalanced ? 'Balanced' : 'Out of Balance'}
                                            </div>
                                        </td>
                                        {/* Grand totals still show the full amount for accuracy */}
                                        <td className="px-6 py-5 text-right font-mono font-black text-lg text-emerald-700 dark:text-emerald-400">{formatValue(grandTotalDebit)}</td>
                                        <td className="px-6 py-5 text-right font-mono font-black text-lg text-rose-700 dark:text-rose-400">{formatValue(grandTotalCredit)}</td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminSidebarLayout>
    );
}