import React, { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { 
    ArrowLeft, PiggyBank, CalendarClock, TrendingUp, FileText, 
    AlertCircle, CheckCircle2, Wallet, ArrowDownLeft 
} from "lucide-react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";
import axios from "axios";
import toast from "react-hot-toast";

const asMoney = (v) => {
    const num = Number(v);
    return Number.isFinite(num)
        ? num.toLocaleString("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    : "₱0.00";
};

const toNumber = (v) => (Number.isFinite(+v) ? +v : 0);

export default function TimeDepositView() {
    const { props } = usePage();
    const { deposit: initialDeposit, transactions: initialTransactions = [] } =
        props || {};

    const [summary, setSummary] = useState(initialDeposit?.summary || {});
    const [transactions, setTransactions] = useState(initialTransactions);

    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawRemarks, setWithdrawRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const principal = toNumber(summary.principal || 0);
    const totalInterest = toNumber(summary.totalInterest || 0);
    const currentBalance = toNumber(summary.currentBalance || 0);
    const termYears = summary.termYears || 0;
    const interestRate = summary.interestRate || 0;
    const availableInterest = toNumber(summary.availableInterest || 0);

    const handleWithdraw = async (e) => {
        e.preventDefault();
        const amountNum = Number(withdrawAmount);

        if (!amountNum || amountNum <= 0) {
            toast.error("Enter a valid withdrawal amount.");
            return;
        }

        if (amountNum > availableInterest) {
            toast.error(
                "Withdrawal exceeds available interest. Principal is locked."
            );
            return;
        }

        try {
            setSubmitting(true);

            const { data } = await axios.post(
                route("admin.time.withdraw-interest", initialDeposit.id),
                {
                    amount: amountNum,
                    remarks: withdrawRemarks || "",
                }
            );

            if (!data?.success) {
                toast.error(
                    data?.message ||
                        "Failed to process interest withdrawal."
                );
                return;
            }

            setSummary(data.summary);
            setTransactions(data.transactions);
            setWithdrawAmount("");
            setWithdrawRemarks("");
            toast.success("Interest withdrawn successfully.");
        } catch (error) {
            console.error(error);
            const msg =
                error?.response?.data?.message ||
                "Error processing interest withdrawal.";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminSidebarLayout>
            <Head title="Time Deposit Details" />

            <div className="space-y-6">
                
                {/* HEADER */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Link
                            href={route("admin.time.index")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition-colors text-xs font-medium"
                        >
                            <ArrowLeft size={14} /> Back
                        </Link>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                                {summary.memberName ? summary.memberName.charAt(0) : "M"}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {summary.memberName || "Unknown Member"}
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                                    {summary.username && <span>@{summary.username}</span>}
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                                    <span>TD ID: {initialDeposit?.id}</span>
                                </p>
                            </div>
                        </div>
                        
                        {/* Account Tag */}
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm">
                            <CalendarClock className="text-emerald-500" size={18} />
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Account Type</span>
                                <span className="font-semibold text-slate-700 dark:text-white">Fixed Term Deposit</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        label="Current Balance" 
                        value={currentBalance} 
                        icon={PiggyBank} 
                        color="emerald" 
                        prefix="₱"
                    />
                    <StatCard 
                        label="Total Principal" 
                        value={principal} 
                        icon={Wallet} 
                        color="blue" 
                        prefix="₱"
                    />
                    <StatCard 
                        label="Interest Earned" 
                        value={totalInterest} 
                        icon={TrendingUp} 
                        color="amber" 
                        prefix="₱"
                    />
                    <StatCard 
                        label="Rate & Term" 
                        value={interestRate} 
                        icon={CalendarClock} 
                        color="purple" 
                        suffix="%"
                        subtext={`${termYears} Year${termYears > 1 ? 's' : ''} Term`}
                    />
                </div>

                {/* DETAILS & WITHDRAWAL GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT: INFO CARD */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-white/5">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText size={18} className="text-emerald-500" />
                                Account Details
                            </h3>
                        </div>
                        <div className="space-y-3 text-sm">
                            <DetailRow label="Start Date" value={summary.startDate} />
                            <DetailRow label="Maturity Date" value={summary.maturityDate} />
                            <DetailRow label="Credited Years" value={summary.creditedYears ?? 0} />
                            <DetailRow label="Interest Rate" value={`${interestRate}% p.a.`} />
                            <DetailRow label="Status" value="Active" badge="emerald" />
                        </div>
                    </div>

                    {/* RIGHT: WITHDRAWAL PANEL */}
                    <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none">
                            <Wallet size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Withdraw Interest</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                                    Principal is locked until maturity. You can only withdraw the interest earned to date.
                                </p>
                                
                                <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Available</div>
                                    <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                                        {asMoney(availableInterest)}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleWithdraw} className="w-full md:w-auto flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₱</span>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            className="w-full md:w-48 pl-7 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:bg-white/5 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Remarks</label>
                                    <input
                                        type="text"
                                        value={withdrawRemarks}
                                        onChange={(e) => setWithdrawRemarks(e.target.value)}
                                        className="w-full md:w-48 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:bg-white/5 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="Optional"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting || availableInterest <= 0}
                                    className="mt-1 w-full md:w-48 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? "Processing..." : (
                                        <>
                                            <ArrowDownLeft size={16} /> Withdraw
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* TRANSACTION HISTORY */}
                <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm overflow-hidden transition-colors">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                        <div className="flex items-center gap-2">
                            <FileText className="text-slate-400" size={18} />
                            <h2 className="font-semibold text-slate-900 dark:text-white">Transaction History</h2>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                            Credit = Principal / Interest • Debit = Withdrawal
                        </span>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400">Credit</th>
                                    <th className="px-6 py-4 text-right text-rose-600 dark:text-rose-400">Debit</th>
                                    <th className="px-6 py-4 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                                {transactions.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No transactions recorded.</td></tr>
                                ) : (
                                    transactions.map((t, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{t.date || "—"}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-slate-900 dark:text-white">{t.description}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                                {t.credit && t.credit !== "0.00" ? asMoney(t.credit) : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-rose-600 dark:text-rose-400">
                                                {t.debit && t.debit !== "0.00" ? asMoney(t.debit) : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold font-mono text-slate-900 dark:text-white">
                                                {asMoney(t.balanceAfter ?? 0)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/5">
                        {transactions.length === 0 ? (
                            <div className="p-10 text-center text-slate-500 dark:text-slate-400 text-sm">No transactions.</div>
                        ) : (
                            transactions.map((t, idx) => (
                                <div key={idx} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-white text-sm">{t.description}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{t.date || "—"}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-100 dark:border-white/5 pt-3">
                                        <div>
                                            <div className="text-[10px] uppercase opacity-60 dark:text-slate-400">Credit</div>
                                            <div className="font-mono text-emerald-600 dark:text-emerald-400">
                                                {t.credit && t.credit !== "0.00" ? asMoney(t.credit) : "—"}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] uppercase opacity-60 dark:text-slate-400">Debit</div>
                                            <div className="font-mono text-rose-600 dark:text-rose-400">
                                                {t.debit && t.debit !== "0.00" ? asMoney(t.debit) : "—"}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase opacity-60 dark:text-slate-400">Balance</div>
                                            <div className="font-mono font-bold text-slate-900 dark:text-white">
                                                {asMoney(t.balanceAfter ?? 0)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminSidebarLayout>
    );
}

// --- SUB COMPONENTS ---

function StatCard({ label, value, icon: Icon, color, prefix = "", suffix = "", subtext }) {
    const colors = {
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
        purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    };
    return (
        <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 shadow-sm flex items-center gap-4 transition-colors">
            <div className={`p-3 rounded-xl ${colors[color] || colors.emerald}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {prefix}<CountUp end={toNumber(value)} duration={1} separator="," decimals={2} />{suffix}
                </div>
                {subtext && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}

function DetailRow({ label, value, badge }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            {badge ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 uppercase tracking-wide">
                    {value}
                </span>
            ) : (
                <span className="font-medium text-slate-900 dark:text-white">{value || "—"}</span>
            )}
        </div>
    );
}