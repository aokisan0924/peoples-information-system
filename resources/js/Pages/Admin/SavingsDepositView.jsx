import React, { useEffect, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import { Loader2, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";

const asMoney = (v) =>
    (Number.isFinite(+v) ? +v : 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

// 15 Nov 25
const formatDateShort = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
    }).format(d);
};

const formatDateLong = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-PH", {
        year: "numeric",
        month: "long",
        day: "2-digit",
    }).format(d);
};

export default function SavingsDepositView() {
    const { props } = usePage();
    const { member, stats } = props;

    const rawStats = props.stats || {};
    const innerStats = rawStats.stats || rawStats;

    const totalSavings = Number(innerStats.totalSavings ?? 0);
    const totalDeposits = Number(innerStats.totalDeposits ?? 0);
    const totalWithdrawals = Number(innerStats.totalWithdrawals ?? 0);

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
    });

    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        memberId: member?.id || "",
        transactionType: "deposit",
        amount: "",
        referenceNumber: "",
    });

    const handleFormChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const loadData = async (page = 1) => {
        if (!member?.id) return;

        setLoading(true);
        try {
            const { data } = await axios.get(
                route("admin.savings.api-member", { memberId: member.id }),
                { params: { page } }
            );

            const sortedRows = (data.rows || []).slice().sort((a, b) => {
                const da = new Date(a.datePosted || a.date || 0);
                const db = new Date(b.datePosted || b.date || 0);
                return db.getTime() - da.getTime(); // latest on top
            });

            setRows(sortedRows);
            setMeta(
                data.meta || { currentPage: 1, lastPage: 1, perPage: 10, total: 0 }
            );
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [member?.id]);

    const handlePageChange = (page) => {
        if (page < 1 || page > meta.lastPage || page === meta.currentPage) return;
        loadData(page);
    };

    const openModal = () => {
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setForm({
            memberId: member?.id || "",
            transactionType: "deposit",
            amount: "",
            referenceNumber: "",
        });
    };

    const submitForm = async (e) => {
        e.preventDefault();
        if (!form.memberId || !form.transactionType || !form.amount) {
            return;
        }

        try {
            const { data } = await axios.post(route("admin.savings.store"), {
                memberId: Number(form.memberId),
                transactionType: form.transactionType,
                amount: Number(form.amount),
                referenceNumber: form.referenceNumber || null,
            });

            if (!data?.success) {
                return;
            }

            closeModal();
            await loadData(1);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AdminSidebarLayout>
            <Head title="Savings Deposit" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {member?.fullName || "Member Savings"}
                        </h1>
                        {member?.serialNumber && (
                            <p className="text-xs text-gray-500 mt-1">
                                Serial: {member.serialNumber}
                            </p>
                        )}
                        <p className="text-xs text-gray-500">
                            Username: {member?.username || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                            Email: {member?.email || "N/A"}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={openModal}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm hover:bg-emerald-700 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            New Savings Transaction
                        </button>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Savings (NET) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <div className="text-[11px] text-gray-500 mb-1">Total Savings</div>
                        <div className="text-lg font-semibold text-gray-900">
                            {asMoney(totalSavings)}
                        </div>
                    </div>

                    {/* Total Deposits */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <div className="text-[11px] text-gray-500 mb-1">Total Deposits</div>
                        <div className="text-lg font-semibold text-gray-900">
                            {asMoney(totalDeposits)}
                        </div>
                    </div>

                    {/* Total Withdrawals */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <div className="text-[11px] text-gray-500 mb-1">Total Withdrawals</div>
                        <div className="text-lg font-semibold text-gray-900">
                            {asMoney(totalWithdrawals)}
                        </div>
                    </div>
                </div>

                {/* Table of transactions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs sm:text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left">
                                    <th className="px-4 py-2 font-medium text-[10px] text-gray-500 uppercase tracking-wide">
                                        Date
                                    </th>
                                    <th className="px-4 py-2 font-medium text-[10px] text-gray-500 uppercase tracking-wide">
                                        Ref No.
                                    </th>
                                    <th className="px-4 py-2 font-medium text-[10px] text-gray-500 uppercase tracking-wide">
                                        Type
                                    </th>
                                    <th className="px-4 py-2 font-medium text-[10px] text-gray-500 uppercase tracking-wide text-right">
                                        Credit
                                    </th>
                                    <th className="px-4 py-2 font-medium text-[10px] text-gray-500 uppercase tracking-wide text-right">
                                        Debit
                                    </th>
                                    <th className="px-4 py-2 font-medium text-[10px] text-gray-500 uppercase tracking-wide text-right">
                                        Balance
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-6 text-center text-gray-500"
                                        >
                                            <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                                            Loading...
                                        </td>
                                    </tr>
                                )}

                                {!loading && rows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-6 text-center text-gray-500"
                                        >
                                            No savings transactions found.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    rows.map((r) => {
                                        const normalizedType = (
                                            r.transactionType || ""
                                        )
                                            .toString()
                                            .toLowerCase();

                                        const isDeposit =
                                            normalizedType === "deposit";

                                        const amount = Number(r.amount) || 0;
                                        const credit = isDeposit ? amount : null;
                                        const debit = !isDeposit ? amount : null;

                                        return (
                                            <tr
                                                key={r.id}
                                                className="border-t border-gray-100"
                                            >
                                                {/* Date */}
                                                <td className="px-4 py-2 text-[11px] text-gray-600 whitespace-nowrap">
                                                    {formatDateShort(
                                                        r.date || r.transactionDate
                                                    )}
                                                </td>

                                                {/* Ref No. */}
                                                <td className="px-4 py-2 text-[11px] text-gray-600 whitespace-nowrap">
                                                    {r.referenceNumber || "—"}
                                                </td>

                                                {/* Type */}
                                                <td className="px-4 py-2 text-[11px] text-gray-700 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                                                            isDeposit
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-red-50 text-red-700"
                                                        }`}
                                                    >
                                                        {isDeposit
                                                            ? "Deposit"
                                                            : "Withdrawal"}
                                                    </span>
                                                </td>

                                                {/* Credit */}
                                                <td className="px-4 py-2 text-xs sm:text-sm text-right whitespace-nowrap">
                                                    {credit ? (
                                                        <span className="text-emerald-600 font-medium">
                                                            {asMoney(credit)}
                                                        </span>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>

                                                {/* Debit */}
                                                <td className="px-4 py-2 text-xs sm:text-sm text-right whitespace-nowrap">
                                                    {debit ? (
                                                        <span className="text-red-600 font-medium">
                                                            - {asMoney(debit)}
                                                        </span>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>

                                                {/* Balance */}
                                                <td className="px-4 py-2 text-xs sm:text-sm text-right whitespace-nowrap">
                                                    {asMoney(
                                                        r.runningBalance ?? 0
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-600">
                        <div>
                            Showing{" "}
                            <span className="font-semibold">
                                {meta.total === 0
                                    ? 0
                                    : (meta.currentPage - 1) * meta.perPage + 1}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold">
                                {Math.min(meta.currentPage * meta.perPage, meta.total)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold">{meta.total}</span> entries
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handlePageChange(meta.currentPage - 1)}
                                disabled={meta.currentPage <= 1}
                                className="px-2 py-1 rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Prev
                            </button>
                            <span className="px-2">
                                Page{" "}
                                <span className="font-semibold">
                                    {meta.currentPage}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold">{meta.lastPage}</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => handlePageChange(meta.currentPage + 1)}
                                disabled={meta.currentPage >= meta.lastPage}
                                className="px-2 py-1 rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">
                                        New Savings Transaction
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 mb-1">
                                        Add Savings Deposit
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitForm} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Transaction Type
                                    </label>
                                    <select
                                        value={form.transactionType}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "transactionType",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    >
                                        <option value="deposit">Deposit</option>
                                        <option value="withdrawal">Withdrawal</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.amount}
                                        onChange={(e) =>
                                            handleFormChange("amount", e.target.value)
                                        }
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Reference Number (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.referenceNumber}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "referenceNumber",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Leave blank to auto-generate"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Save Transaction
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminSidebarLayout>
    );
}
