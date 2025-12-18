import React, { useRef, useEffect, useState } from "react";
import { Head, router, Link, usePage } from "@inertiajs/react";
import { Users, Eye, Upload, Download, Search, Loader2 } from "lucide-react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import CountUp from "react-countup";
import toast from "react-hot-toast";
import axios from "axios";

export default function Members() {
    const { props } = usePage();
    const { memberSummary, members: initialMembers = [] } = props;

    const fileInputRef = useRef(null);

    const [search, setSearch] = useState("");
    const [branchFilter, setBranchFilter] = useState("All");
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState(initialMembers);

    useEffect(() => {
        setMembers(Array.isArray(initialMembers) ? initialMembers : []);
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 300); 
        return () => clearTimeout(timer);
    }, [initialMembers]);

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        await toast.promise(
            new Promise((resolve, reject) => {
                router.post(route("admin.members.import"), formData, {
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: () => reject(),
                });
            }),
            {
                loading: "Importing members...",
                success: "Import completed successfully!",
                error: "Import failed!",
            }
        );
    };

    const handleExportClick = async () => {
        const toastId = toast.loading("Preparing member export...");

        try {
            const params = {
                search: search || "",
            };

            const response = await axios.get(route("admin.members.export"), {
                params,
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "PIS_Member_Export.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Member export completed!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to export members.", { id: toastId });
        }
    };

    const filteredMembers = members
        .filter((member) =>
            `${member.firstName ?? ""} ${member.middleName ?? ""} ${
                member.lastName ?? ""
            }`
                .toLowerCase()
                .includes(search.toLowerCase())
        )
        .filter((member) =>
            branchFilter === "All"
                ? true
                : member.branchService === branchFilter
        );

    const total = filteredMembers.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const startIndex = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const endIndex =
        total === 0 ? 0 : Math.min(currentPage * perPage, total);

    const paginatedMembers = filteredMembers.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setIsLoading(true);
        setCurrentPage(page);
        const timer = setTimeout(() => setIsLoading(false), 200);
        return () => clearTimeout(timer);
    };

    const uniqueBranchServices = Array.from(
        new Set(members.map((m) => m.branchService).filter(Boolean))
    );

    useEffect(() => {
        if (!members.length) return;
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 200);
        return () => clearTimeout(timer);
    }, [search, branchFilter, perPage]);

    return (
        <>
            <Head title="Members">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <AdminSidebarLayout>
                <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-6 h-6 text-emerald-600" />
                                Members
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Overview of membership distribution and listing
                                of all registered members.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handleExportClick}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                            <button
                                type="button"
                                onClick={handleImportClick}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 shadow-sm"
                            >
                                <Upload className="w-4 h-4" />
                                Import
                            </button>
                            <input
                                type="file"
                                accept=".xlsx"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Active */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Total Active Members
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={
                                            memberSummary?.totalActiveMembers ??
                                            0
                                        }
                                        duration={1.2}
                                        separator=","
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Retired */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Total Retired Members
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={
                                            memberSummary?.totalRetiredMembers ??
                                            0
                                        }
                                        duration={1.2}
                                        separator=","
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PMPC */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-yellow-50 text-yellow-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Total PMPC Members
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={
                                            memberSummary?.totalPmpcMembers ??
                                            0
                                        }
                                        duration={1.2}
                                        separator=","
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Beneficiary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Total Beneficiary Members
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={
                                            memberSummary?.totalBeneficiaryMembers ??
                                            0
                                        }
                                        duration={1.2}
                                        separator=","
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Civilian */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Total Civilian Members
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={
                                            memberSummary?.totalCivilianMembers ??
                                            0
                                        }
                                        duration={1.2}
                                        separator=","
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CDEA */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Total CDEA Members
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    <CountUp
                                        end={
                                            memberSummary?.totalCdeaMembers ??
                                            0
                                        }
                                        duration={1.2}
                                        separator=","
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-end gap-3">
                            {/* Search */}
                            <div className="md:flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Search Member
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="Search by name..."
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Branch filter */}
                            <div className="w-full md:w-56">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Branch Service
                                </label>
                                <select
                                    value={branchFilter}
                                    onChange={(e) => {
                                        setBranchFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full py-2 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                >
                                    <option value="All">
                                        All Branch Services
                                    </option>
                                    {uniqueBranchServices.map((service) => (
                                        <option key={service} value={service}>
                                            {service}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Per page */}
                            <div className="flex gap-2 items-end">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Per Page
                                    </label>
                                    <select
                                        value={perPage}
                                        onChange={(e) => {
                                            setPerPage(
                                                Number(e.target.value)
                                            );
                                            setCurrentPage(1);
                                        }}
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
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="text-left">
                                        <th className="px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wide">
                                            Username
                                        </th>
                                        <th className="px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wide">
                                            Name
                                        </th>
                                        <th className="px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wide">
                                            AFPSN
                                        </th>
                                        <th className="px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wide">
                                            Branch Service
                                        </th>
                                        <th className="px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wide text-center">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-8 text-center text-gray-500"
                                            >
                                                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>
                                                        Loading members...
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginatedMembers.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-6 text-center text-gray-500"
                                            >
                                                No members found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedMembers.map((member) => (
                                            <tr
                                                key={member.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-4 py-2 text-sm text-gray-800 whitespace-nowrap">
                                                    {member.username ?? "-"}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-800 whitespace-nowrap">
                                                    {member.lastName},{" "}
                                                    {member.firstName}{" "}
                                                    {member.middleName ?? ""}{" "}
                                                    {member.suffix ?? ""}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-800 whitespace-nowrap">
                                                    {member.afpsn ?? "-"}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-800 whitespace-nowrap">
                                                    {member.branchService ??
                                                        "-"}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Link
                                                        href={route(
                                                            "admin.members.show-member",
                                                            member.encryptedId
                                                        )}
                                                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 text-sm"
                                                        title="View Member"
                                                    >
                                                        <Eye size={16} />
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
                                    {startIndex}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold">
                                        {endIndex}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold">
                                    {total}
                                </span>{" "}
                                entries
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Prev
                                </button>

                                <span className="px-2">
                                    Page{" "}
                                    <span className="font-semibold">
                                        {currentPage}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-semibold">
                                        {totalPages}
                                    </span>
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePageChange(currentPage + 1)
                                    }
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminSidebarLayout>
        </>
    );
}
