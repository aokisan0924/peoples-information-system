import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, Head, usePage, router } from "@inertiajs/react";
import { 
    Eye, Banknote, Wallet, TrendingUp, Search, Plus, Loader2, 
    FileText, CheckCircle2, AlertCircle, Clock, XCircle, ArrowRight, 
    X, User, Layers, BookOpen, Calculator, ChevronDown, ChevronLeft, ChevronRight, Link as LinkIcon, ShieldCheck
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

const inputClasses = "w-full px-4 py-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-xs font-bold transition-all shadow-inner appearance-none";

function MemberComboBox({ value, onChange, options }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const selectedOption = options.find(o => o.id == value);
    const displayValue = selectedOption ? `${selectedOption.lastName}, ${selectedOption.firstName}` : '';

    const filtered = options.filter(o => {
        const term = search.toLowerCase();
        return (
            (o.firstName && o.firstName.toLowerCase().includes(term)) ||
            (o.lastName && o.lastName.toLowerCase().includes(term)) ||
            (o.username && o.username.toLowerCase().includes(term))
        );
    });

    return (
        <div className="relative" ref={ref}>
            <div
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none text-xs font-bold shadow-inner cursor-pointer flex justify-between items-center transition-all hover:border-emerald-400 group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`truncate ${!displayValue ? 'text-slate-400 font-medium' : ''}`}>
                    {displayValue || '— Search Member —'}
                </span>
                <ChevronDown size={14} className={`text-slate-400 group-hover:text-emerald-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-[60] w-full min-w-[300px] mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-[300px] flex flex-col overflow-hidden"
                    >
                        <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white shadow-inner font-semibold placeholder:font-medium"
                                    placeholder="Search name or username..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-1.5 custom-scrollbar">
                            {filtered.map(o => (
                                <div
                                    key={o.id}
                                    className="px-3 py-2.5 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer rounded-lg flex flex-col gap-0.5 transition-colors"
                                    onClick={() => {
                                        onChange(o.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <span className="text-slate-700 dark:text-slate-300 font-bold truncate">{o.lastName}, {o.firstName}</span>
                                    {o.username && <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">@{o.username}</span>}
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="p-6 text-xs text-slate-400 text-center font-medium flex flex-col items-center justify-center gap-2">
                                    <Search size={20} className="opacity-20" />
                                    No members found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function AccountComboBox({ value, onChange, options }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const selectedOption = options.find(o => o.accountCode === value);
    const displayValue = selectedOption ? `[${selectedOption.accountCode}] ${selectedOption.accountName}` : '';

    const filtered = options.filter(o =>
        (o.accountCode && o.accountCode.toLowerCase().includes(search.toLowerCase())) ||
        (o.accountName && o.accountName.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="relative" ref={ref}>
            <div
                className="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none text-xs font-bold shadow-inner cursor-pointer flex justify-between items-center transition-all hover:border-emerald-400 group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`truncate ${!displayValue ? 'text-slate-400 font-medium' : ''}`}>
                    {displayValue || '— Select Mapping —'}
                </span>
                <ChevronDown size={14} className={`text-slate-400 group-hover:text-emerald-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-[60] w-full min-w-[300px] mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-[300px] flex flex-col overflow-hidden"
                    >
                        <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white shadow-inner font-semibold placeholder:font-medium"
                                    placeholder="Search by code or name..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-1.5 custom-scrollbar">
                            {filtered.map(o => (
                                <div
                                    key={o.id}
                                    className="px-3 py-2.5 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer rounded-lg flex items-center gap-3 transition-colors"
                                    onClick={() => {
                                        onChange(o.accountCode);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded shadow-sm">{o.accountCode}</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-bold truncate">{o.accountName}</span>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="p-6 text-xs text-slate-400 text-center font-medium flex flex-col items-center justify-center gap-2">
                                    <Search size={20} className="opacity-20" />
                                    No accounts found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// --- COMPONENTS ---
function StatCard({ label, value, icon: Icon, color, subtext }) {
    const gradientColors = {
        emerald: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20 border-emerald-400/20",
        blue: "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20 border-blue-400/20",
        amber: "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20 border-amber-400/20",
    };

    return (
        <div className={`relative overflow-hidden rounded-[2rem] p-6 border shadow-lg flex items-center gap-5 transition-all hover:-translate-y-1 duration-300 group ${gradientColors[color] || gradientColors.emerald}`}>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500"></div>
            
            <div className="relative p-4 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/20">
                <Icon size={24} className="text-white drop-shadow-sm" />
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-black text-white font-mono drop-shadow-sm tracking-tight">
                    <CountUp end={toNumber(value)} duration={1.5} separator="," prefix="₱" decimals={2} />
                </p>
                {subtext && <p className="text-[10px] font-bold text-white/60 mt-1.5">{subtext}</p>}
            </div>
        </div>
    );
}

function InputGroup({ label, children }) {
    return (
        <div>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1">{label}</label>
            {children}
        </div>
    );
}

function StatusBadge({ status }) {
    const s = (status || "").toLowerCase();
    let style = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-white/10";
    let icon = <Clock size={12} strokeWidth={2.5} />;

    if (s === "approved" || s === "released" || s === "completed") {
        style = "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200 dark:from-emerald-500/10 dark:to-teal-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
        icon = <CheckCircle2 size={12} strokeWidth={2.5} />;
    } else if (s === "pending") {
        style = "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-400 dark:border-amber-500/20";
        icon = <AlertCircle size={12} strokeWidth={2.5} />;
    } else if (s === "declined" || s === "rejected") {
        style = "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200 dark:from-rose-500/10 dark:to-pink-500/10 dark:text-rose-400 dark:border-rose-500/20";
        icon = <XCircle size={12} strokeWidth={2.5} />;
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${style}`}>
            {icon} {status}
        </span>
    );
}

export default function Loan() {
    const { props } = usePage();
    const { loanStats = { totalGross: 0, totalNet: 0, loanAmount: 0 }, members = [], chartOfAccounts = [], auth } = props;
    
    const userRole = (auth?.user?.role || "").toLowerCase();
    const canCreate = ['super-admin', 'loan-processor'].includes(userRole);

    const [search, setSearch] = useState("");
    const [perPage, setPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [loans, setLoans] = useState([]);
    const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
    const [showModal, setShowModal] = useState(false);
    
    // --- MANUAL FORM STATE ---
    const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
    const [memberId, setMemberId] = useState("");
    const [deductionCode, setDeductionCode] = useState("");
    const [loanType, setLoanType] = useState("");
    const [loanClassification, setLoanClassification] = useState("");
    const [termYears, setTermYears] = useState(5);
    
    // Financial Inputs
    const [grossAmount, setGrossAmount] = useState("");
    const [loanAmount, setLoanAmount] = useState(""); // Principal
    const [netProceeds, setNetProceeds] = useState("");
    const [monthlyAmortization, setMonthlyAmortization] = useState("");
    
    // Rates
    const [monthlyInterestRate, setMonthlyInterestRate] = useState("");
    const [effectiveInterestRate, setEffectiveInterestRate] = useState("");

    // Deductions
    const [serviceFee, setServiceFee] = useState("");
    const [insurance, setInsurance] = useState("");
    const [advanceInterest, setAdvanceInterest] = useState("");
    const [capCon, setCapCon] = useState("");
    const [membershipFee, setMembershipFee] = useState("");

    // --- GL STATE (Hybrid) ---
    const [glMapping, setGlMapping] = useState({
        principal: "",
        netProceeds: "", 
        serviceFee: "",
        insurance: "",
        advanceInterest: "",
        capCon: "",
        membershipFee: ""
    });

    const [manualEntries, setManualEntries] = useState([]);

    // 1. Auto Generated Entries (Excluding Net Proceeds from the table)
    const activeEntries = useMemo(() => {
        const entries = [];
        
        if (toNumber(loanAmount) > 0) entries.push({ id: 'principal', title: 'Principal Amount', type: 'debit', amount: toNumber(loanAmount), accountCode: glMapping.principal });
        if (toNumber(netProceeds) > 0) entries.push({ id: 'netProceeds', title: 'Net Proceeds', type: 'credit', amount: toNumber(netProceeds), accountCode: glMapping.netProceeds });
        if (toNumber(serviceFee) > 0) entries.push({ id: 'serviceFee', title: 'Service Fee', type: 'credit', amount: toNumber(serviceFee), accountCode: glMapping.serviceFee });
        if (toNumber(insurance) > 0) entries.push({ id: 'insurance', title: 'Insurance', type: 'credit', amount: toNumber(insurance), accountCode: glMapping.insurance });
        if (toNumber(advanceInterest) > 0) entries.push({ id: 'advanceInterest', title: 'Advance Interest', type: 'credit', amount: toNumber(advanceInterest), accountCode: glMapping.advanceInterest });
        if (toNumber(capCon) > 0) entries.push({ id: 'capCon', title: 'Capital/Share Contribution', type: 'credit', amount: toNumber(capCon), accountCode: glMapping.capCon });
        if (toNumber(membershipFee) > 0) entries.push({ id: 'membershipFee', title: 'Membership Fee', type: 'credit', amount: toNumber(membershipFee), accountCode: glMapping.membershipFee });
        
        return entries;
    }, [loanAmount, netProceeds, serviceFee, insurance, advanceInterest, capCon, membershipFee, glMapping]);

    const updateGlMapping = (id, code) => setGlMapping(prev => ({ ...prev, [id]: code }));

    // 2. Manual Entries Handlers
    const addManualEntry = () => {
        setManualEntries([...manualEntries, { id: Date.now(), accountCode: '', debit: '', credit: '' }]);
    };

    const removeManualEntry = (id) => {
        setManualEntries(manualEntries.filter(entry => entry.id !== id));
    };

    const updateManualEntry = (id, field, value) => {
        setManualEntries(manualEntries.map(entry => {
            if (entry.id === id) {
                let updated = { ...entry, [field]: value };
                if (field === 'debit' && value !== '') updated.credit = '';
                if (field === 'credit' && value !== '') updated.debit = '';
                return updated;
            }
            return entry;
        }));
    };

    // 3. Combined Balancing Logic (Strict Debit = Credit)
    const totalDebit = useMemo(() => {
        const rawSum = activeEntries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0)
                    + manualEntries.reduce((sum, e) => sum + toNumber(e.debit), 0);
        return Math.round(rawSum * 100) / 100;
    }, [activeEntries, manualEntries]);

    const totalCredit = useMemo(() => {
        const rawSum = activeEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0)
                    + manualEntries.reduce((sum, e) => sum + toNumber(e.credit), 0);
        return Math.round(rawSum * 100) / 100;
    }, [activeEntries, manualEntries]);

    // True Accounting Balance: Debits must perfectly equal Credits
    const isBalanced = useMemo(() => {
        return Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
    }, [totalDebit, totalCredit]);

    const loadData = async (page = 1) => {
        if (loading) return;
        setLoading(true);
        try {
            const { data } = await axios.get("/admin/api/loans", { params: { search, perPage, page } });
            setLoans(data.rows || []);
            setMeta({
                currentPage: data.meta?.currentPage ?? page,
                lastPage: data.meta?.lastPage ?? 1,
                perPage: data.meta?.perPage ?? perPage,
                total: data.meta?.total ?? data.rows?.length ?? 0,
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

    const handleSubmitLoan = () => {
        if (!applicationDate) return toast.error("Please select an application date.");
        if (!memberId) return toast.error("Please select a member.");
        if (!deductionCode) return toast.error("Please select a deduction code.");
        if (!loanType) return toast.error("Please select a loan type.");
        if (!loanClassification) return toast.error("Please select a classification.");
        
        if (activeEntries.length === 0 && manualEntries.length === 0) {
            return toast.error("Please enter financial amounts to generate a ledger entry.");
        }
        if (activeEntries.some(e => !e.accountCode) || manualEntries.some(e => !e.accountCode)) {
            return toast.error("Missing Accounts! Please assign a Chart of Account to every ledger row.");
        }
        if (!isBalanced) {
            return toast.error(`Unbalanced Entry! Debits (₱${asMoney(totalDebit)}) must equal Credits (₱${asMoney(totalCredit)}).`);
        }

        const combinedJournalEntries = [
            ...activeEntries.map(e => ({
                accountCode: e.accountCode,
                debit: e.type === 'debit' ? e.amount : 0,
                credit: e.type === 'credit' ? e.amount : 0,
            })),
            ...manualEntries.map(e => ({
                accountCode: e.accountCode,
                debit: toNumber(e.debit),
                credit: toNumber(e.credit),
            }))
        ];

        axios.post("/admin/submit-loan", {
            applicationDate,
            memberId, termYears, loanType, loanClassification, deductionCode, status: "pending",
            netProceeds: toNumber(netProceeds), 
            membershipFee: toNumber(membershipFee), 
            capCon: toNumber(capCon),
            grossAmount: toNumber(grossAmount),
            loanAmount: toNumber(loanAmount),
            monthlyAmortization: toNumber(monthlyAmortization),
            monthlyInterestRate: toNumber(monthlyInterestRate), 
            effectiveInterestRate: toNumber(effectiveInterestRate), 
            serviceFee: toNumber(serviceFee),
            insurance: toNumber(insurance),
            advanceInterest: toNumber(advanceInterest),
            journalEntries: combinedJournalEntries
        })
        .then((res) => {
            toast.success("Loan saved successfully.");
            setShowModal(false);
            loadData(1);
            if (res?.request?.responseURL) router.visit(res.request.responseURL);
        })
        .catch(() => toast.error("Submit failed. Please verify the backend controller is configured."));
    };

    const resetForm = () => {
        setApplicationDate(new Date().toISOString().split('T')[0]);
        setMemberId("");
        setLoanType("");
        setLoanClassification("");
        setDeductionCode("");
        setTermYears(5);
        setNetProceeds("");
        setCapCon("");
        setMembershipFee("");
        setGrossAmount("");
        setLoanAmount("");
        setMonthlyAmortization("");
        setMonthlyInterestRate(""); 
        setEffectiveInterestRate(""); 
        setServiceFee("");
        setInsurance("");
        setAdvanceInterest("");
        setGlMapping({ principal: "", netProceeds: "", serviceFee: "", insurance: "", advanceInterest: "", capCon: "", membershipFee: "" });
        setManualEntries([]);
    };

    const todayStr = new Date().toLocaleString("en-PH", { month: "long", year: "numeric" });

    return (
        <AdminSidebarLayout>
            <Head title="Loans">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            
            <div className="space-y-8 p-4 md:p-6 max-w-[90rem] mx-auto animate-in fade-in duration-500">
                
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
                                <FileText className="h-6 w-6" strokeWidth={2.5} />
                            </div>
                            Loan Management
                        </h1>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 ml-1">
                            Monitor performance and process applications.
                        </p>
                    </div>
                    
                    {canCreate && (
                        <button 
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-95 w-full sm:w-auto justify-center"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            <span>New Manual Application</span>
                        </button>
                    )}
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Gross Loans" value={loanStats.totalGross} icon={Banknote} color="emerald" subtext={`As of ${todayStr}`} />
                    <StatCard label="Total Net Loans" value={loanStats.totalNet} icon={Wallet} color="blue" subtext={`As of ${todayStr}`} />
                    <StatCard label="Total Loan Amount" value={loanStats.loanAmount} icon={TrendingUp} color="amber" subtext={`As of ${todayStr}`} />
                </div>

                {/* FILTERS */}
                <div className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 p-2.5 shadow-sm transition-all">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input 
                                type="text" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by reference, name, or username..." 
                                className="w-full pl-12 pr-6 py-3.5 rounded-2xl border-none bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none text-sm font-semibold shadow-inner"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full text-slate-500 transition-colors">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <div className="w-full md:w-40 relative">
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(Number(e.target.value))}
                                className="w-full px-5 py-3.5 rounded-2xl border-none bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none text-sm font-bold shadow-inner appearance-none cursor-pointer"
                            >
                                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} Rows</option>)}
                            </select>
                            <ArrowRight className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* TABLE CARD */}
                <div className="rounded-[2rem] border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900 shadow-xl shadow-slate-200/10 dark:shadow-none overflow-hidden transition-colors">
                    
                    {/* DESKTOP TABLE */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">#</th>
                                    <th className="px-8 py-5">Member Info</th>
                                    <th className="px-8 py-5">Reference</th>
                                    <th className="px-8 py-5">Processed By</th>
                                    <th className="px-8 py-5 text-right">Gross</th>
                                    <th className="px-8 py-5 text-right">Amortization</th>
                                    <th className="px-8 py-5 text-center">Status</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700 dark:text-slate-200">
                                {loading ? (
                                    <tr><td colSpan="8" className="px-8 py-20 text-center text-slate-500"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-500"/>Loading records...</td></tr>
                                ) : loans.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/50">
                                                    <Layers className="w-8 h-8 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No records found</p>
                                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search criteria.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    loans.map((row, idx) => (
                                        <tr key={row.loanReference || idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-emerald-50/30 dark:hover:bg-white/[0.02] transition-colors group last:border-0">
                                            <td className="px-8 py-5 text-xs font-black text-slate-400">{(meta.currentPage - 1) * meta.perPage + (idx + 1)}</td>
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-slate-900 dark:text-white">{row.lastName}, {row.firstName}</div>
                                                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">@{row.username || 'user'}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-xs">{maskRef(row.loanReference)}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                {row.processor ? (
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-600">
                                                            <User size={12} className="text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            {row.processor}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md">System</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right font-mono font-bold">{asMoney(row.grossAmount)}</td>
                                            <td className="px-8 py-5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{asMoney(row.monthlyAmortization)}</td>
                                            <td className="px-8 py-5 text-center"><StatusBadge status={row.status} /></td>
                                            <td className="px-8 py-4 text-right">
                                                <Link 
                                                    href={route("admin.loans.showLoan", row.loanReference)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-600 text-xs font-bold transition-all shadow-sm active:scale-95"
                                                >
                                                    <Eye size={14} strokeWidth={2.5} /> View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="block sm:hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
                        {loading ? (
                            <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500"/></div>
                        ) : loans.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 font-bold">No records found.</div>
                        ) : (
                            loans.map((row) => (
                                <div key={row.loanReference || row.id} className="p-5 rounded-[2rem] border border-slate-200/80 bg-white dark:bg-slate-800 dark:border-white/5 shadow-md shadow-slate-200/20 dark:shadow-none relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="font-black text-slate-900 dark:text-white text-lg">{row.lastName}, {row.firstName}</div>
                                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">@{row.username || 'user'}</div>
                                            <div className="text-[10px] font-mono font-black text-slate-400 mt-2 bg-slate-50 dark:bg-slate-900/50 inline-block px-2 py-1 rounded-md">{maskRef(row.loanReference)}</div>
                                        </div>
                                        <StatusBadge status={row.status} />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-100 dark:border-white/5 pt-4 pb-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Gross</span>
                                            <span className="font-mono font-black text-slate-700 dark:text-slate-200 text-sm">{asMoney(row.grossAmount)}</span>
                                        </div>
                                        <div className="bg-emerald-50/50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                            <span className="block text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-1">Amortization</span>
                                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">{asMoney(row.monthlyAmortization)}</span>
                                        </div>
                                        
                                        <div className="col-span-2 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Processed by:</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-600">
                                                    <User size={10} className="text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                                                </div>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{row.processor || 'System'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Link 
                                        href={route("admin.loans.showLoan", row.loanReference)}
                                        className="flex items-center justify-center w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                                    >
                                        View Full Details
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>

                    {/* PAGINATION */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Page <span className="text-emerald-600 dark:text-emerald-400">{meta.currentPage}</span> of {meta.lastPage}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button 
                                onClick={() => handlePageChange(meta.currentPage - 1)} 
                                disabled={meta.currentPage <= 1} 
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:border-emerald-500 hover:text-emerald-600 dark:bg-slate-800 dark:border-white/10 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronLeft size={16} strokeWidth={3} />
                            </button>
                            <button 
                                onClick={() => handlePageChange(meta.currentPage + 1)} 
                                disabled={meta.currentPage >= meta.lastPage} 
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:border-emerald-500 hover:text-emerald-600 dark:bg-slate-800 dark:border-white/10 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronRight size={16} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* EXPANDED NEW PREMIUM MODAL */}
            <AnimatePresence>
                {showModal && canCreate && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 md:px-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        
                        <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} className="relative w-full max-w-7xl bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200/50 dark:border-white/10 my-4">
                            
                            {/* --- MODAL HEADER --- */}
                            <div className="px-8 py-6 border-b border-slate-200/60 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-800 z-10 shadow-sm relative">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                                        <FileText size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Manual Loan Application</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Map inputs to the general ledger</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 text-slate-500 transition-all active:scale-95 shadow-sm"><X size={18} strokeWidth={2.5}/></button>
                            </div>

                            {/* --- MODAL BODY --- */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-900">
                                
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                    
                                    {/* --- CARD 1: Identity & Classification --- */}
                                    <div className="xl:col-span-5 bg-white dark:bg-slate-800 rounded-[1.5rem] p-6 border border-slate-200/60 dark:border-white/10 shadow-sm space-y-5">
                                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                                                <User size={16} strokeWidth={2.5} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Identity & Classification</h3>
                                        </div>
                                        
                                        <InputGroup label="Member Search">
                                            <MemberComboBox 
                                                value={memberId} 
                                                options={members} 
                                                onChange={(id) => setMemberId(id)} 
                                            />
                                        </InputGroup>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <InputGroup label="Application Date">
                                                <input 
                                                    type="date" 
                                                    value={applicationDate} 
                                                    onChange={(e) => setApplicationDate(e.target.value)} 
                                                    className={inputClasses} 
                                                />
                                            </InputGroup>

                                            <InputGroup label="Deduction Code">
                                                <div className="relative">
                                                    <select value={deductionCode} onChange={(e) => setDeductionCode(e.target.value)} className={inputClasses}>
                                                        <option value="">— Select Code —</option>
                                                        {DEDUCTION_CODES.map(code => (
                                                            <option key={code} value={code}>{code}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </InputGroup>

                                            <InputGroup label="Type">
                                                <div className="relative">
                                                    <select value={loanType} onChange={(e) => setLoanType(e.target.value)} className={inputClasses}>
                                                        <option value="">— Select —</option>
                                                        <option value="New">New</option>
                                                        <option value="Renewal">Renewal</option>
                                                        <option value="Additional">Additional</option>
                                                    </select>
                                                </div>
                                            </InputGroup>

                                            <InputGroup label="Class">
                                                <div className="relative">
                                                    <select value={loanClassification} onChange={(e) => setLoanClassification(e.target.value)} className={inputClasses}>
                                                        <option value="">— Select —</option>
                                                        <option value="Salary Loan">Salary</option>
                                                        <option value="Pension Loan">Pension</option>
                                                    </select>
                                                </div>
                                            </InputGroup>

                                            <div className="sm:col-span-2">
                                                <InputGroup label="Term (Yrs)">
                                                    <div className="relative">
                                                        <select value={termYears} onChange={(e) => setTermYears(Number(e.target.value))} className={inputClasses}>
                                                            {[1,2,3,4,5].map(y => <option key={y} value={y}>{y}</option>)}
                                                        </select>
                                                    </div>
                                                </InputGroup>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- CARD 2: Financial Setup --- */}
                                    <div className="xl:col-span-7 bg-white dark:bg-slate-800 rounded-[1.5rem] p-6 border border-slate-200/60 dark:border-white/10 shadow-sm space-y-5">
                                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                                                <Calculator size={16} strokeWidth={2.5} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Loan Info</h3>
                                        </div>
                                        
                                        {/* Core Amounts Row */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-white/5">
                                            <InputGroup label="Gross Loan">
                                                <input type="number" value={grossAmount} onChange={(e) => setGrossAmount(e.target.value)} className={`${inputClasses} bg-white dark:bg-slate-800`} placeholder="0.00" />
                                            </InputGroup>
                                            <InputGroup label="Principal (Dr)">
                                                <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className={`${inputClasses} bg-blue-50/30 border-blue-200 focus:border-blue-500`} placeholder="0.00" />
                                            </InputGroup>
                                            <InputGroup label="Net Proceeds">
                                                <input type="number" value={netProceeds} onChange={(e) => setNetProceeds(e.target.value)} className={`${inputClasses} bg-emerald-50/30 border-emerald-200 focus:border-emerald-500`} placeholder="0.00" />
                                            </InputGroup>
                                            <InputGroup label="Amortization">
                                                <input type="number" value={monthlyAmortization} onChange={(e) => setMonthlyAmortization(e.target.value)} className={`${inputClasses} bg-white dark:bg-slate-800`} placeholder="0.00" />
                                            </InputGroup>
                                        </div>

                                        {/* Rates & Deductions */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="sm:col-span-2">
                                                <InputGroup label="Monthly Int. Rate (Dec)">
                                                    <input type="number" step="0.00001" value={monthlyInterestRate} onChange={(e) => setMonthlyInterestRate(e.target.value)} className={inputClasses} placeholder="0.015" />
                                                </InputGroup>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <InputGroup label="Effective Int. Rate (EIR)">
                                                    <input type="number" step="0.00001" value={effectiveInterestRate} onChange={(e) => setEffectiveInterestRate(e.target.value)} className={inputClasses} placeholder="0.18" />
                                                </InputGroup>
                                            </div>

                                            <InputGroup label="Service Fee">
                                                <input type="number" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} className={inputClasses} placeholder="0.00" />
                                            </InputGroup>
                                            <InputGroup label="Advance Int.">
                                                <input type="number" value={advanceInterest} onChange={(e) => setAdvanceInterest(e.target.value)} className={inputClasses} placeholder="0.00" />
                                            </InputGroup>
                                            <InputGroup label="Insurance">
                                                <input type="number" value={insurance} onChange={(e) => setInsurance(e.target.value)} className={inputClasses} placeholder="0.00" />
                                            </InputGroup>
                                            <InputGroup label="Cap. Contrib">
                                                <input type="number" value={capCon} onChange={(e) => setCapCon(e.target.value)} className={inputClasses} placeholder="0.00" />
                                            </InputGroup>
                                            <div className="sm:col-span-4">
                                                <InputGroup label="Membership Fee">
                                                    <input type="number" value={membershipFee} onChange={(e) => setMembershipFee(e.target.value)} className={inputClasses} placeholder="0.00" />
                                                </InputGroup>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* --- CARD 3: JOURNAL ENTRY BUILDER --- */}
                                <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                <BookOpen size={16} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-widest">Journal Entry Builder</h3>
                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Assign Chart of Accounts to balance the ledger.</p>
                                            </div>
                                        </div>
                                        
                                        {/* Status Badge */}
                                        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-sm ${isBalanced ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'}`}>
                                            {isBalanced ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                                            {isBalanced ? 'Balanced' : 'Unbalanced'}
                                        </div>
                                    </div>
                                    
                                    <div className="overflow-x-auto min-h-[300px] p-2">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                                                <tr>
                                                    <th className="px-6 py-4 w-[20%]">System Origin</th>
                                                    <th className="px-6 py-4 w-[45%]">Chart of Account Mapping</th>
                                                    <th className="px-6 py-4 w-[15%] text-right">Debit</th>
                                                    <th className="px-6 py-4 w-[15%] text-right">Credit</th>
                                                    <th className="px-6 py-4 w-[5%] text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                                
                                                {/* AUTO-GENERATED ROWS */}
                                                {activeEntries.length === 0 && manualEntries.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-20 text-center">
                                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                                <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                                                    <Calculator className="w-6 h-6 text-slate-300 dark:text-slate-600" strokeWidth={2} />
                                                                </div>
                                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Awaiting Financial Inputs</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    activeEntries.map((entry) => (
                                                        <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                                            <td className="px-6 py-3">
                                                                <span className={`text-[11px] font-black uppercase tracking-widest ${entry.type === 'debit' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                    {entry.title}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <AccountComboBox 
                                                                    value={entry.accountCode} 
                                                                    options={chartOfAccounts} 
                                                                    onChange={(code) => updateGlMapping(entry.id, code)} 
                                                                />
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-mono font-black text-sm text-slate-800 dark:text-slate-200">
                                                                {entry.type === 'debit' ? asMoney(entry.amount) : '-'}
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-mono font-black text-sm text-slate-800 dark:text-slate-200">
                                                                {entry.type === 'credit' ? asMoney(entry.amount) : '-'}
                                                            </td>
                                                            <td className="px-6 py-3 text-center">
                                                                {/* Locked */}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}

                                                {/* MANUAL ROWS */}
                                                {manualEntries.map((entry) => (
                                                    <tr key={entry.id} className="bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group border-l-4 border-l-rose-400 dark:border-l-rose-500">
                                                        <td className="px-6 py-3">
                                                            <span className="text-[11px] font-black uppercase tracking-widest text-rose-500/80 dark:text-rose-400/80 flex items-center gap-1.5">
                                                                <Plus size={12} strokeWidth={3} /> Manual Row
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <AccountComboBox 
                                                                value={entry.accountCode} 
                                                                options={chartOfAccounts} 
                                                                onChange={(code) => updateManualEntry(entry.id, 'accountCode', code)} 
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <input 
                                                                type="number" 
                                                                value={entry.debit}
                                                                onChange={(e) => updateManualEntry(entry.id, 'debit', e.target.value)}
                                                                disabled={entry.credit > 0}
                                                                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none text-xs font-mono font-bold text-right shadow-inner disabled:opacity-30 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:font-sans"
                                                                placeholder="0.00"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <input 
                                                                type="number" 
                                                                value={entry.credit}
                                                                onChange={(e) => updateManualEntry(entry.id, 'credit', e.target.value)}
                                                                disabled={entry.debit > 0}
                                                                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none text-xs font-mono font-bold text-right shadow-inner disabled:opacity-30 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:font-sans"
                                                                placeholder="0.00"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <button 
                                                                onClick={() => removeManualEntry(entry.id)} 
                                                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 transition-all active:scale-95"
                                                            >
                                                                <X size={16} strokeWidth={3} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            
                                            {/* CHECKOUT STYLE FOOTER */}
                                            <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t-2 border-slate-200 dark:border-white/10">
                                                <tr>
                                                    {/* Add Button Cell */}
                                                    <td className="px-6 py-5 align-top" colSpan="2">
                                                        <button 
                                                            onClick={addManualEntry} 
                                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl text-[11px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-black hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors active:scale-95"
                                                        >
                                                            <Plus size={14} strokeWidth={3} /> Add Manual Row
                                                        </button>
                                                    </td>
                                                    
                                                    {/* Debit Totals */}
                                                    <td className="px-6 py-5 text-right align-top border-r border-slate-200/50 dark:border-white/5">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Debits</p>
                                                        <p className={`font-mono font-black text-xl tracking-tight ${!isBalanced && totalDebit > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                                            {asMoney(totalDebit)}
                                                        </p>
                                                    </td>

                                                    {/* Credit Totals */}
                                                    <td className="px-6 py-5 text-right align-top">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Credits</p>
                                                        <p className={`font-mono font-black text-xl tracking-tight ${!isBalanced && totalDebit > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                                            {asMoney(totalCredit)}
                                                        </p>
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* --- MODAL FOOTER --- */}
                            <div className="px-8 py-6 border-t border-slate-200/60 dark:border-white/10 flex flex-col-reverse sm:flex-row justify-end gap-4 bg-white dark:bg-slate-800 relative z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                <button onClick={() => setShowModal(false)} className="w-full sm:w-auto px-8 py-4 rounded-2xl text-[11px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest text-center">Cancel</button>
                                
                                <button 
                                    onClick={handleSubmitLoan} 
                                    disabled={!isBalanced || (activeEntries.length === 0 && manualEntries.length === 0)}
                                    className="w-full sm:w-auto px-10 py-4 rounded-2xl text-[11px] font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-500/30 transition-all uppercase tracking-widest active:scale-95 text-center disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100"
                                >
                                    {isBalanced ? 'Submit Application' : 'Unbalanced Ledger'}
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </AdminSidebarLayout>
    );
}