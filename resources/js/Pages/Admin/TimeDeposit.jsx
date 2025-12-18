import React, { useEffect, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { Download, Loader2, Search, Eye, Plus, PiggyBank, CalendarClock,  Users, X} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Combobox } from "@headlessui/react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";
import toast from "react-hot-toast";
import axios from "axios";

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

const getRatePercent = (termYears) => {
    switch (Number(termYears)) {
        case 1:
            return 6.3;
        case 2:
            return 6.5;
        case 3:
            return 7.0;
        case 4:
            return 7.3;
        case 5:
            return 7.5;
        default:
            return 0;
    }
};

export default function TimeDeposit() {
    const { props } = usePage();
    const { stats: initialStats = {}, defaults = {} } = props;

    const [stats, setStats] = useState(initialStats);
    const [search, setSearch] = useState(defaults.search || "");
    const [dateFrom, setDateFrom] = useState(defaults.dateFrom || "");
    const [dateTo, setDateTo] = useState(defaults.dateTo || "");
    const [perPage, setPerPage] = useState(defaults.perPage || 10);

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: perPage,
        total: 0,
    });

    const [showModal, setShowModal] = useState(false);
    const [memberOptions, setMemberOptions] = useState([]);
    const [memberQuery, setMemberQuery] = useState("");

    const [form, setForm] = useState({
        memberId: "",
        principal: "",
        termYears: "",
        startDate: "",
    });

    const [preview, setPreview] = useState({
        interestRate: 0,
        maturityValue: 0,
        totalInterest: 0,
    });

    const filteredMembers =
        memberQuery.trim() === ""
            ? memberOptions
            : memberOptions.filter((m) =>
                m.label.toLowerCase().includes(memberQuery.toLowerCase())
            );

    const handleFormChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const openModal = async () => {
        setShowModal(true);
        try {
            const { data } = await axios.get(
                route("admin.time.api-members-min")
            );
            setMemberOptions(data.rows || []);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load members.");
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setForm({
            memberId: "",
            principal: "",
            termYears: "",
            startDate: "",
        });
        setPreview({
            interestRate: 0,
            maturityValue: 0,
            totalInterest: 0,
        });
        setMemberQuery("");
    };

    const submitForm = async (e) => {
        e.preventDefault();

        if (!form.memberId || !form.principal || !form.termYears || !form.startDate) {
            toast.error("Please fill in all required fields.");
            return;
        }

        try {
            const payload = {
                memberId: Number(form.memberId),
                principal: Number(form.principal),
                termYears: Number(form.termYears),
                startDate: form.startDate,
            };

            const { data } = await axios.post(
                route("admin.time.store"),
                payload
            );

            if (!data?.success) {
                toast.error(data?.message || "Failed to save time deposit.");
                return;
            }

            toast.success(data.message || "Time deposit created.");
            closeModal();

            await loadData(1);

            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error(error);
            const message =
                error?.response?.data?.message || "Error saving time deposit.";
            toast.error(message);
        }
    };

    const loadData = async (page = 1) => {
        if (loading) return;
        setLoading(true);

        try {
            const params = {
                search,
                dateFrom,
                dateTo,
                perPage,
                page,
            };

            const { data } = await axios.get(
                route("admin.time.api-index"),
                { params }
            );

            setRows(data.rows || []);
            setMeta(
                data.meta || {
                    currentPage: 1,
                    lastPage: 1,
                    perPage,
                    total: 0,
                }
            );
        } catch (e) {
            console.error(e);
            const msg =
                e?.response?.data?.message ||
                e?.message ||
                "Failed to load data.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const id = setTimeout(() => loadData(1), 300);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, dateFrom, dateTo, perPage]);

    useEffect(() => {
        const principal = Number(form.principal);
        const termYears = Number(form.termYears);
        const ratePercent = getRatePercent(termYears);

        if (principal > 0 && termYears > 0 && ratePercent > 0) {
            const r = ratePercent / 100;
            const maturityValue = principal * Math.pow(1 + r, termYears);
            const totalInterest = maturityValue - principal;

            setPreview({
                interestRate: ratePercent,
                maturityValue,
                totalInterest,
            });
        } else {
            setPreview({
                interestRate: ratePercent,
                maturityValue: 0,
                totalInterest: 0,
            });
        }
    }, [form.principal, form.termYears]);

    const handlePageChange = (page) => {
        if (page < 1 || page > meta.lastPage || page === meta.currentPage) return;
        loadData(page);
    };

    const handleExport = async () => {
        try {
            const params = { search, dateFrom, dateTo };

            const response = await axios.get(
                route("admin.time.export"),
                {
                    params,
                    responseType: "blob",
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "time-deposits.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            toast.error("Failed to export data.");
        }
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
        const last = `${y}-${String(m).padStart(2, "0")}-${String(
            lastDate
        ).padStart(2, "0")}`;
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
            <Head title="Time Deposit">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <CalendarClock className="w-6 h-6 text-emerald-600" />
                                Time Deposit
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Manage fixed-term time deposits with annual
                                compounded interest.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handleExport}
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

                    {/* Stats cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-3">
                        <motion.div
                            layout
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
                        >
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                <PiggyBank className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Total Time Deposit Principal
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={toNumber(
                                            stats.totalTimeDepositPrincipal || 0
                                        )}
                                        duration={1}
                                        decimals={2}
                                        prefix="₱"
                                        separator=","
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            layout
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
                        >
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                <CalendarClock className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Total Maturity Value
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={toNumber(
                                            stats.totalTimeDepositMaturity || 0
                                        )}
                                        duration={1}
                                        decimals={2}
                                        prefix="₱"
                                        separator=","
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            layout
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
                        >
                            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Time Deposit Members
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={toNumber(stats.depositorCount || 0)}
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
                                    Search Member / Username
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Name or username..."
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Date range */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        From (Start Date)
                                    </label>
                                    <input
                                        type="date"
                                        value={dateFrom || ""}
                                        onChange={(e) =>
                                            setDateFrom(e.target.value)
                                        }
                                        className="w-full sm:w-40 py-2 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        To (Start Date)
                                    </label>
                                    <input
                                        type="date"
                                        value={dateTo || ""}
                                        onChange={(e) =>
                                            setDateTo(e.target.value)
                                        }
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
                                        onChange={(e) =>
                                            setPerPage(Number(e.target.value))
                                        }
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="text-left">
                                        <th className="px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wide">
                                            Member
                                        </th>
                                        <th className="px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wide text-right">
                                            Principal
                                        </th>
                                        <th className="px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wide text-center">
                                            Term / Rate
                                        </th>
                                        <th className="px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wide text-right">
                                            Maturity Value
                                        </th>
                                        <th className="px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wide">
                                            Dates
                                        </th>
                                        <th className="px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wide text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-6 text-center text-gray-500"
                                            >
                                                <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                                                Loading time deposits...
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && rows.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-6 text-center text-gray-500"
                                            >
                                                No time deposits found.
                                            </td>
                                        </tr>
                                    )}
                                    {!loading &&
                                        rows.map((r) => (
                                            <tr
                                                key={r.id}
                                                className="border-t border-gray-100"
                                            >
                                                <td className="px-4 py-2 text-sm text-gray-800 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {r.memberName}
                                                            </span>
                                                            {r.username && (
                                                                <span className="text-xs text-gray-500">
                                                                    {
                                                                        r.username
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-2 text-sm text-right whitespace-nowrap">
                                                    {asMoney(r.principal ?? 0)}
                                                </td>

                                                <td className="px-4 py-2 text-xs text-center whitespace-nowrap">
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="font-medium text-gray-800">
                                                            {r.termYears}{" "}
                                                            {r.termYears === 1
                                                                ? "year"
                                                                : "years"}
                                                        </span>
                                                        <span className="text-[11px] text-emerald-600">
                                                            {r.interestRate}% p.a.
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-2 text-sm text-right whitespace-nowrap">
                                                    {asMoney(
                                                        r.maturityValue ?? 0
                                                    )}
                                                </td>

                                                <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span>
                                                            Start:{" "}
                                                            {r.startDate ||
                                                                "—"}
                                                        </span>
                                                        <span>
                                                            Maturity:{" "}
                                                            {r.maturityDate ||
                                                                "—"}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-2 text-right whitespace-nowrap">
                                                    <Link
                                                        href={route(
                                                            "admin.time.member",
                                                            r.id
                                                        )}
                                                        className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
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
                                        : (meta.currentPage - 1) *
                                            meta.perPage +
                                        1}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold">
                                    {Math.min(
                                        meta.currentPage * meta.perPage,
                                        meta.total
                                    )}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold">
                                    {meta.total}
                                </span>{" "}
                                entries
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePageChange(meta.currentPage - 1)
                                    }
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
                                    <span className="font-semibold">
                                        {meta.lastPage}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePageChange(meta.currentPage + 1)
                                    }
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
                                        New Time Deposit
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 mb-1">
                                        Add Time Deposit Entry
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={submitForm} className="space-y-4">
                                {/* Member */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Member
                                    </label>

                                    <Combobox
                                        value={form.memberId}
                                        onChange={(val) =>
                                            handleFormChange("memberId", val)
                                        }
                                    >
                                        <div className="relative">
                                            <Combobox.Input
                                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                placeholder="Search member..."
                                                onChange={(e) =>
                                                    setMemberQuery(
                                                        e.target.value
                                                    )
                                                }
                                                displayValue={(id) => {
                                                    const found =
                                                        memberOptions.find(
                                                            (m) =>
                                                                m.id === id
                                                        );
                                                    return found
                                                        ? found.label
                                                        : "";
                                                }}
                                                required
                                            />
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

                                        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-lg focus:outline-none">
                                            {filteredMembers.length === 0 ? (
                                                <div className="px-3 py-2 text-gray-400">
                                                    No results found.
                                                </div>
                                            ) : (
                                                filteredMembers.map((m) => (
                                                    <Combobox.Option
                                                        key={m.id}
                                                        value={m.id}
                                                        className={({ active }) =>
                                                            `cursor-pointer select-none px-3 py-2 ${
                                                                active
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : "text-gray-700"
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

                                {/* Principal & Term */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Principal Amount
                                        </label>
                                        <input
                                            type="number"
                                            min="1000"
                                            step="0.01"
                                            value={form.principal}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "principal",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Term (Years)
                                        </label>
                                        <select
                                            value={form.termYears}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "termYears",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                        >
                                            <option value="">
                                                Select term
                                            </option>
                                            <option value="1">
                                                1 year – 6.3% p.a.
                                            </option>
                                            <option value="2">
                                                2 years – 6.5% p.a.
                                            </option>
                                            <option value="3">
                                                3 years – 7.0% p.a.
                                            </option>
                                            <option value="4">
                                                4 years – 7.3% p.a.
                                            </option>
                                            <option value="5">
                                                5 years – 7.5% p.a.
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "startDate",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>

                                {/* Preview */}
                                <div className="mt-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3 py-3 text-xs text-gray-700">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CalendarClock className="w-4 h-4 text-emerald-600" />
                                        <span className="font-semibold text-emerald-700">
                                            Maturity Preview (Compounded
                                            Annually)
                                        </span>
                                    </div>
                                    {preview.interestRate > 0 &&
                                    preview.maturityValue > 0 ? (
                                        <div className="space-y-1">
                                            <div>
                                                Principal:{" "}
                                                <span className="font-semibold">
                                                    {asMoney(
                                                        form.principal || 0
                                                    )}
                                                </span>
                                            </div>
                                            <div>
                                                Term:{" "}
                                                <span className="font-semibold">
                                                    {form.termYears}{" "}
                                                    {Number(
                                                        form.termYears
                                                    ) === 1
                                                        ? "year"
                                                        : "years"}
                                                </span>{" "}
                                                @{" "}
                                                <span className="font-semibold">
                                                    {preview.interestRate}% p.a.
                                                </span>
                                            </div>
                                            <div>
                                                Estimated Maturity Value:{" "}
                                                <span className="font-semibold text-emerald-700">
                                                    {asMoney(
                                                        preview.maturityValue
                                                    )}
                                                </span>
                                            </div>
                                            <div>
                                                Total Interest Earned:{" "}
                                                <span className="font-semibold">
                                                    {asMoney(
                                                        preview.totalInterest
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500">
                                            Enter principal and select term to
                                            see the projected maturity amount.
                                        </div>
                                    )}
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
                                        Save Time Deposit
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
