import { useState, useEffect } from "react";
import {
    Menu as MenuIcon,
    X,
    Users,
    Settings,
    LogOut,
    LayoutDashboard,
    BarChart3,
    ShieldCheck,
    Bell,
    PiggyBank,
    Banknote,
    Hourglass,
    CreditCard,
    ChevronDown,
    ChevronRight,
    Sun,
    Moon,
    User,
    UserPlus,
    Megaphone,
    Image,
    BookOpen,
    Layers,
    Landmark,
    Wallet2,
    Smartphone,
    Briefcase,
    Scale,       // <-- For Trial Balance
    PieChart,    
    PenTool      // <-- For General Journal
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react"; 
import { AnimatePresence, motion } from "framer-motion";

export default function AdminSidebarLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [depositsOpen, setDepositsOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { auth } = usePage().props;
    
    const userRole = (auth?.user?.role || "").toLowerCase();
    const isSuperAdmin = userRole === 'super-admin';
    const isAccountingClerk = userRole === 'accounting-clerk';
    const isBookkeeper = userRole === 'bookkeeper';
    
    const permissions = auth?.user?.permissions || [];

    const canAccess = (feature) => {
        if (isSuperAdmin) return true; 

        switch (feature) {
            case 'loans':
                return permissions.includes('view_loans');
            case 'deposits': 
                return permissions.includes('manage_deposits');
            case 'members':  
                return permissions.includes('manage_members');
            case 'reports':
                return permissions.includes('view_reports');
            case 'accounting':
                return permissions.includes('manage_accounting');
            case 'bank':
                return permissions.includes('access_bank');
            case 'cash_tools':
                return permissions.includes('access_cash_tools');
            case 'create-user':
                return false; 
            default:
                return false;
        }
    };

    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem("theme");
            return savedTheme ? savedTheme === "dark" : true; 
        }
        return true;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if (isDarkMode) {
            root.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            root.classList.add("light");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileOpen && !event.target.closest('#admin-profile-menu')) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isProfileOpen]);

    const toggleTheme = () => setIsDarkMode((prev) => !prev);

    const NavLink = ({ name, label, icon: Icon }) => {
        const isPlaceholder = name === "#";
        const active = !isPlaceholder && route().current(name);
        
        return (
            <Link
                href={isPlaceholder ? "#" : route(name)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 
                    ${active 
                        ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:shadow-[0_0_0_1px_rgba(52,211,153,0.28)]" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-emerald-800 dark:text-slate-200/80 dark:hover:bg-white/5 dark:hover:text-emerald-100"
                    }`}
            >
                <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs transition-all
                        ${active
                            ? "bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-400/10 dark:border-emerald-300/40 dark:text-emerald-200"
                            : "bg-white border-slate-200 text-slate-500 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-emerald-600 dark:bg-white/5 dark:border-white/10 dark:text-slate-200/70 dark:group-hover:bg-emerald-400/10 dark:group-hover:border-emerald-300/30 dark:group-hover:text-emerald-100"
                        }`}
                >
                    <Icon size={16} />
                </span>
                <span>{label}</span>
            </Link>
        );
    };

    const SubLink = ({ name, label }) => {
        const active = route().current(name);
        return (
            <Link
                href={route(name)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ml-3
                    ${active
                        ? "text-emerald-700 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-400/10"
                        : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700 dark:text-slate-300/80 dark:hover:text-emerald-200 dark:hover:bg-white/5"
                    }`}
            >
                <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"}`} />
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <div className="min-h-screen transition-colors duration-300 bg-gray-50 text-slate-900 dark:bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(16,185,129,0.25),transparent_45%),radial-gradient(900px_circle_at_80%_0%,rgba(34,197,94,0.18),transparent_42%),linear-gradient(135deg,#04130e,#050b12_45%,#04130e)] dark:text-slate-100">
            
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            <div className="flex min-h-screen overflow-x-hidden">
                <aside 
                    className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 backdrop-blur-xl shadow-sm dark:shadow-[0_0_30px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-emerald-50 via-white to-slate-50 dark:from-emerald-900/60 dark:via-emerald-950/40 dark:to-slate-950/40">
                        <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 dark:bg-white/10 dark:border-white/15 flex items-center justify-center overflow-hidden shadow-sm dark:shadow-inner">
                            <img src="/images/logo/pis_logo.png" alt="PIS Logo" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900 dark:text-emerald-50 leading-tight">Admin Portal</h1>
                            <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-200/70">PMPC System</p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col flex-1 overflow-y-auto py-6 px-4 scrollbar-hide">
                        <nav className="space-y-1.5">
                            <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-200/50 mb-2">Main</p>
                            
                            {(!isAccountingClerk && !isBookkeeper) && (
                                <NavLink name="admin.dashboard" label="Dashboard" icon={LayoutDashboard} />
                            )}

                            {/* ACCOUNTING SECTION */}
                            {(canAccess('accounting') || canAccess('bank') || canAccess('cash_tools')) && (
                                <>
                                    <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-200/50 mb-2 mt-6">Accounting</p>
                                    
                                    {/* Data Entry & Operations */}
                                    {canAccess('accounting') && <NavLink name="admin.accounting.ledger.index" label="General Ledger" icon={BookOpen} />}
                                    {canAccess('bank') && <NavLink name="admin.accounting.bank.index" label="Bank Records" icon={Landmark} />}
                                    
                                    {canAccess('cash_tools') && (
                                        <>
                                            <NavLink name="admin.accounting.petty.index" label="Petty Cash Fund" icon={Wallet2} />
                                            <NavLink name="admin.accounting.ewallet.index" label="E-Wallet Logs" icon={Smartphone} />
                                        </>
                                    )}
                                    
                                    {canAccess('accounting') && (
                                        <>
                                            <NavLink name="admin.accounting.ppe.index" label="PPE Depreciation" icon={Briefcase} />
                                            <NavLink name="admin.accounting.chart.index" label="Chart of Accounts" icon={Layers} />
                                            <NavLink name="admin.accounting.journal.index" label="General Journal" icon={PenTool} />
                                        </>
                                    )}

                                    {/* Accounting Reports */}
                                    {canAccess('accounting') && (
                                        <>
                                            <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-200/50 mb-2 mt-4">Financial Reports</p>
                                            <NavLink name="admin.accounting.reports.trial-balance" label="Trial Balance" icon={Scale} />
                                            {/* Note: Financial Statements is accessed via the General Ledger page now! */}
                                        </>
                                    )}
                                </>
                            )}
                            
                            {(!isAccountingClerk && !isBookkeeper) && (
                                <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-200/50 mb-2 mt-6">Transactions</p>
                            )}

                            {canAccess('members') && <NavLink name="admin.members.index" label="Manage Members" icon={Users} />}
                            {canAccess('loans') && <NavLink name="admin.loans" label="Loan Applications" icon={CreditCard} />}

                            {canAccess('deposits') && (
                                <>
                                    <NavLink name="admin.share-capital.index" label="Capital Contribution" icon={Banknote} />
                                    <NavLink name="admin.time.index" label="Time Deposit" icon={Hourglass} />

                                    <div>
                                        <button onClick={() => setDepositsOpen(!depositsOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${depositsOpen ? "text-slate-900 dark:text-white" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"}`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs transition-all ${depositsOpen ? "bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/10 dark:text-white" : "bg-white border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-400"}`}>
                                                    <PiggyBank size={16} />
                                                </span>
                                                <span>Savings Deposit</span>
                                            </div>
                                            <ChevronDown size={16} className={`transition-transform duration-200 text-slate-400 ${depositsOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        <AnimatePresence>
                                            {depositsOpen && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="mt-1 space-y-1 relative ml-3 border-l-2 border-slate-100 dark:border-white/10 pl-1">
                                                        <SubLink name="admin.savings.index" label="Savings Deposit" />
                                                        <SubLink name="admin.savings.withdrawal.index" label="Withdrawal Request" />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            )}

                            {(!isAccountingClerk && !isBookkeeper) && (
                                <>
                                    <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-200/50 mb-2 mt-6">Content</p>
                                    <NavLink name="admin.news.index" label="News & Updates" icon={Megaphone} />
                                    <NavLink name="admin.gallery.index" label="Gallery" icon={Image} />
                                </>
                            )}

                            {(isSuperAdmin || canAccess('reports')) && (
                                <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-200/50 mb-2 mt-6">Maintenance</p>
                            )}
                            
                            {isSuperAdmin && <NavLink name="admin.loan-settings.index" label="Loan Settings" icon={Bell} />}
                            {canAccess('reports') && <NavLink name="admin.reports" label="Reports" icon={BarChart3} />}

                        </nav>
                        
                        <div className="mt-auto pt-6 text-[10px] text-slate-400 dark:text-white/20 text-center">
                            Admin Console v2.0
                        </div>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col min-h-screen">
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-950/55 backdrop-blur-xl px-4 sm:px-6 transition-colors duration-300">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-white/5">
                                <MenuIcon size={24} />
                            </button>
                            <div className="hidden sm:block"><h2 className="text-sm font-semibold text-slate-800 dark:text-white">Admin Dashboard</h2></div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            <button onClick={toggleTheme} className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-emerald-300/30 transition text-slate-600 dark:text-slate-200" aria-label="Toggle Theme">
                                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <div className="relative" id="admin-profile-menu">
                                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-white/10 transition-colors hover:opacity-80">
                                    <div className="hidden md:block text-right leading-tight">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{auth?.user?.name || 'Administrator'}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{auth?.user?.role?.replace(/-/g, ' ') || 'Staff'}</p>
                                    </div>
                                    <div className="h-9 w-9 rounded-full bg-emerald-600 border-2 border-white dark:border-emerald-500/30 flex items-center justify-center text-white font-bold shadow-md">
                                        {auth?.user?.name ? auth.user.name.charAt(0) : 'A'}
                                    </div>
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-3 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden z-50">
                                            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 md:hidden">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{auth?.user?.name || 'Administrator'}</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{auth?.user?.role?.replace(/-/g, ' ') || 'Staff'}</p>
                                            </div>
                                            
                                            <div className="p-1">
                                                <Link href={route("admin.profile.edit")} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                                    <User size={16} /><span>My Profile</span>
                                                </Link>

                                                {isSuperAdmin && (
                                                    <Link href={route("admin.create-user")} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                                        <UserPlus size={16} /><span>Add Admin</span>
                                                    </Link>
                                                )}
                                            </div>

                                            <div className="p-1 border-t border-slate-100 dark:border-white/5">
                                                <Link href={route("admin.logout")} method="post" as="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                                                    <LogOut size={16} /><span>Sign Out</span>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </header>

                    {/* PAGE CONTENT */}
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto animate-in fade-in zoom-in duration-300">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}