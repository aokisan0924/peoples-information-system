import React, { useEffect, useState } from "react";
import { Head, Link, usePage } from '@inertiajs/react';
import { Download, Loader2, RefreshCcw, Search, Filter,  Eye, Plus, Banknote, Wallet, TrendingUp, Users, PiggyBank, X } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { Combobox } from "@headlessui/react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";
import toast from "react-hot-toast";
import axios from 'axios';

const toNumber = (v) => (Number.isFinite(+v) ? +v : 0);

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

export default function ShareCapital() {
    const { props } = usePage();
    const { stats: initialStats = {}, defaults = {} } = props;
    const [ stats, setStats ] = useState(initialStats);
    const [ status, setStatus ] = useState(defaults.status || 'all');
    const [ memberQuery, setMemberQuery ] = useState("");

    const [ search, setSearch ] = useState(defaults.search || '');
    const [ dateFrom, setDateFrom ] = useState(defaults.dateFrom || '');
    const [ dateTo, setDateTo ] = useState(defaults.dateTo || '');
    const [ perPage, setPerPage ] = useState(defaults.perPage || 10);

    const [ loading, setLoading ] = useState(false);
    const [ rows, setRows ] = useState([]);
    const [ meta, setMeta ] = useState({ currentPage: 1, lastPage: 1, perPage: perPage, total: 0 });

    const [ showModal, setShowModal ] = useState(false);
    const [ memberOptions, setMemberOptions ] = useState([]);
    const [ form, setForm ] = useState({
        memberId: '',
        transactionType: 'deposit',
        amount: '',
        referenceNumber: '',
    });

    const [ submitting, setSubmitting] = useState(false);
    const [ loadMembers, setLoadMembers] = useState(false);

    const filteredMembers =
    memberQuery.trim() === ""
        ? memberOptions
        : memberOptions.filter((m) =>
            m.label.toLowerCase().includes(memberQuery.toLowerCase())
        );

    const loadData = async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('admin.share-capital.api-index'), {
            params: { search, status, dateFrom, dateTo, perPage, page }
        });
            setRows(data.rows || []);
            setMeta(data.meta || { currentPage: 1, lastPage: 1, perPage, total: 0 });
        } catch (e) {
            console.error(e);
            const msg = e?.response?.data?.message || e?.message || "Failed to load data.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const id = setTimeout(() => loadData(1), 300);
        return () => clearTimeout(id);
    }, [search, dateFrom, dateTo, perPage]);

    const openModal = async () => {
        setShowModal(true);
        if (!memberOptions.length) {
            try {
                setLoadMembers(true);
                const { data } = await axios.get(route('admin.share-capital.api-members-min'));
                setMemberOptions(data.rows || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadMembers(false);
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setForm({ memberId: '', transactionType: 'deposit', amount: '', referenceNumber: '' });
    };

    const submitEntry = async () => {
        if (!form.memberId || !form.amount) {
            toast.error("Member and amount are required.");
            return;
        }
    
        setSubmitting(true);
        try {
            const { data } = await axios.post(route('admin.share-capital.store'), {
                memberId: Number(form.memberId),
                transactionType: form.transactionType,
                amount: Number(form.amount),
                referenceNumber: form.referenceNumber || null,
            });
    
            if (!data?.success) {
                toast.error(data?.message || 'Transaction failed.');
                return;
            }
    
            toast.success(data.message || 'Transaction complete.');
            closeModal();
    
            await loadData(1);
    
            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            const httpStatus = error?.response?.status;
            const resp       = error?.response?.data;
    
            if (httpStatus === 422) {
                const msg = resp?.message
                    || resp?.errors?.amount?.[0]
                    || 'Withdrawal amount exceeds available balance.';
                toast.error(msg);
            } else {
                toast.error('Failed to save entry. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const buildExportHref = (params) => {
        const clean = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
        );
        const qs = new URLSearchParams(clean).toString();
        return route("admin.share-capital.export") + (qs ? `?${qs}` : "");
    };

    const quickSetToday = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = String(d.getDate()).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const iso = `${y}-${mm}-${day}`;
        setDateFrom(iso);
        setDateTo(iso);
    };

    const quickSetThisMonth = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const first = `${y}-${String(m).padStart(2, "0")}-01`;
        const lastDate = new Date(y, m, 0).getDate();
        const last = `${y}-${String(m).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;
        setDateFrom(first);
        setDateTo(last);
    };

    const quickSetThisYear = () => {
        const d = new Date();
        const y = d.getFullYear();
        const first = `${y}-01-01`;
        const last = `${y}-12-31`;
        setDateFrom(first);
        setDateTo(last);
    };

    return (
        <>
            <Head title="Share Capital Deposit">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <PiggyBank className="w-6 h-6 text-emerald-600" />
                                Share Capital Contribution
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Monitor total share capital per member.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                href={buildExportHref({ search, dateFrom, dateTo })}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                            <button
                                type="button"
                                onClick={openModal}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                New Transaction
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-3">

                        {/* Total Share Capital */}
                        <motion.div
                            layout
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
                        >
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Total Share Capital</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={toNumber(stats.totalShareCapital || 0)}
                                        duration={1.5}
                                        separator=","
                                        prefix="₱"
                                        decimals={2}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Total Paid-Up Capital */}
                        <motion.div
                            layout
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
                        >
                            <div className="p-2 rounded-xl bg-yellow-50 text-yellow-600">
                                <RefreshCcw className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Total Paid Up Capital</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={toNumber(stats.postedShareCapital/500)}
                                        duration={1.5}
                                        separator=","
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Contributors */}
                        <motion.div
                            layout
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
                        >
                            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Contributors</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={toNumber(stats.contributorCount || 0)}
                                        duration={1}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-end gap-3">
                            {/* Search */}
                            <div className="md:flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Search Member / Reference
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Name, username, or reference..."
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Date range */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        From
                                    </label>
                                    <input
                                        type="date"
                                        value={dateFrom || ""}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full sm:w-40 py-2 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        To
                                    </label>
                                    <input
                                        type="date"
                                        value={dateTo || ""}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full sm:w-40 py-2 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Per page */}
                            <div className="flex gap-2 items-end">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Per Page
                                    </label>
                                    <select
                                        value={perPage}
                                        onChange={(e) => setPerPage(Number(e.target.value))}
                                        className="w-24 py-2 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                    >
                                        {[10, 20, 50, 100].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Quick filters */}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <button
                                type="button"
                                onClick={quickSetToday}
                                className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={quickSetThisMonth}
                                className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                            >
                                This Month
                            </button>
                            <button
                                type="button"
                                onClick={quickSetThisYear}
                                className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                            >
                                This Year
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDateFrom("");
                                    setDateTo("");
                                }}
                                className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                            >
                                Clear Dates
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="text-left px-6 py-3 font-semibold">Member</th>
                                        <th className="text-right px-6 py-3 font-semibold">Total Deposits</th>
                                        <th className="text-right px-6 py-3 font-semibold">Total Withdrawals</th>
                                        <th className="text-right px-6 py-3 font-semibold">Balance</th>
                                        <th className="text-right px-6 py-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                                                <div className="inline-flex items-center gap-2">
                                                <Loader2 className="animate-spin" /> Loading...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-6 text-center text-gray-500">No records found</td>
                                        </tr>
                                    ) : (
                                        rows.map((r) => (
                                        <tr key={r.memberId} className="border-t">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {r.member}
                                                        </span>
                                                        {r.username && (
                                                            <span className="text-xs text-gray-500">
                                                                {r.username}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">{asMoney(r.totalDeposits)}</td>
                                            <td className="px-6 py-3 text-right">{asMoney(r.totalWithdrawals)}</td>
                                            <td className="px-6 py-3 text-right font-semibold">
                                                <span className={(+r.balance) < 0 ? 'text-red-600' : 'text-gray-900'}>
                                                    {asMoney(r.balance)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right whitespace-nowrap">
                                                <Link
                                                    href={route('admin.share-capital.member', r.memberId)}
                                                    className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-600">
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
                                of <span className="font-semibold">{meta.total}</span> entries
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
                                    <span className="font-semibold">{meta.currentPage}</span> of{" "}
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
            </AdminSidebarLayout>

            {/* New Entry Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Add Share Capital Entry
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        Record a deposit or withdrawal for a member&apos;s share capital.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                >
                                    <span className="sr-only">Close</span>
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Member */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Member <span className="text-red-500">*</span>
                                    </label>

                                    <Combobox value={form.memberId} onChange={(val) => setForm({ ...form, memberId: val })}>
                                        <div className="relative">
                                            <Combobox.Input
                                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                                placeholder="Search member…"
                                                onChange={(e) => setMemberQuery(e.target.value)}
                                                displayValue={(id) => {
                                                    const found = memberOptions.find((m) => m.id === id);
                                                    return found ? found.label : "";
                                                }}
                                            />

                                            {/* Dropdown Icon */}
                                            <svg
                                                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                                            </svg>
                                        </div>

                                        {/* Dropdown List */}
                                        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-lg focus:outline-none">
                                            {loadMembers ? (
                                                <div className="p-2 text-gray-400">Loading…</div>
                                            ) : filteredMembers.length === 0 ? (
                                                <div className="p-2 text-gray-400">No results found.</div>
                                            ) : (
                                                filteredMembers.map((m) => (
                                                    <Combobox.Option
                                                        key={m.id}
                                                        value={m.id}
                                                        className={({ active }) =>
                                                            `cursor-pointer select-none px-3 py-2 ${
                                                                active ? "bg-emerald-50 text-emerald-700" : "text-gray-700"
                                                            }`
                                                        }
                                                    >
                                                        {m.label}
                                                    </Combobox.Option>
                                                ))
                                            )}
                                        </Combobox.Options>
                                    </Combobox>
                                </div>

                                {/* Transaction type + amount */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Transaction Type
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={form.transactionType}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        transactionType: e.target.value,
                                                    })
                                                }
                                                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                            >
                                                <option value="deposit">Deposit</option>
                                                <option value="withdrawal">Withdrawal</option>
                                            </select>
                                            <svg
                                                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 9l6 6 6-6"
                                                />
                                            </svg>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Amount <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={form.amount}
                                            onChange={(e) =>
                                                setForm({ ...form, amount: e.target.value })
                                            }
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Reference number */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Reference No. (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.referenceNumber}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                referenceNumber: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                        placeholder="e.g., OR#, bank ref#, etc."
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={submitEntry}
                                    disabled={submitting || !form.memberId || !form.amount}
                                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {submitting ? 'Saving…' : 'Save Entry'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
