import { useState } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import axios from "axios";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    PiggyBank,
    Calculator,
    Info,
    ChevronRight,
    ArrowUp,
} from "lucide-react";

export default function SavingsDeposit({
    initialAmount,
    interestRateYear,
    periodsPerYear,
    projections,
}) {
    const [amountInput, setAmountInput] = useState(initialAmount ?? "10000.00");
    const [results, setResults] = useState(projections || []);
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // track scroll for scroll-to-top button
    if (typeof window !== "undefined") {
        window.onscroll = () => {
            if (window.scrollY > 300) {
                if (!showScrollButton) setShowScrollButton(true);
            } else if (showScrollButton) {
                setShowScrollButton(false);
            }
        };
    }

    const handleCalculate = async (e) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            const response = await axios.post(
                route("savings-deposit.calculate"),
                {
                    amount: String(amountInput).replace(/,/g, ""),
                }
            );

            setAmountInput(response.data.amount);
            setResults(response.data.projections || []);
        } catch (error) {
            console.error(error);
            // optional: toast or small inline error
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <PublicLayout>
            <Head title="Savings Deposit" />

            {/* HERO */}
            <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-700 to-green-800 text-white py-16 sm:py-20 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-[2fr,1.3fr] gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-emerald-100 mb-4">
                            Savings Deposit • Compounded {periodsPerYear}x / year
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                            Grow your savings with{" "}
                            <span className="text-yellow-300">
                                {interestRateYear?.toFixed
                                    ? `${(interestRateYear * 100).toFixed(2)}%`
                                    : "6.09%"}
                            </span>
                        </h1>

                        <p className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed">
                            People&apos;s MPC savings deposits earn interest credited every 6
                            months and compounded automatically. Use the calculator to see how
                            your savings can grow over time.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <a
                                href="#calculator"
                                className="inline-flex items-center justify-center px-6 sm:px-7 py-2.5 sm:py-3 rounded-lg bg-white text-green-900 font-semibold text-sm sm:text-base shadow-md hover:bg-emerald-50 transition"
                            >
                                Try the calculator
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </a>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-4 text-xs sm:text-sm text-emerald-50/90">
                            <div className="flex items-center gap-2">
                                <PiggyBank className="h-4 w-4" />
                                <span>Interest credited every 6 months</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                <span>Compounded automatically based on policy</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:justify-self-end">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-6 lg:p-7 shadow-xl">
                            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100 mb-2">
                                At a Glance
                            </p>
                            <h2 className="text-lg sm:text-xl font-semibold mb-3">
                                How compounding works
                            </h2>
                            <p className="text-sm text-emerald-50/95 leading-relaxed">
                                With semi-annual compounding, your interest is added to your
                                savings twice a year. You then earn interest on both your
                                principal and the interest already credited.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-none absolute -top-8 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 bg-emerald-400/25 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
            </section>

            {/* CALCULATOR SECTION */}
            <section
                id="calculator"
                className="bg-gray-50 py-14 sm:py-16 px-6 sm:px-10"
            >
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-green-700/80">
                                Savings Calculator
                            </p>
                            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                                See how your savings can grow
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
                                Enter the amount you plan to deposit. The computation is processed
                                on the server using a{" "}
                                <span className="font-semibold">6.09% annual rate</span> with{" "}
                                <span className="font-semibold">semi-annual compounding</span>.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1.8fr] gap-8 items-start">
                        {/* LEFT: INPUT */}
                        <motion.form
                            onSubmit={handleCalculate}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-7"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                                    <Calculator className="h-5 w-5 text-green-700" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Deposit amount
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Type the amount you want to place in your savings deposit.
                                    </p>
                                </div>
                            </div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount to deposit (PHP)
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                                    ₱
                                </span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={amountInput}
                                    onChange={(e) => setAmountInput(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-7 pr-3 py-2.5 text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition"
                                    placeholder="Enter amount, e.g. 10,000.00"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-5 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold shadow hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
                            >
                                {isLoading ? "Calculating..." : "Compute projection"}
                            </button>

                            <p className="mt-3 text-xs text-gray-500">
                                *Figures are estimates only and may change depending on official
                                People&apos;s MPC savings policies and applicable regulations.
                            </p>
                        </motion.form>

                        {/* RIGHT: RESULTS */}
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.slice(0, 2).map((item) => (
                                    <ResultCard key={item.key} item={item} />
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.slice(2).map((item) => (
                                    <ResultCard key={item.key} item={item} />
                                ))}
                            </div>
                        </motion.div>
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

function ResultCard({ item }) {
    const { title, subtitle, highlight, balanceLabel, interestLabel, balance, interest } =
        item;

    return (
        <div
            className={`rounded-2xl p-5 border shadow-sm bg-white ${
                highlight
                    ? "border-emerald-300 bg-emerald-50/60"
                    : "border-gray-100"
            }`}
        >
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                {subtitle}
            </p>
            <h3 className="mt-1 text-sm sm:text-base font-semibold text-gray-900">
                {title}
            </h3>

            <div className="mt-3 flex flex-col gap-2 text-sm">
                <div>
                    <p className="text-gray-500 text-xs">{balanceLabel}</p>
                    <p className="text-lg sm:text-xl font-semibold text-green-800">
                        {balance}
                    </p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs">{interestLabel}</p>
                    <p className="text-base font-medium text-emerald-700">
                        {interest}
                    </p>
                </div>
            </div>
        </div>
    );
}
