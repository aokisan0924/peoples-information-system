import React, { useRef, useEffect, useState } from "react";
import { Head, router, Link, usePage } from "@inertiajs/react";
import { 
    Users, Eye, Upload, Download, Search, Loader2, Filter, 
    ChevronLeft, ChevronRight, FileText, Briefcase, UserCheck
} from "lucide-react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";
import toast from "react-hot-toast";
import axios from "axios";

export default function Members() {
    const { props } = usePage();
    const { memberSummary, members: initialMembers = [] } = props;

    const fileInputRef = useRef(null);

    // --- STATE ---
    const [search, setSearch] = useState("");
    const [branchFilter, setBranchFilter] = useState("All");
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState(initialMembers);

    // --- EFFECTS ---
    useEffect(() => {
        setMembers(Array.isArray(initialMembers) ? initialMembers : []);
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 300); 
        return () => clearTimeout(timer);
    }, [initialMembers]);

    // --- HANDLERS ---
    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        await toast.promise(
            new Promise((resolve, reject) => {
                router.post(route("admin.members.import"), formData, {
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: () => reject(),
                });
            }),
            {
                loading: "Importing members...",
                success: "Import completed successfully!",
                error: "Import failed!",
            }
        );
    };

    const handleExportClick = async () => {
        const toastId = toast.loading("Preparing member export...");
        try {
            const response = await axios.get(route("admin.members.export"), {
                params: { search: search || "" },
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "PIS_Member_Export.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Export completed!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to export.", { id: toastId });
        }
    };

    // --- FILTERING ---
    const filteredMembers = members
        .filter((member) => {
            const fullName = `${member.firstName ?? ""} ${member.middleName ?? ""} ${member.lastName ?? ""}`.toLowerCase();
            const term = search.toLowerCase();
            return fullName.includes(term) || 
                member.username?.toLowerCase().includes(term) ||
                member.afpsn?.toLowerCase().includes(term);
        })
        .filter((member) => branchFilter === "All" ? true : member.branchService === branchFilter);

    // --- PAGINATION ---
    const total = filteredMembers.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const startIndex = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const endIndex = total === 0 ? 0 : Math.min(currentPage * perPage, total);
    
    const paginatedMembers = filteredMembers.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setIsLoading(true);
        setCurrentPage(page);
        setTimeout(() => setIsLoading(false), 200);
    };

    const uniqueBranchServices = Array.from(new Set(members.map((m) => m.branchService).filter(Boolean)));

    useEffect(() => {
        if (!members.length) return;
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 200);
        return () => clearTimeout(timer);
    }, [search, branchFilter, perPage]);

    return (
        <>
            <Head title="Members">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="space-y-6">
                    
                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                Member Directory
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Manage member profiles, view status, and export records.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleExportClick} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                                <Download size={18} />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                            <button onClick={handleImportClick} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all">
                                <Upload size={18} />
                                <span>Import</span>
                            </button>
                            <input type="file" accept=".xlsx" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        </div>
                    </div>

                    {/* SUMMARY CARDS GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                        <SummaryCard label="Active" value={memberSummary?.totalActiveMembers} color="emerald" icon={UserCheck} />
                        <SummaryCard label="Retired" value={memberSummary?.totalRetiredMembers} color="blue" icon={Briefcase} />
                        <SummaryCard label="PMPC" value={memberSummary?.totalPmpcMembers} color="yellow" icon={Users} />
                        <SummaryCard label="Beneficiary" value={memberSummary?.totalBeneficiaryMembers} color="rose" icon={Users} />
                        <SummaryCard label="Civilian" value={memberSummary?.totalCivilianMembers} color="violet" icon={Users} />
                        <SummaryCard label="CDEA" value={memberSummary?.totalCdeaMembers} color="indigo" icon={Users} />
                    </div>

                    {/* FILTER SECTION */}
                    <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-4 shadow-sm transition-colors">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-white/40" />
                                    <input 
                                        type="text" 
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                        placeholder="Name, Username, or AFPSN..." 
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* Branch Filter */}
                            <div className="w-full md:w-64">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Branch Service</label>
                                <div className="relative">
                                    <Filter className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-white/40" />
                                    <select
                                        value={branchFilter}
                                        onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm appearance-none"
                                    >
                                        <option value="All">All Branches</option>
                                        {uniqueBranchServices.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Per Page */}
                            <div className="w-full md:w-32">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Rows</label>
                                <select
                                    value={perPage}
                                    onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                >
                                    {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* DATA TABLE CARD */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm overflow-hidden transition-colors">
                        
                        {/* DESKTOP TABLE */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Name / ID</th>
                                        <th className="px-6 py-4">AFPSN</th>
                                        <th className="px-6 py-4">Branch</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                                    {isLoading ? (
                                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/>Loading members...</td></tr>
                                    ) : paginatedMembers.length === 0 ? (
                                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No members found matching your criteria.</td></tr>
                                    ) : (
                                        paginatedMembers.map((member) => (
                                            <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                                                            {member.firstName?.[0]}{member.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                                {member.lastName}, {member.firstName} {member.suffix}
                                                            </div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                                {member.username || 'No Username'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">{member.afpsn || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                                        {member.branchService || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link
                                                        href={route("admin.members.show-member", member.id)}
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

                        {/* MOBILE CARDS LIST */}
                        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <div className="p-10 text-center text-slate-500 dark:text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/>Loading...</div>
                            ) : paginatedMembers.length === 0 ? (
                                <div className="p-10 text-center text-slate-500 dark:text-slate-400">No members found.</div>
                            ) : (
                                paginatedMembers.map((member) => (
                                    <div key={member.id} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 dark:text-white">
                                                        {member.lastName}, {member.firstName}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                        {member.username}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                {member.branchService || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-3">
                                            <div>
                                                <span className="block uppercase tracking-wider text-[10px] font-bold opacity-60 mb-0.5">AFPSN</span>
                                                <span className="text-slate-900 dark:text-white font-mono">{member.afpsn || '—'}</span>
                                            </div>
                                        </div>
                                        <Link
                                            href={route("admin.members.show-member", member.id)}
                                            className="flex items-center justify-center w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-transform"
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* PAGINATION FOOTER */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex}</span> - <span className="font-semibold text-slate-900 dark:text-white">{endIndex}</span> of <span className="font-semibold text-slate-900 dark:text-white">{total}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminSidebarLayout>
        </>
    );
}

// --- HELPER COMPONENTS ---

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
            <div className={`p-2.5 rounded-xl ${style}`}>
                <Icon size={20} />
            </div>
            <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                    <CountUp end={value || 0} duration={1} separator="," />
                </div>
            </div>
        </div>
    );
}