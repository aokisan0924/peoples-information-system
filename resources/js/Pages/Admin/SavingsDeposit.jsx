import React, { useEffect, useState, useRef } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { 
    Download, Loader2, RefreshCcw, Search, Eye, Plus, Banknote, Wallet, 
    TrendingUp, Users, X, ChevronLeft, ChevronRight, Check, ChevronDown, CalendarDays,
    ArrowDownCircle, ArrowUpCircle, AlertTriangle, Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Combobox } from "@headlessui/react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";
import toast from "react-hot-toast";
import axios from "axios";

const toNumber = (v) => (Number.isFinite(+v) ? +v : 0);

const todayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

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

export default function SavingsDeposit() {
    const { props } = usePage();
    const { stats: initialStats = {}, defaults = {} } = props;
    const [ stats, setStats ] = useState(initialStats);
    const [ memberQuery, setMemberQuery ] = useState('');

    const [ search, setSearch ] = useState(defaults.search || '');
    const [ dateFrom, setDateFrom ] = useState(defaults.dateFrom || '');
    const [ dateTo, setDateTo ] = useState(defaults.dateTo || '');
    const [ perPage, setPerPage ] = useState(defaults.perPage || 10);

    const [ loading, setLoading ] = useState(false);
    const [ rows, setRows ] = useState([]);
    const [ meta, setMeta ] = useState({ currentPage: 1, lastPage: 1, perPage: perPage, total: 0 });

    const [ showModal, setShowModal ] = useState(false);
    const [ memberOptions, setMemberOptions ] = useState([]);
    const [ loadMembers, setLoadMembers ] = useState(false);
    
    const [ form, setForm ] = useState({
        memberId: '',
        transactionType: 'deposit',
        amount: '',
        referenceNumber: '',
        transactionDate: todayISO(),
    });

    const [submitting, setSubmitting] = useState(false);

    const filteredMembers =
        memberQuery.trim() === ''
            ? memberOptions
            : memberOptions.filter((m) =>
                m.label.toLowerCase().includes(memberQuery.toLowerCase())
            );

    const handleFormChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const openModal = async () => {
        setShowModal(true);
        setForm({ memberId: '', transactionType: 'deposit', amount: '', referenceNumber: '', transactionDate: todayISO() });
        setMemberQuery("");

        if (!memberOptions.length) {
            try {
                setLoadMembers(true);
                const { data } = await axios.get(route('admin.savings.api-members-min'));
                setMemberOptions(data.rows || []);
            } catch (e) {
                console.error(e);
                toast.error('Failed to load members.');
            } finally {
                setLoadMembers(false);
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const submitForm = async (e) => {
        e.preventDefault();

        if (!form.memberId || !form.transactionType || !form.amount || !form.transactionDate) {
            toast.error('Please fill in all required fields.');
            return;
        }

        if (form.transactionDate > todayISO()) {
            toast.error('Transaction date cannot be in the future.');
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await axios.post(route('admin.savings.store'), {
                memberId: Number(form.memberId),
                transactionType: form.transactionType,
                amount: Number(form.amount),
                referenceNumber: form.referenceNumber || null,
                transactionDate: form.transactionDate,
            });

            if (!data?.success) {
                toast.error(data?.message || 'Transaction failed.');
                return;
            }

            toast.success(data.message || 'Transaction complete.');
            closeModal();
            await loadData(1);

            if (data.stats) {
                setStats(data.stats);
            }

        } catch (error) {
            console.error(error);
            const message = error?.response?.data?.message || 'Error saving transaction.';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const loadData = async (page = 1) => {
        if (loading) return;
        setLoading(true);

        try {
            const params = { search, dateFrom, dateTo, perPage, page };
            const { data } = await axios.get(route('admin.savings.api-index'), { params });

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
        if (page < 1 || page > meta.lastPage) return;
        loadData(page);
    };

    const handleExport = async () => {
        try {
            const params = { search, dateFrom, dateTo };
            const response = await axios.get(route("admin.savings.export"), { params, responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "savings-deposit.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            toast.error("Failed to export data.");
        }
    };

    const quickSetToday = () => {
        const d = new Date().toISOString().split('T')[0];
        setDateFrom(d); setDateTo(d);
    };

    const quickSetThisMonth = () => {
        const d = new Date(), y = d.getFullYear(), m = d.getMonth() + 1;
        setDateFrom(`${y}-${String(m).padStart(2, "0")}-01`);
        setDateTo(`${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`);
    };

    return (
        <>
            <Head title="Savings Deposit">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="space-y-6">
                    
                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <Banknote className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                Savings Deposit
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Monitor total savings balance per member.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={handleExport} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                                <Download size={18} />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                            <button onClick={openModal} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                                <Plus size={18} />
                                <span>New <span className="hidden sm:inline">Transaction</span></span>
                            </button>
                        </div>
                    </div>

                    {/* STAT CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard 
                            label="Total Savings" 
                            value={stats.totalSavingsDeposit} 
                            icon={Wallet} 
                            color="emerald" 
                            prefix="₱"
                        />
                        <StatCard 
                            label="This Month Savings" 
                            value={stats.thisMonthSavingsDeposit} 
                            icon={RefreshCcw} 
                            color="amber" 
                            prefix="₱"
                        />
                        <StatCard 
                            label="Contributors" 
                            value={stats.contributorCount} 
                            icon={Users} 
                            color="blue" 
                        />
                    </div>

                    {/* FILTER BAR */}
                    <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-4 shadow-sm transition-colors">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-white/40" />
                                <input 
                                    type="text" 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search member or reference..." 
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all"
                                />
                            </div>

                            {/* Date & Filter Controls */}
                            <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
                                <div className="flex gap-2">
                                    <ModernDatePicker value={dateFrom} onChange={setDateFrom} maxDate={todayISO()} placeholder="From" allowClear className="w-full sm:w-36" />
                                    <span className="text-slate-400 self-center hidden sm:block">-</span>
                                    <ModernDatePicker value={dateTo} onChange={setDateTo} maxDate={todayISO()} placeholder="To" allowClear className="w-full sm:w-36" />
                                </div>
                                
                                {/* Action Buttons Grid on Mobile */}
                                <div className="grid grid-cols-3 gap-2 sm:flex">
                                    <button onClick={quickSetToday} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 dark:text-slate-300 transition-colors">Today</button>
                                    <button onClick={quickSetThisMonth} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 dark:text-slate-300 whitespace-nowrap transition-colors">Month</button>
                                    <div className="relative">
                                        <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="w-full h-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:border-emerald-500 transition-all">
                                            <option className="text-slate-900" value={10}>10</option>
                                            <option className="text-slate-900" value={20}>20</option>
                                            <option className="text-slate-900" value={50}>50</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLE CARD */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm overflow-hidden transition-colors">
                        
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Member</th>
                                        <th className="px-6 py-4 text-right">Balance</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                                    {loading ? (
                                        <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/>Loading data...</td></tr>
                                    ) : rows.length === 0 ? (
                                        <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No records found.</td></tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr key={row.memberId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900 dark:text-white">{row.memberName}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{row.username || 'user'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">{asMoney(row.balance)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link href={route('admin.savings.member', row.memberId)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-xs font-medium transition-colors">
                                                        <Eye size={14} /> View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <div className="p-10 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>
                            ) : rows.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">No records found.</div>
                            ) : (
                                rows.map((row) => (
                                    <div key={row.memberId} className="p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white">{row.memberName}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">@{row.username}</div>
                                            </div>
                                            <Link href={route('admin.savings.member', row.memberId)} className="flex items-center px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide">
                                                View
                                            </Link>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-white/5">
                                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Current Balance</span>
                                            <span className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">{asMoney(row.balance)}</span>
                                        </div>
                                    </div>
                                ))
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
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${form.transactionType === 'withdrawal' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                            {form.transactionType === 'withdrawal' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Transaction</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Savings Deposit Entry</p>
                                        </div>
                                    </div>
                                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition"><X size={20} /></button>
                                </div>

                                <form onSubmit={submitForm} className="p-6 space-y-5 overflow-y-auto">
                                    {/* Member Select */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase tracking-wide">Select Member</label>
                                        <Combobox value={form.memberId} onChange={(val) => handleFormChange('memberId', val)}>
                                            <div className="relative">
                                                <Combobox.Input
                                                    className="input-field"
                                                    onChange={(e) => setMemberQuery(e.target.value)}
                                                    displayValue={(id) => memberOptions.find(m => m.id === id)?.label || ""}
                                                    placeholder="Search member..."
                                                />
                                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                                                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                                                </Combobox.Button>
                                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-lg py-1 text-sm ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                    {loadMembers ? <div className="p-2 text-slate-500 text-center text-xs">Loading...</div> :
                                                    filteredMembers.length === 0 ? <div className="p-2 text-slate-500 text-center text-xs">No members found.</div> :
                                                    filteredMembers.map((m) => (
                                                        <Combobox.Option key={m.id} value={m.id} className={({ active }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-emerald-50 text-emerald-900 dark:bg-white/10 dark:text-white' : 'text-slate-900 dark:text-slate-300'}`}>
                                                            {({ selected, active }) => (
                                                                <>
                                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{m.label}</span>
                                                                    {selected ? (
                                                                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                                            <Check className="h-4 w-4" aria-hidden="true" />
                                                                        </span>
                                                                    ) : null}
                                                                </>
                                                            )}
                                                        </Combobox.Option>
                                                    ))}
                                                </Combobox.Options>
                                            </div>
                                        </Combobox>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InputGroup label="Transaction Type">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleFormChange("transactionType", "deposit")}
                                                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.transactionType === "deposit" ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20" : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                                                >
                                                    <ArrowDownCircle size={15} /> Deposit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleFormChange("transactionType", "withdrawal")}
                                                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.transactionType === "withdrawal" ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/20" : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                                                >
                                                    <ArrowUpCircle size={15} /> Withdrawal
                                                </button>
                                            </div>
                                        </InputGroup>
                                        <InputGroup label="Amount">
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm pointer-events-none">₱</span>
                                                <input 
                                                    type="number" 
                                                    value={form.amount} 
                                                    onChange={(e) => handleFormChange("amount", e.target.value)}
                                                    className="input-field font-mono pl-7"
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        </InputGroup>
                                    </div>

                                    <InputGroup label="Transaction Date">
                                        <ModernDatePicker
                                            value={form.transactionDate}
                                            onChange={(val) => handleFormChange("transactionDate", val)}
                                            maxDate={todayISO()}
                                        />
                                        {form.transactionDate === todayISO() ? (
                                            <p className="text-[11px] text-slate-400 mt-1.5 ml-1">Defaults to today — pick an earlier date to log a past deposit or withdrawal.</p>
                                        ) : (
                                            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 ml-1 flex items-center gap-1">
                                                <AlertTriangle size={11} className="shrink-0" />
                                                Backdated entry — this will post as if made on {new Date(form.transactionDate + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}.
                                            </p>
                                        )}
                                    </InputGroup>

                                    <InputGroup label="Reference (Optional)">
                                        <div className="relative">
                                            <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input 
                                                type="text" 
                                                value={form.referenceNumber} 
                                                onChange={(e) => handleFormChange("referenceNumber", e.target.value)}
                                                className="input-field pl-9"
                                                placeholder="OR#, Ref#, Note"
                                            />
                                        </div>
                                    </InputGroup>

                                    {form.memberId && Number(form.amount) > 0 && (
                                        <div className={`rounded-xl px-4 py-3 text-xs leading-relaxed border ${form.transactionType === "withdrawal" ? "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300" : "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300"}`}>
                                            Recording a <strong className="font-mono">{asMoney(form.amount)}</strong> {form.transactionType} for{" "}
                                            <strong>{memberOptions.find(m => m.id === form.memberId)?.label || "the selected member"}</strong>
                                            , dated {new Date(form.transactionDate + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}.
                                        </div>
                                    )}
                                </form>

                                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-white/5 shrink-0">
                                    <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition">Cancel</button>
                                    <button
                                        onClick={submitForm}
                                        disabled={submitting || !form.memberId || !form.amount || !form.transactionDate}
                                        className={`px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${form.transactionType === "withdrawal" ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"}`}
                                    >
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
                        padding: 0.75rem 0.8rem;
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
        </>
    );
}

// --- SUB COMPONENTS ---
function StatCard({ label, value, icon: Icon, color, prefix = "" }) {
    const colors = {
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
        purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    };
    return (
        <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 shadow-sm flex items-center gap-4 transition-colors">
            <div className={`p-3 rounded-xl shrink-0 ${colors[color] || colors.emerald}`}>
                <Icon size={24} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5 truncate">
                    <CountUp end={toNumber(value)} duration={1} separator="," prefix={prefix} decimals={2} />
                </p>
            </div>
        </div>
    );
}

function InputGroup({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase tracking-wide">{label}</label>
            {children}
        </div>
    );
}

// Modernized calendar dropdown — replaces native <input type="date">.
// No extra dependency: built on the framer-motion / lucide-react already used in this file.
// Click the header label to jump from day-grid -> month-grid -> year-grid for fast navigation.
function ModernDatePicker({ value, onChange, maxDate, placeholder = "Select date", allowClear = false, className = "" }) {
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState("days"); // "days" | "months" | "years"
    const containerRef = useRef(null);

    const parseISO = (s) => {
        const [y, m, d] = s.split("-").map(Number);
        return new Date(y, m - 1, d);
    };
    const toISODate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const baseDate = value ? parseISO(value) : new Date();
    const [viewYear, setViewYear] = useState(baseDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(baseDate.getMonth());
    const [yearPageStart, setYearPageStart] = useState(Math.floor(baseDate.getFullYear() / 12) * 12);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const max = maxDate ? parseISO(maxDate) : null;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    // ── Navigation (meaning depends on which view is active) ───────────────
    const goPrev = () => {
        if (viewMode === "days") {
            if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
            else setViewMonth((m) => m - 1);
        } else if (viewMode === "months") {
            setViewYear((y) => y - 1);
        } else {
            setYearPageStart((s) => s - 12);
        }
    };
    const goNext = () => {
        if (viewMode === "days") {
            if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
            else setViewMonth((m) => m + 1);
        } else if (viewMode === "months") {
            setViewYear((y) => y + 1);
        } else {
            setYearPageStart((s) => s + 12);
        }
    };

    const headerLabel = viewMode === "days" ? monthLabel
        : viewMode === "months" ? String(viewYear)
        : `${yearPageStart} – ${yearPageStart + 11}`;

    const handleHeaderClick = () => {
        if (viewMode === "days") setViewMode("months");
        else if (viewMode === "months") {
            setYearPageStart(Math.floor(viewYear / 12) * 12);
            setViewMode("years");
        }
    };

    // ── Day grid ─────────────────────────────────────────────────────────
    const isCellDisabled = (d) => {
        if (!max) return false;
        return new Date(viewYear, viewMonth, d) > max;
    };
    const selectDay = (d) => {
        if (isCellDisabled(d)) return;
        onChange(toISODate(new Date(viewYear, viewMonth, d)));
        setOpen(false);
    };
    const isSelected = (d) => {
        if (!value) return false;
        const sel = parseISO(value);
        return sel.getFullYear() === viewYear && sel.getMonth() === viewMonth && sel.getDate() === d;
    };
    const isToday = (d) =>
        today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;

    // ── Month grid ───────────────────────────────────────────────────────
    const isMonthDisabled = (m) => {
        if (!max) return false;
        if (viewYear > max.getFullYear()) return true;
        return viewYear === max.getFullYear() && m > max.getMonth();
    };
    const selectMonth = (m) => {
        if (isMonthDisabled(m)) return;
        setViewMonth(m);
        setViewMode("days");
    };
    const isSelectedMonth = (m) => value && (() => {
        const sel = parseISO(value);
        return sel.getFullYear() === viewYear && sel.getMonth() === m;
    })();
    const isCurrentMonth = (m) => today.getFullYear() === viewYear && today.getMonth() === m;

    // ── Year grid ────────────────────────────────────────────────────────
    const yearCells = Array.from({ length: 12 }, (_, i) => yearPageStart + i);
    const isYearDisabled = (y) => max ? y > max.getFullYear() : false;
    const selectYear = (y) => {
        if (isYearDisabled(y)) return;
        setViewYear(y);
        setViewMode("months");
    };
    const isSelectedYear = (y) => value && parseISO(value).getFullYear() === y;
    const isCurrentYear = (y) => today.getFullYear() === y;

    const jumpToday = () => {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
        setViewMode("days");
        onChange(toISODate(today));
        setOpen(false);
    };

    const clearValue = () => {
        onChange("");
        setOpen(false);
    };

    const displayLabel = value
        ? parseISO(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
        : placeholder;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((o) => { const next = !o; if (next) setViewMode("days"); return next; })}
                className={`input-field flex items-center justify-between gap-2 text-left ${!value ? "text-slate-400 dark:text-slate-500" : ""}`}
            >
                <span className="flex items-center gap-2 truncate">
                    <CalendarDays size={15} className="text-emerald-500 shrink-0" />
                    {displayLabel}
                </span>
                <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-20 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-2xl p-3"
                    >
                        <div className="flex items-center justify-between mb-2 px-1">
                            <button type="button" onClick={goPrev} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 transition">
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={handleHeaderClick}
                                disabled={viewMode === "years"}
                                className={`text-sm font-bold text-slate-800 dark:text-white rounded-md px-2 py-0.5 transition ${viewMode !== "years" ? "hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer" : "cursor-default"}`}
                            >
                                {headerLabel}
                            </button>
                            <button type="button" onClick={goNext} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 transition">
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {viewMode === "days" && (
                            <>
                                <div className="grid grid-cols-7 gap-1 mb-1">
                                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                                        <div key={d} className="text-[10px] font-bold text-slate-400 text-center uppercase">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {cells.map((d, idx) => {
                                        if (d === null) return <div key={idx} className="h-8" />;
                                        const disabled = isCellDisabled(d);
                                        return (
                                            <button
                                                type="button"
                                                key={idx}
                                                disabled={disabled}
                                                onClick={() => selectDay(d)}
                                                className={`h-8 text-xs rounded-lg font-medium transition-all
                                                    ${isSelected(d) ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                                                        : isToday(d) ? "border border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                                        : disabled ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                                        : "text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-white/10"}`}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {viewMode === "months" && (
                            <div className="grid grid-cols-3 gap-1.5 py-1">
                                {monthNames.map((label, m) => {
                                    const disabled = isMonthDisabled(m);
                                    return (
                                        <button
                                            type="button"
                                            key={label}
                                            disabled={disabled}
                                            onClick={() => selectMonth(m)}
                                            className={`h-10 text-xs rounded-lg font-semibold transition-all
                                                ${isSelectedMonth(m) ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                                                    : isCurrentMonth(m) ? "border border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                                    : disabled ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                                    : "text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-white/10"}`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {viewMode === "years" && (
                            <div className="grid grid-cols-3 gap-1.5 py-1">
                                {yearCells.map((y) => {
                                    const disabled = isYearDisabled(y);
                                    return (
                                        <button
                                            type="button"
                                            key={y}
                                            disabled={disabled}
                                            onClick={() => selectYear(y)}
                                            className={`h-10 text-xs rounded-lg font-semibold transition-all
                                                ${isSelectedYear(y) ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                                                    : isCurrentYear(y) ? "border border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                                    : disabled ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                                    : "text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-white/10"}`}
                                        >
                                            {y}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-white/10">
                            {allowClear ? (
                                <button type="button" onClick={clearValue} className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    Clear
                                </button>
                            ) : (
                                <span className="text-[11px] text-slate-400">No future dates</span>
                            )}
                            <button type="button" onClick={jumpToday} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                                Today
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}