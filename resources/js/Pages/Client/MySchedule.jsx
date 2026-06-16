import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    CheckCircle2, AlertCircle, Clock, ShieldCheck, FileText 
} from 'lucide-react';

export default function MySchedule(props) {
    // Explicitly destructuring from the props object
    const { loans = [], activeLoan, schedule = [] } = props;

    const [selectedLoanId, setSelectedLoanId] = useState(activeLoan?.id || '');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    const handleLoanSwitch = (e) => {
        const id = e.target.value;
        setSelectedLoanId(id);
        // Pointing to the specific route to reload schedule data
        router.get(route('client.loans.schedule'), { loanId: id }, { preserveState: true });
    };

    const paidInstallments = schedule.filter(row => row.status === 'paid').length;
    const remainingInstallments = schedule.length - paidInstallments;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#080e0c] p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <Head title="My Loan Schedule" />
            
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* ─── BANNER HEADER ─── */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-md text-emerald-100">
                                Member Account Workspace
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">My Loan Portfolio</h1>
                            <p className="text-emerald-100/70 text-xs sm:text-sm mt-1 font-medium">
                                Monitor your amortization lifecycle milestones, paid records, and remaining terms.
                            </p>
                        </div>

                        {loans.length > 1 && (
                            <div className="w-full sm:w-64">
                                <label className="block text-[10px] uppercase tracking-wider font-bold text-emerald-200 mb-1 pl-1">Switch Loan Contract</label>
                                <select value={selectedLoanId} onChange={handleLoanSwitch} className="w-full rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-white/30 cursor-pointer [&>option]:text-slate-900">
                                    {loans.map(l => (
                                        <option key={l.id} value={l.id}>Ref: {l.loanReference} ({l.loanType})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {!activeLoan ? (
                    <div className="bg-white dark:bg-[#0f1f1a] rounded-3xl p-12 text-center border border-slate-200 dark:border-white/5 shadow-sm">
                        <ShieldCheck className="mx-auto h-12 w-12 text-slate-300 dark:text-white/20 mb-3" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">No Active Loans Identified</h3>
                        <p className="text-sm text-slate-400 mt-1">You currently have no recorded outstanding loan products attached to your profile.</p>
                    </div>
                ) : (
                    <>
                        {/* ─── SUMMARY SCOREBOARD OVERVIEW ─── */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-[#0f1f1a] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Principal Released</p>
                                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-1">{formatCurrency(activeLoan.loanAmount)}</p>
                            </div>
                            <div className="bg-white dark:bg-[#0f1f1a] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Term Progress</p>
                                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-1">{paidInstallments} / {activeLoan.numberOfPayments} Mo.</p>
                            </div>
                            <div className="bg-white dark:bg-[#0f1f1a] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Payments Made</p>
                                <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                                    {formatCurrency(schedule.filter(r => r.status === 'paid').reduce((sum, r) => sum + parseFloat(r.amountPaid || 0), 0))}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-[#0f1f1a] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remaining Terms</p>
                                <p className="text-base sm:text-lg font-black text-rose-500 dark:text-rose-400 font-mono mt-1">{remainingInstallments} Months</p>
                            </div>
                        </div>

                        {/* ─── LIVE COLOR-CODED AMORTIZATION TERM TABLE ─── */}
                        <div className="bg-white dark:bg-[#0f1f1a] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={14} className="text-slate-400" /> Contract Term Matrix Breakdown
                                </h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4">Installment Milestone</th>
                                            <th className="px-6 py-4">Target Due Date</th>
                                            <th className="px-6 py-4 text-right">Amount Payable</th>
                                            <th className="px-6 py-4 text-center">Status Flag</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-xs">
                                        {schedule.map((row) => {
                                            let rowColorStyle = "text-slate-700 dark:text-slate-300 hover:bg-slate-100/40 dark:hover:bg-white/[0.01]";
                                            let statusPillStyle = "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-transparent";
                                            
                                            if (row.status === 'paid') {
                                                rowColorStyle = "bg-emerald-500/5 dark:bg-emerald-500/[0.03] text-emerald-900 dark:text-emerald-300 font-semibold";
                                                statusPillStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
                                            } else if (row.status === 'overdue') {
                                                rowColorStyle = "bg-rose-500/5 dark:bg-rose-500/[0.03] text-rose-900 dark:text-rose-300 font-semibold";
                                                statusPillStyle = "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
                                            }

                                            return (
                                                <tr key={row.installmentNumber} className={`transition-colors duration-150 ${rowColorStyle}`}>
                                                    <td className="px-6 py-4 font-bold flex items-center gap-2">
                                                        <span>{row.installmentNumber} / {activeLoan.numberOfPayments}</span>
                                                    </td>
                                                    <td className="px-6 py-4 font-sans text-slate-500 dark:text-slate-400 text-xs">
                                                        {row.dueDate}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black tracking-tight text-sm">
                                                        {formatCurrency(row.amountDue)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-sans">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide transition-all ${statusPillStyle}`}>
                                                            {row.status === 'paid' && <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" />}
                                                            {row.status === 'overdue' && <AlertCircle size={11} className="text-rose-600 dark:text-rose-400" />}
                                                            {row.status === 'unpaid' && <Clock size={11} className="text-slate-400 dark:text-slate-500" />}
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}