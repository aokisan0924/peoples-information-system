import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, Head, usePage, router } from "@inertiajs/react";
import {
    Eye, Banknote, Wallet, TrendingUp, Search, Plus, Loader2,
    FileText, CheckCircle2, AlertCircle, Clock, XCircle, X,
    User, Layers, BookOpen, Calculator, ChevronDown,
    ChevronLeft, ChevronRight, ShieldCheck, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DEDUCTION_CODES = [
    "578 SL","579 E/HL","580 EdL","581 MAL","P95 SBL","583 CC","584 SA",
    "691 PL","692 E/HL","693 EdL","694 MAL","695 SBL","696 CC","697 SA",
    "CASH ADVANCE","BARANGAY CAPTAIN collection","BARANGAY TREASURER","MANAGEMENT 1",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const maskRef  = (ref) => ref ? `${ref.slice(0,3)}...${ref.slice(-4)}` : "N/A";
const asMoney  = (v)  => (Number.isFinite(Number(v)) ? Number(v) : 0)
    .toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });
const toNumber = (v)  => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

// ─── SHARED INPUT CLASS ───────────────────────────────────────────────────────
const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm font-semibold transition appearance-none dark:[color-scheme:dark]";

// ─── MEMBER COMBOBOX ─────────────────────────────────────────────────────────
function MemberComboBox({ value, onChange, options }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    const selected    = options.find(o => o.id == value);
    const displayVal  = selected ? `${selected.lastName}, ${selected.firstName}` : '';
    const filtered    = options.filter(o => {
        const t = search.toLowerCase();
        return o.firstName?.toLowerCase().includes(t) || o.lastName?.toLowerCase().includes(t) || o.username?.toLowerCase().includes(t);
    });
    return (
        <div className="relative" ref={ref}>
            <div onClick={() => setIsOpen(p => !p)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm font-semibold cursor-pointer flex justify-between items-center hover:border-emerald-400 transition group">
                <span className={!displayVal ? 'text-slate-400 font-normal' : ''}>{displayVal || 'Search member...'}</span>
                <ChevronDown size={14} className={`text-slate-400 group-hover:text-emerald-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, scale: 0.98, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -4 }} transition={{ duration: 0.12 }}
                        className="absolute z-[200] w-full mt-1.5 bg-white dark:bg-[#0f1a14] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-64"
                    >
                        <div className="p-2 border-b border-slate-100 dark:border-white/[0.06]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input autoFocus type="text" placeholder="Search name or username..." value={search} onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-1.5">
                            {filtered.map(o => (
                                <div key={o.id} onClick={() => { onChange(o.id); setIsOpen(false); setSearch(''); }}
                                    className="px-3 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer rounded-xl flex flex-col gap-0.5 transition-colors">
                                    <span className="font-semibold text-slate-900 dark:text-white">{o.lastName}, {o.firstName}</span>
                                    {o.username && <span className="text-xs text-emerald-600 dark:text-emerald-400">@{o.username}</span>}
                                </div>
                            ))}
                            {!filtered.length && <div className="p-6 text-xs text-slate-400 text-center flex flex-col items-center gap-2"><Search size={18} className="opacity-30" />No members found</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── ACCOUNT COMBOBOX ────────────────────────────────────────────────────────
function AccountComboBox({ value, onChange, options }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    const selected   = options.find(o => o.accountCode === value);
    const displayVal = selected ? `[${selected.accountCode}] ${selected.accountName}` : '';
    const filtered   = options.filter(o =>
        o.accountCode?.toLowerCase().includes(search.toLowerCase()) ||
        o.accountName?.toLowerCase().includes(search.toLowerCase())
    );
    return (
        <div className="relative" ref={ref}>
            <div onClick={() => setIsOpen(p => !p)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs font-semibold cursor-pointer flex justify-between items-center hover:border-emerald-400 transition group min-w-0">
                <span className={`truncate ${!displayVal ? 'text-slate-400 font-normal' : ''}`}>{displayVal || 'Select account...'}</span>
                <ChevronDown size={13} className={`text-slate-400 shrink-0 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, scale: 0.98, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -4 }} transition={{ duration: 0.12 }}
                        className="absolute z-[200] left-0 w-72 mt-1.5 bg-white dark:bg-[#0f1a14] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-60"
                    >
                        <div className="p-2 border-b border-slate-100 dark:border-white/[0.06]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input autoFocus type="text" placeholder="Search code or name..." value={search} onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-1.5">
                            {filtered.map(o => (
                                <div key={o.id} onClick={() => { onChange(o.accountCode); setIsOpen(false); setSearch(''); }}
                                    className="px-3 py-2.5 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer rounded-xl flex items-center gap-3 transition-colors">
                                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg shrink-0">{o.accountCode}</span>
                                    <span className="text-slate-700 dark:text-white/80 font-medium truncate">{o.accountName}</span>
                                </div>
                            ))}
                            {!filtered.length && <div className="p-6 text-xs text-slate-400 text-center flex flex-col items-center gap-2"><Search size={18} className="opacity-30" />No accounts found</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient, subtext }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex items-center gap-4 text-white shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${gradient}`}>
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm grid place-items-center shadow-inner">
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="relative z-10 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">{label}</p>
                <p className="text-xl sm:text-2xl font-black font-mono drop-shadow-sm tracking-tight">
                    <CountUp end={toNumber(value)} duration={1.4} separator="," prefix="₱" decimals={2} preserveValue />
                </p>
                {subtext && <p className="text-[10px] font-semibold text-white/55 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const s = (status || "").toLowerCase();
    let style = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-white/60 dark:border-white/10";
    let Icon  = Clock;
    if (["approved","released","completed"].includes(s)) { style = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20"; Icon = CheckCircle2; }
    else if (s === "pending")                            { style = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20";          Icon = AlertCircle; }
    else if (["declined","rejected"].includes(s))       { style = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20";                Icon = XCircle; }
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${style}`}>
            <Icon size={11} className="text-current shrink-0" /> {status}
        </span>
    );
}

