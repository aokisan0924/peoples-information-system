import React, { useState, useEffect } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { createPortal } from "react-dom";
import { PiggyBank, Wallet, ArrowUpRight, ArrowUpCircle, ArrowDownCircle, X, Filter, Loader2, ChevronRight, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Combobox } from "@headlessui/react";
import axios from "axios";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";
import SidebarLayout from "@/Layouts/SidebarLayout";

const formatCurrency = (value) => {
    if (!value) return "₱0.00";
    return `₱${Number(value).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
    })}`;
};

export default function SavingsDeposit() {
    const { savingsSummary, savingsRows: transactions, filters, auth } = usePage().props;

    const [depositAmount, setDepositAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [dateFrom, setDateFrom] = useState(filters?.dateFrom || "");
    const [dateTo, setDateTo] = useState(filters?.dateTo || "");
    const [perPage, setPerPage] = useState(filters?.perPage || 10);
    const [isTableLoading, setIsTableLoading] = useState(false);

    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setIsTableLoading(true);

        router.get(
            route("member.savings.index"),
            {
                dateFrom: dateFrom || "",
                dateTo: dateTo || "",
                perPage: perPage || 10,
                page: 1,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsTableLoading(false),
            }
        );
    };

    const handleResetFilters = () => {
        setDateFrom("");
        setDateTo("");
        setPerPage(10);
        setIsTableLoading(true);

        router.get(
            route("member.savings.index"),
            { dateFrom: "", dateTo: "", perPage: 10, page: 1 },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsTableLoading(false),
            }
        );
    };

    const handlePageChange = (page) => {
        if (!page || page === transactions.current_page) return;

        setIsTableLoading(true);
        router.get(
            route("member.savings.index"),
            {
                dateFrom: dateFrom || "",
                dateTo: dateTo || "",
                perPage: perPage || 10,
                page,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsTableLoading(false),
            }
        );
    };

    const handleDeposit = async (e) => {
        e.preventDefault();

        if (!depositAmount || Number(depositAmount) <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post(
                route("member.paymongo.savingsCheckout"),
                { amount: depositAmount, paymentType: "savings" }
            );

            if (response.data?.checkoutUrl) {
                window.open(response.data.checkoutUrl, "_blank", "noopener,noreferrer");
            } else {
                toast.error("Unable to start payment.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Unable to start payment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Savings Deposit">
                    <link rel="icon" href="/images/logo/pis_logo.png" />
                </Head>
                
                <div className="space-y-6">
                    
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-[0_20px_60px_-40px_rgba(0,0,0,.8)] transition-colors">
                        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <PiggyBank className="h-5 w-5" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                                        My Savings
                                    </h1>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-white/60 max-w-2xl leading-relaxed">
                                    Manage your savings account, make deposits via PayMongo, or request withdrawals.
                                </p>
                            </div>
                            
                            {auth?.member && (
                                <div className="flex flex-col items-start md:items-end">
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-semibold">Account Holder</span>
                                    <span className="text-slate-900 dark:text-white font-medium">{auth.member.firstName} {auth.member.lastName}</span>
                                    <span className="text-xs text-slate-500 dark:text-white/50">{auth.member.username}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <MiniStat 
                            label="Current Balance" 
                            value={formatCurrency(savingsSummary.currentBalance)} 
                            icon={Wallet} 
                            color="text-emerald-600 dark:text-emerald-400"
                        />
                        <MiniStat 
                            label="Total Deposits" 
                            value={formatCurrency(savingsSummary.totalDeposits)} 
                            icon={ArrowUpCircle} 
                            color="text-slate-600 dark:text-white"
                        />
                        <MiniStat 
                            label="Total Withdrawals" 
                            value={formatCurrency(savingsSummary.totalWithdrawals)} 
                            icon={ArrowDownCircle} 
                            color="text-rose-500 dark:text-rose-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 shadow-lg lg:col-span-1 h-full transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </span>
                                    Quick Deposit
                                </h2>
                                <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wide">
                                    PayMongo
                                </span>
                            </div>
                            
                            <form onSubmit={handleDeposit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-white/50 ml-1 mb-1.5 block">Amount (PHP)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-2.5 text-slate-400 dark:text-white/40 text-sm">₱</span>
                                        <input
                                            type="number"
                                            min="50"
                                            step="0.01"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 pl-8 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                                    {isSubmitting ? "Processing..." : "Deposit"}
                                </button>
                            </form>

                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowWithdrawalModal(true)}
                                    className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 text-sm font-medium transition flex items-center justify-center gap-2"
                                >
                                    Request Withdrawal
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 shadow-lg lg:col-span-2 transition-colors">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-white/80 mb-4">
                                <Filter className="h-4 w-4" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Filter History</span>
                            </div>

                            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Field type="date" label="From Date" value={dateFrom} onChange={setDateFrom} />
                                <Field type="date" label="To Date" value={dateTo} onChange={setDateTo} />
                                
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-white/50 ml-1 mb-1.5 block">Rows</label>
                                    <select
                                        value={perPage}
                                        onChange={(e) => setPerPage(Number(e.target.value))}
                                        className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer dark:bg-white/5 dark:border-white/10 dark:text-white [&>option]:text-slate-900 dark:[&>option]:text-white dark:[&>option]:bg-slate-800"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>

                                <div className="flex items-end gap-2">
                                    <button type="submit" className="flex-1 h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg">
                                        Apply
                                    </button>
                                    <button type="button" onClick={handleResetFilters} className="h-[42px] px-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 font-medium text-sm transition">
                                        Reset
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-xl transition-colors">
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
                            <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Transaction History</h3>
                        </div>
                    
                        {isTableLoading && (
                            <div className="px-5 py-12 text-center text-slate-500 dark:text-white/40">
                                <div className="flex justify-center items-center gap-2">
                                    <Loader2 className="animate-spin h-5 w-5 text-emerald-500" />
                                    Loading transactions...
                                </div>
                            </div>
                        )}

                        {!isTableLoading && (!transactions?.data || transactions.data.length === 0) && (
                            <div className="px-5 py-12 text-center text-slate-500 dark:text-white/40">
                                No transactions found.
                            </div>
                        )}

                        {!isTableLoading && transactions?.data?.length > 0 && (
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b border-slate-200 dark:border-white/10 text-xs uppercase tracking-wider text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5">
                                        <tr>
                                            <th className="px-5 py-4 font-medium">Date</th>
                                            <th className="px-5 py-4 font-medium">Ref. No.</th>
                                            <th className="px-5 py-4 font-medium">Type</th>
                                            <th className="px-5 py-4 font-medium text-right">Credit</th>
                                            <th className="px-5 py-4 font-medium text-right">Debit</th>
                                            <th className="px-5 py-4 font-medium text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-white/80">
                                        {transactions.data.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-5 py-4 whitespace-nowrap text-slate-900 dark:text-white">{row.date}</td>
                                                <td className="px-5 py-4 font-mono text-slate-500 dark:text-white/60">{row.referenceNumber || "—"}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide border ${
                                                        row.transactionType === "withdrawal" 
                                                        ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" 
                                                        : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                                    }`}>
                                                        {row.transactionType}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                                    {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono text-rose-500 dark:text-rose-400">
                                                    {row.debit > 0 ? `-${formatCurrency(row.debit)}` : "—"}
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(row.runningBalance)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!isTableLoading && transactions?.data?.length > 0 && (
                            <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/10">
                                {transactions.data.map((row) => (
                                    <div key={row.id} className="p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-slate-900 dark:text-white font-medium text-sm">{row.date}</div>
                                                <div className="text-slate-500 dark:text-white/50 text-xs mt-0.5 font-mono">{row.referenceNumber || "No Ref"}</div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${
                                                row.transactionType === "withdrawal" 
                                                ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" 
                                                : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                            }`}>
                                                {row.transactionType}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 text-sm">
                                            <div className="text-slate-500 dark:text-white/60">Amount</div>
                                            <div className={`font-mono ${row.transactionType === 'withdrawal' ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {row.transactionType === 'withdrawal' ? `-${formatCurrency(row.debit)}` : formatCurrency(row.credit)}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 text-sm border-t border-slate-100 dark:border-white/5 pt-2">
                                            <div className="text-slate-400 dark:text-white/40 text-xs">Running Bal.</div>
                                            <div className="font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(row.runningBalance)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {transactions?.links && transactions.links.length > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                <div className="text-xs text-slate-500 dark:text-white/50">
                                    Page <span className="font-semibold text-slate-700 dark:text-white">{transactions.current_page}</span> of <span className="font-semibold text-slate-700 dark:text-white">{transactions.last_page}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(transactions.current_page - 1)}
                                        disabled={transactions.current_page <= 1}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(transactions.current_page + 1)}
                                        disabled={transactions.current_page >= transactions.last_page}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <WithdrawalModal
                    open={showWithdrawalModal}
                    onClose={() => setShowWithdrawalModal(false)}
                />
            </PaymentReminderLayout>
        </SidebarLayout>
    );
}

function WithdrawalModal({ open, onClose }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        amount: "",
        payoutMethod: "",
        bankName: "",
        bankSearch: "",
        accountName: "",
        accountNumber: "",
        remarks: "",
    });

    // Your bank list!
    const bankList = [
        "Asia United Bank (AUB)", "Bangkok Bank", "Bank of America", "Bank of China", "Bank of Commerce",
        "Bank of the Philippine Islands (BPI)", "BDO Unibank (BDO)", "China Banking Corporation (ChinaBank)",
        "CTBC Bank", "Deutsche Bank", "EastWest Bank", "HSBC", "ING Bank", "Maybank Philippines",
        "Metrobank", "Mizuho Bank", "MUFG Bank", "PBCOM", "PNB", "PSBank", "RCBC", "Robinsons Bank",
        "Security Bank", "Shinhan Bank", "Standard Chartered Bank", "Sterling Bank of Asia", "SMBC", "UnionBank",
    ];

    const filteredBanks = bankList.filter((bank) =>
        form.bankSearch ? bank.toLowerCase().includes(form.bankSearch.toLowerCase()) : true
    );

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.payoutMethod) return toast.error("Select payout method.");
        if (!form.amount || Number(form.amount) <= 0) return toast.error("Enter valid amount.");
        if (form.payoutMethod !== "cash" && !form.accountName) return toast.error("Account name required.");
        if (form.payoutMethod === "bank" && !form.bankName) return toast.error("Select bank.");
        if (["gcash", "maya"].includes(form.payoutMethod) && !/^09\d{9}$/.test(form.accountNumber)) return toast.error("Invalid mobile number.");

        setIsSubmitting(true);
        try {
            const response = await axios.post(route("member.savings.withdrawal"), form);
            if (response.data?.error) {
                toast.error(response.data.message);
            } else {
                toast.success(response.data.message);
                router.reload({ only: ["savingsRows", "savingsSummary"] });
                onClose();
            }
        } catch (err) {
            toast.error("Unable to submit withdrawal request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <ModalShell title="Request Withdrawal" subtitle="Submit a request for approval" onClose={onClose}>
                    <form className="flex-1 flex flex-col min-h-0 w-full relative" onSubmit={handleSubmit}>
                        
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar space-y-4">
                            <Field 
                                label="Amount (PHP)" 
                                type="number" 
                                value={form.amount} 
                                onChange={(val) => handleChange("amount", val)} 
                                placeholder="Enter amount"
                            />

                            <SelectField 
                                label="Payout Method" 
                                value={form.payoutMethod} 
                                onChange={(val) => handleChange("payoutMethod", val)}
                                options={[
                                    { value: "bank", label: "Bank Transfer" },
                                    { value: "gcash", label: "GCash" },
                                    { value: "maya", label: "Maya" },
                                    { value: "cash", label: "Cash (Over-the-counter)" }
                                ]}
                            />

                            {form.payoutMethod === "cash" && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 p-3 text-xs">
                                    Cash withdrawals will be released at the PMPC office. You will be notified when ready.
                                </div>
                            )}

                            {form.payoutMethod === "bank" && (
                                <div className="space-y-1.5 relative z-50">
                                    <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">Bank Name</label>
                                    <Combobox 
                                        value={form.bankName} 
                                        onChange={(val) => {
                                            handleChange("bankName", val);
                                            handleChange("bankSearch", val); 
                                        }}
                                    >
                                        <div className="relative">
                                            <Combobox.Input 
                                                className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                                onChange={(e) => handleChange("bankSearch", e.target.value)}
                                                displayValue={() => form.bankSearch}
                                                placeholder="Search bank..."
                                                autoComplete="off"
                                            />
                                            
                                            <Combobox.Options className="absolute mt-1 max-h-56 w-full overflow-y-auto rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xl dark:bg-[#0f1f1a] dark:border-white/10 dark:text-white text-sm custom-scrollbar p-1">
                                                {filteredBanks.length === 0 && form.bankSearch !== '' ? (
                                                    <div className="relative cursor-default select-none py-3 px-4 text-slate-500 dark:text-slate-400 text-center italic">
                                                        No bank found.
                                                    </div>
                                                ) : (
                                                    filteredBanks.map((bank) => (
                                                        <Combobox.Option 
                                                            key={bank} 
                                                            value={bank} 
                                                            className={({ active }) => `relative cursor-pointer select-none py-2.5 px-4 rounded-lg transition-colors ${active ? "bg-emerald-50 text-emerald-700 font-medium dark:bg-emerald-500/20 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}
                                                        >
                                                            {bank}
                                                        </Combobox.Option>
                                                    ))
                                                )}
                                            </Combobox.Options>
                                        </div>
                                    </Combobox>
                                </div>
                            )}

                            {form.payoutMethod !== "cash" && form.payoutMethod !== "" && (
                                <>
                                    <Field 
                                        label="Account Name" 
                                        value={form.accountName} 
                                        onChange={(val) => handleChange("accountName", val)} 
                                        placeholder="Account holder name"
                                    />
                                    <Field 
                                        label={["gcash", "maya"].includes(form.payoutMethod) ? "Mobile Number" : "Account Number"} 
                                        value={form.accountNumber} 
                                        onChange={(val) => handleChange("accountNumber", val)} 
                                        placeholder={["gcash", "maya"].includes(form.payoutMethod) ? "09xxxxxxxxx" : "Account Number"}
                                    />
                                </>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">Remarks (Optional)</label>
                                <textarea 
                                    className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:placeholder:text-white/20"
                                    rows={2}
                                    value={form.remarks}
                                    onChange={(e) => handleChange("remarks", e.target.value)}
                                    placeholder="Notes..."
                                />
                            </div>
                        </div>

                        {/* PINNED FOOTER */}
                        <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0f1f1a] z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition shadow-sm">
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isSubmitting ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </form>
                </ModalShell>
            )}
        </AnimatePresence>
    );
}

function MiniStat({ label, value, icon: Icon, color = "text-slate-600 dark:text-white" }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 px-5 py-4 flex items-center gap-4 min-w-0 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
            <span className="grid place-items-center h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/10 shrink-0 border border-slate-200 dark:border-white/5 shadow-inner">
                <Icon className={`h-6 w-6 ${color}`} />
            </span>
            <div className="min-w-0">
                <div className="text-xs text-slate-500 dark:text-white/50 truncate uppercase tracking-wide font-medium">{label}</div>
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate mt-0.5">{value || "—"}</div>
            </div>
        </div>
    );
}

function ModalShell({ title, subtitle, onClose, children }) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = "hidden";
        
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <motion.div 
            className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center p-0 sm:p-4" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <motion.div 
                className="relative w-full max-w-lg bg-white dark:bg-[#0f1f1a] shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl overflow-hidden" 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }} 
                transition={{ type: "spring", damping: 30, stiffness: 300, mass: 1.2 }}
            >
                <div className="sm:hidden flex justify-center pt-3 pb-1 bg-white dark:bg-[#0f1f1a] w-full absolute top-0 z-50">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/20 rounded-full" />
                </div>

                <div className="shrink-0 flex justify-between items-center px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-200/80 dark:border-white/10 z-20 bg-white dark:bg-[#0f1f1a] pt-8 sm:pt-6">
                    <div className="min-w-0 pr-4">
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">{title}</div>
                        <div className="text-xs sm:text-sm text-slate-500 dark:text-white/50 mt-0.5 truncate">{subtitle}</div>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/30 dark:bg-transparent">
                    {children}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">{label}</label>
            <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder:text-slate-400 dark:placeholder:text-white/20" />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition [&>option]:text-slate-900 dark:[&>option]:text-white dark:[&>option]:bg-slate-800 cursor-pointer">
                <option value="">Select...</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}