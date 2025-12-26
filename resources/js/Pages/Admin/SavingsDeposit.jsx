import React, { useEffect, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { 
    Download, Loader2, RefreshCcw, Search, Eye, Plus, Banknote, Wallet, 
    TrendingUp, Users, X, ChevronLeft, ChevronRight, Check, ChevronDown 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Combobox } from "@headlessui/react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";
import toast from "react-hot-toast";
import axios from "axios";

const toNumber = (v) => (Number.isFinite(+v) ? +v : 0);

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
        setForm({ memberId: '', transactionType: 'deposit', amount: '', referenceNumber: '' });
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

        if (!form.memberId || !form.transactionType || !form.amount) {
            toast.error('Please fill in all required fields.');
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await axios.post(route('admin.savings.store'), {
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
                                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:border-emerald-500 transition-all" />
                                    <span className="text-slate-400 self-center hidden sm:block">-</span>
                                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:border-emerald-500 transition-all" />
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
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5 shrink-0">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Transaction</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Savings Deposit Entry</p>
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
                                            <select 
                                                value={form.transactionType} 
                                                onChange={(e) => handleFormChange("transactionType", e.target.value)}
                                                className="input-field"
                                            >
                                                <option value="deposit" className="text-slate-900 dark:text-slate-900">Deposit</option>
                                                <option value="withdrawal" className="text-slate-900 dark:text-slate-900">Withdrawal</option>
                                            </select>
                                        </InputGroup>
                                        <InputGroup label="Amount">
                                            <input 
                                                type="number" 
                                                value={form.amount} 
                                                onChange={(e) => handleFormChange("amount", e.target.value)}
                                                className="input-field font-mono"
                                                placeholder="0.00"
                                            />
                                        </InputGroup>
                                    </div>

                                    <InputGroup label="Reference (Optional)">
                                        <input 
                                            type="text" 
                                            value={form.referenceNumber} 
                                            onChange={(e) => handleFormChange("referenceNumber", e.target.value)}
                                            className="input-field"
                                            placeholder="OR#, Ref#, Note"
                                        />
                                    </InputGroup>
                                </form>

                                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-white/5 shrink-0">
                                    <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition">Cancel</button>
                                    <button onClick={submitForm} disabled={submitting} className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95">
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