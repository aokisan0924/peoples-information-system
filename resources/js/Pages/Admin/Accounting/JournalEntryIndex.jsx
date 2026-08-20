import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { BookOpenCheck, Building2, CalendarDays, Search, User, WalletCards } from "lucide-react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";

const currency = (value) =>
    `₱${Number(value ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusClasses = {
    pending_review: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    rejected: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
};

export default function JournalEntryIndex({ batches, filters }) {
    const [search, setSearch] = useState(filters?.search ?? "");
    const [status, setStatus] = useState(filters?.status ?? "pending_review");

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(
            route("admin.accounting.journal-entries.index"),
            { search: search.trim(), status },
            { preserveState: true, replace: true }
        );
    };

    return (
        <AdminSidebarLayout>
            <Head title="Loan Journal Review" />

            <div className="mx-auto w-full max-w-[100rem] space-y-5 px-3 pb-24 sm:px-5">
                <section className="rounded-[2rem] border border-white/5 bg-slate-900 p-5 shadow-2xl sm:p-8">
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
                                <BookOpenCheck className="h-4 w-4" /> Accounting Review Queue
                            </div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                                Loan Journal Batches
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-400">
                                Review balanced loan-release entries before they are posted to the General Ledger.
                            </p>
                        </div>

                        <form onSubmit={applyFilters} className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_13rem_auto] lg:max-w-2xl">
                            <label className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Reference or member"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                                />
                            </label>
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm font-semibold text-white focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="pending_review">Pending review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="">All statuses</option>
                            </select>
                            <button className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500">
                                Apply
                            </button>
                        </form>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900/70">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-4">Batch reference</th>
                                    <th className="px-5 py-4">Source</th>
                                    <th className="px-5 py-4">Member</th>
                                    <th className="px-5 py-4">Branch</th>
                                    <th className="px-5 py-4 text-right">Amount</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Submitted</th>
                                    <th className="px-5 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {batches.data.map((batch) => (
                                    <tr key={batch.batch_reference} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-slate-900 dark:text-white">
                                            {batch.batch_reference}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                <WalletCards className="h-3.5 w-3.5 text-emerald-500" /> Loan release
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="flex items-center gap-2 whitespace-nowrap text-slate-700 dark:text-slate-200">
                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                {batch.member ? `${batch.member.lastName}, ${batch.member.firstName}` : "—"}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300">
                                            <span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-slate-400" />{batch.branch || "—"}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                            {currency(batch.amount)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-bold capitalize ${statusClasses[batch.status] ?? ""}`}>
                                                {batch.status?.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" />{batch.submitted_date ? new Date(batch.submitted_date).toLocaleString() : "—"}</span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Link
                                                href={route("admin.accounting.journal-entries.show", batch.batch_reference)}
                                                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600 dark:bg-white/10 dark:hover:bg-emerald-600"
                                            >
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {batches.data.length === 0 && (
                        <div className="px-6 py-16 text-center">
                            <BookOpenCheck className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                            <p className="mt-3 font-bold text-slate-700 dark:text-slate-200">No loan journal batches found.</p>
                            <p className="mt-1 text-sm text-slate-400">Try another status or search term.</p>
                        </div>
                    )}

                    {batches.links?.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-2 border-t border-slate-200 px-5 py-4 dark:border-white/10">
                            {batches.links.map((link, index) => (
                                link.url ? (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url}
                                        preserveScroll
                                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span key={`${link.label}-${index}`} className="rounded-lg px-3 py-1.5 text-xs text-slate-300 dark:text-slate-600" dangerouslySetInnerHTML={{ __html: link.label }} />
                                )
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AdminSidebarLayout>
    );
}
