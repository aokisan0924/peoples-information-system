import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import {
    ArrowUp,
    Users,
    ShieldCheck,
    Landmark,
    Sparkles,
} from "lucide-react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function BoardMembers() {
    const [showScrollButton, setShowScrollButton] = useState(false);

    const boardMembers = [
        {
            name: "RUDY V. DAROY",
            position: "Chairperson",
            image: "/images/bod/daroy.jpg",
        },
        {
            name: "AIDA S. CABILTES",
            position: "Vice Chairperson",
            image: "/images/bod/cabiltes.jpg",
        },
        {
            name: "JOEY V. TAMSE",
            position: "Secretary",
            image: "/images/bod/tamse.jpg",
        },
        {
            name: "ANTONIO A. DARACAN",
            position: "Treasurer",
            image: "/images/bod/daracan.jpg",
        },
        {
            name: "FELIX LAUDHEMIR A. FERIA",
            position: "Member",
            image: "/images/bod/feria.jpg",
        },
        {
            name: "FERDINAND B. CAMMAYO",
            position: "Member",
            image: "/images/bod/cammayo.jpg",
        },
        {
            name: "ALFREDO B. CONCEPCION",
            position: "Member",
            image: "/images/bod/concepcion.jpg",
        },
    ];

    useEffect(() => {
        const onScroll = () => setShowScrollButton(window.scrollY > 300);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    const fadeUp = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <>
            <Head title="Board of Directors - People's MPC" />

            <PublicLayout>
                {/* HERO */}
                <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-800 to-green-700 text-white py-16 sm:py-20 px-6 sm:px-10">
                    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.7fr,1.3fr] gap-10 items-center relative z-10">

                        {/* Left Section */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center rounded-full bg-white/10 border border-white/25 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.24em] text-emerald-100 mb-4">
                                Governance • Board of Directors
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                                Strategic Leaders of{" "}
                                <span className="text-yellow-300">People&apos;s MPC</span>
                            </h1>

                            <p className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed">
                                The Board of Directors sets the direction, upholds cooperative values,
                                and ensures financial integrity for the long-term growth of People&apos;s MPC.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <a
                                    href="#board"
                                    className="inline-flex items-center justify-center rounded-lg px-6 py-3 bg-white text-green-900 font-semibold shadow-md hover:bg-emerald-50 transition"
                                >
                                    View Board Members
                                </a>
                                <a
                                    href="/about/pmpc"
                                    className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 border border-white/40 bg-white/10 text-white text-sm hover:bg-white/20 transition"
                                >
                                    Learn more about PMPC
                                </a>
                            </div>
                        </motion.div>

                        {/* Right Highlight */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 sm:p-8 shadow-xl">
                                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100 mb-3">
                                    Governance at a glance
                                </p>

                                <div className="space-y-4 text-sm text-emerald-50/95">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Representation
                                            </p>
                                            <p className="text-base font-semibold">
                                                Elected by members to safeguard cooperative interests
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Oversight
                                            </p>
                                            <p className="text-base font-semibold">
                                                Ensures accountability, risk control, and compliance
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Landmark className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Strategic Direction
                                            </p>
                                            <p className="text-base font-semibold">
                                                Guides policies and long-term cooperative goals
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Background Glow */}
                    <div className="pointer-events-none absolute -top-10 -left-16 w-52 h-52 bg-emerald-400/25 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 bg-emerald-300/30 rounded-full blur-3xl" />
                </section>

                {/* BOARD MEMBERS SECTION */}
                <section
                    id="board"
                    className="bg-gradient-to-b from-emerald-50 via-white to-gray-50 py-16 px-6 sm:px-10"
                >
                    <div className="max-w-6xl mx-auto space-y-12">

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="text-center"
                        >
                            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
                                These elected individuals uphold cooperative values and ensure
                                that PMPC remains transparent, responsible, and aligned with its mission.
                            </p>
                        </motion.div>

                        {/* Chairperson */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4 }}
                            className="flex justify-center"
                        >
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 sm:p-8 max-w-md text-center">
                                <img
                                    src={boardMembers[0].image}
                                    className="w-40 h-40 rounded-full border-4 border-emerald-600 mx-auto mb-4 object-cover"
                                />
                                <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">
                                    {boardMembers[0].position}
                                </p>
                                <h2 className="text-xl sm:text-2xl font-bold text-emerald-800 mt-1">
                                    {boardMembers[0].name}
                                </h2>
                            </div>
                        </motion.div>

                        {/* Next 3 leaders */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
                        >
                            {boardMembers.slice(1, 4).map((member) => (
                                <div
                                    key={member.name}
                                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-emerald-50 p-6 text-center hover:shadow-lg transition"
                                >
                                    <img
                                        src={member.image}
                                        className="w-32 h-32 rounded-full mb-3 mx-auto border border-emerald-500 object-cover"
                                    />
                                    <p className="text-[12px] uppercase tracking-[0.18em] text-emerald-600">
                                        {member.position}
                                    </p>
                                    <h4 className="text-base font-semibold text-emerald-800 mt-1">
                                        {member.name}
                                    </h4>
                                </div>
                            ))}
                        </motion.div>

                        {/* Remaining Members */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
                        >
                            {boardMembers.slice(4).map((member) => (
                                <div
                                    key={member.name}
                                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-emerald-50 p-6 text-center hover:shadow-lg transition"
                                >
                                    <img
                                        src={member.image}
                                        className="w-28 h-28 rounded-full mb-3 mx-auto border border-emerald-400 object-cover"
                                    />
                                    <span className="inline-block px-3 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-700 mb-1">
                                        {member.position}
                                    </span>
                                    <h4 className="text-sm font-semibold text-emerald-800">
                                        {member.name}
                                    </h4>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-emerald-700 py-10 px-6 text-center text-white shadow-inner">
                    <h2 className="text-2xl sm:text-3xl font-bold">Become a Member Today</h2>
                    <p className="text-sm sm:text-base text-emerald-100 max-w-xl mx-auto mt-2">
                        Join People&apos;s MPC and be part of a cooperative led by strong,
                        transparent, and member-focused governance.
                    </p>
                    <button
                        onClick={() => window.open("/register", "_blank")}
                        className="mt-6 px-8 py-3 bg-white text-emerald-700 font-semibold rounded-xl shadow hover:bg-emerald-50 transition"
                    >
                        Become a Member
                    </button>
                </section>

                {/* Scroll to top */}
                {showScrollButton && (
                    <motion.button
                        onClick={scrollToTop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed bottom-6 right-6 bg-emerald-700 text-white p-3 rounded-full shadow-xl hover:bg-emerald-800 transition"
                    >
                        <ArrowUp size={24} />
                    </motion.button>
                )}
            </PublicLayout>
        </>
    );
}
