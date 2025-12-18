import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { motion } from "framer-motion";
import PublicLayout from "@/Layouts/PublicLayout";
import { Calculator, ChevronRight, ArrowUp, Info, PiggyBank } from "lucide-react";

export default function ShareCapitalCalculator({
    initialAverage,
    interestRate,
    summary,
}) {
    const [averageInput, setAverageInput] = useState(initialAverage);
    const [resultCards, setResultCards] = useState(summary || []);
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowScrollButton(window.scrollY > 300);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            const response = await axios.post(
                route("share-capital.calculate"),
                {
                    average: averageInput,
                }
            );

            setAverageInput(response.data.average);
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
            <Head title="Share Capital Calculator" />

            {/* HERO */}
            <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-700 to-green-800 text-white py-16 sm:py-20 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] uppercase tracking-[0.2em] text-emerald-100 mb-4">
                            Share Capital • Calculator
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
                            Compute your{" "}
                            <span className="text-yellow-300">2024 Share Capital Dividend</span>
                        </h1>

                        <p className="mt-4 text-lg text-emerald-50 max-w-xl leading-relaxed">
                            Dividend is based on your <strong>average share capital</strong> multiplied
                            by the <strong>9.08% declared interest rate</strong> for 2024. Simply enter 
                            your average share capital and the system will compute everything for you.
                        </p>

                        <a
                            href="#calculator"
                            className="mt-6 inline-flex items-center px-6 py-3 rounded-lg bg-white text-green-900 font-semibold shadow hover:bg-emerald-50 transition"
                        >
                            Open Calculator
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </a>

                        <div className="mt-5 flex gap-4 text-sm text-emerald-50/90">
                            <div className="flex items-center gap-2">
                                <PiggyBank className="h-4 w-4" />
                                Annual declared dividend computation
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-xl">
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">
                            2024 Declared Rate
                        </p>
                        <p className="mt-2 text-3xl font-bold text-yellow-300">
                            {(interestRate * 100).toFixed(2)}%
                        </p>
                        <p className="mt-2 text-sm text-emerald-50/90">
                            The dividend rate is declared annually by the Board of Directors.
                        </p>
                    </div>
                </div>
            </section>

            {/* CALCULATOR */}
            <section id="calculator" className="bg-gray-50 py-16 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.2fr,1.8fr] gap-12">
                    
                    {/* LEFT INPUT PANEL */}
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
                            <h2 className="text-xl font-semibold text-gray-800">
                                Enter your average share capital
                            </h2>
                        </div>

                        <label className="text-sm font-medium text-gray-700">
                            Average Share Capital (PHP)
                        </label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                                ₱
                            </span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={averageInput}
                                onChange={(e) => setAverageInput(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-7 pr-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-green-600 focus:border-green-600 transition"
                                placeholder="e.g. 50,000.00"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-6 w-full py-3 rounded-lg bg-green-700 text-white font-semibold shadow hover:bg-green-800 disabled:opacity-60"
                        >
                            {isLoading ? "Computing..." : "Compute Dividend"}
                        </button>

                        <p className="mt-4 text-xs text-gray-500">
                            *This calculator is an estimate only. Actual dividends depend on audited cooperative financials.
                        </p>
                    </motion.form>

                    {/* RIGHT RESULTS PANEL */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {resultCards.map((card) => (
                            <div
                                key={card.title}
                                className={`p-6 rounded-2xl shadow border ${
                                    card.highlight
                                        ? "bg-emerald-50 border-emerald-200"
                                        : "bg-white border-gray-100"
                                }`}
                            >
                                <p className="text-xs uppercase tracking-widest text-gray-500">
                                    Share Capital
                                </p>
                                <h3 className="text-lg font-semibold text-gray-900 mt-1">
                                    {card.title}
                                </h3>
                                <p className="text-2xl font-bold text-green-800 mt-2">
                                    {card.value}
                                </p>
                                <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                                    {card.description}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {showScrollButton && (
                    <motion.button
                        onClick={scrollToTop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed bottom-6 right-6 bg-green-700 text-white p-3 rounded-full shadow-lg"
                    >
                        <ArrowUp size={22} />
                    </motion.button>
                )}
            </section>
        </PublicLayout>
    );
}
