import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import {
    Search, User, FileText, CheckCircle2, Clock, AlertCircle,
    Loader2, Receipt, Lock, LayoutList, Layers, XCircle, Hash,
    CreditCard, ChevronRight, Banknote, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (amount) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition dark:[color-scheme:dark]";

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const s = (status || '').toLowerCase();
    let cls  = 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50';
    let Icon = Clock;
    if (s === 'paid')    { cls = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'; Icon = CheckCircle2; }
    if (s === 'partial') { cls = 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'; Icon = Clock; }
    if (s === 'overdue') { cls = 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400';             Icon = AlertCircle;  }
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cls}`}>
            <Icon size={11} className="text-current shrink-0" /> {status}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LoanCollection() {
    const [activeTab, setActiveTab] = useState('individual');

    return (
        <AdminSidebarLayout>
            <Head title="Loan Collections Terminal">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="space-y-5 pb-10">

                {/* ── PAGE HEADER ─────────────────────────────────────────── */}
                <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-sm">
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow-lg shadow-emerald-500/25 shrink-0">
                                <Receipt className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Collections Terminal</h1>
                                <p className="text-xs sm:text-sm text-slate-400 dark:text-white/40 font-medium mt-0.5">Post individual or batch loan remittances.</p>
                            </div>
                        </div>

                        {/* Tab switcher */}
                        <div className="flex p-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-2xl gap-1 w-full sm:w-auto">
                            {[
                                { id: 'individual', label: 'Individual', icon: User,       accent: 'emerald' },
                                { id: 'bulk',       label: 'Bulk Batch', icon: LayoutList,  accent: 'indigo'  },
                            ].map(tab => {
                                const active = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                                            active
                                                ? tab.accent === 'emerald'
                                                    ? 'bg-white dark:bg-white/10 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                                    : 'bg-white dark:bg-white/10 text-indigo-700 dark:text-indigo-400 shadow-sm'
                                                : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70'
                                        }`}
                                    >
                                        <tab.icon size={14} className="text-current shrink-0" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── TAB CONTENT ─────────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                    >
                        {activeTab === 'individual' ? <IndividualTerminal /> : <BulkTerminal />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </AdminSidebarLayout>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. INDIVIDUAL TERMINAL
// ═════════════════════════════════════════════════════════════════════════════
function IndividualTerminal() {
    const [searchQuery,      setSearchQuery]      = useState('');
    const [searchResults,    setSearchResults]    = useState([]);
    const [selectedMember,   setSelectedMember]   = useState(null);
    const [loans,            setLoans]            = useState([]);
    const [activeLoan,       setActiveLoan]       = useState(null);
    const [schedule,         setSchedule]         = useState([]);
    const [isLoading,        setIsLoading]        = useState(false);
    const [targetInstallment,setTargetInstallment]= useState(null);
    const [referenceNumber,  setReferenceNumber]  = useState('');
    const [paymentAmount,    setPaymentAmount]    = useState('');
    const [legacyWarning,    setLegacyWarning]    = useState(null);
    const [isSubmitting,     setIsSubmitting]     = useState(false);
    const searchRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([]); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length < 2) return setSearchResults([]);
        const t = setTimeout(async () => {
            try {
                const { data } = await axios.get(route('admin.accounting.loans.search'), { params: { search: searchQuery } });
                setSearchResults(data);
            } catch { toast.error('Error searching loans.'); }
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const handleSelectLoan = async (result) => {
        setIsLoading(true);
        setSelectedMember({ id: result.memberId, firstName: result.firstName, lastName: result.lastName });
        setSearchQuery(''); setSearchResults([]);
        try {
            const { data } = await axios.get(route('admin.accounting.loans.member-details', { id: result.memberId, loanId: result.loanId }));
            setLoans(data.loans);
            setActiveLoan(data.activeLoan);
            setSchedule(data.schedule);
            const next = data.schedule.find(i => i.status !== 'paid') || null;
            setTargetInstallment(next);
            setPaymentAmount(next ? Math.max(0, Number(next.amountDue) - Number(next.amountPaid || 0)).toFixed(2) : '');
            setLegacyWarning(data.legacyWarning || null);
            setReferenceNumber('');
        } catch { toast.error("Failed to load member's loan schedule."); }
        finally { setIsLoading(false); }
    };

    const handleLoanSwitch = async (e) => {
        setIsLoading(true);
        try {
            const { data } = await axios.get(route('admin.accounting.loans.member-details', { id: selectedMember.id, loanId: parseInt(e.target.value, 10) }));
            setLoans(data.loans);
            setActiveLoan(data.activeLoan);
            setSchedule(data.schedule);
            const next = data.schedule.find(i => i.status !== 'paid') || null;
            setTargetInstallment(next);
            setPaymentAmount(next ? Math.max(0, Number(next.amountDue) - Number(next.amountPaid || 0)).toFixed(2) : '');
            setLegacyWarning(data.legacyWarning || null);
            setReferenceNumber('');
        } catch { toast.error('Failed to switch loan.'); }
        finally { setIsLoading(false); }
    };

    const handlePostPayment = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data } = await axios.post(route('admin.accounting.loans.post-amortization'), {
                loanId: activeLoan.id,
                installmentNumber: targetInstallment.installmentNumber,
                amountPaid: Number(paymentAmount),
                referenceNumber,
            });
            if (data.success) {
                toast.success(data.message);
                const refreshed = await axios.get(route('admin.accounting.loans.member-details', { id: selectedMember.id, loanId: activeLoan.id }));
                setSchedule(refreshed.data.schedule);
                const next = refreshed.data.schedule.find(i => i.status !== 'paid') || null;
                setTargetInstallment(next);
                setPaymentAmount(next ? Math.max(0, Number(next.amountDue) - Number(next.amountPaid || 0)).toFixed(2) : '');
                setReferenceNumber('');
            }
        } catch (err) { toast.error(err.response?.data?.message || 'Error posting payment.'); }
        finally { setIsSubmitting(false); }
    };

    const paidCount    = schedule.filter(r => r.status === 'paid').length;
    const overdueCount = schedule.filter(r => r.status === 'overdue').length;
    const progress     = schedule.length > 0 ? Math.round((paidCount / schedule.length) * 100) : 0;

    return (
        <div className="space-y-4 sm:space-y-5">

            {/* ── SEARCH ──────────────────────────────────────────────────── */}
            <div className="relative z-30" ref={searchRef}>
                <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-4 sm:p-5 shadow-sm">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">Find Active Loan Account</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/30 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by member name, ID, or loan reference..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={`${inputCls} pl-11`}
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/20 transition">
                                <X size={13} className="text-current" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Dropdown results */}
                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -4 }}
                            transition={{ duration: 0.13 }}
                            className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#0f1a14] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-50 dark:divide-white/[0.04] max-h-72 overflow-y-auto z-40"
                        >
                            {searchResults.map(result => (
                                <button key={result.loanId} onClick={() => handleSelectLoan(result)}
                                    className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group"
                                >
                                    <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 grid place-items-center shrink-0">
                                        <FileText size={15} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {result.firstName} {result.lastName}
                                            <span className="text-slate-400 dark:text-white/40 font-normal ml-2">({result.loanType})</span>
                                        </p>
                                        <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                                            {result.loanReference} · ₱{parseFloat(result.loanAmount).toLocaleString('en-US')}
                                        </p>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-300 dark:text-white/20 shrink-0 group-hover:text-emerald-500 transition-colors" />
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── WORKSPACE ───────────────────────────────────────────────── */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-28 bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
                    <p className="text-xs font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Retrieving Loan Profile...</p>
                </div>
            ) : selectedMember && activeLoan ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">

                    {/* Left: schedule table */}
                    <div className="lg:col-span-8 bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: '72vh' }}>

                        {/* Table header */}
                        <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-0.5">Amortization Timeline</p>
                                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                                        {selectedMember.firstName} {selectedMember.lastName}
                                    </p>
                                    {loans.length > 1 ? (
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-xs text-slate-400 dark:text-white/40 font-medium">Loan:</span>
                                            <select value={activeLoan.id} onChange={handleLoanSwitch}
                                                className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border-none outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500 dark:[color-scheme:dark]"
                                            >
                                                {loans.map(l => (
                                                    <option key={l.id} value={l.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                                        {l.loanReference} — ₱{parseFloat(l.loanAmount).toLocaleString('en-US')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
                                            Ref: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{activeLoan.loanReference}</span>
                                            &nbsp;·&nbsp;Principal: <span className="font-mono font-bold">₱{parseFloat(activeLoan.loanAmount).toLocaleString('en-US')}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Progress bar + stats */}
                                <div className="sm:text-right shrink-0 min-w-[160px]">
                                    <div className="flex items-center sm:justify-end gap-3 mb-2">
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{paidCount} paid</span>
                                        {overdueCount > 0 && <span className="text-[10px] font-bold text-rose-500">{overdueCount} overdue</span>}
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/30">{schedule.length} total</span>
                                    </div>
                                    <div className="w-full sm:w-40 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1 font-medium">{progress}% complete</p>
                                </div>
                            </div>
                        </div>

                        {/* Schedule table */}
                        <div className="overflow-x-auto flex-1 overflow-y-auto">
                            <table className="w-full text-left" style={{ minWidth: '420px' }}>
                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0f1a14] border-b border-slate-100 dark:border-white/[0.06]">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                                        <th className="px-4 sm:px-6 py-3.5">Term</th>
                                        <th className="px-4 sm:px-6 py-3.5">Due Date</th>
                                        <th className="px-4 sm:px-6 py-3.5 text-right">Amount</th>
                                        <th className="px-4 sm:px-6 py-3.5 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04] text-sm">
                                    {schedule.map(row => {
                                        const isPaid     = row.status === 'paid';
                                        const isOverdue  = row.status === 'overdue';
                                        const isSelected = targetInstallment?.installmentNumber === row.installmentNumber;
                                        return (
                                            <tr
                                                key={row.installmentNumber}
                                                onClick={() => { if (!isPaid) { setTargetInstallment(row); setPaymentAmount(Math.max(0, Number(row.amountDue) - Number(row.amountPaid || 0)).toFixed(2)); } }}
                                                className={`transition-colors cursor-pointer ${
                                                    isSelected   ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/[0.08]' :
                                                    isPaid       ? 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] hover:bg-emerald-50/50 dark:hover:bg-emerald-500/[0.04]' :
                                                    isOverdue    ? 'bg-rose-500/[0.03] dark:bg-rose-500/[0.02] hover:bg-rose-50/50 dark:hover:bg-rose-500/[0.04]' :
                                                    'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                                                }`}
                                            >
                                                <td className="px-4 sm:px-6 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                                                    {row.installmentNumber}
                                                    <span className="text-slate-400 dark:text-white/30 font-normal"> / {activeLoan.numberOfPayments}</span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3.5 text-slate-500 dark:text-white/50 text-xs">{row.dueDate}</td>
                                                <td className="px-4 sm:px-6 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">{fmt(row.amountDue)}</td>
                                                <td className="px-4 sm:px-6 py-3.5 text-center"><StatusBadge status={row.status} /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: payment panel */}
                    <div className="lg:col-span-4 space-y-4">

                        {/* Loan summary card */}
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/70 mb-1">Monthly Amortization</p>
                            <p className="text-2xl sm:text-3xl font-black font-mono">{fmt(activeLoan.monthlyAmortization)}</p>
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/20 text-xs text-emerald-100/70 font-medium">
                                <span>Principal: <strong className="text-white">{fmt(activeLoan.loanAmount)}</strong></span>
                                <span>Term: <strong className="text-white">{activeLoan.numberOfPayments} mo.</strong></span>
                            </div>
                        </div>

                        {/* Post remittance panel */}
                        <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                                <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 grid place-items-center shrink-0">
                                    <Receipt size={15} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white/90">Post Remittance</p>
                            </div>

                            <div className="p-5">
                                {targetInstallment ? (
                                    <form onSubmit={handlePostPayment} className="space-y-4">
                                        {/* Target installment highlight */}
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Target Installment</p>
                                            <div className="flex items-end justify-between gap-2">
                                                <div>
                                                    <p className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                                                        {targetInstallment.installmentNumber}
                                                        <span className="text-sm text-emerald-500/70 ml-1">/ {activeLoan.numberOfPayments}</span>
                                                    </p>
                                                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Due: {targetInstallment.dueDate}</p>
                                                </div>
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide ${
                                                    targetInstallment.status === 'overdue'
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                }`}>{targetInstallment.status}</span>
                                            </div>
                                        </div>

                                        {legacyWarning && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">{legacyWarning}</div>}
                                        {/* Partial or full payment amount */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 flex items-center gap-1.5">
                                                Payment Amount
                                            </label>
                                            <input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className={inputCls} />
                                            <p className="text-[10px] text-slate-400">Outstanding for this period: {fmt(Number(targetInstallment.amountDue) - Number(targetInstallment.amountPaid || 0))}. Excess is applied to succeeding periods.</p>
                                        </div>

                                        {/* Reference input */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                                                Reference / OR Number <span className="text-rose-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={referenceNumber}
                                                onChange={e => setReferenceNumber(e.target.value)}
                                                placeholder="Enter receipt reference..."
                                                required
                                                className={inputCls}
                                            />
                                        </div>

                                        <button type="submit" disabled={isSubmitting || !referenceNumber || Number(paymentAmount) <= 0 || !!legacyWarning}
                                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
                                        >
                                            {isSubmitting
                                                ? <><Loader2 size={15} className="animate-spin text-current" /> Processing...</>
                                                : <><CheckCircle2 size={15} className="text-current" /> Confirm Payment</>
                                            }
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center py-10 px-4">
                                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 grid place-items-center mx-auto mb-3">
                                            <CheckCircle2 className="h-7 w-7 text-emerald-500 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Loan Fully Settled</p>
                                        <p className="text-xs text-slate-400 dark:text-white/30 mt-1">No active installments pending.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl shadow-sm">
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-white/5 grid place-items-center mb-4">
                        <Search className="h-8 w-8 text-slate-300 dark:text-white/20" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-white/40 text-center max-w-xs">
                        Search and select an active loan account above to begin posting remittances.
                    </p>
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. BULK BATCH TERMINAL
// ═════════════════════════════════════════════════════════════════════════════
function BulkTerminal() {
    const [searchQuery,      setSearchQuery]      = useState('');
    const [searchResults,    setSearchResults]    = useState([]);
    const [collectionQueue,  setCollectionQueue]  = useState([]);
    const [globalReference,  setGlobalReference]  = useState('');
    const [isSubmitting,     setIsSubmitting]     = useState(false);
    const [isSearching,      setIsSearching]      = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([]); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length < 2) return setSearchResults([]);
        setIsSearching(true);
        const t = setTimeout(async () => {
            try {
                const { data } = await axios.get(route('admin.accounting.loans.search'), { params: { search: searchQuery } });
                setSearchResults(data);
            } catch { toast.error('Search failed.'); }
            finally { setIsSearching(false); }
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const handleAddToQueue = async (result) => {
        if (collectionQueue.some(i => i.loanId === result.loanId)) {
            return toast.error(`${result.firstName}'s loan is already in the queue.`);
        }
        setSearchQuery(''); setSearchResults([]);
        try {
            const { data } = await axios.get(route('admin.accounting.loans.member-details', { id: result.memberId, loanId: result.loanId }));
            const nextUnpaid = data.schedule.find(i => i.status !== 'paid');
            if (!nextUnpaid) return toast.error(`Loan ${result.loanReference} is already fully paid.`);
            setCollectionQueue(prev => [...prev, {
                queueId: crypto.randomUUID(),
                loanId: result.loanId,
                memberId: result.memberId,
                memberName: `${result.firstName} ${result.lastName}`,
                loanReference: result.loanReference,
                installmentNumber: nextUnpaid.installmentNumber,
                numberOfPayments: data.activeLoan.numberOfPayments,
                dueDate: nextUnpaid.dueDate,
                amountDue: parseFloat(nextUnpaid.amountDue),
                referenceNumber: globalReference || '',
            }]);
            toast.success(`Added ${result.firstName} to batch queue.`);
        } catch { toast.error('Failed to fetch loan details.'); }
    };

    const removeFromQueue    = (queueId) => setCollectionQueue(p => p.filter(i => i.queueId !== queueId));
    const updateRowReference = (queueId, val) => setCollectionQueue(p => p.map(i => i.queueId === queueId ? { ...i, referenceNumber: val } : i));
    const applyGlobalReference = () => {
        if (!globalReference) return toast.error('Enter a global reference first.');
        setCollectionQueue(p => p.map(i => ({ ...i, referenceNumber: globalReference })));
        toast.success('Applied to all rows.');
    };

    const handleBulkPost = async () => {
        if (!collectionQueue.length) return;
        const missing = collectionQueue.filter(i => !i.referenceNumber?.trim());
        if (missing.length > 0) return toast.error(`${missing.length} row${missing.length > 1 ? 's' : ''} missing Reference / OR numbers.`);
        setIsSubmitting(true);
        try {
            const { data } = await axios.post(route('admin.accounting.loans.post-bulk'), {
                payments: collectionQueue.map(i => ({ loanId: i.loanId, installmentNumber: i.installmentNumber, amountPaid: i.amountDue, referenceNumber: i.referenceNumber }))
            });
            if (data.success) {
                toast.success(data.message, { duration: 4000 });
                setCollectionQueue([]);
                setGlobalReference('');
            }
        } catch (err) { toast.error(err.response?.data?.message || 'An error occurred.'); }
        finally { setIsSubmitting(false); }
    };

    const totalBatchAmount = collectionQueue.reduce((sum, i) => sum + i.amountDue, 0);

    return (
        <div className="space-y-4 sm:space-y-5">

            {/* ── SEARCH + GLOBAL REF ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

                {/* Search */}
                <div className="relative z-30" ref={searchRef}>
                    <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-4 shadow-sm">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">Search & Add to Batch</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/30 pointer-events-none" />
                            <input type="text" placeholder="Search by name, ID, or loan reference..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className={`${inputCls} pl-11 pr-10`} />
                            {isSearching
                                ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 animate-spin" />
                                : searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40 hover:bg-slate-200 transition"><X size={13} className="text-current" /></button>
                            }
                        </div>
                    </div>

                    <AnimatePresence>
                        {searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -4 }} transition={{ duration: 0.13 }}
                                className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#0f1a14] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-50 dark:divide-white/[0.04] max-h-64 overflow-y-auto z-40"
                            >
                                {searchResults.map(result => (
                                    <button key={result.loanId} onClick={() => handleAddToQueue(result)}
                                        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.06] transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 grid place-items-center shrink-0">
                                                <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{result.firstName} {result.lastName}</p>
                                                <p className="text-xs font-mono text-indigo-500 dark:text-indigo-400 mt-0.5 truncate">{result.loanReference}</p>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 rounded-lg shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                                            + Add
                                        </span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Global reference */}
                <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-4 shadow-sm">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">Batch OR / Reference Number</label>
                    <div className="flex gap-2.5">
                        <div className="relative flex-1">
                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/30 pointer-events-none" />
                            <input type="text" placeholder="Enter global reference..." value={globalReference} onChange={e => setGlobalReference(e.target.value)}
                                className={`${inputCls} pl-10`} />
                        </div>
                        <button onClick={applyGlobalReference}
                            className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-xs font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/20 transition-all active:scale-95 whitespace-nowrap"
                        >Apply All</button>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-white/25 mt-2 font-medium">Applies this reference to all queue entries at once.</p>
                </div>
            </div>

            {/* ── BATCH QUEUE TABLE ───────────────────────────────────────── */}
            <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">

                {/* Queue header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 grid place-items-center shrink-0">
                            <LayoutList size={16} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">Pending Collection Batch</p>
                            <p className="text-xs text-slate-400 dark:text-white/30 font-medium mt-0.5">
                                {collectionQueue.length} {collectionQueue.length === 1 ? 'record' : 'records'} staged
                            </p>
                        </div>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-0.5">Total Batch Value</p>
                        <p className="font-mono text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">{fmt(totalBatchAmount)}</p>
                    </div>
                </div>

                {/* Queue body */}
                {collectionQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-white/20">
                        <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-white/5 grid place-items-center mb-4">
                            <Layers size={28} className="text-slate-300 dark:text-white/20" />
                        </div>
                        <p className="text-sm font-semibold text-slate-400 dark:text-white/30">Batch queue is empty</p>
                        <p className="text-xs text-slate-300 dark:text-white/20 mt-1">Search and add records using the input above.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm" style={{ minWidth: '640px' }}>
                                <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06]">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                                        <th className="px-5 lg:px-6 py-4">Borrower & Reference</th>
                                        <th className="px-5 lg:px-6 py-4">Term / Due</th>
                                        <th className="px-5 lg:px-6 py-4">Amount Due</th>
                                        <th className="px-5 lg:px-6 py-4">Receipt / OR No.</th>
                                        <th className="px-5 lg:px-6 py-4 text-center">Del</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                                    {collectionQueue.map(item => (
                                        <tr key={item.queueId} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 lg:px-6 py-4">
                                                <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.memberName}</p>
                                                <p className="font-mono text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">{item.loanReference}</p>
                                            </td>
                                            <td className="px-5 lg:px-6 py-4">
                                                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{item.installmentNumber} / {item.numberOfPayments}</p>
                                                <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{item.dueDate}</p>
                                            </td>
                                            <td className="px-5 lg:px-6 py-4">
                                                <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 select-none">
                                                    <Lock size={11} className="text-slate-400 dark:text-white/30 shrink-0" />
                                                    <span className="font-mono font-black text-slate-800 dark:text-white text-sm">{fmt(item.amountDue)}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 lg:px-6 py-4">
                                                <input type="text" value={item.referenceNumber} onChange={e => updateRowReference(item.queueId, e.target.value)} placeholder="Enter OR..."
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/40 transition placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-white/30" />
                                            </td>
                                            <td className="px-5 lg:px-6 py-4 text-center">
                                                <button onClick={() => removeFromQueue(item.queueId)}
                                                    className="h-8 w-8 grid place-items-center rounded-xl text-slate-300 dark:text-white/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                                                    <XCircle size={17} className="text-current" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y divide-slate-50 dark:divide-white/[0.04]">
                            {collectionQueue.map(item => (
                                <div key={item.queueId} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{item.memberName}</p>
                                            <p className="font-mono text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">{item.loanReference}</p>
                                            <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">Term {item.installmentNumber}/{item.numberOfPayments} · {item.dueDate}</p>
                                        </div>
                                        <button onClick={() => removeFromQueue(item.queueId)} className="h-8 w-8 grid place-items-center rounded-xl text-slate-300 dark:text-white/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 transition-colors shrink-0 ml-3">
                                            <XCircle size={17} className="text-current" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2.5 items-center">
                                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/10 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 select-none shrink-0">
                                            <Lock size={11} className="text-slate-400 dark:text-white/30 shrink-0" />
                                            <span className="font-mono font-black text-slate-800 dark:text-white text-sm">{fmt(item.amountDue)}</span>
                                        </div>
                                        <input type="text" value={item.referenceNumber} onChange={e => updateRowReference(item.queueId, e.target.value)} placeholder="Enter OR No..."
                                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/40 transition placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-white/30" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer / Post button */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                            <p className="text-xs text-slate-400 dark:text-white/30 font-medium hidden sm:block">
                                All rows must have a Reference / OR Number before posting.
                            </p>
                            <button onClick={handleBulkPost} disabled={isSubmitting}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                            >
                                {isSubmitting
                                    ? <><Loader2 size={15} className="animate-spin text-current" /> Posting...</>
                                    : <><CheckCircle2 size={15} className="text-current" /> Post {collectionQueue.length} {collectionQueue.length === 1 ? 'Remittance' : 'Remittances'}</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
