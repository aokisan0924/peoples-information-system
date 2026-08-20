import React, { useState, useCallback } from "react";
import { Head, usePage, router, Link } from "@inertiajs/react";
import {
    ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Pencil,
    Save, X, BookOpen, User, Building2, Calendar, Info,
    ShieldCheck, RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import axios from "axios";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v) =>
    `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const SOURCE_LABELS = {
    loan:       "Loan Release",
    membership: "Membership Fee",
    capital:    "Share Capital",
    savings:    "Savings Deposit",
    memcap:     "Onboarding (Membership + Share Capital)",
    petty_cash: "Petty Cash",
    ewallet:    "E-Wallet",
    bank:       "Bank Record",
    ppe:        "PPE Depreciation",
};

const STATUS_COLORS = {
    pending_review: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
    approved:       "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
    rejected:       "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JournalEntryReview() {
    const {
        batchReference, lines: initialLines, member,
        totalDebit: initDebit, totalCredit: initCredit,
        isBalanced: initBalanced, batchStatus, sourceType, sourceRecordId, branch,
    } = usePage().props;

    const [lines, setLines]         = useState(initialLines);
    const [totalDebit, setTotalDebit]   = useState(initDebit);
    const [totalCredit, setTotalCredit] = useState(initCredit);
    const [isBalanced, setIsBalanced]   = useState(initBalanced);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm]   = useState({});
    const [saving, setSaving]       = useState(false);

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal]   = useState(false);
    const [notes, setNotes]         = useState("");
    const [actioning, setActioning] = useState(false);

    const isPending = batchStatus === "pending_review";

    // ── Inline edit ──────────────────────────────────────────────────────────

    const startEdit = (line) => {
        setEditingId(line.id);
        setEditForm({
            account_code: line.account_code,
            account_name: line.account_name,
            debit:        line.debit,
            credit:       line.credit,
            particulars:  line.particulars ?? "",
        });
    };

    const cancelEdit = () => { setEditingId(null); setEditForm({}); };

    const saveLine = async (lineId) => {
        setSaving(true);
        try {
            const { data } = await axios.post(
                route("admin.accounting.journal-entries.update-line", { batchReference, source_type: sourceType, source_record_id: sourceRecordId, branch }),
                { ...editForm, line_id: lineId, source_type: sourceType }
            );
            if (!data.ok) { toast.error(data.message); return; }

            // Patch local state
            setLines((prev) =>
                prev.map((l) => l.id === lineId ? { ...l, ...data.line } : l)
            );
            setTotalDebit(data.totalDebit);
            setTotalCredit(data.totalCredit);
            setIsBalanced(data.isBalanced);
            setEditingId(null);
            toast.success("Line updated.");
        } catch (err) {
            toast.error(err.response?.data?.message ?? "Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    // ── Approve ──────────────────────────────────────────────────────────────

    const handleApprove = async () => {
        if (!isBalanced) {
            toast.error("Entry is not balanced. Fix debits/credits before approving.");
            return;
        }
        setActioning(true);
        try {
            const { data } = await axios.post(
                route("admin.accounting.journal-entries.approve", { batchReference, source_type: sourceType, source_record_id: sourceRecordId, branch }),
                { notes, source_type: sourceType, source_record_id: sourceRecordId, branch }
            );
            if (!data.ok) { toast.error(data.message); return; }
            toast.success(data.message);
            setShowApproveModal(false);
            router.visit(route("admin.accounting.journal-entries.index"));
        } catch (err) {
            toast.error(err.response?.data?.message ?? "Approval failed.");
        } finally {
            setActioning(false);
        }
    };

    // ── Reject ───────────────────────────────────────────────────────────────

    const handleReject = async () => {
        if (!notes.trim()) { toast.error("Please provide a reason for rejection."); return; }
        setActioning(true);
        try {
            const { data } = await axios.post(
                route("admin.accounting.journal-entries.reject", { batchReference, source_type: sourceType, source_record_id: sourceRecordId, branch }),
                { notes, source_type: sourceType, source_record_id: sourceRecordId, branch }
            );
            if (!data.ok) { toast.error(data.message); return; }
            toast.success(data.message);
            setShowRejectModal(false);
            router.visit(route("admin.accounting.journal-entries.index"));
        } catch (err) {
            toast.error(err.response?.data?.message ?? "Rejection failed.");
        } finally {
            setActioning(false);
        }
    };

    return (
        <AdminSidebarLayout>
            <Head title={`Review — ${batchReference}`} />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* ── Back + title ───────────────────────────────────────── */}
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.accounting.journal-entries.index")}
                        className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            Journal Entry Review
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-white/50 font-mono mt-0.5">{batchReference}</p>
                    </div>
                    <span className={`ml-auto px-3 py-1 rounded-xl border text-xs font-semibold capitalize ${STATUS_COLORS[batchStatus] ?? ""}`}>
                        {batchStatus?.replace("_", " ")}
                    </span>
                </div>

                {/* ── Meta card ──────────────────────────────────────────── */}
                <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-sm transition-colors">
                    <MetaItem icon={User} label="Member">
                        {member ? `${member.lastName}, ${member.firstName}` : "—"}
                        {member?.accountStatus && (
                            <span className="block text-xs text-slate-400 dark:text-white/40 capitalize mt-0.5">{member.accountStatus}</span>
                        )}
                    </MetaItem>
                    <MetaItem icon={BookOpen} label="Type">
                        {SOURCE_LABELS[lines[0]?.source_type] ?? lines[0]?.source_type ?? "—"}
                    </MetaItem>
                    <MetaItem icon={Building2} label="Branch">
                        {lines[0]?.branch ?? "—"}
                    </MetaItem>
                    <MetaItem icon={Calendar} label="Date">
                        {lines[0]?.transaction_date ?? "—"}
                    </MetaItem>
                </div>

                {/* ── Balance indicator ───────────────────────────────────── */}
                <div className={`rounded-2xl border px-5 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                    isBalanced
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                        : "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10"
                }`}>
                    <div className="flex items-center gap-2">
                        {isBalanced
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            : <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                        }
                        <span className={`text-sm font-semibold ${isBalanced ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                            {isBalanced ? "Entry is balanced" : "Entry is NOT balanced — fix before approving"}
                        </span>
                    </div>
                    <div className="flex gap-6 text-sm font-mono">
                        <div className="text-right">
                            <div className="text-xs text-slate-500 dark:text-white/40 uppercase tracking-wide">Total Dr.</div>
                            <div className="font-bold text-slate-900 dark:text-white">{fmt(totalDebit)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 dark:text-white/40 uppercase tracking-wide">Total Cr.</div>
                            <div className="font-bold text-slate-900 dark:text-white">{fmt(totalCredit)}</div>
                        </div>
                        {!isBalanced && (
                            <div className="text-right">
                                <div className="text-xs text-rose-400 uppercase tracking-wide">Difference</div>
                                <div className="font-bold text-rose-600 dark:text-rose-400">{fmt(Math.abs(totalDebit - totalCredit))}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Journal lines ───────────────────────────────────────── */}
                <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-xl transition-colors">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            Journal Lines — {lines.length} entries
                        </span>
                        {isPending && (
                            <span className="ml-auto text-xs text-slate-400 dark:text-white/30 flex items-center gap-1">
                                <Pencil className="h-3 w-3" /> Click row to edit
                            </span>
                        )}
                    </div>

                    {/* Desktop */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs uppercase tracking-wider text-slate-500 dark:text-white/40">
                                <tr>
                                    <th className="px-5 py-3 font-medium w-28">Code</th>
                                    <th className="px-5 py-3 font-medium">Account Name</th>
                                    <th className="px-5 py-3 font-medium">Particulars</th>
                                    <th className="px-5 py-3 font-medium text-right w-36">Debit</th>
                                    <th className="px-5 py-3 font-medium text-right w-36">Credit</th>
                                    {isPending && <th className="px-5 py-3 font-medium w-20"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {lines.map((line) => {
                                    const isEditing = editingId === line.id;
                                    return (
                                        <tr
                                            key={line.id}
                                            className={`transition-colors ${isEditing ? "bg-emerald-50/60 dark:bg-emerald-500/5" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}
                                        >
                                            {isEditing ? (
                                                <>
                                                    <td className="px-4 py-3">
                                                        <input value={editForm.account_code} onChange={(e) => setEditForm(f => ({ ...f, account_code: e.target.value }))}
                                                            className={inputCls} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input value={editForm.account_name} onChange={(e) => setEditForm(f => ({ ...f, account_name: e.target.value }))}
                                                            className={inputCls} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input value={editForm.particulars} onChange={(e) => setEditForm(f => ({ ...f, particulars: e.target.value }))}
                                                            className={inputCls} />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <input type="number" min="0" step="0.01" value={editForm.debit}
                                                            onChange={(e) => setEditForm(f => ({ ...f, debit: e.target.value }))}
                                                            className={`${inputCls} text-right`} />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <input type="number" min="0" step="0.01" value={editForm.credit}
                                                            onChange={(e) => setEditForm(f => ({ ...f, credit: e.target.value }))}
                                                            className={`${inputCls} text-right`} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1.5 justify-end">
                                                            <button onClick={() => saveLine(line.id)} disabled={saving}
                                                                className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center disabled:opacity-50 transition">
                                                                <Save className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button onClick={cancelEdit}
                                                                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition">
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-5 py-4 font-mono text-xs text-slate-500 dark:text-white/50 whitespace-nowrap">
                                                        {line.account_code}
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-900 dark:text-white font-medium whitespace-nowrap">
                                                        {line.account_name}
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-500 dark:text-white/50 text-xs max-w-xs truncate">
                                                        {line.particulars ?? "—"}
                                                    </td>
                                                    <td className="px-5 py-4 text-right font-mono text-slate-900 dark:text-white">
                                                        {line.debit > 0 ? fmt(line.debit) : <span className="text-slate-300 dark:text-white/20">—</span>}
                                                    </td>
                                                    <td className="px-5 py-4 text-right font-mono text-slate-900 dark:text-white">
                                                        {line.credit > 0 ? fmt(line.credit) : <span className="text-slate-300 dark:text-white/20">—</span>}
                                                    </td>
                                                    {isPending && (
                                                        <td className="px-5 py-4 text-right">
                                                            <button onClick={() => startEdit(line)}
                                                                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 flex items-center justify-center transition ml-auto">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {/* Totals footer */}
                            <tfoot className="bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 text-sm font-bold">
                                <tr>
                                    <td colSpan={3} className="px-5 py-3 text-slate-500 dark:text-white/50 uppercase text-xs tracking-wide">Totals</td>
                                    <td className="px-5 py-3 text-right font-mono text-slate-900 dark:text-white">{fmt(totalDebit)}</td>
                                    <td className="px-5 py-3 text-right font-mono text-slate-900 dark:text-white">{fmt(totalCredit)}</td>
                                    {isPending && <td />}
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Mobile lines */}
                    <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/10">
                        {lines.map((line) => (
                            <div key={line.id} className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-mono text-xs text-slate-400 dark:text-white/30">{line.account_code}</div>
                                        <div className="text-slate-900 dark:text-white font-semibold text-sm">{line.account_name}</div>
                                        {line.particulars && <div className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{line.particulars}</div>}
                                    </div>
                                    {isPending && editingId !== line.id && (
                                        <button onClick={() => startEdit(line)}
                                            className="h-8 w-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 flex items-center justify-center transition">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 dark:text-white/40">Dr <span className="font-mono font-bold text-slate-700 dark:text-white/80">{line.debit > 0 ? fmt(line.debit) : "—"}</span></span>
                                    <span className="text-slate-400 dark:text-white/40">Cr <span className="font-mono font-bold text-slate-700 dark:text-white/80">{line.credit > 0 ? fmt(line.credit) : "—"}</span></span>
                                </div>
                            </div>
                        ))}
                        <div className="px-4 py-3 bg-slate-50 dark:bg-white/5 flex justify-between text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-white/40">
                            <span>Total Dr: <span className="font-mono text-slate-900 dark:text-white">{fmt(totalDebit)}</span></span>
                            <span>Total Cr: <span className="font-mono text-slate-900 dark:text-white">{fmt(totalCredit)}</span></span>
                        </div>
                    </div>
                </div>

                {/* ── Reviewer notes (read-only if already reviewed) ───────── */}
                {!isPending && lines[0]?.reviewer_notes && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-5 py-4">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Info className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/40">Reviewer Notes</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-white/70">{lines[0].reviewer_notes}</p>
                    </div>
                )}

                {/* ── Action buttons ──────────────────────────────────────── */}
                {isPending && (
                    <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                        <button
                            onClick={() => { setNotes(""); setShowRejectModal(true); }}
                            className="px-6 py-3 rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-500/20 transition flex items-center justify-center gap-2 shadow-sm"
                        >
                            <XCircle className="h-4 w-4" /> Reject Entry
                        </button>
                        <button
                            onClick={() => { setNotes(""); setShowApproveModal(true); }}
                            disabled={!isBalanced}
                            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            <ShieldCheck className="h-4 w-4" /> Approve & Post to GL
                        </button>
                    </div>
                )}
            </div>

            {/* ── Approve modal ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {showApproveModal && (
                    <ConfirmModal
                        title="Approve & Post to General Ledger"
                        description={`This will permanently post all ${lines.length} lines for batch ${batchReference} to the General Ledger. This action cannot be undone.`}
                        confirmLabel="Approve & Post"
                        confirmClass="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                        notes={notes}
                        onNotesChange={setNotes}
                        notesPlaceholder="Optional notes for audit trail..."
                        onConfirm={handleApprove}
                        onClose={() => setShowApproveModal(false)}
                        loading={actioning}
                        icon={<ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
                        iconBg="bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30"
                    />
                )}
            </AnimatePresence>

            {/* ── Reject modal ──────────────────────────────────────────────── */}
            <AnimatePresence>
                {showRejectModal && (
                    <ConfirmModal
                        title="Reject Journal Entry"
                        description="The entry will be marked as rejected and will not be posted to the General Ledger. A reason is required."
                        confirmLabel="Reject Entry"
                        confirmClass="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
                        notes={notes}
                        onNotesChange={setNotes}
                        notesPlaceholder="Reason for rejection (required)..."
                        onConfirm={handleReject}
                        onClose={() => setShowRejectModal(false)}
                        loading={actioning}
                        icon={<XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />}
                        iconBg="bg-rose-100 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/30"
                    />
                )}
            </AnimatePresence>
        </AdminSidebarLayout>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputCls = "w-full rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white px-2.5 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition";

function MetaItem({ icon: Icon, label, children }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-white/40 uppercase tracking-wide font-medium">
                <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <div className="text-sm text-slate-900 dark:text-white font-medium">{children}</div>
        </div>
    );
}

function ConfirmModal({ title, description, confirmLabel, confirmClass, notes, onNotesChange, notesPlaceholder, onConfirm, onClose, loading, icon, iconBg }) {
    return (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
            <motion.div
                className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
            />
            <motion.div
                className="relative w-full max-w-md bg-white dark:bg-[#0f1f1a] rounded-3xl shadow-2xl overflow-hidden"
                initial={{ scale: 0.97, y: -14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: -14 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
                <div className="p-6 sm:p-8 space-y-5">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                            {icon}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                            <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">{description}</p>
                        </div>
                    </div>

                    <textarea
                        className="w-full rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder:text-slate-400 dark:placeholder:text-white/20 resize-none"
                        rows={3}
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        placeholder={notesPlaceholder}
                    />

                    <div className="flex gap-3 justify-end">
                        <button onClick={onClose} disabled={loading}
                            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={onConfirm} disabled={loading}
                            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 flex items-center gap-2 ${confirmClass}`}>
                            {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
