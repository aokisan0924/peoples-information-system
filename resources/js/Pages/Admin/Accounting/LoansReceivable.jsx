import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import {
    PieChart, ChevronDown, ChevronRight, FileSpreadsheet,
    Search, X, Download, AlertCircle, RefreshCw,
    Wallet, TrendingUp, Users, Clock, ChevronLeft,
    CheckCircle2, AlertTriangle, Ban, Hourglass, Filter
} from 'lucide-react';
import axios from 'axios';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (v) =>
    Number(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_CONFIG = {
    paid:       { label: 'Paid',       bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
    partial:    { label: 'Partial',    bg: 'bg-sky-100 dark:bg-sky-500/20',         text: 'text-sky-700 dark:text-sky-300',         dot: 'bg-sky-500'     },
    unpaid:     { label: 'Unpaid',     bg: 'bg-slate-100 dark:bg-white/10',         text: 'text-slate-500 dark:text-white/50',      dot: 'bg-slate-400'   },
    overdue:    { label: 'Overdue',    bg: 'bg-rose-100 dark:bg-rose-500/20',       text: 'text-rose-700 dark:text-rose-300',       dot: 'bg-rose-500'    },
    restructured:{ label: 'Restructured', bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300',     dot: 'bg-amber-500'   },
};

const getStatus = (row) => {
    const key = (row.status ?? 'unpaid').toLowerCase();
    return STATUS_CONFIG[key] ?? STATUS_CONFIG.unpaid;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ─── SKELETON ROW ─────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="p-4"><div className="h-4 w-4 bg-slate-200 dark:bg-white/10 rounded" /></td>
            {[100, 140, 180, 60, 100, 100, 80].map((w, i) => (
                <td key={i} className="p-4">
                    <div className={`h-3 bg-slate-200 dark:bg-white/10 rounded`} style={{ width: w }} />
                </td>
            ))}
        </tr>
    );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }) {
    const colors = {
        emerald: 'from-emerald-500 to-teal-500',
        sky:     'from-sky-500 to-blue-500',
        violet:  'from-violet-500 to-purple-500',
        amber:   'from-amber-500 to-orange-500',
    };
    return (
        <div className="bg-white dark:bg-[#111a16] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-4 flex items-center gap-4">
            <div className={`shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br ${colors[color]} grid place-items-center shadow-md`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">{label}</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5 truncate">{value}</p>
                {sub && <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ row }) {
    const s = getStatus(row);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

// ─── EXPORT TO CSV ────────────────────────────────────────────────────────────
function exportCSV(data) {
    const headers = ['Reference', 'Borrower', 'Terms', 'Principal', 'Gross Amount', 'Billed Date'];
    const rows = data.map(l => [
        l.loanReference, l.memberName, `${l.termMonths} Mos`,
        l.loanAmount, l.gross, l.billedAt
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `loans-receivable-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function LoansReceivable() {
    const [receivables, setReceivables]   = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const [isLoading, setIsLoading]       = useState(true);
    const [error, setError]               = useState(null);

    // ── FILTER / SEARCH STATE ─────────────────────────────────────────────────
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pageSize, setPageSize]         = useState(10);
    const [currentPage, setCurrentPage]  = useState(1);

    // ── FETCH ─────────────────────────────────────────────────────────────────
    const fetchData = useCallback(() => {
        setIsLoading(true);
        setError(null);
        axios.get(route('admin.accounting.receivables.data'))
            .then(res => {
                setReceivables(Array.isArray(res.data) ? res.data : []);
            })
            .catch(err => {
                setError(err?.response?.data?.message || 'Failed to load loans receivable. Please try again.');
            })
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── TOGGLE ROW EXPANSION ──────────────────────────────────────────────────
    const toggleRow = (id) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    // ── COMPUTED STATS ────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        totalLoans:     receivables.length,
        totalPrincipal: receivables.reduce((s, l) => s + Number(l.loanAmount ?? 0), 0),
        totalGross:     receivables.reduce((s, l) => s + Number(l.gross ?? 0), 0),
        overdueCount:   receivables.filter(l =>
            (l.ledger ?? []).some(r => (r.status ?? '').toLowerCase() === 'overdue')
        ).length,
    }), [receivables]);

    // ── FILTERED & PAGINATED DATA ─────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return receivables.filter(loan => {
            const matchSearch = !q
                || loan.memberName?.toLowerCase().includes(q)
                || loan.loanReference?.toLowerCase().includes(q);

            const loanStatuses = (loan.ledger ?? []).map(r => (r.status ?? 'unpaid').toLowerCase());
            const matchStatus  = statusFilter === 'all'
                || loanStatuses.includes(statusFilter)
                || (statusFilter === 'unpaid' && loanStatuses.every(s => s === 'unpaid'));

            return matchSearch && matchStatus;
        });
    }, [receivables, search, statusFilter]);

    const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated   = useMemo(() =>
        filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]);

    // Reset to page 1 on filter change
    useEffect(() => { setCurrentPage(1); }, [search, statusFilter, pageSize]);

    // ── STATUS FILTER OPTIONS ─────────────────────────────────────────────────
    const STATUS_FILTERS = [
        { value: 'all',      label: 'All Loans' },
        { value: 'paid',     label: 'Paid'      },
        { value: 'partial',  label: 'Partial'   },
        { value: 'unpaid',   label: 'Unpaid'    },
        { value: 'overdue',  label: 'Overdue'   },
    ];

    return (
        <AdminSidebarLayout>
            <Head title="Loans Receivable">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="min-h-screen bg-slate-50 dark:bg-[#080e0c] transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                    {/* ── PAGE HEADER ───────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-0.5">
                                Accounting
                            </p>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                                <PieChart className="h-6 w-6 text-emerald-500 shrink-0" />
                                Loans Receivable
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-white/40 mt-1">
                                Active loan portfolio — click any row to view its amortization schedule.
                            </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={fetchData}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={() => exportCSV(filtered)}
                                disabled={isLoading || filtered.length === 0}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* ── STAT CARDS ────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <StatCard label="Total Loans"    value={isLoading ? '—' : stats.totalLoans}                  sub="active records"   icon={Users}      color="emerald" />
                        <StatCard label="Total Principal" value={isLoading ? '—' : `₱${fmt(stats.totalPrincipal)}`}  sub="loan amounts"     icon={Wallet}     color="sky"     />
                        <StatCard label="Gross Receivable" value={isLoading ? '—' : `₱${fmt(stats.totalGross)}`}    sub="incl. interest"   icon={TrendingUp} color="violet"  />
                        <StatCard label="Overdue Loans"  value={isLoading ? '—' : stats.overdueCount}                sub="need attention"   icon={Clock}      color="amber"   />
                    </div>

                    {/* ── ERROR STATE ───────────────────────────────────────── */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold">Failed to load data</p>
                                <p className="text-xs mt-0.5 opacity-80">{error}</p>
                            </div>
                            <button
                                onClick={fetchData}
                                className="shrink-0 text-xs font-bold underline underline-offset-2"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* ── FILTERS & SEARCH ──────────────────────────────────── */}
                    <div className="bg-white dark:bg-[#111a16] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/30 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by borrower name or reference…"
                                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white/60 transition">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Status filter pills */}
                            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide items-center">
                                <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-white/30 shrink-0" />
                                {STATUS_FILTERS.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => setStatusFilter(f.value)}
                                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            statusFilter === f.value
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                                : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Page size */}
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-slate-400 dark:text-white/30 font-medium whitespace-nowrap">Show</span>
                                <select
                                    value={pageSize}
                                    onChange={e => setPageSize(Number(e.target.value))}
                                    className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white text-sm px-2.5 py-1.5 outline-none focus:border-emerald-500 transition cursor-pointer"
                                >
                                    {PAGE_SIZE_OPTIONS.map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Result count */}
                        {!isLoading && (
                            <p className="text-xs text-slate-400 dark:text-white/30 mt-3">
                                Showing <span className="font-bold text-slate-600 dark:text-white/60">{paginated.length}</span> of <span className="font-bold text-slate-600 dark:text-white/60">{filtered.length}</span> loans
                                {search && <> matching <span className="font-bold text-emerald-600 dark:text-emerald-400">"{search}"</span></>}
                            </p>
                        )}
                    </div>

                    {/* ── MAIN TABLE ────────────────────────────────────────── */}
                    <div className="bg-white dark:bg-[#111a16] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[700px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
                                        <th className="p-4 w-10" />
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">Reference</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">Borrower</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">Terms</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 text-right">Principal</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 text-right">Gross Amount</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 text-right">Billed Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">

                                    {/* LOADING SKELETON */}
                                    {isLoading && Array.from({ length: 6 }).map((_, i) => (
                                        <SkeletonRow key={i} />
                                    ))}

                                    {/* DATA ROWS */}
                                    {!isLoading && paginated.map(loan => {
                                        const isExpanded = expandedRows.includes(loan.id);
                                        const overdueCount = (loan.ledger ?? []).filter(r =>
                                            (r.status ?? '').toLowerCase() === 'overdue'
                                        ).length;

                                        return (
                                            <React.Fragment key={loan.id}>
                                                <tr
                                                    onClick={() => toggleRow(loan.id)}
                                                    className={`cursor-pointer transition-colors group ${
                                                        isExpanded
                                                            ? 'bg-emerald-50/60 dark:bg-emerald-500/[0.06]'
                                                            : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                                                    }`}
                                                >
                                                    <td className="p-4 text-slate-400 dark:text-white/30">
                                                        <div className={`h-6 w-6 rounded-lg grid place-items-center transition-colors ${
                                                            isExpanded
                                                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 group-hover:bg-slate-200 dark:group-hover:bg-white/10'
                                                        }`}>
                                                            {isExpanded
                                                                ? <ChevronDown className="h-3.5 w-3.5" />
                                                                : <ChevronRight className="h-3.5 w-3.5" />
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-mono text-xs text-slate-500 dark:text-white/40 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                                            {loan.loanReference}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 grid place-items-center text-white font-black text-xs shrink-0 shadow-sm">
                                                                {(loan.memberName ?? '?')[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white text-sm uppercase">
                                                                    {loan.memberName}
                                                                </p>
                                                                {overdueCount > 0 && (
                                                                    <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1">
                                                                        <AlertTriangle className="h-2.5 w-2.5" />
                                                                        {overdueCount} overdue payment{overdueCount > 1 ? 's' : ''}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 text-xs font-bold">
                                                            <Clock className="h-3 w-3" />
                                                            {loan.termMonths} Mos
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-sm text-slate-600 dark:text-white/70 font-semibold">
                                                        ₱{fmt(loan.loanAmount)}
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                        ₱{fmt(loan.gross)}
                                                    </td>
                                                    <td className="p-4 text-right text-xs text-slate-400 dark:text-white/30 font-medium">
                                                        {loan.billedAt}
                                                    </td>
                                                </tr>

                                                {/* ── EXPANDED LEDGER ────────────────────────── */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={7} className="p-0">
                                                            <div className="px-4 sm:px-6 pb-5 pt-1 bg-emerald-50/40 dark:bg-emerald-500/[0.04] border-b border-slate-100 dark:border-white/[0.06]">
                                                                <div className="bg-white dark:bg-[#0d1a14] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">

                                                                    {/* Ledger header */}
                                                                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
                                                                        <div className="flex items-center gap-2">
                                                                            <FileSpreadsheet className="h-4 w-4 text-sky-500" />
                                                                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                                                                                Amortization Schedule
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-white/30">
                                                                            <span className="font-mono">{loan.loanReference}</span>
                                                                            <span>{(loan.ledger ?? []).length} periods</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Ledger table — mobile scrollable */}
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-xs min-w-[580px]">
                                                                            <thead>
                                                                                <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                                                                                    {['#', 'Due Month', 'Amortization', 'Principal', 'Interest', 'Balance', 'Status'].map((h, i) => (
                                                                                        <th key={i} className={`px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/25 ${i > 1 ? 'text-right' : i === 0 ? 'text-center' : ''}`}>
                                                                                            {h}
                                                                                        </th>
                                                                                    ))}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                                                                                {(loan.ledger ?? []).map(row => (
                                                                                    <tr key={row.period} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                                                                        <td className="px-3 py-2.5 text-center font-mono text-slate-400 dark:text-white/25 font-bold">
                                                                                            {row.period}
                                                                                        </td>
                                                                                        <td className="px-3 py-2.5 font-bold text-slate-700 dark:text-white/80 uppercase text-[11px]">
                                                                                            {row.dueDate}
                                                                                        </td>
                                                                                        <td className="px-3 py-2.5 text-right font-mono text-sky-600 dark:text-sky-400 font-semibold">
                                                                                            {fmt(row.installment)}
                                                                                        </td>
                                                                                        <td className="px-3 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                                                                            {fmt(row.principal)}
                                                                                        </td>
                                                                                        <td className="px-3 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                                                                                            {fmt(row.interest)}
                                                                                        </td>
                                                                                        <td className="px-3 py-2.5 text-right font-mono font-black text-slate-800 dark:text-white/90">
                                                                                            {fmt(row.balance)}
                                                                                        </td>
                                                                                        <td className="px-3 py-2.5 text-center">
                                                                                            <StatusBadge row={row} />
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>

                                                                            {/* Ledger summary footer */}
                                                                            {(loan.ledger ?? []).length > 0 && (() => {
                                                                                const totals = (loan.ledger ?? []).reduce((acc, r) => ({
                                                                                    installment: acc.installment + Number(r.installment ?? 0),
                                                                                    principal:   acc.principal   + Number(r.principal   ?? 0),
                                                                                    interest:    acc.interest    + Number(r.interest    ?? 0),
                                                                                }), { installment: 0, principal: 0, interest: 0 });
                                                                                return (
                                                                                    <tfoot>
                                                                                        <tr className="bg-slate-50 dark:bg-white/[0.03] border-t-2 border-slate-200 dark:border-white/10">
                                                                                            <td colSpan={2} className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                                                                                                Totals
                                                                                            </td>
                                                                                            <td className="px-3 py-2.5 text-right font-mono font-black text-sky-700 dark:text-sky-300 text-xs">
                                                                                                {fmt(totals.installment)}
                                                                                            </td>
                                                                                            <td className="px-3 py-2.5 text-right font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs">
                                                                                                {fmt(totals.principal)}
                                                                                            </td>
                                                                                            <td className="px-3 py-2.5 text-right font-mono font-black text-amber-700 dark:text-amber-300 text-xs">
                                                                                                {fmt(totals.interest)}
                                                                                            </td>
                                                                                            <td colSpan={2} />
                                                                                        </tr>
                                                                                    </tfoot>
                                                                                );
                                                                            })()}
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}

                                    {/* EMPTY STATE */}
                                    {!isLoading && !error && paginated.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center">
                                                <div className="inline-flex flex-col items-center gap-3">
                                                    <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 grid place-items-center">
                                                        <PieChart className="h-7 w-7 text-slate-300 dark:text-white/20" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-500 dark:text-white/40">
                                                            {search || statusFilter !== 'all' ? 'No loans match your filters' : 'No loans receivable found'}
                                                        </p>
                                                        <p className="text-xs text-slate-400 dark:text-white/25 mt-1">
                                                            {search || statusFilter !== 'all'
                                                                ? 'Try adjusting your search or filter.'
                                                                : 'Active loans will appear here once billed.'}
                                                        </p>
                                                    </div>
                                                    {(search || statusFilter !== 'all') && (
                                                        <button
                                                            onClick={() => { setSearch(''); setStatusFilter('all'); }}
                                                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                                        >
                                                            Clear filters
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── PAGINATION ────────────────────────────────────── */}
                        {!isLoading && totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                <p className="text-xs text-slate-400 dark:text-white/30 font-medium order-2 sm:order-1">
                                    Page <span className="font-bold text-slate-600 dark:text-white/60">{currentPage}</span> of <span className="font-bold text-slate-600 dark:text-white/60">{totalPages}</span>
                                </p>
                                <div className="flex items-center gap-1.5 order-1 sm:order-2">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-bold"
                                    >
                                        First
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Page number pills */}
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const offset = Math.min(Math.max(currentPage - 3, 0), totalPages - 5);
                                        const page   = i + 1 + offset;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                                                    page === currentPage
                                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                                        : 'border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-bold"
                                    >
                                        Last
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminSidebarLayout>
    );
}