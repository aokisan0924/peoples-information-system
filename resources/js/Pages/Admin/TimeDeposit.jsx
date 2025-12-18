import React, { useEffect, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { 
    Download, Loader2, Search, Eye, Plus, PiggyBank, CalendarClock, Users, X, 
    ChevronLeft, ChevronRight, Check, ChevronDown, TrendingUp 
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

const getRatePercent = (termYears) => {
    switch (Number(termYears)) {
        case 1: return 6.3;
        case 2: return 6.5;
        case 3: return 7.0;
        case 4: return 7.3;
        case 5: return 7.5;
        default: return 0;
    }
};

export default function TimeDeposit() {
    const { props } = usePage();
    const { stats: initialStats = {}, defaults = {} } = props;

    const [stats, setStats] = useState(initialStats);
    const [search, setSearch] = useState(defaults.search || "");
    const [dateFrom, setDateFrom] = useState(defaults.dateFrom || "");
    const [dateTo, setDateTo] = useState(defaults.dateTo || "");
    const [perPage, setPerPage] = useState(defaults.perPage || 10);

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: perPage,
        total: 0,
    });

    const [showModal, setShowModal] = useState(false);
    const [memberOptions, setMemberOptions] = useState([]);
    const [memberQuery, setMemberQuery] = useState("");
    const [loadMembers, setLoadMembers] = useState(false);

    const [form, setForm] = useState({
        memberId: "",
        principal: "",
        termYears: "",
        startDate: "",
    });

    const [preview, setPreview] = useState({
        interestRate: 0,
        maturityValue: 0,
        totalInterest: 0,
    });

    const [submitting, setSubmitting] = useState(false);

    const filteredMembers =
        memberQuery.trim() === ""
            ? memberOptions
            : memberOptions.filter((m) =>
                m.label.toLowerCase().includes(memberQuery.toLowerCase())
            );

    const handleFormChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const openModal = async () => {
        setShowModal(true);
        setForm({ memberId: "", principal: "", termYears: "", startDate: "" });
        setMemberQuery("");
        setPreview({ interestRate: 0, maturityValue: 0, totalInterest: 0 });

        if (!memberOptions.length) {
            try {
                setLoadMembers(true);
                const { data } = await axios.get(route("admin.time.api-members-min"));
                setMemberOptions(data.rows || []);
            } catch (e) {
                console.error(e);
                toast.error("Failed to load members.");
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

        if (!form.memberId || !form.principal || !form.termYears || !form.startDate) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                memberId: Number(form.memberId),
                principal: Number(form.principal),
                termYears: Number(form.termYears),
                startDate: form.startDate,
            };

            const { data } = await axios.post(route("admin.time.store"), payload);

            if (!data?.success) {
                toast.error(data?.message || "Failed to save time deposit.");
                return;
            }

            toast.success(data.message || "Time deposit created.");
            closeModal();
            await loadData(1);

            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error(error);
            const message = error?.response?.data?.message || "Error saving time deposit.";
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
            const { data } = await axios.get(route("admin.time.api-index"), { params });

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

    useEffect(() => {
        const principal = Number(form.principal);
        const termYears = Number(form.termYears);
        const ratePercent = getRatePercent(termYears);

        if (principal > 0 && termYears > 0 && ratePercent > 0) {
            const r = ratePercent / 100;
            const maturityValue = principal * Math.pow(1 + r, termYears);
            const totalInterest = maturityValue - principal;

            setPreview({
                interestRate: ratePercent,
                maturityValue,
                totalInterest,
            });
        } else {
            setPreview({
                interestRate: ratePercent,
                maturityValue: 0,
                totalInterest: 0,
            });
        }
    }, [form.principal, form.termYears]);

    const handlePageChange = (page) => {
        if (page < 1 || page > meta.lastPage) return;
        loadData(page);
    };

    const handleExport = async () => {
        try {
            const params = { search, dateFrom, dateTo };
            const response = await axios.get(route("admin.time.export"), { params, responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "time-deposits.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Failed to export data.");
        }
    };

    const quickSetToday = () => {
        const d = new Date().toISOString().split('T')[0];
        setDateFrom(d); setDateTo(d);
    };

    const quickSetThisMonth = () => {
        const d = new Date(), y = d.getFullYear(), m = d.getMonth() + 1;
        setDateFrom(`${y}-${String(m).padStart(2, '0')}-01`);
        setDateTo(`${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`);
    };

    const quickSetThisYear = () => {
        const y = new Date().getFullYear();
        setDateFrom(`${y}-01-01`); setDateTo(`${y}-12-31`);
    };

    return (
        <AdminSidebarLayout>
            <Head title="Time Deposit" />

            <div className="space-y-6">
                
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <CalendarClock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            Time Deposit
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Manage fixed-term deposits and maturity tracking.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                            <Download size={18} />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        <button onClick={openModal} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all">
                            <Plus size={18} />
                            <span>New Transaction</span>
                        </button>
                    </div>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                        label="Total Principal" 
                        value={stats.totalTimeDepositPrincipal} 
                        icon={PiggyBank} 
                        color="emerald" 
                        prefix="₱"
                    />
                    <StatCard 
                        label="Maturity Value" 
                        value={stats.totalTimeDepositMaturity} 
                        icon={TrendingUp} 
                        color="amber" 
                        prefix="₱"
                    />
                    <StatCard 
                        label="Total Depositors" 
                        value={stats.depositorCount} 
                        icon={Users} 
                        color="blue" 
                    />
                </div>

                {/* FILTER BAR */}
                <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-4 shadow-sm transition-colors">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-white/40" />
                            <input 
                                type="text" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search member name or username..." 
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:border-emerald-500" />
                            <span className="text-slate-400 self-center">-</span>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                            <button onClick={quickSetToday} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 dark:text-slate-300">Today</button>
                            <button onClick={quickSetThisMonth} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 dark:text-slate-300 whitespace-nowrap">This Month</button>
                            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white text-sm outline-none">
                                <option className="text-slate-900" value={10}>10</option>
                                <option className="text-slate-900" value={20}>20</option>
                                <option className="text-slate-900" value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* DATA TABLE */}
                <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm overflow-hidden transition-colors">
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4 text-right">Principal</th>
                                    <th className="px-6 py-4 text-center">Term / Rate</th>
                                    <th className="px-6 py-4 text-right">Maturity Value</th>
                                    <th className="px-6 py-4">Dates</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/>Loading...</td></tr>
                                ) : rows.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No records found.</td></tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">{row.memberName}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{row.username || 'user'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400">{asMoney(row.principal)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="font-medium text-slate-900 dark:text-white">{row.termYears} Years</div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400">{row.interestRate}% p.a.</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold font-mono text-amber-600 dark:text-amber-400">{asMoney(row.maturityValue)}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                                                <div>Start: {row.startDate}</div>
                                                <div>End: {row.maturityDate}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link href={route('admin.time.member', row.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-xs font-medium transition-colors">
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
                        {rows.map((row) => (
                            <div key={row.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-slate-900 dark:text-white">{row.memberName}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{row.username}</div>
                                    </div>
                                    <span className="text-xs font-bold bg-slate-100 dark:bg-white/10 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{row.termYears} Yrs</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-white/5 pt-3">
                                    <div>
                                        <div className="text-[10px] uppercase opacity-60 dark:text-slate-400">Principal</div>
                                        <div className="font-mono text-emerald-600 dark:text-emerald-400">{asMoney(row.principal)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase opacity-60 dark:text-slate-400">Maturity</div>
                                        <div className="font-mono text-amber-600 dark:text-amber-400 font-bold">{asMoney(row.maturityValue)}</div>
                                    </div>
                                </div>
                                <Link href={route('admin.time.member', row.id)} className="flex items-center justify-center w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-transform">
                                    View Details
                                </Link>
                            </div>
                        ))}
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
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                            
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Time Deposit</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Create a new fixed-term deposit account.</p>
                                </div>
                                <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition"><X size={20} /></button>
                            </div>

                            <form onSubmit={submitForm} className="p-6 space-y-5">
                                {/* Member Select */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase tracking-wide">Select Member</label>
                                    <Combobox value={form.memberId} onChange={(val) => handleFormChange("memberId", val)}>
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

                                <div className="grid grid-cols-2 gap-4">
                                    <InputGroup label="Principal Amount">
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={form.principal} 
                                                onChange={(e) => handleFormChange("principal", e.target.value)}
                                                className="input-field pl-7 font-mono"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </InputGroup>
                                    <InputGroup label="Term (Years)">
                                        <select 
                                            value={form.termYears} 
                                            onChange={(e) => handleFormChange("termYears", e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="" className="text-slate-900 dark:text-slate-900">Select Term</option>
                                            {[1,2,3,4,5].map(y => (
                                                <option key={y} value={y} className="text-slate-900 dark:text-slate-900">
                                                    {y} Year{y>1?'s':''} @ {getRatePercent(y)}%
                                                </option>
                                            ))}
                                        </select>
                                    </InputGroup>
                                </div>

                                <InputGroup label="Start Date">
                                    <input 
                                        type="date" 
                                        value={form.startDate} 
                                        onChange={(e) => handleFormChange("startDate", e.target.value)}
                                        className="input-field"
                                    />
                                </InputGroup>

                                {/* PREVIEW BOX */}
                                {preview.interestRate > 0 && preview.maturityValue > 0 && (
                                    <div className="rounded-xl border border-dashed border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 p-4 text-sm">
                                        <div className="flex items-center gap-2 mb-3 border-b border-emerald-100 dark:border-white/5 pb-2">
                                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase text-xs tracking-wider">Maturity Projection</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">Interest Rate:</span>
                                                <span className="font-mono font-bold text-slate-900 dark:text-white">{preview.interestRate}% p.a.</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">Total Interest:</span>
                                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{asMoney(preview.totalInterest)}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-emerald-100 dark:border-white/5 mt-2">
                                                <span className="text-emerald-800 dark:text-emerald-300 font-bold">Maturity Value:</span>
                                                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-lg">{asMoney(preview.maturityValue)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-white/5 -mx-6 -mb-6 mt-6">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                                        {submitting ? 'Saving...' : 'Create Account'}
                                    </button>
                                </div>
                            </form>

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

// --- HELPER COMPONENTS ---
function StatCard({ label, value, icon: Icon, color, prefix = "" }) {
    const colors = {
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
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

function InputGroup({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase tracking-wide">{label}</label>
            {children}
        </div>
    );
}