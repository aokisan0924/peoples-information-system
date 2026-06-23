import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2, AlertCircle, Clock, ShieldCheck, FileText,
    ChevronDown, TrendingUp, CalendarDays, Wallet, Timer,
    ArrowLeftRight
} from 'lucide-react';
import SidebarLayout from "@/Layouts/SidebarLayout";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

const STATUS_CONFIG = {
    paid: {
        label: 'Paid',
        icon: CheckCircle2,
        row: 'bg-emerald-50 dark:bg-emerald-500/[0.04]',
        text: 'text-emerald-800 dark:text-emerald-300',
        pill: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
        icon_cls: 'text-emerald-600 dark:text-emerald-400',
    },
    overdue: {
        label: 'Overdue',
        icon: AlertCircle,
        row: 'bg-rose-50 dark:bg-rose-500/[0.04]',
        text: 'text-rose-800 dark:text-rose-300',
        pill: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30',
        icon_cls: 'text-rose-500 dark:text-rose-400',
    },
    pending: {
        label: 'Pending',
        icon: Clock,
        row: '',
        text: 'text-slate-700 dark:text-slate-300',
        pill: 'bg-slate-100 text-slate-600 border-transparent dark:bg-white/5 dark:text-slate-400',
        icon_cls: 'text-slate-400',
    },
};

