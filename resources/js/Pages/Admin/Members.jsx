import React, { useRef, useEffect, useState } from "react";
import { Head, router, Link, usePage } from "@inertiajs/react";
import { 
    Users, Eye, Upload, Download, Search, Loader2, Filter, 
    ChevronLeft, ChevronRight, FileText, Briefcase, UserCheck, Landmark, X
} from "lucide-react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";
import toast from "react-hot-toast";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

export default function Members() {
    const { props } = usePage();
    const { memberSummary, members: initialMembers = [] } = props;

    const fileInputRef = useRef(null);

    const [ isAddMemberOpen, setIsAddMemberOpen ] = useState(false);
    const [ onboardingStep, setOnboardingStep ] = useState(1);
    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const [ profileForm, setProfileForm ] = useState({
        lastName: "", 
        firstName: "", 
        dob: "", 
        email: "", 
        gender: "Male", 
        contact: ""
    });

    const [ paymentForm, setPaymentForm ] = useState({
        membershipFee: 300,
        shareCapital: 5000,
        savingsDeposit: 0,
        paymentMethod: "cash",
        referenceNumber: ""
    });

    const [ search, setSearch ] = useState("");
    const [ branchFilter, setBranchFilter ] = useState("All");
    const [ perPage, setPerPage ] = useState(10);
    const [ currentPage, setCurrentPage ] = useState(1);
    const [ isLoading, setIsLoading ] = useState(true);
    const [ members, setMembers ] = useState(initialMembers);

    useEffect(() => {
        setMembers(Array.isArray(initialMembers) ? initialMembers : []);
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 300); 
        return () => clearTimeout(timer);
    }, [initialMembers]);

    const handleNextStep = () => {
        if (!profileForm.firstName || !profileForm.lastName || !profileForm.dob || !profileForm.email || !profileForm.gender) {
            return toast.error("Please fill in required fields (First Name, Last Name, DOB, Email, Gender).");
        }
        setOnboardingStep(2); 
    };

    const handleCompleteOnboarding = async () => {
        setIsSubmitting(true);
        try {
            // Ensure data types are correct before sending
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
            
            // Reset forms
            setOnboardingStep(1);
            setProfileForm({ lastName: "", firstName: "", dob: "", email: "", gender: "Male", contact: "" });
            setPaymentForm({ membershipFee: 300, shareCapital: 5000, savingsDeposit: 0, paymentMethod: "cash", referenceNumber: "" });
            
            router.reload();
        } catch (error) {
            console.error(error.response?.data);
            const errorMsg = error.response?.data?.message || "Failed to complete onboarding. Check inputs.";
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredMembers = members.filter((member) => {
        const matchesSearch = 
            member.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            member.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            member.memberId?.toLowerCase().includes(search.toLowerCase());
        const matchesBranch = branchFilter === "All" || member.branchService === branchFilter;
        return matchesSearch && matchesBranch;
    });

    const totalPages = Math.ceil(filteredMembers.length / perPage);
    const paginatedMembers = filteredMembers.slice((currentPage - 1) * perPage, currentPage * perPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    };

    const handleImportClick = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("excel_file", file);

        toast.promise(
            axios.post(route('admin.members.import'), formData, {
                headers: { "Content-Type": "multipart/form-data" }
            }),
            {
                loading: 'Importing data...',
                success: 'Import successful! Refreshing...',
                error: (err) => err.response?.data?.message || 'Failed to import data.',
            }
        ).then(() => {
            setTimeout(() => router.reload(), 1500);
        });
    };

    return (
        <>
            <Head title="Members Dashboard" />
            <AdminSidebarLayout>
                <div className="min-h-screen bg-slate-50/50 dark:bg-[#0a100d] p-4 sm:p-6 lg:p-8 transition-colors duration-300">
                    
                    {/* TOP HEADER SECTION */}
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0f1f1a] p-6 lg:p-8 rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-sm relative overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
                            
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    Member Directory
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                    Manage cooperative members, view profiles, and export data.
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto relative z-10">
                                <button 
                                    onClick={() => {
                                        setOnboardingStep(1);
                                        setIsAddMemberOpen(true);
                                    }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all active:scale-95"
                                >
                                    <UserCheck className="h-4 w-4" /> Add Member
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
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                                >
                                    <Upload className="h-4 w-4" /> Import
                                </button>
                                <a 
                                    href={route('admin.members.export')}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                                >
                                    <Download className="h-4 w-4" /> Export
                                </a>
                            </div>
                        </div>

                        {/* STATS OVERVIEW */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <SummaryCard label="Total Members" value={memberSummary?.total} color="emerald" icon={Users} />
                            <SummaryCard label="Active Military" value={memberSummary?.activeMilitary} color="blue" icon={Briefcase} />
                            <SummaryCard label="Retired Military" value={memberSummary?.retiredMilitary} color="yellow" icon={Briefcase} />
                            <SummaryCard label="Civilian" value={memberSummary?.civilian} color="violet" icon={Briefcase} />
                            <SummaryCard label="PMPC" value={memberSummary?.pmpc} color="rose" icon={Briefcase} />
                            <SummaryCard label="Beneficiary" value={memberSummary?.beneficiary} color="indigo" icon={Briefcase} />
                        </div>

                        {/* FILTERS & SEARCH */}
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, ID, or email..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all outline-none"
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <select
                                        value={branchFilter}
                                        onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                                        className="pl-11 pr-10 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all outline-none appearance-none cursor-pointer"
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
                                    className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all outline-none cursor-pointer"
                                >
                                    <option value="10">10 per page</option>
                                    <option value="25">25 per page</option>
                                    <option value="50">50 per page</option>
                                </select>
                            </div>
                        </div>

                        {/* TABLE CONTENT */}
                        <div className="bg-white dark:bg-[#0f1f1a] border border-slate-200/60 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200/60 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-5 whitespace-nowrap">Member ID</th>
                                            <th className="px-6 py-5 whitespace-nowrap">Name</th>
                                            <th className="px-6 py-5 whitespace-nowrap">Branch of Service</th>
                                            <th className="px-6 py-5 whitespace-nowrap">Contact Number</th>
                                            <th className="px-6 py-5 text-right whitespace-nowrap">Action</th>
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
                                            paginatedMembers.map((member) => (
                                                <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md text-xs">
                                                            {member.id || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                                                                {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                                    {member.firstName} {member.lastName}
                                                                </div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {member.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300">
                                                            {member.branchService}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-sm">
                                                        {member.contact || "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link
                                                            href={route("admin.members.show-member", member.id)}
                                                            className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 transition-colors"
                                                            title="View Profile"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <FileText className="h-10 w-10 text-slate-300 dark:text-white/20 mb-3" />
                                                        <p className="text-base font-medium text-slate-600 dark:text-white/70">No members found</p>
                                                        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* PAGINATION FOOTER */}
                            {!isLoading && totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        Showing <span className="font-semibold text-slate-700 dark:text-white">{(currentPage - 1) * perPage + 1}</span> to <span className="font-semibold text-slate-700 dark:text-white">{Math.min(currentPage * perPage, filteredMembers.length)}</span> of <span className="font-semibold text-slate-700 dark:text-white">{filteredMembers.length}</span> results
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        
                                        <div className="flex items-center gap-1">
                                            {[...Array(totalPages)].map((_, i) => {
                                                const page = i + 1;
                                                if (
                                                    page === 1 || 
                                                    page === totalPages || 
                                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => handlePageChange(page)}
                                                            className={`h-8 min-w-[32px] px-2 rounded-lg text-sm font-medium transition-all ${
                                                                currentPage === page
                                                                    ? "bg-emerald-600 text-white shadow-md"
                                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                } else if (
                                                    page === currentPage - 2 || 
                                                    page === currentPage + 2
                                                ) {
                                                    return <span key={page} className="px-1 text-slate-400">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AdminSidebarLayout>

            {/* ONBOARDING MODAL */}
            <AnimatePresence>
                {isAddMemberOpen && (
                    <ModalShell 
                        title={onboardingStep === 1 ? "New Member Profile" : "Initial Deposits"} 
                        subtitle={onboardingStep === 1 ? "Step 1: Enter basic information" : "Step 2: Record opening balances"}
                        onClose={() => setIsAddMemberOpen(false)}
                    >
                        <div className="flex-1 flex flex-col min-h-0 w-full relative">
                            <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar space-y-6">
                                
                                {/* STEP 1: PROFILE FORM (UPDATED FIELDS) */}
                                {onboardingStep === 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <Field label="Last Name" value={profileForm.lastName} onChange={(v) => setProfileForm({...profileForm, lastName: v})} />
                                        <Field label="First Name" value={profileForm.firstName} onChange={(v) => setProfileForm({...profileForm, firstName: v})} />
                                        <Field label="Date of Birth" type="date" value={profileForm.dob} onChange={(v) => setProfileForm({...profileForm, dob: v})} />
                                        <Field label="Email Address" type="email" value={profileForm.email} onChange={(v) => setProfileForm({...profileForm, email: v})} />
                                        <SelectField 
                                            label="Gender" 
                                            value={profileForm.gender} 
                                            onChange={(v) => setProfileForm({...profileForm, gender: v})}
                                            options={[
                                                {label: "Male", value: "Male"},
                                                {label: "Female", value: "Female"}
                                            ]}
                                        />
                                        <Field label="Mobile Number" value={profileForm.contact} onChange={(v) => setProfileForm({...profileForm, contact: v})} />
                                    </div>
                                )}

                                {/* STEP 2: PAYMENT FORM */}
                                {onboardingStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                            <h4 className="text-emerald-800 dark:text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                                <Landmark className="h-4 w-4"/> Required Deposits
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Field label="Membership Fee (₱)" type="number" value={paymentForm.membershipFee} onChange={(v) => setPaymentForm({...paymentForm, membershipFee: v})} />
                                                <Field label="Initial Share Capital (₱)" type="number" value={paymentForm.shareCapital} onChange={(v) => setPaymentForm({...paymentForm, shareCapital: v})} />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                                            <h4 className="text-slate-700 dark:text-slate-300 font-bold mb-3">Optional Deposits</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Field label="Savings Deposit (₱)" type="number" value={paymentForm.savingsDeposit} onChange={(v) => setPaymentForm({...paymentForm, savingsDeposit: v})} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <SelectField 
                                                label="Payment Method" 
                                                value={paymentForm.paymentMethod} 
                                                onChange={(v) => setPaymentForm({...paymentForm, paymentMethod: v})}
                                                options={[
                                                    {label: "Cash (Over the counter)", value: "cash"},
                                                    {label: "Bank Transfer", value: "bank"},
                                                    {label: "E-Wallet (GCash/Maya)", value: "e-wallet"}
                                                ]}
                                            />

                                            <Field 
                                                label={paymentForm.paymentMethod === 'cash' ? "Official Receipt (OR) Number *" : "Transaction Reference Number *"} 
                                                value={paymentForm.referenceNumber} 
                                                onChange={(v) => setPaymentForm({...paymentForm, referenceNumber: v})} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                           {/* FOOTER BUTTONS */}
                            <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0f1f1a]">
                                <button 
                                    onClick={() => setIsAddMemberOpen(false)} 
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 text-center"
                                >
                                    Cancel
                                </button>
                                
                                {onboardingStep === 1 ? (
                                    <button 
                                        onClick={handleNextStep}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4"/> : "Next: Initial Deposit"}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleCompleteOnboarding}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4"/> : "Complete Onboarding"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </ModalShell>
                )}
            </AnimatePresence>
        </>
    );
}

function SummaryCard({ label, value, color, icon: Icon }) {
    const colors = {
        emerald: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10",
        blue: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10",
        yellow: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10",
        rose: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10",
        violet: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/10",
        indigo: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10",
    };
    const style = colors[color] || colors.emerald;

    return (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl ${style}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    <CountUp end={value || 0} duration={1.5} separator="," />
                </div>
            </div>
        </div>
    );
}

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

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">{label}</label>
            <select 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                /* CHANGED: Solid dark background instead of transparent, added appearance-none for consistent styling */
                className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#1a2c25] dark:border-white/10 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer appearance-none"
            >
                {/* CHANGED: Explicitly style the <option> tags so the OS renders them properly */}
                <option value="" disabled className="bg-white text-slate-500 dark:bg-[#1a2c25] dark:text-slate-400">Select...</option>
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

function ModalShell({ title, subtitle, onClose, children }) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = "hidden";
        
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <motion.div 
            className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center p-0 sm:p-4" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <motion.div 
                className="relative w-full max-w-2xl bg-white dark:bg-[#0f1f1a] shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl overflow-hidden" 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }} 
                transition={{ type: "spring", damping: 30, stiffness: 300, mass: 1.2 }}
            >
                <div className="shrink-0 flex justify-between items-center px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-200/80 dark:border-white/10 z-20 bg-white dark:bg-[#0f1f1a] pt-8 sm:pt-6">
                    <div className="min-w-0 pr-4">
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">{title}</div>
                        <div className="text-xs sm:text-sm text-slate-500 dark:text-white/50 mt-0.5 truncate">{subtitle}</div>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition">
                        <X size={20} />
                    </button>
                </div>
                
                {children}
            </motion.div>
        </motion.div>,
        document.body
    );
}