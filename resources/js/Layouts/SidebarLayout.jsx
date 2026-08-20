import { useState, useEffect, useRef } from "react";
import {
    User, FileText, Bell, Key, LogOut, LayoutDashboard,
    History as HistoryIcon, PiggyBank, Hourglass,
    Banknote, MoreHorizontal, Sun, Moon, Calendar,
    ChevronRight, X, Lock, CheckCheck, AlertCircle,
    Info, Loader2, Eye, EyeOff
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
    {
        label: "Main",
        items: [{ name: "Dashboard", icon: LayoutDashboard, routeName: "member.dashboard" }],
    },
    {
        label: "Account",
        items: [
            { name: "My Profile", icon: User, routeName: "member.show" },
            { name: "Transaction History",  icon: HistoryIcon,  routeName: "member.transactions.index" },
        ],
    },
    {
        label: "Finances",
        items: [
            { name: "Loan Application", icon: FileText,  routeName: "member.loans.index" },
            { name: "Amortization Schedule", icon: Calendar, routeName: "member.loans.schedule" },
            { name: "Share Capital", icon: Banknote,  routeName: "member.share-capital-data" },
            { name: "Savings Deposit", icon: PiggyBank, routeName: "member.savings.index" },
            { name: "Time Deposit", icon: Hourglass, routeName: "member.time-deposit" },
        ],
    },
];

const BOTTOM_NAV_PRIMARY = [
    { name: "Home", icon: LayoutDashboard, routeName: "member.dashboard" },
    { name: "Loans", icon: FileText, routeName: "member.loans.index" },
    { name: "Savings", icon: PiggyBank, routeName: "member.savings.index" },
    { name: "Profile", icon: User, routeName: "member.show" },
];

const BOTTOM_NAV_SECONDARY = [
    { name: "Amortization", icon: Calendar, routeName: "member.loans.schedule"},
    { name: "Share Capital", icon: Banknote, routeName: "member.share-capital-data"},
    { name: "Time Deposit", icon: Hourglass, routeName: "member.time-deposit" },
    { name: "Transaction History",icon: HistoryIcon,  routeName: "member.transactions.index"},
];