function getStatus(status) {
    return STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ paid, total }) {
    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
    return (
        <div className="mt-3">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/70">
                    Repayment Progress
                </span>
                <span className="text-[10px] font-black text-white/90">{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-white/80 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
    return (
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>
                <Icon size={15} className="text-white" />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none mb-1">
                    {label}
                </p>
                <p className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white leading-tight">
                    {value}
                </p>
                {sub && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
                )}
            </div>
        </div>
    );
}

// ─── MOBILE SCHEDULE CARD ─────────────────────────────────────────────────────
function ScheduleCard({ row, activeLoan }) {
    const cfg = getStatus(row.status);
    const StatusIcon = cfg.icon;
    return (
        <div className={`rounded-2xl border p-4 space-y-3 ${
            row.status === 'paid'
                ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/[0.04] dark:border-emerald-500/10'
                : row.status === 'overdue'
                ? 'bg-rose-50 border-rose-100 dark:bg-rose-500/[0.04] dark:border-rose-500/10'
                : 'bg-white border-slate-200 dark:bg-white/[0.02] dark:border-white/5'
        }`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 font-mono">
                    Installment {row.installmentNumber} / {activeLoan.numberOfPayments}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide ${cfg.pill}`}>
                    <StatusIcon size={10} className={cfg.icon_cls} />
                    {cfg.label}
                </span>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Due Date</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{row.dueDate}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Amount</p>
                    <p className={`text-base font-black font-mono ${cfg.text}`}>
                        {formatCurrency(row.amountDue)}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function MySchedule(props) {
    const { loans = [], activeLoan, schedule = [] } = props;
    const [showAll, setShowAll] = useState(false);

    // FIX: route name is 'member.loans.schedule' — the client group is declared as
    // Route::middleware('auth:member')->prefix('client')->name('member.')->group(...)
    // so all routes inside inherit the 'member.' prefix, NOT 'client.'
    const handleLoanSwitch = (e) => {
        router.get(
            route('member.loans.schedule'),
            { loanId: e.target.value },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['activeLoan', 'schedule'],
            }
        );
    };

    const { paidInstallments, remainingInstallments, totalPaid, overdueCount } = useMemo(() => {
        const paid    = schedule.filter(r => r.status === 'paid');
        const overdue = schedule.filter(r => r.status === 'overdue');
        const totalPaid = paid.reduce((sum, r) => sum + parseFloat(r.amountPaid || 0), 0);
        return {
            paidInstallments:      paid.length,
            remainingInstallments: schedule.filter(r => r.status !== 'paid').length,
            overdueCount:          overdue.length,
            totalPaid,
        };
    }, [schedule]);

    const visibleRows = showAll ? schedule : schedule.slice(0, 12);

    return (
        <SidebarLayout>
            <Head title="My Loan Schedule">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="max-w-5xl mx-auto px-0 sm:px-2 space-y-5 pb-10">

                {/* ─── HEADER BANNER ─── */}
                <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 sm:p-7 rounded-2xl sm:rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                                <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-white/15 px-2.5 py-1 rounded-md text-emerald-100 mb-2">
                                    Member Loan Portfolio
                                </span>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                                    My Amortization Schedule
                                </h1>
                                <p className="text-emerald-100/60 text-xs mt-1">
                                    Track payments, due dates, and outstanding balances.
                                </p>
                            </div>

                            {loans.length > 1 && (
                                <div className="w-full sm:w-60 shrink-0">
                                    <label className="block text-[9px] uppercase tracking-wider font-bold text-emerald-300 mb-1.5">
                                        <ArrowLeftRight size={9} className="inline mr-1 mb-0.5" />
                                        Switch Loan
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={activeLoan?.id ?? ''}
                                            onChange={handleLoanSwitch}
                                            className="w-full appearance-none rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold py-2.5 pl-3 pr-8 outline-none focus:ring-2 focus:ring-white/30 cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"
                                        >
                                            {loans.map(l => (
                                                <option key={l.id} value={l.id}>
                                                    {l.loanReference} — {l.loanType}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {overdueCount > 0 && (
                            <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-400/30 rounded-xl px-3 py-2 text-xs font-semibold text-rose-100">
                                <AlertCircle size={13} className="shrink-0 text-rose-300" />
                                {overdueCount === 1
                                    ? '1 installment is overdue. Please settle as soon as possible.'
                                    : `${overdueCount} installments are overdue. Please settle as soon as possible.`}
                            </div>
                        )}

                        {activeLoan && (
                            <ProgressBar paid={paidInstallments} total={activeLoan.numberOfPayments} />
                        )}
                    </div>
                </div>

                {/* ─── EMPTY STATE ─── */}
                {!activeLoan ? (
                    <div className="bg-white dark:bg-white/[0.02] rounded-2xl sm:rounded-3xl p-10 sm:p-14 text-center border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={24} className="text-slate-300 dark:text-white/20" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                            No Active Loans
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                            You don't have any released or completed loans attached to your account yet.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ─── STAT CARDS ─── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard
                                icon={Wallet}
                                label="Loan Amount"
                                value={formatCurrency(activeLoan.loanAmount)}
                                accent="bg-slate-600"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Total Paid"
                                value={formatCurrency(totalPaid)}
                                sub={`${paidInstallments} of ${activeLoan.numberOfPayments} terms`}
                                accent="bg-emerald-600"
                            />
                            <StatCard
                                icon={Timer}
                                label="Remaining"
                                value={`${remainingInstallments} months`}
                                accent="bg-rose-500"
                            />
                            <StatCard
                                icon={CalendarDays}
                                label="Total Terms"
                                value={`${activeLoan.numberOfPayments} months`}
                                accent="bg-teal-600"
                            />
                        </div>

                        {/* ─── DESKTOP TABLE ─── */}
                        <div className="hidden sm:block bg-white dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                    <FileText size={12} className="text-slate-400" />
                                </div>
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                    Amortization Schedule
                                </h4>
                                <span className="ml-auto text-[10px] font-bold text-slate-300 dark:text-slate-600">
                                    {schedule.length} installments
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="bg-slate-50 dark:bg-black/10 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-5 py-3.5">#</th>
                                            <th className="px-5 py-3.5">Due Date</th>
                                            <th className="px-5 py-3.5 text-right">Amount Due</th>
                                            <th className="px-5 py-3.5 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
                                        {schedule.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-14 text-center text-sm text-slate-400 dark:text-white/20">
                                                    No schedule records found for this loan.
                                                </td>
                                            </tr>
                                        ) : (
                                            visibleRows.map((row) => {
                                                const cfg = getStatus(row.status);
                                                const StatusIcon = cfg.icon;
                                                return (
                                                    <tr
                                                        key={row.installmentNumber}
                                                        className={`transition-colors duration-100 ${cfg.row} hover:brightness-[0.97] dark:hover:brightness-125`}
                                                    >
                                                        <td className={`px-5 py-3.5 font-black font-mono ${cfg.text}`}>
                                                            <span className="text-slate-400 dark:text-slate-500 font-normal text-[10px] mr-1">No.</span>
                                                            {String(row.installmentNumber).padStart(2, '0')}
                                                            <span className="text-slate-300 dark:text-white/10 mx-1">/</span>
                                                            <span className="text-slate-400 dark:text-slate-500 font-normal">
                                                                {activeLoan.numberOfPayments}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-sans">
                                                            {row.dueDate}
                                                        </td>
                                                        <td className={`px-5 py-3.5 text-right font-black font-mono tracking-tight ${cfg.text}`}>
                                                            {formatCurrency(row.amountDue)}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-center font-sans">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide ${cfg.pill}`}>
                                                                <StatusIcon size={10} className={cfg.icon_cls} />
                                                                {cfg.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {schedule.length > 12 && (
                                <button
                                    onClick={() => setShowAll(v => !v)}
                                    className="w-full py-3 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-t border-slate-100 dark:border-white/5 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <ChevronDown size={13} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
                                    {showAll ? 'Show less' : `Show all ${schedule.length} installments`}
                                </button>
                            )}
                        </div>

                        {/* ─── MOBILE CARDS ─── */}
                        <div className="sm:hidden space-y-2.5">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <FileText size={12} />
                                    Amortization Schedule
                                </h4>
                                <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold">
                                    {schedule.length} terms
                                </span>
                            </div>

                            {schedule.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8 text-center text-sm text-slate-400">
                                    No schedule records found.
                                </div>
                            ) : (
                                <>
                                    {visibleRows.map(row => (
                                        <ScheduleCard
                                            key={row.installmentNumber}
                                            row={row}
                                            activeLoan={activeLoan}
                                        />
                                    ))}
                                    {schedule.length > 12 && (
                                        <button
                                            onClick={() => setShowAll(v => !v)}
                                            className="w-full py-3 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-white/5 rounded-2xl bg-white dark:bg-white/[0.02] transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <ChevronDown size={13} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
                                            {showAll ? 'Show less' : `Show all ${schedule.length} installments`}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </SidebarLayout>
    );
}