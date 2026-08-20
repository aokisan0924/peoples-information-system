import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
    Menu as MenuIcon, X, Users, LogOut, LayoutDashboard, BarChart3,
    PiggyBank, Banknote, Hourglass, CreditCard, ChevronDown, Sun, Moon,
    User, UserPlus, Megaphone, Image, BookOpen, Layers, Landmark,
    Wallet2, Smartphone, Briefcase, Scale, PenTool, ChevronRight, Receipt,
    FileArchive, PieChart, Bell, ShieldCheck
} from "lucide-react";
import { Link, usePage, router } from "@inertiajs/react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";

// ─── DARK MODE TOKEN REFERENCE ────────────────────────────────────────────────
// Page bg (dark):      #0b1120  (near-black navy)
// Sidebar bg (dark):   #111827  (gray-900)
// Sidebar border:      #1f2937  (gray-800)
// Card/item hover:     #1f2937  (gray-800)
// Muted text:          #6b7280  (gray-500)
// Active item:         bg-emerald-600
// Subitem active:      emerald-400 text, emerald-900/40 bg
// Input/field bg:      #1f2937
// Divider:             #1f2937
// ─────────────────────────────────────────────────────────────────────────────

const buildNavGroups = ({ isSuperAdmin, isAccountingClerk, isBookkeeper, canAccess }) => {
    const groups = [];

    // MAIN
    const mainItems = [];
    if (!isAccountingClerk && !isBookkeeper)
        mainItems.push({ name: "admin.dashboard", label: "Dashboard", icon: LayoutDashboard });
    if (mainItems.length) groups.push({ id: "main", label: "Main", items: mainItems });

    // ACCOUNTING
    if (canAccess("accounting") || canAccess("bank") || canAccess("cash_tools")) {
        const accItems = [];
        if (canAccess("accounting")) accItems.push({ name: "admin.accounting.ledger.index", label: "General Ledger",    icon: BookOpen  });
        if (canAccess("bank"))       accItems.push({ name: "admin.accounting.bank.index",   label: "Bank Records",      icon: Landmark  });
        if (canAccess("cash_tools")) {
            accItems.push({ name: "admin.accounting.petty.index",   label: "Petty Cash Fund", icon: Wallet2    });
            accItems.push({ name: "admin.accounting.ewallet.index", label: "E-Wallet Logs",   icon: Smartphone });
        }
        if (canAccess("accounting")) {
            accItems.push({ name: "admin.accounting.billing.workspace", label: "Billing Processing", icon: Receipt });
            accItems.push({ name: "admin.accounting.receivables.index", label: "Loans Receivable", icon: BarChart3 });
            
            accItems.push({ name: "admin.accounting.loans.workspace", label: "Loan Collections", icon: Receipt });
            accItems.push({ name: "admin.accounting.ppe.index",     label: "PPE Depreciation",  icon: Briefcase });
            accItems.push({ name: "admin.accounting.chart.index",   label: "Chart of Accounts", icon: Layers    });
            accItems.push({ name: "admin.accounting.journal.index", label: "General Journal",   icon: PenTool   });
            accItems.push({ name: "admin.accounting.journal-entries.index", label: "Loan Journal Review", icon: ShieldCheck });
        }
        const accGroup = { id: "accounting", label: "Accounting", items: accItems };
        if (canAccess("accounting")) {
            accGroup.subGroups = [{
                id: "fin-reports", label: "Financial Reports",
                items: [{ name: "admin.accounting.reports.trial-balance", label: "Trial Balance", icon: Scale }]
            }];
        }
        groups.push(accGroup);
    }

    // TRANSACTIONS
    const buildTxItems = () => {
        const items = [];
        if (canAccess("members")) items.push({ name: "admin.members.index", label: "Manage Members", icon: Users });
        if (canAccess("loans")) items.push({ name: "admin.loans", label: "Loan Applications", icon: CreditCard });
        if (canAccess("deposits")) {
            items.push({ name: "admin.share-capital.index", label: "Capital Contribution", icon: Banknote });
            items.push({ name: "admin.time.index", label: "Time Deposit", icon: Hourglass });
            items.push({
                id: "savings", label: "Savings Deposit", icon: PiggyBank,
                children: [
                    { name: "admin.savings.index", label: "Savings Deposit" },
                    { name: "admin.savings.withdrawal.index", label: "Withdrawal Request" },
                ],
            });
        }
        return items;
    };
    const txItems = buildTxItems();
    if (txItems.length) groups.push({ id: "transactions", label: "Transactions", items: txItems });

    // CONTENT
    if (!isAccountingClerk && !isBookkeeper) {
        groups.push({
            id: "content", label: "Content",
            items: [
                { name: "admin.news.index", label: "News & Updates", icon: Megaphone },
                { name: "admin.gallery.index", label: "Gallery", icon: Image },
            ],
        });
    }

    // MAINTENANCE
    if (isSuperAdmin || canAccess("reports")) {
        const mItems = [];
        if (canAccess("reports")) mItems.push({ name: "admin.reports", label: "Reports", icon: BarChart3 });
        if (mItems.length) groups.push({ id: "maintenance", label: "Maintenance", items: mItems });
    }

    return groups;
};

