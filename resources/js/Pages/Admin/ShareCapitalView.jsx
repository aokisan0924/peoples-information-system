import React, { useEffect, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import { Loader2, Plus, X } from "lucide-react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";

const asMoney = (v) =>
    (Number.isFinite(+v) ? +v : 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const formatDateLong = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-PH", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(d);
    };

    export default function MemberShareCapital() {
    const { props } = usePage();
    const { member, stats } = props;

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
    });
    const [loading, setLoading] = useState(false);

    const [totals, setTotals] = useState({
        totalDeposit: 0,
        totalWithdrawal: 0,
        totalBalance: 0,
    });

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        transactionType: "deposit",
        amount: "",
        reference_number: "",
    });
    const [saving, setSaving] = useState(false);
    const [errorBag, setErrorBag] = useState({});

    const loadData = async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await axios.get(
                route("admin.share-capital.api-member", { memberId: member.id }),
                { params: { page, perPage: meta.perPage } }
            );
            setRows(data.rows || []);
            setMeta(data.meta || {});
        } finally {
            setLoading(false);
        }
    };

    const loadTotals = async () => {
        try {
            const { data } = await axios.get(
                route("admin.share-capital.api-member", { memberId: member.id }),
                { params: { page: 1, perPage: 50000 } }
            );
            const all = Array.isArray(data.rows) ? data.rows : [];
            let totalDeposit = 0,
                totalWithdrawalAbs = 0,
                totalBalance = 0;
            all.forEach((r) => {
                const credit = Number.isFinite(+r.credit) ? Math.abs(+r.credit) : 0;
                const debitAbs = Number.isFinite(+r.debit) ? Math.abs(+r.debit) : 0;
                const signed = credit - debitAbs;
                totalDeposit += credit;
                totalWithdrawalAbs += debitAbs;
                totalBalance += signed;
            });
            setTotals({
                totalDeposit,
                totalWithdrawal: totalWithdrawalAbs,
                totalBalance,
            });
        } catch {
            setTotals({ totalDeposit: 0, totalWithdrawal: 0, totalBalance: 0 });
        }
    };

    useEffect(() => {
        loadData(1);
        loadTotals();
    }, []);

    const openModal = () => {
        setErrorBag({});
        setForm({ transactionType: "deposit", amount: "", reference_number: "" });
        setShowModal(true);
    };
    const closeModal = () => setShowModal(false);

    const handleSave = async () => {
        setSaving(true);
        setErrorBag({});
        try {
            await axios.post(route("admin.share-capital.store"), {
            memberId: member.id,
            transactionType: form.transactionType,
            amount: Number(form.amount),
            reference_number: form.reference_number || null,
        });
            setSaving(false);
            setShowModal(false);
            await loadData(meta.currentPage || 1);
            await loadTotals();
        } catch (e) {
            setSaving(false);
            if (e.response && e.response.status === 422) {
                setErrorBag(e.response.data.errors || {});
            } else {
                alert("Something went wrong. Please try again.");
            }
        }
    };

    return (
        <>
            <Head title="Share Capital Deposit">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="p-4 md:p-6 space-y-6">
                {/* Header */}
                <div className="rounded-2xl bg-white shadow border border-gray-100 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <div className="text-lg font-semibold text-gray-900">
                            {member.name}
                            </div>
                            <div className="text-sm text-gray-600">
                            {member.username} • {member.email}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                            onClick={openModal}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm"
                            >
                            <Plus className="h-4 w-4" />
                            New Entry
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-xl border p-3">
                            <div className="text-xs text-gray-500">Total Paid-Up Capital</div>
                            <div className="text-xl font-semibold">{(totals.totalBalance / 500)}</div>
                        </div>
                        <div className="rounded-xl border p-3">
                            <div className="text-xs text-gray-500">Total Deposit</div>
                            <div className="text-xl font-semibold text-green-700">
                            {asMoney(totals.totalDeposit)}
                            </div>
                        </div>
                        <div className="rounded-xl border p-3">
                            <div className="text-xs text-gray-500">Total Withdrawal</div>
                            <div className="text-xl font-semibold text-red-600">
                            {asMoney(-totals.totalWithdrawal)}
                            </div>
                        </div>
                        <div className="rounded-xl border p-3">
                            <div className="text-xs text-gray-500">Total Balance</div>
                            <div className="text-xl font-semibold text-gray-800">
                            {asMoney(totals.totalBalance)}
                            </div>
                        </div>
                    </div>
                </div>

                    {/* Ledger Table */}
                    <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto px-2">{/* <-- optional extra inner padding */}
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="text-left px-6 py-3 font-semibold">Date</th>
                                        <th className="text-left px-6 py-3 font-semibold">Date Posted</th>
                                        <th className="text-left px-6 py-3 font-semibold">Reference No.</th>
                                        <th className="text-right px-6 py-3 font-semibold text-green-700">
                                            Credit (Deposit)
                                        </th>
                                        <th className="text-right px-6 py-3 font-semibold text-red-700">
                                            Debit (Withdrawal)
                                        </th>
                                        <th className="text-right px-6 pr-10 md:pr-12 py-3 font-semibold">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                                            <Loader2 className="animate-spin inline-block mr-2" />
                                            Loading…
                                        </td>
                                    </tr>
                                    ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                                            No records
                                        </td>
                                    </tr>
                                    ) : (
                                    rows.map((r) => (
                                        <tr
                                            key={r.id}
                                            className="border-t hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-3">{formatDateLong(r.date)}</td>
                                            <td className="px-6 py-3">{formatDateLong(r.datePosted)}</td>
                                            <td className="px-6 py-3">{r.reference_number || "—"}</td>
                                            <td className="text-right text-green-700 font-medium">
                                                {r.credit != null ? asMoney(r.credit) : "–"}
                                            </td>
                                            <td className="text-right text-red-600 font-medium">
                                                {r.debit != null ? asMoney(r.debit) : "–"}
                                            </td>
                                            <td
                                                className={`text-right font-semibold px-6 pr-10 md:pr-12 ${
                                                (r.balance ?? 0) < 0 ? "text-red-700" : "text-green-700"
                                                }`}
                                            >
                                                {asMoney(r.balance ?? 0)}
                                            </td>
                                        </tr>
                                    ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-t text-sm text-gray-600">
                            <div>
                                Showing {(meta.currentPage - 1) * (meta.perPage || 0) + (rows.length ? 1 : 0)}–
                                {(meta.currentPage - 1) * (meta.perPage || 0) + rows.length} of {meta.total}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    disabled={meta.currentPage <= 1 || loading}
                                    onClick={() => loadData((meta.currentPage || 1) - 1)}
                                    className="px-3 py-1 rounded border disabled:opacity-50"
                                >
                                    Prev
                                </button>

                                <button
                                    disabled={meta.currentPage >= meta.lastPage || loading}
                                    onClick={() => loadData((meta.currentPage || 1) + 1)}
                                    className="px-3 py-1 rounded border disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
                    <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">New Entry</h3>
                            <button onClick={closeModal} className="p-1 rounded hover:bg-gray-100">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Transaction Type</label>
                                <select
                                    value={form.transactionType}
                                    onChange={(e) => setForm((s) => ({ ...s, transactionType: e.target.value }))}
                                    className="w-full h-11 appearance-none rounded-xl border border-gray-300 px-4 pr-9 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 cursor-pointer"
                                >
                                    <option value="deposit">Deposit </option>
                                    <option value="withdrawal">Withdrawal</option>
                                </select>
                                {errorBag?.transactionType && (
                                    <p className="text-xs text-red-600 mt-1">{errorBag.transactionType[0]}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Amount (₱)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                                    className="w-full h-11 rounded-xl border border-gray-300 px-4 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                                    placeholder="0.00"
                                />
                                {errorBag?.amount && (
                                    <p className="text-xs text-red-600 mt-1">{errorBag.amount[0]}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Reference No. (optional)</label>
                                <input
                                    type="text"
                                    value={form.referenceNumber}
                                    onChange={(e) => setForm((s) => ({ ...s, referenceNumber: e.target.value }))}
                                    className="w-full h-11 rounded-xl border border-gray-300 px-4 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                                    placeholder="e.g., OR-12345"
                                />
                                {errorBag?.referenceNumber && (
                                    <p className="text-xs text-red-600 mt-1">{errorBag.referenceNumber[0]}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button onClick={closeModal} className="px-3 py-2 rounded-lg border">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                {saving ? "Saving…" : "Save Entry"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminSidebarLayout>
        </>
    );
}