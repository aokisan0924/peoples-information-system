import React, { useState, useEffect, useRef } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { createPortal } from "react-dom";
import {
    PiggyBank, Wallet, ArrowUpRight, ArrowUpCircle, ArrowDownCircle,
    X, Filter, Loader2, ChevronRight, History, ShieldCheck, RefreshCw,
    AlertTriangle, CheckCircle2, Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Combobox } from "@headlessui/react";
import axios from "axios";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";
import SidebarLayout from "@/Layouts/SidebarLayout";

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value) => {
    if (value == null) return "₱0.00";
    return `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
};

const BANK_LIST = [
    "Asia United Bank (AUB)", "Bangkok Bank", "Bank of America", "Bank of China",
    "Bank of Commerce", "Bank of the Philippine Islands (BPI)", "BDO Unibank (BDO)",
    "China Banking Corporation (ChinaBank)", "CTBC Bank", "Deutsche Bank",
    "EastWest Bank", "HSBC", "ING Bank", "Maybank Philippines", "Metrobank",
    "Mizuho Bank", "MUFG Bank", "PBCOM", "PNB", "PSBank", "RCBC",
    "Robinsons Bank", "Security Bank", "Shinhan Bank", "Standard Chartered Bank",
    "Sterling Bank of Asia", "SMBC", "UnionBank",
];

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SavingsDeposit() {
    const { savingsSummary, savingsRows: transactions, filters, auth } = usePage().props;

    const [depositAmount, setDepositAmount]       = useState("");
    const [isSubmitting, setIsSubmitting]         = useState(false);
    const [dateFrom, setDateFrom]                 = useState(filters?.dateFrom || "");
    const [dateTo, setDateTo]                     = useState(filters?.dateTo || "");
    const [perPage, setPerPage]                   = useState(filters?.perPage || 10);
    const [isTableLoading, setIsTableLoading]     = useState(false);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

    // ── Deposit via PayMongo ──────────────────────────────────────────────────
    const handleDeposit = async (e) => {
        e.preventDefault();
        if (!depositAmount || Number(depositAmount) <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }
        setIsSubmitting(true);
        try {
            const { data } = await axios.post(
                route("member.paymongo.savingsCheckout"),
                { amount: depositAmount, paymentType: "savings" }
            );
            if (data?.checkoutUrl) {
                window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
            } else {
                toast.error("Unable to start payment.");
            }
        } catch {
            toast.error("Unable to start payment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Filters ───────────────────────────────────────────────────────────────
    const goTo = (params) => {
        setIsTableLoading(true);
        router.get(route("member.savings.index"), params, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsTableLoading(false),
        });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        goTo({ dateFrom: dateFrom || "", dateTo: dateTo || "", perPage: perPage || 10, page: 1 });
    };

    const handleResetFilters = () => {
        setDateFrom(""); setDateTo(""); setPerPage(10);
        goTo({ dateFrom: "", dateTo: "", perPage: 10, page: 1 });
    };

    const handlePageChange = (page) => {
        if (!page || page === transactions?.current_page) return;
        goTo({ dateFrom: dateFrom || "", dateTo: dateTo || "", perPage: perPage || 10, page });
    };

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Savings Deposit">
                    <link rel="icon" href="/images/logo/pis_logo.png" />
                </Head>

                <div className="space-y-6">
                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-[0_20px_60px_-40px_rgba(0,0,0,.8)] transition-colors">
                        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <PiggyBank className="h-5 w-5" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                                        My Savings
                                    </h1>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-white/60 max-w-2xl leading-relaxed">
                                    Manage your savings account, make deposits via PayMongo, or request withdrawals.
                                </p>
                            </div>
                            {auth?.member && (
                                <div className="flex flex-col items-start md:items-end">
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-semibold">Account Holder</span>
                                    <span className="text-slate-900 dark:text-white font-medium">{auth.member.firstName} {auth.member.lastName}</span>
                                    <span className="text-xs text-slate-500 dark:text-white/50">{auth.member.username}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Summary cards ──────────────────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <MiniStat label="Current Balance"    value={formatCurrency(savingsSummary?.currentBalance)}   icon={Wallet}          color="text-emerald-600 dark:text-emerald-400" />
                        <MiniStat label="Total Deposits"     value={formatCurrency(savingsSummary?.totalDeposits)}    icon={ArrowUpCircle}   color="text-slate-600 dark:text-white" />
                        <MiniStat label="Total Withdrawals"  value={formatCurrency(savingsSummary?.totalWithdrawals)} icon={ArrowDownCircle} color="text-rose-500 dark:text-rose-400" />
                    </div>

                    {/* ── Action + filter row ─────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                        {/* Deposit + withdrawal triggers */}
                        <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 shadow-lg lg:col-span-1 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </span>
                                    Quick Deposit
                                </h2>
                                <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wide">
                                    PayMongo
                                </span>
                            </div>

                            <form onSubmit={handleDeposit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-white/50 ml-1 mb-1.5 block">Amount (PHP)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-2.5 text-slate-400 dark:text-white/40 text-sm">₱</span>
                                        <input
                                            type="number" min="50" step="0.01"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 pl-8 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                                    {isSubmitting ? "Processing..." : "Deposit"}
                                </button>
                            </form>

                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowWithdrawalModal(true)}
                                    className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 text-sm font-medium transition flex items-center justify-center gap-2"
                                >
                                    Request Withdrawal
                                </button>
                            </div>
                        </div>

                        {/* Filter panel */}
                        <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 shadow-lg lg:col-span-2 transition-colors">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-white/80 mb-4">
                                <Filter className="h-4 w-4" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Filter History</span>
                            </div>
                            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Field type="date" label="From Date" value={dateFrom} onChange={setDateFrom} />
                                <Field type="date" label="To Date"   value={dateTo}   onChange={setDateTo} />
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-white/50 ml-1 mb-1.5 block">Rows</label>
                                    <select
                                        value={perPage}
                                        onChange={(e) => setPerPage(Number(e.target.value))}
                                        className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer dark:bg-white/5 dark:border-white/10 dark:text-white [&>option]:text-slate-900 dark:[&>option]:text-white dark:[&>option]:bg-slate-800"
                                    >
                                        {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end gap-2">
                                    <button type="submit" className="flex-1 h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg">Apply</button>
                                    <button type="button" onClick={handleResetFilters} className="h-[42px] px-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 font-medium text-sm transition">Reset</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── Transaction table ───────────────────────────────── */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-xl transition-colors">
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
                            <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Transaction History</h3>
                        </div>

                        {isTableLoading && (
                            <div className="px-5 py-12 text-center text-slate-500 dark:text-white/40">
                                <div className="flex justify-center items-center gap-2">
                                    <Loader2 className="animate-spin h-5 w-5 text-emerald-500" />
                                    Loading transactions...
                                </div>
                            </div>
                        )}

                        {!isTableLoading && (!transactions?.data || transactions.data.length === 0) && (
                            <div className="px-5 py-12 text-center text-slate-500 dark:text-white/40">
                                No transactions found.
                            </div>
                        )}

                        {!isTableLoading && transactions?.data?.length > 0 && (
                            <>
                                {/* Desktop table */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="border-b border-slate-200 dark:border-white/10 text-xs uppercase tracking-wider text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5">
                                            <tr>
                                                <th className="px-5 py-4 font-medium">Date</th>
                                                <th className="px-5 py-4 font-medium">Ref. No.</th>
                                                <th className="px-5 py-4 font-medium">Type</th>
                                                <th className="px-5 py-4 font-medium text-right">Credit</th>
                                                <th className="px-5 py-4 font-medium text-right">Debit</th>
                                                <th className="px-5 py-4 font-medium text-right">Balance</th>
                                                <th className="px-5 py-4 font-medium text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-white/80">
                                            {transactions.data.map((row) => (
                                                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-5 py-4 whitespace-nowrap text-slate-900 dark:text-white">{row.date}</td>
                                                    <td className="px-5 py-4 font-mono text-slate-500 dark:text-white/60">{row.referenceNumber || "—"}</td>
                                                    <td className="px-5 py-4">
                                                        <TxBadge type={row.transactionType} status={row.status} />
                                                    </td>
                                                    <td className="px-5 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                                        {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                                                    </td>
                                                    <td className="px-5 py-4 text-right font-mono text-rose-500 dark:text-rose-400">
                                                        {row.debit > 0 ? `-${formatCurrency(row.debit)}` : "—"}
                                                    </td>
                                                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        {formatCurrency(row.runningBalance)}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        {row.transactionType === "withdrawal" &&
                                                            ["released", "posted"].includes((row.status || "").toLowerCase()) && (
                                                            <a
                                                                href={route("member.savings.withdrawal.receipt", row.id)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                                                                title="Download Receipt"
                                                            >
                                                                <Download size={12} /> Receipt
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/10">
                                    {transactions.data.map((row) => (
                                        <div key={row.id} className="p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="text-slate-900 dark:text-white font-medium text-sm">{row.date}</div>
                                                    <div className="text-slate-500 dark:text-white/50 text-xs mt-0.5 font-mono">{row.referenceNumber || "No Ref"}</div>
                                                </div>
                                                <TxBadge type={row.transactionType} status={row.status} />
                                            </div>
                                            <div className="flex justify-between items-center mt-3 text-sm">
                                                <div className="text-slate-500 dark:text-white/60">Amount</div>
                                                <div className={`font-mono ${row.transactionType === "withdrawal" ? "text-rose-500 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                                    {row.transactionType === "withdrawal" ? `-${formatCurrency(row.debit)}` : formatCurrency(row.credit)}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-1 text-sm border-t border-slate-100 dark:border-white/5 pt-2">
                                                <div className="text-slate-400 dark:text-white/40 text-xs">Running Bal.</div>
                                                <div className="font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(row.runningBalance)}</div>
                                            </div>
                                            {row.transactionType === "withdrawal" &&
                                                ["released", "posted"].includes((row.status || "").toLowerCase()) && (
                                                <a
                                                    href={route("member.savings.withdrawal.receipt", row.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 text-xs font-semibold transition-colors hover:bg-emerald-100"
                                                >
                                                    <Download size={12} /> Download Receipt
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Pagination */}
                        {transactions?.links && transactions.links.length > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                <div className="text-xs text-slate-500 dark:text-white/50">
                                    Page <span className="font-semibold text-slate-700 dark:text-white">{transactions.current_page}</span> of <span className="font-semibold text-slate-700 dark:text-white">{transactions.last_page}</span>
                                </div>
                                <div className="flex gap-2">
                                    <PageBtn onClick={() => handlePageChange(transactions.current_page - 1)} disabled={transactions.current_page <= 1} dir="prev" />
                                    <PageBtn onClick={() => handlePageChange(transactions.current_page + 1)} disabled={transactions.current_page >= transactions.last_page} dir="next" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Withdrawal modal ──────────────────────────────────── */}
                <WithdrawalModal
                    open={showWithdrawalModal}
                    onClose={() => setShowWithdrawalModal(false)}
                    balance={savingsSummary?.currentBalance ?? 0}
                />
            </PaymentReminderLayout>
        </SidebarLayout>
    );
}

// ─── Transaction badge ────────────────────────────────────────────────────────

function TxBadge({ type, status }) {
    const isPending = status && ["pending", "Pending", "PENDING"].includes(status);

    if (isPending) {
        return (
            <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                Pending
            </span>
        );
    }

    return (
        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide border ${
            type === "withdrawal"
                ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
        }`}>
            {type}
        </span>
    );
}

// ─── Withdrawal modal: 3-step OTP flow ───────────────────────────────────────

const WITHDRAWAL_STEPS = { FORM: "form", OTP: "otp", DONE: "done" };

function WithdrawalModal({ open, onClose, balance }) {
    const [step, setStep]             = useState(WITHDRAWAL_STEPS.FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [otpToken, setOtpToken]     = useState(null);
    const [otpError, setOtpError]     = useState("");
    const [otp, setOtp]               = useState(["", "", "", "", "", ""]);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [maskedPhone, setMaskedPhone]   = useState("");
    const otpInputs = useRef([]);

    const [form, setForm] = useState({
        amount: "", payoutMethod: "", bankName: "", bankSearch: "",
        accountName: "", accountNumber: "", remarks: "",
    });

    // Reset everything when modal closes
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep(WITHDRAWAL_STEPS.FORM);
                setOtp(["", "", "", "", "", ""]);
                setOtpError("");
                setOtpToken(null);
                setResendCooldown(0);
                setForm({ amount: "", payoutMethod: "", bankName: "", bankSearch: "", accountName: "", accountNumber: "", remarks: "" });
            }, 300);
        }
    }, [open]);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    // ── Step 1: validate form & request OTP ──────────────────────────────────
    const handleRequestOtp = async (e) => {
        e.preventDefault();

        if (!form.payoutMethod)                                           return toast.error("Select a payout method.");
        if (!form.amount || Number(form.amount) <= 0)                    return toast.error("Enter a valid amount.");
        if (Number(form.amount) > balance)                               return toast.error("Amount exceeds your available balance.");
        if (form.payoutMethod !== "cash" && !form.accountName)           return toast.error("Account name is required.");
        if (form.payoutMethod === "bank" && !form.bankName)              return toast.error("Select a bank.");
        if (["gcash", "maya"].includes(form.payoutMethod) && !/^09\d{9}$/.test(form.accountNumber))
            return toast.error("Mobile number must start with 09 and be 11 digits.");

        setIsSubmitting(true);
        try {
            const { data } = await axios.post(route("member.savings.withdrawal.sendOtp"), {
                amount: form.amount,
            });
            if (data.error) {
                toast.error(data.message);
            } else {
                setMaskedPhone(data.maskedPhone || "");
                setResendCooldown(60);
                setStep(WITHDRAWAL_STEPS.OTP);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send OTP. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── OTP input handling ────────────────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...otp];
        next[index] = value;
        setOtp(next);
        setOtpError("");
        if (value && index < 5) otpInputs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowLeft" && index > 0)  otpInputs.current[index - 1]?.focus();
        if (e.key === "ArrowRight" && index < 5) otpInputs.current[index + 1]?.focus();
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(""));
            setOtpError("");
            otpInputs.current[5]?.focus();
        }
    };

    // ── Step 2: verify OTP ────────────────────────────────────────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) { setOtpError("Please enter the full 6-digit code."); return; }

        setIsSubmitting(true);
        try {
            const { data } = await axios.post(route("member.savings.withdrawal.verifyOtp"), { otp: code });
            if (data.error) {
                setOtpError(data.message);
            } else {
                setOtpToken(data.token);
                // Immediately submit the withdrawal
                await submitWithdrawal(data.token);
            }
        } catch (err) {
            setOtpError(err.response?.data?.message || "Verification failed. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Step 3: submit withdrawal ─────────────────────────────────────────────
    const submitWithdrawal = async (token) => {
        try {
            const { data } = await axios.post(route("member.savings.withdrawal"), {
                ...form,
                otpToken: token,
            });
            if (data.error) {
                toast.error(data.message);
                setStep(WITHDRAWAL_STEPS.FORM);
            } else {
                setStep(WITHDRAWAL_STEPS.DONE);
                router.reload({ only: ["savingsRows", "savingsSummary"] });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Submission failed. Please try again.");
            setStep(WITHDRAWAL_STEPS.FORM);
        }
    };

    // ── Resend OTP ────────────────────────────────────────────────────────────
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setIsSubmitting(true);
        try {
            const { data } = await axios.post(route("member.savings.withdrawal.sendOtp"), {
                amount: form.amount,
            });
            if (data.error) {
                toast.error(data.message);
            } else {
                setOtp(["", "", "", "", "", ""]);
                setOtpError("");
                setResendCooldown(60);
                toast.success("A new OTP has been sent.");
                otpInputs.current[0]?.focus();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to resend OTP.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredBanks = BANK_LIST.filter((b) =>
        form.bankSearch ? b.toLowerCase().includes(form.bankSearch.toLowerCase()) : true
    );

    return (
        <AnimatePresence>
            {open && (
                <ModalShell
                    title={
                        step === WITHDRAWAL_STEPS.FORM ? "Request Withdrawal" :
                        step === WITHDRAWAL_STEPS.OTP  ? "Verify Your Identity" :
                        "Request Submitted"
                    }
                    subtitle={
                        step === WITHDRAWAL_STEPS.FORM ? "Submit a withdrawal request for approval" :
                        step === WITHDRAWAL_STEPS.OTP  ? "Enter the OTP sent to your mobile" :
                        ""
                    }
                    onClose={onClose}
                    step={step}
                    totalSteps={2}
                >
                    {/* ── STEP 1: Form ─────────────────────────────────────── */}
                    {step === WITHDRAWAL_STEPS.FORM && (
                        <form className="flex-1 flex flex-col min-h-0 w-full relative" onSubmit={handleRequestOtp}>
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">

                                {/* Balance hint */}
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 px-4 py-3 flex items-center justify-between">
                                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Available balance</span>
                                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono">{formatCurrency(balance)}</span>
                                </div>

                                <Field label="Amount (PHP)" type="number" value={form.amount} onChange={(v) => handleChange("amount", v)} placeholder="Enter amount" />

                                <SelectField
                                    label="Payout Method"
                                    value={form.payoutMethod}
                                    onChange={(v) => handleChange("payoutMethod", v)}
                                    options={[
                                        { value: "bank",  label: "Bank Transfer" },
                                        { value: "gcash", label: "GCash" },
                                        { value: "maya",  label: "Maya" },
                                        { value: "cash",  label: "Cash (Over-the-counter)" },
                                    ]}
                                />

                                {form.payoutMethod === "cash" && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 p-3 text-xs">
                                        Cash withdrawals will be released at the PMPC office. You will be notified when ready.
                                    </div>
                                )}

                                {form.payoutMethod === "bank" && (
                                    <div className="space-y-1.5 relative z-50">
                                        <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">Bank Name</label>
                                        <Combobox
                                            value={form.bankName}
                                            onChange={(val) => { handleChange("bankName", val); handleChange("bankSearch", val); }}
                                        >
                                            <div className="relative">
                                                <Combobox.Input
                                                    className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                                    onChange={(e) => handleChange("bankSearch", e.target.value)}
                                                    displayValue={() => form.bankSearch}
                                                    placeholder="Search bank..."
                                                    autoComplete="off"
                                                />
                                                <Combobox.Options className="absolute mt-1 max-h-56 w-full overflow-y-auto rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xl dark:bg-[#0f1f1a] dark:border-white/10 dark:text-white text-sm custom-scrollbar p-1 z-50">
                                                    {filteredBanks.length === 0 && form.bankSearch !== "" ? (
                                                        <div className="py-3 px-4 text-slate-500 dark:text-slate-400 text-center italic">No bank found.</div>
                                                    ) : filteredBanks.map((bank) => (
                                                        <Combobox.Option
                                                            key={bank} value={bank}
                                                            className={({ active }) => `cursor-pointer select-none py-2.5 px-4 rounded-lg transition-colors ${active ? "bg-emerald-50 text-emerald-700 font-medium dark:bg-emerald-500/20 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}
                                                        >
                                                            {bank}
                                                        </Combobox.Option>
                                                    ))}
                                                </Combobox.Options>
                                            </div>
                                        </Combobox>
                                    </div>
                                )}

                                {form.payoutMethod !== "cash" && form.payoutMethod !== "" && (
                                    <>
                                        <Field label="Account Name" value={form.accountName} onChange={(v) => handleChange("accountName", v)} placeholder="Account holder name" />
                                        <Field
                                            label={["gcash", "maya"].includes(form.payoutMethod) ? "Mobile Number" : "Account Number"}
                                            value={form.accountNumber}
                                            onChange={(v) => handleChange("accountNumber", v)}
                                            placeholder={["gcash", "maya"].includes(form.payoutMethod) ? "09xxxxxxxxx" : "Account Number"}
                                        />
                                    </>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">Remarks (Optional)</label>
                                    <textarea
                                        className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:placeholder:text-white/20"
                                        rows={2} value={form.remarks}
                                        onChange={(e) => handleChange("remarks", e.target.value)}
                                        placeholder="Notes..."
                                    />
                                </div>

                                {/* Security notice */}
                                <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-500 dark:text-white/50 leading-relaxed">
                                        A one-time PIN will be sent to your registered mobile number via SMS to confirm this request.
                                    </p>
                                </div>
                            </div>

                            <ModalFooter onClose={onClose} isSubmitting={isSubmitting} submitLabel="Send OTP" loadingLabel="Sending OTP..." />
                        </form>
                    )}

                    {/* ── STEP 2: OTP entry ─────────────────────────────────── */}
                    {step === WITHDRAWAL_STEPS.OTP && (
                        <form className="flex-1 flex flex-col min-h-0 w-full" onSubmit={handleVerifyOtp}>
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

                                {/* Summary of what they're withdrawing */}
                                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-5 py-4 space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-white/50">Amount</span>
                                        <span className="font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(form.amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-white/50">Payout via</span>
                                        <span className="font-medium text-slate-700 dark:text-white/80 capitalize">{form.payoutMethod}</span>
                                    </div>
                                    {form.bankName && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 dark:text-white/50">Bank</span>
                                            <span className="font-medium text-slate-700 dark:text-white/80">{form.bankName}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center space-y-1">
                                    <p className="text-sm text-slate-600 dark:text-white/70">
                                        Enter the 6-digit code sent via SMS to
                                    </p>
                                    {maskedPhone && (
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{maskedPhone}</p>
                                    )}
                                </div>

                                {/* OTP input boxes */}
                                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => (otpInputs.current[i] = el)}
                                            type="text" inputMode="numeric" maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold rounded-xl border-2 outline-none transition
                                                bg-white dark:bg-white/5 text-slate-900 dark:text-white
                                                ${otpError
                                                    ? "border-rose-400 dark:border-rose-500 focus:border-rose-500"
                                                    : digit
                                                    ? "border-emerald-400 dark:border-emerald-500"
                                                    : "border-slate-200 dark:border-white/10 focus:border-emerald-500"
                                                }
                                            `}
                                            autoFocus={i === 0}
                                        />
                                    ))}
                                </div>

                                {/* Error */}
                                {otpError && (
                                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 px-4 py-3">
                                        <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                                        <p className="text-xs text-rose-700 dark:text-rose-300">{otpError}</p>
                                    </div>
                                )}

                                {/* Resend */}
                                <div className="text-center">
                                    {resendCooldown > 0 ? (
                                        <p className="text-xs text-slate-400 dark:text-white/30">
                                            Resend available in {resendCooldown}s
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={isSubmitting}
                                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 flex items-center gap-1 mx-auto"
                                        >
                                            <RefreshCw className="h-3 w-3" />
                                            Resend OTP
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => { setStep(WITHDRAWAL_STEPS.FORM); setOtp(["","","","","",""]); setOtpError(""); }}
                                    className="text-xs text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 mx-auto flex items-center gap-1 transition"
                                >
                                    ← Change withdrawal details
                                </button>
                            </div>

                            <ModalFooter onClose={onClose} isSubmitting={isSubmitting} submitLabel="Confirm Withdrawal" loadingLabel="Verifying..." />
                        </form>
                    )}

                    {/* ── STEP 3: Done ──────────────────────────────────────── */}
                    {step === WITHDRAWAL_STEPS.DONE && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5">
                            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Request submitted</h3>
                                <p className="text-sm text-slate-500 dark:text-white/50 max-w-xs">
                                    Your withdrawal of {formatCurrency(form.amount)} is now pending admin review. You'll be notified once it's processed.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition active:scale-[0.98] shadow-lg shadow-emerald-600/20"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </ModalShell>
            )}
        </AnimatePresence>
    );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function MiniStat({ label, value, icon: Icon, color = "text-slate-600 dark:text-white" }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 px-5 py-4 flex items-center gap-4 min-w-0 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
            <span className="grid place-items-center h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/10 shrink-0 border border-slate-200 dark:border-white/5 shadow-inner">
                <Icon className={`h-6 w-6 ${color}`} />
            </span>
            <div className="min-w-0">
                <div className="text-xs text-slate-500 dark:text-white/50 truncate uppercase tracking-wide font-medium">{label}</div>
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate mt-0.5">{value || "—"}</div>
            </div>
        </div>
    );
}

function ModalFooter({ onClose, isSubmitting, submitLabel, loadingLabel }) {
    return (
        <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0f1f1a] z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition shadow-sm">
                Cancel
            </button>
            <button
                type="submit" disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
            >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? loadingLabel : submitLabel}
            </button>
        </div>
    );
}

function ModalShell({ title, subtitle, onClose, children }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = "hidden";
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => { document.body.style.overflow = "unset"; window.removeEventListener("keydown", handler); };
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <motion.div
            className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                className="relative w-full max-w-lg bg-white dark:bg-[#0f1f1a] shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-3xl overflow-hidden"
                initial={{ scale: 0.97, y: -14 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.97, y: -14 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
                {/* Mobile drag handle */}
                <div className="sm:hidden flex justify-center pt-3 pb-1 absolute top-0 w-full z-50 bg-white dark:bg-[#0f1f1a]">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/20 rounded-full" />
                </div>

                {/* Header */}
                <div className="shrink-0 flex justify-between items-center px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-200/80 dark:border-white/10 z-20 bg-white dark:bg-[#0f1f1a] pt-8 sm:pt-6">
                    <div className="min-w-0 pr-4">
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</div>
                        {subtitle && <div className="text-xs sm:text-sm text-slate-500 dark:text-white/50 mt-0.5">{subtitle}</div>}
                    </div>
                    <button onClick={onClose} className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/30 dark:bg-transparent">
                    {children}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">{label}</label>
            <input
                type={type} value={value} placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder:text-slate-400 dark:placeholder:text-white/20"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">{label}</label>
            <select
                value={value} onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition [&>option]:text-slate-900 dark:[&>option]:text-white dark:[&>option]:bg-slate-800 cursor-pointer"
            >
                <option value="">Select...</option>
                {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
}

function PageBtn({ onClick, disabled, dir }) {
    return (
        <button
            onClick={onClick} disabled={disabled}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
            <ChevronRight className={`h-4 w-4 ${dir === "prev" ? "rotate-180" : ""}`} />
        </button>
    );
}