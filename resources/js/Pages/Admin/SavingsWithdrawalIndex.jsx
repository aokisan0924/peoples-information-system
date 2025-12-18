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
    ChevronLeft,
    ChevronRight,
    Banknote
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
            return "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
        if (s === "approved")
            return "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
        if (s === "posted" || s === "released")
            return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
        if (s === "declined")
            return "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
        return "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10";
    };

    return (
        <AdminSidebarLayout>
            <Head title="Savings Withdrawals" />

            <div className="space-y-6">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Banknote className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            Withdrawal Requests
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Review and manage savings withdrawal requests.
                        </p>
                    </div>
                </div>

                {/* TABLE CONTAINER */}
                <div className="bg-white dark:bg-white/5 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
                    
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                <tr>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {withdrawals.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No withdrawal requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    withdrawals.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {item.member.firstName} {item.member.lastName}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                                                    {item.member.username}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">
                                                ₱{Number(Math.abs(item.amount)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                            </td>

                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 capitalize">
                                                {item.payoutMethod}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusChip(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openDetails(item.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                                                >
                                                    <Eye size={14} />
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/5">
                        {withdrawals.data.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                No requests found.
                            </div>
                        ) : (
                            withdrawals.data.map((item) => (
                                <div key={item.id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                {item.member.firstName} {item.member.lastName}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                {item.member.username}
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusChip(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-white/5 pt-3">
                                        <div>
                                            <span className="block text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold">Amount</span>
                                            <span className="font-mono text-slate-900 dark:text-white font-medium">
                                                ₱{Number(Math.abs(item.amount)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold">Method</span>
                                            <span className="capitalize text-slate-700 dark:text-slate-300">{item.payoutMethod}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openDetails(item.id)}
                                        className="flex items-center justify-center w-full py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            Showing <span className="font-semibold text-slate-900 dark:text-white">{withdrawals.from || 0}</span> to <span className="font-semibold text-slate-900 dark:text-white">{withdrawals.to || 0}</span> of <span className="font-semibold text-slate-900 dark:text-white">{withdrawals.total}</span>
                        </div>
                        <div className="flex gap-2">
                            {withdrawals.links && (
                                <>
                                    <button 
                                        onClick={() => withdrawals.prev_page_url && router.visit(withdrawals.prev_page_url)}
                                        disabled={!withdrawals.prev_page_url}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button 
                                        onClick={() => withdrawals.next_page_url && router.visit(withdrawals.next_page_url)}
                                        disabled={!withdrawals.next_page_url}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0" onClick={() => setModalOpen(false)} />
                        <motion.div
                            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Withdrawal Request</h2>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {loadingDetails || !selected ? (
                                    <div className="py-12 flex justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                    </div>
                                ) : (
                                    <div className="space-y-6 text-sm">
                                        {/* Member Info */}
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Member Details</p>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                                                    {selected.member.firstName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{selected.member.firstName} {selected.member.lastName}</p>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs">@{selected.member.username}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Amount</p>
                                                <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                                                    ₱{Number(Math.abs(selected.amount)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Reference</p>
                                                <p className="font-mono text-slate-700 dark:text-slate-300">{selected.referenceNumber}</p>
                                            </div>
                                        </div>

                                        <hr className="border-slate-100 dark:border-white/10" />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Method</p>
                                                <p className="capitalize text-slate-900 dark:text-white font-medium">{selected.payoutMethod}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Channel</p>
                                                <p className="text-slate-900 dark:text-white">{selected.payoutChannel || "N/A"}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Account Name</p>
                                                <p className="text-slate-900 dark:text-white">{selected.withdrawalAccountName || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Account No.</p>
                                                <p className="font-mono text-slate-900 dark:text-white">{selected.withdrawalAccountNumber || "N/A"}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Remarks</p>
                                            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5">
                                                {selected.withdrawalRemarks || "No remarks provided."}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            {selected && !loadingDetails && (
                                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-white/5">
                                    {(selected.status || "").toLowerCase() === "pending" && (
                                        <>
                                            <button
                                                onClick={decline}
                                                className="px-4 py-2 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-colors flex items-center gap-2"
                                            >
                                                <Ban size={16} /> Decline
                                            </button>
                                            <button
                                                onClick={approve}
                                                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                                            >
                                                <Check size={16} /> Approve
                                            </button>
                                        </>
                                    )}

                                    {(selected.status || "").toLowerCase() === "approved" && (
                                        <button
                                            onClick={release}
                                            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                        >
                                            <ArrowLeftRight size={16} /> Release Funds
                                        </button>
                                    )}
                                    
                                    {["released", "declined"].includes((selected.status || "").toLowerCase()) && (
                                        <span className="text-sm text-slate-500 italic">No further actions available.</span>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminSidebarLayout>
    );
}