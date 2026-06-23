import { useState, useEffect, useRef } from "react";
import { Head } from "@inertiajs/react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Filter, Search, X, FileText, Calendar, CheckCircle2,
    Clock, AlertCircle, ArrowUpRight, Loader2, Banknote,
    CreditCard, Trash2, TrendingUp, TrendingDown, SlidersHorizontal,
    XCircle, ReceiptText, RefreshCw
} from "lucide-react";
import SidebarLayout from "@/Layouts/SidebarLayout";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtAmount = (amt) =>
    Number(amt || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const fmtDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
};

const fmtTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
};

const CATEGORY_LABELS = {
    shareCapital: "Share Capital",
    savings:      "Savings",
    timeDeposit:  "Time Deposit",
    loan:         "Loan",
    membership:   "Membership",
    all:          "All",
};

const CATEGORY_COLORS = {
    shareCapital: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10",
    savings:      "text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-500/10",
    timeDeposit:  "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/10",
    loan:         "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10",
    membership:   "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10",
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const s = (status || "").toLowerCase();
    let cls  = "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60";
    let Icon = Clock;
    if (["approved","posted","paid","released","active"].includes(s)) {
        cls  = "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
        Icon = CheckCircle2;
    } else if (s === "pending") {
        cls  = "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
        Icon = Clock;
    } else if (["declined","rejected","cancelled"].includes(s)) {
        cls  = "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400";
        Icon = XCircle;
    }
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}>
            <Icon size={11} className="text-current shrink-0" />
            <span>{status}</span>
        </span>
    );
}

