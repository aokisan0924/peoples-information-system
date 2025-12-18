import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
    Banknote, ArrowUpRight, ArrowUpCircle, Wallet, Filter, Search, 
    Loader2, ChevronRight, History
} from 'lucide-react';
import { motion } from 'framer-motion';
import PaymentReminderLayout from '@/Layouts/PaymentReminderLayout';
import SidebarLayout from '@/Layouts/SidebarLayout';

const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₱0.00';
    const number = Number(value) || 0;
    return `₱${number.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function ClientCapitalContribution() {
    const { props } = usePage();
    const { shareCapitalSummary, shareCapitalRows: transactions, filters, auth } = props;

    const [depositAmount, setDepositAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dateFrom, setDateFrom] = useState(filters?.dateFrom || '');
    const [dateTo, setDateTo] = useState(filters?.dateTo || '');
    const [perPage, setPerPage] = useState(filters?.perPage || 10);
    const [isTableLoading, setIsTableLoading] = useState(false);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setIsTableLoading(true);
        router.get(route('member.share-capital-data'), { dateFrom, dateTo, perPage, page: 1 }, { preserveScroll: true, onFinish: () => setIsTableLoading(false) });
    };

    const handleResetFilters = () => {
        setDateFrom(''); setDateTo(''); setPerPage(10); setIsTableLoading(true);
        router.get(route('member.share-capital-data'), { dateFrom: '', dateTo: '', perPage: 10, page: 1 }, { preserveScroll: true, onFinish: () => setIsTableLoading(false) });
    };

    const handlePageChange = (page) => {
        if (!page || page === transactions.current_page) return;
        setIsTableLoading(true);
        router.get(route('member.share-capital-data'), { dateFrom, dateTo, perPage, page }, { preserveScroll: true, onFinish: () => setIsTableLoading(false) });
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        if (!depositAmount || Number(depositAmount) <= 0) return toast.error("Please enter valid amount");
        setIsSubmitting(true);
        try {
            const response = await axios.post(route("member.paymongo.capitalCheckout"), { paymentType: "capital", amount: depositAmount });
            if (response.data?.checkoutUrl) window.open(response.data.checkoutUrl, "_blank");
            else toast.error("Unable to start payment.");
        } catch (error) {
            toast.error("Payment failed. Please try again");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Share Capital" />
                <div className="space-y-6">
                    {/* HERO HEADER */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-xl transition-colors">
                        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Banknote className="h-5 w-5" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">Share Capital</h1>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-white/60 max-w-2xl leading-relaxed">View your capital contributions and transaction history.</p>
                            </div>
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <MiniStat label="Current Share Capital" value={formatCurrency(shareCapitalSummary.currentBalance)} icon={Wallet} color="text-emerald-600 dark:text-emerald-400" />
                        <MiniStat label="Total Contributions" value={formatCurrency(shareCapitalSummary.totalDeposits)} icon={ArrowUpCircle} color="text-slate-700 dark:text-white" />
                    </div>

                    {/* DEPOSIT & FILTERS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 shadow-sm dark:shadow-lg lg:col-span-1 h-full transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><ArrowUpRight className="h-4 w-4" /></span>
                                    Add Capital
                                </h2>
                                <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wide">PayMongo</span>
                            </div>
                            <form onSubmit={handleDeposit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-white/50 ml-1 mb-1.5 block">Amount (PHP)</label>
                                    <input type="number" min="500" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition placeholder:text-slate-400 dark:placeholder:text-white/20" placeholder="0.00" />
                                    <p className="mt-1.5 text-[10px] text-slate-400 dark:text-white/40">Minimum contribution is ₱500.00</p>
                                </div>
                                <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all">
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                                    {isSubmitting ? "Processing..." : "Contribute Now"}
                                </button>
                            </form>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 shadow-sm dark:shadow-lg lg:col-span-2 transition-colors">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-white/80 mb-4">
                                <Filter className="h-4 w-4" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Filter History</span>
                            </div>
                            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Field type="date" label="From Date" value={dateFrom} onChange={setDateFrom} />
                                <Field type="date" label="To Date" value={dateTo} onChange={setDateTo} />
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-white/50 ml-1 mb-1.5 block">Rows</label>
                                    <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition cursor-pointer">
                                        <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                                    </select>
                                </div>
                                <div className="flex items-end gap-2">
                                    <button type="submit" className="flex-1 h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg">Apply</button>
                                    <button type="button" onClick={handleResetFilters} className="h-[42px] px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 text-slate-600 font-medium text-sm transition">Reset</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-xl transition-colors">
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
                            <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Transaction History</h3>
                        </div>
                        {isTableLoading && <div className="px-5 py-12 text-center text-slate-500 dark:text-white/40"><Loader2 className="animate-spin h-5 w-5 mx-auto mb-2 text-emerald-500" />Loading...</div>}
                        {!isTableLoading && (!transactions?.data || transactions.data.length === 0) && <div className="px-5 py-12 text-center text-slate-500 dark:text-white/40">No records found.</div>}
                        {!isTableLoading && transactions?.data?.length > 0 && (
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b border-slate-200 dark:border-white/10 text-xs uppercase tracking-wider text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5">
                                        <tr><th className="px-5 py-4">Date</th><th className="px-5 py-4">Ref. No.</th><th className="px-5 py-4">Type</th><th className="px-5 py-4 text-right">Credit</th><th className="px-5 py-4 text-right">Debit</th><th className="px-5 py-4 text-right">Balance</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-white/80">
                                        {transactions.data.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-5 py-4 whitespace-nowrap">{row.date}</td>
                                                <td className="px-5 py-4 font-mono text-slate-500 dark:text-white/60">{row.referenceNumber || "—"}</td>
                                                <td className="px-5 py-4"><span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">{row.transactionType}</span></td>
                                                <td className="px-5 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400">{row.credit > 0 ? formatCurrency(row.credit) : "—"}</td>
                                                <td className="px-5 py-4 text-right font-mono text-rose-600 dark:text-rose-400">{row.debit > 0 ? `-${formatCurrency(row.debit)}` : "—"}</td>
                                                <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(row.runningBalance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {/* Mobile Cards */}
                        {!isTableLoading && transactions?.data?.length > 0 && (
                            <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/10">
                                {transactions.data.map((row) => (
                                    <div key={row.id} className="p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div><div className="text-slate-900 dark:text-white font-medium text-sm">{row.date}</div><div className="text-slate-500 dark:text-white/50 text-xs mt-0.5 font-mono">{row.referenceNumber || "No Ref"}</div></div>
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">{row.transactionType}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 text-sm"><div className="text-slate-500 dark:text-white/60">Amount</div><div className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(row.credit > 0 ? row.credit : row.debit)}</div></div>
                                        <div className="flex justify-between items-center mt-1 text-sm border-t border-slate-100 dark:border-white/5 pt-2"><div className="text-slate-400 dark:text-white/40 text-xs">Running Bal.</div><div className="font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(row.runningBalance)}</div></div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Pagination */}
                        {transactions?.links && transactions.links.length > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                <div className="text-xs text-slate-500 dark:text-white/50">Page <span className="font-semibold">{transactions.current_page}</span> of {transactions.last_page}</div>
                                <div className="flex gap-2">
                                    <button onClick={() => handlePageChange(transactions.current_page - 1)} disabled={transactions.current_page <= 1} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 disabled:opacity-50"><ChevronRight className="h-4 w-4 rotate-180" /></button>
                                    <button onClick={() => handlePageChange(transactions.current_page + 1)} disabled={transactions.current_page >= transactions.last_page} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </PaymentReminderLayout>
        </SidebarLayout>
    );
}

function MiniStat({ label, value, icon: Icon, color }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 px-5 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
            <span className="grid place-items-center h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/5"><Icon className={`h-6 w-6 ${color}`} /></span>
            <div><div className="text-xs text-slate-500 dark:text-white/50 uppercase font-medium">{label}</div><div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</div></div>
        </div>
    );
}

function Field({ label, value, onChange, type = "text" }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition [color-scheme:light] dark:[color-scheme:dark]" />
        </div>
    );
}