import React, { useEffect, useState } from "react";
import { Link, Head, usePage, router } from "@inertiajs/react";
import { 
    Eye, Banknote, Wallet, TrendingUp, Search, Plus, Loader2, 
    FileText, CheckCircle2, AlertCircle, Clock, XCircle, ArrowRight, X, User // <--- Added User icon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";

// --- DEDUCTION CODES LIST ---
const DEDUCTION_CODES = [
    "578 SL", "579 E/HL", "580 EdL", "581 MAL", 
    "P95 SBL", "583 CC", "584 SA", "691 PL", 
    "692 E/HL", "693 EdL", "694 MAL", "695 SBL", 
    "696 CC", "697 SA", "CASH ADVANCE", 
    "BARANGAY CAPTAIN collection", "BARANGAY TREASURER", "MANAGEMENT 1"
];

// --- HELPERS ---
const maskRef = (ref) => ref ? `${ref.slice(0, 3)}...${ref.slice(-4)}` : "N/A";

const asMoney = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

// --- COMPONENTS ---
function StatCard({ label, value, icon: Icon, color, subtext }) {
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
                    <CountUp end={toNumber(value)} duration={1} separator="," prefix="₱" decimals={2} />
                </p>
                {subtext && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
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

function ResultRow({ label, value, money, highlight }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span className={`font-mono font-medium ${highlight ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                {money ? asMoney(value) : (value || '-')}
            </span>
        </div>
    );
}

function StatusBadge({ status }) {
    const s = (status || "").toLowerCase();
    let style = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-slate-400 dark:border-white/10";
    let icon = <Clock size={12} />;

    if (s === "approved" || s === "released" || s === "completed") {
        style = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
        icon = <CheckCircle2 size={12} />;
    } else if (s === "pending") {
        style = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
        icon = <AlertCircle size={12} />;
    } else if (s === "declined" || s === "rejected") {
        style = "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
        icon = <XCircle size={12} />;
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style}`}>
            {icon} {status}
        </span>
    );
}

export default function Loan() {
    const { props } = usePage();
    const { loanStats = { totalGross: 0, totalNet: 0, loanAmount: 0 }, members = [], auth } = props;
    
    // --- AUTH ROLE CHECK ---
    const userRole = (auth?.user?.role || "").toLowerCase();
    const canCreate = ['super-admin', 'loan-processor'].includes(userRole);

    // --- STATE ---
    const [search, setSearch] = useState("");
    const [perPage, setPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [loans, setLoans] = useState([]);
    const [deductionCode, setDeductionCode] = useState("");
    const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [computing, setComputing] = useState(false);
    
    // Form State (keeping your existing state variables...)
    const [category, setCategory] = useState("ACTIVE_PENSIONER_V1");
    const [netProceeds, setNetProceeds] = useState(25000);
    const [capCon, setCapCon] = useState(5000);
    const [membershipFee, setMembershipFee] = useState(300);
    const [termYears, setTermYears] = useState(5);
    const [advanceInterestMonths, setAdvanceInterestMonths] = useState(2);
    const [memberId, setMemberId] = useState("");
    const [loanType, setLoanType] = useState("");
    const [loanClassification, setLoanClassification] = useState("");
    const [results, setResults] = useState({});

    // --- DATA LOADING ---
    const loadData = async (page = 1) => {
        if (loading) return;
        setLoading(true);
        try {
            const { data } = await axios.get("/admin/api/loans", { params: { search, perPage, page } });
            // Your API now returns 'rows'
            const rows = data.rows || [];
            const pagination = data.meta || {};
            
            setLoans(rows);
            setMeta({
                currentPage: pagination.currentPage ?? page,
                lastPage: pagination.lastPage ?? 1,
                perPage: pagination.perPage ?? perPage,
                total: pagination.total ?? rows.length,
            });
        } catch (e) {
            toast.error("Failed to load loans.");
            setLoans([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const id = setTimeout(() => loadData(1), 300);
        return () => clearTimeout(id);
    }, [search, perPage]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= meta.lastPage) loadData(page);
    };

    // --- COMPUTATION LOGIC (Keep existing) ---
    useEffect(() => {
        if (!canCreate) return; 
        if (!netProceeds || !termYears) return;
        setComputing(true);
        const terms = Number(termYears) * 12;

        axios.post("/admin/compute-loan", {
            category, netProceeds, capCon, membershipFee, terms, advanceInterestMonths
        })
        .then((res) => setResults(res.data || {}))
        .catch(() => {
            if (showModal) toast.error("Compute failed.");
            setResults({});
        })
        .finally(() => setComputing(false));
    }, [category, netProceeds, capCon, membershipFee, termYears, advanceInterestMonths, canCreate, showModal]);

    // --- SUBMISSION (Keep existing) ---
    const handleSubmitLoan = () => {
        if (!memberId) return toast.error("Please select a member.");
        if (!deductionCode) return toast.error("Please select a deduction code.");
        if (!loanType) return toast.error("Please select a loan type.");
        if (!loanClassification) return toast.error("Please select a classification.");

        axios.post("/admin/submit-loan", {
            memberId, category, netProceeds, membershipFee, capCon, termYears,
            advanceInterestMonths, loanType, loanClassification,deductionCode, status: "pending", computed: results,
        })
        .then((res) => {
            toast.success("Loan saved successfully.");
            setShowModal(false);
            loadData(1);
            if (res?.request?.responseURL) router.visit(res.request.responseURL);
        })
        .catch(() => toast.error("Submit failed."));
    };

    const resetForm = () => {
        setCategory("ACTIVE_PENSIONER_V1");
        setNetProceeds(25000);
        setCapCon(5000);
        setMembershipFee(300);
        setTermYears(5);
        setAdvanceInterestMonths(2);
        setMemberId("");
        setLoanType("");
        setLoanClassification("");
        setDeductionCode("");
        setResults({});
    };

    const todayStr = new Date().toLocaleString("en-PH", { month: "long", year: "numeric" });

    return (
        <>
            <Head title="Loans">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="space-y-6">
                    
                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                Loan Management
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Monitor performance and process applications.
                            </p>
                        </div>
                        
                        {canCreate && (
                            <button 
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all"
                            >
                                <Plus size={18} />
                                <span>New Loan</span>
                            </button>
                        )}
                    </div>

                    {/* STAT CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label="Total Gross Loans" value={loanStats.totalGross} icon={Banknote} color="emerald" subtext={`As of ${todayStr}`} />
                        <StatCard label="Total Net Loans" value={loanStats.totalNet} icon={Wallet} color="blue" subtext={`As of ${todayStr}`} />
                        <StatCard label="Total Loan Amount" value={loanStats.loanAmount} icon={TrendingUp} color="amber" subtext={`As of ${todayStr}`} />
                    </div>

                    {/* FILTERS */}
                    <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-4 shadow-sm transition-colors">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-white/40" />
                                <input 
                                    type="text" 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by reference, name, or username..." 
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-sm"
                                />
                            </div>
                            <div className="w-full md:w-32">
                                <select
                                    value={perPage}
                                    onChange={(e) => setPerPage(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                >
                                    {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} Rows</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* TABLE CARD */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm overflow-hidden transition-colors">
                        
                        {/* DESKTOP TABLE */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">#</th>
                                        <th className="px-6 py-4">Member Info</th>
                                        <th className="px-6 py-4">Reference</th>
                                        {/* --- ADDED HEADER --- */}
                                        <th className="px-6 py-4">Processed By</th>
                                        <th className="px-6 py-4 text-right">Gross</th>
                                        <th className="px-6 py-4 text-right">Amortization</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                                    {loading ? (
                                        <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/>Loading data...</td></tr>
                                    ) : loans.length === 0 ? (
                                        <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No records found.</td></tr>
                                    ) : (
                                        loans.map((row, idx) => (
                                            <tr key={row.loanReference || idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{(meta.currentPage - 1) * meta.perPage + (idx + 1)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900 dark:text-white">{row.lastName}, {row.firstName}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">@{row.username || 'user'}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">{maskRef(row.loanReference)}</td>
                                                {/* --- ADDED COLUMN CELL --- */}
                                                <td className="px-6 py-4">
                                                    {row.processor ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                                                                <User size={12} />
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                {row.processor}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic pl-8">System</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono">{asMoney(row.grossAmount)}</td>
                                                <td className="px-6 py-4 text-right font-mono">{asMoney(row.monthlyAmortization)}</td>
                                                <td className="px-6 py-4 text-center"><StatusBadge status={row.status} /></td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link 
                                                        href={route("admin.loans.showLoan", row.loanReference)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                                                    >
                                                        <Eye size={14} /> View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARDS */}
                        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <div className="p-10 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>
                            ) : loans.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">No records found.</div>
                            ) : (
                                loans.map((row) => (
                                    <div key={row.loanReference || row.id} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white">{row.lastName}, {row.firstName}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{maskRef(row.loanReference)}</div>
                                            </div>
                                            <StatusBadge status={row.status} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-white/5 pt-3 text-slate-600 dark:text-slate-300">
                                            <div>
                                                <span className="block text-[10px] uppercase opacity-60">Gross</span>
                                                <span className="font-mono font-medium">{asMoney(row.grossAmount)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[10px] uppercase opacity-60">Amortization</span>
                                                <span className="font-mono font-medium">{asMoney(row.monthlyAmortization)}</span>
                                            </div>
                                            {/* --- ADDED PROCESSOR INFO ON MOBILE --- */}
                                            <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-white/5 mt-2 flex items-center gap-2">
                                                <span className="text-[10px] uppercase opacity-60">Processed by:</span>
                                                <span className="font-semibold">{row.processor || 'System'}</span>
                                            </div>
                                        </div>
                                        <Link 
                                            href={route("admin.loans.showLoan", row.loanReference)}
                                            className="flex items-center justify-center w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-transform"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* PAGINATION */}
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

                {/* MODAL code remains largely the same, just keeping layout */}
                <AnimatePresence>
                    {showModal && canCreate && (
                        <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Loan Application</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Configure parameters and calculate terms.</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition"><X size={20} /></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <InputGroup label="Member">
                                                <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="input-field">
                                                    <option value="">— Select Member —</option>
                                                    {members.map(m => (
                                                        <option key={m.id} value={m.id}>{`${m.lastName}, ${m.firstName}`}</option>
                                                    ))}
                                                </select>
                                            </InputGroup>
                                            
                                            {/* --- DEDUCTION CODE DROPDOWN --- */}
                                            <InputGroup label="Deduction Code">
                                                <select 
                                                    value={deductionCode} 
                                                    onChange={(e) => setDeductionCode(e.target.value)} 
                                                    className="input-field"
                                                >
                                                    <option value="">— Select Code —</option>
                                                    {DEDUCTION_CODES.map(code => (
                                                        <option key={code} value={code}>{code}</option>
                                                    ))}
                                                </select>
                                            </InputGroup>

                                            <InputGroup label="Category">
                                                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
                                                    <option value="ACTIVE_PENSIONER_V1">ACTIVE PENSIONER</option>
                                                    <option value="CDEA">CDEA</option>
                                                </select>
                                            </InputGroup>

                                            <div className="grid grid-cols-2 gap-4">
                                                <InputGroup label="Type">
                                                    <select value={loanType} onChange={(e) => setLoanType(e.target.value)} className="input-field">
                                                        <option value="">— Select —</option>
                                                        <option value="New">New</option>
                                                        <option value="Renewal">Renewal</option>
                                                        <option value="Additional">Additional</option>
                                                    </select>
                                                </InputGroup>
                                                <InputGroup label="Class">
                                                    <select value={loanClassification} onChange={(e) => setLoanClassification(e.target.value)} className="input-field">
                                                        <option value="">— Select —</option>
                                                        <option value="Salary Loan">Salary</option>
                                                        <option value="Pension Loan">Pension</option>
                                                    </select>
                                                </InputGroup>
                                            </div>

                                            <InputGroup label="Net Proceeds">
                                                <input type="number" value={netProceeds} onChange={(e) => setNetProceeds(Number(e.target.value))} className="input-field" />
                                            </InputGroup>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputGroup label="Term (Years)">
                                                    <select value={termYears} onChange={(e) => setTermYears(Number(e.target.value))} className="input-field">
                                                        {[1,2,3,4,5].map(y => <option key={y} value={y}>{y} Year{y>1?'s':''}</option>)}
                                                    </select>
                                                </InputGroup>
                                                <InputGroup label="Adv. Interest (Mos)">
                                                    <input type="number" value={advanceInterestMonths} onChange={(e) => setAdvanceInterestMonths(Number(e.target.value))} className="input-field" />
                                                </InputGroup>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputGroup label="Capital Contrib.">
                                                    <input type="number" value={capCon} onChange={(e) => setCapCon(Number(e.target.value))} className="input-field" />
                                                </InputGroup>
                                                <InputGroup label="Membership Fee">
                                                    <input type="number" value={membershipFee} onChange={(e) => setMembershipFee(Number(e.target.value))} className="input-field" />
                                                </InputGroup>
                                            </div>

                                            {/* COMPUTATION BOX */}
                                            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Computation</h3>
                                                    {computing && <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />}
                                                </div>
                                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                                    <ResultRow label="Gross Amount" value={results.gross} money />
                                                    <ResultRow label="Loan Amount" value={results.loanAmount} money />
                                                    <ResultRow label="Monthly Amort." value={results.monthlyAmortization} money highlight />
                                                    <ResultRow label="Service Fee" value={results.serviceFee} money />
                                                    <ResultRow label="Insurance" value={results.insurance} money />
                                                    <ResultRow label="Adv. Interest" value={results.advanceInterest} money />
                                                    <ResultRow label="Effective Rate" value={results.effectiveInterestRateDisplay} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-white/5">
                                    <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition">Cancel</button>
                                    <button onClick={handleSubmitLoan} className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all">Submit Application</button>
                                </div>

                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* STYLES FOR INPUTS */}
                <style>{`
                    .input-field {
                        width: 100%;
                        padding: 0.5rem 0.75rem;
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