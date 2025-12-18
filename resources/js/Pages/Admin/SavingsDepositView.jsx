import React, { useEffect, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { 
    Loader2, Plus, X, Wallet, ArrowUpRight, ArrowDownLeft, 
    ArrowLeft, FileText, ChevronLeft, ChevronRight, PiggyBank 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
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

            // Sort locally if needed, though backend usually handles this
            const sortedRows = (data.rows || []).slice().sort((a, b) => {
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
            
            // Reload table
            await loadData(1);
            
            // Reload page to update stats (since stats come from props)
            // primarily we rely on Inertia reload or manual fetch if endpoint available
            window.location.reload(); 

        } catch (error) {
            console.error(error);
            toast.error("Error saving transaction.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminSidebarLayout>
            <Head title={`Savings - ${member?.fullName}`} />

            <div className="space-y-6">
                
                {/* HEADER */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Link
                            href={route("admin.savings.index")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition-colors text-xs font-medium"
                        >
                            <ArrowLeft size={14} /> Back
                        </Link>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                                {member?.fullName ? member.fullName.charAt(0) : "M"}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {member?.fullName || "Member Savings"}
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                                    {member?.username && <span>@{member.username}</span>}
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                                    <span>ID: {member?.id}</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={openModal} 
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all"
                            >
                                <Plus size={18} />
                                <span>New Transaction</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard 
                        label="Current Balance" 
                        value={totalSavings} 
                        icon={Wallet} 
                        color="emerald" 
                        prefix="₱"
                    />
                    <StatCard 
                        label="Total Deposits" 
                        value={totalDeposits} 
                        icon={ArrowUpRight} 
                        color="blue" 
                        prefix="₱"
                    />
                    <StatCard 
                        label="Total Withdrawals" 
                        value={totalWithdrawals} 
                        icon={ArrowDownLeft} 
                        color="rose" 
                        prefix="₱"
                    />
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
                                    <th className="px-6 py-4 text-center">Type</th>
                                    <th className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400">Credit</th>
                                    <th className="px-6 py-4 text-right text-rose-600 dark:text-rose-400">Debit</th>
                                    <th className="px-6 py-4 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/>Loading...</td></tr>
                                ) : rows.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No transactions found.</td></tr>
                                ) : (
                                    rows.map((r) => {
                                        const isDeposit = (r.transactionType || "").toLowerCase() === "deposit";
                                        const amount = Number(r.amount) || 0;
                                        return (
                                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                                                    {formatDateShort(r.date || r.transactionDate)}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono">
                                                    {r.referenceNumber || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isDeposit ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                                        {isDeposit ? 'Deposit' : 'Withdrawal'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                                    {isDeposit ? asMoney(amount) : "—"}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-rose-600 dark:text-rose-400">
                                                    {!isDeposit ? asMoney(amount) : "—"}
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
                            <div className="p-10 text-center text-slate-500">No transactions found.</div>
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
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                            
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Transaction</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Savings Deposit Entry</p>
                                </div>
                                <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition"><X size={20} /></button>
                            </div>

                            <form onSubmit={submitForm} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase tracking-wide">Type</label>
                                    <select 
                                        value={form.transactionType} 
                                        onChange={(e) => handleFormChange("transactionType", e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="deposit" className="text-slate-900 dark:text-slate-900">Deposit</option>
                                        <option value="withdrawal" className="text-slate-900 dark:text-slate-900">Withdrawal</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase tracking-wide">Amount</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={form.amount} 
                                            onChange={(e) => handleFormChange("amount", e.target.value)}
                                            className="input-field pl-8 font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase tracking-wide">Reference (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={form.referenceNumber} 
                                        onChange={(e) => handleFormChange("referenceNumber", e.target.value)}
                                        className="input-field"
                                        placeholder="OR#, Ref#, Note"
                                    />
                                </div>
                            </form>

                            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-white/5">
                                <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition">Cancel</button>
                                <button onClick={submitForm} disabled={submitting} className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                                    {submitting ? 'Saving...' : 'Save Transaction'}
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* STYLES */}
            <style>{`
                .input-field {
                    width: 100%;
                    padding: 0.6rem 0.8rem;
                    border-radius: 0.75rem;
                    border: 1px solid #e2e8f0;
                    background-color: #fff;
                    font-size: 0.875rem;
                    color: #0f172a;
                    outline: none;
                    transition: all 0.2s;
                }
                .dark .input-field {
                    background-color: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.1);
                    color: #fff;
                }
                .input-field:focus {
                    border-color: #10b981;
                    box-shadow: 0 0 0 1px #10b981;
                }
            `}</style>
        </AdminSidebarLayout>
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
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    <CountUp end={toNumber(value)} duration={1} separator="," prefix={prefix} decimals={2} />
                </p>
            </div>
        </div>
    );
}