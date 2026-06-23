import React, { useState, useMemo, useEffect, useRef } from "react";
import { Head, useForm, Link, usePage, router } from "@inertiajs/react";
import {
    Plus, Edit2, Trash2, Hash, X, Search, FileUp,
    Download, LayoutGrid, ArrowUpDown, ChevronLeft, ChevronRight,
    MoreHorizontal, Layers, CheckCircle2, Loader2, FileText,
    ChevronsLeft, ChevronsRight, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import toast from "react-hot-toast";
import CountUp from "react-countup";

// ─── ACCOUNT TYPE CLASSIFIER ──────────────────────────────────────────────────
// Derives account category from account code prefix
function classifyAccount(code = "") {
    const prefix = code.toString().charAt(0);
    const map = {
        "1": { label: "Asset",     color: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400"           },
        "2": { label: "Liability", color: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"       },
        "3": { label: "Equity",    color: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400"},
        "4": { label: "Revenue",   color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"},
        "5": { label: "Revenue",   color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"},
        "6": { label: "Expense",   color: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"   },
        "7": { label: "Expense",   color: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"   },
        "8": { label: "Expense",   color: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"   },
    };
    return map[prefix] || { label: "Other", color: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60" };
}

// ─── SORT ICON ────────────────────────────────────────────────────────────────
function SortIcon({ col, sortConfig }) {
    const active = sortConfig.key === col;
    return (
        <ArrowUpDown
            size={12}
            className={`transition-opacity ${active ? "opacity-100 text-indigo-500" : "opacity-30 group-hover:opacity-70"}`}
        />
    );
}

// ─── MODAL SHELL ─────────────────────────────────────────────────────────────
function ModalShell({ title, subtitle, headerIcon: HeaderIcon, gradientFrom, gradientTo, onClose, children }) {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handler); };
    }, [onClose]);

    return (
        <motion.div
            className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog" aria-modal="true"
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
            <motion.div
                className="relative w-full max-w-lg bg-white dark:bg-[#0d1a14] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden flex flex-col"
                style={{ maxHeight: "92dvh" }}
                initial={{ opacity: 0, scale: 0.97, y: -14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -14 }}
                transition={{ type: "spring", damping: 30, stiffness: 360, mass: 0.85 }}
            >
                {/* Gradient header */}
                <div className={`shrink-0 flex items-center justify-between gap-4 px-5 sm:px-7 py-4 sm:py-5 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-white/15 grid place-items-center shrink-0">
                            <HeaderIcon size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">{title}</h2>
                            <p className="text-[10px] text-white/60 font-semibold hidden sm:block mt-0.5">{subtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                    >
                        <X size={18} className="text-current" />
                    </button>
                </div>

                {children}
            </motion.div>
        </motion.div>
    );
}

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────
function DeleteModal({ account, onConfirm, onClose, isDeleting }) {
    return (
        <motion.div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <motion.div
                className="relative w-full max-w-sm bg-white dark:bg-[#0d1a14] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden"
                initial={{ opacity: 0, scale: 0.96, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
            >
                {/* Rose accent strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-pink-500" />

                <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="h-11 w-11 rounded-2xl bg-rose-50 dark:bg-rose-500/15 grid place-items-center shrink-0 border border-rose-100 dark:border-rose-500/20">
                            <Trash2 size={20} className="text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Account?</h3>
                            <p className="text-xs text-slate-500 dark:text-white/50 mt-1 leading-relaxed">
                                This will permanently remove this account from the chart. This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    {/* Account preview */}
                    <div className="p-3.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.06] mb-5 flex items-center gap-3">
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg shrink-0">
                            {account.accountCode}
                        </span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-white/90 truncate">{account.accountName}</span>
                    </div>

                    <div className="flex gap-2.5">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                        >Keep it</button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all active:scale-95 disabled:opacity-60"
                        >
                            {isDeleting
                                ? <><Loader2 size={14} className="animate-spin text-current" /> Deleting...</>
                                : <><Trash2 size={14} className="text-current" /> Yes, Delete</>
                            }
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ChartOfAccount() {
    const { props } = usePage();
    const { accounts = {}, chartStats = { total: 0, newThisMonth: 0 } } = props;

    const [showModal,        setShowModal]        = useState(false);
    const [showImportModal,  setShowImportModal]  = useState(false);
    const [deleteTarget,     setDeleteTarget]     = useState(null);
    const [isDeleting,       setIsDeleting]       = useState(false);
    const [editId,           setEditId]           = useState(null);
    const [searchTerm,       setSearchTerm]       = useState("");
    const [sortConfig,       setSortConfig]       = useState({ key: "accountCode", direction: "asc" });
    const [dragActive,       setDragActive]       = useState(false);
    const isFirstRender = useRef(true);
    const fileInputRef  = useRef(null);

    const items = accounts?.data || [];
    const meta  = accounts || {};

    const { data, setData, post, put, delete: destroy, reset, errors, processing, clearErrors } = useForm({
        accountCode: "",
        accountName: "",
        file: null,
    });

    // Debounced server search
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const t = setTimeout(() => {
            router.get(route("admin.accounting.chart.index"), { search: searchTerm }, { preserveState: true, preserveScroll: true, replace: true });
        }, 380);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const sortedItems = useMemo(() => {
        const result = [...items];
        if (sortConfig.key) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key] || "";
                const bVal = b[sortConfig.key] || "";
                return sortConfig.direction === "asc"
                    ? aVal.toString().localeCompare(bVal.toString())
                    : bVal.toString().localeCompare(aVal.toString());
            });
        }
        return result;
    }, [items, sortConfig]);

    const requestSort = (key) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
    };

    const openAddModal = () => { setEditId(null); reset(); clearErrors(); setShowModal(true); };

    const openEditModal = (acc) => {
        setEditId(acc.id);
        setData({ accountCode: acc.accountCode, accountName: acc.accountName });
        clearErrors();
        setShowModal(true);
    };

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setShowModal(false);
                toast.success(editId ? "Account updated successfully." : "Account created successfully.");
                reset();
            },
        };
        if (editId) put(route("admin.accounting.chart.update", editId), options);
        else        post(route("admin.accounting.chart.store"), options);
    };

    const handleImport = (e) => {
        e.preventDefault();
        post(route("admin.accounting.chart.import"), {
            preserveScroll: true,
            onSuccess: () => {
                setShowImportModal(false);
                toast.success("Accounts imported successfully.");
                reset();
            },
        });
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        destroy(route("admin.accounting.chart.destroy", deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Account ${deleteTarget.accountCode} deleted.`);
                setDeleteTarget(null);
            },
            onError: () => toast.error("Failed to delete account."),
            onFinish: () => setIsDeleting(false),
        });
    };

    // Drag-and-drop file handling for import
    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.name.endsWith(".csv")) setData("file", file);
        else toast.error("Please drop a .csv file.");
    };

    const todayStr = new Date().toLocaleString("en-PH", { month: "long", year: "numeric" });

    const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition";

    // ── STAT SUMMARY ──────────────────────────────────────────────────────────
    const assetCount    = items.filter(a => a.accountCode?.startsWith("1")).length;
    const liabCount     = items.filter(a => a.accountCode?.startsWith("2")).length;
    const revenueCount  = items.filter(a => ["4","5"].includes(a.accountCode?.charAt(0))).length;
    const expenseCount  = items.filter(a => ["6","7","8"].includes(a.accountCode?.charAt(0))).length;

    return (
        <AdminSidebarLayout>
            <Head title="Chart of Accounts">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="space-y-5 sm:space-y-6 pb-10">

                {/* ── HEADER ──────────────────────────────────────────────── */}
                <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-sm">
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 grid place-items-center shadow-lg shadow-indigo-500/25 shrink-0">
                                <LayoutGrid className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Chart of Accounts</h1>
                                <p className="text-xs sm:text-sm text-slate-400 dark:text-white/40 font-medium mt-0.5">Manage general ledger structures and account mappings.</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <a
                                href={route("admin.accounting.chart.download-template")}
                                download="chart_of_accounts_template.csv"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95"
                            >
                                <Download size={15} className="text-slate-400 dark:text-white/40 shrink-0" />
                                <span className="hidden xs:inline">Template</span>
                            </a>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95"
                            >
                                <FileUp size={15} className="text-slate-400 dark:text-white/40 shrink-0" />
                                <span>Import CSV</span>
                            </button>
                            <button
                                onClick={openAddModal}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                            >
                                <Plus size={16} className="text-current shrink-0" />
                                <span>New Account</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── STAT STRIP ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Total Accounts", value: chartStats.total || meta.total || 0,
                          gradient: "from-indigo-500 to-blue-600", shadow: "shadow-indigo-500/20" },
                        { label: "Assets",   value: assetCount,   gradient: "from-sky-500 to-cyan-600",      shadow: "shadow-sky-500/20"    },
                        { label: "Revenue",  value: revenueCount, gradient: "from-emerald-500 to-teal-600",  shadow: "shadow-emerald-500/20"},
                        { label: "Expenses", value: expenseCount, gradient: "from-amber-500 to-orange-500",  shadow: "shadow-amber-500/20"  },
                    ].map(s => (
                        <div key={s.label} className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${s.gradient} shadow-lg ${s.shadow} hover:-translate-y-0.5 transition-all duration-300`}>
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1.5">{s.label}</p>
                            <p className="text-2xl sm:text-3xl font-black text-white font-mono">
                                <CountUp end={Number(s.value) || 0} duration={1.4} separator="," preserveValue />
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── SEARCH + TABLE ───────────────────────────────────────── */}
                <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">

                    {/* Search bar */}
                    <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                        <div className="relative flex-1 sm:max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/30 pointer-events-none" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search by code or account name..."
                                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 grid place-items-center rounded-full bg-slate-200 dark:bg-white/15 text-slate-500 dark:text-white/60 hover:bg-slate-300 dark:hover:bg-white/25 transition"
                                >
                                    <X size={11} className="text-current" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-400 dark:text-white/30 font-medium">
                                {sortedItems.length} account{sortedItems.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/[0.06]">
                                <tr>
                                    <th
                                        onClick={() => requestSort("accountCode")}
                                        className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap group"
                                    >
                                        <div className="flex items-center gap-2">Account Code <SortIcon col="accountCode" sortConfig={sortConfig} /></div>
                                    </th>
                                    <th
                                        onClick={() => requestSort("accountName")}
                                        className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap group"
                                    >
                                        <div className="flex items-center gap-2">Account Name <SortIcon col="accountName" sortConfig={sortConfig} /></div>
                                    </th>
                                    <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 hidden sm:table-cell">Type</th>
                                    <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                                {sortedItems.length > 0 ? sortedItems.map(acc => {
                                    const type = classifyAccount(acc.accountCode);
                                    return (
                                        <tr key={acc.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.025] transition-colors group">
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg">
                                                    {acc.accountCode}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{acc.accountName}</p>
                                                    {/* Type badge inline on mobile (column hidden below sm) */}
                                                    <span className={`sm:hidden inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${type.color}`}>
                                                        {type.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${type.color}`}>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-70" />
                                                    {type.label}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(acc)}
                                                        title="Edit"
                                                        className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-all active:scale-95"
                                                    >
                                                        <Edit2 size={13} className="text-current" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(acc)}
                                                        title="Delete"
                                                        className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-all active:scale-95"
                                                    >
                                                        <Trash2 size={13} className="text-current" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-300 dark:text-white/20">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-white/5 grid place-items-center">
                                                    <Layers size={26} className="opacity-50" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-500 dark:text-white/40">
                                                    {searchTerm ? "No accounts match your search" : "No accounts found"}
                                                </p>
                                                {searchTerm && (
                                                    <button onClick={() => setSearchTerm("")} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                                                        Clear search
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {meta.links && meta.last_page > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                            <p className="text-xs font-medium text-slate-400 dark:text-white/30">
                                Page <span className="font-bold text-indigo-600 dark:text-indigo-400">{meta.current_page}</span> of {meta.last_page} · {meta.total} total
                            </p>
                            <div className="flex items-center gap-1.5">
                                {meta.links.map((link, i) => {
                                    const isPrev     = link.label.includes("Previous");
                                    const isNext     = link.label.includes("Next");
                                    const isEllipsis = link.label === "...";
                                    if (isEllipsis) return (
                                        <span key={i} className="h-8 w-8 grid place-items-center text-slate-400 dark:text-white/30 text-xs">…</span>
                                    );
                                    return (
                                        <Link
                                            key={i}
                                            href={link.url || "#"}
                                            preserveScroll preserveState
                                            className={`h-8 min-w-[2rem] px-2 grid place-items-center rounded-xl text-xs font-bold transition-all ${
                                                link.active
                                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                                                    : "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/50 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                            } ${!link.url ? "opacity-30 pointer-events-none" : ""}`}
                                        >
                                            {isPrev ? <ChevronLeft size={14} className="text-current" /> : isNext ? <ChevronRight size={14} className="text-current" /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── ADD / EDIT MODAL ─────────────────────────────────────────── */}
            <AnimatePresence>
                {showModal && (
                    <ModalShell
                        title={editId ? "Edit Account" : "New Account"}
                        subtitle={editId ? "Update account code and name" : "Add a new account to the chart"}
                        headerIcon={editId ? Edit2 : Plus}
                        gradientFrom="from-indigo-600"
                        gradientTo="to-blue-600"
                        onClose={() => setShowModal(false)}
                    >
                        <div className="p-5 sm:p-7 space-y-4 flex-1 overflow-y-auto bg-slate-50/40 dark:bg-white/[0.01]">

                            {/* Account Code */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 ml-0.5">
                                    Account Code <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative">
                                    <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={data.accountCode}
                                        onChange={e => setData("accountCode", e.target.value)}
                                        placeholder="e.g. 101-01"
                                        className={`${inputCls} pl-9 ${errors.accountCode ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400/20" : ""}`}
                                        autoFocus
                                        required
                                    />
                                </div>
                                {errors.accountCode && (
                                    <p className="text-rose-500 text-xs font-semibold flex items-center gap-1.5 ml-0.5">
                                        <AlertCircle size={12} className="text-current shrink-0" /> {errors.accountCode}
                                    </p>
                                )}
                            </div>

                            {/* Account Name */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 ml-0.5">
                                    Account Name <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative">
                                    <FileText size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={data.accountName}
                                        onChange={e => setData("accountName", e.target.value)}
                                        placeholder="e.g. Cash in Bank - BDO"
                                        className={`${inputCls} pl-9 ${errors.accountName ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400/20" : ""}`}
                                        required
                                    />
                                </div>
                                {errors.accountName && (
                                    <p className="text-rose-500 text-xs font-semibold flex items-center gap-1.5 ml-0.5">
                                        <AlertCircle size={12} className="text-current shrink-0" /> {errors.accountName}
                                    </p>
                                )}
                            </div>

                            {/* Account type hint */}
                            {data.accountCode && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                    <span className="text-xs text-slate-400 dark:text-white/40 font-medium">Classified as:</span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${classifyAccount(data.accountCode).color}`}>
                                        {classifyAccount(data.accountCode).label}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-white/30 font-medium ml-auto">Based on first digit of code</span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 px-5 sm:px-7 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-white dark:bg-[#0a1510]">
                            <p className="text-[10px] text-slate-400 dark:text-white/30 hidden sm:block">
                                {editId ? "Changes will update the ledger mapping." : "Account will be available for GL mappings immediately."}
                            </p>
                            <div className="flex gap-2.5 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 font-semibold text-sm transition-all active:scale-95"
                                >Cancel</button>
                                <button
                                    onClick={submit}
                                    disabled={processing}
                                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-60 transition-all active:scale-95"
                                >
                                    {processing
                                        ? <><Loader2 size={14} className="animate-spin text-current" /> Saving...</>
                                        : <><CheckCircle2 size={14} className="text-current" /> {editId ? "Update Account" : "Create Account"}</>
                                    }
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}
            </AnimatePresence>

            {/* ── IMPORT MODAL ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {showImportModal && (
                    <ModalShell
                        title="Import Accounts"
                        subtitle="Bulk upload via CSV file"
                        headerIcon={FileUp}
                        gradientFrom="from-teal-600"
                        gradientTo="to-emerald-600"
                        onClose={() => setShowImportModal(false)}
                    >
                        <form onSubmit={handleImport} className="flex-1 overflow-y-auto">
                            <div className="p-5 sm:p-7 space-y-5 bg-slate-50/40 dark:bg-white/[0.01]">

                                {/* CSV format hint */}
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl">
                                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-2 flex items-center gap-2">
                                        <AlertCircle size={14} className="text-current shrink-0" /> Required CSV Format
                                    </p>
                                    <p className="text-xs text-indigo-700/80 dark:text-indigo-300/70 leading-relaxed">
                                        Your file must have exactly two columns:
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <code className="text-[11px] font-mono font-bold bg-white/60 dark:bg-white/10 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-500/20">accountCode</code>
                                        <span className="text-indigo-400 text-xs">and</span>
                                        <code className="text-[11px] font-mono font-bold bg-white/60 dark:bg-white/10 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-500/20">accountName</code>
                                    </div>
                                </div>

                                {/* Drop zone */}
                                <div
                                    onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                                    onDragLeave={() => setDragActive(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                                        dragActive
                                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                                            : data.file
                                                ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5"
                                                : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5"
                                    }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={e => setData("file", e.target.files?.[0] || null)}
                                    />
                                    {data.file ? (
                                        <>
                                            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 grid place-items-center">
                                                <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{data.file.name}</p>
                                                <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5">{(data.file.size / 1024).toFixed(1)} KB · Ready to import</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={e => { e.stopPropagation(); setData("file", null); }}
                                                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                                            >Remove file</button>
                                        </>
                                    ) : (
                                        <>
                                            <div className={`h-12 w-12 rounded-2xl grid place-items-center ${dragActive ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-slate-100 dark:bg-white/10"}`}>
                                                <FileUp size={22} className={dragActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-white/40"} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-slate-700 dark:text-white/70">
                                                    {dragActive ? "Drop your CSV here" : "Drag & drop or click to browse"}
                                                </p>
                                                <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5">Supports .csv files only</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {errors.file && (
                                    <p className="text-rose-500 text-xs font-semibold flex items-center gap-1.5">
                                        <AlertCircle size={12} className="text-current shrink-0" /> {errors.file}
                                    </p>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2.5 px-5 sm:px-7 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-white dark:bg-[#0a1510]">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 font-semibold text-sm transition-all active:scale-95"
                                >Cancel</button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.file}
                                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    {processing
                                        ? <><Loader2 size={14} className="animate-spin text-current" /> Importing...</>
                                        : <><FileUp size={14} className="text-current" /> Confirm Import</>
                                    }
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}
            </AnimatePresence>

            {/* ── DELETE CONFIRM MODAL ─────────────────────────────────────── */}
            <AnimatePresence>
                {deleteTarget && (
                    <DeleteModal
                        account={deleteTarget}
                        onConfirm={handleConfirmDelete}
                        onClose={() => !isDeleting && setDeleteTarget(null)}
                        isDeleting={isDeleting}
                    />
                )}
            </AnimatePresence>

        </AdminSidebarLayout>
    );
}