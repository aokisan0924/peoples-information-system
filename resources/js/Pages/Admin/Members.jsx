import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Head, router, Link, usePage } from "@inertiajs/react";
import {
    Users, Eye, Upload, Download, Search, Loader2, Filter,
    ChevronLeft, ChevronRight, FileText, UserCheck, Landmark, X,
    Shield, ShieldOff, UserRound, Building2, HeartHandshake, ChevronsLeft, ChevronsRight
} from "lucide-react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import { ResourceHeader } from "@/Components/Admin/ResourceUI";
import CountUp from "react-countup";
import toast from "react-hot-toast";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

// ─── Branch badge config ──────────────────────────────────────────────────────
const BRANCH_CONFIG = {
    "ACTIVE MILITARY":    { label: "Active Military",  color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
    "RETIRED MILITARY":   { label: "Retired Military", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
    "CIVILIAN EMPLOYEES": { label: "Civilian",         color: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" },
    "PMPC":               { label: "PMPC",             color: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
    "BENEFICIARY":        { label: "Beneficiary",      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" },
};

// ─── Pagination helper ────────────────────────────────────────────────────────
function buildPageRange(current, total, maxVisible = 5) {
    if (total <= maxVisible + 2) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set([1, total, current]);
    if (current > 1) pages.add(current - 1);
    if (current < total) pages.add(current + 1);
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    let prev = 0;
    for (const p of sorted) {
        if (p - prev > 1) result.push("...");
        result.push(p);
        prev = p;
    }
    return result;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Members() {
    const { props } = usePage();
    const { memberSummary, members: initialMembers = [] } = props;

    const fileInputRef = useRef(null);

    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [profileForm, setProfileForm] = useState({
        lastName: "", firstName: "", dob: "", email: "", gender: "Male", contact: ""
    });
    const [paymentForm, setPaymentForm] = useState({
        membershipFee: 300, shareCapital: 5000, savingsDeposit: 0,
        paymentMethod: "cash", referenceNumber: ""
    });

    const [search, setSearch] = useState("");
    const [branchFilter, setBranchFilter] = useState("All");
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState(initialMembers);

    useEffect(() => {
        setMembers(Array.isArray(initialMembers) ? initialMembers : []);
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, [initialMembers]);

    const handleCloseModal = useCallback(() => {
        const hasData =
            profileForm.firstName || profileForm.lastName || profileForm.dob ||
            profileForm.email || profileForm.contact;
        if (hasData && !window.confirm("You have unsaved data. Close anyway?")) return;
        setIsAddMemberOpen(false);
        setOnboardingStep(1);
        setProfileForm({ lastName: "", firstName: "", dob: "", email: "", gender: "Male", contact: "" });
        setPaymentForm({ membershipFee: 300, shareCapital: 5000, savingsDeposit: 0, paymentMethod: "cash", referenceNumber: "" });
    }, [profileForm]);

    const handleNextStep = () => {
        if (!profileForm.firstName || !profileForm.lastName || !profileForm.dob || !profileForm.email || !profileForm.gender) {
            return toast.error("Please fill in all required fields.");
        }
        setOnboardingStep(2);
    };

    const handleCompleteOnboarding = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                lastName: profileForm.lastName,
                firstName: profileForm.firstName,
                dob: profileForm.dob,
                email: profileForm.email,
                gender: profileForm.gender,
                contact: profileForm.contact,
                membershipFee: Number(paymentForm.membershipFee),
                shareCapital: Number(paymentForm.shareCapital),
                savingsDeposit: Number(paymentForm.savingsDeposit) || 0,
                paymentMethod: paymentForm.paymentMethod,
                referenceNumber: paymentForm.referenceNumber
            };
            await axios.post(route("admin.members.store"), payload);
            toast.success("Member successfully onboarded!");
            setIsAddMemberOpen(false);
            setOnboardingStep(1);
            setProfileForm({ lastName: "", firstName: "", dob: "", email: "", gender: "Male", contact: "" });
            setPaymentForm({ membershipFee: 300, shareCapital: 5000, savingsDeposit: 0, paymentMethod: "cash", referenceNumber: "" });
            router.reload();
        } catch (error) {
            console.error(error.response?.data);
            toast.error(error.response?.data?.message || "Failed to complete onboarding. Check inputs.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredMembers = useMemo(() => members.filter((member) => {
        const q = search.toLowerCase();
        const matchesSearch =
            member.firstName?.toLowerCase().includes(q) ||
            member.lastName?.toLowerCase().includes(q) ||
            member.memberId?.toLowerCase().includes(q);
        const matchesBranch = branchFilter === "All" || member.branchService === branchFilter;
        return matchesSearch && matchesBranch;
    }), [members, search, branchFilter]);

    const totalPages = Math.ceil(filteredMembers.length / perPage);
    const paginatedMembers = filteredMembers.slice((currentPage - 1) * perPage, currentPage * perPage);
    const pageRange = buildPageRange(currentPage, totalPages);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    };

    const handleImportClick = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = "";
        const formData = new FormData();
        formData.append("excel_file", file);
        toast.promise(
            axios.post(route("admin.members.import"), formData, {
                headers: { "Content-Type": "multipart/form-data" }
            }),
            {
                loading: "Importing data...",
                success: "Import successful! Refreshing...",
                error: (err) => err.response?.data?.message || "Failed to import data.",
            }
        ).then(() => setTimeout(() => router.reload(), 1500));
    };

    return (
        <>
            <Head title="Members Dashboard" />
            <AdminSidebarLayout>
                <div className="min-h-screen transition-colors duration-300">
                    <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">

                        {/* ── HEADER ─────────────────────────────────────────── */}
                        <ResourceHeader
                            icon={Users}
                            eyebrow="Membership"
                            title="Member Directory"
                            description="Manage cooperative members, maintain profiles, and export member records."
                            actions={<>
                                <button
                                    onClick={() => { setOnboardingStep(1); setIsAddMemberOpen(true); }}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-900 shadow-lg transition hover:bg-emerald-50 active:scale-95 sm:flex-none"
                                >
                                    <UserCheck className="h-4 w-4 shrink-0" />
                                    <span className="hidden xs:inline sm:inline">Add Member</span>
                                </button>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleImportClick}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-95 sm:flex-none"
                                >
                                    <Upload className="h-4 w-4 shrink-0" />
                                    <span className="hidden sm:inline">Import</span>
                                </button>
                                <a
                                    href={route("admin.members.export")}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-95 sm:flex-none"
                                >
                                    <Download className="h-4 w-4 shrink-0" />
                                    <span className="hidden sm:inline">Export</span>
                                </a>
                            </>}
                        />

                        {/* ── STATS ──────────────────────────────────────────── */}
                        {/* Mobile: 3 cols (2 rows of 3). MD: 3 cols. LG: 6 cols. */}
                        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
                            <SummaryCard label="Total Members"    value={memberSummary?.total}           color="emerald" icon={Users}         />
                            <SummaryCard label="Active Military"  value={memberSummary?.activeMilitary}  color="blue"    icon={Shield}        />
                            <SummaryCard label="Retired Military" value={memberSummary?.retiredMilitary} color="yellow"  icon={ShieldOff}     />
                            <SummaryCard label="Civilian"         value={memberSummary?.civilian}        color="violet"  icon={UserRound}     />
                            <SummaryCard label="PMPC"             value={memberSummary?.pmpc}            color="rose"    icon={Building2}     />
                            <SummaryCard label="Beneficiary"      value={memberSummary?.beneficiary}     color="indigo"  icon={HeartHandshake}/>
                        </div>

                        {/* ── FILTERS ────────────────────────────────────────── */}
                        {/* Full-width stack on mobile, side-by-side on md+ */}
                        <div className="flex flex-col gap-3">
                            {/* Search — always full width */}
                            <div className="relative w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by name or member ID..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                                />
                            </div>

                            {/* Branch + Per-page: side-by-side even on mobile */}
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <select
                                        value={branchFilter}
                                        onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#1a2c25] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="All">All Branches</option>
                                        <option value="ACTIVE MILITARY">Active Military</option>
                                        <option value="RETIRED MILITARY">Retired Military</option>
                                        <option value="CIVILIAN EMPLOYEES">Civilian</option>
                                        <option value="PMPC">PMPC</option>
                                        <option value="BENEFICIARY">Beneficiary</option>
                                    </select>
                                </div>
                                <select
                                    value={perPage}
                                    onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="px-3 py-3 bg-white dark:bg-[#1a2c25] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none cursor-pointer"
                                >
                                    <option value="10">10 / page</option>
                                    <option value="25">25 / page</option>
                                    <option value="50">50 / page</option>
                                </select>
                            </div>
                        </div>

                        {/* ── TABLE ──────────────────────────────────────────── */}
                        <div className="bg-white dark:bg-[#0f1f1a] border border-slate-200/60 dark:border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left text-sm" role="table">
                                    <thead className="bg-slate-50/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200/60 dark:border-white/5">
                                        <tr>
                                            {/* Tighter padding on mobile */}
                                            <th className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">Member ID</th>
                                            <th className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">Name</th>
                                            <th className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap hidden md:table-cell">Branch of Service</th>
                                            <th className="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap hidden lg:table-cell">Contact Number</th>
                                            <th className="px-3 sm:px-6 py-4 sm:py-5 text-center whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
                                                        <p>Loading members...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : paginatedMembers.length > 0 ? (
                                            paginatedMembers.map((member) => {
                                                const branch = BRANCH_CONFIG[member.branchService];
                                                return (
                                                    <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <span className="font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md text-xs">
                                                                {member.memberId || member.id || "N/A"}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs sm:text-sm select-none">
                                                                    {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                                                                        {member.firstName} {member.lastName}
                                                                    </div>
                                                                    {/* Email only visible on sm+ — too long for tiny screens */}
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                                                                        {member.email}
                                                                    </div>
                                                                    {/* Branch badge inline on mobile (column hidden below md) */}
                                                                    <div className="mt-0.5 md:hidden">
                                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${branch?.color ?? "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"}`}>
                                                                            {branch?.label ?? member.branchService}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {/* Branch column — hidden on mobile, shown inline in Name cell above */}
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${branch?.color ?? "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"}`}>
                                                                {branch?.label ?? member.branchService}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-300 font-mono text-sm hidden lg:table-cell">
                                                            {member.contact || "—"}
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                                                            <Link
                                                                href={route("admin.members.show-member", member.id)}
                                                                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 transition-colors"
                                                                title="View Profile"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                <span className="hidden sm:inline">View</span>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <FileText className="h-10 w-10 text-slate-300 dark:text-white/20 mb-3" />
                                                        {search || branchFilter !== "All" ? (
                                                            <>
                                                                <p className="text-base font-medium text-slate-600 dark:text-white/70">No members match your filters</p>
                                                                <p className="text-sm mt-1">Try adjusting your search or branch filter.</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p className="text-base font-medium text-slate-600 dark:text-white/70">No members yet</p>
                                                                <button
                                                                    onClick={() => { setOnboardingStep(1); setIsAddMemberOpen(true); }}
                                                                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
                                                                >
                                                                    <UserCheck className="h-4 w-4" /> Add your first member
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── PAGINATION ─────────────────────────────────── */}
                            {!isLoading && filteredMembers.length > 0 && (
                                <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
                                        Showing{" "}
                                        <span className="font-semibold text-slate-700 dark:text-white">{(currentPage - 1) * perPage + 1}</span>
                                        {" "}–{" "}
                                        <span className="font-semibold text-slate-700 dark:text-white">{Math.min(currentPage * perPage, filteredMembers.length)}</span>
                                        {" "}of{" "}
                                        <span className="font-semibold text-slate-700 dark:text-white">{filteredMembers.length}</span> members
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-1 sm:gap-1.5">
                                            {/* First/Last — hidden on mobile to save space */}
                                            <button
                                                onClick={() => handlePageChange(1)}
                                                disabled={currentPage === 1}
                                                aria-label="First page"
                                                className="hidden sm:flex p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronsLeft className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                aria-label="Previous page"
                                                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {pageRange.map((item, idx) =>
                                                    item === "..." ? (
                                                        <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none text-sm">…</span>
                                                    ) : (
                                                        <button
                                                            key={item}
                                                            onClick={() => handlePageChange(item)}
                                                            aria-label={`Page ${item}`}
                                                            aria-current={currentPage === item ? "page" : undefined}
                                                            className={`h-8 min-w-[2rem] px-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                                                currentPage === item
                                                                    ? "bg-emerald-600 text-white shadow-md"
                                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                                                            }`}
                                                        >
                                                            {item}
                                                        </button>
                                                    )
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                aria-label="Next page"
                                                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(totalPages)}
                                                disabled={currentPage === totalPages}
                                                aria-label="Last page"
                                                className="hidden sm:flex p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronsRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </AdminSidebarLayout>

            {/* ── ONBOARDING MODAL ───────────────────────────────────────────── */}
            <AnimatePresence>
                {isAddMemberOpen && (
                    <ModalShell
                        title={onboardingStep === 1 ? "New Member Profile" : "Initial Deposits"}
                        subtitle={onboardingStep === 1 ? "Step 1 of 2 — Basic information" : "Step 2 of 2 — Opening balances"}
                        onClose={handleCloseModal}
                        step={onboardingStep}
                        totalSteps={2}
                    >
                        <div className="flex-1 flex flex-col min-h-0 w-full">
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-5">

                                {/* STEP 1: PROFILE FORM */}
                                {onboardingStep === 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Last Name *"      value={profileForm.lastName}  onChange={(v) => setProfileForm({ ...profileForm, lastName: v })} />
                                        <Field label="First Name *"     value={profileForm.firstName} onChange={(v) => setProfileForm({ ...profileForm, firstName: v })} />
                                        <Field label="Date of Birth *"  type="date"  value={profileForm.dob}   onChange={(v) => setProfileForm({ ...profileForm, dob: v })} />
                                        <Field label="Email Address *"  type="email" value={profileForm.email}  onChange={(v) => setProfileForm({ ...profileForm, email: v })} />
                                        <SelectField
                                            label="Gender *"
                                            value={profileForm.gender}
                                            onChange={(v) => setProfileForm({ ...profileForm, gender: v })}
                                            options={[
                                                { label: "Male",   value: "Male" },
                                                { label: "Female", value: "Female" }
                                            ]}
                                        />
                                        <Field label="Mobile Number" value={profileForm.contact} onChange={(v) => setProfileForm({ ...profileForm, contact: v })} />
                                    </div>
                                )}

                                {/* STEP 2: PAYMENT FORM */}
                                {onboardingStep === 2 && (
                                    <div className="space-y-5">
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                            <h4 className="text-emerald-800 dark:text-emerald-400 font-bold mb-3 flex items-center gap-2 text-sm">
                                                <Landmark className="h-4 w-4" /> Required Deposits
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Field label="Membership Fee (₱)"      type="number" value={paymentForm.membershipFee} onChange={(v) => setPaymentForm({ ...paymentForm, membershipFee: v })} />
                                                <Field label="Initial Share Capital (₱)" type="number" value={paymentForm.shareCapital}   onChange={(v) => setPaymentForm({ ...paymentForm, shareCapital: v })} />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                                            <h4 className="text-slate-700 dark:text-slate-300 font-bold mb-3 text-sm">Optional Deposits</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Field label="Savings Deposit (₱)" type="number" value={paymentForm.savingsDeposit} onChange={(v) => setPaymentForm({ ...paymentForm, savingsDeposit: v })} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <SelectField
                                                label="Payment Method"
                                                value={paymentForm.paymentMethod}
                                                onChange={(v) => setPaymentForm({ ...paymentForm, paymentMethod: v })}
                                                options={[
                                                    { label: "Cash (Over the counter)", value: "cash" },
                                                    { label: "Bank Transfer",            value: "bank" },
                                                    { label: "E-Wallet (GCash/Maya)",    value: "e-wallet" }
                                                ]}
                                            />
                                            <Field
                                                label={paymentForm.paymentMethod === "cash" ? "Official Receipt (OR) Number *" : "Transaction Reference Number *"}
                                                value={paymentForm.referenceNumber}
                                                onChange={(v) => setPaymentForm({ ...paymentForm, referenceNumber: v })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* MODAL FOOTER — always full-width buttons on mobile */}
                            <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3 p-4 sm:p-5 border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0f1f1a]">
                                <button
                                    onClick={handleCloseModal}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition-colors text-center text-sm"
                                >
                                    Cancel
                                </button>

                                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                                    {onboardingStep === 2 && (
                                        <button
                                            onClick={() => setOnboardingStep(1)}
                                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm"
                                        >
                                            ← Back
                                        </button>
                                    )}
                                    {onboardingStep === 1 ? (
                                        <button
                                            onClick={handleNextStep}
                                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
                                        >
                                            Next →
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCompleteOnboarding}
                                            disabled={isSubmitting}
                                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 text-sm"
                                        >
                                            {isSubmitting
                                                ? <><Loader2 className="animate-spin h-4 w-4" /> Saving...</>
                                                : "Complete Onboarding"
                                            }
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ModalShell>
                )}
            </AnimatePresence>
        </>
    );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color, icon: Icon }) {
    const colors = {
        emerald: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10",
        blue:    "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10",
        yellow:  "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10",
        rose:    "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10",
        violet:  "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/10",
        indigo:  "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10",
    };
    const style = colors[color] ?? colors.emerald;

    return (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 ${style}`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 w-full">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight">{label}</p>
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    <CountUp end={value || 0} duration={1.5} separator="," preserveValue />
                </div>
            </div>
        </div>
    );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text" }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
        </div>
    );
}

// ─── SelectField ──────────────────────────────────────────────────────────────
function SelectField({ label, value, onChange, options }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#1a2c25] dark:border-white/10 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer appearance-none"
            >
                {options.map((opt) => (
                    <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-white text-slate-900 dark:bg-[#1a2c25] dark:text-white"
                    >
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

// ─── ModalShell ───────────────────────────────────────────────────────────────
function ModalShell({ title, subtitle, onClose, step, totalSteps, children }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = "hidden";
        const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <motion.div
            className="fixed inset-0 z-[9000] flex items-center justify-center p-3 sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            <motion.div
                className="relative w-full max-w-2xl bg-white dark:bg-[#0f1f1a] shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88dvh] rounded-2xl sm:rounded-3xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.9 }}
            >
                {/* HEADER */}
                <div className="shrink-0 px-4 pt-5 pb-0 sm:px-8 sm:pt-6 bg-white dark:bg-[#0f1f1a] z-20">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="min-w-0 pr-4">
                            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</div>
                            <div className="text-xs sm:text-sm text-slate-500 dark:text-white/50 mt-0.5">{subtitle}</div>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 grid place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Step progress bar */}
                    {totalSteps && (
                        <div className="flex gap-2 pb-4 border-b border-slate-200/80 dark:border-white/10">
                            {Array.from({ length: totalSteps }, (_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                        i + 1 <= step ? "bg-emerald-500" : "bg-slate-200 dark:bg-white/10"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {children}
            </motion.div>
        </motion.div>,
        document.body
    );
}
