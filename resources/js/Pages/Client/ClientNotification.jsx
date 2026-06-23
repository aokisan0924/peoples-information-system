import { useEffect, useState, useCallback } from "react";
import { Head, Link } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import {
    Bell, CheckCircle2, Clock, AlertCircle, Info, FileWarning,
    Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Filter, BellOff, RefreshCw, CreditCard, Landmark, PiggyBank,
    Banknote, ShieldCheck, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import SidebarLayout from "@/Layouts/SidebarLayout";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";

// ─── NOTIFICATION TYPE → icon + color ────────────────────────────────────────
const TYPE_CONFIG = {
    loan:        { icon: Landmark,      color: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",    label: "Loan"        },
    savings:     { icon: PiggyBank,     color: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",            label: "Savings"     },
    shareCapital:{ icon: Banknote,      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400", label: "Share Capital"},
    payment:     { icon: CreditCard,    color: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400", label: "Payment"     },
    security:    { icon: ShieldCheck,   color: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",        label: "Security"    },
    alert:       { icon: AlertCircle,   color: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",        label: "Alert"       },
    info:        { icon: Info,          color: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",        label: "Info"        },
    warning:     { icon: FileWarning,   color: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",label: "Warning"     },
    general:     { icon: Bell,          color: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50",        label: "General"     },
};

function getTypeConfig(type) {
    return TYPE_CONFIG[type] || TYPE_CONFIG.general;
}

// ─── FILTER TABS ──────────────────────────────────────────────────────────────
const STATUS_TABS = [
    { value: "all",    label: "All"    },
    { value: "unread", label: "Unread" },
    { value: "read",   label: "Read"   },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function ClientNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [meta,          setMeta]          = useState({ currentPage: 1, perPage: 10, lastPage: 1, total: 0, unreadCount: 0 });
    const [statusFilter,  setStatusFilter]  = useState("all");
    const [typeFilter,    setTypeFilter]    = useState("all");
    const [perPage,       setPerPage]       = useState(10);
    const [isLoading,     setIsLoading]     = useState(false);
    const [expandedId,    setExpandedId]    = useState(null);

    const fetchNotifications = useCallback(async (page = 1, overrides = {}) => {
        setIsLoading(true);
        try {
            const params = {
                page,
                status:  overrides.status  ?? statusFilter,
                type:    overrides.type    ?? typeFilter,
                perPage: overrides.perPage ?? perPage,
            };
            const { data } = await axios.get("/client/notifications/list", { params });
            setNotifications(data.data || []);
            setMeta(data.meta || meta);
        } catch {
            toast.error("Failed to load notifications.");
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, typeFilter, perPage]);

    useEffect(() => { fetchNotifications(1); }, []);

    // Re-fetch when filters change
    const applyStatusFilter = (val) => {
        setStatusFilter(val);
        fetchNotifications(1, { status: val });
    };

    const applyTypeFilter = (val) => {
        setTypeFilter(val);
        fetchNotifications(1, { type: val });
    };

    const applyPerPage = (val) => {
        const n = Number(val);
        setPerPage(n);
        fetchNotifications(1, { perPage: n });
    };

    const handleMarkAsRead = async (id) => {
        try {
            const { data } = await axios.post(`/client/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            // Update unread count from server response
            if (data.unreadCount !== undefined) {
                setMeta(prev => ({ ...prev, unreadCount: data.unreadCount }));
            }
        } catch {
            toast.error("Failed to mark as read.");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const { data } = await axios.post("/client/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setMeta(prev => ({ ...prev, unreadCount: 0 }));
            toast.success(data.message || "All notifications marked as read.");
        } catch {
            toast.error("Failed to mark all as read.");
        }
    };

    const unreadCount = meta.unreadCount ?? notifications.filter(n => !n.isRead).length;
    const hasUnread   = unreadCount > 0;

    const inputCls = "px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition appearance-none cursor-pointer dark:[color-scheme:dark]";

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Notifications">
                    <link rel="icon" href="/images/logo/pis_logo.png" />
                </Head>

                <div className="space-y-4 sm:space-y-5 pb-10">

                    {/* ── HEADER ──────────────────────────────────────────── */}
                    <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-sm">
                        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="relative shrink-0">
                                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow-lg shadow-emerald-500/25">
                                        <Bell className="h-5 w-5 text-white" />
                                    </div>
                                    {hasUnread && (
                                        <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-500 text-white text-[9px] font-black grid place-items-center border-2 border-white dark:border-[#0a1510]">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
                                    <p className="text-xs sm:text-sm text-slate-400 dark:text-white/40 font-medium mt-0.5">
                                        {hasUnread
                                            ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{unreadCount} unread</span>
                                            : "All caught up"
                                        } · {meta.total} total
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={() => fetchNotifications(meta.currentPage)}
                                    className="h-9 w-9 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/10 transition active:scale-95"
                                    title="Refresh"
                                >
                                    <RefreshCw size={15} className="text-current" />
                                </button>
                                {hasUnread && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition active:scale-95"
                                    >
                                        <CheckCircle2 size={15} className="text-current" />
                                        <span className="hidden xs:inline">Mark all read</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── FILTERS ─────────────────────────────────────────── */}
                    <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

                            {/* Status tabs */}
                            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/[0.05] rounded-xl">
                                {STATUS_TABS.map(tab => (
                                    <button
                                        key={tab.value}
                                        onClick={() => applyStatusFilter(tab.value)}
                                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                            statusFilter === tab.value
                                                ? "bg-white dark:bg-white/10 text-emerald-700 dark:text-emerald-400 shadow-sm"
                                                : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70"
                                        }`}
                                    >
                                        {tab.label}
                                        {tab.value === "unread" && hasUnread && (
                                            <span className="h-4 w-4 rounded-full bg-rose-500 text-white text-[8px] font-black grid place-items-center">
                                                {unreadCount > 9 ? "9+" : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Type + per-page */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <select
                                    value={typeFilter}
                                    onChange={e => applyTypeFilter(e.target.value)}
                                    className={`flex-1 sm:flex-none ${inputCls}`}
                                >
                                    <option value="all">All Types</option>
                                    {Object.entries(TYPE_CONFIG).filter(([k]) => k !== "general").map(([key, cfg]) => (
                                        <option key={key} value={key}>{cfg.label}</option>
                                    ))}
                                </select>
                                <select
                                    value={perPage}
                                    onChange={e => applyPerPage(e.target.value)}
                                    className={inputCls}
                                >
                                    {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── NOTIFICATION LIST ────────────────────────────────── */}
                    <div className="bg-white dark:bg-[#0a1510] border border-slate-200 dark:border-white/[0.07] rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">

                        {isLoading ? (
                            <div className="py-24 flex flex-col items-center gap-3">
                                <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
                                <p className="text-sm font-medium text-slate-400 dark:text-white/30">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-24 flex flex-col items-center gap-4 text-slate-300 dark:text-white/20">
                                <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-white/5 grid place-items-center">
                                    <BellOff size={28} className="opacity-50" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-slate-500 dark:text-white/40">
                                        {statusFilter === "unread" ? "No unread notifications" : "No notifications found"}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-white/25 mt-1">
                                        {statusFilter !== "all"
                                            ? <button onClick={() => applyStatusFilter("all")} className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">View all notifications</button>
                                            : "You're all caught up!"
                                        }
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                                <AnimatePresence initial={false}>
                                    {notifications.map((n, idx) => {
                                        const cfg       = getTypeConfig(n.type);
                                        const Icon      = cfg.icon;
                                        const isExpanded = expandedId === n.id;

                                        return (
                                            <motion.li
                                                key={n.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03, duration: 0.18 }}
                                                className={`relative transition-colors ${
                                                    !n.isRead
                                                        ? "bg-emerald-50/40 dark:bg-emerald-500/[0.04]"
                                                        : "bg-white dark:bg-transparent"
                                                } hover:bg-slate-50/70 dark:hover:bg-white/[0.025]`}
                                            >
                                                {/* Unread left accent bar */}
                                                {!n.isRead && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 rounded-r" />
                                                )}

                                                <div className="px-4 sm:px-6 py-4">
                                                    <div className="flex items-start gap-3 sm:gap-4">

                                                        {/* Type icon */}
                                                        <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-2xl grid place-items-center shrink-0 ${cfg.color}`}>
                                                            <Icon size={18} className="text-current" />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <h3 className={`text-sm leading-tight ${
                                                                            n.isRead
                                                                                ? "font-semibold text-slate-700 dark:text-white/70"
                                                                                : "font-bold text-slate-900 dark:text-white"
                                                                        }`}>{n.title}</h3>
                                                                        {!n.isRead && (
                                                                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                                                        )}
                                                                        {/* Type badge — mobile hidden */}
                                                                        <span className={`hidden sm:inline-flex text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.color}`}>
                                                                            {cfg.label}
                                                                        </span>
                                                                    </div>

                                                                    {/* Message — collapsible on mobile */}
                                                                    <p className={`text-sm text-slate-500 dark:text-white/55 mt-1 leading-relaxed ${
                                                                        !isExpanded ? "line-clamp-2" : ""
                                                                    }`}>
                                                                        {n.message}
                                                                    </p>

                                                                    {n.message?.length > 120 && (
                                                                        <button
                                                                            onClick={() => setExpandedId(isExpanded ? null : n.id)}
                                                                            className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold hover:underline"
                                                                        >
                                                                            {isExpanded ? "Show less" : "Read more"}
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Timestamp + read button */}
                                                                <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
                                                                    <span className="text-[10px] text-slate-400 dark:text-white/30 font-medium whitespace-nowrap">
                                                                        {n.createdAgo}
                                                                    </span>
                                                                    {!n.isRead && (
                                                                        <button
                                                                            onClick={() => handleMarkAsRead(n.id)}
                                                                            title="Mark as read"
                                                                            className="h-6 w-6 grid place-items-center rounded-lg bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                                                                        >
                                                                            <CheckCircle2 size={13} className="text-current" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Footer: date + optional link */}
                                                            <div className="flex items-center justify-between gap-3 mt-2.5">
                                                                <span className="text-[10px] text-slate-400 dark:text-white/25 font-medium">
                                                                    {n.date} · {n.time}
                                                                </span>
                                                                {n.linkUrl && (
                                                                    <Link
                                                                        href={n.linkUrl}
                                                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                                                    >
                                                                        View details
                                                                        <ChevronRight size={11} className="text-current" />
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.li>
                                        );
                                    })}
                                </AnimatePresence>
                            </ul>
                        )}

                        {/* ── PAGINATION ──────────────────────────────────── */}
                        {!isLoading && meta.lastPage >= 1 && notifications.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                                <p className="text-xs font-medium text-slate-400 dark:text-white/30">
                                    Page <span className="font-bold text-emerald-600 dark:text-emerald-400">{meta.currentPage}</span> of {meta.lastPage} · {meta.total} notifications
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => fetchNotifications(1)} disabled={meta.currentPage <= 1}
                                        className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                        <ChevronsLeft size={14} className="text-current" />
                                    </button>
                                    <button onClick={() => fetchNotifications(meta.currentPage - 1)} disabled={meta.currentPage <= 1}
                                        className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                        <ChevronLeft size={14} className="text-current" />
                                    </button>
                                    <button onClick={() => fetchNotifications(meta.currentPage + 1)} disabled={meta.currentPage >= meta.lastPage}
                                        className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                        <ChevronRight size={14} className="text-current" />
                                    </button>
                                    <button onClick={() => fetchNotifications(meta.lastPage)} disabled={meta.currentPage >= meta.lastPage}
                                        className="h-8 w-8 grid place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                        <ChevronsRight size={14} className="text-current" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </PaymentReminderLayout>
        </SidebarLayout>
    );
}