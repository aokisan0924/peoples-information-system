import { Head, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    UserPlus,
    BadgeCheck,
    Users,
    ShieldCheck,
    Sparkles,
    Percent,
    Clock,
    HandCoins,
    CreditCard,
    HeartHandshake,
} from "lucide-react";

export default function Membership() {
    const benefits = [
        {
            title: "High interest rates on savings and time deposit",
            icon: <Percent className="h-7 w-7" />,
        },
        {
            title: "Lifetime Membership",
            icon: <Users className="h-7 w-7" />,
        },
        {
            title: "No Hidden Charges",
            icon: <CreditCard className="h-7 w-7" />,
        },
        {
            title: "Patronage Refund Every Year",
            icon: <HandCoins className="h-7 w-7" />,
        },
        {
            title: "Fast Transactions",
            icon: <Clock className="h-7 w-7" />,
        },
        {
            title: "Best Customer Care",
            icon: <HeartHandshake className="h-7 w-7" />,
        },
    ];

    return (
        <PublicLayout>
            <Head title="Membership" />

            {/* HERO */}
            <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-700 to-green-800 text-white py-16 sm:py-20 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-10 items-center relative z-10">
                    <div>
                        <div className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-emerald-100 mb-4">
                            Become a PMPC Member
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                            Who can be a{" "}
                            <span className="text-yellow-300">PMPC Member?</span>
                        </h1>

                        <p className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed">
                            The membership of the cooperative is open to all natural persons,
                            Filipino citizens of legal age, with the capacity to contract, and
                            within the common bond and field of membership.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center px-6 sm:px-7 py-2.5 sm:py-3 rounded-lg bg-white text-green-900 font-semibold text-sm sm:text-base shadow-md hover:bg-emerald-50 transition"
                            >
                                Apply for Membership
                                <UserPlus className="ml-2 h-4 w-4" />
                            </Link>
                            <Link
                                href="/loan-information"
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-white/60 text-sm font-medium text-white/90 hover:bg-white/10 transition"
                            >
                                Explore loan programs
                            </Link>
                        </div>
                    </div>

                    <div className="lg:justify-self-end">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-7 shadow-xl">
                            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100 mb-2">
                                Membership at a glance
                            </p>
                            <div className="space-y-3 text-sm text-emerald-50/95">
                                <div className="flex items-start gap-3">
                                    <BadgeCheck className="h-5 w-5 mt-0.5 text-yellow-300 flex-shrink-0" />
                                    <p>
                                        Members enjoy access to loans, savings, dividends, and
                                        patronage refunds based on their participation.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="h-5 w-5 mt-0.5 text-yellow-300 flex-shrink-0" />
                                    <p>
                                        Regular members have full rights and privileges, including
                                        the right to vote and be voted upon.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Sparkles className="h-5 w-5 mt-0.5 text-yellow-300 flex-shrink-0" />
                                    <p>
                                        Associate members enjoy almost all benefits except voting
                                        rights, with a pathway to become regular members.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero decorations */}
                <div className="pointer-events-none absolute -top-8 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 bg-emerald-400/25 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
            </section>

            {/* MEMBERSHIP TYPES */}
            <section className="bg-white py-12 sm:py-16 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-green-700/80">
                                Membership Categories
                            </p>
                            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                                Types of PMPC Members
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl">
                                PMPC recognizes Regular and Associate Members, each with specific
                                qualifications and privileges in accordance with R.A. 9520 and
                                the cooperative&apos;s by-laws.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                        {/* Regular Member */}
                        <motion.article
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                            className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition p-6 sm:p-7"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-11 w-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-green-700" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                        Regular Member
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Full rights &amp; privileges, including the right to vote
                                        and be voted upon.
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                                One who complied with all membership requirements. He is
                                entitled to all the rights and privileges of membership and shall
                                have the right to vote and be voted upon.
                            </p>

                            <ol className="list-decimal list-outside ml-5 space-y-1.5 text-sm text-gray-700 leading-relaxed">
                                <li>Has paid the minimum Capital Contribution.</li>
                                <li>Has no delinquent account with the cooperative.</li>
                                <li>
                                    Have continuously patronized the cooperative services for at
                                    least five (5) years.
                                </li>
                                <li>
                                    A Member in good standing for the last two (2) years.
                                </li>
                                <li>
                                    Completed or willingness to complete within the prescribed
                                    period the required education and training whichever is
                                    applicable.
                                </li>
                                <li>
                                    Other qualifications prescribed in the implementing rules and
                                    regulations (IRR) of R.A. 9520.
                                </li>
                            </ol>
                        </motion.article>

                        {/* Associate Member */}
                        <motion.article
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.12 }}
                            className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition p-6 sm:p-7"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                                    <UserPlus className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                        Associate Member
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Enjoys benefits of membership but without voting rights.
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                                One who complied with all membership requirements and shall only
                                be entitled to such rights and privileges provided by this
                                by-law, however has no right to vote and be voted upon.
                            </p>

                            <ul className="list-disc list-outside ml-5 space-y-1.5 text-sm text-gray-700 leading-relaxed">
                                <li>
                                    Completed the prescribed Pre-Membership Education Seminar
                                    (PMES).
                                </li>
                                <li>
                                    Undertake and uphold the By-Laws, policies, guidelines, rules
                                    and regulations promulgated by the Board of Directors and the
                                    General Assembly.
                                </li>
                                <li>Paid the required membership fee.</li>
                                <li>
                                    Paid the required initial minimum share capital or initial
                                    investment.
                                </li>
                            </ul>

                            <p className="mt-4 text-xs sm:text-sm text-gray-600">
                                Associate members are entitled to all rights and privileges
                                except the right to vote and be voted upon.
                            </p>
                        </motion.article>
                    </div>
                </div>
            </section>

            {/* BENEFITS SECTION */}
            <section className="bg-gray-50 py-14 sm:py-20 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-green-700/80">
                                Member Benefits & Privileges
                            </p>
                            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
                                PMPC Member&apos;s Benefits
                            </h2>
                            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-3xl">
                                Members enjoy competitive returns, reliable services, and 
                                community-focused programs designed to support financial stability 
                                and long-term growth.
                            </p>
                        </div>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: index * 0.1 }}
                                whileHover={{ y: -6 }}
                                className="
                                    relative backdrop-blur-xl bg-white/80 
                                    rounded-2xl border border-gray-200 
                                    shadow-sm hover:shadow-xl transition 
                                    p-6 sm:p-8 flex flex-col group
                                "
                            >
                                {/* Glow on hover */}
                                <div className="
                                    absolute inset-0 rounded-2xl 
                                    opacity-0 group-hover:opacity-100 
                                    transition duration-300
                                    bg-gradient-to-br from-emerald-100/50 to-white/10
                                " />

                                {/* Icon container */}
                                <div className="
                                    relative z-10 flex items-center justify-center
                                    h-14 w-14 rounded-xl 
                                    bg-gradient-to-br from-emerald-50 to-emerald-100 
                                    border border-emerald-200
                                    text-green-700 shadow-sm
                                    mb-5
                                ">
                                    {benefit.icon}
                                </div>

                                {/* Title */}
                                <h3 className="
                                    relative z-10 
                                    text-lg sm:text-xl font-semibold text-gray-900
                                    leading-snug
                                ">
                                    {benefit.title}
                                </h3>

                                {/* Accent Bar */}
                                <div className="
                                    relative z-10 w-12 h-1 mt-4 
                                    bg-gradient-to-r from-green-600 to-emerald-400 
                                    rounded-full
                                " />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
