import React, { useEffect, useState } from "react";
import { Link, Head, usePage, router } from "@inertiajs/react";
import { Eye, Banknote, Wallet, TrendingUp, Search, Plus, X, Loader2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";


    const maskRef = (ref) =>
        ref ? `${ref.slice(0, 3)}...${ref.slice(-4)}` : "N/A";

    const asMoney = (v) =>
        (Number.isFinite(v) ? v : 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        });

    const toNumber = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

function Summary({ label, value, money = false }) {
    const display = money
        ? new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(Number(value || 0))
        : value ?? "";
    return (
        <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-semibold text-sm mt-1">{display}</p>
        </div>
    );
}

export default function Loan() {
    const { props } = usePage();
    const { loanStats = { totalGross: 0, totalNet: 0, totalIncome: 0 },  members = [], } = props;
    
    const [search, setSearch] = useState("");
    const [perPage, setPerPage] = useState(10);

    const [loading, setLoading] = useState(false);
    const [loans, setLoans] = useState([]);
    const [meta, setMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: perPage,
        total: 0,
    });

    const loadData = async (page = 1) => {
        if (loading) return;
        setLoading(true);
    
        try {
            const params = {
                search,
                perPage,
                page,
            };
    
            const { data } = await axios.get("/admin/api/loans", { params });
    
            // Flexible: puwedeng data.rows OR data.data
            const rows = Array.isArray(data?.rows)
                ? data.rows
                : data?.data || [];
    
            const pagination = data?.meta || data?.pagination || {};
    
            setLoans(rows);
            setMeta({
                currentPage:
                    pagination.currentPage ??
                    pagination.current_page ??
                    page,
                lastPage:
                    pagination.lastPage ??
                    pagination.last_page ??
                    1,
                perPage:
                    pagination.perPage ??
                    pagination.per_page ??
                    perPage,
                total: pagination.total ?? rows.length ?? 0,
            });
        } catch (e) {
            console.error(e);
            const msg =
                e?.response?.data?.message ||
                e?.message ||
                "Failed to load loans.";
            toast.error(msg);
            setLoans([]);
            setMeta({
                currentPage: 1,
                lastPage: 1,
                perPage,
                total: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const id = setTimeout(() => loadData(1), 300);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, perPage]);

    const handlePageChange = (page) => {
        if (page < 1 || page > meta.lastPage || page === meta.currentPage) return;
        loadData(page);
    };

    // New Loan modal state
    const [showModal, setShowModal] = useState(false);
    const [category, setCategory] = useState("ACTIVE_PENSIONER_V1");
    const [netProceeds, setNetProceeds] = useState(25000);
    const [capCon, setCapCon] = useState(5000);
    const [membershipFee, setMembershipFee] = useState(300);
    const [termYears, setTermYears] = useState(5);
    const [advanceInterestMonths, setAdvanceInterestMonths] = useState(2);
    const [memberId, setMemberId] = useState("");
    const [loanType, setLoanType] = useState("");
    const [loanClassification, setLoanClassification] = useState("");
    const [results, setResults] = useState({});
    const [computing, setComputing] = useState(false);

    const yearsToMonths = (y) => Number(y) * 12;

    useEffect(() => {
        if (!netProceeds || !termYears) return;

        const terms = yearsToMonths(termYears);
        setComputing(true);

        axios
            .post("/admin/compute-loan", {
                category,
                netProceeds,
                capCon,
                membershipFee,
                terms,
                advanceInterestMonths,
            })
            .then((res) => setResults(res.data || {}))
            .catch((err) => {
                const msg = err?.response?.data?.error || "Compute failed.";
                toast.error(msg);
                setResults({});
            })
            .finally(() => setComputing(false));
    }, [
        category,
        netProceeds,
        capCon,
        membershipFee,
        termYears,
        advanceInterestMonths,
    ]);

    const handleSubmitLoan = () => {
        if (!memberId) return toast.error("Please select a member.");
        if (!loanType) return toast.error("Please select a loan type.");
        if (!loanClassification)
            return toast.error("Please select a loan classification.");

        axios
            .post("/admin/submit-loan", {
                memberId,
                category,
                netProceeds,
                membershipFee,
                capCon,
                termYears,
                advanceInterestMonths,
                loanType,
                loanClassification,
                status: "pending",
                computed: results,
            })
            .then((res) => {
                toast.success("Loan saved successfully.");
                setShowModal(false);
                loadData(1);

                if (res?.request?.responseURL) {
                    router.visit(res.request.responseURL);
                }
            })
            .catch(() => toast.error("Submit failed."));
    };

    const resetNewLoanForm = () => {
        setCategory("ACTIVE_PENSIONER_V1");
        setNetProceeds(25000);
        setCapCon(5000);
        setMembershipFee(300);
        setTermYears(5);
        setAdvanceInterestMonths(2);
        setMemberId("");
        setLoanType("");
        setLoanClassification("");
        setResults({});
    };

    const openModal = () => {
        resetNewLoanForm();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const todayStr = new Date().toLocaleString("en-PH", {
        month: "long",
        year: "numeric",
    });

    const statusClass = (status) => {
        const s = (status || "").toLowerCase();
        if (s === "pending")
            return "bg-amber-100 text-amber-800 border border-amber-200";
        if (s === "approved")
            return "bg-blue-100 text-blue-800 border border-blue-200";
        if (s === "released")
            return "bg-emerald-100 text-emerald-800 border border-emerald-200";
        if (s === "declined")
            return "bg-red-100 text-red-800 border border-red-200";
        if (s === "completed")
            return "bg-teal-100 text-teal-800 border border-teal-200";
        return "bg-gray-100 text-gray-700 border border-gray-200";
    };

    return (
        <>
            <Head title="Loans">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <AdminSidebarLayout>
                <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-emerald-600" />
                                Loan
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Monitor loan performance and manage loan
                                applications across all branches.
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">
                                As of{" "}
                                <span className="font-medium">{todayStr}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={openModal}
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm shadow-sm"
                            >
                                <Plus size={16} />
                                New Transaction
                            </button>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-3">
                        <motion.div
                            layout
                            className="bg-white rounded-2xl shadow-sm border-green-100 border border-gray-100 p-4 flex items-center gap-3"
                        >
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                <Banknote className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Total Gross as of {todayStr}
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={toNumber(loanStats.totalGross)}
                                        duration={1.5}
                                        separator=","
                                        prefix="₱"
                                        decimals={2}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            layout
                            className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 flex items-center gap-4"
                        >
                            <div className="bg-amber-50 text-amber-600 p-3 rounded-full">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Total Net Loan as of {todayStr}
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={toNumber(loanStats.totalNet)}
                                        duration={1.5}
                                        separator=","
                                        prefix="₱"
                                        decimals={2}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            layout
                            className="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 flex items-center gap-4"
                        >
                            <div className="bg-blue-50 text-blue-600 p-3 rounded-full">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Total Income as of {todayStr}
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={toNumber(loanStats.totalIncome)}
                                        duration={1.5}
                                        separator=","
                                        prefix="₱"
                                        decimals={2}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            {/* Search */}
                            <div className="w-full md:w-1/2">
                                <label
                                    htmlFor="search"
                                    className="block text-xs font-medium text-gray-500 mb-1"
                                >
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <input
                                        id="search"
                                        type="text"
                                        placeholder="Search by reference, member name, or username..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Per page */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">
                                        Per page
                                    </span>
                                    <div className="relative">
                                        <select
                                            className="appearance-none rounded-xl border border-gray-200 bg-white text-gray-800 text-xs pl-3 pr-8 py-2 
                                            focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                            value={perPage}
                                            onChange={(e) => {
                                                setPerPage(
                                                    Number(e.target.value)
                                                );
                                            }}
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={30}>30</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loan Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-900">
                                Loan List
                            </h2>
                            <p className="text-xs text-gray-500">
                                Showing{" "}
                                <span className="font-semibold">
                                    {loans.length}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold">
                                    {meta.total}
                                </span>{" "}
                                loan(s)
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-gray-700">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            #
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Member
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Reference
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold">
                                            Gross
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold">
                                            MA
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-6 text-center text-sm text-gray-500"
                                            >
                                                <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                                                Loading loans...
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && loans.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-6 text-center text-sm text-gray-500"
                                            >
                                                No records found
                                            </td>
                                        </tr>
                                    )}
                                    {!loading &&
                                        loans.map((row, idx) => (
                                            <tr
                                                key={`${row.loanReference}-${idx}`}
                                                className="hover:bg-gray-50/70 transition"
                                            >
                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {(meta.currentPage - 1) *
                                                        meta.perPage +
                                                        (idx + 1)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">
                                                            {row.lastName},{" "}
                                                            {row.firstName}
                                                        </span>
                                                        {row.username && (
                                                            <span className="text-[11px] text-gray-500">
                                                                @{row.username}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="font-mono text-gray-700">
                                                        {maskRef(
                                                            row.loanReference
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {asMoney(
                                                        row.grossAmount
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {asMoney(
                                                        row.monthlyAmortization
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`inline-flex px-3 py-1 text-[11px] font-semibold rounded-full ${statusClass(
                                                            row.status
                                                        )}`}
                                                    >
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Link
                                                        href={route(
                                                            "admin.loans.showLoan",
                                                            row.loanReference
                                                        )}
                                                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 text-sm"
                                                        title="View Loan"
                                                    >
                                                        <Eye size={16} />
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination (same style as TimeDeposit.jsx) */}
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

            {/* ANIMATED New Loan Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            {/* Modal header */}
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        New Loan Transaction
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Select member, configure loan
                                        parameters, and review the computed
                                        summary before saving.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal content */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Select Member */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                                            Select Member
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={memberId}
                                                onChange={(e) =>
                                                    setMemberId(
                                                        e.target.value
                                                    )
                                                }
                                                className="appearance-none w-full rounded-xl border border-gray-200 bg-white text-sm pl-3 pr-8 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="">
                                                    — Select —
                                                </option>
                                                {members.map((m) => (
                                                    <option
                                                        key={m.id}
                                                        value={m.id}
                                                    >
                                                        {(m.username ?? m.id) +
                                                            " — " +
                                                            m.lastName +
                                                            ", " +
                                                            m.firstName +
                                                            " " +
                                                            (m.middleName ??
                                                                "") +
                                                            " " +
                                                            (m.suffix ?? "")}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                                            Computation Category
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={category}
                                                onChange={(e) =>
                                                    setCategory(
                                                        e.target.value.toUpperCase()
                                                    )
                                                }
                                                className="appearance-none w-full rounded-xl border border-gray-200 bg-white text-sm pl-3 pr-8 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="ACTIVE_PENSIONER_V1">
                                                    ACTIVE_PENSIONER
                                                </option>
                                                <option value="CDEA">
                                                    CDEA
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Loan Type */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                                            Loan Type
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={loanType}
                                                onChange={(e) =>
                                                    setLoanType(
                                                        e.target.value
                                                    )
                                                }
                                                className="appearance-none w-full rounded-xl border border-gray-200 bg-white text-sm pl-3 pr-8 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="">
                                                    — Select Type —
                                                </option>
                                                <option value="New">New</option>
                                                <option value="Renewal">
                                                    Renewal
                                                </option>
                                                <option value="Additional">
                                                    Additional
                                                </option>
                                                <option value="Reloan">
                                                    Reloan
                                                </option>
                                                <option value="Restructure">
                                                    Restructure
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Loan Classification */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                                            Loan Classification
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={loanClassification}
                                                onChange={(e) =>
                                                    setLoanClassification(
                                                        e.target.value
                                                    )
                                                }
                                                className="appearance-none w-full rounded-xl border border-gray-200 bg-white text-sm pl-3 pr-8 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="">
                                                    — Select Classification —
                                                </option>
                                                <option value="Salary Loan">
                                                    Salary Loan
                                                </option>
                                                <option value="Pension Loan">
                                                    Pension Loan
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Net Proceeds */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                                            Net Proceeds
                                        </label>
                                        <input
                                            type="number"
                                            value={netProceeds}
                                            onChange={(e) =>
                                                setNetProceeds(
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                            className="w-full rounded-xl border border-gray-200 text-sm px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    {/* Capital Contribution */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                                            Capital Contribution
                                        </label>
                                        <input
                                            type="number"
                                            value={capCon}
                                            onChange={(e) =>
                                                setCapCon(
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                            className="w-full rounded-xl border border-gray-200 text-sm px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    {/* Membership Fee */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                                            Membership Fee
                                        </label>
                                        <input
                                            type="number"
                                            value={membershipFee}
                                            onChange={(e) =>
                                                setMembershipFee(
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                            className="w-full rounded-xl border border-gray-200 text-sm px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    {/* Loan Term Years */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                                            Loan Term (Years)
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={termYears}
                                                onChange={(e) =>
                                                    setTermYears(
                                                        Number(
                                                            e.target.value
                                                        ) || 1
                                                    )
                                                }
                                                className="appearance-none w-full rounded-xl border border-gray-200 bg-white text-sm pl-3 pr-8 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                            >
                                                {[1, 2, 3, 4, 5].map((year) => (
                                                    <option
                                                        key={year}
                                                        value={year}
                                                    >
                                                        {year} Year
                                                        {year > 1 ? "s" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Advance Interest */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                                            Advance Interest (months)
                                        </label>
                                        <input
                                            type="number"
                                            value={advanceInterestMonths}
                                            onChange={(e) =>
                                                setAdvanceInterestMonths(
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                            className="w-full rounded-xl border border-gray-200 text-sm px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-emerald-700">
                                            Loan Computation Summary
                                        </h3>
                                        {computing && (
                                            <span className="text-xs text-gray-500">
                                                Computing…
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-800 mt-3">
                                        <Summary
                                            label="Gross Amount"
                                            value={results.gross}
                                            money
                                        />
                                        <Summary
                                            label="Loan Amount"
                                            value={results.loanAmount}
                                            money
                                        />
                                        <Summary
                                            label="Monthly Amortization"
                                            value={
                                                results.monthlyAmortization
                                            }
                                            money
                                        />

                                        <Summary
                                            label="Service Fee"
                                            value={results.serviceFee}
                                            money
                                        />
                                        <Summary
                                            label="Insurance"
                                            value={results.insurance}
                                            money
                                        />
                                        <Summary
                                            label="Advance Interest"
                                            value={results.advanceInterest}
                                            money
                                        />

                                        <Summary
                                            label="Income"
                                            value={results.income}
                                            money
                                        />
                                        <Summary
                                            label="Income %"
                                            value={
                                                results.incomePercentDisplay ??
                                                ""
                                            }
                                        />

                                        <Summary
                                            label="Annual Rate"
                                            value={
                                                results.annualInterestRate !=
                                                null
                                                    ? `${(
                                                          results.annualInterestRate *
                                                        100
                                                    ).toFixed(2)}%`
                                                    : ""
                                            }
                                        />
                                        <Summary
                                            label="Monthly Rate"
                                            value={
                                                results.monthlyInterestRate !=
                                                null
                                                    ? `${(
                                                          results.monthlyInterestRate *
                                                        100
                                                    ).toFixed(4)}%`
                                                    : ""
                                            }
                                        />
                                        <Summary
                                            label="Effective Interest"
                                            value={
                                                results.effectiveInterestRateDisplay ||
                                                ""
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal footer */}
                            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitLoan}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm text-white shadow-sm"
                                >
                                    Submit Loan
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
