import React, { useEffect, useState } from "react";
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    Download, Loader2, Search, Plus, Banknote, Wallet, 
    TrendingUp, Users, CheckCircle2, ChevronLeft, ChevronRight, 
    ArrowRight 
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { Combobox } from "@headlessui/react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";
import toast from "react-hot-toast";
import axios from 'axios';

// --- HELPERS ---
const asMoney = (v) => {
    const num = Number(v);
    return Number.isFinite(num)
        ? num.toLocaleString("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    : "₱0.00";
};

const toNumber = (v) => (Number.isFinite(+v) ? +v : 0);

export default function ShareCapital() {
    const { props } = usePage();
    const { stats: initialStats = {}, defaults = {} } = props;
    const [ stats, setStats ] = useState(initialStats);
    
    // Filters
    const [ search, setSearch ] = useState(defaults.search || '');
    const [ dateFrom, setDateFrom ] = useState(defaults.dateFrom || '');
    const [ dateTo, setDateTo ] = useState(defaults.dateTo || '');
    const [ perPage, setPerPage ] = useState(defaults.perPage || 10);

    // Data State
    const [ loading, setLoading ] = useState(false);
    const [ rows, setRows ] = useState([]);
    const [ meta, setMeta ] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });

    // Modal State
    const [ showModal, setShowModal ] = useState(false);
    const [ memberOptions, setMemberOptions ] = useState([]);
    const [ memberQuery, setMemberQuery ] = useState("");
    const [ loadMembers, setLoadMembers] = useState(false);
    const [ submitting, setSubmitting] = useState(false);

    // Form State
    const [ form, setForm ] = useState({
        memberId: '',
        transactionType: 'deposit',
        amount: '',
        referenceNumber: '',
    });

    // --- COMPUTED ---
    const filteredMembers = memberQuery.trim() === ""
        ? memberOptions
        : memberOptions.filter((m) =>
            m.label.toLowerCase().includes(memberQuery.toLowerCase())
        );

    // --- FETCH DATA ---
    const loadData = async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('admin.share-capital.api-index'), {
                params: { search, dateFrom, dateTo, perPage, page }
            });
            setRows(data.rows || []);
            setMeta(data.meta || { currentPage: 1, lastPage: 1, perPage, total: 0 });
        } catch (e) {
            console.error(e);
            toast.error("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const id = setTimeout(() => loadData(1), 300);
        return () => clearTimeout(id);
    }, [search, dateFrom, dateTo, perPage]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= meta.lastPage) loadData(page);
    };

    // --- HANDLERS ---
    const openModal = async () => {
        setShowModal(true);
        if (!memberOptions.length) {
            try {
                setLoadMembers(true);
                const { data } = await axios.get(route('admin.share-capital.api-members-min'));
                setMemberOptions(data.rows || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadMembers(false);
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setForm({ memberId: '', transactionType: 'deposit', amount: '', referenceNumber: '' });
        setMemberQuery("");
    };

    const submitEntry = async () => {
        if (!form.memberId || !form.amount) {
            toast.error("Member and amount are required.");
            return;
        }
    
        setSubmitting(true);
        try {
            const { data } = await axios.post(route('admin.share-capital.store'), {
                memberId: Number(form.memberId),
                transactionType: form.transactionType,
                amount: Number(form.amount),
                referenceNumber: form.referenceNumber || null,
            });
    
            if (!data?.success) {
                toast.error(data?.message || 'Transaction failed.');
                return;
            }
    
            toast.success(data.message || 'Transaction complete.');
            closeModal();
            await loadData(1);
            if (data.stats) setStats(data.stats);
        } catch (error) {
            const msg = error?.response?.data?.message || 'Failed to save entry.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const buildExportHref = (params) => {
        const clean = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
        );
        const qs = new URLSearchParams(clean).toString();
        return route("admin.share-capital.export") + (qs ? `?${qs}` : "");
    };

    return (
        <AdminSidebarLayout>
            <Head title="Share Capital" />
            
            <div className="space-y-6">
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Banknote className="h-8 w-8 text-emerald-600" />
                            Share Capital
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Monitor member capital contributions.
                        </p>
                    </div>
                    
                    {/* ACTIONS */}
                    <div className="flex flex-wrap items-center gap-2">
                        <a 
                            href={buildExportHref({ search, dateFrom, dateTo })} 
                            target="_blank"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 transition-colors text-sm font-medium"
                        >
                            <Download size={16} /> <span>Export</span>
                        </a>
                        <button
                            onClick={openModal}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all text-sm font-bold active:scale-95"
                        >
                            <Plus size={18} /> <span>New Transaction</span>
                        </button>
                    </div>
                </div>

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Share Capital" value={stats.totalShareCapital} icon={Wallet} color="emerald" prefix="₱" />
                    <StatCard label="This Month" value={stats.thisMonthShareCapital} icon={TrendingUp} color="blue" prefix="₱" />
                    <StatCard label="Contributors" value={stats.contributorCount} icon={Users} color="amber" />
                    <StatCard label="Paid Up" value={stats.postedShareCapital} icon={CheckCircle2} color="purple" prefix="₱" />
                </div>

                {/* --- FILTERS --- */}
                <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search name, username..." 
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Date Inputs: Grid on mobile for equal width */}
                    <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
                        <input type="date" className="w-full md:w-auto rounded-xl border border-slate-200 bg-white dark:bg-white/5 dark:border-white/10 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        <input type="date" className="w-full md:w-auto rounded-xl border border-slate-200 bg-white dark:bg-white/5 dark:border-white/10 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    </div>
                </div>

                {/* --- DATA LIST --- */}
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                    
                    {/* 1. DESKTOP TABLE */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4 text-right">Total Deposits</th>
                                    <th className="px-6 py-4 text-right">Total Withdrawals</th>
                                    <th className="px-6 py-4 text-right">Balance</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" /></td></tr>
                                ) : rows.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">No members found.</td></tr>
                                ) : (
                                    rows.map((r) => (
                                        <tr key={r.memberId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{r.member}</div>
                                                <div className="text-xs text-slate-500">@{r.username}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-emerald-600">{asMoney(r.totalDeposits)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-rose-600">{asMoney(r.totalWithdrawals)}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{asMoney(r.balance)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <Link href={route('admin.share-capital.member', r.memberId)} className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-500 text-xs font-bold uppercase tracking-wide transition-colors">
                                                    View Ledger <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -ml-1 transition-opacity"/>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 2. MOBILE CARD LIST */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
                        {loading ? (
                            <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" /></div>
                        ) : rows.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No records found.</div>
                        ) : (
                            rows.map((r) => (
                                <div key={r.memberId} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">{r.member}</div>
                                            <div className="text-xs text-slate-500">@{r.username}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Balance</div>
                                            <div className="font-mono font-bold text-slate-900 dark:text-white text-lg">{asMoney(r.balance)}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Deposits</span>
                                            <span className="font-mono font-medium text-emerald-600">{asMoney(r.totalDeposits)}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Withdrawals</span>
                                            <span className="font-mono font-medium text-rose-600">{asMoney(r.totalWithdrawals)}</span>
                                        </div>
                                    </div>

                                    <Link 
                                        href={route('admin.share-capital.member', r.memberId)} 
                                        className="flex items-center justify-center w-full py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-xl transition-colors border border-emerald-100 dark:border-emerald-500/20"
                                    >
                                        View Ledger
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>

                    {/* PAGINATION (Loan.jsx Style) */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            Page <span className="font-semibold text-slate-900 dark:text-white">{meta.currentPage}</span> of {meta.lastPage}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handlePageChange(meta.currentPage - 1)} 
                                disabled={meta.currentPage <= 1} 
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition"
                            >
                                <ArrowRight className="h-4 w-4 rotate-180" />
                            </button>
                            <button 
                                onClick={() => handlePageChange(meta.currentPage + 1)} 
                                disabled={meta.currentPage >= meta.lastPage} 
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- NEW TRANSACTION MODAL --- */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} 
                            onClick={closeModal} className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} 
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Share Capital Entry</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Record a deposit or withdrawal.</p>
                                </div>
                                <button onClick={closeModal} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition"><X size={20} className="text-slate-400"/></button>
                            </div>

                            {/* Scrollable Body */}
                            <div className="space-y-5 overflow-y-auto px-1">
                                {/* Member Search */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Member</label>
                                    <Combobox value={form.memberId} onChange={(val) => setForm({ ...form, memberId: val })}>
                                        <div className="relative">
                                            <Combobox.Input
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                placeholder="Search member..."
                                                onChange={(e) => setMemberQuery(e.target.value)}
                                                displayValue={(id) => memberOptions.find((m) => m.id === id)?.label || ""}
                                            />
                                            <Combobox.Options className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-white/10 shadow-xl">
                                                {loadMembers ? (
                                                    <div className="p-3 text-sm text-slate-500">Loading...</div>
                                                ) : filteredMembers.length === 0 ? (
                                                    <div className="p-3 text-sm text-slate-500">No member found.</div>
                                                ) : (
                                                    filteredMembers.map((m) => (
                                                        <Combobox.Option
                                                            key={m.id}
                                                            value={m.id}
                                                            className={({ active }) =>
                                                                `cursor-pointer px-4 py-2 text-sm ${active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`
                                                            }
                                                        >
                                                            {m.label}
                                                        </Combobox.Option>
                                                    ))
                                                )}
                                            </Combobox.Options>
                                        </div>
                                    </Combobox>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Type</label>
                                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl">
                                            <button 
                                                type="button" 
                                                onClick={() => setForm({ ...form, transactionType: 'deposit' })} 
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.transactionType === 'deposit' ? 'bg-white dark:bg-white/10 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                            >
                                                Deposit
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => setForm({ ...form, transactionType: 'withdrawal' })} 
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.transactionType === 'withdrawal' ? 'bg-white dark:bg-white/10 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                            >
                                                Withdrawal
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Amount</label>
                                        <input
                                            type="number"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Reference (Optional)</label>
                                    <input
                                        type="text"
                                        value={form.referenceNumber}
                                        onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="OR#, Ref#"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="mt-8 flex justify-end gap-3 shrink-0">
                                <button onClick={closeModal} type="button" className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 transition-colors">Cancel</button>
                                <button 
                                    onClick={submitEntry} 
                                    disabled={submitting} 
                                    type="button" 
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all ${form.transactionType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
                                >
                                    {submitting ? "Saving..." : "Save Transaction"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminSidebarLayout>
    );
}

// --- STAT CARD COMPONENT ---
function StatCard({ label, value, icon: Icon, color, prefix = "" }) {
    const colors = {
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
        purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
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