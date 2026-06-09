import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import {
    ArrowUp,
    Calculator as CalculatorIcon,
    Wallet,
    Percent,
    CalendarClock,
} from "lucide-react";
import PublicLayout from "@/Layouts/PublicLayout";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function Calculator() {
    const [showScrollButton, setShowScrollButton] = useState(false);

    const [netProceeds, setNetProceeds] = useState("");
    const [termMonths, setTermMonths] = useState(12);
    const [isCalculating, setIsCalculating] = useState(false);

    const [membershipFee, setMembershipFee] = useState(300);
    const [capitalContribution, setCapitalContribution] = useState(5000);
    const [result, setResult] = useState(null);

    const fadeUp = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
    };

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

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const handleCalculate = async () => {
        const numericAmount = Number(netProceeds);

        if (!numericAmount || numericAmount <= 0) {
            toast.error("Please enter a valid net proceeds amount.");
            return;
        }

        if (!termMonths || termMonths <= 0) {
            toast.error("Please select a valid term.");
            return;
        }

        try {
            setIsCalculating(true);
            setResult(null);

            const response = await axios.post("/calculator/active-pensioner-v1", {
                netProceeds: numericAmount,
                term: Number(termMonths),
                membershipFee: Number(membershipFee),
                capitalContribution: Number(capitalContribution),
            });

            setResult({
                monthlyAmortization: response.data.monthlyAmortization,
                membershipFee: response.data.membershipFee,
                capitalContribution: response.data.capitalContribution,
                netProceeds: response.data.netProceeds,
            });
        } catch (error) {
            console.error(error);
            const message =
                error?.response?.data?.message ||
                "Unable to compute at the moment. Please try again.";
            toast.error(message);
        } finally {
            setIsCalculating(false);
        }
    };

    return (
        <>
            <Head title="Loan Calculator - People's Multi-Purpose Cooperative">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <PublicLayout>
                {/* HERO — 2-column modern layout */}
                <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-800 to-green-700 text-white py-16 sm:py-20 px-6 sm:px-10">
                    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.7fr,1.3fr] gap-10 items-center relative z-10">
                        {/* Left: Title & copy */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.22em] text-emerald-100 mb-4">
                                Loan Tools · Loan Calculator
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow flex items-center gap-2 sm:gap-3">
                                <CalculatorIcon className="h-8 w-8 sm:h-10 sm:w-10" />
                                Loan Calculator
                            </h1>

                            <p className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed">
                                Quickly estimate your monthly amortization, membership fee,
                                capital contribution, and net proceeds based on the configured
                                settings.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <a
                                    href="#calculator"
                                    className="inline-flex items-center justify-center rounded-lg px-6 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold bg-white text-green-900 shadow-md hover:bg-emerald-50 transition"
                                >
                                    Start Calculation
                                </a>

                                <a
                                    href="/loan-information"
                                    className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-xs sm:text-sm font-medium bg-white/10 border border-white/40 text-emerald-50 hover:bg-white/15 transition"
                                >
                                    View loan details
                                </a>
                            </div>
                        </motion.div>

                        {/* Right: Highlight card */}
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
                                        <Wallet className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Net Proceeds Based
                                            </p>
                                            <p className="text-base font-semibold">
                                                Input is the desired net proceeds, system computes
                                                gross and deductions.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Percent className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Configurable Rates
                                            </p>
                                            <p className="text-base font-semibold">
                                                Uses back-end settings for interest, service fee, and
                                                other loan charges.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <CalendarClock className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Term Options
                                            </p>
                                            <p className="text-base font-semibold">
                                                Supports multiple terms (12–60 months) with real-time
                                                recomputation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Decorative glows */}
                    <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
                </section>

                {/* MAIN CONTENT */}
                <section
                    id="calculator"
                    className="bg-gradient-to-b from-emerald-50 via-white to-gray-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
                >
                    <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-start">
                        {/* Form Card */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4 }}
                            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-emerald-50 p-6 sm:p-8"
                        >
                            <h2 className="text-xl sm:text-2xl font-bold text-emerald-800 mb-2">
                                Input Details
                            </h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Enter the desired net proceeds and select the loan term.
                            </p>

                            {/* Net Proceeds */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Net Proceeds
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={netProceeds}
                                        onChange={(e) => setNetProceeds(e.target.value)}
                                        placeholder="Enter desired net proceeds"
                                        className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
                                    />
                                </div>
                            </div>

                            {/* NEW: Membership Fee and Share Capital Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Membership Fee
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                                            ₱
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={membershipFee}
                                            onChange={(e) => setMembershipFee(e.target.value)}
                                            placeholder="300"
                                            className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Share Capital (CapCon)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                                            ₱
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={capitalContribution}
                                            onChange={(e) => setCapitalContribution(e.target.value)}
                                            placeholder="5000"
                                            className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Term */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Term (Months)
                                </label>
                                <select
                                    value={termMonths}
                                    onChange={(e) => setTermMonths(Number(e.target.value))}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base bg-white"
                                >
                                    {[12, 24, 36, 48, 60].map((option) => (
                                        <option key={option} value={option}>
                                            {option} months
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={handleCalculate}
                                disabled={isCalculating}
                                className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white font-semibold py-2.5 text-sm sm:text-base shadow hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                {isCalculating ? "Computing..." : "Compute Loan Details"}
                            </button>

                            <p className="mt-3 text-[11px] text-gray-500">
                                This tool is for illustration only. Actual approval and figures
                                will be based on People&apos;s MPC policies and final evaluation.
                            </p>
                        </motion.div>

                        {/* Results Card */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-emerald-50 p-6 sm:p-8"
                        >
                            <h2 className="text-xl sm:text-2xl font-bold text-emerald-800 mb-4">
                                Computation Summary
                            </h2>

                            {!result && (
                                <p className="text-sm text-gray-500">
                                    Enter net proceeds and term then click{" "}
                                    <span className="font-semibold text-emerald-700">
                                        Compute Loan Details
                                    </span>{" "}
                                    to see the estimated breakdown.
                                </p>
                            )}

                            {result && (
                                <div className="space-y-4">
                                    {/* Monthly Amortization */}
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.18em] text-emerald-600">
                                                Monthly Amortization
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                Estimated monthly payment based on Active_PensionerV1
                                                settings.
                                            </p>
                                        </div>
                                        <p className="text-lg sm:text-xl font-bold text-emerald-800">
                                            {formatMoney(result.monthlyAmortization)}
                                        </p>
                                    </div>

                                    {/* Membership Fee */}
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.18em] text-gray-600">
                                                Membership Fee
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                Required membership fee associated with the loan.
                                            </p>
                                        </div>
                                        <p className="text-base sm:text-lg font-semibold text-gray-800">
                                            {formatMoney(result.membershipFee)}
                                        </p>
                                    </div>

                                    {/* Capital Contribution */}
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.18em] text-gray-600">
                                                Capital Contribution
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                Capital build-up requirement tied to this loan.
                                            </p>
                                        </div>
                                        <p className="text-base sm:text-lg font-semibold text-gray-800">
                                            {formatMoney(result.capitalContribution)}
                                        </p>
                                    </div>

                                    {/* Net Proceeds */}
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.18em] text-emerald-600">
                                                Estimated Net Proceeds
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                Amount you are expected to receive after deductions.
                                            </p>
                                        </div>
                                        <p className="text-lg sm:text-xl font-bold text-emerald-800">
                                            {formatMoney(result.netProceeds)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-emerald-700 text-white text-center py-16 px-6">
                    <div className="container mx-auto max-w-4xl">
                        <h2 className="text-3xl sm:text-4xl font-bold">
                            Ready to Take the Next Step?
                        </h2>
                        <p className="mt-3 text-base sm:text-lg opacity-90">
                            Become a member of People&apos;s MPC and enjoy accessible,
                            member-focused financial services.
                        </p>
                        <button
                            onClick={() =>
                                window.open("/register", "_blank", "noopener,noreferrer")
                            }
                            className="mt-6 inline-flex items-center justify-center bg-white text-green-700 px-8 py-3 text-lg font-semibold rounded-lg shadow hover:bg-gray-100 transition-colors duration-200"
                        >
                            Become a Member
                        </button>
                    </div>
                </section>

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
            </PublicLayout>
        </>
    );
}

