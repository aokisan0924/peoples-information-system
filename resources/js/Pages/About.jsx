import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    ArrowUp,
    Landmark,
    Users,
    BookOpen,
    ChevronRight,
    ShieldCheck,
    Sparkles,
    LineChart,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function About() {
    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowScrollButton(window.scrollY > 300);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    const fadeUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <>
            <Head title="About Us - People's Multi-Purpose Cooperative">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <PublicLayout>
                {/* HERO SECTION */}
                <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-800 to-green-700 text-white py-18 sm:py-20 px-6 sm:px-10">
                    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.7fr,1.3fr] gap-10 items-center relative z-10">
                        {/* Left: text */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-emerald-100 mb-4">
                                About People&apos;s Multi-Purpose Cooperative
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow">
                                Empowering Members Through{" "}
                                <span className="text-yellow-300">
                                    Financial Growth
                                </span>
                            </h1>

                            <p className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed">
                                A trusted cooperative serving uniformed personnel, retirees,
                                civilians, and families with sustainable financial programs
                                since 2003.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    onClick={() =>
                                        window.open(
                                            "/register",
                                            "_blank",
                                            "noopener,noreferrer"
                                        )
                                    }
                                    className="inline-flex items-center justify-center rounded-lg px-7 py-2.5 text-sm sm:text-base font-semibold bg-white text-green-900 shadow-md hover:shadow-lg hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                                >
                                    Become a member
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </button>

                                <a
                                    href="#mission-vision"
                                    className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-xs sm:text-sm font-medium bg-white/5 border border-white/30 text-emerald-50 hover:bg-white/10 transition"
                                >
                                    Learn more about PMPC
                                </a>
                            </div>
                        </motion.div>

                        {/* Right: highlight card */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="lg:justify-self-end"
                        >
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl">
                                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100 mb-2">
                                    At a Glance
                                </p>
                                <div className="space-y-4 text-sm text-emerald-50/95">
                                    <div className="flex items-center gap-3">
                                        <Landmark className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Established
                                            </p>
                                            <p className="text-base font-semibold">
                                                Since 2003 in Upi, Gamu, Isabela
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
                                                Open to AFP, retirees, civilians & families
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Accreditation
                                            </p>
                                            <p className="text-base font-semibold">
                                                AFP-recognized financial institution
                                                since 2022
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Hero decorations */}
                    <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
                </section>

                {/* MISSION & VISION */}
                <section
                    id="mission-vision"
                    className="container mx-auto px-6 sm:px-10 py-16"
                >
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="text-center mb-10">
                            <p className="text-xs uppercase tracking-[0.25em] text-green-700/80">
                                Our Core Direction
                            </p>
                            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                                Mission &amp; Vision
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-7">
                                <div className="flex items-center gap-3 mb-3">
                                    <Sparkles className="h-6 w-6 text-green-700" />
                                    <h3 className="text-xl font-semibold text-green-800">
                                        Mission
                                    </h3>
                                </div>
                                <p className="text-gray-700 text-base leading-relaxed text-justify indent-8">
                                    To deliver FAST and SECURED financial services responsive
                                    to the needs of its members, their families and
                                    communities.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-7">
                                <div className="flex items-center gap-3 mb-3">
                                    <LineChart className="h-6 w-6 text-green-700" />
                                    <h3 className="text-xl font-semibold text-green-800">
                                        Vision
                                    </h3>
                                </div>
                                <p className="text-gray-700 text-base leading-relaxed text-justify indent-8">
                                    Fastest Growing Multi-Purpose Cooperative in providing
                                    integrated financial products and services.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* OUR HISTORY */}
                <section className="container mx-auto px-6 sm:px-10 py-16">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.5 }}
                        className="grid md:grid-cols-2 gap-10 items-center"
                    >
                        <img
                            src="/images/about/history.jpg"
                            alt="PMPC History"
                            className="rounded-2xl shadow-xl w-full object-cover"
                        />

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Landmark className="h-6 w-6 text-green-700" />
                                <h2 className="text-2xl sm:text-3xl font-bold text-green-700">
                                    Our History
                                </h2>
                            </div>

                            <p className="text-gray-700 text-base sm:text-lg leading-relaxed text-justify indent-8">
                                Founded on March 2, 2003, People&apos;s MPC began with 26
                                pioneering members from the 2nd Finance Service Unit
                                Multi-Purpose Cooperative in Upi, Gamu, Isabela.
                            </p>

                            <p className="text-gray-700 text-base sm:text-lg leading-relaxed text-justify indent-8 mt-4">
                                Through years of dedicated service, PMPC grew into a trusted
                                financial partner, earning accreditation as an AFP financial
                                institution on September 23, 2022 — a milestone reflecting
                                its commitment to service, transparency, and accountability.
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* WHY CHOOSE PMPC */}
                <section className="container mx-auto px-6 sm:px-10 py-16">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="h-6 w-6 text-green-700" />
                            <h2 className="text-2xl sm:text-3xl font-bold text-green-700">
                                Why Choose PMPC?
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10 items-start">
                            <div className="space-y-4 text-gray-700 text-base sm:text-lg leading-relaxed text-justify indent-8">
                                <p>
                                    PMPC offers a one-time investment opportunity tailored
                                    for prospective retirees with competitive dividend and
                                    interest packages.
                                </p>

                                <p>
                                    Our loan programs provide some of the lowest interest
                                    rates among cooperatives, with flexible terms, secure
                                    processing, and no hidden charges.
                                </p>

                                <p>
                                    Members can build wealth with structured investment plans
                                    — reaching millionaire status in just five years through
                                    disciplined contributions.
                                </p>

                                <p>
                                    PMPC continuously rewards loyalty through annual
                                    Patronage Refunds distributed to all active members.
                                </p>

                                <p>
                                    Join PMPC today and secure a strong, stable financial
                                    future!
                                </p>
                            </div>

                            {/* Feature cards */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                        Competitive Returns
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Dividend and interest packages that help grow your
                                        savings and capital contribution.
                                    </p>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                        Transparent Lending
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Clear loan terms with no hidden charges and member-first
                                        policies.
                                    </p>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                        Wealth-Building Programs
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Structured plans that promote long-term financial
                                        discipline and growth.
                                    </p>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                        Patronage Refunds
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Annual patronage returns shared with members based on
                                        their utilization of PMPC services.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* OUR COMMITMENT */}
                <section className="bg-white py-16 px-6 sm:px-10 border-y border-gray-200">
                    <div className="container mx-auto max-w-5xl text-center">
                        <BookOpen className="h-10 w-10 mx-auto text-green-700 mb-4" />
                        <h2 className="text-2xl sm:text-3xl font-bold text-green-700">
                            Our Commitment
                        </h2>
                        <p className="mt-4 text-gray-700 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
                            People&apos;s MPC stands as a member-first cooperative,
                            committed to building financial resilience, delivering reliable
                            services, and strengthening the economic well-being of the
                            communities we serve.
                        </p>
                    </div>
                </section>

                {/* Scroll-to-top button */}
                {showScrollButton && (
                    <motion.button
                        onClick={scrollToTop}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.1 }}
                        className="fixed bottom-6 right-6 bg-green-700 text-white p-3 rounded-full shadow-lg"
                    >
                        <ArrowUp size={24} />
                    </motion.button>
                )}
            </PublicLayout>
        </>
    );
}
