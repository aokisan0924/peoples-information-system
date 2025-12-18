import { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    ArrowUp,
    ChevronRight,
    Briefcase,
    GraduationCap,
    ShieldAlert,
    Sprout,
    Landmark,
    Plus,
    ClipboardList,
    ShieldCheck,
    HandCoins,
} from "lucide-react";

export default function LoanApplication() {
    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowScrollButton(window.scrollY > 300);
        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // --- Loan types (display only, all static here) ---
    const loanTypes = [
        {
            key: "salary",
            icon: <Briefcase className="h-7 w-7 text-green-700" />,
            title: "Salary Loan",
            tag: "Up to 5 years",
            description:
                "For active AFP and civilian human resource members, ideal for personal and entrepreneurial needs.",
            bulletPoints: [
                "Available to active AFP and Civilian Human Resource members.",
                "Preferred for medium-scale and entrepreneurial expenses.",
                "Maximum term of payment: 60 months or 5 years.",
            ],
        },
        {
            key: "pension",
            icon: <Landmark className="h-7 w-7 text-green-700" />,
            title: "Pension Loan",
            tag: "Up to 5 years",
            description:
                "For member-pensioners and beneficiaries, suited for health, business, or emergency needs.",
            bulletPoints: [
                "Available to member-pensioners and beneficiaries.",
                "Can be used for health, business, or other ventures.",
                "Maximum term of payment: 60 months or 5 years.",
            ],
        },
        {
            key: "pettyCash",
            icon: <HandCoins className="h-7 w-7 text-green-700" />,
            title: "Petty Cash Loan",
            tag: "Up to ₱30,000 • 3 mos.",
            description:
                "Short-term loan facility for small, urgent cash needs of qualified members.",
            bulletPoints: [
                "Maximum loanable amount of ₱30,000.00.",
                "Short term: up to 3 months.",
                "Ideal for quick, recurring, and smaller cash requirements.",
            ],
        },
    ];

    // --- Requirements per branch category (including petty cash) ---
    const requirements = [
        {
            key: "activeMilitary",
            title: "Active Military",
            subtitle: "For active AFP personnel",
            badge: "ACTIVE MILITARY",
            items: [
                "2 Latest Payslip",
                "Military ID with 3 signature",
                "Latest 2x2 Picture",
                "Re-Enlistment Order",
                "Confirmation Order",
                "Unified Clearance",
                "Willing to Re-Enlist Affidavit",
                "ATM Photocopy w/ 3 signature",
            ],
        },
        {
            key: "retiredMilitary",
            title: "Retired Military",
            subtitle: "For retired AFP personnel receiving pension",
            badge: "RETIRED MILITARY / RETIRED",
            items: [
                "Retirement Order",
                "Pensioner's ID & Any Gov't Issued ID with 3 signature",
                "2 Latest 2x2 Picture",
                "ATM Photocopy w/ 3 signature",
            ],
        },
        {
            key: "beneficiaryPensioner",
            title: "Beneficiary / Pensioner",
            subtitle: "For beneficiaries or pensioners under a member account",
            badge: "BENEFICIARY / PENSIONER",
            items: [
                "Retirement Order",
                "Declaration of Beneficiaries",
                "Pensioner's ID & Any Gov't Issued ID with 3 signature",
                "Marriage Contract / Birth Certificate",
                "Death Certificate",
                "ATM Photocopy w/ 3 signature",
                "2 Latest 2x2 Picture",
            ],
        },
        {
            key: "reservist",
            title: "Reservist",
            subtitle: "For members in the reserve force",
            badge: "RESERVIST",
            items: [
                "Order of Commission or Enlistment",
                "2 Latest 2x2 Picture",
                "Authenticated Assignment Order",
                "Holding unit's Clearance and Commander's Approval",
                "Postdated Check / Auto Debit Account",
                "Reservist ID with 3 signature",
                "2 Gov't Issued ID with 3 Signature",
            ],
        },
        {
            key: "cdea",
            title: "CDEA",
            subtitle: "For CDEA members and personnel",
            badge: "CDEA",
            items: [
                "2 Latest Payslip",
                "Appointment Order",
                "2 2x2 Picture",
                "Company ID & Any Gov't ID with 3 signature",
                "ATM Photocopy w/ 3 signature",
            ],
        },
        {
            key: "pettyCashReq",
            title: "Petty Cash Loan",
            subtitle: "Requirements for Petty Cash Loan application",
            badge: "ALL ELIGIBLE MEMBERS",
            items: [
                "Membership form",
                "Petty cash loan form with Finance Officer signature",
                "Military ID",
                "Landbank ATM",
            ],
        },
    ];

    return (
        <PublicLayout>
            <Head title="Loan Application" />

            {/* HERO */}
            <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-700 to-green-800 text-white py-16 sm:py-20 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-emerald-100 mb-4">
                            Apply for Loan • People&apos;s MPC
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                            Flexible Loan Options<br className="hidden sm:block" /> for Every
                            Member Category
                        </h1>

                        <p className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed">
                            Choose the loan that fits your goals and check the documents needed
                            based on your branch of service. Complete requirements mean faster,
                            smoother approval.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <Link
                                href="/member/register"
                                className="inline-flex items-center justify-center px-6 sm:px-7 py-2.5 sm:py-3 rounded-lg bg-white text-green-900 font-semibold text-sm sm:text-base shadow-md hover:bg-emerald-50 transition"
                            >
                                Become a Member
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Link>
                            <a
                                href="#requirements"
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-white/60 text-sm font-medium text-white/90 hover:bg-white/10 transition"
                            >
                                View Loan Requirements
                            </a>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-4 text-xs sm:text-sm text-emerald-50/90">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                <span>No hidden charges</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                <span>Tailored to AFP & beneficiaries</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:justify-self-end">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-6 lg:p-7 shadow-xl">
                            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100 mb-2">
                                Snapshot
                            </p>
                            <h2 className="text-lg sm:text-xl font-semibold mb-3">
                                Loan Types at a Glance
                            </h2>
                            <ul className="space-y-3 text-sm text-emerald-50/95">
                                <li className="flex justify-between">
                                    <span>Salary Loan</span>
                                    <span className="text-emerald-100/90 text-xs">
                                        Up to 5 years
                                    </span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Pension Loan</span>
                                    <span className="text-emerald-100/90 text-xs">
                                        Up to 5 years
                                    </span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Petty Cash Loan</span>
                                    <span className="text-emerald-100/90 text-xs">
                                        Up to ₱30,000 / 3 mos.
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Hero decorations */}
                <div className="pointer-events-none absolute -top-8 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 bg-emerald-400/25 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
            </section>

            {/* LOAN TYPES SECTION */}
            <section className="bg-white py-14 sm:py-16 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-green-700/80">
                                Loan Options
                            </p>
                            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                                Choose the loan that fits your need
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
                                From income-bridging salary loans to short-term petty cash
                                facilities, People&apos;s MPC offers products matched to our
                                members&apos; situations.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-7">
                        {loanTypes.map((loan, index) => (
                            <motion.div
                                key={loan.key}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition p-6 flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-11 w-11 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
                                            {loan.icon}
                                        </div>
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                            {loan.title}
                                        </h3>
                                    </div>
                                    {loan.tag && (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-green-700 border border-emerald-100">
                                            {loan.tag}
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {loan.description}
                                </p>

                                <ul className="mt-3 space-y-1.5 text-xs sm:text-sm text-gray-700 leading-relaxed list-disc list-outside ml-4">
                                    {loan.bulletPoints.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* REQUIREMENTS SECTION */}
            <section
                id="requirements"
                className="bg-gray-50 border-t border-gray-100 py-14 sm:py-16 px-6 sm:px-10"
            >
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-green-700/80">
                                Requirements
                            </p>
                            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                                Loan checklist per branch service
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
                                Check the documents you need based on your category. Bringing
                                complete requirements helps us process your application faster.
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                            <ClipboardList className="h-4 w-4 text-green-700" />
                            <span>Original and photocopy may be required for verification.</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {requirements.map((group, index) => (
                            <motion.div
                                key={group.key}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition p-6 flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                            {group.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {group.subtitle}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-700 border border-emerald-100">
                                        {group.badge}
                                    </span>
                                </div>

                                <ul className="mt-3 space-y-2 text-sm text-gray-700 leading-relaxed">
                                    {group.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Scroll-To-Top Button */}
            {showScrollButton && (
                <motion.button
                    onClick={scrollToTop}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    whileHover={{ scale: 1.08 }}
                    className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-green-700 text-white p-2.5 sm:p-3 rounded-full shadow-lg"
                >
                    <ArrowUp size={22} />
                </motion.button>
            )}
        </PublicLayout>
    );
}
