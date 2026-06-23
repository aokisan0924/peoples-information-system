import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Archive, CheckCircle2, Download, FileArchive,
    Loader2, AlertTriangle, X, SquareCheck, Square,
    Minus, RefreshCw, Users, BadgeCheck, PackageOpen, ListFilter
} from 'lucide-react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, description, confirmLabel, confirmClass, onConfirm, onCancel, isLoading }) {
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onCancel]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm" onClick={onCancel} />
                    <motion.div
                        className="relative w-full max-w-sm bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1,    y: 0   }}
                        exit={{   opacity: 0, scale: 0.95, y: -10  }}
                        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                    >
                        {/* Amber accent bar */}
                        <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 to-orange-400" />

                        <div className="p-5">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 grid place-items-center shrink-0">
                                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>
                                </div>
                                <button onClick={onCancel} className="h-7 w-7 grid place-items-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition shrink-0">
                                    <X size={13} />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition active:scale-95 ${confirmClass}`}
                                >
                                    {isLoading && <Loader2 size={13} className="animate-spin" />}
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
    const colors = {
        slate:   'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
        indigo:  'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
        amber:   'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    };
    return (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
            <span className={`h-9 w-9 grid place-items-center rounded-xl shrink-0 ${colors[color]}`}>
                <Icon size={16} />
            </span>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide truncate">{label}</p>
                <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums leading-tight">{value}</p>
            </div>
        </div>
    );
}

// ─── CUSTOM CHECKBOX ──────────────────────────────────────────────────────────
function Checkbox({ checked, indeterminate = false, onChange, disabled = false }) {
    const ref = React.useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
        <label className="relative flex items-center justify-center cursor-pointer group">
            <input
                ref={ref}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="sr-only peer"
            />
            <div className={`h-4.5 w-4.5 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all
                ${checked || indeterminate
                    ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'}
                ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
            `}>
                {indeterminate && !checked && <Minus size={10} className="text-white" strokeWidth={3} />}
                {checked && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
            </div>
        </label>
    );
}

// ─── SKELETON ROW ─────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="border-b border-slate-100 dark:border-slate-700">
            {[1, 2, 3, 4, 5].map(i => (
                <td key={i} className="px-5 py-4">
                    <div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse" style={{ width: `${[24, 80, 60, 70, 50][i - 1]}%` }} />
                </td>
            ))}
        </tr>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function BillingWorkspace() {
    const [loans,      setLoans]      = useState([]);
    const [selected,   setSelected]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [approving,  setApproving]  = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [confirm,    setConfirm]    = useState(false);
    const [filterCd,   setFilterCd]   = useState(false); // show only CD-eligible rows

    // ── FETCH ──────────────────────────────────────────────────────────────────
    const fetchLoans = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('admin.accounting.billing.pending'));
            setLoans(data);
        } catch {
            toast.error('Failed to load pending loans. Please refresh.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLoans(); }, [fetchLoans]);

    // ── DERIVED STATS ─────────────────────────────────────────────────────────
    const cdEligibleCount   = useMemo(() => loans.filter(l => l.isEligibleForCD).length, [loans]);
    const selectedCdCount   = useMemo(() => selected.filter(id => loans.find(l => l.id === id)?.isEligibleForCD).length, [selected, loans]);
    const visibleLoans      = useMemo(() => filterCd ? loans.filter(l => l.isEligibleForCD) : loans, [loans, filterCd]);
    const allSelected       = visibleLoans.length > 0 && selected.length === visibleLoans.length;
    const someSelected      = selected.length > 0 && selected.length < visibleLoans.length;

    // ── SELECTION ──────────────────────────────────────────────────────────────
    const handleSelect    = (id) => setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
    const handleSelectAll = () => setSelected(allSelected ? [] : visibleLoans.map(l => l.id));

    // ── DOWNLOAD CD ───────────────────────────────────────────────────────────
    const handleDownloadCD = () => {
        const eligibleIds = selected.filter(id => loans.find(l => l.id === id)?.isEligibleForCD);
        if (eligibleIds.length === 0) {
            toast.error('None of the selected loans are CD-eligible (Pensioner only).');
            return;
        }
        setDownloading(true);
        // Use a hidden anchor so we can reset the button state after the download fires
        const url = route('admin.accounting.billing.cd-archive') + '?loans=' + eligibleIds.join(',');
        const a   = document.createElement('a');
        a.href    = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => setDownloading(false), 2000);
        toast.success(`Downloading CD archive for ${eligibleIds.length} loan${eligibleIds.length !== 1 ? 's' : ''}.`);
    };

    // ── APPROVE ───────────────────────────────────────────────────────────────
    const handleApprove = async () => {
        setApproving(true);
        try {
            const { data } = await axios.post(route('admin.accounting.billing.approve'), { loanIds: selected });
            toast.success(data.message || 'Loans approved and posted to ledger.');
            setSelected([]);
            setConfirm(false);
            fetchLoans();
        } catch (e) {
            const msg = e?.response?.data?.message || 'Approval failed. Please try again.';
            toast.error(msg);
        } finally {
            setApproving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <AdminSidebarLayout>
            <Head title="Billing Processing">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontSize: '13px' } }} />

            <div className="max-w-7xl mx-auto space-y-5 pb-12">

                {/* ── HERO HEADER ──────────────────────────────────────────── */}
                <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    {/* Subtle background accent */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-indigo-400/8 dark:bg-indigo-400/10 blur-3xl" />
                    </div>

                    <div className="relative z-10 px-5 sm:px-7 py-5">
                        {/* Title row */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 grid place-items-center shrink-0 border border-indigo-100 dark:border-indigo-800">
                                    <FileArchive size={20} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Billing Processing</h1>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                        Review released loans, generate CD archives, and post to ledger.
                                    </p>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2 shrink-0">
                                <button
                                    onClick={fetchLoans}
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 text-xs font-semibold transition active:scale-95 disabled:opacity-50"
                                    title="Refresh"
                                >
                                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>

                                <button
                                    onClick={handleDownloadCD}
                                    disabled={selected.length === 0 || downloading}
                                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-700 active:scale-95 text-white text-xs font-semibold transition disabled:opacity-40"
                                >
                                    {downloading
                                        ? <Loader2 size={13} className="animate-spin" />
                                        : <Download size={13} />
                                    }
                                    CD Archive
                                    {selectedCdCount > 0 && (
                                        <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums">{selectedCdCount}</span>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        if (selected.length === 0) { toast.error('Select at least one loan to approve.'); return; }
                                        setConfirm(true);
                                    }}
                                    disabled={selected.length === 0}
                                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold shadow-sm shadow-emerald-500/20 transition disabled:opacity-40"
                                >
                                    <BadgeCheck size={13} />
                                    Approve & Post
                                    {selected.length > 0 && (
                                        <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums">{selected.length}</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats strip */}
                    <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-5 sm:px-7 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard label="Total Pending"   value={loans.length}       icon={Archive}       color="slate"   />
                            <StatCard label="CD Eligible"     value={cdEligibleCount}    icon={PackageOpen}   color="indigo"  />
                            <StatCard label="Selected"        value={selected.length}    icon={Users}         color="amber"   />
                            <StatCard label="Selected CD"     value={selectedCdCount}    icon={CheckCircle2}  color="emerald" />
                        </div>
                    </div>
                </div>

                {/* ── TABLE ─────────────────────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

                    {/* Table toolbar — shows when rows are selected */}
                    <AnimatePresence>
                        {selected.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{   opacity: 0, height: 0 }}
                                transition={{ duration: 0.18 }}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center justify-between gap-3 px-5 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
                                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                        {selected.length} loan{selected.length !== 1 ? 's' : ''} selected
                                        {selectedCdCount > 0 && ` · ${selectedCdCount} CD-eligible`}
                                    </p>
                                    <button onClick={() => setSelected([])} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                        <X size={11} /> Clear selection
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>


                    {/* Filter toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div className="flex items-center gap-2">
                            <ListFilter size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setFilterCd(false); setSelected([]); }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                    !filterCd
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                                }`}
                            >
                                All Loans
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${!filterCd ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
                                    {loans.length}
                                </span>
                            </button>
                            <button
                                onClick={() => { setFilterCd(true); setSelected([]); }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                    filterCd
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                                }`}
                            >
                                CD Eligible Only
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${filterCd ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
                                    {cdEligibleCount}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Scrollable table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5 w-12">
                                        <Checkbox
                                            checked={allSelected}
                                            indeterminate={someSelected}
                                            onChange={handleSelectAll}
                                            disabled={loading || loans.length === 0}
                                        />
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold">Loan Reference</th>
                                    <th className="px-5 py-3.5 font-semibold">Member</th>
                                    <th className="px-5 py-3.5 font-semibold hidden sm:table-cell">Branch / Classification</th>
                                    <th className="px-5 py-3.5 font-semibold text-center">CD Eligible</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {/* Loading state */}
                                {loading && [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}

                                {/* Empty state */}
                                {!loading && visibleLoans.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-700 grid place-items-center">
                                                    <Archive size={24} className="text-slate-300 dark:text-slate-500" />
                                                </div>
                                                {filterCd && loans.length > 0 ? (
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No CD-eligible loans</p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">None of the pending loans are eligible for CD archive.</p>
                                                        <button onClick={() => setFilterCd(false)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-3">
                                                            Show all loans
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No pending loans</p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">All released loans have been processed.</p>
                                                        <button onClick={fetchLoans} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-3">
                                                            <RefreshCw size={11} /> Refresh
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Data rows */}
                                {!loading && visibleLoans.map(loan => {
                                    const isSelected = selected.includes(loan.id);
                                    return (
                                        <tr
                                            key={loan.id}
                                            onClick={() => handleSelect(loan.id)}
                                            className={`cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-indigo-50/70 dark:bg-indigo-900/15'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                            }`}
                                        >
                                            <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => handleSelect(loan.id)}
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{loan.loanReference}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{loan.memberName}</p>
                                                {/* Show branch on mobile since its column is hidden */}
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:hidden">{loan.branchService}</p>
                                            </td>
                                            <td className="px-5 py-4 hidden sm:table-cell">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-100 dark:border-indigo-800">
                                                    {loan.branchService}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {loan.isEligibleForCD ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-100 dark:border-emerald-800">
                                                        <CheckCircle2 size={11} />
                                                        Pensioner
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-[11px] font-semibold">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Table footer */}
                    {!loading && visibleLoans.length > 0 && (
                        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                {filterCd ? 'Showing' : 'All'} <span className="font-semibold text-slate-700 dark:text-slate-300">{visibleLoans.length}</span> {filterCd ? 'CD-eligible' : 'pending'} loan{visibleLoans.length !== 1 ? 's' : ''}
                            </p>
                            {selected.length > 0 && (
                                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                    {selected.length} of {loans.length} selected
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── CONFIRM APPROVE DIALOG ──────────────────────────────────── */}
            <ConfirmDialog
                open={confirm}
                title={`Approve ${selected.length} loan${selected.length !== 1 ? 's' : ''}?`}
                description={`This will post ${selected.length} loan${selected.length !== 1 ? 's' : ''} to the general ledger. This action cannot be undone.`}
                confirmLabel="Yes, approve & post"
                confirmClass="bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-500/20"
                isLoading={approving}
                onConfirm={handleApprove}
                onCancel={() => { if (!approving) setConfirm(false); }}
            />
        </AdminSidebarLayout>
    );
}