import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUp,
    X,
    Users,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function Management() {
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [activeMember, setActiveMember] = useState(null);

    const managementTeam = [
        // President
        {
            name: "COL ALEXANDER L. FERIA (RET), CPA, MNSA",
            position: "President",
            image: "/images/management/pres.png",
            background:
                "Provides overall strategic leadership to People’s MPC, ensuring alignment of programs and services with the cooperative’s mission, vision, and long-term sustainability.",
        },

        // Directly under the President
        {
            name: "ALEXANDER A. FERIA JR",
            position: "Operations Officer",
            image: "/images/management/xander.png",
            background:
                "Oversees day-to-day operations, branch coordination, and implementation of policies to maintain efficient and member-focused service delivery.",
        },
        {
            name: "JEFFRAE A. SAPLA",
            position: "IT Department Head",
            image: "/images/management/jeff.png",
            background:
                "Leads systems development, maintenance, and IT infrastructure, ensuring secure and reliable digital services for members and staff.",
        },

        // Core Team
        {
            name: "MARY ANN B. MONTECLARO",
            position: "Bookkeeper",
            image: "/images/management/annie.png",
            background:
                "Handles bookkeeping and financial record maintenance, helping ensure accurate reporting and compliance with accounting standards.",
        },
        {
            name: "ZYRINE MAE T. DAMASO",
            position: "Loan Processor",
            image: "/images/management/zyrine.png",
            background:
                "Processes loan applications and assists members with requirements, supporting timely and responsible credit services.",
        },
        {
            name: "REYNOLD D. VALDEZ",
            position: "Administrative Officer",
            image: "/images/management/reynold.png",
            background:
                "Oversees daily office operations, prepares documents, and coordinates between departments to keep workflows efficient.",
        },
        {
            name: "MICHAELA P. MAUANAY",
            position: "Accounting Clerk",
            image: "/images/management/michaela.png",
            background:
                "Supports the accounting unit in recording transactions, preparing schedules, and assisting in financial statement preparation.",
        },
        {
            name: "DENISE JOY F. ANTOLIN",
            position: "Loan Processor",
            image: "/images/management/denise.png",
            background:
                "Facilitates loan documentation, verification, and coordination with members to ensure smooth loan release and compliance with policies.",
        },
        {
            name: "CAMILLE ANN S. DALO",
            position: "Loan Processor",
            image: "/images/management/camille.png",
            background:
                "Handles member loan applications, ensuring accuracy of information, proper documentation, and courteous member assistance.",
        },
        {
            name: "NICK BRYNE A. FERIA",
            position: "IT Verifier",
            image: "/images/management/nick.png",
            background:
                "Supports system verification, user access validation, and data integrity checks to keep the People’s Information System secure and reliable.",
        },
        {
            name: "RONNIELYN B. SANCHO",
            position: "Bookkeeper",
            image: "/images/management/ronnielyn.png",
            background:
                "Assists in managing books of accounts, reconciliation, and day-to-day financial recording for accurate cooperative financial tracking.",
        },
    ];

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollButton(window.scrollY > 300);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const fadeUp = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
    };

    const openMemberModal = (member) => {
        setActiveMember(member);
    };

    const closeMemberModal = () => {
        setActiveMember(null);
    };

    return (
        <>
            <Head title="Management Team - People's Multi-Purpose Cooperative" />

            <PublicLayout>
                {/* HERO */}
                <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-800 to-green-700 text-white py-16 sm:py-20 px-6 sm:px-10">
                    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.7fr,1.3fr] gap-10 items-center relative z-10">
                        {/* Left: Title & Copy */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center rounded-full bg-white/10 border border-white/25 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.24em] text-emerald-100 mb-4">
                                Our Leadership · Management Team
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow">
                                Leading{" "}
                                <span className="text-yellow-300">People&apos;s MPC</span>{" "}
                                with integrity and service
                            </h1>

                            <p className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed">
                                Meet the team of professionals overseeing operations, systems,
                                and member services to keep the cooperative secure, efficient,
                                and member-focused.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <a
                                    href="#team"
                                    className="inline-flex items-center justify-center rounded-lg px-6 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold bg-white text-green-900 shadow-md hover:bg-emerald-50 transition"
                                >
                                    View management team
                                </a>
                                <a
                                    href="/about/pmpc"
                                    className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-xs sm:text-sm font-medium bg-white/5 border border-white/40 text-emerald-50 hover:bg-white/10 transition"
                                >
                                    Learn more about PMPC
                                </a>
                            </div>
                        </motion.div>

                        {/* Right: Highlight Card */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="lg:justify-self-end"
                        >
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl">
                                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100 mb-3">
                                    At a Glance
                                </p>
                                <div className="space-y-4 text-sm text-emerald-50/95">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Member-Centered
                                            </p>
                                            <p className="text-base font-semibold">
                                                Operations and IT designed around members&apos; needs
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Governance
                                            </p>
                                            <p className="text-base font-semibold">
                                                Strong internal controls and compliance culture
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Innovation
                                            </p>
                                            <p className="text-base font-semibold">
                                                Driving the People&apos;s Information System and digital
                                                services
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

                {/* MAIN CONTENT */}
                <section
                    id="team"
                    className="bg-gradient-to-b from-emerald-50 via-white to-gray-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
                >
                    <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
                        {/* Intro text */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="text-center"
                        >
                            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                                A coordinated team leading operations, finance, and technology
                                to ensure People&apos;s MPC delivers secure, transparent, and
                                efficient services to all members.
                            </p>
                        </motion.div>

                        {/* President */}
                        <motion.section
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="flex justify-center"
                        >
                            <button
                                type="button"
                                onClick={() => openMemberModal(managementTeam[0])}
                                className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow rounded-2xl p-6 sm:p-8 flex flex-col items-center max-w-md w-full border border-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                                <div className="relative mb-4">
                                    <div className="absolute inset-0 rounded-full bg-emerald-100 blur-md" />
                                    <img
                                        src={managementTeam[0].image}
                                        alt={managementTeam[0].name}
                                        className="relative w-40 h-40 sm:w-44 sm:h-44 object-cover rounded-full border-4 border-emerald-600 shadow-md"
                                    />
                                </div>
                                <p className="text-xs uppercase tracking-[0.2em] text-emerald-500 mb-1">
                                    President
                                </p>
                                <h2 className="text-xl sm:text-2xl font-semibold text-emerald-800 text-center">
                                    {managementTeam[0].name}
                                </h2>
                                <p className="mt-2 text-gray-600 text-sm text-center max-w-sm">
                                    Click to view profile and background.
                                </p>
                            </button>
                        </motion.section>

                        {/* Key Leaders */}
                        <motion.section
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {managementTeam.slice(1, 3).map((member) => (
                                    <motion.button
                                        key={member.name}
                                        type="button"
                                        onClick={() => openMemberModal(member)}
                                        whileHover={{ y: -4 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 18,
                                        }}
                                        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg border border-emerald-50 p-5 flex flex-col items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    >
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-28 h-28 object-cover rounded-full mb-3 border-2 border-emerald-500"
                                        />
                                        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-emerald-500 mb-1 text-center">
                                            {member.position}
                                        </p>
                                        <h4 className="text-base sm:text-lg font-semibold text-emerald-800 text-center">
                                            {member.name}
                                        </h4>
                                        <p className="mt-2 text-xs text-gray-600 text-center max-w-xs">
                                            Click to view their profile and responsibilities.
                                        </p>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.section>

                        {/* Core Team */}
                        <motion.section
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                {managementTeam.slice(3).map((member) => (
                                    <motion.button
                                        key={member.name}
                                        type="button"
                                        onClick={() => openMemberModal(member)}
                                        whileHover={{ y: -4 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 18,
                                        }}
                                        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg border border-emerald-50 p-5 flex flex-col items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    >
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-24 h-24 object-cover rounded-full mb-3 border border-emerald-400"
                                        />
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[0.7rem] font-medium px-3 py-1 mb-1">
                                            {member.position}
                                        </span>
                                        <h4 className="text-sm sm:text-base font-semibold text-emerald-800 text-center">
                                            {member.name}
                                        </h4>
                                        <p className="mt-1 text-[0.7rem] text-gray-500 text-center">
                                            Click to view full profile.
                                        </p>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.section>
                    </div>
                </section>

                {/* Call to Action */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="mt-0"
                >
                    <div className="bg-emerald-700 py-10 px-6 sm:px-10 text-center text-white shadow-lg">
                        <h2 className="text-2xl sm:text-3xl font-bold">
                            Become a Member Today
                        </h2>
                        <p className="mt-3 text-sm sm:text-base text-emerald-100 max-w-xl mx-auto">
                            Join People&apos;s MPC and be part of a cooperative managed by
                            professionals dedicated to your financial growth and security.
                        </p>
                        <button
                            onClick={() =>
                                window.open("/register", "_blank", "noopener,noreferrer")
                            }
                            className="mt-6 inline-flex items-center justify-center px-8 py-3 rounded-xl bg-white text-emerald-700 font-semibold text-sm sm:text-base shadow hover:bg-emerald-50 transition-colors duration-200"
                        >
                            Become a Member
                        </button>
                    </div>
                </motion.section>

                {/* Scroll-To-Top Button */}
                {showScrollButton && (
                    <motion.button
                        onClick={scrollToTop}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.1 }}
                        className="fixed bottom-6 right-6 bg-emerald-700 text-white p-3 rounded-full shadow-lg hover:bg-emerald-800 transition"
                    >
                        <ArrowUp size={24} />
                    </motion.button>
                )}

                {/* Member Modal */}
                <AnimatePresence>
                    {activeMember && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMemberModal}
                        >
                            <motion.div
                                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 relative"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ duration: 0.25 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Close Button */}
                                <button
                                    type="button"
                                    onClick={closeMemberModal}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    <X size={20} />
                                </button>

                                {/* Image */}
                                <div className="flex items-center justify-center">
                                    <img
                                        src={activeMember.image}
                                        alt={activeMember.name}
                                        className="w-full h-64 md:h-full object-cover rounded-xl"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex flex-col justify-center">
                                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-500 mb-1">
                                        {activeMember.position}
                                    </p>
                                    <h3 className="text-xl sm:text-2xl font-semibold text-emerald-800 mb-3">
                                        {activeMember.name}
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                        {activeMember.background}
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </PublicLayout>
        </>
    );
}
