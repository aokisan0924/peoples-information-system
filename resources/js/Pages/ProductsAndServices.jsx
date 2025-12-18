import { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    ChevronRight,
    Users,
    PiggyBank,
    Wallet,
    Star,
    Briefcase,
    ShieldCheck,
    Landmark,
    ArrowUp,
} from "lucide-react";

export default function ProductsAndServices() {
    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowScrollButton(window.scrollY > 300);
        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const products = [
        {
            icon: <Users className="h-7 w-7" />,
            title: "Lifetime Membership",
            category: "Membership",
            description:
                "Be a lifetime member of People’s MPC and enjoy full cooperative privileges, participation rights, and long-term benefits.",
            link: "/member-benefit",
            linkLabel: "Learn more",
            highlight: "One-time membership, lifetime privileges.",
        },
        {
            icon: <Briefcase className="h-7 w-7" />,
            title: "Long Term Loan",
            category: "Loans",
            description:
                "Affordable, structured long-term financing for personal, business, home improvement, and other major needs.",
            link: "/loan-information",
            linkLabel: "Learn more",
            highlight: "Flexible terms and competitive rates.",
        },
        {
            icon: <PiggyBank className="h-7 w-7" />,
            title: "Savings Deposit",
            category: "Deposits",
            description:
                "Secure daily savings with dependable access, ideal for monthly budgeting and building stable financial habits.",
            link: "/savings-deposit",
            linkLabel: "Learn more",
            highlight: "Daily deposits, semi-annual interest.",
        },
        {
            icon: <Star className="h-7 w-7" />,
            title: "Share Capital Contribution",
            category: "Capital Build-Up",
            description:
                "Own part of the cooperative and grow your capital through annual dividends and patronage refunds.",
            link: "/share-capital",
            linkLabel: "Learn more",
            highlight: "Earn dividends and patronage refund.",
        },
        {
            icon: <Landmark className="h-7 w-7" />,
            title: "Time Deposit",
            category: "Deposits",
            description:
                "Earn higher interest rates by locking in your savings with safe and reliable time deposit terms.",
            link: "/time-deposit",
            linkLabel: "Learn more",
            highlight: "Tiered interest, fixed terms.",
        },
        {
            icon: <Wallet className="h-7 w-7" />,
            title: "Petty Cash Loan",
            category: "Loans",
            description:
                "Small, short-term loans with fast processing — ideal for emergencies and unexpected expenses.",
            link: "/petty-cash",
            linkLabel: "Learn more",
            highlight: "Up to ₱30,000, up to 3 months.",
        },
        {
            icon: <ShieldCheck className="h-7 w-7" />,
            title: "St. Peter Life Plan",
            category: "Protection",
            description:
                "A trusted life plan partnership that provides financial preparation and security for families.",
            link: "/st-peter-life-plan",
            linkLabel: "Learn more",
            highlight: "In partnership with St. Peter Life Plan.",
        },
    ];

    const fadeUp = {
        hidden: { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <>
            <Head title="Products & Services - People's MPC" />

            <PublicLayout>
                {/* HERO — modernized 2-column layout */}
                <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-800 to-green-700 text-white py-16 sm:py-20 px-6 sm:px-10">
                    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.7fr,1.3fr] gap-10 items-center relative z-10">

                        {/* LEFT — Title & Description */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.22em] text-emerald-100 mb-4">
                                People’s MPC • Member Services
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow">
                                Products &amp; Services
                            </h1>

                            <p className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed">
                                Explore a complete range of cooperative services — membership, loans,
                                savings, time deposit, share capital, and life plan programs designed
                                to support members at every stage.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center rounded-lg px-6 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold bg-white text-green-900 shadow-md hover:bg-emerald-50 transition"
                                >
                                    Become a Member
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Link>

                                <a
                                    href="#services"
                                    className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-xs sm:text-sm font-medium bg-white/10 border border-white/40 text-emerald-50 hover:bg-white/20 transition"
                                >
                                    View Services
                                </a>
                            </div>
                        </motion.div>

                        {/* RIGHT — Highlight Card */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="lg:justify-self-end"
                        >
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 sm:p-8 shadow-xl">
                                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100 mb-3">
                                    What We Offer
                                </p>

                                <div className="space-y-4 text-sm text-emerald-50/95">
                                    <div className="flex items-center gap-3">
                                        <Wallet className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Financial Services
                                            </p>
                                            <p className="text-base font-semibold">
                                                Loans, savings, share capital & investments
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Users className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Membership
                                            </p>
                                            <p className="text-base font-semibold">
                                                Lifetime membership with exclusive benefits
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Protection
                                            </p>
                                            <p className="text-base font-semibold">
                                                St. Peter Life Plan & member insurance
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Decorative glows */}
                    <div className="pointer-events-none absolute -top-10 -left-16 w-52 h-52 bg-emerald-400/25 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 bg-emerald-300/30 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
                </section>

                {/* PRODUCTS GRID */}
                <section className="bg-gray-50 py-14 sm:py-16 px-6 sm:px-10">
                    <div className="container mx-auto max-w-6xl">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-green-700/80">
                                    Our Core Services
                                </p>
                                <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                                    Modern, accessible & member-focused
                                </h2>
                                <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
                                    Each service is crafted to meet the real needs of active personnel,
                                    retirees, civilians, and beneficiaries — with clarity and
                                    transparency at the center.
                                </p>
                            </div>
                        </div>

                        {/* Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
                            {products.map((item, index) => (
                                <motion.article
                                    key={item.title}
                                    variants={fadeUp}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ duration: 0.4, delay: index * 0.06 }}
                                    whileHover={{ y: -4 }}
                                    className="group relative bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition overflow-hidden"
                                >
                                    {/* Top gradient accent */}
                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-amber-400" />

                                    <div className="p-6 sm:p-7 flex flex-col h-full">
                                        {/* Icon + category */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-green-700 shadow-sm">
                                                    {item.icon}
                                                </div>
                                                <div className="hidden sm:block">
                                                    <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600">
                                                        {item.category}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                PMPC Program
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                            {item.title}
                                        </h3>

                                        {/* Highlight line */}
                                        {item.highlight && (
                                            <p className="mt-2 text-xs sm:text-sm font-medium text-emerald-700">
                                                {item.highlight}
                                            </p>
                                        )}

                                        {/* Description */}
                                        <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed flex-1">
                                            {item.description}
                                        </p>

                                        {/* Footer link */}
                                        <div className="mt-5 flex items-center justify-between">
                                            <Link
                                                href={item.link}
                                                className="inline-flex items-center text-sm font-semibold text-green-700 group-hover:text-green-600 transition"
                                            >
                                                {item.linkLabel}
                                                <ChevronRight className="ml-1 h-4 w-4" />
                                            </Link>

                                            <span className="text-[11px] text-gray-400 group-hover:text-emerald-500 transition">
                                                Learn more about this service
                                            </span>
                                        </div>
                                    </div>
                                </motion.article>
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
                        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-green-700 text-white p-2.5 sm:p-3 rounded-full shadow-lg hover:bg-green-800 transition"
                    >
                        <ArrowUp size={22} />
                    </motion.button>
                )}
            </PublicLayout>
        </>
    );
}
