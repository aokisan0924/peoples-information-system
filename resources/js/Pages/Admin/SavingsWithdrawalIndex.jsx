import React, { useState } from "react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import {
    Eye,
    Loader2,
    X,
    Check,
    ArrowLeftRight,
    Ban,
} from "lucide-react";

export default function SavingsWithdrawalIndex({ withdrawals }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    /** Fetch details for modal */
    const openDetails = async (memberId) => {
        setModalOpen(true);
        setLoadingDetails(true);

        try {
            const response = await axios.get(
                route("admin.savings.withdrawal.show", memberId)
            );
            setSelected(response.data.withdrawal);
        } catch {
            toast.error("Unable to load details.");
            setModalOpen(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    /** Approve */
    const approve = async () => {
        try {
            const response = await axios.post(
                route("admin.savings.withdrawal.approve", selected.id)
            );
            toast.success(response.data.message);
            setModalOpen(false);
            router.reload();
        } catch {
            toast.error("Unable to approve.");
        }
    };

    /** Decline */
    const decline = async () => {
        try {
            await axios.post(
                route("admin.savings.withdrawal.decline", selected.id)
            );
            toast.success("Request declined.");
            setModalOpen(false);
            router.reload();
        } catch {
            toast.error("Unable to decline.");
        }
    };

    /** Release */
    const release = async () => {
        try {
            const response = await axios.post(
                route("admin.savings.withdrawal.release", selected.id)
            );
            toast.success(response.data.message);
            setModalOpen(false);
            router.reload();
        } catch {
            toast.error("Unable to release.");
        }
    };

    /** Status Badge */
    const statusChip = (status) => {
        const s = (status || "").toLowerCase();
        if (s === "pending")
            return "bg-yellow-50 text-yellow-700 border border-yellow-200";
        if (s === "approved")
            return "bg-emerald-50 text-emerald-700 border border-emerald-200";
        if (s === "posted")
            return "bg-blue-50 text-blue-700 border border-blue-200";
        if (s === "declined")
            return "bg-red-50 text-red-700 border border-red-200";
        return "bg-slate-100 text-slate-600 border border-slate-200";
    };

    return (
        <AdminSidebarLayout>
            <Head title="Savings Withdrawals" />

            <div className="space-y-8">

                {/* HEADER */}
                <div>
                    <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
                        Savings Withdrawal Requests
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Review, approve, and release member withdrawal transactions.
                    </p>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-200">
                            <tr className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                <th className="px-6 py-3">Member</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Method</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {withdrawals.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-10 text-center text-slate-500"
                                    >
                                        No withdrawal requests found.
                                    </td>
                                </tr>
                            )}

                            {withdrawals.data.map((item) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900">
                                            {item.member.firstName} {item.member.lastName}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {item.member.username}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 font-semibold text-slate-900">
                                        ₱
                                        {Number(Math.abs(item.amount)).toLocaleString(
                                            "en-PH",
                                            { minimumFractionDigits: 2 }
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-slate-700 capitalize">
                                        {item.payoutMethod}
                                    </td>

                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-medium ${statusChip(
                                                item.status
                                            )}`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openDetails(item.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium shadow-sm transition"
                                        >
                                            <Eye size={14} />
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* PAGINATION */}
                    <div className="flex items-center justify-between p-5 text-xs text-slate-500">
                        <div>
                            Showing {withdrawals.from} to {withdrawals.to} of{" "}
                            {withdrawals.total}
                        </div>
                        <div className="flex gap-1">
                            {withdrawals.links.map((link, i) => (
                                <button
                                    key={i}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    onClick={() => link.url && router.visit(link.url)}
                                    disabled={!link.url}
                                    className={`px-3 py-1.5 rounded-lg transition text-sm font-medium ${
                                        link.active
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 relative"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        >
                            {/* Close */}
                            <button
                                onClick={() => setModalOpen(false)}
                                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                            >
                                <X size={22} />
                            </button>

                            {loadingDetails || !selected ? (
                                <div className="py-12 flex justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                                </div>
                            ) : (
                                <>
                                    {/* Title */}
                                    <h2 className="text-[22px] font-bold text-slate-900 mb-6">
                                        Withdrawal Summary
                                    </h2>

                                    {/* Info Sections */}
                                    <div className="space-y-6 text-sm">

                                        {/* MEMBER */}
                                        <section>
                                            <p className="font-semibold text-slate-600">
                                                Member
                                            </p>
                                            <p className="mt-1 text-slate-800">
                                                {selected.member.firstName}{" "}
                                                {selected.member.lastName} (
                                                {selected.member.username})
                                            </p>
                                        </section>

                                        {/* DIVIDER */}
                                        <hr className="border-slate-200" />

                                        {/* REFERENCE & AMOUNT */}
                                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="font-semibold text-slate-600">
                                                    Reference
                                                </p>
                                                <p className="mt-1 text-slate-800">
                                                    {selected.referenceNumber}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-600">
                                                    Amount
                                                </p>
                                                <p className="mt-1 text-lg font-bold text-slate-900">
                                                    ₱
                                                    {Number(
                                                        Math.abs(selected.amount)
                                                    ).toLocaleString("en-PH", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                        </section>

                                        <hr className="border-slate-200" />

                                        {/* PAYOUT INFO */}
                                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="font-semibold text-slate-600">
                                                    Payout Method
                                                </p>
                                                <p className="mt-1">
                                                    {selected.payoutMethod.toUpperCase()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-600">
                                                    Channel / Bank
                                                </p>
                                                <p className="mt-1">
                                                    {selected.payoutChannel || "N/A"}
                                                </p>
                                            </div>
                                        </section>

                                        {/* ACCOUNT INFO */}
                                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="font-semibold text-slate-600">
                                                    Account Name
                                                </p>
                                                <p className="mt-1">
                                                    {selected.withdrawalAccountName ||
                                                        "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-600">
                                                    Account Number
                                                </p>
                                                <p className="mt-1">
                                                    {selected.withdrawalAccountNumber ||
                                                        "N/A"}
                                                </p>
                                            </div>
                                        </section>

                                        {/* REMARKS */}
                                        <section>
                                            <p className="font-semibold text-slate-600">
                                                Remarks
                                            </p>
                                            <p className="mt-1">
                                                {selected.withdrawalRemarks || "None"}
                                            </p>
                                        </section>

                                        {/* DATE FILED */}
                                        <section>
                                            <p className="font-semibold text-slate-600">
                                                Date Filed
                                            </p>
                                            <p className="mt-1">{selected.created_at}</p>
                                        </section>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="mt-8 flex justify-end gap-3">

                                        {/* DECLINE */}
                                        {selected.status === "Pending" && (
                                            <button
                                                onClick={decline}
                                                className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-sm text-xs flex items-center gap-1"
                                            >
                                                <Ban size={14} /> Decline
                                            </button>
                                        )}

                                        {/* APPROVE */}
                                        {selected.status === "Pending" && (
                                            <button
                                                onClick={approve}
                                                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow text-xs flex items-center gap-1"
                                            >
                                                <Check size={14} /> Approve
                                            </button>
                                        )}

                                        {/* RELEASE */}
                                        {(selected.status || "").toLowerCase() ===
                                            "approved" && (
                                            <button
                                                onClick={release}
                                                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow text-xs flex items-center gap-1"
                                            >
                                                <ArrowLeftRight size={14} /> Release
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminSidebarLayout>
    );
}