// ─── NOTIFICATION TYPE CONFIG ─────────────────────────────────────────────────
const notifConfig = (type) => {
    switch ((type || "").toLowerCase()) {
        case "success":  return { icon: CheckCheck, cls: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/40" };
        case "warning":  return { icon: AlertCircle, cls: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/40"     };
        case "error": return { icon: AlertCircle, cls: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/40"        };
        default: return { icon: Info, cls: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-900/40"          };
    }
};

// ═════════════════════════════════════════════════════════════════════════════
export default function SidebarLayout({ children }) {
    const { url, props } = usePage();
    const auth = props.auth || {};
    const memberSource = auth.member || auth.user || {};
    const unreadCount = props.memberUnreadNotificationCount || 0;
    const pisVersion = props.pisVersion || "2.0.0";

    // ── LIVE CLOCK ────────────────────────────────────────────────────────────
    const [clock, setClock] = useState({ day: "", date: "", time: "" });
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setClock({
                day:  now.toLocaleDateString("en-PH", { weekday: "long" }),
                date: now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "2-digit" }),
                time: now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
            });
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, []);

    // ── DARK MODE ─────────────────────────────────────────────────────────────
    const [isDark, setIsDark] = useState(() => {
        if (typeof window === "undefined") return false;
        const saved = localStorage.getItem("theme");
        return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    });
    useEffect(() => {
        document.documentElement.classList.toggle("dark",  isDark);
        document.documentElement.classList.toggle("light", !isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }, [isDark]);

    // ── MENU STATE ────────────────────────────────────────────────────────────
    const [menus, setMenus] = useState({ profile: false, notification: false, more: false });
    const toggle = (key, val = null) => setMenus(p => ({ ...p, [key]: val !== null ? val : !p[key] }));

    const profileRef = useRef(null);
    const notifRef = useRef(null);

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
    const [notifs, setNotifs] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifFetched,   setNotifFetched]   = useState(false);

    const fetchNotifs = async () => {
        if (notifFetched) return;
        setNotifLoading(true);
        try {
            const { data } = await axios.get("/client/notifications/list", { params: { preview: true } });
            setNotifs(data || []);
            setNotifFetched(true);
        } catch {
            toast.error("Unable to load notifications.");
        } finally {
            setNotifLoading(false);
        }
    };

    const handleToggleNotif = () => {
        const next = !menus.notification;
        toggle("notification", next);
        if (next) fetchNotifs();
    };

    // ── CLICK OUTSIDE ─────────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (menus.profile && !profileRef.current?.contains(e.target)) toggle("profile", false);
            if (menus.notification && !notifRef.current?.contains(e.target)) toggle("notification", false);
            if (menus.more && !e.target.closest("#more-sheet") && !e.target.closest("#more-btn")) toggle("more", false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menus]);

    // ── PASSWORD MODAL ────────────────────────────────────────────────────────
    const [pwModal, setPwModal] = useState(false);

    // ── DERIVED ───────────────────────────────────────────────────────────────
    const displayName  = `${memberSource.firstName || ""} ${memberSource.lastName || ""}`.trim() || memberSource.username || "Member";
    const initials = displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const photoSrc = memberSource.profileImage ? route("member.showProfilePhoto") : null;
    const isActive = (r) => typeof route !== "undefined" && route().current ? route().current(r) : url.startsWith(r);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(16,185,129,0.22),transparent_45%),radial-gradient(900px_circle_at_80%_0%,rgba(34,197,94,0.15),transparent_42%),linear-gradient(135deg,#04130e,#050b12_45%,#04130e)] dark:text-slate-100 transition-colors duration-300">
            <div className="flex min-h-screen">

                {/* ╔══════════════════════════════╗
                    ║         SIDEBAR              ║
                    ╚══════════════════════════════╝ */}
                <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-64 flex-col border-r border-slate-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] shadow-sm transition-colors duration-300">

                    {/* Logo */}
                    <div className="flex items-center gap-3 px-5 py-[18px] border-b border-slate-200 dark:border-[#1f2937] shrink-0">
                        <div className="h-9 w-9 rounded-xl bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-[#374151] flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                            <img src="/images/logo/pis_logo.png" alt="PMPC" className="h-full w-full object-contain" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Client Portal</p>
                            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">PMPC System</p>
                        </div>
                    </div>

                    {/* Member card */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1f2937] shrink-0">
                        <div className="flex items-center gap-3">
                            <Avatar src={photoSrc} initials={initials} size={9} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                                <p className="text-[10px] text-slate-400 dark:text-[#6b7280] truncate">Member Account</p>
                            </div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-hide">
                        {NAV_SECTIONS.map(section => (
                            <div key={section.label}>
                                <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-[#4b5563] select-none">
                                    {section.label}
                                </p>
                                <div className="space-y-0.5">
                                    {section.items.map(item => (
                                        <NavItem key={item.name} item={item} isActive={isActive(item.routeName)} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Sidebar footer */}
                    <div className="shrink-0 px-4 py-3 border-t border-slate-100 dark:border-[#1f2937]">
                        <p className="text-[10px] text-slate-400 dark:text-[#4b5563] text-center font-medium tracking-widest uppercase">
                            PIS v{pisVersion}
                        </p>
                    </div>
                </aside>

                {/* ╔══════════════════════════════╗
                    ║       MAIN CONTENT           ║
                    ╚══════════════════════════════╝ */}
                <div className="flex-1 flex flex-col min-h-screen md:ml-64">

                    {/* ── TOPBAR ─────────────────────────────────────────── */}
                    <nav className="fixed top-0 left-0 right-0 md:left-64 z-50 h-14 flex items-center justify-between px-4 sm:px-5 border-b border-slate-200 dark:border-[#1f2937] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl shadow-sm transition-colors duration-300">

                        {/* Left — live clock */}
                        <div className="hidden sm:flex flex-col leading-tight">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{clock.day || "—"}</span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-[#6b7280]">
                                <span>{clock.date || "—"}</span>
                                <span>·</span>
                                <span className="font-mono">{clock.time || "--:--:--"}</span>
                            </div>
                        </div>
                        {/* Mobile: logo text */}
                        <div className="sm:hidden flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg border border-slate-200 dark:border-[#374151] overflow-hidden">
                                <img src="/images/logo/pis_logo.png" alt="PMPC" className="h-full w-full object-contain" />
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Client Portal</span>
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-1.5 sm:gap-2">

                            {/* Theme toggle */}
                            <button
                                onClick={() => setIsDark(p => !p)}
                                className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 dark:border-[#374151] bg-white dark:bg-[#1f2937] text-slate-500 dark:text-[#9ca3af] hover:bg-slate-50 dark:hover:bg-[#374151] transition"
                                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                                aria-pressed={isDark}
                                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                            >
                                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                            </button>

                            {/* Notifications */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={handleToggleNotif}
                                    className="relative h-8 w-8 grid place-items-center rounded-lg border border-slate-200 dark:border-[#374151] bg-white dark:bg-[#1f2937] text-slate-500 dark:text-[#9ca3af] hover:bg-slate-50 dark:hover:bg-[#374151] transition"
                                >
                                    <Bell size={14} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#111827]">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {menus.notification && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.96, y: -6 }}
                                            animate={{ opacity: 1, scale: 1,    y: 0  }}
                                            exit={{   opacity: 0, scale: 0.96, y: -6  }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] z-50 rounded-2xl border border-slate-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
                                        >
                                            {/* Header */}
                                            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-[#1f2937]">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Notifications</p>
                                                    <p className="text-[11px] text-slate-400 dark:text-[#6b7280] mt-0.5">Latest updates on your account</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {unreadCount > 0 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                                            {unreadCount} unread
                                                        </span>
                                                    )}
                                                    <button onClick={() => toggle("notification", false)} className="h-6 w-6 grid place-items-center rounded-lg text-slate-400 dark:text-[#6b7280] hover:bg-slate-100 dark:hover:bg-[#1f2937] transition">
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div className="max-h-72 overflow-y-auto">
                                                {notifLoading ? (
                                                    <div className="p-4 space-y-2.5">
                                                        {[1,2,3].map(i => (
                                                            <div key={i} className="flex gap-3 items-start">
                                                                <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-[#1f2937] animate-pulse shrink-0" />
                                                                <div className="flex-1 space-y-1.5">
                                                                    <div className="h-3 bg-slate-100 dark:bg-[#1f2937] rounded animate-pulse w-3/4" />
                                                                    <div className="h-2.5 bg-slate-100 dark:bg-[#1f2937] rounded animate-pulse w-full" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : notifs.length === 0 ? (
                                                    <div className="py-10 flex flex-col items-center gap-2 text-center px-4">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-[#1f2937] grid place-items-center">
                                                            <Bell size={18} className="text-slate-300 dark:text-[#4b5563]" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-slate-500 dark:text-[#6b7280]">All caught up!</p>
                                                        <p className="text-xs text-slate-400 dark:text-[#4b5563]">No new notifications right now.</p>
                                                    </div>
                                                ) : (
                                                    <ul>
                                                        {notifs.map((n, idx) => {
                                                            const cfg = notifConfig(n.type);
                                                            const Icon = cfg.icon;
                                                            return (
                                                                <li key={n.id ?? idx} className={`flex gap-3 px-4 py-3 border-b border-slate-50 dark:border-[#1f2937] last:border-0 transition-colors ${n.isRead ? "bg-white dark:bg-transparent" : "bg-emerald-50/60 dark:bg-emerald-900/10"}`}>
                                                                    {/* Type icon */}
                                                                    <div className={`h-8 w-8 rounded-xl grid place-items-center shrink-0 mt-0.5 ${cfg.bg}`}>
                                                                        <Icon size={14} className={cfg.cls} />
                                                                    </div>
                                                                    {/* Text */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{n.title}</p>
                                                                            {!n.isRead && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1" />}
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-500 dark:text-[#9ca3af] line-clamp-2 mt-0.5">{n.message}</p>
                                                                        <div className="flex items-center justify-between mt-1.5 gap-2">
                                                                            <span className="text-[10px] text-slate-400 dark:text-[#6b7280]">{n.createdAgo}</span>
                                                                            {n.linkUrl && (
                                                                                <a href={n.linkUrl} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
                                                                                    View <ChevronRight size={10} />
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                )}
                                            </div>

                                            {/* Footer */}
                                            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-[#1f2937] flex items-center justify-between bg-slate-50/50 dark:bg-[#1f2937]/40">
                                                <span className="text-[11px] text-slate-400 dark:text-[#6b7280]">Notification history</span>
                                                <Link href={route("member.notifications.index")} onClick={() => toggle("notification", false)} className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
                                                    View all <ChevronRight size={10} />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Divider */}
                            <div className="h-5 w-px bg-slate-200 dark:bg-[#1f2937] mx-0.5" />

                            {/* Profile dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => toggle("profile")}
                                    className="flex items-center gap-2 rounded-xl pl-1 pr-2 py-1 hover:bg-slate-100 dark:hover:bg-[#1f2937] transition"
                                >
                                    <Avatar src={photoSrc} initials={initials} size={7} />
                                    <span className="hidden sm:block text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">{displayName.split(" ")[0]}</span>
                                </button>

                                <AnimatePresence>
                                    {menus.profile && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.96, y: -6 }}
                                            animate={{ opacity: 1, scale: 1,    y: 0  }}
                                            exit={{   opacity: 0, scale: 0.96, y: -6  }}
                                            transition={{ duration: 0.13, ease: "easeOut" }}
                                            className="absolute right-0 mt-2 w-56 z-50 rounded-2xl overflow-hidden bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                                        >
                                            {/* User info */}
                                            <div className="px-4 py-3.5 border-b border-slate-100 dark:border-[#1f2937] bg-slate-50 dark:bg-[#1f2937]">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={photoSrc} initials={initials} size={9} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                                                        <p className="text-[11px] text-slate-400 dark:text-[#6b7280]">Member</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-1.5">
                                                <DropdownLink href={route("member.show")} icon={User} label="My Profile" onClick={() => toggle("profile", false)} />
                                                <button
                                                    onClick={() => { toggle("profile", false); setPwModal(true); }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-slate-600 dark:text-[#9ca3af] hover:bg-slate-50 dark:hover:bg-[#374151] hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                                                >
                                                    <Lock size={14} className="text-slate-400 dark:text-[#6b7280] shrink-0" />
                                                    Update Password
                                                </button>
                                            </div>

                                            <div className="p-1.5 border-t border-slate-100 dark:border-[#1f2937]">
                                                <Link
                                                    href={route("member.logout")} method="post" as="button"
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                >
                                                    <LogOut size={14} className="shrink-0" />
                                                    Sign out
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </nav>

                    {/* Page content */}
                    <main className="flex-1 w-full pt-14 pb-20 md:pb-0">
                        <div className="max-w-7xl mx-auto px-4 py-5 md:px-6 md:py-6">
                            {children}
                        </div>
                    </main>

                    {/* ── MOBILE BOTTOM NAV ───────────────────────────────── */}
                    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-200 dark:border-[#1f2937] bg-white/97 dark:bg-[#111827]/97 backdrop-blur-xl">
                        <div className="flex items-stretch">
                            {BOTTOM_NAV_PRIMARY.map(item => (
                                <BottomNavItem key={item.name} item={item} isActive={isActive(item.routeName)} onClick={() => toggle("more", false)} />
                            ))}
                            <button
                                id="more-btn"
                                onClick={() => toggle("more")}
                                className={`flex flex-col items-center justify-center flex-1 py-2 gap-1 text-[10px] font-semibold transition-colors ${menus.more ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-[#6b7280]"}`}
                            >
                                <MoreHorizontal size={19} />
                                <span>More</span>
                            </button>
                        </div>

                        {/* More sheet */}
                        <AnimatePresence>
                            {menus.more && (
                                <>
                                    {/* Backdrop */}
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                                        onClick={() => toggle("more", false)}
                                    />
                                    <motion.div
                                        id="more-sheet"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{   opacity: 0, y: 12 }}
                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                        className="absolute bottom-[calc(100%+8px)] left-3 right-3 z-50"
                                    >
                                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] shadow-2xl">
                                            <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1f2937] flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">More</p>
                                                    <p className="text-[11px] text-slate-400 dark:text-[#6b7280]">Access other modules</p>
                                                </div>
                                                <button onClick={() => toggle("more", false)} className="h-7 w-7 grid place-items-center rounded-lg bg-slate-100 dark:bg-[#1f2937] text-slate-400">
                                                    <X size={13} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1 p-2">
                                                {BOTTOM_NAV_SECONDARY.map(item => {
                                                    const active = isActive(item.routeName);
                                                    const Icon   = item.icon;
                                                    return (
                                                        <Link
                                                            key={item.name}
                                                            href={route(item.routeName)}
                                                            onClick={() => toggle("more", false)}
                                                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                                                active
                                                                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                                                    : "text-slate-600 dark:text-[#9ca3af] hover:bg-slate-50 dark:hover:bg-[#1f2937]"
                                                            }`}
                                                        >
                                                            <span className={`h-7 w-7 grid place-items-center rounded-lg shrink-0 ${active ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-[#1f2937] text-slate-500 dark:text-[#6b7280]"}`}>
                                                                <Icon size={14} />
                                                            </span>
                                                            <span className="truncate">{item.name}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>

                                            {/* Quick actions inside More sheet */}
                                            <div className="border-t border-slate-100 dark:border-[#1f2937] p-2 flex gap-1.5">
                                                <button
                                                    onClick={() => { toggle("more", false); setPwModal(true); }}
                                                    className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-[#9ca3af] hover:bg-slate-50 dark:hover:bg-[#1f2937] transition-colors"
                                                >
                                                    <Lock size={14} className="text-slate-400 dark:text-[#6b7280] shrink-0" />
                                                    Update Password
                                                </button>
                                                <Link
                                                    href={route("member.logout")} method="post" as="button"
                                                    className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                >
                                                    <LogOut size={14} className="shrink-0" />
                                                    Sign out
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── PASSWORD MODAL ─────────────────────────────────────────── */}
            <AnimatePresence>
                {pwModal && <PasswordModal onClose={() => setPwModal(false)} />}
            </AnimatePresence>
        </div>
    );
}

// ─── PASSWORD MODAL ───────────────────────────────────────────────────────────
function PasswordModal({ onClose }) {
    const [step, setStep] = useState(1); // Step 1: Current PW, Step 2: OTP + New PW
    const [form, setForm] = useState({ current: "", otpCode: "", password: "", confirm: "" });
    const [show, setShow] = useState({ current: false, password: false, confirm: false });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [mounted, setMounted] = useState(false);
    
    // Store data returned from Step 1
    const [otpContext, setOtpContext] = useState({ token: null, mask: null });

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = "hidden";
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
        };
    }, []);

    // ─── STEP 1: VERIFY CURRENT PASSWORD & SEND OTP ───
    const handleRequestOtp = async () => {
        setErrors({});
        if (!form.current) return setErrors({ current: "Current password is required." });

        setSaving(true);
        try {
            // This route calls 'sendOtp' in MemberChangePasswordController
            const { data } = await axios.post(route("member.update-password"), {
                current_password: form.current,
            });
            
            if (data?.success) {
                setOtpContext({ token: data.otpToken, mask: data.destinationMask });
                toast.success(data.message, { duration: 4000 });
                setStep(2); // Move to OTP input screen
            }
        } catch (error) {
            const resp = error?.response?.data;
            if (resp?.errors?.current_password) {
                setErrors({ current: resp.errors.current_password[0] });
            } else {
                toast.error(resp?.message || "Verification failed. Please check your password.");
            }
        } finally {
            setSaving(false);
        }
    };

    // ─── STEP 2: VERIFY OTP & APPLY NEW PASSWORD ───
    const handleVerifyAndChange = async () => {
        setErrors({});
        if (form.otpCode.length !== 6) return setErrors({ otpCode: "Please enter the 6-digit code." });
        if (form.password.length < 8)  return setErrors({ password: "Password must be at least 8 characters." });
        if (form.password !== form.confirm) return setErrors({ confirm: "Passwords do not match." });

        setSaving(true);
        try {
            // This route calls 'verifyAndChange' in MemberChangePasswordController
            const { data } = await axios.post(route("member.settings.change-password.verify"), {
                otpToken: otpContext.token,
                otpCode: form.otpCode,
                password: form.password,
                password_confirmation: form.confirm,
            });
            
            if (data?.success) {
                toast.success(data.message);
                onClose(); // Close modal on complete success
            }
        } catch (error) {
            const resp = error?.response?.data;
            if (resp?.errors) {
                const mapped = {};
                if (resp.errors.otpCode) mapped.otpCode = resp.errors.otpCode[0];
                if (resp.errors.password) mapped.password = resp.errors.password[0];
                setErrors(mapped);
            } else {
                toast.error(resp?.message || "Failed to verify OTP or update password.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                className="relative w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1f2937] shadow-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.96, y: -12 }}
                animate={{ opacity: 1, scale: 1,    y: 0   }}
                exit={{   opacity: 0, scale: 0.96, y: -12  }}
                transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
                {/* Top accent */}
                <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#1f2937]">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 grid place-items-center">
                            <Lock size={16} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {step === 1 ? "Security Check" : "Set New Password"}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-[#6b7280]">
                                {step === 1 ? "Verify current password to continue" : `Code sent to ${otpContext.mask}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded-xl bg-slate-100 dark:bg-[#1f2937] text-slate-500 hover:bg-slate-200 transition">
                        <X size={14} />
                    </button>
                </div>

                {/* Form Fields */}
                <div className="px-5 py-5 space-y-4">
                    {step === 1 ? (
                        <>
                            <PwField
                                label="Current Password"
                                value={form.current}
                                show={show.current}
                                error={errors.current}
                                onChange={v => setForm(p => ({ ...p, current: v }))}
                                onToggle={() => setShow(p => ({ ...p, current: !p.current }))}
                                placeholder="Enter current password"
                            />
                        </>
                    ) : (
                        <>
                            {/* OTP FIELD */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">6-Digit Verification Code</label>
                                <input
                                    type="text"
                                    maxLength="6"
                                    value={form.otpCode}
                                    placeholder="• • • • • •"
                                    onChange={e => setForm(p => ({ ...p, otpCode: e.target.value.replace(/\D/g, '') }))}
                                    className={`w-full text-center tracking-[0.5em] font-mono text-xl rounded-xl border px-3 py-3 outline-none transition bg-white dark:bg-[#1f2937] text-slate-900 dark:text-slate-100 ${errors.otpCode ? "border-rose-400 focus:border-rose-400" : "border-slate-300 dark:border-[#374151] focus:border-emerald-500"}`}
                                />
                                {errors.otpCode && <p className="text-[11px] text-rose-500 font-medium text-center">{errors.otpCode}</p>}
                            </div>

                            <PwField
                                label="New Password"
                                value={form.password}
                                show={show.password}
                                error={errors.password}
                                onChange={v => setForm(p => ({ ...p, password: v }))}
                                onToggle={() => setShow(p => ({ ...p, password: !p.password }))}
                                placeholder="Min. 8 characters"
                            />
                            <PwField
                                label="Confirm New Password"
                                value={form.confirm}
                                show={show.confirm}
                                error={errors.confirm}
                                onChange={v => setForm(p => ({ ...p, confirm: v }))}
                                onToggle={() => setShow(p => ({ ...p, confirm: !p.confirm }))}
                                placeholder="Re-enter new password"
                            />

                            {/* Strength hint */}
                            {form.password.length > 0 && <PasswordStrength password={form.password} />}
                        </>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2.5 px-5 py-4 border-t border-slate-100 dark:border-[#1f2937] bg-slate-50/60 dark:bg-[#1f2937]/40">
                    {step === 2 && (
                        <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#374151] bg-white dark:bg-[#1f2937] text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition">
                            Back
                        </button>
                    )}
                    <button
                        onClick={step === 1 ? handleRequestOtp : handleVerifyAndChange}
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 transition"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : step === 1 ? <Key size={14} /> : <CheckCheck size={14} />}
                        {step === 1 ? "Send Verification Code" : "Update Password"}
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}

// ─── PASSWORD STRENGTH INDICATOR ─────────────────────────────────────────────
function PasswordStrength({ password }) {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const strength = checks.filter(Boolean).length;
    const labels   = ["", "Weak", "Fair", "Good", "Strong"];
    const colors   = ["", "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-emerald-500"];
    const txtCol   = ["", "text-rose-500", "text-amber-500", "text-sky-500", "text-emerald-500"];

    return (
        <div className="space-y-1.5">
            <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? colors[strength] : "bg-slate-200 dark:bg-[#374151]"}`} />
                ))}
            </div>
            <p className={`text-[11px] font-semibold ${txtCol[strength]}`}>{labels[strength]}</p>
        </div>
    );
}

// ─── PASSWORD FIELD ───────────────────────────────────────────────────────────
function PwField({ label, value, show, error, onChange, onToggle, placeholder }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 dark:text-[#9ca3af] uppercase tracking-wide">{label}</label>
            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    placeholder={placeholder}
                    onChange={e => onChange(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2.5 pr-10 text-sm outline-none transition bg-white dark:bg-[#1f2937] text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-[#4b5563] focus:ring-2 focus:ring-emerald-500/20 ${error ? "border-rose-400 dark:border-rose-500 focus:border-rose-400" : "border-slate-300 dark:border-[#374151] focus:border-emerald-500 dark:focus:border-emerald-500"}`}
                />
                <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#6b7280] hover:text-slate-600 dark:hover:text-slate-300 transition">
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </div>
            {error && <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">{error}</p>}
        </div>
    );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ src, initials, size = 8 }) {
    const [err, setErr] = useState(false);
    const sizeClass = `h-${size} w-${size}`;
    return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden text-white font-bold text-xs shrink-0 shadow-sm`}>
            {src && !err ? <img src={src} alt="Avatar" className="h-full w-full object-cover" onError={() => setErr(true)} /> : initials}
        </div>
    );
}

// ─── NAV ITEM (sidebar) ───────────────────────────────────────────────────────
function NavItem({ item, isActive }) {
    const { icon: Icon, name, routeName } = item;
    return (
        <Link
            href={route(routeName)}
            className={[
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                    : "text-slate-600 dark:text-[#9ca3af] hover:bg-slate-100 dark:hover:bg-[#1f2937] hover:text-slate-900 dark:hover:text-white",
            ].join(" ")}
        >
            <span className={[
                "h-7 w-7 grid place-items-center rounded-lg shrink-0 transition-all",
                isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-[#1f2937] text-slate-500 dark:text-[#6b7280] group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 group-hover:text-emerald-700 dark:group-hover:text-emerald-400",
            ].join(" ")}>
                <Icon size={14} />
            </span>
            {name}
        </Link>
    );
}

// ─── BOTTOM NAV ITEM ──────────────────────────────────────────────────────────
function BottomNavItem({ item, isActive, onClick }) {
    const { icon: Icon, name, routeName } = item;
    return (
        <Link
            href={route(routeName)}
            onClick={onClick}
            className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-[10px] font-semibold transition-colors ${
                isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-[#6b7280]"
            }`}
        >
            <Icon size={isActive ? 20 : 19} />
            <span className="truncate">{name}</span>
            {isActive && <span className="absolute bottom-0 h-0.5 w-6 rounded-full bg-emerald-500" />}
        </Link>
    );
}

// ─── DROPDOWN LINK ────────────────────────────────────────────────────────────
function DropdownLink({ href, icon: Icon, label, onClick }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-slate-600 dark:text-[#9ca3af] hover:bg-slate-50 dark:hover:bg-[#374151] hover:text-slate-900 dark:hover:text-white transition-colors"
        >
            <Icon size={14} className="text-slate-400 dark:text-[#6b7280] shrink-0" />
            {label}
        </Link>
    );
}
