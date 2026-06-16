import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { 
    BookOpen, Calculator, FileText, CheckCircle2, AlertCircle, 
    MapPin, CalendarDays, ArrowUpRight, ArrowDownLeft, Scale, ChevronDown
} from 'lucide-react';

export default function GeneralLedger({ summaries = [], filters }) {
    const [branch, setBranch] = useState(filters.branch || 'Consolidated');
    const [month, setMonth] = useState(filters.month);
    const [year, setYear] = useState(filters.year);
    const [periodType, setPeriodType] = useState('ytd');

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
        router.get(route('admin.accounting.ledger.index'), { branch, month, year }, { preserveState: true });
    };

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
            
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
                
                {/* ─── HEADER SECTION ─── */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-[#0f1f1a] p-6 rounded-3xl border border-slate-200/60 dark:border-white/5 shadow-sm">
                    <div className="space-y-1.5 w-full lg:w-auto">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                                <BookOpen size={24} />
                            </div>
                            General Ledger
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 pt-1">
                            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-mono">
                                <MapPin size={14}/> {filters.branch}
                            </span>
                            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                            <span className="flex items-center gap-1.5">
                                <CalendarDays size={14}/> {filters.monthName} {year}
                            </span>
                        </div>
                    </div>

                    {/* Action Report Downloads */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                        <button 
                            onClick={() => window.open(route('admin.accounting.ledger.statement-of-operation', { branch, month, year, period_type: periodType }), '_blank')}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-95"
                        >
                            <FileText size={15} className="text-blue-500 dark:text-blue-400" /> Statement of Operation
                        </button>
                        <button 
                            onClick={() => window.open(route('admin.accounting.ledger.financial-statement', { branch, month, year, period_type: periodType }), '_blank')}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-95"
                        >
                            <Calculator size={15} className="text-emerald-500 dark:text-emerald-400" /> Financial Statement
                        </button>
                    </div>
                </div>

                {/* ─── LIVE SUMMARY STATS OVERVIEW ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#0f1f1a] p-4 rounded-2xl border border-slate-200/70 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <ArrowUpRight size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Debits</p>
                            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 truncate">{formatValue(grandTotalDebit)}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#0f1f1a] p-4 rounded-2xl border border-slate-200/70 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                            <ArrowDownLeft size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Credits</p>
                            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 truncate">{formatValue(grandTotalCredit)}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#0f1f1a] p-4 rounded-2xl border border-slate-200/70 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isBalanced ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                            <Scale size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ledger Status</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-sm font-black uppercase tracking-wide ${isBalanced ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                    {isBalanced ? 'Balanced' : 'Unbalanced'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── FILTER SUB-BAR ─── */}
                <div className="bg-white dark:bg-[#0f1f1a] p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end w-full">
                        <div className="md:col-span-4 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">Branch Entity</label>
                            <div className="relative">
                                <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold py-2.5 pl-3 pr-8 appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
                                    <option value="Consolidated">Consolidated (All Combined)</option>
                                    <option value="Main Office">Main Office</option>
                                    <option value="Cubao Satellite Office">Cubao Satellite Office</option>
                                    <option value="Fort Magsaysay Satellite Office">Fort Magsaysay Satellite Office</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">Accounting Month</label>
                            <div className="relative">
                                <select value={month} onChange={e => setMonth(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold py-2.5 pl-3 pr-8 appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
                                    {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">Fiscal Year</label>
                            <div className="relative">
                                {/* FIXED: Replaced hidden white text utility classes with clean dark/light configurations */}
                                <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold py-2.5 pl-3 pr-8 appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
                                    {[2022, 2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">Reporting Scope</label>
                            <div className="relative">
                                <select value={periodType} onChange={(e) => setPeriodType(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold py-2.5 pl-3 pr-8 appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="ytd">Year-To-Date</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 transition-all active:scale-95 whitespace-nowrap">
                                Load Ledger
                            </button>
                        </div>
                    </form>
                </div>

                {/* ─── SUMMARY MAIN LEDGER TABLE ─── */}
                <div className="bg-white dark:bg-[#0f1f1a] rounded-[2rem] border border-slate-200/70 dark:border-white/5 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                        <thead className="bg-slate-50/70 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-5">Account Code</th>
                                <th className="px-6 py-5">Account Name</th>
                                <th className="px-6 py-5 text-right">Total Debit</th>
                                <th className="px-6 py-5 text-right">Total Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {summaries.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-slate-400 font-bold italic bg-slate-50/20 dark:bg-transparent">
                                        No financial ledger records found for the selected period.
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {summaries.map(s => (
                                        <tr key={s.accountCode} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{s.accountCode}</td>
                                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{s.accountName}</td>
                                            <td className="px-6 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold tracking-tight">{formatValue(s.total_debit)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-rose-600 dark:text-rose-400 font-bold tracking-tight">{formatValue(s.total_credit)}</td>
                                        </tr>
                                    ))}
                                    
                                    {/* Grand Summary Rows */}
                                    <tr className={`${isBalanced ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'bg-rose-50/50 dark:bg-rose-950/20'} border-t-2 border-slate-200 dark:border-white/10`}>
                                        <td colSpan="2" className="px-6 py-6 text-right font-black uppercase tracking-widest text-[10px]">
                                            <div className="flex items-center justify-end gap-2">
                                                {isBalanced ? (
                                                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                                                ) : (
                                                    <AlertCircle size={16} className="text-rose-600 dark:text-rose-400" />
                                                )}
                                                <span className={`font-black text-xs ${isBalanced ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                                                    {isBalanced ? 'Trial Balance Balanced' : 'Trial Balance Discrepancy'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right font-mono font-black text-base sm:text-lg text-emerald-700 dark:text-emerald-400 tabular-nums">{formatValue(grandTotalDebit)}</td>
                                        <td className="px-6 py-6 text-right font-mono font-black text-base sm:text-lg text-rose-700 dark:text-rose-400 tabular-nums">{formatValue(grandTotalCredit)}</td>
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