// ─── BREADCRUMB BUILDER ───────────────────────────────────────────────────────
function useBreadcrumbs(navGroups) {
    const { url } = usePage();

    return useMemo(() => {
        // Always start with "Admin"
        const crumbs = [{ label: "Admin", href: null }];

        // Walk every group → item → child to find the active route
        for (const group of navGroups) {
            const allItems = [
                ...(group.items || []),
                ...(group.subGroups?.flatMap(sg => sg.items) || []),
            ];
            for (const item of allItems) {
                if (item.children) {
                    // Collapsible parent (e.g. Savings Deposit)
                    for (const child of item.children) {
                        if (route().current(child.name)) {
                            crumbs.push({ label: group.label, href: null });
                            crumbs.push({ label: item.label, href: null });
                            crumbs.push({ label: child.label, href: route(child.name) });
                            return crumbs;
                        }
                    }
                } else if (item.name && item.name !== "#" && route().current(item.name)) {
                    crumbs.push({ label: group.label, href: null });
                    crumbs.push({ label: item.label, href: route(item.name) });
                    return crumbs;
                }
            }
        }

        // Fallback: derive from URL segments
        const segments = url.replace(/^\//, "").split("/").filter(Boolean);
        segments.forEach((seg, i) => {
            const label = seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            crumbs.push({ label, href: null });
        });

        return crumbs;
    }, [url, navGroups]);
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminSidebarLayout({ children }) {
    const [sidebarOpen,   setSidebarOpen]   = useState(false);
    const [openGroups,    setOpenGroups]    = useState({ savings: true });
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isBellOpen,    setIsBellOpen]    = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount,   setUnreadCount]   = useState(0);
    const profileRef = useRef(null);
    const bellRef    = useRef(null);

    // ── Fetch notifications ───────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await axios.get(route("admin.savings.notifications.index"));
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch {
            // Silently fail — non-critical
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30_000); // poll every 30s
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markRead = async (id) => {
        try {
            await axios.post(route("admin.savings.notifications.read", id));
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    const markAllRead = async () => {
        try {
            await axios.post(route("admin.savings.notifications.read-all"));
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.isRead) markRead(notif.id);
        setIsBellOpen(false);
        if (notif.linkUrl) router.visit(notif.linkUrl);
    };
    const { auth } = usePage().props;

    const userRole = (auth?.user?.role || "").toLowerCase();
    const isSuperAdmin = userRole === "super-admin";
    const isAccountingClerk = userRole === "accounting-clerk";
    const isBookkeeper = userRole === "bookkeeper";
    const permissions = auth?.user?.permissions || [];

    const canAccess = (feature) => {
        if (isSuperAdmin) return true;
        const map = { loans: "view_loans", deposits: "manage_deposits", members: "manage_members", reports: "view_reports", accounting: "manage_accounting", bank: "access_bank", cash_tools: "access_cash_tools" };
        return map[feature] ? permissions.includes(map[feature]) : false;
    };

    const navGroups = buildNavGroups({ isSuperAdmin, isAccountingClerk, isBookkeeper, canAccess });
    const breadcrumbs = useBreadcrumbs(navGroups);

    // Dark mode ───────────────────────────────────────────────────────────────
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("theme");
            return saved ? saved === "dark" : true;
        }
        return true;
    });
    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDarkMode);
        document.documentElement.classList.toggle("light", !isDarkMode);
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    // Click-outside profile + bell ────────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
            if (bellRef.current && !bellRef.current.contains(e.target)) setIsBellOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close sidebar on nav ────────────────────────────────────────────────────
    const currentUrl = usePage().url;
    useEffect(() => { setSidebarOpen(false); }, [currentUrl]);

    const toggleGroup = (id) => setOpenGroups(p => ({ ...p, [id]: !p[id] }));

    const userName      = auth?.user?.name || "Administrator";
    const userInitial   = userName.charAt(0).toUpperCase();
    const userRoleLabel = (auth?.user?.role || "Staff").replace(/-/g, " ");

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors duration-300">

            {/* Mobile backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            <div className="flex min-h-screen">

                {/* ╔══════════════════════════════╗
                    ║         SIDEBAR              ║
                    ╚══════════════════════════════╝ */}
                <aside className={[
                    "fixed inset-y-0 left-0 z-50 w-64 flex flex-col",
                    // Light
                    "bg-white border-r border-slate-200",
                    // Dark — solid opaque panel, no opacity tricks
                    "dark:bg-[#111827] dark:border-[#1f2937]",
                    "shadow-2xl",
                    "transition-transform duration-300 ease-in-out",
                    "lg:static lg:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full",
                ].join(" ")}>

                    {/* Logo */}
                    <div className="flex items-center gap-3 px-5 py-[18px] border-b border-slate-200 dark:border-[#1f2937] shrink-0">
                        <div className="h-9 w-9 rounded-xl bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-[#374151] flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                            <img src="/images/logo/pis_logo.png" alt="PMPC" className="h-full w-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Admin Portal</p>
                            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">PMPC System</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden h-7 w-7 grid place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1f2937] dark:hover:text-white transition"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Nav scroll area */}
                    <div className="flex-1 overflow-y-auto py-5 px-3 scrollbar-hide">
                        <nav className="space-y-6">
                            {navGroups.map(group => (
                                <NavGroup key={group.id} group={group} openGroups={openGroups} toggleGroup={toggleGroup} />
                            ))}
                        </nav>
                    </div>

                    {/* Sidebar footer */}
                    <div className="shrink-0 px-5 py-4 border-t border-slate-100 dark:border-[#1f2937]">
                        <p className="text-[10px] text-slate-400 dark:text-[#4b5563] text-center font-medium tracking-widest uppercase">
                            Admin Console v2.0
                        </p>
                    </div>
                </aside>

                {/* ╔══════════════════════════════╗
                    ║       MAIN CONTENT           ║
                    ╚══════════════════════════════╝ */}
                <div className="flex-1 flex flex-col min-h-screen min-w-0">

                    {/* Top bar */}
                    <header className={[
                        "sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6",
                        "border-b border-slate-200 dark:border-[#1f2937]",
                        "bg-white/95 dark:bg-[#111827]/95",
                        "backdrop-blur-xl shrink-0",
                    ].join(" ")}>

                        {/* Left */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden h-8 w-8 grid place-items-center rounded-lg text-slate-500 dark:text-[#9ca3af] hover:bg-slate-100 dark:hover:bg-[#1f2937] transition"
                            >
                                <MenuIcon size={18} />
                            </button>
                            <div className="hidden sm:flex items-center gap-1 flex-wrap">
                                {breadcrumbs.map((crumb, i) => (
                                    <span key={i} className="flex items-center gap-1">
                                        {i > 0 && <ChevronRight size={11} className="text-slate-300 dark:text-[#374151] shrink-0" />}
                                        {i === breadcrumbs.length - 1 ? (
                                            <span className="text-xs text-slate-400 dark:text-[#6b7280]">{crumb.label}</span>
                                        ) : crumb.href ? (
                                            <Link href={crumb.href} className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                                {crumb.label}
                                            </Link>
                                        ) : (
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{crumb.label}</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-2">

                            {/* ── Notification Bell ─────────────────────────── */}
                            <div className="relative" ref={bellRef}>
                                <button
                                    onClick={() => { setIsBellOpen(p => !p); if (!isBellOpen) fetchNotifications(); }}
                                    className="relative h-8 w-8 grid place-items-center rounded-lg text-slate-500 dark:text-[#9ca3af] hover:bg-slate-100 dark:hover:bg-[#1f2937] transition"
                                    aria-label="Notifications"
                                >
                                    <Bell size={17} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-sm">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isBellOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                            transition={{ duration: 0.13, ease: "easeOut" }}
                                            className="absolute right-0 mt-2 w-80 z-50 rounded-2xl overflow-hidden bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                                        >
                                            {/* Header */}
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#1f2937] bg-slate-50 dark:bg-[#1f2937]">
                                                <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllRead}
                                                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>

                                            {/* List */}
                                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-[#1f2937]">
                                                {notifications.length === 0 ? (
                                                    <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-[#6b7280]">
                                                        No notifications yet.
                                                    </div>
                                                ) : notifications.map((notif) => (
                                                    <button
                                                        key={notif.id}
                                                        onClick={() => handleNotificationClick(notif)}
                                                        className={[
                                                            "w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-slate-50 dark:hover:bg-[#1f2937] transition-colors",
                                                            !notif.isRead ? "bg-emerald-50/60 dark:bg-emerald-900/10" : "",
                                                        ].join(" ")}
                                                    >
                                                        {/* Dot indicator */}
                                                        <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!notif.isRead ? "bg-emerald-500" : "bg-slate-200 dark:bg-[#374151]"}`} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-slate-800 dark:text-white leading-snug truncate">
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 dark:text-[#9ca3af] mt-0.5 leading-relaxed line-clamp-2">
                                                                {notif.message}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 dark:text-[#6b7280] mt-1">
                                                                {new Date(notif.created_at).toLocaleString("en-PH", {
                                                                    month: "short", day: "numeric",
                                                                    hour: "numeric", minute: "2-digit",
                                                                })}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Footer */}
                                            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-[#1f2937] bg-slate-50 dark:bg-[#1f2937]">
                                                <Link
                                                    href={route("admin.savings.withdrawal.index")}
                                                    onClick={() => setIsBellOpen(false)}
                                                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                                >
                                                    View all withdrawal requests →
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Theme pill toggle */}
                            <button
                                onClick={() => setIsDarkMode(p => !p)}
                                className={[
                                    "relative h-7 w-14 rounded-full border transition-all duration-300",
                                    isDarkMode
                                        ? "bg-[#1f2937] border-[#374151]"
                                        : "bg-slate-100 border-slate-200",
                                ].join(" ")}
                                aria-label="Toggle theme"
                            >
                                <span className={[
                                    "absolute top-0.5 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                                    isDarkMode
                                        ? "translate-x-7 bg-[#374151] text-yellow-300"
                                        : "translate-x-0.5 bg-white text-slate-500",
                                ].join(" ")}>
                                    {isDarkMode ? <Sun size={12} /> : <Moon size={12} />}
                                </span>
                            </button>

                            {/* Divider */}
                            <div className="h-6 w-px bg-slate-200 dark:bg-[#1f2937] mx-1" />

                            {/* Profile */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(p => !p)}
                                    className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-[#1f2937] transition-colors"
                                >
                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                                        {userInitial}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{userName}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-[#6b7280] capitalize">{userRoleLabel}</p>
                                    </div>
                                    <ChevronDown size={13} className={`text-slate-400 dark:text-[#6b7280] transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                            transition={{ duration: 0.13, ease: "easeOut" }}
                                            className={[
                                                "absolute right-0 mt-2 w-56 z-50",
                                                "rounded-2xl overflow-hidden",
                                                "bg-white dark:bg-[#111827]",
                                                "border border-slate-200 dark:border-[#1f2937]",
                                                "shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)]",
                                            ].join(" ")}
                                        >
                                            {/* User card header */}
                                            <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 dark:bg-[#1f2937] border-b border-slate-100 dark:border-[#374151]">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
                                                    {userInitial}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                                                    <p className="text-[11px] text-slate-400 dark:text-[#6b7280] capitalize truncate">{userRoleLabel}</p>
                                                </div>
                                            </div>

                                            <div className="p-1.5">
                                                <DropdownLink href={route("admin.profile.edit")} icon={User} label="My Profile" />
                                                {isSuperAdmin && (
                                                    <DropdownLink href={route("admin.create-user")} icon={UserPlus} label="Add Admin" />
                                                )}
                                            </div>

                                            <div className="p-1.5 border-t border-slate-100 dark:border-[#1f2937]">
                                                <Link
                                                    href={route("admin.logout")} method="post" as="button"
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
                    </header>

                    {/* Page content */}
                    <main className="flex-1 p-4 sm:p-6 lg:p-7 w-full max-w-7xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                            {children}
                        </motion.div>
                    </main>
                </div>
            </div>
        </div>
    );
}

// ─── NAV GROUP ────────────────────────────────────────────────────────────────
function NavGroup({ group, openGroups, toggleGroup }) {
    return (
        <div className="space-y-0.5">
            <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-[#4b5563] select-none">
                {group.label}
            </p>
            {group.items.map(item =>
                item.children
                    ? <CollapsibleNav key={item.id} item={item} isOpen={!!openGroups[item.id]} onToggle={() => toggleGroup(item.id)} />
                    : <NavItem key={item.name} {...item} />
            )}
            {group.subGroups?.map(sub => (
                <div key={sub.id} className="mt-3 space-y-0.5">
                    <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-300 dark:text-[#374151] select-none">
                        {sub.label}
                    </p>
                    {sub.items.map(item => <NavItem key={item.name} {...item} />)}
                </div>
            ))}
        </div>
    );
}

// ─── NAV ITEM ─────────────────────────────────────────────────────────────────
function NavItem({ name, label, icon: Icon }) {
    const isPlaceholder = name === "#";
    const active = !isPlaceholder && route().current(name);
    return (
        <Link
            href={isPlaceholder ? "#" : route(name)}
            className={[
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                    : [
                        "text-slate-600 dark:text-[#9ca3af]",
                        "hover:bg-slate-100 dark:hover:bg-[#1f2937]",
                        "hover:text-slate-900 dark:hover:text-white",
                    ].join(" "),
            ].join(" ")}
        >
            <span className={[
                "inline-flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-all",
                active
                    ? "bg-white/20 text-white"
                    : [
                        "bg-slate-100 dark:bg-[#1f2937]",
                        "text-slate-500 dark:text-[#6b7280]",
                        "group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40",
                        "group-hover:text-emerald-700 dark:group-hover:text-emerald-400",
                    ].join(" "),
            ].join(" ")}>
                <Icon size={14} />
            </span>
            <span className="truncate">{label}</span>
        </Link>
    );
}

// ─── COLLAPSIBLE NAV ──────────────────────────────────────────────────────────
function CollapsibleNav({ item, isOpen, onToggle }) {
    const { label, icon: Icon, children } = item;
    const anyActive = children.some(c => route().current(c.name));
    return (
        <div>
            <button
                onClick={onToggle}
                className={[
                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    anyActive
                        ? "text-slate-900 dark:text-white bg-slate-100 dark:bg-[#1f2937]"
                        : "text-slate-600 dark:text-[#9ca3af] hover:bg-slate-100 dark:hover:bg-[#1f2937] hover:text-slate-900 dark:hover:text-white",
                ].join(" ")}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className={[
                        "inline-flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-all",
                        anyActive
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-[#1f2937] text-slate-500 dark:text-[#6b7280]",
                    ].join(" ")}>
                        <Icon size={14} />
                    </span>
                    <span className="truncate">{label}</span>
                </div>
                <ChevronDown size={13} className={`shrink-0 text-slate-400 dark:text-[#4b5563] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="mt-1 ml-5 pl-3 border-l-2 border-slate-200 dark:border-[#1f2937] space-y-0.5 pb-1">
                            {children.map(c => <SubItem key={c.name} name={c.name} label={c.label} />)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── SUB ITEM ─────────────────────────────────────────────────────────────────
function SubItem({ name, label }) {
    const active = route().current(name);
    return (
        <Link
            href={route(name)}
            className={[
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                active
                    ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30"
                    : "text-slate-500 dark:text-[#6b7280] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1f2937]",
            ].join(" ")}
        >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${active ? "bg-emerald-500" : "bg-slate-300 dark:bg-[#374151]"}`} />
            {label}
        </Link>
    );
}

// ─── DROPDOWN LINK ────────────────────────────────────────────────────────────
function DropdownLink({ href, icon: Icon, label }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-slate-600 dark:text-[#9ca3af] hover:bg-slate-50 dark:hover:bg-[#374151] hover:text-slate-900 dark:hover:text-white transition-colors"
        >
            <Icon size={14} className="shrink-0 text-slate-400 dark:text-[#6b7280]" />
            {label}
        </Link>
    );
}
