import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Filter, Search, X, FileText, Calendar, CheckCircle2,
        Clock, AlertCircle, ArrowUpRight, Loader2, SlidersHorizontal, Banknote, Trash2, CreditCard } from "lucide-react";
import SidebarLayout from "@/Layouts/SidebarLayout";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";

export default function ClientTransactions() {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({
        currentPage: 1,
        perPage: 10,
        lastPage: 1,
        total: 0,
    });

    const [filters, setFilters] = useState({
        dateFrom: "",
        dateTo: "",
        category: "all",
        status: "all",
        perPage: 10,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const fetchTransactions = async (page = 1) => {
        try {
            setIsLoading(true);
            const response = await axios.get("/client/recent-transactions", { params: { ...filters, page } });
            setRows(response.data.data || []);
            setMeta(response.data.meta || {});
        } catch (err) {
            toast.error("Failed to load history.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(1); }, []);

    const handleFilterChange = (e) => setFilters(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleFilterSubmit = (e) => { e.preventDefault(); fetchTransactions(1); setShowFilters(false); };
    const handlePageChange = (p) => { if (p >= 1 && p <= meta.lastPage) fetchTransactions(p); };
    const formatAmount = (amt) => Number(amt || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

    // --- MISSING FUNCTIONS ADDED HERE ---
    const openModal = (tx) => {
        setSelectedTx(tx);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedTx(null), 300);
    };

    const handleContinuePayment = async (tx) => {
        setIsActionLoading(true);
        try {
            toast.loading("Securing payment link...", { id: "paymentToast" });
            
            const response = await axios.post("/client/paymongo/continue", { 
                referenceNumber: tx.referenceNumber,
                category: tx.category 
            });
            
            toast.success("Redirecting to PayMongo...", { id: "paymentToast" });
            window.open(response.data.checkoutUrl, "_blank");
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to initiate payment.", { id: "paymentToast" });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleCancelTransaction = (tx) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white dark:bg-[#152a23] shadow-2xl rounded-2xl border border-slate-200 dark:border-white/10 pointer-events-auto flex ring-1 ring-black/5`}>
                <div className="p-5 w-full">
                    <div className="flex flex-col gap-3">
                        <div>
                            <p className="text-base font-bold text-slate-900 dark:text-white">Cancel Transaction?</p>
                            <p className="text-sm text-slate-500 dark:text-white/60 mt-1">
                                Are you sure you want to cancel this pending transaction? This cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 mt-3">
                            <button 
                                type="button"
                                onClick={() => toast.dismiss(t.id)} 
                                className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/80 rounded-xl transition-colors"
                            >
                                Keep it
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    executeCancel(tx);
                                }} 
                                className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition-colors"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ), { 
            duration: Infinity, 
            id: 'confirm-cancel'
        });
    };

    const executeCancel = async (tx) => {
        setIsActionLoading(true);
        toast.loading("Cancelling...", { id: "cancelToast" });
        
        try {
            await axios.post("/client/transactions/cancel", { 
                referenceNumber: tx.referenceNumber,
                category: tx.category
            });
            
            toast.success("Transaction cancelled successfully.", { id: "cancelToast" });
            closeModal();
            fetchTransactions(meta.currentPage);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to cancel transaction.", { id: "cancelToast" });
        } finally {
            setIsActionLoading(false);
        }
    };

    const getStatusBadge = (statusRaw) => {
        const status = (statusRaw || "").toLowerCase();
        let classes = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
        let icon = <Clock className="h-3 w-3" />;
        if (["approved", "posted", "paid", "released"].includes(status)) {
            classes = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
            icon = <CheckCircle2 className="h-3 w-3" />;
        } else if (status === "pending") {
            classes = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
        } else if (["declined", "rejected"].includes(status)) {
            classes = "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
            icon = <AlertCircle className="h-3 w-3" />;
        }
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${classes}`}>
                {icon} <span className="capitalize">{statusRaw}</span>
            </span>
        );
    };

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Transaction">
                    <link rel="icon" href="/images/logo/pis_logo.png" />
                </Head>
                <div className="space-y-6">
                    
                    {/* HERO */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-xl transition-colors">
                        <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Banknote className="h-5 w-5" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">Transaction History</h1>
                                </div>
                                <p className="text-sm sm:text-base text-slate-500 dark:text-white/60 max-w-2xl">
                                    Unified view of your share capital, savings, and loan payments.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                                <FileText className="h-4 w-4" />
                                <span className="font-semibold">{meta.total}</span> <span className="opacity-80">Records</span>
                            </div>
                        </div>
                    </div>

                    {/* FILTERS */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-white/80">
                                <Filter className="h-4 w-4" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Filters</span>
                            </div>
                            <button onClick={() => setShowFilters(!showFilters)} className="sm:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-medium text-slate-700 dark:text-white border border-slate-200 dark:border-white/10">
                                <SlidersHorizontal className="h-3 w-3" /> Filters
                            </button>
                        </div>
                        <motion.div initial={false} animate={{ height: showFilters || window.innerWidth >= 640 ? "auto" : 0, opacity: showFilters || window.innerWidth >= 640 ? 1 : 0 }} className={`${showFilters ? 'block' : 'hidden'} sm:block overflow-hidden`}>
                            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-1">
                                {/* Inputs need specific light/dark styling */}
                                {["dateFrom", "dateTo"].map(field => (
                                    <div key={field} className="space-y-1.5">
                                        <label className="text-xs text-slate-500 dark:text-white/50 ml-1 capitalize">{field.replace("date", "")} Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-white/30" />
                                            <input type="date" name={field} value={filters[field]} onChange={handleFilterChange} 
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white pl-10 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition [color-scheme:light] dark:[color-scheme:dark]" 
                                            />
                                        </div>
                                    </div>
                                ))}
                                {/* Selects */}
                                {[
                                    { name: "category", opts: ["all", "shareCapital", "savings", "loan", "membership"] },
                                    { name: "status", opts: ["all", "pending", "approved", "declined", "released", "posted", "paid"] },
                                    { name: "perPage", opts: [5, 10, 20, 50] }
                                ].map((field) => (
                                    <div key={field.name} className="space-y-1.5">
                                        <label className="text-xs text-slate-500 dark:text-white/50 ml-1 capitalize">{field.name}</label>
                                        <select name={field.name} value={filters[field.name]} onChange={handleFilterChange} 
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition capitalize cursor-pointer [&>option]:text-slate-900 dark:[&>option]:text-white dark:[&>option]:bg-slate-800"
                                        >
                                            {field.opts.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                ))}
                                <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-3 mt-2 border-t border-slate-100 dark:border-white/10 pt-4">
                                    <button type="button" onClick={() => { setFilters({ dateFrom: "", dateTo: "", category: "all", status: "all", perPage: 10 }); fetchTransactions(1); }} className="px-4 py-2 rounded-xl text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 transition">Reset</button>
                                    <button type="submit" className="px-6 py-2 rounded-xl text-sm bg-emerald-600 text-white font-semibold hover:bg-emerald-500 shadow-md transition flex items-center gap-2"><Search className="h-4 w-4" /> Apply</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                    {/* LIST */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-2xl transition-colors">
                        {isLoading && <div className="p-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500 mb-2"/><span className="text-slate-500 dark:text-white/50">Loading...</span></div>}
                        {!isLoading && rows.length === 0 && <div className="p-10 text-center text-slate-500 dark:text-white/50">No transactions found.</div>}
                        {!isLoading && rows.length > 0 && (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/50 border-b border-slate-200 dark:border-white/10 uppercase text-xs font-semibold">
                                            <tr><th className="px-5 py-4">Date</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Category</th><th className="px-5 py-4 text-right">Amount</th><th className="px-5 py-4 text-center">Status</th><th className="px-5 py-4 text-center">Action</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-slate-700 dark:text-white/85">
                                            {rows.map(tx => (
                                                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                                                    <td className="px-5 py-4 font-medium">{tx.date}</td>
                                                    <td className="px-5 py-4">{tx.type}</td>
                                                    <td className="px-5 py-4 capitalize">{tx.category}</td>
                                                    <td className="px-5 py-4 text-right font-mono font-medium">{formatAmount(tx.amount)}</td>
                                                    <td className="px-5 py-4 text-center">{getStatusBadge(tx.status)}</td>
                                                    <td className="px-5 py-4 text-center"><button onClick={() => openModal(tx)} className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-emerald-500 hover:text-emerald-600 dark:bg-white/5 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10 transition"><ArrowUpRight className="h-4 w-4"/></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Mobile Cards */}
                                <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/10">
                                    {rows.map(tx => (
                                        <div key={tx.id} onClick={() => openModal(tx)} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition active:scale-[0.98]">
                                            <div className="flex justify-between items-start mb-2">
                                                <div><div className="text-slate-900 dark:text-white font-medium text-sm">{tx.date}</div><div className="text-slate-500 dark:text-white/60 text-xs mt-0.5 capitalize">{tx.category} • {tx.type}</div></div>
                                                <div className="text-right"><div className="text-slate-900 dark:text-white font-mono font-medium">{formatAmount(tx.amount)}</div></div>
                                            </div>
                                            <div className="flex justify-between items-center mt-3">{getStatusBadge(tx.status)}<span className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1">Details <ChevronRight className="h-3 w-3"/></span></div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {/* Pagination */}
                        {meta.lastPage > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                <div className="text-xs text-slate-500 dark:text-white/50">Page <span className="font-semibold">{meta.currentPage}</span> of {meta.lastPage}</div>
                                <div className="flex gap-2">
                                    <button onClick={() => handlePageChange(meta.currentPage - 1)} disabled={meta.currentPage <= 1} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 disabled:opacity-50"><ChevronLeft className="h-4 w-4"/></button>
                                    <button onClick={() => handlePageChange(meta.currentPage + 1)} disabled={meta.currentPage >= meta.lastPage} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 disabled:opacity-50"><ChevronRight className="h-4 w-4"/></button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MODAL */}
                    <AnimatePresence>
                        {isModalOpen && selectedTx && (
                            <motion.div className="fixed inset-0 z-[999] flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm" onClick={closeModal} />
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0f1f1a] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden text-slate-900 dark:text-white">
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10">
                                        <h2 className="font-semibold">Transaction Details</h2>
                                        <button onClick={closeModal} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-5 w-5 text-slate-500 dark:text-white/70" /></button>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-white/5">
                                            <span className="text-sm text-slate-500 dark:text-white/50">Amount</span>
                                            <span className="text-xl font-bold font-mono">{formatAmount(selectedTx.amount)}</span>
                                        </div>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between"><span className="text-slate-500 dark:text-white/50">Date</span><span>{selectedTx.date}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-500 dark:text-white/50">Type</span><span>{selectedTx.type}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-500 dark:text-white/50">Category</span><span className="capitalize">{selectedTx.category}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-white/50">Status</span>{getStatusBadge(selectedTx.status)}</div>
                                            {selectedTx.referenceNumber && <div className="flex justify-between"><span className="text-slate-500 dark:text-white/50">Ref No.</span><span className="font-mono bg-slate-100 dark:bg-emerald-500/10 px-2 rounded text-xs py-0.5">{selectedTx.referenceNumber}</span></div>}
                                        </div>
                                        {selectedTx.description && <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-sm text-slate-600 dark:text-white/80">{selectedTx.description}</div>}
                                    </div>
                                    {/* DYNAMIC FOOTER ACTIONS */}
                                    <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex flex-wrap-reverse justify-end gap-3">
                                        <button 
                                            type="button"
                                            onClick={closeModal} 
                                            className="px-4 py-2 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/15"
                                        >
                                            Close
                                        </button>

                                        {selectedTx.status.toLowerCase() === 'pending' && (
                                            <>
                                                {/* CANCEL BUTTON */}
                                                {['shareCapital', 'savings', 'loan'].includes(selectedTx.category) && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleCancelTransaction(selectedTx)}
                                                        disabled={isActionLoading}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-transparent text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-rose-500/30 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-500/10 transition disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Cancel
                                                    </button>
                                                )}

                                                {/* CONTINUE BUTTON */}
                                                {['membership', 'shareCapital', 'savings'].includes(selectedTx.category) && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleContinuePayment(selectedTx)}
                                                        disabled={isActionLoading}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition shadow-sm disabled:opacity-50"
                                                    >
                                                        <CreditCard className="h-4 w-4" /> Pay Now
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </PaymentReminderLayout>
        </SidebarLayout>
    );
}