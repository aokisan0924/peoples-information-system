import React, { useEffect, useState } from "react";
import { Head, usePage, Link } from "@inertiajs/react";
import axios from "axios";
import { 
    Loader2, Plus, X, Wallet, ArrowUpRight, ArrowDownLeft, 
    ArrowRight, ArrowLeft, User, // Processed By User Icon
    FileText, ChevronLeft, ChevronRight, PiggyBank 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import { ResourceHeader } from "@/Components/Admin/ResourceUI";
import CountUp from "react-countup";
import toast from "react-hot-toast";

const asMoney = (v) =>
    (Number.isFinite(+v) ? +v : 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const formatDateShort = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
    }).format(d);
};

const toNumber = (v) => (Number.isFinite(+v) ? +v : 0);

export default function SavingsDepositView() {
    const { props } = usePage();
    const { member, stats } = props;

    const rawStats = props.stats || {};
    const innerStats = rawStats.stats || rawStats;

    const totalSavings = Number(innerStats.totalSavings ?? 0);
    const totalDeposits = Number(innerStats.totalDeposits ?? 0);
    const totalWithdrawals = Number(innerStats.totalWithdrawals ?? 0);

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
    });

    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        memberId: member?.id || "",
        transactionType: "deposit",
        amount: "",
        referenceNumber: "",
    });

    const handleFormChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const loadData = async (page = 1) => {
        if (!member?.id) return;

        setLoading(true);
        try {
            const { data } = await axios.get(
                route("admin.savings.api-member", { memberId: member.id }),
                { params: { page } }
            );

            // Filter out Pending or Unpaid transactions
            const validRows = (data.rows || []).filter(item => {
                const status = (item.status || '').toLowerCase();
                const isPaid = !!item.isPaid;
                if (status === 'pending') return false;
                if (!isPaid) return false;
                return true;
            });

            const sortedRows = validRows.slice().sort((a, b) => {
                const da = new Date(a.datePosted || a.date || 0);
                const db = new Date(b.datePosted || b.date || 0);
                return db.getTime() - da.getTime(); 
            });

            setRows(sortedRows);
            setMeta(
                data.meta || { currentPage: 1, lastPage: 1, perPage: 10, total: 0 }
            );
        } catch (error) {
            console.error(error);
            toast.error("Failed to load transactions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(1);
    }, [member?.id]);

    const handlePageChange = (page) => {
        if (page < 1 || page > meta.lastPage || page === meta.currentPage) return;
        loadData(page);
    };

    const openModal = () => {
        setForm({
            memberId: member?.id || "",
            transactionType: "deposit",
            amount: "",
            referenceNumber: "",
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const submitForm = async (e) => {
        e.preventDefault();
        if (!form.memberId || !form.transactionType || !form.amount) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await axios.post(route("admin.savings.store"), {
                memberId: Number(form.memberId),
                transactionType: form.transactionType,
                amount: Number(form.amount),
                referenceNumber: form.referenceNumber || null,
            });

            if (!data?.success) {
                toast.error(data?.message || "Transaction failed.");
                return;
            }

            toast.success("Transaction saved successfully.");
            closeModal();
            await loadData(1);
            window.location.reload(); 

        } catch (error) {
            console.error(error);
            toast.error("Error saving transaction.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head title={`Savings - ${member?.fullName || member?.name}`}>
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="space-y-6">
                    
                    {/* HEADER */}
                    <ResourceHeader icon={PiggyBank} eyebrow="Member Ledger" title="Savings Deposit Ledger" description={<>Viewing savings history for <strong className="text-white">{member?.fullName || member?.name}</strong>.</>} backHref={route("admin.savings.index")} backLabel="Back to Savings" actions={
                            <button onClick={openModal} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-emerald-900 shadow-lg transition hover:bg-emerald-50 active:scale-95">
                                <Plus size={18} /> <span className="hidden sm:inline">New Transaction</span><span className="sm:hidden">Add</span>
                            </button>
                    } />

                    {/* STAT CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard label="Current Balance" value={totalSavings} icon={Wallet} color="emerald" prefix="₱" />
                        <StatCard label="Total Deposits" value={totalDeposits} icon={ArrowUpRight} color="blue" prefix="₱" />
                        <StatCard label="Total Withdrawals" value={totalWithdrawals} icon={ArrowDownLeft} color="rose" prefix="₱" />
                    </div>

                    {/* TRANSACTION TABLE */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm overflow-hidden transition-colors">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                                <FileText className="text-slate-400" size={18} />
                                <h2 className="font-semibold text-slate-900 dark:text-white">Transaction History</h2>
                            </div>
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Ref No.</th>
                                        <th className="px-6 py-4">Processed By</th>
                                        <th className="px-6 py-4 text-center">Type</th>
                                        <th className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400">Credit</th>
                                        <th className="px-6 py-4 text-right text-rose-600 dark:text-rose-400">Debit</th>
                                        <th className="px-6 py-4 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                                    {loading ? (
                                        <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/>Loading...</td></tr>
                                    ) : rows.length === 0 ? (
                                        <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No posted transactions found.</td></tr>
                                    ) : (
                                        rows.map((r) => {
                                            const isDeposit = (r.transactionType || "").toLowerCase() === "deposit";
                                            const credit = r.credit; 
                                            const debit = r.debit;
                                            
                                            return (
                                                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                                                        {formatDateShort(r.date || r.transactionDate)}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-mono">
                                                        {r.referenceNumber || "—"}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {r.processor ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                                                                    <User size={12} />
                                                                </div>
                                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                    {typeof r.processor === 'object' ? (r.processor.name || r.processor.username) : r.processor}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic pl-8">System</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isDeposit ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                                            {isDeposit ? 'Deposit' : 'Withdrawal'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                                        {credit ? asMoney(credit) : "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-rose-600 dark:text-rose-400">
                                                        {debit ? asMoney(debit) : "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold font-mono text-slate-900 dark:text-white">
                                                        {asMoney(r.runningBalance ?? 0)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <div className="p-10 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>
                            ) : rows.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">No posted transactions found.</div>
                            ) : (
                                rows.map((r) => {
                                    const isDeposit = (r.transactionType || "").toLowerCase() === "deposit";
                                    const amount = Number(r.amount) || 0;
                                    return (
                                        <div key={r.id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isDeposit ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                                            {isDeposit ? 'DEPOSIT' : 'WITHDRAWAL'}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-mono">{r.referenceNumber || "#"}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">{formatDateShort(r.date || r.transactionDate)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-mono font-bold ${isDeposit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {isDeposit ? '+' : '-'}{asMoney(amount)}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        By: {r.processor ? (typeof r.processor === 'object' ? (r.processor.name || r.processor.username) : r.processor) : 'System'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-white/5">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Running Balance</span>
                                                <span className="font-mono font-bold text-slate-900 dark:text-white">{asMoney(r.runningBalance ?? 0)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                Page <span className="font-semibold text-slate-900 dark:text-white">{meta.currentPage}</span> of {meta.lastPage}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handlePageChange(meta.currentPage - 1)} disabled={meta.currentPage <= 1} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition"><ChevronLeft className="h-4 w-4" /></button>
                                <button onClick={() => handlePageChange(meta.currentPage + 1)} disabled={meta.currentPage >= meta.lastPage} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closeModal} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Transaction</h2>
                                    <button onClick={closeModal} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition"><X size={20} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"/></button>
                                </div>
                                
                                <form onSubmit={submitForm} className="space-y-5">
                                    {/* Type Toggle (Updated Style) */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase">Type</label>
                                        <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-black/20 rounded-xl">
                                            <button 
                                                type="button" 
                                                onClick={() => handleFormChange("transactionType", 'deposit')} 
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.transactionType === 'deposit' ? 'bg-white dark:bg-white/10 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                            >
                                                Deposit
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => handleFormChange("transactionType", 'withdrawal')} 
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.transactionType === 'withdrawal' ? 'bg-white dark:bg-white/10 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                            >
                                                Withdrawal
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase">Amount</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={form.amount} 
                                                onChange={(e) => handleFormChange("amount", e.target.value)}
                                                className="w-full pl-8 px-4 py-2.5 rounded-xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase">Reference (Optional)</label>
                                        <input 
                                            type="text" 
                                            value={form.referenceNumber} 
                                            onChange={(e) => handleFormChange("referenceNumber", e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            placeholder="OR#, Ref#, Note"
                                        />
                                    </div>

                                    <button type="submit" disabled={submitting} className={`w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${form.transactionType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'}`}>
                                        {submitting ? 'Saving...' : `Confirm ${form.transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <style>{`
                    .dark .input-field { 
                        background-color: rgba(255,255,255,0.05); 
                        border-color: rgba(255,255,255,0.1); 
                        color: #fff; 
                    }
                `}</style>
            </AdminSidebarLayout>
        </>
        
    );
}

// --- SUB COMPONENTS ---
function StatCard({ label, value, icon: Icon, color, prefix = "" }) {
    const colors = {
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    };
    return (
        <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 shadow-sm flex items-center gap-4 transition-colors">
            <div className={`p-3 rounded-xl ${colors[color] || colors.emerald}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {prefix}<CountUp end={toNumber(value)} duration={1} separator="," decimals={2} />
                </div>
            </div>
        </div>
    );
}
