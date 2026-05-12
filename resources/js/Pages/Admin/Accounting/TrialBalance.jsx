import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Scale } from 'lucide-react';

export default function TrialBalance({ trialBalance, filters }) {
    const [month, setMonth] = useState(filters.month);
    const [year, setYear] = useState(filters.year);

    const formatCurrency = (val) => val > 0 ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val) : '-';
    const handleFilter = () => router.get(route('admin.accounting.reports.trial-balance'), { month, year }, { preserveState: true });

    const totals = trialBalance.reduce((acc, row) => {
        acc.pre_dr += row.pre_debit; acc.pre_cr += row.pre_credit; acc.adj_dr += row.adj_debit; acc.adj_cr += row.adj_credit; acc.fin_dr += row.adj_final_debit; acc.fin_cr += row.adj_final_credit;
        return acc;
    }, { pre_dr: 0, pre_cr: 0, adj_dr: 0, adj_cr: 0, fin_dr: 0, fin_cr: 0 });

    return (
        <AdminSidebarLayout>
            <Head title="Trial Balance" />
            <div className="max-w-[100rem] mx-auto p-4 sm:p-6 space-y-6 pb-20">
                <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl flex justify-between items-center">
                    <h1 className="text-3xl font-black text-white flex gap-3 uppercase"><Scale className="text-blue-400" /> Trial Balance</h1>
                    <div className="flex bg-white/5 p-2 rounded-xl gap-2">
                        <select value={month} onChange={e => setMonth(e.target.value)} className="bg-slate-900 border-0 text-white font-bold focus:ring-0 rounded-lg">{['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{m}</option>)}</select>
                        <select value={year} onChange={e => setYear(e.target.value)} className="bg-slate-900 border-0 text-white font-bold focus:ring-0 rounded-lg">{[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
                        <button onClick={handleFilter} className="px-4 py-1.5 bg-blue-500 text-white font-bold rounded-lg uppercase">Generate</button>
                    </div>
                </div>

                <div className="bg-slate-950 rounded-[2rem] shadow-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[1000px] border-collapse">
                        <thead className="bg-slate-900/95 text-[10px] font-black uppercase text-slate-400">
                            <tr><th rowSpan="2" className="px-6 py-4 border-r border-white/5">Account Title</th><th colSpan="2" className="text-center border-b border-r border-white/5">Unadjusted Trial Balance</th><th colSpan="2" className="text-center border-b border-r border-white/5 text-amber-400">Adjustments</th><th colSpan="2" className="text-center border-b border-white/5 text-emerald-400">Adjusted Trial Balance</th></tr>
                            <tr className="text-right"><th className="px-6 py-2 border-r border-white/5">Debit</th><th className="px-6 py-2 border-r border-white/5">Credit</th><th className="px-6 py-2 border-r border-white/5">Debit</th><th className="px-6 py-2 border-r border-white/5">Credit</th><th className="px-6 py-2 border-r border-white/5">Debit</th><th className="px-6 py-2">Credit</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {trialBalance.map((row) => (
                                <tr key={row.accountCode} className="hover:bg-white/5 font-mono text-xs">
                                    <td className="px-6 py-3 border-r border-white/5 font-bold">{row.accountCode} - {row.accountName}</td>
                                    <td className="px-6 py-3 text-right border-r border-white/5">{formatCurrency(row.pre_debit)}</td><td className="px-6 py-3 text-right border-r border-white/5">{formatCurrency(row.pre_credit)}</td>
                                    <td className="px-6 py-3 text-right border-r border-white/5 text-amber-400/80">{formatCurrency(row.adj_debit)}</td><td className="px-6 py-3 text-right border-r border-white/5 text-amber-400/80">{formatCurrency(row.adj_credit)}</td>
                                    <td className="px-6 py-3 text-right border-r border-white/5 text-emerald-400 font-bold">{formatCurrency(row.adj_final_debit)}</td><td className="px-6 py-3 text-right text-emerald-400 font-bold">{formatCurrency(row.adj_final_credit)}</td>
                                </tr>
                            ))}
                            <tr className="bg-slate-900 font-mono font-black text-sm">
                                <td className="px-6 py-5 border-r border-white/5 text-right uppercase text-slate-500">Totals</td>
                                <td className="px-6 py-5 text-right border-r border-white/5 text-white">{formatCurrency(totals.pre_dr)}</td><td className="px-6 py-5 text-right border-r border-white/5 text-white">{formatCurrency(totals.pre_cr)}</td>
                                <td className="px-6 py-5 text-right border-r border-white/5 text-amber-400">{formatCurrency(totals.adj_dr)}</td><td className="px-6 py-5 text-right border-r border-white/5 text-amber-400">{formatCurrency(totals.adj_cr)}</td>
                                <td className="px-6 py-5 text-right border-r border-white/5 text-emerald-400 underline decoration-double">{formatCurrency(totals.fin_dr)}</td><td className="px-6 py-5 text-right text-emerald-400 underline decoration-double">{formatCurrency(totals.fin_cr)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminSidebarLayout>
    );
}