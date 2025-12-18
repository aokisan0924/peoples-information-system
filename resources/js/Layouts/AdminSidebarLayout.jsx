import { useState } from "react";
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
} from "lucide-react";
import { Link } from "@inertiajs/react";

export default function AdminSidebarLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [depositsOpen, setDepositsOpen] = useState(true);

    const isActive = (name) => {
        try {
            return route().current(name);
        } catch (e) {
            return false;
        }
    };

    const navLinkClass = (active) =>
        [
            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition",
            active
                ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700",
        ].join(" ");

    const subLinkClass = (active) =>
        [
            "flex items-center gap-2 px-3 py-2 rounded-md text-xs transition",
            active
                ? "bg-emerald-50 text-emerald-700 font-semibold"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700",
        ].join(" ");

    return (
        <>
            {/* Mobile Header (Sticky) */}
            <header className="md:hidden sticky top-0 z-50 flex justify-between items-center px-4 py-3 shadow bg-white/95 backdrop-blur text-black">
                <h1 className="text-lg font-semibold text-emerald-700 tracking-tight">
                    Admin Panel
                </h1>
                <button
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open Sidebar"
                    className="p-2 rounded-md hover:bg-slate-100 transition"
                >
                    <MenuIcon size={24} />
                </button>
            </header>

            <div className="flex min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden">
                {/* Sidebar */}
                <aside
                    className={`fixed top-0 left-0 md:static z-40 w-full md:w-72 bg-white shadow-md md:shadow-lg transition-transform duration-300 ease-in-out
                ${
                    sidebarOpen ? "translate-y-0" : "-translate-y-full"
                } md:translate-y-0 md:min-h-screen`}
                >
                    <div className="flex flex-col h-full">
                        {/* Brand */}
                        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
                            <div>
                                <h2 className="text-xl font-extrabold text-emerald-700 leading-tight">
                                    PIS Admin
                                </h2>
                                <p className="text-[11px] text-slate-500">
                                    People&apos;s Information System
                                </p>
                            </div>
                            <button
                                className="md:hidden text-slate-500 hover:text-slate-700 rounded-full p-1.5 hover:bg-slate-100 transition"
                                onClick={() => setSidebarOpen(false)}
                                aria-label="Close Sidebar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-5 space-y-6 text-sm font-medium overflow-y-auto">
                            {/* Dashboard */}
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">
                                    Main
                                </p>
                                <Link
                                    href={route("admin.dashboard")}
                                    className={navLinkClass(
                                        isActive("admin.dashboard")
                                    )}
                                >
                                    <LayoutDashboard
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                    <span className="truncate block">
                                        Dashboard
                                    </span>
                                </Link>
                            </div>

                            {/* Transactions */}
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">
                                    Transactions
                                </p>

                                {/* Manage Members */}
                                <Link
                                    href={route("admin.members.index")}
                                    className={navLinkClass(
                                        isActive("admin.members.index")
                                    )}
                                >
                                    <Users
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                    <span className="truncate block">
                                        Manage Members
                                    </span>
                                </Link>

                                {/* Loan Applications */}
                                <Link
                                    href={route("admin.loans")}
                                    className={navLinkClass(
                                        isActive("admin.loans")
                                    )}
                                >
                                    <CreditCard
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                    <span className="truncate block">
                                        Loan Applications
                                    </span>
                                </Link>
                                
                                {/* Loan Applications */}
                                <Link
                                    href={route("admin.share-capital.index")}
                                    className={navLinkClass(
                                        isActive("admin.share-capital.index")
                                    )}
                                >
                                    <Banknote
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                    <span className="truncate block">
                                        Capital Contribution
                                    </span>
                                </Link>

                                <Link
                                    href={route("admin.time.index")}
                                    className={navLinkClass(
                                        isActive(
                                            "admin.time.index"
                                        )
                                    )}
                                >
                                    <Hourglass
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                    <span className="truncate block">
                                        Time Deposit
                                    </span>
                                </Link>

                                {/* Deposits & Savings - PARENT MENU */}
                                <div className="mt-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDepositsOpen(
                                                (prevState) => !prevState
                                            )
                                        }
                                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition ${
                                            depositsOpen
                                                ? "bg-emerald-50 text-emerald-800 font-semibold shadow-sm"
                                                : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                                        }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <PiggyBank
                                                size={18}
                                                className="text-emerald-600"
                                            />
                                            <span className="truncate block">
                                                Savings Deposit
                                            </span>
                                        </span>
                                        <ChevronDown
                                            size={16}
                                            className={`transition-transform ${
                                                depositsOpen
                                                    ? "rotate-180"
                                                    : "rotate-0"
                                            }`}
                                        />
                                    </button>

                                    {/* Submenu for deposits + savings */}
                                    {depositsOpen && (
                                        <div className="mt-1 space-y-1 pl-9 border-l border-emerald-50">
                                            <Link
                                                href={route(
                                                    "admin.savings.index"
                                                )}
                                                className={subLinkClass(
                                                    isActive(
                                                        "admin.savings.index"
                                                    )
                                                )}
                                            >
                                                <span className="truncate">
                                                    Savings Deposit
                                                </span>
                                            </Link>

                                            <Link
                                                href={route(
                                                    "admin.savings.withdrawal.index"
                                                )}
                                                className={subLinkClass(
                                                    isActive(
                                                        "admin.savings.withdrawal.index"
                                                    )
                                                )}
                                            >
                                                <span className="truncate">
                                                    Savings Withdrawal Request
                                                </span>
                                            </Link>

                                            
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Maintenance */}
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">
                                    Maintenance
                                </p>

                                <Link
                                    href={route("admin.loan-settings.index")}
                                    className={navLinkClass(
                                        isActive("admin.loan-settings.index")
                                    )}
                                >
                                    <Bell
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                    <span className="truncate block">
                                        Loan Settings
                                    </span>
                                </Link>

                                <Link
                                    href={route("admin.reports")}
                                    className={navLinkClass(
                                        isActive("admin.reports")
                                    )}
                                >
                                    <BarChart3
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                    <span className="truncate block">
                                        Reports
                                    </span>
                                </Link>

                                <Link
                                    className={navLinkClass(false)}
                                    href="#"
                                >
                                    <ShieldCheck
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                    <span className="truncate block">
                                        Security
                                    </span>
                                </Link>

                                <Link
                                    className={navLinkClass(false)}
                                    href="#"
                                >
                                    <Settings
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                    <span className="truncate block">
                                        Settings
                                    </span>
                                </Link>
                            </div>

                            {/* Logout */}
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">
                                    Session
                                </p>
                                <Link
                                    href={route("admin.logout")}
                                    method="post"
                                    as="button"
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition text-red-600 hover:bg-red-50"
                                >
                                    <LogOut size={18} />
                                    <span className="truncate block">
                                        Logout
                                    </span>
                                </Link>
                            </div>
                        </nav>
                    </div>
                </aside>

                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 z-30 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )}

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
                    {children}
                </main>
            </div>
        </>
    );
}
