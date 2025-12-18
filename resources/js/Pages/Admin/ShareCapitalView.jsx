import React, { useEffect, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import { 
    Loader2, Plus, X, Wallet, ArrowRight, // <--- Added ArrowRight for pagination
    User, CheckCircle2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";
import toast from "react-hot-toast";

// --- HELPERS ---
const asMoney = (v) =>
    (Number.isFinite(+v) ? +v : 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const formatDateLong = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-PH", {
        day: "numeric",
        month: "short",
        year: "2-digit",
    }).format(d);
};

const toNumber = (v) => (Number.isFinite(+v) ? +v : 0);

export default function MemberShareCapital() {
    const { props } = usePage();
    const { member, stats } = props;

    // State
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    // Uses meta state like Loan.jsx
    const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
    
    const [modalOpen, setModalOpen] = useState(false);
    
    // Form State
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("deposit");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [refNum, setRefNum] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchTransactions = async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(route('admin.share-capital.api-member', member.id), {
                params: { page: pageNum }
            });
            
            // Handle both Laravel standard pagination and custom structure
            const list = res.data.data || res.data.rows || [];
            const pagination = res.data.meta || res.data || {};

            setTransactions(list);
            setMeta({
                currentPage: pagination.current_page || pagination.currentPage || pageNum,
                lastPage: pagination.last_page || pagination.lastPage || 1,
                perPage: pagination.per_page || pagination.perPage || 10,
                total: pagination.total || 0
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to load transactions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (member?.id) fetchTransactions(1);
    }, [member]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= meta.lastPage) fetchTransactions(page);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return toast.error("Invalid amount");
        
        setSubmitting(true);
        try {
            await axios.post(route('admin.share-capital.store'), {
                memberId: member.id,
                transactionType: type,
                amount: amount,
                date: date,
                referenceNumber: refNum
            });
            toast.success("Transaction successful");
            setModalOpen(false);
            setAmount("");
            setRefNum("");
            fetchTransactions(1); 
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to process.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminSidebarLayout>
            <Head title={`Share Capital - ${member.name}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Wallet className="h-6 w-6 text-emerald-600" /> Share Capital Ledger
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Viewing ledger for <span className="font-bold text-emerald-600">{member.name}</span>
                        </p>
                    </div>
                    <button onClick={() => setModalOpen(true)} className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-500 font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                        <Plus size={18} /> <span className="hidden sm:inline">New Transaction</span><span className="sm:hidden">Add</span>
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard label="Total Contribution" value={stats?.total || 0} icon={Wallet} color="emerald" prefix="₱" />
                    <StatCard label="Posted Amount" value={stats?.posted || 0} icon={CheckCircle2} color="blue" prefix="₱" />
                </div>

                {/* DATA CONTAINER */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    
                    {/* 1. DESKTOP TABLE (Hidden on Mobile) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Reference</th>
                                    <th className="px-6 py-4">Processed By</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" /></td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">No records found.</td></tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">{formatDateLong(tx.paid_at || tx.date || tx.created_at)}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx.reference_number || "—"}</td>
                                            <td className="px-6 py-4">
                                                {tx.processor ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                                                            <User size={12} />
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            {typeof tx.processor === 'object' ? tx.processor.name : tx.processor}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic pl-8">System</span>
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${Number(tx.amount) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {asMoney(tx.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                    {tx.status || 'Posted'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 2. MOBILE CARD LIST (Visible on Mobile) */}
                    <div className="md:hidden">
                        {loading ? (
                            <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" /></div>
                        ) : transactions.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No records found.</div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    {formatDateLong(tx.paid_at || tx.date)}
                                                </div>
                                                <div className="text-xs font-mono text-slate-400 mt-0.5">
                                                    {tx.reference_number || "No Ref"}
                                                </div>
                                            </div>
                                            <div className={`text-lg font-bold ${Number(tx.amount) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {asMoney(tx.amount)}
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center pt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500">
                                                    <User size={12} />
                                                </div>
                                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                                    {tx.processor ? (typeof tx.processor === 'object' ? tx.processor.name : tx.processor) : 'System'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                {tx.status || 'Posted'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* PAGINATION (Copied from Loan.jsx) */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            Page <span className="font-semibold text-slate-900 dark:text-white">{meta.currentPage}</span> of {meta.lastPage}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handlePageChange(meta.currentPage - 1)} disabled={meta.currentPage <= 1} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition"><ArrowRight className="h-4 w-4 rotate-180" /></button>
                            <button onClick={() => handlePageChange(meta.currentPage + 1)} disabled={meta.currentPage >= meta.lastPage} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition"><ArrowRight className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Transaction</h2>
                                <button onClick={() => setModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition"><X size={20} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"/></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Type Toggle */}
                                <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-black/20 rounded-xl">
                                    <button type="button" onClick={() => setType('deposit')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'deposit' ? 'bg-white dark:bg-white/10 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Deposit</button>
                                    <button type="button" onClick={() => setType('withdrawal')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'withdrawal' ? 'bg-white dark:bg-white/10 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Withdrawal</button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase">Amount</label>
                                        <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={amount} onChange={e => setAmount(e.target.value)} autoFocus placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase">Date</label>
                                        <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={date} onChange={e => setDate(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase">Reference (Optional)</label>
                                        <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={refNum} onChange={e => setRefNum(e.target.value)} placeholder="OR# or Ref#" />
                                    </div>
                                </div>

                                <button type="submit" disabled={submitting} className={`w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${type === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'}`}>
                                    {submitting ? "Processing..." : `Confirm ${type === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .dark .input-field { background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: #fff; }
            `}</style>
        </AdminSidebarLayout>
    );
}

function StatCard({ label, value, icon: Icon, color, prefix = "", subtext }) {
    const colors = {
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
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