// ─── FIELD ────────────────────────────────────────────────────────────────────
function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 ml-0.5">{label}</label>
            {children}
        </div>
    );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, iconBg, children }) {
    return (
        <div className="bg-white dark:bg-[#0d1a14] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div className={`h-8 w-8 rounded-xl grid place-items-center shrink-0 ${iconBg}`}>
                    <Icon size={15} className="text-current" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white/90">{title}</h3>
            </div>
            <div className="p-5 space-y-4">{children}</div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Loan() {
    const { props } = usePage();
    const { loanStats = { totalGross: 0, totalNet: 0, loanAmount: 0 }, members = [], chartOfAccounts = [], auth } = props;

    const userRole = (auth?.user?.role || "").toLowerCase();
    const canCreate = ['super-admin', 'loan-processor'].includes(userRole);

    // ── LIST STATE ────────────────────────────────────────────────────────────
    const [search,    setSearch]    = useState("");
    const [perPage,   setPerPage]   = useState(10);
    const [loading,   setLoading]   = useState(false);
    const [loans,     setLoans]     = useState([]);
    const [meta,      setMeta]      = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
    const [showModal, setShowModal] = useState(false);

    // ── FORM STATE ────────────────────────────────────────────────────────────
    const [applicationDate,      setApplicationDate]      = useState(new Date().toISOString().split('T')[0]);
    const [memberId,             setMemberId]             = useState("");
    const [deductionCode,        setDeductionCode]        = useState("");
    const [loanType,             setLoanType]             = useState("");
    const [loanClassification,   setLoanClassification]   = useState("");
    const [termYears,            setTermYears]            = useState(5);
    const [grossAmount,          setGrossAmount]          = useState("");
    const [loanAmount,           setLoanAmount]           = useState("");
    const [netProceeds,          setNetProceeds]          = useState("");
    const [monthlyAmortization,  setMonthlyAmortization]  = useState("");
    const [monthlyInterestRate,  setMonthlyInterestRate]  = useState("");
    const [effectiveInterestRate,setEffectiveInterestRate]= useState("");
    const [serviceFee,           setServiceFee]           = useState("");
    const [insurance,            setInsurance]            = useState("");
    const [advanceInterest,      setAdvanceInterest]      = useState("");
    const [capCon,               setCapCon]               = useState("");
    const [membershipFee,        setMembershipFee]        = useState("");
    const [glMapping,            setGlMapping]            = useState({ principal:"", netProceeds:"", serviceFee:"", insurance:"", advanceInterest:"", capCon:"", membershipFee:"" });
    const [manualEntries,        setManualEntries]        = useState([]);

    // ── GL ENTRIES ────────────────────────────────────────────────────────────
    const activeEntries = useMemo(() => {
        const e = [];
        if (toNumber(loanAmount)      > 0) e.push({ id:'principal',     title:'Principal Amount',         type:'debit',  amount:toNumber(loanAmount),      accountCode:glMapping.principal     });
        if (toNumber(netProceeds)     > 0) e.push({ id:'netProceeds',   title:'Net Proceeds',             type:'credit', amount:toNumber(netProceeds),     accountCode:glMapping.netProceeds   });
        if (toNumber(serviceFee)      > 0) e.push({ id:'serviceFee',    title:'Service Fee',              type:'credit', amount:toNumber(serviceFee),      accountCode:glMapping.serviceFee    });
        if (toNumber(insurance)       > 0) e.push({ id:'insurance',     title:'Insurance',                type:'credit', amount:toNumber(insurance),       accountCode:glMapping.insurance     });
        if (toNumber(advanceInterest) > 0) e.push({ id:'advanceInterest',title:'Advance Interest',       type:'credit', amount:toNumber(advanceInterest), accountCode:glMapping.advanceInterest});
        if (toNumber(capCon)          > 0) e.push({ id:'capCon',        title:'Capital Contribution',     type:'credit', amount:toNumber(capCon),          accountCode:glMapping.capCon        });
        if (toNumber(membershipFee)   > 0) e.push({ id:'membershipFee', title:'Membership Fee',           type:'credit', amount:toNumber(membershipFee),   accountCode:glMapping.membershipFee });
        return e;
    }, [loanAmount, netProceeds, serviceFee, insurance, advanceInterest, capCon, membershipFee, glMapping]);

    const updateGlMapping   = (id, code) => setGlMapping(p => ({ ...p, [id]: code }));
    const addManualEntry    = () => setManualEntries(p => [...p, { id: Date.now(), accountCode:'', debit:'', credit:'' }]);
    const removeManualEntry = (id) => setManualEntries(p => p.filter(e => e.id !== id));
    const updateManualEntry = (id, field, val) => setManualEntries(p => p.map(e => {
        if (e.id !== id) return e;
        let u = { ...e, [field]: val };
        if (field === 'debit'  && val !== '') u.credit = '';
        if (field === 'credit' && val !== '') u.debit  = '';
        return u;
    }));

    const totalDebit  = useMemo(() => Math.round((activeEntries.filter(e=>e.type==='debit').reduce((s,e)=>s+e.amount,0) + manualEntries.reduce((s,e)=>s+toNumber(e.debit),0)) * 100) / 100, [activeEntries, manualEntries]);
    const totalCredit = useMemo(() => Math.round((activeEntries.filter(e=>e.type==='credit').reduce((s,e)=>s+e.amount,0) + manualEntries.reduce((s,e)=>s+toNumber(e.credit),0)) * 100) / 100, [activeEntries, manualEntries]);
    const isBalanced  = useMemo(() => Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0, [totalDebit, totalCredit]);

    // ── DATA LOADING ──────────────────────────────────────────────────────────
    const loadData = async (page = 1) => {
        if (loading) return;
        setLoading(true);
        try {
            const { data } = await axios.get("/admin/api/loans", { params: { search, perPage, page } });
            setLoans(data.rows || []);
            setMeta({ currentPage: data.meta?.currentPage ?? page, lastPage: data.meta?.lastPage ?? 1, perPage: data.meta?.perPage ?? perPage, total: data.meta?.total ?? 0 });
        } catch { toast.error("Failed to load loans."); setLoans([]); }
        finally { setLoading(false); }
    };
    useEffect(() => { const t = setTimeout(() => loadData(1), 300); return () => clearTimeout(t); }, [search, perPage]);
    const handlePageChange = (p) => { if (p >= 1 && p <= meta.lastPage) loadData(p); };

    const resetForm = () => {
        setApplicationDate(new Date().toISOString().split('T')[0]); setMemberId(""); setDeductionCode(""); setLoanType(""); setLoanClassification(""); setTermYears(5);
        setGrossAmount(""); setLoanAmount(""); setNetProceeds(""); setMonthlyAmortization(""); setMonthlyInterestRate(""); setEffectiveInterestRate("");
        setServiceFee(""); setInsurance(""); setAdvanceInterest(""); setCapCon(""); setMembershipFee("");
        setGlMapping({ principal:"", netProceeds:"", serviceFee:"", insurance:"", advanceInterest:"", capCon:"", membershipFee:"" });
        setManualEntries([]);
    };

    const handleSubmitLoan = () => {
        if (!applicationDate) return toast.error("Please select an application date.");
        if (!memberId)         return toast.error("Please select a member.");
        if (!deductionCode)    return toast.error("Please select a deduction code.");
        if (!loanType)         return toast.error("Please select a loan type.");
        if (!loanClassification) return toast.error("Please select a classification.");
        if (activeEntries.length === 0 && manualEntries.length === 0) return toast.error("Enter financial amounts to generate ledger entries.");
        if (activeEntries.some(e => !e.accountCode) || manualEntries.some(e => !e.accountCode)) return toast.error("Please assign a Chart of Account to every ledger row.");
        if (!isBalanced) return toast.error(`Unbalanced! Debits (${asMoney(totalDebit)}) ≠ Credits (${asMoney(totalCredit)})`);
        const journalEntries = [
            ...activeEntries.map(e => ({ accountCode: e.accountCode, debit: e.type==='debit' ? e.amount : 0, credit: e.type==='credit' ? e.amount : 0 })),
            ...manualEntries.map(e => ({ accountCode: e.accountCode, debit: toNumber(e.debit), credit: toNumber(e.credit) }))
        ];
        axios.post("/admin/submit-loan", {
            applicationDate, memberId, termYears, loanType, loanClassification, deductionCode, status:"pending",
            netProceeds:toNumber(netProceeds), membershipFee:toNumber(membershipFee), capCon:toNumber(capCon),
            grossAmount:toNumber(grossAmount), loanAmount:toNumber(loanAmount), monthlyAmortization:toNumber(monthlyAmortization),
            monthlyInterestRate:toNumber(monthlyInterestRate), effectiveInterestRate:toNumber(effectiveInterestRate),
            serviceFee:toNumber(serviceFee), insurance:toNumber(insurance), advanceInterest:toNumber(advanceInterest), journalEntries
        }).then(() => { toast.success("Loan saved successfully."); setShowModal(false); loadData(1); })
            .catch(() => toast.error("Submit failed. Please verify the backend controller."));
    };

    const todayStr = new Date().toLocaleString("en-PH", { month: "long", year: "numeric" });

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <AdminSidebarLayout>
            <Head title="Loan Management">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="space-y-5 sm:space-y-6 pb-10">

                {/* ── HEADER ──────────────────────────────────────────────── */}
                <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-sm">
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow-lg shadow-emerald-500/25 shrink-0">
                                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Loan Management</h1>
                                <p className="text-xs sm:text-sm text-slate-400 dark:text-white/40 font-medium mt-0.5">Monitor performance and process applications.</p>
                            </div>
                        </div>
                        {canCreate && (
                            <button onClick={() => { resetForm(); setShowModal(true); }}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-95 w-full sm:w-auto"
                            >
                                <Plus size={16} className="text-current" /> New Application
                            </button>
                        )}
                    </div>
                </div>

                {/* ── STAT CARDS ───────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <StatCard label="Total Gross Loans"  value={loanStats.totalGross} icon={Banknote}   gradient="bg-gradient-to-br from-emerald-500 to-teal-600"   subtext={`As of ${todayStr}`} />
                    <StatCard label="Total Net Loans"    value={loanStats.totalNet}   icon={Wallet}     gradient="bg-gradient-to-br from-blue-500 to-indigo-600"    subtext={`As of ${todayStr}`} />
                    <StatCard label="Total Loan Amount"  value={loanStats.loanAmount} icon={TrendingUp} gradient="bg-gradient-to-br from-amber-500 to-orange-500"   subtext={`As of ${todayStr}`} />
                </div>

                {/* ── FILTERS ──────────────────────────────────────────────── */}
                <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-3 sm:p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/30 pointer-events-none" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search by reference, name, or username..."
                                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm transition"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-200 dark:bg-white/15 text-slate-500 dark:text-white/60 hover:bg-slate-300 dark:hover:bg-white/25 transition">
                                    <X size={13} className="text-current" />
                                </button>
                            )}
                        </div>
                        <select value={perPage} onChange={e => setPerPage(Number(e.target.value))}
                            className="w-full sm:w-36 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500/40 outline-none transition appearance-none cursor-pointer dark:[color-scheme:dark]"
                        >
                            {[10,20,50,100].map(n => <option key={n} value={n}>{n} per page</option>)}
                        </select>
                    </div>
                </div>

                {/* ── LOANS TABLE ──────────────────────────────────────────── */}
                <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">

                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                                <tr>
                                    <th className="px-5 lg:px-6 py-4">#</th>
                                    <th className="px-5 lg:px-6 py-4">Member</th>
                                    <th className="px-5 lg:px-6 py-4">Reference</th>
                                    <th className="px-5 lg:px-6 py-4 hidden lg:table-cell">Processed By</th>
                                    <th className="px-5 lg:px-6 py-4 text-right">Gross</th>
                                    <th className="px-5 lg:px-6 py-4 text-right">Amortization</th>
                                    <th className="px-5 lg:px-6 py-4 text-center">Status</th>
                                    <th className="px-5 lg:px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                                {loading ? (
                                    <tr><td colSpan="8" className="py-20 text-center"><Loader2 className="h-7 w-7 animate-spin mx-auto mb-3 text-emerald-500" /><p className="text-sm text-slate-400">Loading records...</p></td></tr>
                                ) : !loans.length ? (
                                    <tr><td colSpan="8" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-white/30">
                                            <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-white/5 grid place-items-center"><Layers className="h-7 w-7 opacity-50" /></div>
                                            <p className="text-sm font-semibold">No records found</p>
                                            <p className="text-xs">Try adjusting your search criteria.</p>
                                        </div>
                                    </td></tr>
                                ) : loans.map((row, idx) => (
                                    <tr key={row.loanReference || idx} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 lg:px-6 py-4 text-xs font-bold text-slate-400">{(meta.currentPage-1)*meta.perPage+(idx+1)}</td>
                                        <td className="px-5 lg:px-6 py-4">
                                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{row.lastName}, {row.firstName}</p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">@{row.username||'user'}</p>
                                        </td>
                                        <td className="px-5 lg:px-6 py-4">
                                            <span className="font-mono font-bold text-slate-600 dark:text-white/70 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg text-xs">{maskRef(row.loanReference)}</span>
                                        </td>
                                        <td className="px-5 lg:px-6 py-4 hidden lg:table-cell">
                                            {row.processor
                                                ? <div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-white/10 grid place-items-center"><User size={12} className="text-slate-500 dark:text-white/50" /></div><span className="text-xs font-semibold text-slate-700 dark:text-white/80">{row.processor}</span></div>
                                                : <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-md">System</span>
                                            }
                                        </td>
                                        <td className="px-5 lg:px-6 py-4 text-right font-mono font-semibold text-slate-800 dark:text-white/90 text-sm">{asMoney(row.grossAmount)}</td>
                                        <td className="px-5 lg:px-6 py-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{asMoney(row.monthlyAmortization)}</td>
                                        <td className="px-5 lg:px-6 py-4 text-center"><StatusBadge status={row.status} /></td>
                                        <td className="px-5 lg:px-6 py-4 text-right">
                                            <Link href={route("admin.loans.showLoan", row.loanReference)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white border border-slate-200 dark:border-white/10 text-xs font-bold transition-all active:scale-95"
                                            ><Eye size={13} className="text-current" /> View</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
                        {loading ? (
                            <div className="py-16 text-center"><Loader2 className="h-7 w-7 animate-spin mx-auto text-emerald-500" /></div>
                        ) : !loans.length ? (
                            <div className="py-16 text-center text-slate-400 text-sm font-semibold">No records found.</div>
                        ) : loans.map(row => (
                            <div key={row.loanReference||row.id} className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{row.lastName}, {row.firstName}</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">@{row.username||'user'}</p>
                                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-md inline-block mt-1.5">{maskRef(row.loanReference)}</span>
                                    </div>
                                    <StatusBadge status={row.status} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/[0.06]">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Gross</p>
                                        <p className="font-mono font-bold text-slate-800 dark:text-white text-sm">{asMoney(row.grossAmount)}</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-1">Amortization</p>
                                        <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">{asMoney(row.monthlyAmortization)}</p>
                                    </div>
                                </div>
                                <Link href={route("admin.loans.showLoan", row.loanReference)}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95"
                                ><Eye size={13} className="text-current" /> View Full Details</Link>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                        <p className="text-xs font-semibold text-slate-400 dark:text-white/30">
                            Showing page <span className="text-emerald-600 dark:text-emerald-400 font-bold">{meta.currentPage}</span> of {meta.lastPage} · {meta.total} total
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => handlePageChange(1)} disabled={meta.currentPage <= 1} className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                <ChevronsLeft size={14} className="text-current" />
                            </button>
                            <button onClick={() => handlePageChange(meta.currentPage - 1)} disabled={meta.currentPage <= 1} className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                <ChevronLeft size={14} className="text-current" />
                            </button>
                            <button onClick={() => handlePageChange(meta.currentPage + 1)} disabled={meta.currentPage >= meta.lastPage} className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                <ChevronRight size={14} className="text-current" />
                            </button>
                            <button onClick={() => handlePageChange(meta.lastPage)} disabled={meta.currentPage >= meta.lastPage} className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                <ChevronsRight size={14} className="text-current" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── LOAN APPLICATION MODAL ────────────────────────────────────── */}
            <AnimatePresence>
                {showModal && canCreate && (
                    <motion.div
                        className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 lg:p-6"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md" onClick={() => setShowModal(false)} />

                        <motion.div
                            className="relative w-full max-w-6xl bg-white dark:bg-[#0a1510] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden flex flex-col"
                            style={{ maxHeight: '94dvh' }}
                            initial={{ opacity: 0, scale: 0.97, y: -14 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: -14 }}
                            transition={{ type: "spring", damping: 32, stiffness: 360, mass: 0.85 }}
                        >
                            {/* Modal header */}
                            <div className="shrink-0 flex items-center justify-between gap-4 px-5 sm:px-7 py-4 sm:py-5 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-800">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-xl bg-white/15 grid place-items-center shrink-0">
                                        <FileText size={18} className="text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Manual Loan Application</h2>
                                        <p className="text-[10px] text-emerald-100/60 font-semibold hidden sm:block">Map inputs to general ledger accounts</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} aria-label="Close"
                                    className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95">
                                    <X size={18} className="text-current" />
                                </button>
                            </div>

                            {/* Modal body */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 bg-slate-50/50 dark:bg-white/[0.02]">

                                {/* SECTION 1: Identity & Classification */}
                                <SectionCard title="Identity & Classification" icon={User} iconBg="bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                    <Field label="Member Search">
                                        <MemberComboBox value={memberId} options={members} onChange={setMemberId} />
                                    </Field>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                        <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                                            <Field label="Application Date">
                                                <input type="date" value={applicationDate} onChange={e => setApplicationDate(e.target.value)} className={inputCls} />
                                            </Field>
                                        </div>
                                        <div className="col-span-2 sm:col-span-2 lg:col-span-2">
                                            <Field label="Deduction Code">
                                                <select value={deductionCode} onChange={e => setDeductionCode(e.target.value)} className={inputCls}>
                                                    <option value="">— Select Code —</option>
                                                    {DEDUCTION_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </Field>
                                        </div>
                                        <Field label="Loan Type">
                                            <select value={loanType} onChange={e => setLoanType(e.target.value)} className={inputCls}>
                                                <option value="">— Select —</option>
                                                <option value="New">New</option>
                                                <option value="Renewal">Renewal</option>
                                                <option value="Additional">Additional</option>
                                            </select>
                                        </Field>
                                        <Field label="Classification">
                                            <select value={loanClassification} onChange={e => setLoanClassification(e.target.value)} className={inputCls}>
                                                <option value="">— Select —</option>
                                                <option value="Salary Loan">Salary</option>
                                                <option value="Pension Loan">Pension</option>
                                            </select>
                                        </Field>
                                        <Field label="Term (Years)">
                                            <select value={termYears} onChange={e => setTermYears(Number(e.target.value))} className={inputCls}>
                                                {[1,2,3,4,5].map(y => <option key={y} value={y}>{y} yr{y>1?'s':''}</option>)}
                                            </select>
                                        </Field>
                                    </div>
                                </SectionCard>

                                {/* SECTION 2: Financial Setup */}
                                <SectionCard title="Loan Financials" icon={Calculator} iconBg="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                    {/* Core amounts */}
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-3">Core Amounts</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <Field label="Gross Loan">
                                                <input type="number" value={grossAmount} onChange={e => setGrossAmount(e.target.value)} className={inputCls} placeholder="0.00" />
                                            </Field>
                                            <Field label="Principal (DR)">
                                                <input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className={`${inputCls} border-blue-200 dark:border-blue-500/30 focus:border-blue-500 focus:ring-blue-500/30`} placeholder="0.00" />
                                            </Field>
                                            <Field label="Net Proceeds (CR)">
                                                <input type="number" value={netProceeds} onChange={e => setNetProceeds(e.target.value)} className={`${inputCls} border-emerald-200 dark:border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/30`} placeholder="0.00" />
                                            </Field>
                                            <Field label="Monthly Amort.">
                                                <input type="number" value={monthlyAmortization} onChange={e => setMonthlyAmortization(e.target.value)} className={inputCls} placeholder="0.00" />
                                            </Field>
                                        </div>
                                    </div>
                                    {/* Rates & deductions */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                        <div className="col-span-2 sm:col-span-3 lg:col-span-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="Monthly Int. Rate">
                                                    <input type="number" step="0.00001" value={monthlyInterestRate} onChange={e => setMonthlyInterestRate(e.target.value)} className={inputCls} placeholder="0.015" />
                                                </Field>
                                                <Field label="Effective Int. Rate">
                                                    <input type="number" step="0.00001" value={effectiveInterestRate} onChange={e => setEffectiveInterestRate(e.target.value)} className={inputCls} placeholder="0.18" />
                                                </Field>
                                            </div>
                                        </div>
                                        <Field label="Service Fee">    <input type="number" value={serviceFee}      onChange={e=>setServiceFee(e.target.value)}      className={inputCls} placeholder="0.00" /></Field>
                                        <Field label="Advance Int.">   <input type="number" value={advanceInterest} onChange={e=>setAdvanceInterest(e.target.value)} className={inputCls} placeholder="0.00" /></Field>
                                        <Field label="Insurance">      <input type="number" value={insurance}       onChange={e=>setInsurance(e.target.value)}       className={inputCls} placeholder="0.00" /></Field>
                                        <Field label="Cap. Contrib.">  <input type="number" value={capCon}          onChange={e=>setCapCon(e.target.value)}           className={inputCls} placeholder="0.00" /></Field>
                                        <div className="col-span-2">
                                            <Field label="Membership Fee"><input type="number" value={membershipFee} onChange={e=>setMembershipFee(e.target.value)} className={inputCls} placeholder="0.00" /></Field>
                                        </div>
                                    </div>
                                </SectionCard>

                                {/* SECTION 3: Journal Entry Builder */}
                                <div className="bg-white dark:bg-[#0d1a14] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 grid place-items-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                                <BookOpen size={15} className="text-current" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white/90">Journal Entry Builder</p>
                                                <p className="text-[10px] text-slate-400 dark:text-white/30 mt-0.5">Assign Chart of Accounts to balance the ledger</p>
                                            </div>
                                        </div>
                                        {/* Balance status */}
                                        <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border ${isBalanced ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'}`}>
                                            {isBalanced ? <ShieldCheck size={15} className="text-current" /> : <AlertCircle size={15} className="text-current" />}
                                            {isBalanced ? 'Balanced' : 'Unbalanced'}
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left" style={{ minWidth: '600px' }}>
                                            <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/[0.06]">
                                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                                                    <th className="px-4 sm:px-6 py-3.5 w-[22%]">Source</th>
                                                    <th className="px-4 sm:px-6 py-3.5 w-[38%]">Account Mapping</th>
                                                    <th className="px-4 sm:px-6 py-3.5 w-[15%] text-right text-emerald-600 dark:text-emerald-400">Debit (+)</th>
                                                    <th className="px-4 sm:px-6 py-3.5 w-[15%] text-right text-rose-500 dark:text-rose-400">Credit (−)</th>
                                                    <th className="px-4 sm:px-6 py-3.5 w-[10%] text-center">Del</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                                                {activeEntries.length === 0 && manualEntries.length === 0 ? (
                                                    <tr><td colSpan="5" className="py-14 text-center">
                                                        <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-white/20">
                                                            <Calculator size={28} className="opacity-50" />
                                                            <p className="text-xs font-semibold">Awaiting financial inputs above</p>
                                                        </div>
                                                    </td></tr>
                                                ) : (
                                                    activeEntries.map(entry => (
                                                        <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-4 sm:px-6 py-3">
                                                                <span className={`text-[10px] font-black uppercase tracking-wide ${entry.type==='debit' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-white/50'}`}>
                                                                    {entry.title}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3">
                                                                <AccountComboBox value={entry.accountCode} options={chartOfAccounts} onChange={code => updateGlMapping(entry.id, code)} />
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 text-right font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                                                                {entry.type === 'debit' ? asMoney(entry.amount) : <span className="text-slate-300 dark:text-white/20">—</span>}
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 text-right font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                                                                {entry.type === 'credit' ? asMoney(entry.amount) : <span className="text-slate-300 dark:text-white/20">—</span>}
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 text-center">
                                                                <span className="h-6 w-6 inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 text-slate-300 dark:text-white/20 text-[9px] font-black">SYS</span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                                {manualEntries.map(entry => (
                                                    <tr key={entry.id} className="border-l-2 border-l-indigo-400 dark:border-l-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors">
                                                        <td className="px-4 sm:px-6 py-3">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
                                                                <Plus size={10} strokeWidth={3} /> Manual Row
                                                            </span>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-3">
                                                            <AccountComboBox value={entry.accountCode} options={chartOfAccounts} onChange={code => updateManualEntry(entry.id, 'accountCode', code)} />
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-3">
                                                            <input type="number" value={entry.debit} onChange={e => updateManualEntry(entry.id,'debit',e.target.value)} disabled={entry.credit > 0}
                                                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-emerald-700 dark:text-emerald-400 text-right text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-30 transition"
                                                                placeholder="0.00" />
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-3">
                                                            <input type="number" value={entry.credit} onChange={e => updateManualEntry(entry.id,'credit',e.target.value)} disabled={entry.debit > 0}
                                                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-rose-600 dark:text-rose-400 text-right text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-30 transition"
                                                                placeholder="0.00" />
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-3 text-center">
                                                            <button onClick={() => removeManualEntry(entry.id)} className="h-7 w-7 grid place-items-center rounded-lg text-rose-400 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition active:scale-95">
                                                                <X size={14} className="text-current" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t-2 border-slate-100 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02]">
                                                <tr>
                                                    <td className="px-4 sm:px-6 py-4" colSpan="2">
                                                        <button onClick={addManualEntry}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition active:scale-95"
                                                        ><Plus size={13} strokeWidth={3} className="text-current" /> Add Row</button>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 text-right">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-0.5">Total Debit</p>
                                                        <p className={`font-mono font-black text-base sm:text-lg ${!isBalanced && totalDebit > 0 ? 'text-rose-500' : 'text-emerald-700 dark:text-emerald-400'}`}>{asMoney(totalDebit)}</p>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 text-right">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400 mb-0.5">Total Credit</p>
                                                        <p className={`font-mono font-black text-base sm:text-lg ${!isBalanced && totalDebit > 0 ? 'text-rose-500' : 'text-rose-600 dark:text-rose-400'}`}>{asMoney(totalCredit)}</p>
                                                    </td>
                                                    <td />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Modal footer */}
                            <div className="shrink-0 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-5 sm:px-7 py-4 border-t border-slate-100 dark:border-white/[0.07] bg-white dark:bg-[#0a1510]">
                                <p className="text-xs text-slate-400 dark:text-white/30 hidden sm:block">
                                    {isBalanced ? '✓ Ledger is balanced and ready to submit.' : 'Total debits must equal total credits to submit.'}
                                </p>
                                <div className="flex gap-2.5 w-full sm:w-auto">
                                    <button onClick={() => setShowModal(false)}
                                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/10 font-semibold text-sm transition active:scale-95"
                                    >Cancel</button>
                                    <button onClick={handleSubmitLoan} disabled={!isBalanced || (activeEntries.length === 0 && manualEntries.length === 0)}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100"
                                    >
                                        {isBalanced ? <><CheckCircle2 size={15} className="text-current" /> Submit Application</> : <><AlertCircle size={15} className="text-current" /> Unbalanced</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminSidebarLayout>
    );
}