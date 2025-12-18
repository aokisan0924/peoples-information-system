import React, { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import {  ArrowLeft, PiggyBank, CalendarClock, TrendingUp, FileText } from "lucide-react";
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
                route("admin.timeDeposit.withdraw-interest", initialDeposit.id),
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
        <>
            <Head title="Time Deposit Details">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <AdminSidebarLayout>
                <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route("admin.time.index")}
                                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Time Deposit List
                            </Link>
                        </div>
                    </div>

                    {/* Title + member info */}
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <CalendarClock className="w-6 h-6 text-emerald-600" />
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Time Deposit Details
                                </h1>
                            </div>
                            <p className="text-sm text-gray-500">
                                Member:{" "}
                                <span className="font-semibold text-gray-800">
                                    {summary.memberName || "Unknown Member"}
                                </span>{" "}
                                {summary.username && (
                                    <span className="text-gray-500">
                                        ({summary.username})
                                    </span>
                                )}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                TD ID: {initialDeposit?.id}
                            </p>
                        </div>

                        {/* Meta info */}
                        <div className="w-full lg:w-80 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-xs text-gray-600">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-800">
                                    Time Deposit Info
                                </span>
                                <FileText className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <span className="text-gray-500">Start Date</span>
                                <span className="text-gray-800">
                                    {summary.startDate || "—"}
                                </span>

                                <span className="text-gray-500">
                                    Maturity Date
                                </span>
                                <span className="text-gray-800">
                                    {summary.maturityDate || "—"}
                                </span>

                                <span className="text-gray-500">Term</span>
                                <span className="text-gray-800">
                                    {termYears}{" "}
                                    {termYears === 1 ? "year" : "years"}
                                </span>

                                <span className="text-gray-500">
                                    Rate (per annum)
                                </span>
                                <span className="text-gray-800">
                                    {interestRate}% p.a.
                                </span>

                                <span className="text-gray-500">
                                    Credited Years
                                </span>
                                <span className="text-gray-800">
                                    {summary.creditedYears ?? 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                <PiggyBank className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">
                                    Current Balance
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={currentBalance}
                                        duration={1}
                                        decimals={2}
                                        prefix="₱"
                                        separator=","
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                <CalendarClock className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">
                                    Total Principal
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={principal}
                                        duration={1}
                                        decimals={2}
                                        prefix="₱"
                                        separator=","
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">
                                    Total Interest Earned
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={totalInterest}
                                        duration={1}
                                        decimals={2}
                                        prefix="₱"
                                        separator=","
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                <CalendarClock className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">
                                    Term &amp; Rate
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                    {termYears}{" "}
                                    {termYears === 1 ? "year" : "years"} at{" "}
                                    {interestRate}% p.a.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Withdraw interest panel */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div>
                            <div className="text-xs font-semibold text-gray-700 mb-1">
                                Available Interest for Withdrawal
                            </div>
                            <div className="text-lg font-bold text-emerald-700">
                                {asMoney(availableInterest)}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Only interest can be withdrawn. Principal
                                remains locked until the end of the term.
                            </p>
                        </div>
                        <form
                            onSubmit={handleWithdraw}
                            className="flex flex-col sm:flex-row gap-2 items-start sm:items-end"
                        >
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    Withdrawal Amount
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={withdrawAmount}
                                    onChange={(e) =>
                                        setWithdrawAmount(e.target.value)
                                    }
                                    className="w-40 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    Remarks (optional)
                                </label>
                                <input
                                    type="text"
                                    value={withdrawRemarks}
                                    onChange={(e) =>
                                        setWithdrawRemarks(e.target.value)
                                    }
                                    className="w-52 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="e.g. annual interest payout"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Processing..." : "Withdraw Interest"}
                            </button>
                        </form>
                    </div>

                    {/* Transaction table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-800">
                                    Time Deposit Transactions
                                </span>
                            </div>
                            <span className="text-xs text-gray-400">
                                Credit = Principal / Interest In, Debit = Interest
                                Withdrawn (Principal locked)
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                                    <tr>
                                        <th className="px-4 py-2 text-left">
                                            Date
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            Description
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            Credit
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            Debit
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-6 text-center text-gray-500 text-sm"
                                            >
                                                No transactions recorded for this
                                                time deposit yet.
                                            </td>
                                        </tr>
                                    )}

                                    {transactions.map((t, idx) => (
                                        <tr
                                            key={idx}
                                            className="border-t border-gray-100"
                                        >
                                            <td className="px-4 py-2 text-xs text-gray-700 whitespace-nowrap">
                                                {t.date || "—"}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-gray-800">
                                                {t.description}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-right text-emerald-700 whitespace-nowrap">
                                                {t.credit && t.credit !== 0
                                                    ? asMoney(t.credit)
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-right text-rose-700 whitespace-nowrap">
                                                {t.debit && t.debit !== 0
                                                    ? asMoney(t.debit)
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-right text-gray-900 whitespace-nowrap">
                                                {asMoney(
                                                    t.balanceAfter ?? 0
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminSidebarLayout>
        </>
    );
}
