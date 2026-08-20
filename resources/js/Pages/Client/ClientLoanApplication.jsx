import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { 
    FileText, Search, Loader2, ArrowUpRight, Wallet, CheckCircle2,
    Clock, X, Eye, AlertCircle, Shield, ChevronRight, Plus, Calendar 
} from "lucide-react";

import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";
import SidebarLayout from "@/Layouts/SidebarLayout";

const asMoney = (value) =>
    (Number.isFinite(value) ? value : 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

export default function ClientLoanApplication() {
    const { props } = usePage();
    const {
        loanStats = { totalLoans: 0, totalPending: 0, totalReleased: 0 },
        auth,
    } = props;

    const [search, setSearch] = useState("");
    const [perPage, setPerPage] = useState(10);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [meta, setMeta] = useState({
        currentPage: 1, lastPage: 1, perPage: 10, total: 0,
    });

    const [showModal, setShowModal] = useState(false);
    const [netProceeds, setNetProceeds] = useState(25000);
    const [termYears, setTermYears] = useState(5);
    const [loanClassification, setLoanClassification] = useState("");
    const [loanType, setLoanType] = useState("");
    const [computing, setComputing] = useState(false);
    const [computeResults, setComputeResults] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [loanDetail, setLoanDetail] = useState(null);

    const loadData = async (page = 1, overrides = {}) => {
        if (loading) return;
        const effectiveSearch = overrides.search !== undefined ? overrides.search : search;
        const effectivePerPage = overrides.perPage !== undefined ? overrides.perPage : perPage;

        setLoading(true);
        try {
            const { data } = await axios.get("/client/api/loans", { 
                params: { search: effectiveSearch, perPage: effectivePerPage, page } 
            });
            const rows = Array.isArray(data?.rows) ? data.rows : data?.data || [];
            const pagination = data?.meta || data?.pagination || {};

            setLoans(rows);
            setMeta({
                currentPage: pagination.currentPage ?? pagination.current_page ?? page,
                lastPage: pagination.lastPage ?? pagination.last_page ?? 1,
                perPage: pagination.perPage ?? pagination.per_page ?? effectivePerPage,
                total: pagination.total ?? rows.length ?? 0,
            });
        } catch (error) {
            toast.error("Failed to load loans.");
            setLoans([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(1); }, []);

    const handlePageChange = (page) => {
        if (page < 1 || page > meta.lastPage) return;
        loadData(page);
    };

    const handleFilterSubmit = (e) => { e.preventDefault(); loadData(1); };

    const handleResetFilters = () => {
        setSearch(""); setPerPage(10); loadData(1, { search: "", perPage: 10 });
    };

    const resetForm = () => {
        setNetProceeds(25000); setTermYears(5); setLoanClassification(""); setLoanType(""); setComputeResults({});
    };

    const computePreview = (net, years) => {
        if (!net || !years) return setComputeResults({});
        setComputing(true);
        axios.post("/client/api/loans/compute", { netProceeds: net, termYears: years })
            .then((res) => setComputeResults(res.data || {}))
            .catch(() => { toast.error("Failed to compute preview."); setComputeResults({}); })
            .finally(() => setComputing(false));
    };

    const openModal = () => { resetForm(); setShowModal(true); computePreview(25000, 5); };
    const closeModal = () => setShowModal(false);

    useEffect(() => {
        const timeout = setTimeout(() => computePreview(netProceeds, termYears), 500); 
        return () => clearTimeout(timeout);
    }, [netProceeds, termYears]);

    const handleSubmit = () => {
        if (!netProceeds || !termYears) return toast.error("Please input Net Proceeds and Term.");
        if (!loanClassification) return toast.error("Please select loan classification.");
        if (!loanType) return toast.error("Please select loan type.");

        setSubmitting(true);
        axios.post("/client/api/loans/submit", { netProceeds, termYears, loanClassification, loanType })
            .then((res) => {
                const reference = res?.data?.loanReference;
                toast.success("Loan submitted successfully.");
                closeModal();
                if (reference) window.location.href = `/client/loans/${reference}/requirements`;
                else loadData(1);
            })
            .catch((err) => toast.error(err?.response?.data?.message || "Failed to submit loan application."))
            .finally(() => setSubmitting(false));
    };

    const openDetailModal = (loanReference) => {
        setDetailOpen(true); setDetailLoading(true); setLoanDetail(null);
        axios.get(`/client/api/loans/${loanReference}`)
            .then((res) => setLoanDetail(res.data || null))
            .catch(() => { toast.error("Failed to load loan details."); setDetailOpen(false); })
            .finally(() => setDetailLoading(false));
    };

    const closeDetailModal = () => setDetailOpen(false);

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Loan Application">
                    <link rel="icon" href="/images/logo/pis_logo.png" />
                </Head>
                
                <div className="max-w-7xl mx-auto space-y-6 pb-24 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-4 relative z-0">
                    
                    {/* HERO HEADER */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-2xl transition-colors">
                        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 flex items-center justify-center">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                                        My Loan Applications
                                    </h1>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-white/60 max-w-2xl leading-relaxed">
                                    Manage your loan applications, view status updates, and track releases.
                                </p>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-2">
                                <button 
                                    onClick={openModal}
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg transition-all active:scale-95"
                                >
                                    <Plus className="w-5 h-5" /> Apply for Loan
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* STATS STRIP */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <MiniStat label="Total Applications" value={toNumber(loanStats.totalLoans).toLocaleString()} icon={FileText} />
                        <MiniStat label="Pending Amount" value={asMoney(loanStats.totalPending)} icon={Clock} color="text-amber-500 dark:text-amber-400" />
                        <MiniStat label="Released Amount" value={asMoney(loanStats.totalReleased)} icon={Wallet} color="text-emerald-600 dark:text-emerald-400" />
                    </div>

                    {/* FILTERS */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 shadow-sm dark:shadow-lg transition-colors">
                        <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 dark:text-white/50 ml-1 mb-1.5 block">Search Loans</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-white/30" />
                                    <input
                                        type="text" placeholder="Search reference, type..." value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-32">
                                <label className="text-xs text-slate-500 dark:text-white/50 ml-1 mb-1.5 block">Rows</label>
                                <select
                                    value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}
                                    className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer dark:bg-white/5 dark:border-white/10 dark:text-white [&>option]:text-slate-900 dark:[&>option]:text-white dark:[&>option]:bg-slate-800"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                            <div className="flex items-end gap-2">
                                <button type="submit" className="h-[42px] px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg">Filter</button>
                                <button type="button" onClick={handleResetFilters} className="h-[42px] px-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white font-medium text-sm transition">Reset</button>
                            </div>
                        </form>
                    </div>

                    {/* LOANS TABLE / CARDS */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-xl transition-colors">
                        {loading && (
                            <div className="px-5 py-12 text-center text-slate-500 dark:text-white/40">
                                <div className="flex justify-center items-center gap-2">
                                    <Loader2 className="animate-spin h-5 w-5 text-emerald-500" /> Loading records...
                                </div>
                            </div>
                        )}
                        {!loading && loans.length === 0 && (
                            <div className="px-5 py-12 text-center text-slate-500 dark:text-white/40">No loan applications found.</div>
                        )}

                        {/* Desktop Table */}
                        {!loading && loans.length > 0 && (
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b border-slate-200 dark:border-white/10 text-xs uppercase tracking-wider text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5">
                                        <tr>
                                            <th className="px-5 py-4 font-medium">Date</th>
                                            <th className="px-5 py-4 font-medium">Reference</th>
                                            <th className="px-5 py-4 font-medium">Type</th>
                                            <th className="px-5 py-4 font-medium text-right">Amount</th>
                                            <th className="px-5 py-4 font-medium text-center">Status</th>
                                            <th className="px-5 py-4 font-medium text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-white/80">
                                        {loans.map((row) => (
                                            <tr key={row.loanReference} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-5 py-4 whitespace-nowrap">{row.dateApplied}</td>
                                                <td className="px-5 py-4 font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{row.loanReference}</td>
                                                <td className="px-5 py-4">
                                                    <div className="font-medium text-slate-900 dark:text-white">{row.loanClassification}</div>
                                                    <div className="text-xs text-slate-500 dark:text-white/50">{row.loanType} • {row.loanTerm}</div>
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono text-slate-900 dark:text-white whitespace-nowrap">{asMoney(row.amount)}</td>
                                                <td className="px-5 py-4 text-center"><StatusBadge status={row.status} /></td>
                                                <td className="px-5 py-4 text-center">
                                                    <button 
                                                        onClick={() => openDetailModal(row.loanReference)}
                                                        className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 dark:bg-white/5 dark:border-white/10 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 transition"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Mobile Cards */}
                        {!loading && loans.length > 0 && (
                            <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/10">
                                {loans.map((row) => (
                                    <div key={row.loanReference} className="p-5 hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 dark:active:bg-white/10 transition-colors" onClick={() => openDetailModal(row.loanReference)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-slate-900 dark:text-white font-medium text-sm">{row.loanClassification}</div>
                                                <div className="text-slate-500 dark:text-white/60 text-xs mt-0.5">{row.loanType} • {row.loanTerm}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-slate-900 dark:text-white font-mono font-medium">{asMoney(row.amount)}</div>
                                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-mono mt-0.5">{row.loanReference}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <StatusBadge status={row.status} />
                                            <div className="text-slate-400 dark:text-white/50 text-xs flex items-center gap-1">
                                                {row.dateApplied} <ChevronRight className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* PAGINATION */}
                        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                            <div className="text-xs text-slate-500 dark:text-white/50">
                                Page <span className="font-semibold text-slate-700 dark:text-white">{meta.currentPage}</span> of <span className="font-semibold text-slate-700 dark:text-white">{meta.lastPage}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handlePageChange(meta.currentPage - 1)} disabled={meta.currentPage <= 1} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 disabled:opacity-50 transition">
                                    <ChevronRight className="h-4 w-4 rotate-180 text-slate-600 dark:text-white" />
                                </button>
                                <button onClick={() => handlePageChange(meta.currentPage + 1)} disabled={meta.currentPage >= meta.lastPage} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 disabled:opacity-50 transition">
                                    <ChevronRight className="h-4 w-4 text-slate-600 dark:text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* NEW LOAN MODAL */}
                <AnimatePresence>
                    {showModal && (
                        <ModalShell title="New Loan Application" subtitle="Review computation & submit" onClose={closeModal}>
                            <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50 dark:bg-[#060c0a] relative">
                                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
                                    <div className="max-w-3xl mx-auto w-full space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            <Field label="Net Proceeds (₱)" type="number" value={netProceeds} onChange={(val) => setNetProceeds(Number(val) || 0)} />
                                            <SelectField label="Loan Term (Years)" value={termYears} onChange={(val) => setTermYears(Number(val))} options={[1,2,3,4,5].map(y => ({ value: y, label: `${y} Year${y>1?'s':''}` }))} />
                                        </div>

                                        <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 dark:border-white/10 dark:bg-[#0f1f1a] p-5 sm:p-6 shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                                    <Wallet className="h-4 w-4" /> Preview Computation
                                                </h3>
                                                {computing && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 animate-pulse bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 rounded-md">Calculating...</span>}
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                                <Summary label="Net Proceeds" value={netProceeds} money />
                                                <Summary label="Loan Amount" value={computeResults.loanAmount} money />
                                                <Summary label="Monthly Amort." value={computeResults.monthlyAmortization} money />
                                                <Summary label="Share Capital" value={computeResults.capCon ?? 5000} money />
                                                <Summary label="Service Fee" value={computeResults.serviceFee} money />
                                                <Summary label="Insurance" value={computeResults.insurance} money />
                                                <Summary label="Advance Interest" value={computeResults.advanceInterest} money />
                                                <Summary label="Gross Payments" value={computeResults.gross} money />
                                            </div>
                                            <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-emerald-700/70 dark:text-emerald-300/60">{computeResults.calculationVersion || 'Official calculation pending'}</p>
                                        </div>

                                        <RequirementsList branchService={computeResults.branchService} requirements={computeResults.preLoanRequirements} />

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            <SelectField label="Classification" value={loanClassification} onChange={setLoanClassification} options={["Pension Loan", "Salary Loan", "Multi-Purpose Loan"].map(v => ({ value: v, label: v }))} />
                                            <SelectField label="Loan Type" value={loanType} onChange={setLoanType} options={["New", "Renewal", "Additional", "Reloan"].map(v => ({ value: v, label: v }))} />
                                        </div>
                                    </div>
                                </div>
                                <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0f1f1a] z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                    <button onClick={closeModal} className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition shadow-sm">Cancel</button>
                                    <button onClick={handleSubmit} disabled={submitting || computing || !computeResults.calculationVersion} className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]">
                                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {submitting ? "Submitting..." : "Submit Application"}
                                    </button>
                                </div>
                            </div>
                        </ModalShell>
                    )}
                </AnimatePresence>

                {/* LOAN DETAIL MODAL */}
                <AnimatePresence>
                    {detailOpen && (
                        <ModalShell title="Application Details" subtitle={loanDetail?.loan?.loanReference || "Loading..."} onClose={closeDetailModal}>
                            <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50 dark:bg-[#060c0a] relative">
                                {detailLoading || !loanDetail ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12">
                                        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
                                        <p className="text-sm font-semibold text-slate-500">Retrieving loan records...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
                                            <div className="max-w-4xl mx-auto w-full space-y-6">
                                                <div className="bg-white border border-slate-200/80 rounded-[2rem] p-5 sm:p-6 shadow-sm dark:bg-[#0f1f1a] dark:border-white/10">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <div className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1.5">Current Status</div>
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <StatusBadge status={loanDetail.loan.status} />
                                                                <span className="text-sm font-medium text-slate-500 dark:text-white/60 flex items-center gap-1.5 truncate">
                                                                    <Clock className="h-3.5 w-3.5 shrink-0" /> Applied {new Date(loanDetail.loan.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="sm:text-right min-w-0 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-white/10 pt-4 sm:pt-0 sm:pl-6">
                                                            <div className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1">Loan Classification</div>
                                                            <div className="text-lg font-black text-slate-900 dark:text-white truncate">{loanDetail.loan.loanClassification}</div>
                                                            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 truncate">{loanDetail.loan.loanType}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    <div className="space-y-6">
                                                        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-5 sm:p-6 shadow-sm dark:bg-[#0f1f1a] dark:border-white/10">
                                                            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black mb-4"><Wallet className="h-5 w-5 text-emerald-500" /> Financial Details</div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-white/5 min-w-0">
                                                                    <span className="text-sm font-medium text-slate-500 dark:text-white/60 shrink-0">Gross Amount</span>
                                                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate pl-4">{asMoney(toNumber(loanDetail.loan.gross))}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-white/5 min-w-0 bg-emerald-50 dark:bg-emerald-500/5 -mx-2 px-2 rounded-lg">
                                                                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 shrink-0">Net Proceeds</span>
                                                                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 truncate pl-4">{asMoney(toNumber(loanDetail.loan.netProceeds))}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-white/5 min-w-0">
                                                                    <span className="text-sm font-medium text-slate-500 dark:text-white/60 shrink-0">Monthly Amort.</span>
                                                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate pl-4">{asMoney(toNumber(loanDetail.loan.monthlyAmortization))}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center py-2.5 min-w-0">
                                                                    <span className="text-sm font-medium text-slate-500 dark:text-white/60 shrink-0">Term</span>
                                                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate pl-4">{loanDetail.loan.termYears} Year(s)</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {loanDetail.loan.remarks && (
                                                            <div className="bg-white border border-amber-200/80 rounded-[2rem] p-5 sm:p-6 shadow-sm dark:bg-amber-500/5 dark:border-amber-500/20">
                                                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-2"><AlertCircle className="h-4 w-4" /> Remarks / Notes</div>
                                                                <p className="text-sm text-amber-600 dark:text-amber-200/80 leading-relaxed">{loanDetail.loan.remarks}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="bg-white border border-slate-200/80 rounded-[2rem] p-5 sm:p-6 shadow-sm dark:bg-[#0f1f1a] dark:border-white/10 flex flex-col h-full min-h-[300px]">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black"><FileText className="h-5 w-5 text-blue-500" /> Requirements Status</div>
                                                            <div className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg">
                                                                {loanDetail.requirements?.filter(r => r.isUploaded).length || 0} / {loanDetail.requirements?.length || 0}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex-1 space-y-2.5 overflow-y-auto pr-2 custom-scrollbar">
                                                            {loanDetail.requirements?.map((req, idx) => (
                                                                <div key={idx} className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 min-w-0 transition-colors ${req.isUploaded ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10' : 'bg-slate-50 border-slate-100 dark:bg-white/[0.02] dark:border-white/5'}`}>
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        {req.isUploaded ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                                                                        <span className={`text-sm truncate ${req.isUploaded ? 'text-slate-700 font-medium dark:text-white/90' : 'text-slate-500 dark:text-white/50'}`}>{req.label}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="pt-5 mt-4 border-t border-slate-100 dark:border-white/5">
                                                            <button 
                                                                onClick={() => window.location.href = `/client/loans/${loanDetail.loan.loanReference}/requirements`}
                                                                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                                                            >
                                                                Manage Documents <ChevronRight className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex justify-end p-4 border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0f1f1a] z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                            <button onClick={closeDetailModal} className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition shadow-sm">
                                                Close
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </ModalShell>
                    )}
                </AnimatePresence>

            </PaymentReminderLayout>
        </SidebarLayout>
    );
}

function statusBadgeClass(status) {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "released" || normalized === "approved") return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
    if (normalized === "pending") return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
    if (normalized === "declined" || normalized === "rejected") return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
    return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
}

function StatusBadge({ status }) {
    return <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider border " + statusBadgeClass(status)}>{status}</span>;
}

function Summary({ label, value, money = false }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-emerald-400/80">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{money ? asMoney(value) : value ?? ""}</p>
        </div>
    );
}

function RequirementsList({ branchService, requirements = [] }) {
    if (!requirements.length) return null;
    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10 p-4">
            <h3 className="mb-2 text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Pre-Loan Requirements
            </h3>
            <p className="mb-3 text-xs text-amber-600 dark:text-amber-200/80">
                Based on your branch of service <span className="font-semibold text-amber-700 dark:text-amber-200">{branchService || "N/A"}</span>, kindly prepare clear copies of:
            </p>
            <ul className="space-y-2 text-xs text-amber-700 dark:text-amber-100">
                {requirements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-4 text-[10px] text-amber-600/60 dark:text-amber-200/60 italic">Documents will be verified by PMPC before loan approval.</p>
        </div>
    );
}

function MiniStat({ label, value, icon: Icon, color = "text-slate-600 dark:text-white" }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 px-5 py-4 flex items-center gap-4 min-w-0 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
            <span className="grid place-items-center h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/10 shrink-0 border border-slate-200 dark:border-white/5 shadow-inner">
                <Icon className={`h-6 w-6 ${color}`} />
            </span>
            <div className="min-w-0">
                <div className="text-xs text-slate-500 dark:text-white/50 truncate uppercase tracking-wide font-medium">{label}</div>
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate mt-0.5">{value || "—"}</div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">{label}</label>
            <input 
                type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} 
                className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder:text-slate-400 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20" 
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">{label}</label>
            <select 
                value={value} onChange={(e) => onChange(e.target.value)} 
                className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:bg-white/5 dark:border-white/10 dark:text-white [&>option]:text-slate-900 dark:[&>option]:text-white dark:[&>option]:bg-slate-800"
            >
                <option value="">Select...</option>
                {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
}

function ModalShell({ title, subtitle, onClose, children }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = "hidden";
        const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <motion.div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center p-0 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <motion.div 
                className="relative w-full max-w-5xl bg-white dark:bg-[#0f1f1a] shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl overflow-hidden" 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300, mass: 1.2 }}
            >
                <div className="sm:hidden flex justify-center pt-3 pb-1 bg-white dark:bg-[#0f1f1a] w-full absolute top-0 z-50">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/20 rounded-full" />
                </div>
                <div className="shrink-0 flex justify-between items-center px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-200/80 dark:border-white/10 z-20 bg-white dark:bg-[#0f1f1a] pt-8 sm:pt-6">
                    <div className="min-w-0 pr-4">
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">{title}</div>
                        <div className="text-xs sm:text-sm text-slate-500 dark:text-white/50 mt-0.5 truncate">{subtitle}</div>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/30 dark:bg-transparent">
                    {children}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}
