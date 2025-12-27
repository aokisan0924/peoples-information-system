import { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { Menu, X, ChevronDown } from "lucide-react";

export default function PublicLayout({ children }) {
    const { url } = usePage();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false); // mobile dropdown
    const [aboutDesktopOpen, setAboutDesktopOpen] = useState(false); // desktop dropdown

    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formattedDay = currentDateTime.toLocaleDateString("en-PH", {
        weekday: "long",
    });

    const formattedDate = currentDateTime.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "2-digit",
    });

    const formattedTime = currentDateTime.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    const isActive = (path) => url === path;
    const isAbout = url.startsWith("/about");

    const toggleMobileMenu = () => {
        setMobileOpen((prev) => !prev);
        if (!mobileOpen) setAboutOpen(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* FIXED HEADER WRAPPER — Date/Time + Navbar */}
            <div className="fixed top-0 left-0 right-0 z-50">
                {/* DATE / TIME BAR */}
                <div className="w-full bg-gray-900 text-gray-100 text-xs sm:text-sm">
                    <div className="container mx-auto px-6 py-1.5 flex justify-end">
                        <span className="font-medium">
                            {formattedDay}, {formattedDate} · {formattedTime}
                        </span>
                    </div>
                </div>

                {/* NAVBAR */}
                <nav className="backdrop-blur-lg bg-white/70 border-b border-gray-200/60 shadow-sm">
                    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                        {/* LOGO */}
                        <Link href="/" className="flex items-center space-x-3">
                            <img src="/images/logo/pis_logo.png" className="h-10" />
                            <span className="text-xl font-bold text-green-700 tracking-tight">
                                People&apos;s MPC
                            </span>
                        </Link>

                        {/* DESKTOP MENU */}
                        <div className="hidden md:flex items-center space-x-6 text-[15px] font-medium">
                            {/* HOME */}
                            <Link
                                href="/"
                                className={`relative px-3 py-1 transition ${
                                    isActive("/")
                                        ? "text-green-700 font-semibold"
                                        : "text-gray-700 hover:text-green-700"
                                }`}
                            >
                                {isActive("/") && (
                                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-green-600 rounded-full" />
                                )}
                                Home
                            </Link>

                            {/* ABOUT (click dropdown) */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setAboutDesktopOpen((prev) => !prev)}
                                    className={`flex items-center gap-1 px-3 py-1 transition ${
                                        isAbout
                                            ? "text-green-700 font-semibold"
                                            : "text-gray-700 hover:text-green-700"
                                    }`}
                                >
                                    About
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform ${
                                            aboutDesktopOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {aboutDesktopOpen && (
                                    <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                        <Link
                                            href="/about/pmpc"
                                            className={`block px-4 py-2.5 text-sm hover:bg-green-50 ${
                                                url === "/about/pmpc"
                                                    ? "text-green-700 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                            onClick={() => setAboutDesktopOpen(false)}
                                        >
                                            About PMPC
                                        </Link>

                                        <Link
                                            href="/about/management"
                                            className={`block px-4 py-2.5 text-sm hover:bg-green-50 ${
                                                url === "/about/management"
                                                    ? "text-green-700 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                            onClick={() => setAboutDesktopOpen(false)}
                                        >
                                            Management
                                        </Link>

                                        <Link
                                            href="/about/board-of-directors"
                                            className={`block px-4 py-2.5 text-sm hover:bg-green-50 ${
                                                url === "/about/board-of-directors"
                                                    ? "text-green-700 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                            onClick={() => setAboutDesktopOpen(false)}
                                        >
                                            Board of Directors
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* NEWS (New Link) */}
                            <Link
                                href="/news"
                                className={`relative px-3 py-1 transition ${
                                    isActive("/news")
                                        ? "text-green-700 font-semibold"
                                        : "text-gray-700 hover:text-green-700"
                                }`}
                            >
                                {isActive("/news") && (
                                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-green-600 rounded-full" />
                                )}
                                News
                            </Link>

                            {/* GALLERY */}
                            <Link
                                href="/gallery"
                                className={`relative px-3 py-1 transition ${
                                    isActive("/gallery")
                                        ? "text-green-700 font-semibold"
                                        : "text-gray-700 hover:text-green-700"
                                }`}
                            >
                                {isActive("/gallery") && (
                                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-green-600 rounded-full" />
                                )}
                                Gallery
                            </Link>

                            {/* PRODUCTS & SERVICES */}
                            <Link
                                href="/products-services"
                                className={`relative px-3 py-1 transition ${
                                    isActive("/products-services")
                                        ? "text-green-700 font-semibold"
                                        : "text-gray-700 hover:text-green-700"
                                }`}
                            >
                                {isActive("/products-services") && (
                                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-green-600 rounded-full" />
                                )}
                                Products & Services
                            </Link>

                            {/* CALCULATOR */}
                            <Link
                                href="/calculator"
                                className={`relative px-3 py-1 transition ${
                                    isActive("/calculator")
                                        ? "text-green-700 font-semibold"
                                        : "text-gray-700 hover:text-green-700"
                                }`}
                            >
                                {isActive("/calculator") && (
                                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-green-600 rounded-full" />
                                )}
                                Calculator
                            </Link>

                            {/* CONTACT */}
                            <Link
                                href="/contact"
                                className={`relative px-3 py-1 transition ${
                                    isActive("/contact")
                                        ? "text-green-700 font-semibold"
                                        : "text-gray-700 hover:text-green-700"
                                }`}
                            >
                                {isActive("/contact") && (
                                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-green-600 rounded-full" />
                                )}
                                Contact
                            </Link>

                            {/* LOGIN (Green Pill Button) */}
                            <Link
                                href="/login"
                                onClick={() => setMobileOpen(false)}
                                className={`mx-6 my-3 text-center px-5 py-3 rounded-full text-[15px] font-semibold shadow-sm
                                    ${
                                        isActive("/login")
                                            ? "bg-green-700 text-white"
                                            : "bg-green-600 text-white hover:bg-green-700"
                                    }
                                `}
                            >
                                Login
                            </Link>
                        </div>

                        {/* MOBILE MENU BUTTON */}
                        <button className="md:hidden text-gray-700" onClick={toggleMobileMenu}>
                            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>

                    {/* MOBILE MENU */}
                    <div
                        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                            mobileOpen ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                    >
                        <div className="bg-white/90 backdrop-blur-md shadow-lg border-t border-gray-200 flex flex-col">
                            {/* HOME */}
                            <Link
                                href="/"
                                onClick={() => setMobileOpen(false)}
                                className={`px-6 py-3 border-b border-gray-100 text-[15px] ${
                                    isActive("/")
                                        ? "bg-green-50 text-green-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                Home
                            </Link>

                            {/* ABOUT MOBILE COLLAPSIBLE */}
                            <button
                                type="button"
                                onClick={() => setAboutOpen((prev) => !prev)}
                                className={`px-6 py-3 border-b border-gray-100 text-[15px] flex items-center justify-between ${
                                    isAbout
                                        ? "bg-green-50 text-green-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <span>About</span>
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                        aboutOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {aboutOpen && (
                                <div className="bg-white border-b border-gray-100">
                                    <Link
                                        href="/about/pmpc"
                                        onClick={() => setMobileOpen(false)}
                                        className={`block pl-10 pr-6 py-2.5 text-sm border-b border-gray-100 ${
                                            url === "/about/pmpc"
                                                ? "text-green-700 font-semibold bg-green-50"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        About PMPC
                                    </Link>

                                    <Link
                                        href="/about/management"
                                        onClick={() => setMobileOpen(false)}
                                        className={`block pl-10 pr-6 py-2.5 text-sm border-b border-gray-100 ${
                                            url === "/about/management"
                                                ? "text-green-700 font-semibold bg-green-50"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        Management
                                    </Link>

                                    <Link
                                        href="/about/board-of-directors"
                                        onClick={() => setMobileOpen(false)}
                                        className={`block pl-10 pr-6 py-2.5 text-sm ${
                                            url === "/about/board-of-directors"
                                                ? "text-green-700 font-semibold bg-green-50"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        Board of Directors
                                    </Link>
                                </div>
                            )}

                            {/* NEWS (Mobile Link) */}
                            <Link
                                href="/news"
                                onClick={() => setMobileOpen(false)}
                                className={`px-6 py-3 border-b border-gray-100 text-[15px] ${
                                    isActive("/news")
                                        ? "bg-green-50 text-green-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                News
                            </Link>

                            {/* GALLERY */}
                            <Link
                                href="/gallery"
                                onClick={() => setMobileOpen(false)}
                                className={`px-6 py-3 border-b border-gray-100 text-[15px] ${
                                    isActive("/gallery")
                                        ? "bg-green-50 text-green-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                Gallery
                            </Link>

                            {/* PRODUCTS & SERVICES */}
                            <Link
                                href="/products-services"
                                onClick={() => setMobileOpen(false)}
                                className={`px-6 py-3 border-b border-gray-100 text-[15px] ${
                                    isActive("/products-services")
                                        ? "bg-green-50 text-green-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                Products & Services
                            </Link>

                            {/* CALCULATOR */}
                            <Link
                                href="/calculator"
                                onClick={() => setMobileOpen(false)}
                                className={`px-6 py-3 border-b border-gray-100 text-[15px] ${
                                    isActive("/calculator")
                                        ? "bg-green-50 text-green-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                Calculator
                            </Link>

                            {/* CONTACT */}
                            <Link
                                href="/contact"
                                onClick={() => setMobileOpen(false)}
                                className={`px-6 py-3 text-[15px] ${
                                    isActive("/contact")
                                        ? "bg-green-50 text-green-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                Contact
                            </Link>

                            {/* LOGIN (Green Pill Button) */}
                            <Link
                                href="/login"
                                className={`ml-2 px-5 py-2 rounded-full text-sm font-semibold shadow-sm transition
                                    ${
                                        isActive("/login")
                                            ? "bg-green-700 text-white"
                                            : "bg-green-600 text-white hover:bg-green-700"
                                    }
                                `}
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </nav>
            </div>

            {/* CONTENT — padding accounts for fixed header (date bar + navbar) */}
            <main className="pt-[7.2rem] flex-1">{children}</main>

            {/* FOOTER */}
            <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-12">
                <div className="container mx-auto px-6 py-10">
                    {/* Top row: Logo + short text */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <img
                                src="/images/logo/pis_logo.png"
                                className="h-8 opacity-80"
                                alt="People's MPC Logo"
                            />
                            <div>
                                <p className="text-gray-100 font-semibold">
                                    People&apos;s Multi-Purpose Cooperative
                                </p>
                                <p className="text-xs text-gray-400">
                                    Serving the AFP community and their families.
                                </p>
                                <p className="text-xs text-emerald-300 font-medium mt-1">
                                    CDA Registration No. 9520-16005634
                                </p>
                            </div>
                        </div>

                        <div className="text-sm text-gray-400 text-left md:text-right">
                            <p className="font-medium text-gray-200">
                                Official Channels
                            </p>
                            <p>
                                Email:{" "}
                                <a
                                    href="mailto:peoplesmpcooperative@gmail.com"
                                    className="text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline"
                                >
                                    peoplesmpcooperative@gmail.com
                                </a>
                            </p>
                            <p>
                                Facebook:{" "}
                                <a
                                    href="https://www.facebook.com/PMPCooperative"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline"
                                >
                                    facebook.com/PMPCooperative
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Offices grid */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        {/* Main Office */}
                        <div>
                            <h3 className="text-gray-100 font-semibold mb-2">
                                Main Office
                            </h3>
                            <p className="text-gray-400 text-xs mb-2 uppercase tracking-[0.12em]">
                                Isabela
                            </p>
                            <p className="text-gray-300 text-sm">
                                Stall #2, Principe Building, Maharlika Highway,
                                Upi, Gamu, Isabela
                            </p>
                            <div className="mt-3 space-y-1 text-xs text-gray-400">
                                <p>
                                    Email:{" "}
                                    <a
                                        href="mailto:peoplesmpcooperative@gmail.com"
                                        className="text-emerald-300 hover:text-emerald-200"
                                    >
                                        peoplesmpcooperative@gmail.com
                                    </a>
                                </p>
                                <p>
                                    Facebook:{" "}
                                    <a
                                        href="https://www.facebook.com/PMPCooperative"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-300 hover:text-emerald-200"
                                    >
                                        PMPCooperative
                                    </a>
                                </p>
                                <p>Mobile: +63 965 953 2196</p>
                            </div>
                        </div>

                        {/* Cubao Satellite Office */}
                        <div>
                            <h3 className="text-gray-100 font-semibold mb-2">
                                Cubao Satellite Office
                            </h3>
                            <p className="text-gray-400 text-xs mb-2 uppercase tracking-[0.12em]">
                                Quezon City
                            </p>
                            <p className="text-gray-300 text-sm">
                                20-E, 2nd Camarilla St., Brgy. San Roque,
                                Cubao, Quezon City
                            </p>
                            <div className="mt-3 space-y-1 text-xs text-gray-400">
                                <p>
                                    Email:{" "}
                                    <a
                                        href="mailto:peoplesmpcooperative@gmail.com"
                                        className="text-emerald-300 hover:text-emerald-200"
                                    >
                                        peoplesmpcooperative@gmail.com
                                    </a>
                                </p>
                                <p>
                                    Facebook:{" "}
                                    <a
                                        href="https://www.facebook.com/PMPCooperative"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-300 hover:text-emerald-200"
                                    >
                                        PMPCooperative
                                    </a>
                                </p>
                                <p>Tel.: (02) 8848-9760</p>
                                <p>Mobile: +63 953 033 1580</p>
                            </div>
                        </div>

                        {/* Fort Magsaysay Satellite Office */}
                        <div>
                            <h3 className="text-gray-100 font-semibold mb-2">
                                Fort Magsaysay Satellite Office
                            </h3>
                            <p className="text-gray-400 text-xs mb-2 uppercase tracking-[0.12em]">
                                Nueva Ecija
                            </p>
                            <p className="text-gray-300 text-sm">
                                Fort Ramon Magsaysay, Palayan City, Nueva Ecija
                            </p>
                            <div className="mt-3 space-y-1 text-xs text-gray-400">
                                <p>
                                    Email:{" "}
                                    <a
                                        href="mailto:peoplesmpcooperative@gmail.com"
                                        className="text-emerald-300 hover:text-emerald-200"
                                    >
                                        peoplesmpcooperative@gmail.com
                                    </a>
                                </p>
                                <p>
                                    Facebook:{" "}
                                    <a
                                        href="https://www.facebook.com/PMPCooperative"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-300 hover:text-emerald-200"
                                    >
                                        PMPCooperative
                                    </a>
                                </p>
                                <p>Mobile: +63 968 263 5186</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom strip */}
                    <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-gray-500 flex flex-col md:flex-row items-center justify-between gap-2">
                        <div className="text-center md:text-left">
                            © {new Date().getFullYear()} People&apos;s Multi-Purpose Cooperative.
                            All rights reserved.
                        </div>
                        <div className="text-center text-[11px] text-gray-400">
                            People&apos;s Information System · Kaagapay mo sa Pag-Asenso
                        </div>
                        <div className="text-center md:text-right text-[11px] text-gray-400">
                            PIS Version 1.0.0
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}