// ─── CATEGORY BADGE ───────────────────────────────────────────────────────────
function CategoryBadge({ category }) {
    const cls = CATEGORY_COLORS[category] || "text-slate-600 bg-slate-100 dark:text-white/60 dark:bg-white/10";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${cls}`}>
            {CATEGORY_LABELS[category] || category}
        </span>
    );
}

// ─── CONFIRM CANCEL MODAL ─────────────────────────────────────────────────────
function ConfirmCancelModal({ tx, onConfirm, onClose, isLoading }) {
    return (
        <motion.div
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                className="relative w-full max-w-sm bg-white dark:bg-[#0f1a14] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.96, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
            >
                {/* Red accent strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-red-500" />

                <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="h-11 w-11 rounded-2xl bg-rose-50 dark:bg-rose-500/15 grid place-items-center shrink-0">
                            <Trash2 size={20} className="text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Cancel Transaction?</h3>
                            <p className="text-xs text-slate-500 dark:text-white/50 mt-1 leading-relaxed">
                                This will permanently cancel your <strong className="text-slate-700 dark:text-white/80">{CATEGORY_LABELS[tx?.category] || tx?.category}</strong> transaction. This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    {tx && (
                        <div className="p-3.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.06] mb-5 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400 dark:text-white/40">Type</span>
                                <span className="font-semibold text-slate-800 dark:text-white/90">{tx.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 dark:text-white/40">Amount</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{fmtAmount(tx.amount)}</span>
                            </div>
                            {tx.referenceNumber && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400 dark:text-white/40">Ref No.</span>
                                    <span className="font-mono text-slate-600 dark:text-white/70">{tx.referenceNumber}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2.5">
                        <button onClick={onClose} disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                        >Keep it</button>
                        <button onClick={onConfirm} disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all active:scale-95 disabled:opacity-60"
                        >
                            {isLoading
                                ? <><Loader2 size={14} className="animate-spin text-current" /> Cancelling...</>
                                : <><Trash2 size={14} className="text-current" /> Yes, Cancel</>
                            }
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ClientTransactions() {
    const [rows,           setRows]           = useState([]);
    const [meta,           setMeta]           = useState({ currentPage: 1, perPage: 10, lastPage: 1, total: 0 });
    const [filters,        setFilters]        = useState({ dateFrom: "", dateTo: "", category: "all", status: "all", perPage: 10 });
    const [isLoading,      setIsLoading]      = useState(false);
    const [isActionLoading,setIsActionLoading]= useState(false);
    const [isModalOpen,    setIsModalOpen]    = useState(false);
    const [selectedTx,     setSelectedTx]     = useState(null);
    const [showFilters,    setShowFilters]    = useState(false);
    const [confirmCancel,  setConfirmCancel]  = useState(null); // tx to cancel

    const fetchTransactions = async (page = 1) => {
        try {
            setIsLoading(true);
            const { data } = await axios.get("/client/recent-transactions", { params: { ...filters, page } });
            setRows(data.data || []);
            setMeta(data.meta || {});
        } catch {
            toast.error("Failed to load transaction history.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(1); }, []);

    const handleFilterChange  = (e) => setFilters(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleFilterSubmit  = (e) => { e.preventDefault(); fetchTransactions(1); setShowFilters(false); };
    const handleResetFilters  = () => { setFilters({ dateFrom:"", dateTo:"", category:"all", status:"all", perPage:10 }); fetchTransactions(1); };
    const handlePageChange    = (p) => { if (p >= 1 && p <= meta.lastPage) fetchTransactions(p); };

    const openModal  = (tx) => { setSelectedTx(tx); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setTimeout(() => setSelectedTx(null), 200); };

    const handleContinuePayment = async (tx) => {
        setIsActionLoading(true);
        try {
            toast.loading("Securing payment link...", { id: "paymentToast" });
            const { data } = await axios.post("/client/paymongo/continue", {
                referenceNumber: tx.referenceNumber,
                category: tx.category,
            });
            toast.success("Redirecting to payment...", { id: "paymentToast" });
            window.open(data.checkoutUrl, "_blank");
            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to initiate payment.", { id: "paymentToast" });
        } finally {
            setIsActionLoading(false);
        }
    };

    // FIX: sends sourceId (real PK) instead of referenceNumber (can be null)
    const executeCancel = async (tx) => {
        setIsActionLoading(true);
        try {
            await axios.post("/client/transactions/cancel", {
                sourceId: tx.sourceId,    // ← FIX: use PK not referenceNumber
                category: tx.category,
            });
            toast.success("Transaction cancelled successfully.");
            setConfirmCancel(null);
            closeModal();
            fetchTransactions(meta.currentPage);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to cancel transaction.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const inputCls = "w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition dark:[color-scheme:dark]";

    const canCancel   = (tx) => tx?.status?.toLowerCase() === "pending" && ["shareCapital","savings","loan"].includes(tx?.category);
    const canContinue = (tx) => tx?.status?.toLowerCase() === "pending" && ["membership","shareCapital","savings"].includes(tx?.category);

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Transaction History">
                    <link rel="icon" href="/images/logo/pis_logo.png" />
                </Head>

                <div className="space-y-4 sm:space-y-5 pb-10">

                    {/* ── HEADER ──────────────────────────────────────────── */}
                    <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-sm">
                        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow-lg shadow-emerald-500/25 shrink-0">
                                    <ReceiptText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Transaction History</h1>
                                    <p className="text-xs sm:text-sm text-slate-400 dark:text-white/40 font-medium mt-0.5">Unified view of all your cooperative transactions.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                    <FileText size={14} className="text-current shrink-0" />
                                    <span className="font-bold text-sm">{meta.total}</span>
                                    <span className="text-xs opacity-70">Records</span>
                                </div>
                                <button onClick={() => fetchTransactions(meta.currentPage)}
                                    className="h-9 w-9 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95"
                                    title="Refresh"
                                ><RefreshCw size={15} className="text-current" /></button>
                            </div>
                        </div>
                    </div>

                    {/* ── FILTERS ─────────────────────────────────────────── */}
                    <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-white/80">
                                <SlidersHorizontal size={14} className="text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Filters</span>
                            </div>
                            <button
                                onClick={() => setShowFilters(p => !p)}
                                className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-600 dark:text-white/60 border border-slate-200 dark:border-white/10 transition"
                            >
                                <Filter size={12} className="text-current" />
                                {showFilters ? "Hide" : "Show"} Filters
                            </button>
                        </div>

                        <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
                            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 ml-0.5">From Date</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                                        <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className={`${inputCls} pl-9`} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 ml-0.5">To Date</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                                        <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className={`${inputCls} pl-9`} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 ml-0.5">Category</label>
                                    <select name="category" value={filters.category} onChange={handleFilterChange} className={inputCls}>
                                        <option value="all">All Categories</option>
                                        <option value="shareCapital">Share Capital</option>
                                        <option value="savings">Savings</option>
                                        <option value="timeDeposit">Time Deposit</option>
                                        <option value="loan">Loan</option>
                                        <option value="membership">Membership</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 ml-0.5">Status</label>
                                    <select name="status" value={filters.status} onChange={handleFilterChange} className={inputCls}>
                                        <option value="all">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="released">Released</option>
                                        <option value="posted">Posted</option>
                                        <option value="paid">Paid</option>
                                        <option value="declined">Declined</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 ml-0.5">Per Page</label>
                                    <select name="perPage" value={filters.perPage} onChange={handleFilterChange} className={inputCls}>
                                        {[5,10,20,50].map(n => <option key={n} value={n}>{n} rows</option>)}
                                    </select>
                                </div>

                                <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                                    <button type="button" onClick={handleResetFilters}
                                        className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10 transition active:scale-95"
                                    >Reset</button>
                                    <button type="submit"
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center gap-2"
                                    ><Search size={14} className="text-current" /> Apply Filters</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── TRANSACTION LIST ─────────────────────────────────── */}
                    <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">

                        {isLoading ? (
                            <div className="py-24 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500 mb-3" />
                                <p className="text-sm text-slate-400 dark:text-white/30 font-medium">Loading transactions...</p>
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="py-24 flex flex-col items-center gap-3 text-slate-400 dark:text-white/30">
                                <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-white/5 grid place-items-center">
                                    <ReceiptText size={28} className="opacity-40" />
                                </div>
                                <p className="text-sm font-semibold text-slate-500 dark:text-white/40">No transactions found</p>
                                <p className="text-xs">Try adjusting your filters.</p>
                            </div>
                        ) : (
                            <>
                                {/* ── DESKTOP TABLE ──────────────────────── */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/[0.06]">
                                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                                                <th className="px-5 lg:px-6 py-4">Date</th>
                                                <th className="px-5 lg:px-6 py-4">Type</th>
                                                <th className="px-5 lg:px-6 py-4 hidden lg:table-cell">Category</th>
                                                <th className="px-5 lg:px-6 py-4 text-right">Amount</th>
                                                <th className="px-5 lg:px-6 py-4 text-center">Status</th>
                                                <th className="px-5 lg:px-6 py-4 text-center">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                                            {rows.map(tx => (
                                                <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-5 lg:px-6 py-4">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{fmtDate(tx.date)}</p>
                                                        <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5">{fmtTime(tx.date)}</p>
                                                    </td>
                                                    <td className="px-5 lg:px-6 py-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className={`h-8 w-8 rounded-xl grid place-items-center shrink-0 ${
                                                                tx.direction === 'credit'
                                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                            }`}>
                                                                {tx.direction === 'credit'
                                                                    ? <TrendingUp size={14} className="text-current" />
                                                                    : <TrendingDown size={14} className="text-current" />
                                                                }
                                                            </span>
                                                            <span className="text-sm font-medium text-slate-800 dark:text-white/90 leading-tight">{tx.type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 lg:px-6 py-4 hidden lg:table-cell">
                                                        <CategoryBadge category={tx.category} />
                                                    </td>
                                                    <td className="px-5 lg:px-6 py-4 text-right">
                                                        <span className={`font-mono font-bold text-sm ${
                                                            tx.direction === 'credit'
                                                                ? 'text-slate-900 dark:text-white'
                                                                : 'text-rose-600 dark:text-rose-400'
                                                        }`}>
                                                            {tx.direction === 'debit' && '−'}{fmtAmount(tx.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 lg:px-6 py-4 text-center">
                                                        <StatusBadge status={tx.status} />
                                                    </td>
                                                    <td className="px-5 lg:px-6 py-4 text-center">
                                                        <button onClick={() => openModal(tx)}
                                                            className="h-8 w-8 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 dark:hover:border-emerald-500/40 transition-all active:scale-95"
                                                        ><ArrowUpRight size={14} className="text-current" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ── MOBILE CARDS ───────────────────────── */}
                                <div className="sm:hidden divide-y divide-slate-50 dark:divide-white/[0.04]">
                                    {rows.map(tx => (
                                        <button key={tx.id} onClick={() => openModal(tx)}
                                            className="w-full p-4 text-left hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors active:scale-[0.99]"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2.5">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${
                                                        tx.direction === 'credit'
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                        {tx.direction === 'credit'
                                                            ? <TrendingUp size={15} className="text-current" />
                                                            : <TrendingDown size={15} className="text-current" />
                                                        }
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{tx.type}</p>
                                                        <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{fmtDate(tx.date)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className={`font-mono font-bold text-sm ${
                                                        tx.direction === 'credit' ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                                                    }`}>{tx.direction === 'debit' && '−'}{fmtAmount(tx.amount)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <CategoryBadge category={tx.category} />
                                                    <StatusBadge status={tx.status} />
                                                </div>
                                                <ChevronRight size={13} className="text-slate-300 dark:text-white/20 shrink-0" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── PAGINATION ──────────────────────────────────── */}
                        {!isLoading && meta.lastPage >= 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                <p className="text-xs font-medium text-slate-400 dark:text-white/30">
                                    Page <span className="font-bold text-emerald-600 dark:text-emerald-400">{meta.currentPage}</span> of {meta.lastPage} · {meta.total} total
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => handlePageChange(1)} disabled={meta.currentPage <= 1}
                                        className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                        <ChevronsLeft size={14} className="text-current" />
                                    </button>
                                    <button onClick={() => handlePageChange(meta.currentPage - 1)} disabled={meta.currentPage <= 1}
                                        className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                        <ChevronLeft size={14} className="text-current" />
                                    </button>
                                    <button onClick={() => handlePageChange(meta.currentPage + 1)} disabled={meta.currentPage >= meta.lastPage}
                                        className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                        <ChevronRight size={14} className="text-current" />
                                    </button>
                                    <button onClick={() => handlePageChange(meta.lastPage)} disabled={meta.currentPage >= meta.lastPage}
                                        className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                        <ChevronsRight size={14} className="text-current" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── TRANSACTION DETAIL MODAL ─────────────────────────────── */}
                <AnimatePresence>
                    {isModalOpen && selectedTx && (
                        <motion.div
                            className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                            <motion.div
                                className="relative w-full sm:max-w-md bg-white dark:bg-[#0a1510] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
                                initial={{ opacity: 0, scale: 0.97, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97, y: -10 }}
                                transition={{ type: "spring", damping: 30, stiffness: 340 }}
                            >
                                {/* Gradient header */}
                                <div className={`px-5 sm:px-6 py-5 text-white relative overflow-hidden ${
                                    selectedTx.direction === 'credit'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                                        : 'bg-gradient-to-r from-rose-600 to-red-600'
                                }`}>
                                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                                    <div className="flex items-start justify-between gap-3 relative z-10">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Transaction Details</p>
                                            <h2 className="text-lg sm:text-xl font-black leading-tight">{selectedTx.type}</h2>
                                            <p className="text-sm text-white/70 mt-1">{fmtDate(selectedTx.date)} · {fmtTime(selectedTx.date)}</p>
                                        </div>
                                        <button onClick={closeModal}
                                            className="h-9 w-9 grid place-items-center rounded-xl bg-white/15 hover:bg-white/25 transition shrink-0"
                                        ><X size={18} className="text-white" /></button>
                                    </div>
                                    <div className="mt-4 relative z-10">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">
                                            {selectedTx.direction === 'credit' ? 'Amount Received' : 'Amount Paid'}
                                        </p>
                                        <p className="text-3xl sm:text-4xl font-black font-mono">{fmtAmount(selectedTx.amount)}</p>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-5 sm:p-6 space-y-4">
                                    {/* Detail rows */}
                                    <div className="space-y-0 divide-y divide-slate-50 dark:divide-white/[0.04] rounded-2xl border border-slate-100 dark:border-white/[0.06] overflow-hidden">
                                        {[
                                            { label: "Category",  value: <CategoryBadge category={selectedTx.category} /> },
                                            { label: "Status",    value: <StatusBadge status={selectedTx.status} /> },
                                            selectedTx.referenceNumber && { label: "Ref. No.", value: <span className="font-mono text-xs bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg text-slate-700 dark:text-white/80">{selectedTx.referenceNumber}</span> },
                                        ].filter(Boolean).map((row, i) => (
                                            <div key={i} className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-white/[0.02]">
                                                <span className="text-xs text-slate-400 dark:text-white/40 font-medium shrink-0">{row.label}</span>
                                                <div className="text-right">{row.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedTx.description && (
                                        <div className="p-3.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/[0.06]">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-1.5">Description</p>
                                            <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed">{selectedTx.description}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer actions */}
                                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 flex flex-col-reverse sm:flex-row gap-2.5">
                                    <button onClick={closeModal}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 font-semibold text-sm transition-all active:scale-95 text-center"
                                    >Close</button>

                                    {canCancel(selectedTx) && (
                                        <button
                                            onClick={() => { closeModal(); setConfirmCancel(selectedTx); }}
                                            disabled={isActionLoading}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Trash2 size={14} className="text-current" /> Cancel
                                        </button>
                                    )}

                                    {canContinue(selectedTx) && (
                                        <button
                                            onClick={() => handleContinuePayment(selectedTx)}
                                            disabled={isActionLoading}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isActionLoading
                                                ? <><Loader2 size={14} className="animate-spin text-current" /> Loading...</>
                                                : <><CreditCard size={14} className="text-current" /> Pay Now</>
                                            }
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── CANCEL CONFIRMATION MODAL ────────────────────────────── */}
                <AnimatePresence>
                    {confirmCancel && (
                        <ConfirmCancelModal
                            tx={confirmCancel}
                            onConfirm={() => executeCancel(confirmCancel)}
                            onClose={() => setConfirmCancel(null)}
                            isLoading={isActionLoading}
                        />
                    )}
                </AnimatePresence>

            </PaymentReminderLayout>
        </SidebarLayout>
    );
}