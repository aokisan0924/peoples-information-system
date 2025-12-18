import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { motion } from "framer-motion";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    Calculator,
    ChevronRight,
    ArrowUp,
    Info,
    PiggyBank,
    Clock,
} from "lucide-react";

export default function TimeDepositCalculator({
    initialAmount,
    initialTermYears,
    rateLadder,
    summary,
}) {
    const [amountInput, setAmountInput] = useState(initialAmount ?? "100000.00");
    const [termYears, setTermYears] = useState(initialTermYears ?? 1);
    const [resultCards, setResultCards] = useState(summary || []);
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowScrollButton(window.scrollY > 300);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            const response = await axios.post(
                route("time-deposit.calculate"),
                {
                    amount: String(amountInput).replace(/,/g, ""),
                    termYears: termYears,
                }
            );

            setAmountInput(response.data.amount);
            setTermYears(response.data.termYears);
            setResultCards(response.data.summary || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <PublicLayout>
            <Head title="Time Deposit Calculator" />

            {/* HERO */}
            <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-700 to-green-800 text-white py-16 sm:py-20 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] uppercase tracking-[0.2em] text-emerald-100 mb-4">
                            Time Deposit • Compounded Interest
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
                            Plan your{" "}
                            <span className="text-yellow-300">Time Deposit Earnings</span>
                        </h1>

                        <p className="mt-4 text-lg text-emerald-50 max-w-xl leading-relaxed">
                            Choose a term of up to <strong>5 years</strong>, with interest
                            rates that increase with longer commitments. Interest is
                            compounded annually based on the fixed time deposit rate.
                        </p>

                        <a
                            href="#calculator"
                            className="mt-6 inline-flex items-center px-6 py-3 rounded-lg bg-white text-green-900 font-semibold shadow hover:bg-emerald-50 transition"
                        >
                            Open Calculator
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </a>

                        <div className="mt-5 flex flex-wrap gap-4 text-sm text-emerald-50/90">
                            <div className="flex items-center gap-2">
                                <PiggyBank className="h-4 w-4" />
                                Fixed term, higher than regular savings
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Maximum term: 5 years
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-xl">
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-100 mb-2">
                            Rate Ladder (per year)
                        </p>
                        <ul className="space-y-2 text-sm text-emerald-50/95">
                            {rateLadder?.map((row) => (
                                <li
                                    key={row.termYears}
                                    className="flex items-center justify-between"
                                >
                                    <span>{row.label}</span>
                                    <span className="text-emerald-100/90 text-xs">
                                        {row.rateLabel}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3 text-xs text-emerald-100/80">
                            Rates are applied per term and compounded annually up to
                            maturity.
                        </p>
                    </div>
                </div>

                {/* Decorative blurs */}
                <div className="pointer-events-none absolute -top-8 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 bg-emerald-400/25 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
            </section>

            {/* CALCULATOR */}
            <section id="calculator" className="bg-gray-50 py-16 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.2fr,1.8fr] gap-12 items-start">
                    {/* LEFT: INPUT FORM */}
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white p-8 rounded-2xl shadow border border-gray-100"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-12 w-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                                <Calculator className="h-6 w-6 text-green-700" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Time Deposit Calculator
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Enter the amount and term to estimate your maturity value.
                                </p>
                            </div>
                        </div>

                        {/* Amount */}
                        <label className="text-sm font-medium text-gray-700">
                            Deposit Amount (PHP)
                        </label>
                        <div className="relative mt-1 mb-4">
                            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                                ₱
                            </span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={amountInput}
                                onChange={(e) => setAmountInput(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-7 pr-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-green-600 focus:border-green-600 transition"
                                placeholder="e.g. 100,000.00"
                            />
                        </div>

                        {/* Term */}
                        <label className="text-sm font-medium text-gray-700">
                            Term (years)
                        </label>
                        <select
                            value={termYears}
                            onChange={(e) => setTermYears(parseInt(e.target.value, 10))}
                            className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-green-600 focus:border-green-600 transition"
                        >
                            {rateLadder?.map((row) => (
                                <option key={row.termYears} value={row.termYears}>
                                    {row.label} ({row.rateLabel})
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-6 w-full py-3 rounded-lg bg-green-700 text-white font-semibold shadow hover:bg-green-800 disabled:opacity-60"
                        >
                            {isLoading ? "Computing..." : "Compute Maturity Value"}
                        </button>

                        <p className="mt-4 text-xs text-gray-500">
                            *This calculator is for illustration only. Actual rates, terms,
                            and tax treatments follow People&apos;s MPC policies and
                            applicable regulations.
                        </p>
                    </motion.form>

                    {/* RIGHT: RESULTS */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {resultCards?.map((card) => (
                            <ResultCard key={card.key} card={card} />
                        ))}

                        {/* Info box */}
                        <div className="md:col-span-2 rounded-2xl border border-dashed border-emerald-200 bg-white p-4 sm:p-5 text-xs sm:text-sm text-gray-600 flex gap-3">
                            <Info className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <p>
                                Interest is compounded annually based on the fixed rate for the
                                chosen term. Early termination, tax, and other conditions may
                                affect the actual proceeds at maturity according to
                                People&apos;s MPC policies.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Scroll to top */}
                {showScrollButton && (
                    <motion.button
                        onClick={scrollToTop}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.08 }}
                        className="fixed bottom-6 right-6 bg-green-700 text-white p-3 rounded-full shadow-lg"
                    >
                        <ArrowUp size={22} />
                    </motion.button>
                )}
            </section>
        </PublicLayout>
    );
}

function ResultCard({ card }) {
    const { title, value, description, highlight } = card || {};

    return (
        <div
            className={`p-6 rounded-2xl shadow border ${
                highlight ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-100"
            }`}
        >
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                Time Deposit
            </p>
            <h3 className="mt-1 text-sm sm:text-base font-semibold text-gray-900">
                {title}
            </h3>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-green-800">
                {value}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                {description}
            </p>
        </div>
    );
}
