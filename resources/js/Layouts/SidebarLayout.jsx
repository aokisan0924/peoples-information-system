import { useState, useEffect, useRef } from "react";
import { 
    User, FileText, Bell, Key, LogOut, LayoutDashboard, 
    History as HistoryIcon, PiggyBank, Hourglass, 
    Banknote, MoreHorizontal, Sun, Moon 
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

const NAV_SECTIONS = [
    {
        label: "Main",
        items: [{ name: "Dashboard", icon: LayoutDashboard, routeName: "member.dashboard" }],
    },
    {
        label: "Account",
        items: [
            { name: "My Profile", icon: User, routeName: "member.show" },
            { name: "Transaction History", icon: HistoryIcon, routeName: "member.transactions.index" },
        ],
    },
    {
        label: "Finances",
        items: [
            { name: "Loan Application", icon: FileText, routeName: "member.loans.index" },
            { name: "Capital Contribution", icon: Banknote, routeName: "member.share-capital-data" },
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
    { name: "Capital Contribution", icon: Banknote, routeName: "member.share-capital-data" },
    { name: "Time Deposit", icon: Hourglass, routeName: "member.time-deposit" },
    { name: "Transaction History", icon: HistoryIcon, routeName: "member.transactions.index" },
];

export default function SidebarLayout({ children }) {
    const { url, props } = usePage();
    const pisVersion = props.pisVersion || "2.0.0";
    const auth = props.auth || {};
    const memberSource = auth.member || auth.user || {};
    const memberUnreadNotificationCount = props.memberUnreadNotificationCount || 0;

    const [currentDateTime, setCurrentDateTime] = useState({ day: "", date: "", time: "" });
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") !== "light"; 
        }
        return true;
    });

    const [menus, setMenus] = useState({ profile: false, notification: false, more: false });
    const [notificationPreview, setNotificationPreview] = useState([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

    const menuRefs = {
        profile: useRef(null),
        notification: useRef(null),
        more: useRef(null)
    };

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(isDarkMode ? "dark" : "light");
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentDateTime({
                day: now.toLocaleDateString("en-PH", { weekday: "long" }),
                date: now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "2-digit" }),
                time: now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menus.profile && !menuRefs.profile.current?.contains(e.target)) toggleMenu('profile', false);
            if (menus.notification && !menuRefs.notification.current?.contains(e.target)) toggleMenu('notification', false);
            if (menus.more && !e.target.closest("#mobile-bottom-more-sheet") && !e.target.closest("#mobile-bottom-more-button")) toggleMenu('more', false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menus]);

    const toggleMenu = (menu, state = null) => {
        setMenus(prev => ({ ...prev, [menu]: state !== null ? state : !prev[menu] }));
    };

    const handleToggleNotifications = () => {
        const willOpen = !menus.notification;
        toggleMenu('notification', willOpen);
        if (willOpen && notificationPreview.length === 0) fetchNotificationPreview();
    };

    const fetchNotificationPreview = async () => {
        setIsLoadingNotifications(true);
        try {
            const res = await axios.get("/client/notifications/list", { params: { preview: true } });
            setNotificationPreview(res.data || []);
        } catch (e) {
            toast.error("Unable to load notifications.");
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    const isRouteActive = (pattern) => typeof route !== "undefined" && route().current ? route().current(pattern) : url.startsWith(pattern);

    // --- DERIVED DATA ---
    const displayName = `${memberSource.firstName || ""} ${memberSource.lastName || ""}`.trim() || memberSource.username || "Member";
    const profileImage = memberSource.profileImage || memberSource.profilePhoto || null;
    const initials = displayName.substring(0, 2).toUpperCase();

    return (
        <div className="min-h-screen transition-colors duration-300 bg-gray-50 text-slate-900 dark:bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(16,185,129,0.25),transparent_45%),radial-gradient(900px_circle_at_80%_0%,rgba(34,197,94,0.18),transparent_42%),linear-gradient(135deg,#04130e,#050b12_45%,#04130e)] dark:text-slate-100">
            <div className="flex min-h-screen overflow-x-hidden">
                
                <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-72 border-r border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 backdrop-blur-xl shadow-sm transition-colors duration-300">
                    <div className="flex flex-col h-full w-full">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-emerald-50 to-slate-50 dark:from-emerald-900/60 dark:to-slate-950/40">
                            <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                                <img src="/images/logo/pis_logo.png" alt="Logo" className="h-full w-full object-contain" />
                            </div>
                            <div className="leading-tight">
                                <h1 className="text-sm font-bold text-emerald-900 dark:text-emerald-50">Client Portal</h1>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-100/80">People's Information System</p>
                            </div>
                        </div>

                        <nav className="flex-1 px-4 py-5 space-y-5 text-sm overflow-y-auto">
                            {NAV_SECTIONS.map((section) => (
                                <div key={section.label}>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-200/60 mb-2 px-1">{section.label}</p>
                                    <div className="space-y-1.5">
                                        {section.items.map(item => (
                                            <NavItem key={item.name} item={item} isActive={isRouteActive(item.routeName)} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col min-h-screen md:ml-72 transition-all duration-300">
                    
                    <nav className="fixed top-0 left-0 right-0 md:left-72 z-50 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-950/55 backdrop-blur-xl shadow-sm transition-colors duration-300">
                        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
                            
                            <div className="flex flex-col leading-tight">
                                <span className="text-xs sm:text-[13px] font-bold">{currentDateTime.day || "--"}</span>
                                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-200/70">
                                    <span>{currentDateTime.date || "--"}</span>
                                    <span>·</span>
                                    <span className="font-mono">{currentDateTime.time || "--:--:--"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center dark:border-white/10 dark:bg-white/5 transition">
                                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                                </button>

                                <div className="relative" ref={menuRefs.notification}>
                                    <button onClick={handleToggleNotifications} className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center dark:border-white/10 dark:bg-white/5 transition relative">
                                        <Bell size={18} />
                                        {memberUnreadNotificationCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                                                {memberUnreadNotificationCount}
                                            </span>
                                        )}
                                    </button>
                                    
                                    <AnimatePresence>
                                        {menus.notification && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.18 }}
                                                className="z-50 overflow-hidden fixed left-3 right-3 top-16 rounded-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 sm:max-w-xs border border-slate-200 bg-white/95 dark:border-white/10 dark:bg-slate-950/90 backdrop-blur-xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                                            >
                                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-50">Notifications</p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-200/70">
                                                            Latest updates on your account
                                                        </p>
                                                    </div>
                                                    {memberUnreadNotificationCount > 0 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-300/20">
                                                            {memberUnreadNotificationCount} unread
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="max-h-72 overflow-y-auto">
                                                    {isLoadingNotifications ? (
                                                        <div className="p-3 space-y-2">
                                                            {[1, 2, 3].map((i) => (
                                                                <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                                                            ))}
                                                        </div>
                                                    ) : notificationPreview.length === 0 ? (
                                                        <div className="p-4 text-center text-[12px] text-slate-500 dark:text-slate-200/70">
                                                            No recent notifications.
                                                        </div>
                                                    ) : (
                                                        <ul className="divide-y divide-slate-100 dark:divide-white/5">
                                                            {notificationPreview.map((n) => (
                                                                <li
                                                                    key={n.id}
                                                                    className={[
                                                                        "px-3.5 py-2.5",
                                                                        n.isRead ? "bg-transparent" : "bg-emerald-50 dark:bg-emerald-400/5",
                                                                    ].join(" ")}
                                                                >
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="mt-0.5">
                                                                            <span
                                                                                className={[
                                                                                    "inline-block w-2 h-2 rounded-full",
                                                                                    n.isRead ? "bg-slate-300 dark:bg-white/25" : "bg-emerald-500 dark:bg-emerald-400",
                                                                                ].join(" ")}
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-50 line-clamp-1">
                                                                                {n.title}
                                                                            </p>
                                                                            <p className="text-[11px] text-slate-600 dark:text-slate-200/75 line-clamp-2">
                                                                                {n.message}
                                                                            </p>
                                                                            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-200/55">
                                                                                {n.createdAgo}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    {n.linkUrl && (
                                                                        <div className="mt-1.5 flex justify-end">
                                                                            <a
                                                                                href={n.linkUrl}
                                                                                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-200 dark:hover:text-emerald-100 hover:underline inline-flex items-center gap-1"
                                                                            >
                                                                                View <span aria-hidden="true">→</span>
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                <div className="border-t border-slate-100 dark:border-white/10 px-3.5 py-2.5 flex items-center justify-between">
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-200/60">
                                                        History
                                                    </span>
                                                    <Link
                                                        href={route("member.notifications.index")}
                                                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-200 dark:hover:text-emerald-100 hover:underline inline-flex items-center gap-1"
                                                    >
                                                        View all <span aria-hidden="true">→</span>
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="relative" ref={menuRefs.profile}>
                                    <button onClick={() => toggleMenu('profile')} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/5 transition">
                                        <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold overflow-hidden">
                                            {profileImage ? <img src={route("member.showProfilePhoto")} alt="Profile" className="h-full w-full object-cover" /> : initials}
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {menus.profile && (
                                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900 shadow-xl py-1 z-50">
                                                <Link href={route("member.show")} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5"><User size={15} /> Profile</Link>
                                                <Link href={route("member.logout")} method="post" as="button" className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 dark:hover:bg-red-500/10"><LogOut size={15} /> Logout</Link>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </nav>

                    <main className="flex-1 w-full pt-16 pb-16 md:pb-0">
                        <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">{children}</div>
                    </main>

                    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-200 bg-white/95 dark:border-white/10 dark:bg-slate-950/90 backdrop-blur-xl">
                        <div className="flex justify-between px-2">
                            {BOTTOM_NAV_PRIMARY.map(item => (
                                <BottomNavItem key={item.name} item={item} isActive={isRouteActive(item.routeName)} onClick={() => toggleMenu('more', false)} />
                            ))}
                            <button id="mobile-bottom-more-button" onClick={() => toggleMenu('more')} className={`flex flex-col items-center justify-center flex-1 py-1.5 text-[10px] ${menus.more ? 'text-emerald-600' : 'text-slate-500'}`}>
                                <MoreHorizontal size={20} /><span>More</span>
                            </button>
                        </div>
                        
                        <AnimatePresence>
                            {menus.more && (
                                <motion.div
                                    id="mobile-bottom-more-sheet"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute bottom-12 left-0 right-0 px-3 pb-2"
                                >
                                    <div className="mx-auto max-w-xs rounded-2xl border border-slate-200 bg-white/95 dark:border-white/10 dark:bg-slate-950/90 backdrop-blur-xl shadow-xl overflow-hidden">
                                        <div className="px-3 pt-2 pb-1 border-b border-slate-100 dark:border-white/10">
                                            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-50">More options</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-200/70">Access other modules</p>
                                        </div>

                                        <div className="py-1">
                                            {BOTTOM_NAV_SECONDARY.map((item) => {
                                                const Icon = item.icon;
                                                const active = isRouteActive(item.routeName);

                                                return (
                                                    <Link
                                                        key={item.name}
                                                        href={route(item.routeName)}
                                                        onClick={() => toggleMenu('more', false)}
                                                        className={[
                                                            "flex items-center gap-2 px-3 py-2 text-[12px] transition-colors",
                                                            active 
                                                                ? "text-emerald-700 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-400/10" 
                                                                : "text-slate-700 hover:bg-slate-50 dark:text-slate-100/90 dark:hover:bg-white/5",
                                                        ].join(" ")}
                                                    >
                                                        <Icon size={16} className={active ? "text-emerald-600 dark:text-emerald-200" : "text-slate-500 dark:text-slate-200/70"} />
                                                        <span className="truncate font-medium">{item.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavItem({ item, isActive }) {
    const { icon: Icon, name, routeName } = item;
    return (
        <Link href={route(routeName)} className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-200" : "text-slate-600 hover:bg-slate-100 dark:text-slate-200/80 dark:hover:bg-white/5"}`}>
            <span className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${isActive ? "bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-400/10 dark:border-emerald-300/40" : "bg-white border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10"}`}>
                <Icon size={16} />
            </span>
            <span className="font-medium">{name}</span>
        </Link>
    );
}

function BottomNavItem({ item, isActive, onClick }) {
    const { icon: Icon, name, routeName } = item;
    return (
        <Link href={route(routeName)} onClick={onClick} className={`flex flex-col items-center justify-center flex-1 py-1.5 text-[10px] transition-all ${isActive ? "text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-500 hover:text-emerald-600 dark:text-slate-300/70"}`}>
            <Icon size={20} className={isActive ? "scale-105" : ""} />
            <span className="truncate">{name}</span>
        </Link>
    );
}