import { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import { motion } from "framer-motion";
import PublicLayout from "@/Layouts/PublicLayout";
import toast from "react-hot-toast";
import {
    Calculator,
    ChevronRight,
    ArrowUp,
    Info,
    HandCoins,
    Percent,
    Wallet,
} from "lucide-react";

export default function PettyCashLoan({
    initialAmount,
    initialTermMonths,
    maxTermMonths,
    rates,
    breakdown,
}) {
    const [amountInput, setAmountInput] = useState(initialAmount ?? "10000.00");
    const [termMonths, setTermMonths] = useState(initialTermMonths ?? 3);
    const [resultBreakdown, setResultBreakdown] = useState(breakdown || { cards: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const fadeUp = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
    };

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
                route("petty-cash.calculate"),
                {
                    amount: String(amountInput).replace(/,/g, ""),
                    termMonths: termMonths,
                }
            );

            if (response.data?.error) {
                toast.error(response.data.message);
                setIsLoading(false);
                return;
            }

            setAmountInput(response.data.amount);
            setTermMonths(response.data.termMonths);
            setResultBreakdown(response.data.breakdown || { card: null });

        } catch (error) {
            if (error.response?.status === 422 && error.response.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };


    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const monthlyTotalRate = (rates?.monthlyTotalRate ?? 0) * 100;
    const monthlyServiceRate = (rates?.monthlyServiceRate ?? 0) * 100;
    const monthlyInterestRate = (rates?.monthlyInterestRate ?? 0) * 100;

    return (
        <PublicLayout>
            <Head title="Petty Cash Loan" />

            {/* HERO */}
            <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-700 to-green-800 text-white py-16 sm:py-20 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-10 items-center relative z-10">
                    <div>
                        <div className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-emerald-100 mb-4">
                            Petty Cash Loan • Up to {maxTermMonths} months
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                            Quick <span className="text-yellow-300">Petty Cash Loan</span>{" "}
                            with transparent charges
                        </h1>

                        <p className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed">
                            Get short-term cash assistance with a fixed{" "}
                            <span className="font-semibold">
                                {monthlyTotalRate.toFixed(0)}% per month
                            </span>{" "}
                            ({monthlyServiceRate.toFixed(0)}% service fee and{" "}
                            {monthlyInterestRate.toFixed(0)}% interest), plus mandatory
                            share capital and membership contributions.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <a
                                href="#calculator"
                                className="inline-flex items-center justify-center px-6 sm:px-7 py-2.5 sm:py-3 rounded-lg bg-white text-green-900 font-semibold text-sm sm:text-base shadow-md hover:bg-emerald-50 transition"
                            >
                                Open calculator
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </a>
                            <Link
                                href="/member/register"
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-white/60 text-sm font-medium text-white/90 hover:bg-white/10 transition"
                            >
                                Apply for membership
                            </Link>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-4 text-xs sm:text-sm text-emerald-50/90">
                            <div className="flex items-center gap-2">
                                <Percent className="h-4 w-4" />
                                <span>Fixed 5% per month (2% service fee, 3% interest)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <HandCoins className="h-4 w-4" />
                                <span>₱500 share capital • ₱300 membership</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:justify-self-end">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-7 shadow-xl">
                            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100 mb-2">
                                Important reminder
                            </p>
                            <p className="text-sm text-emerald-50/95 leading-relaxed">
                                This petty cash loan is designed for short-term needs with a
                                maximum term of {maxTermMonths} months. Charges are fixed and
                                transparent — the calculator below shows the full breakdown of
                                fees, interest, and estimated net proceeds.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-none absolute -top-8 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 bg-emerald-400/25 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
            </section>

            {/* CALCULATOR SECTION */}
            <section id="calculator" className="bg-gray-50 py-16 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.2fr,1.8fr] gap-10 items-start">
                    {/* LEFT: INPUT FORM */}
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white p-7 rounded-2xl shadow-md border border-gray-100"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-11 w-11 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                                <Calculator className="h-6 w-6 text-green-700" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Petty Cash Loan Calculator
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Enter the amount and choose a term up to 3 months.
                                </p>
                            </div>
                        </div>

                        {/* Amount */}
                        <label className="text-sm font-medium text-gray-700">
                            Loan Amount (PHP)
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
                                placeholder="e.g. 10,000.00"
                            />
                        </div>

                        {/* Term */}
                        <label className="text-sm font-medium text-gray-700">
                            Loan Term (months)
                        </label>
                        <select
                            value={termMonths}
                            onChange={(e) => setTermMonths(parseInt(e.target.value, 10))}
                            className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-green-600 focus:border-green-600 transition"
                        >
                            {[1, 2, 3].map((m) => (
                                <option key={m} value={m}>
                                    {m} month{m > 1 ? "s" : ""} — {m * 5}% total ({m * 2}% service fee,{" "}
                                    {m * 3}% interest)
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-6 w-full py-3 rounded-lg bg-green-700 text-white font-semibold shadow hover:bg-green-800 disabled:opacity-60"
                        >
                            {isLoading ? "Calculating..." : "Compute Breakdown"}
                        </button>

                        <p className="mt-4 text-xs text-gray-500">
                            *For illustration only. Actual approval, schedule, and deductions
                            are subject to People&apos;s MPC policies and final loan documents.
                        </p>
                    </motion.form>

                    {/* RESULTS CARD */}
<motion.div
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    transition={{ duration: 0.4, delay: 0.1 }}
    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-emerald-50 p-6 sm:p-8 w-full"
>
    <h2 className="text-xl sm:text-2xl font-bold text-emerald-800 mb-4">
        Computation Summary
    </h2>

    {!resultBreakdown?.card && (
        <p className="text-sm text-gray-500">
            Enter the loan amount and term then click{" "}
            <span className="font-semibold text-emerald-700">
                Compute Breakdown
            </span>{" "}
            to see the estimated petty cash loan details.
        </p>
    )}

    {resultBreakdown?.card && (
        <div className="space-y-4">

            {/* Net Proceeds (highlighted) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-600">
                        Net Proceeds
                    </p>
                    <p className="text-[11px] text-gray-500">
                        Estimated amount you will receive after all deductions.
                    </p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-emerald-800">
                    {resultBreakdown.card.netProceeds}
                </p>
            </div>

            {/* Service Fee */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-600">
                        Service Fee
                    </p>
                    <p className="text-[11px] text-gray-500">
                        Total service fee based on 2% per month for the selected term.
                    </p>
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-800">
                    {resultBreakdown.card.serviceFee}
                </p>
            </div>

            {/* Interest */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-600">
                        Interest
                    </p>
                    <p className="text-[11px] text-gray-500">
                        Total interest based on 3% per month for the selected term.
                    </p>
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-800">
                    {resultBreakdown.card.interest}
                </p>
            </div>

            {/* Membership Fee */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-600">
                        Membership Fee
                    </p>
                    <p className="text-[11px] text-gray-500">
                        Fixed mandatory membership fee for this loan.
                    </p>
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-800">
                    {resultBreakdown.card.membership}
                </p>
            </div>

            {/* Share Capital */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-600">
                        Share Capital Deposit
                    </p>
                    <p className="text-[11px] text-gray-500">
                        Mandatory share capital build-up from this petty cash loan.
                    </p>
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-800">
                    {resultBreakdown.card.shareCapital}
                </p>
            </div>
        </div>
    )}

    <p className="mt-5 text-xs text-gray-500 leading-relaxed">
        All computations are processed securely on the server. This summary is for
        reference only and may vary based on final approved loan documents.
    </p>
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
            className={`p-5 sm:p-6 rounded-2xl border shadow-sm bg-white ${
                highlight ? "border-emerald-300 bg-emerald-50/70" : "border-gray-100"
            }`}
        >
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                Petty Cash Loan
            </p>
            <h3 className="mt-1 text-sm sm:text-base font-semibold text-gray-900">
                {title}
            </h3>
            <p className="mt-2 text-xl font-bold text-green-800">{value}</p>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                {description}
            </p>
        </div>
    );
}
