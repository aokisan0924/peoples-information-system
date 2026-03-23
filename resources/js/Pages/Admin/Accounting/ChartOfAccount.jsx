import React, { useState, useMemo, useEffect, useRef } from "react";
import { Head, useForm, Link, usePage, router } from "@inertiajs/react";
import { 
    Plus, Edit2, Trash2, Hash, X, Search, FileUp, 
    Download, LayoutGrid, ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal, Activity, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import toast from "react-hot-toast";
import CountUp from "react-countup";

// --- COMPACT GRADIENT STAT CARD WITH HOVER ACTIONS ---
function StatCard({ label, value, icon: Icon, color, subtext, prefix = "", actionIcon, onAction }) {
    const gradientColors = {
        emerald: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20 border-emerald-400/20",
        blue: "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20 border-blue-400/20",
        amber: "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20 border-amber-400/20",
        slate: "bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-900/20 border-slate-600/50",
    };

    return (
        <div className={`relative overflow-hidden rounded-[1.25rem] p-4 border shadow-sm flex items-center gap-4 transition-all hover:-translate-y-1 duration-300 group ${gradientColors[color] || gradientColors.blue}`}>
            {/* Background Glow */}
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500"></div>
            
            <div className="relative p-2.5 rounded-xl bg-white/20 backdrop-blur-md shadow-inner border border-white/20">
                <Icon size={20} className="text-white drop-shadow-sm" />
            </div>
            
            <div className="relative z-10 flex-1">
                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-xl font-black text-white font-mono drop-shadow-sm tracking-tight">
                    {typeof value === 'number' || !isNaN(value) ? (
                        <CountUp end={Number(value) || 0} duration={1.5} separator="," prefix={prefix} />
                    ) : (
                        <>{prefix}{value}</>
                    )}
                </p>
                {subtext && <p className="text-[9px] font-bold text-white/60 mt-0.5">{subtext}</p>}
            </div>

            {/* Hover Action Button */}
            {actionIcon && (
                <button 
                    onClick={onAction}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 shadow-sm"
                >
                    {actionIcon}
                </button>
            )}
        </div>
    );
}

export default function ChartOfAccount() {
    const { props } = usePage();
    const { accounts = {}, chartStats = { total: 0, newThisMonth: 0 } } = props; 
    
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'accountCode', direction: 'asc' });

    const isFirstRender = useRef(true);
    const items = accounts?.data || [];
    const meta = accounts || {};

    const { data, setData, post, put, delete: destroy, reset, errors, processing, clearErrors } = useForm({
        accountCode: '',
        accountName: '',
        file: null,
    });

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const delaySearch = setTimeout(() => {
            router.get(
                route('admin.accounting.chart.index'),
                { search: searchTerm },
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 400); 
        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    const sortedAndFilteredAccounts = useMemo(() => {
        let result = [...items]; 
        if (sortConfig.key) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [items, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const openAddModal = () => { 
        setEditId(null); 
        reset(); 
        clearErrors(); 
        setShowModal(true); 
    };
    
    const openEditModal = (acc) => {
        setEditId(acc.id);
        setData({ accountCode: acc.accountCode, accountName: acc.accountName });
        clearErrors(); 
        setShowModal(true);
    };

    const submit = (e) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => { 
                setShowModal(false); 
                toast.success(editId ? "Account Updated Successfully" : "New Account Created");
                reset(); 
            }
        };

        if (editId) {
            put(route('admin.accounting.chart.update', editId), options);
        } else {
            post(route('admin.accounting.chart.store'), options);
        }
    };

    const handleImport = (e) => {
        e.preventDefault();
        post(route('admin.accounting.chart.import'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowImportModal(false);
                toast.success("Bulk Import Successful");
                reset();
            },
        });
    };

    const confirmDelete = (acc) => {
        toast.custom((t) => (
            <div className={`${
                t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
            } transform transition-all duration-300 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 shadow-2xl rounded-[2rem] p-6 flex flex-col gap-5 min-w-[340px] pointer-events-auto`}>
                
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                        <Trash2 size={22} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Delete Account?</p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Permanently remove <span className="text-rose-500 font-bold bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">{acc.accountCode}</span>?
                        </p>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-1 pt-4 border-t border-slate-100 dark:border-white/5">
                    <button 
                        onClick={() => toast.dismiss(t.id)} 
                        className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            toast.dismiss(t.id);
                            destroy(route('admin.accounting.chart.destroy', acc.id), {
                                preserveScroll: true,
                                onSuccess: () => toast.success("Account deleted!"),
                            });
                        }} 
                        className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-xl shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        ), { duration: Infinity, position: 'top-center' });
    };

    const todayStr = new Date().toLocaleString("en-PH", { month: "long", year: "numeric" });

    return (
        <AdminSidebarLayout>
            <Head title="Accounting | Chart of Accounts">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            
            <div className="space-y-6 p-4 md:p-6 max-w-[90rem] mx-auto animate-in fade-in duration-500">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/20">
                                <LayoutGrid className="h-5 w-5" strokeWidth={2.5} />
                            </div>
                            Chart of Accounts
                        </h1>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1.5 ml-1">
                            Manage general ledger structures and account mappings.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2.5">
                        <button 
                            onClick={() => setShowImportModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200/60 dark:border-white/10 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-widest font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            <FileUp size={16} className="text-slate-400" />
                            <span>Import CSV</span>
                        </button>
                        <button 
                            onClick={openAddModal}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] uppercase tracking-widest font-bold shadow-lg shadow-blue-500/25 transition-all active:scale-95"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            <span>New Account</span>
                        </button>
                    </div>
                </div>

                {/* --- COMPACT GRADIENT STAT CARDS WITH HOVER ACTIONS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard 
                        label="Total Accounts" 
                        value={chartStats.total || meta.total || accounts.length || 0} 
                        icon={Hash} 
                        color="blue" 
                        subtext={`Active Codes as of ${todayStr}`} 
                        actionIcon={<Plus size={16} />}
                        onAction={openAddModal}
                    />
                    <a 
                        href={route('admin.accounting.chart.download-template')}
                        download="chart_of_accounts_template.csv" // <--- ADD THIS
                        target="_blank" // <--- ADD THIS
                        rel="noopener noreferrer" // <--- ADD THIS
                        className="relative overflow-hidden rounded-3xl p-5 border border-slate-600/50 bg-gradient-to-br from-slate-800 to-slate-950 shadow-lg shadow-slate-900/20 flex flex-col justify-center gap-2 transition-all hover:-translate-y-1 duration-300 group"
                    >
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-500"></div>
                        <p className="relative z-10 text-[10px] font-black text-white/50 uppercase tracking-widest flex justify-between items-center">
                            Resources
                            <span className="p-1.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                                <Download size={14} className="text-white/80" />
                            </span>
                        </p>
                        <p className="relative z-10 text-lg font-black text-white mt-1 group-hover:text-blue-400 transition-colors tracking-tight">
                            Download CSV Template
                        </p>
                        <p className="relative z-10 text-[10px] font-bold text-white/40">Use standard mapping format</p>
                    </a>
                </div>

                {/* --- FLOATING COMMAND BAR (SEARCH) --- */}
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 p-2 shadow-sm transition-all">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by account code or name..." 
                            className="w-full pl-11 pr-6 py-2.5 rounded-xl border-none bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none text-sm font-semibold shadow-inner"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full text-slate-500 transition-colors">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* --- TABLE CARD --- */}
                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900 shadow-xl shadow-slate-200/10 dark:shadow-none overflow-hidden transition-colors">
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                <tr>
                                    <th onClick={() => requestSort('accountCode')} className="px-6 py-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap group/th">
                                        <div className="flex items-center gap-2">Account Code <ArrowUpDown size={12} className="opacity-40 group-hover/th:opacity-100 transition-opacity"/></div>
                                    </th>
                                    <th onClick={() => requestSort('accountName')} className="px-6 py-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap group/th">
                                        <div className="flex items-center gap-2">Account Name <ArrowUpDown size={12} className="opacity-40 group-hover/th:opacity-100 transition-opacity"/></div>
                                    </th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700 dark:text-slate-200">
                                {sortedAndFilteredAccounts.length > 0 ? sortedAndFilteredAccounts.map((acc) => (
                                    <tr key={acc.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-blue-50/30 dark:hover:bg-white/[0.02] transition-colors last:border-0">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hidden sm:block shadow-sm"></div>
                                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md">{acc.accountCode}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{acc.accountName}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* Action Buttons: Restored to always be visible */}
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(acc)} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-blue-600 transition-all shadow-sm">
                                                    <Edit2 size={14} strokeWidth={2.5} />
                                                </button>
                                                <button onClick={() => confirmDelete(acc)} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-600 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-600 transition-all shadow-sm">
                                                    <Trash2 size={14} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-800/50">
                                                    <Layers className="w-6 h-6 text-slate-400 dark:text-slate-500" strokeWidth={2} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No accounts found</p>
                                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search criteria.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- PAGINATION --- */}
                    {meta.links && meta.last_page > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page <span className="text-blue-600 dark:text-blue-400">{meta.current_page}</span> of {meta.last_page}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {meta.links.map((link, i) => {
                                    const isPrevious = link.label.includes('Previous');
                                    const isNext = link.label.includes('Next');
                                    const isEllipsis = link.label.includes('...');

                                    if (isEllipsis) return <div key={i} className="flex items-center justify-center w-8 h-8 text-slate-400"><MoreHorizontal size={14} /></div>;

                                    return (
                                        <Link
                                            key={i}
                                            href={link.url || '#'}
                                            preserveScroll
                                            preserveState
                                            className={`h-8 min-w-[32px] px-2.5 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                                                link.active 
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-none' 
                                                    : 'bg-white border border-slate-200/80 text-slate-500 hover:border-blue-500 hover:text-blue-600 dark:bg-slate-800 dark:border-white/10 dark:text-slate-400'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                        >
                                            {isPrevious ? <ChevronLeft size={14} strokeWidth={3} /> : isNext ? <ChevronRight size={14} strokeWidth={3} /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ADD / EDIT MODAL --- */}
            <AnimatePresence>
                {showModal && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        <motion.div initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 10, opacity: 0 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200/50 dark:border-white/10">
                            
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editId ? 'Modify Account' : 'New Account'}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Configure ledger credentials</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-100 text-slate-500 transition-all active:scale-95 shadow-sm"><X size={18} strokeWidth={2.5}/></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1">Account Code</label>
                                    <input 
                                        type="text" 
                                        value={data.accountCode} 
                                        onChange={e => setData('accountCode', e.target.value)} 
                                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-sm font-bold transition-all shadow-sm" 
                                        placeholder="e.g. 101-01" 
                                        required 
                                    />
                                    {errors.accountCode && <div className="text-rose-500 text-xs mt-2 font-bold pl-1">{errors.accountCode}</div>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1">Account Name</label>
                                    <input 
                                        type="text" 
                                        value={data.accountName} 
                                        onChange={e => setData('accountName', e.target.value)} 
                                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-sm font-bold transition-all shadow-sm" 
                                        placeholder="e.g. Cash in Bank" 
                                        required 
                                    />
                                    {errors.accountName && <div className="text-rose-500 text-xs mt-2 font-bold pl-1">{errors.accountName}</div>}
                                </div>
                            </div>

                            <div className="px-8 py-6 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50/50 dark:bg-white/5">
                                <button onClick={() => setShowModal(false)} className="px-6 py-3.5 rounded-2xl text-[11px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">Cancel</button>
                                <button onClick={submit} disabled={processing} className="px-8 py-3.5 rounded-2xl text-[11px] font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 uppercase tracking-widest active:scale-95">
                                    {processing ? 'Saving...' : 'Save Account'}
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- IMPORT MODAL --- */}
            <AnimatePresence>
                {showImportModal && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
                        <motion.div initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 10, opacity: 0 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200/50 dark:border-white/10">
                            
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Import Accounts</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Upload CSV Database</p>
                                </div>
                                <button onClick={() => setShowImportModal(false)} className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-100 text-slate-500 transition-all active:scale-95 shadow-sm"><X size={18} strokeWidth={2.5}/></button>
                            </div>

                            <form onSubmit={handleImport} className="p-8 space-y-6">
                                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-500/20 shadow-inner">
                                    <p className="text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <FileUp size={16}/> CSV Format Required
                                    </p>
                                    <p className="text-sm font-medium text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                                        Ensure your file contains exactly two headers: <br/>
                                        <span className="font-mono font-bold bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-500/30">accountCode</span> and <span className="font-mono font-bold bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-500/30">accountName</span>.
                                    </p>
                                </div>
                                
                                <div className="relative group/upload">
                                    <input 
                                        type="file" 
                                        accept=".csv"
                                        onChange={e => setData('file', e.target.files[0])}
                                        className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] p-8 text-center text-sm font-bold text-slate-500 cursor-pointer bg-slate-50/30 hover:bg-slate-50 dark:bg-slate-800/30 dark:hover:bg-slate-800/50 transition-colors file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[11px] file:uppercase file:tracking-widest file:font-black file:bg-blue-50 file:text-blue-700 group-hover/upload:file:bg-blue-100 dark:file:bg-blue-500/20 dark:file:text-blue-400"
                                    />
                                </div>
                                {errors.file && <p className="text-rose-500 text-xs font-bold text-center">{errors.file}</p>}
                                
                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowImportModal(false)} className="px-6 py-3.5 rounded-2xl text-[11px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">Cancel</button>
                                    <button type="submit" disabled={processing || !data.file} className="px-8 py-3.5 rounded-2xl text-[11px] font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 uppercase tracking-widest active:scale-95">
                                        {processing ? 'Uploading...' : 'Confirm Import'}
                                    </button>
                                </div>
                            </form>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </AdminSidebarLayout>
    );
}