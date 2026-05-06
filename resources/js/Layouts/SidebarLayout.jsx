import { useState, useEffect, useRef } from "react";
import { 
    User, FileText, Bell, Key, LogOut, LayoutDashboard, 
    History as HistoryIcon, ChevronDown, PiggyBank, Hourglass, 
    Banknote, MoreHorizontal, Sun, Moon 
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

export default function SidebarLayout({ children }) {
    const [currentDateTime, setCurrentDateTime] = useState({
        day: "",
        date: "",
        time: "",
    });

    // --- THEME STATE LOGIC ---
    // Initialize theme from localStorage or default to 'dark'
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem("theme");
            // Default to dark if no setting found, or respect saved setting
            return savedTheme ? savedTheme === "dark" : true; 
        }
        return true;
    });

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notificationPreview, setNotificationPreview] = useState([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    const { url, props } = usePage();
    const pisVersion = props.pisVersion || "2.0.0";

    const auth = props.auth || {};
    const memberSource = auth.member || auth.user || {};
    const profileImage =
        memberSource.profileImage || memberSource.profilePhoto || memberSource.avatar || null;

    const memberUnreadNotificationCount = props.memberUnreadNotificationCount || 0;
    const hasUnreadNotifications = memberUnreadNotificationCount > 0;

    const profileMenuRef = useRef(null);
    const notificationButtonRef = useRef(null);
    const notificationDropdownRef = useRef(null);

    // --- APPLY THEME TO HTML TAG ---
    useEffect(() => {
        const root = window.document.documentElement;
        // Remove both to avoid conflicts, then add current
        root.classList.remove("light", "dark");
        
        if (isDarkMode) {
            root.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            root.classList.add("light"); // Explicitly add light class if needed by other libs
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode((prev) => !prev);

    // Date/time ticker
    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const day = now.toLocaleDateString("en-PH", { weekday: "long" });
            const date = now.toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "2-digit",
            });
            const time = now.toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            });
            setCurrentDateTime({ day, date, time });
        };

        updateDateTime();
        const intervalId = setInterval(updateDateTime, 1000);
        return () => clearInterval(intervalId);
    }, []);

    // Click outside close logic (same as before)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }

            if (
                notificationDropdownRef.current &&
                !notificationDropdownRef.current.contains(event.target) &&
                notificationButtonRef.current &&
                !notificationButtonRef.current.contains(event.target)
            ) {
                setIsNotificationOpen(false);
            }

            if (
                isMoreMenuOpen &&
                !event.target.closest?.("#mobile-bottom-more-sheet") &&
                !event.target.closest?.("#mobile-bottom-more-button")
            ) {
                setIsMoreMenuOpen(false);
            }
        };

        if (isProfileMenuOpen || isNotificationOpen || isMoreMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isProfileMenuOpen, isNotificationOpen, isMoreMenuOpen]);

    const isRouteActive = (nameOrPattern) => {
        if (typeof route !== "undefined" && route().current) {
            return route().current(nameOrPattern);
        }
        return url.startsWith(nameOrPattern);
    };

    const navSections = [
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

    const getInitials = () => {
        const firstName = memberSource.firstName || "";
        const lastName = memberSource.lastName || "";
        const name = memberSource.name || "";
        const username = memberSource.username || "";

        if (firstName || lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        if (name) {
            const parts = name.split(" ").filter(Boolean);
            return `${(parts[0]?.[0] || "").toUpperCase()}${(parts[parts.length - 1]?.[0] || "").toUpperCase()}`.trim() || "PM";
        }
        if (username) return username.charAt(0).toUpperCase();
        return "PM";
    };

    const displayName = (() => {
        const firstName = memberSource.firstName || "";
        const lastName = memberSource.lastName || "";
        const name = memberSource.name || "";
        const username = memberSource.username || "";
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) return fullName;
        if (name) return name;
        if (username) return username;
        return "Member";
    })();

    const { day, date, time } = currentDateTime;
    const currentYear = new Date().getFullYear();

    const fetchNotificationPreview = async () => {
        try {
            setIsLoadingNotifications(true);
            const response = await axios.get("/client/notifications/list", { params: { preview: true } });
            setNotificationPreview(response.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Unable to load notifications.");
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    const handleToggleNotifications = () => {
        setIsNotificationOpen((prev) => {
            const next = !prev;
            if (next && notificationPreview.length === 0) fetchNotificationPreview();
            return next;
        });
    };

    const renderNavItem = (item) => {
        const Icon = item.icon;
        const active = isRouteActive(item.routeName);

        return (
            <Link
                key={item.name}
                href={route(item.routeName)}
                className={[
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                    // Active State (Light vs Dark)
                    active
                        ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:shadow-[0_0_0_1px_rgba(52,211,153,0.28)]"
                        // Inactive State (Light vs Dark)
                        : "text-slate-600 hover:bg-slate-100 hover:text-emerald-800 dark:text-slate-200/80 dark:hover:bg-white/5 dark:hover:text-emerald-100",
                ].join(" ")}
            >
                <span
                    className={[
                        "inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs transition-all",
                        active
                            ? "bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-400/10 dark:border-emerald-300/40 dark:text-emerald-200"
                            : "bg-white border-slate-200 text-slate-500 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-emerald-600 dark:bg-white/5 dark:border-white/10 dark:text-slate-200/70 dark:group-hover:bg-emerald-400/10 dark:group-hover:border-emerald-300/30 dark:group-hover:text-emerald-100",
                    ].join(" ")}
                >
                    <Icon size={16} />
                </span>
                <span className="truncate font-medium">{item.name}</span>
            </Link>
        );
    };

    // Mobile bottom nav
    const bottomNavPrimary = [
        { name: "Home", icon: LayoutDashboard, routeName: "member.dashboard" },
        { name: "Loans", icon: FileText, routeName: "member.loans.index" },
        { name: "Savings", icon: PiggyBank, routeName: "member.savings.index" },
        { name: "Profile", icon: User, routeName: "member.show" },
    ];

    const bottomNavSecondary = [
        { name: "Capital Contribution", icon: Banknote, routeName: "member.share-capital-data" },
        { name: "Time Deposit", icon: Hourglass, routeName: "member.time-deposit" },
        { name: "Transaction History", icon: HistoryIcon, routeName: "member.transactions.index" },
    ];

    const renderBottomNavItem = (item) => {
        const Icon = item.icon;
        const active = isRouteActive(item.routeName);

        return (
            <Link
                key={item.name}
                href={route(item.routeName)}
                className={[
                    "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-[60px] py-1.5 text-[10px] transition-all",
                    active 
                        ? "text-emerald-700 dark:text-emerald-300 font-semibold" 
                        : "text-slate-500 hover:text-emerald-600 dark:text-slate-300/70 dark:hover:text-emerald-300",
                ].join(" ")}
                onClick={() => setIsMoreMenuOpen(false)}
            >
                <Icon size={20} className={active ? "scale-105" : ""} />
                <span className="leading-tight truncate">{item.name}</span>
            </Link>
        );
    };

    return (
        // MAIN WRAPPER: Handles the background color transition for the whole page
        <div className="min-h-screen transition-colors duration-300 bg-gray-50 text-slate-900 dark:bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(16,185,129,0.25),transparent_45%),radial-gradient(900px_circle_at_80%_0%,rgba(34,197,94,0.18),transparent_42%),linear-gradient(135deg,#04130e,#050b12_45%,#04130e)] dark:text-slate-100">
            <div className="flex min-h-screen overflow-x-hidden">
                
                {/* SIDEBAR (Desktop) */}
                <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-72">
                    <div className="flex flex-col h-full w-full border-r border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 backdrop-blur-xl shadow-sm dark:shadow-[0_0_30px_rgba(0,0,0,0.35)] transition-colors duration-300">
                        {/* BRAND */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-emerald-50 via-white to-slate-50 dark:from-emerald-900/60 dark:via-emerald-950/40 dark:to-slate-950/40">
                            <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 dark:bg-white/10 dark:border-white/15 flex items-center justify-center overflow-hidden shadow-sm dark:shadow-inner">
                                <img
                                    src="/images/logo/pis_logo.png"
                                    alt="PIS Logo"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <div className="leading-tight">
                                <h1 className="text-sm font-bold text-emerald-900 dark:text-emerald-50">Client Portal</h1>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-100/80">People&apos;s Information System</p>
                            </div>
                        </div>

                        {/* NAV */}
                        <nav className="flex-1 px-4 py-5 space-y-5 text-sm overflow-y-auto">
                            {navSections.map((section) => (
                                <div key={section.label}>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-200/60 mb-2 px-1">
                                        {section.label}
                                    </p>
                                    <div className="space-y-1.5">{section.items.map(renderNavItem)}</div>
                                </div>
                            ))}
                        </nav>

                        <div className="px-5 py-3 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-400 dark:text-slate-200/60 font-medium">
                            Secure member access • PIS
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 flex flex-col min-h-screen md:ml-72 transition-all duration-300">
                    
                    {/* TOP NAVBAR */}
                    <nav className="fixed top-0 left-0 right-0 md:left-72 z-50 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-950/55 backdrop-blur-xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-colors duration-300">
                        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-3">
                            {/* LEFT: Date/Time */}
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col leading-tight">
                                    <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-50">
                                        {day || "--"}
                                    </span>
                                    <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-200/70">
                                        <span>{date || "--"}</span>
                                        <span className="text-slate-300 dark:text-slate-200/40">·</span>
                                        <span className="font-mono font-medium">{time || "--:--:--"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Actions */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                
                                {/* THEME TOGGLE */}
                                <button
                                    onClick={toggleTheme}
                                    className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-emerald-300/30 transition text-slate-600 dark:text-slate-200"
                                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                >
                                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                                </button>

                                {/* NOTIFICATIONS */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        ref={notificationButtonRef}
                                        onClick={handleToggleNotifications}
                                        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-emerald-300/30 transition text-slate-600 dark:text-slate-100/80"
                                        aria-label="Notifications"
                                    >
                                        <Bell size={18} />
                                        {hasUnreadNotifications && (
                                            <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                                                {memberUnreadNotificationCount > 9 ? "9+" : memberUnreadNotificationCount}
                                            </span>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isNotificationOpen && (
                                            <motion.div
                                                ref={notificationDropdownRef}
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
                                                    {hasUnreadNotifications && (
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

                                {/* PROFILE */}
                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 shadow-sm hover:border-emerald-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-300/30 dark:hover:bg-white/10 transition"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 dark:bg-emerald-400/10 dark:border-emerald-300/20 dark:text-emerald-100 flex items-center justify-center text-xs font-semibold overflow-hidden">
                                            {profileImage ? (
                                                <img
                                                    src={route("member.showProfilePhoto")}
                                                    alt={displayName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                getInitials()
                                            )}
                                        </div>

                                        <div className="hidden sm:flex flex-col items-start leading-tight max-w-[160px]">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-50 truncate">
                                                {displayName}
                                            </span>
                                            <span className="text-[11px] text-slate-500 dark:text-slate-200/70">Member</span>
                                        </div>

                                        <ChevronDown size={16} className="text-slate-400 dark:text-slate-200/70" />
                                    </button>

                                    <AnimatePresence>
                                        {isProfileMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white/95 dark:border-white/10 dark:bg-slate-950/90 backdrop-blur-xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-1 text-sm z-50"
                                            >
                                                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10">
                                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-50 truncate">
                                                        {displayName}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-200/70">PIS Client</div>
                                                </div>

                                                <Link
                                                    href={route("member.show")}
                                                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700 dark:hover:bg-white/5 dark:text-slate-100/90"
                                                >
                                                    <User size={15} />
                                                    <span>View Profile</span>
                                                </Link>

                                                <Link
                                                    href={route("member.settings")}
                                                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700 dark:hover:bg-white/5 dark:text-slate-100/90"
                                                >
                                                    <Key size={15} />
                                                    <span>Change Password</span>
                                                </Link>

                                                <Link
                                                    href={route("member.logout")}
                                                    method="post"
                                                    as="button"
                                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 mt-1 border-t border-slate-100 dark:hover:bg-red-500/10 dark:text-red-200 dark:border-white/10"
                                                >
                                                    <LogOut size={15} />
                                                    <span>Logout</span>
                                                </Link>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </nav>

                    {/* PAGE CONTENT */}
                    <main className="flex-1 w-full pt-16 pb-16 md:pb-0 relative z-0">
                        <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">{children}</div>
                    </main>

                    {/* MOBILE BOTTOM NAV */}
                    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-200 bg-white/90 dark:border-white/10 dark:bg-slate-950/70 backdrop-blur-xl shadow-lg">
                        <div className="flex items-stretch justify-between px-2">
                            {bottomNavPrimary.map(renderBottomNavItem)}

                            <button
                                id="mobile-bottom-more-button"
                                type="button"
                                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                                className={[
                                    "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-[60px] py-1.5 text-[10px] transition-all",
                                    isMoreMenuOpen 
                                        ? "text-emerald-700 dark:text-emerald-300 font-semibold" 
                                        : "text-slate-500 hover:text-emerald-600 dark:text-slate-300/70 dark:hover:text-emerald-300",
                                ].join(" ")}
                            >
                                <MoreHorizontal size={20} />
                                <span className="leading-tight truncate">More</span>
                            </button>
                        </div>

                        <AnimatePresence>
                            {isMoreMenuOpen && (
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
                                            {bottomNavSecondary.map((item) => {
                                                const Icon = item.icon;
                                                const active = isRouteActive(item.routeName);

                                                return (
                                                    <Link
                                                        key={item.name}
                                                        href={route(item.routeName)}
                                                        onClick={() => setIsMoreMenuOpen(false)}
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

                    {/* FOOTER (desktop only) */}
                    <footer className="hidden md:block border-t border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl transition-colors duration-300">
                        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-200/60 text-center sm:text-left">
                                © {currentYear} People&apos;s Information System. All rights reserved.
                            </span>
                            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-200/60 text-center sm:text-right">
                                PIS Version {pisVersion}
                            </span>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}