import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { X, AlertCircle, CreditCard, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

const modalKey = "modalDismissedUntil";
const bannerKey = "bannerDismissedUntil";

export default function PaymentReminderLayout({ children }) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPaymentBanner, setShowPaymentBanner] = useState(false);
    const [userData, setUserData] = useState(null);

    const hideModalOnly = () => {
        const tenMin = Date.now() + 600000;
        localStorage.setItem(modalKey, tenMin.toString());
        setShowPaymentModal(false);
    };

    const hideBannerOnly = () => {
        const tenMin = Date.now() + 600000;
        localStorage.setItem(bannerKey, tenMin.toString());
        setShowPaymentBanner(false);
    };

    useEffect(() => {
        let interval;

        const fetchPaymentStatus = async () => {
            try {
                const res = await axios.get(route("member.payment-status"));

                const { membershipPayment, firstName, lastName, email, contact } = res.data;

                setUserData({ firstName, lastName, email, phone: contact });

                const isMembershipPaid = !!membershipPayment?.is_paid;
                const now = Date.now();
                const modalUntil = parseInt(localStorage.getItem(modalKey)) || 0;
                const bannerUntil = parseInt(localStorage.getItem(bannerKey)) || 0;

                if (!isMembershipPaid && now > modalUntil) setShowPaymentModal(true);
                if (!isMembershipPaid && now > bannerUntil) setShowPaymentBanner(true);

                interval = setInterval(() => {
                    const updatedNow = Date.now();
                    const updatedModalUntil = parseInt(localStorage.getItem(modalKey)) || 0;
                    const updatedBannerUntil = parseInt(localStorage.getItem(bannerKey)) || 0;

                    if (!isMembershipPaid) {
                        if (updatedNow > updatedModalUntil) setShowPaymentModal(true);
                        if (updatedNow > updatedBannerUntil) setShowPaymentBanner(true);
                    }
                }, 60000);
            } catch (err) {
                console.error("Payment status fetch failed", err);
            }
        };

        fetchPaymentStatus();

        return () => { if (interval) clearInterval(interval); };
    }, []);

    const handlePaymongoCheckout = async () => {
        try {
            const res = await axios.post(route("member.paymongo.membershipCheckout"));
            if (res.data.checkoutUrl) {
                window.open(res.data.checkoutUrl, "_blank");
            } else {
                toast.error("Checkout failed.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong.");
        }
    };

    return (
        <div className="w-full overflow-x-hidden min-h-screen flex flex-col relative">

            {/* Top banner */}
            <AnimatePresence>
                {showPaymentBanner && (
                    <motion.div
                        key="paymentBanner"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-amber-50 border-b border-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-500/20 dark:text-amber-200/90 backdrop-blur-md px-4 py-3 text-sm shadow-lg transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="text-xs sm:text-sm font-medium">
                                Reminder: Settle your ₱300 Membership Fee
                            </span>
                        </div>

                        <button
                            onClick={handlePaymongoCheckout}
                            disabled={!userData}
                            className={`group inline-flex items-center gap-1 rounded-lg bg-amber-200/50 px-3 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20 ${!userData ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                            Pay Now <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </button>

                        <button
                            onClick={hideBannerOnly}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-amber-500 hover:bg-amber-100 dark:text-amber-200/40 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                            aria-label="Close Reminder"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
                    >
                        <div className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm" onClick={hideModalOnly} />
                        
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f1f1a] p-6 shadow-2xl sm:p-8 transition-colors"
                        >
                            {/* Dark Mode Decoration */}
                            <div className="hidden dark:block absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                            <div className="hidden dark:block absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

                            <div className="relative flex flex-col items-center text-center space-y-5">
                                <div className="h-16 w-16 rounded-3xl bg-emerald-100 border border-emerald-200 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 flex items-center justify-center shadow-lg">
                                    <CreditCard className="h-8 w-8" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                                        Payment Required
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-white/60 leading-relaxed">
                                        To fully access your account features and services, please settle your one-time{" "}
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">₱300 Membership Fee</span>.
                                    </p>
                                </div>

                                <div className="w-full rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 dark:bg-amber-500/5 dark:border-amber-500/10 dark:text-amber-200/80 p-3">
                                    <p className="text-xs flex items-center justify-center gap-2">
                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                        <span>A 1.5% processing fee will apply securely.</span>
                                    </p>
                                </div>

                                <div className="w-full pt-2 flex flex-col gap-3">
                                    <button
                                        onClick={handlePaymongoCheckout}
                                        disabled={!userData}
                                        className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500 hover:-translate-y-0.5 active:translate-y-0 ${
                                            !userData ? "cursor-not-allowed opacity-50" : ""
                                        }`}
                                    >
                                        Pay Membership Fee
                                        <ArrowRight className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={hideModalOnly}
                                        className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white transition-colors py-2"
                                    >
                                        Remind me later
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {children}
        </div>
    );
}