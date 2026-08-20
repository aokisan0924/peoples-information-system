import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import {
    X, Trash2, CalendarDays, Edit2, Smartphone,
    PlusCircle, Search, ChevronDown, Printer, ReceiptText, Check, Plus, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PettyCash({ records, chartOfAccounts, beginningBalance, endingBalance, filters }) {
    const [date, setDate] = useState(filters.date);

    // UI States
    const [showLogModal, setShowLogModal]           = useState(false);
    const [recordToJournalize, setRecordToJournalize] = useState(null);
    const [editingId, setEditingId]                 = useState(null);
    const [editForm, setEditForm]                   = useState({});
    const [selectedVouchers, setSelectedVouchers]   = useState([]);
    const [isSaving, setIsSaving]                   = useState(false);

    // Initial Log Phase
    const emptyLog = { id: Date.now(), transactionDate: filters.date, orNumber: '', particulars: '', amountType: 'credit', amount: '' };
    const [logs, setLogs] = useState([{ ...emptyLog }]);

    // Journal Phase
    const emptySplit = { accountCode: '', accountName: '', debit: 0, credit: 0 };
    const [journalEntries, setJournalEntries] = useState([{ ...emptySplit }, { ...emptySplit }]);
    const [openDropdown, setOpenDropdown]     = useState(null);
    const [accountSearch, setAccountSearch]   = useState('');

    const filteredAccounts = useMemo(() =>
        chartOfAccounts.filter(acc =>
            acc.accountName.toLowerCase().includes(accountSearch.toLowerCase()) ||
            acc.accountCode.includes(accountSearch)
        ), [accountSearch, chartOfAccounts]
    );

    const handleFilterChange = (e) => {
        const newDate = e.target.value;
        setDate(newDate);
        router.get(route('admin.accounting.petty.index'), { date: newDate }, { preserveState: true });
    };

    const submitLogs = (e) => {
        e.preventDefault();
        const payload = logs.map(log => ({
            transactionDate: log.transactionDate,
            orNumber:        log.orNumber,
            particulars:     log.particulars,
            debit:           log.amountType === 'debit'  ? parseFloat(log.amount || 0) : 0,
            credit:          log.amountType === 'credit' ? parseFloat(log.amount || 0) : 0,
        }));
        setIsSaving(true);
        router.post(route('admin.accounting.petty.store-log'), { transactions: payload }, {
            onSuccess: () => {
                setShowLogModal(false);
                setLogs([{ ...emptyLog, id: Date.now() }]);
                toast.success('Transactions Logged successfully.');
                setIsSaving(false);
            },
            onError: () => setIsSaving(false)
        });
    };

    const handleEditJournal = (record) => {
        setRecordToJournalize(record);
        if (record.ledger_entries?.length > 0) {
            setJournalEntries(record.ledger_entries.map(le => ({
                accountCode: le.accountCode,
                accountName: le.accountName,
                debit:       le.debit,
                credit:      le.credit
            })));
        } else {
            setJournalEntries([{ ...emptySplit }, { ...emptySplit }]);
        }
    };

    const submitJournal = () => {
        const d = journalEntries.reduce((sum, e) => sum + parseFloat(e.debit  || 0), 0);
        const c = journalEntries.reduce((sum, e) => sum + parseFloat(e.credit || 0), 0);
        if (Math.abs(d - c) > 0.01 || (d === 0 && c === 0)) {
            toast.error('Total Debits must equal Total Credits.');
            return;
        }
        setIsSaving(true);
        const routeName = recordToJournalize.journal_status === 'pending_review'
            ? 'admin.accounting.petty.update-journal'
            : 'admin.accounting.petty.journalize';
        router.post(route(routeName, recordToJournalize.id), { entries: journalEntries }, {
            onSuccess: () => {
                const wasPosted = recordToJournalize.journal_status === 'pending_review';
                setRecordToJournalize(null);
                setJournalEntries([{ ...emptySplit }, { ...emptySplit }]);
                toast.success(wasPosted ? 'Pending journal updated.' : 'Journal submitted for review.');
                setIsSaving(false);
            },
            onError: () => setIsSaving(false)
        });
    };

    const handleSaveEdit = () => {
        router.put(route('admin.accounting.petty.update', editingId), editForm, {
            onSuccess: () => { setEditingId(null); toast.success('Record updated'); }
        });
    };

    const handleLogChange = (id, field, value) =>
        setLogs(logs.map(log => log.id === id ? { ...log, [field]: value } : log));

    const handleJournalEntryChange = (idx, field, value) => {
        const newEntries = [...journalEntries];
        newEntries[idx][field] = value;
        setJournalEntries(newEntries);
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

    let runningBalance = beginningBalance;

    // ─── INPUT SHARED CLASSES ─────────────────────────────────────────────────
    const logInput = 'w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm text-white focus:ring-emerald-500 px-3 py-2';

    return (
        <AdminSidebarLayout>
            <Head title="Petty Cash Daily Log" />
            <div className="w-full max-w-[110rem] mx-auto space-y-4 sm:space-y-6 px-3 sm:px-4 pb-28">

                {/* ── HEADER ──────────────────────────────────────────────── */}
                <div className="bg-slate-900 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                                Petty Cash <span className="text-emerald-400">Daily</span>
                            </h1>
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                <Smartphone size={13} className="text-emerald-400 shrink-0" />
                                <span className="font-mono truncate">{filters.branch}</span>
                            </div>
                        </div>

                        {/* Date + New Transaction — full width row on mobile */}
                        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                            <div className="flex bg-white/5 p-2 rounded-xl border border-white/10 items-center gap-2 px-3 flex-1 sm:flex-none">
                                <CalendarDays size={16} className="text-emerald-400 shrink-0" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={handleFilterChange}
                                    className="bg-transparent border-0 text-white font-bold text-sm focus:ring-0 cursor-pointer w-full"
                                />
                            </div>
                            <button
                                onClick={() => setShowLogModal(true)}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-950 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all flex-1 sm:flex-none"
                            >
                                <Plus size={16} />
                                <span>New Transaction</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── BALANCE CARDS ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-slate-900 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Beginning Balance</p>
                        <p className="text-lg sm:text-2xl font-black text-white font-mono mt-1 truncate">
                            {formatCurrency(beginningBalance)}
                        </p>
                    </div>
                    <div className="bg-slate-900 border border-emerald-500/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 text-emerald-500">
                            <ReceiptText size={40} />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest relative z-10">Ending Balance</p>
                        <p className="text-lg sm:text-2xl font-black text-emerald-400 font-mono mt-1 relative z-10 truncate">
                            {formatCurrency(endingBalance)}
                        </p>
                    </div>
                </div>

                {/* ── TABLE ────────────────────────────────────────────────── */}
                {/*
                    Mobile strategy:
                    - Checkbox, OR No., Balance columns hidden on mobile
                    - DR/CR collapsed into the Particulars sub-row on mobile
                    - Actions always visible
                */}
                <div className="bg-slate-950 rounded-2xl sm:rounded-[2rem] border border-white/5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-white min-w-[320px]">
                            <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-white/5">
                                <tr>
                                    {/* Checkbox — hidden on mobile */}
                                    <th className="hidden sm:table-cell px-4 sm:px-6 py-4 sm:py-5 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-white/10 bg-white/5"
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedVouchers(records.filter(r => r.is_posted).map(r => r.id));
                                                else setSelectedVouchers([]);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 sm:px-6 py-4 sm:py-5">Date</th>
                                    {/* OR — hidden on mobile */}
                                    <th className="hidden md:table-cell px-3 sm:px-6 py-4 sm:py-5">OR No.</th>
                                    <th className="px-3 sm:px-6 py-4 sm:py-5">Particulars</th>
                                    {/* DR/CR — hidden on mobile, visible on md+ */}
                                    <th className="hidden md:table-cell px-3 sm:px-6 py-4 sm:py-5 text-right">DR</th>
                                    <th className="hidden md:table-cell px-3 sm:px-6 py-4 sm:py-5 text-right">CR</th>
                                    <th className="px-3 sm:px-6 py-4 sm:py-5 text-right bg-emerald-400/5 text-emerald-500 whitespace-nowrap">Balance</th>
                                    <th className="px-3 sm:px-6 py-4 sm:py-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium">
                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-slate-500 text-sm">
                                            No transactions for this day.
                                        </td>
                                    </tr>
                                )}
                                {records.map(record => {
                                    runningBalance = runningBalance + parseFloat(record.credit) - parseFloat(record.debit);
                                    const isEditing = editingId === record.id;

                                    return (
                                        <tr key={record.id} className="hover:bg-emerald-400/5 transition-colors group text-white text-sm">

                                            {/* Checkbox — hidden on mobile */}
                                            <td className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4 text-center">
                                                {record.is_posted && (
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-white/10 bg-white/5 text-emerald-500"
                                                        checked={selectedVouchers.includes(record.id)}
                                                        onChange={() => setSelectedVouchers(prev =>
                                                            prev.includes(record.id)
                                                                ? prev.filter(i => i !== record.id)
                                                                : [...prev, record.id]
                                                        )}
                                                    />
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs text-slate-400 whitespace-nowrap">
                                                {isEditing
                                                    ? <input type="date" value={editForm.transactionDate} onChange={e => setEditForm({ ...editForm, transactionDate: e.target.value })} className="bg-slate-800 border border-emerald-500/50 rounded px-2 py-1 text-white text-xs w-full" />
                                                    : record.transactionDate
                                                }
                                            </td>

                                            {/* OR — hidden on mobile */}
                                            <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 font-mono text-[10px] font-black text-indigo-400 uppercase">
                                                {isEditing
                                                    ? <input type="text" value={editForm.orNumber || ''} onChange={e => setEditForm({ ...editForm, orNumber: e.target.value })} className="bg-slate-800 border border-emerald-500/50 rounded w-full px-2 py-1 text-white text-xs" />
                                                    : (record.orNumber || '—')
                                                }
                                            </td>

                                            {/* Particulars + mobile DR/CR sub-row */}
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-slate-200">
                                                {isEditing
                                                    ? <input type="text" value={editForm.particulars} onChange={e => setEditForm({ ...editForm, particulars: e.target.value })} className="bg-slate-800 border border-emerald-500/50 rounded w-full px-2 py-1 text-white text-xs" />
                                                    : (
                                                        <div>
                                                            <span className="block">{record.particulars}</span>
                                                            {/* Mobile-only DR/CR pill */}
                                                            <span className="md:hidden flex gap-2 mt-1">
                                                                {record.debit > 0 && (
                                                                    <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                                                                        DR {formatCurrency(record.debit)}
                                                                    </span>
                                                                )}
                                                                {record.credit > 0 && (
                                                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                                        CR {formatCurrency(record.credit)}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    )
                                                }
                                            </td>

                                            {/* DR — hidden on mobile */}
                                            <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-right font-mono text-rose-400 font-bold whitespace-nowrap">
                                                {record.debit > 0 ? formatCurrency(record.debit) : '—'}
                                            </td>

                                            {/* CR — hidden on mobile */}
                                            <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">
                                                {record.credit > 0 ? formatCurrency(record.credit) : '—'}
                                            </td>

                                            {/* Balance */}
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-mono font-black text-white bg-emerald-400/5 whitespace-nowrap text-xs sm:text-sm">
                                                {formatCurrency(runningBalance)}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                                                <div className="flex justify-center gap-2 sm:gap-3 items-center">
                                                    {isEditing ? (
                                                        <button onClick={handleSaveEdit} className="p-1.5 text-emerald-500 hover:text-emerald-400" title="Save">
                                                            <Check size={17} />
                                                        </button>
                                                    ) : (
                                                        <>
                                                            {!record.is_posted ? (
                                                                <button
                                                                    onClick={() => { setRecordToJournalize(record); setJournalEntries([{ ...emptySplit }, { ...emptySplit }]); }}
                                                                    className="p-1.5 text-amber-500 hover:text-amber-400"
                                                                    title="Create Journal Entry"
                                                                >
                                                                    <BookOpen size={17} />
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => window.open(route('admin.accounting.petty.print', { ids: record.id, perPage: 1 }))} className="p-1.5 text-emerald-500 hover:text-emerald-400" title="Print Voucher">
                                                                        <Printer size={17} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button onClick={() => { setEditingId(record.id); setEditForm({ ...record }); }} className="p-1.5 text-slate-400 hover:text-indigo-400" title="Edit Log Details">
                                                                <Edit2 size={17} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── BATCH PRINT BAR ──────────────────────────────────────────── */}
            {selectedVouchers.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-5 z-[150] border border-white/10">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="p-1.5 sm:p-2 bg-emerald-500 rounded-lg text-slate-900">
                            <Printer size={16} />
                        </div>
                        <span className="font-bold text-xs sm:text-sm">{selectedVouchers.length} Selected</span>
                    </div>
                    <button
                        onClick={() => window.open(route('admin.accounting.petty.print', { ids: selectedVouchers.join(','), perPage: 3 }))}
                        className="flex-1 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg font-black text-[10px] uppercase text-center transition-colors"
                    >
                        Print Batch (3/Page)
                    </button>
                    <button onClick={() => setSelectedVouchers([])} className="p-1.5 text-slate-400 hover:text-white shrink-0">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* ── MODAL 1: NEW TRANSACTION LOG ─────────────────────────────── */}
            {showLogModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-3xl max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

                        {/* Header */}
                        <div className="flex justify-between items-center px-5 sm:px-6 py-4 sm:py-5 border-b border-white/5 shrink-0">
                            <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <ReceiptText className="text-emerald-400 shrink-0" size={20} />
                                New Transactions
                            </h2>
                            <button onClick={() => setShowLogModal(false)} className="p-1.5 text-slate-500 hover:text-white transition-colors">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-4 sm:px-6 py-4 overflow-y-auto space-y-4 flex-1">
                            {logs.map((log) => (
                                <div key={log.id} className="bg-white/5 p-4 sm:p-5 rounded-2xl relative border border-white/5 text-white">
                                    {logs.length > 1 && (
                                        <button onClick={() => setLogs(logs.filter(l => l.id !== log.id))} className="absolute top-3 right-3 text-rose-500 hover:text-rose-400">
                                            <Trash2 size={15} />
                                        </button>
                                    )}

                                    {/* Row 1: Date + Particulars */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pr-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Date</label>
                                            <input type="date" required value={log.transactionDate} onChange={e => handleLogChange(log.id, 'transactionDate', e.target.value)} className={logInput} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Particulars</label>
                                            <input type="text" required placeholder="Description" value={log.particulars} onChange={e => handleLogChange(log.id, 'particulars', e.target.value)} className={logInput} />
                                        </div>
                                    </div>

                                    {/* Row 2: OR / Amount / Type — 2 cols on mobile, 3 on sm+ */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">OR Number</label>
                                            <input type="text" placeholder="Optional" value={log.orNumber} onChange={e => handleLogChange(log.id, 'orNumber', e.target.value.toUpperCase())} className={`${logInput} uppercase font-mono`} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Amount</label>
                                            <input type="number" required min="1" step="0.01" value={log.amount} onChange={e => handleLogChange(log.id, 'amount', e.target.value)} className={`${logInput} text-right font-bold`} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Type</label>
                                            <select value={log.amountType} onChange={e => handleLogChange(log.id, 'amountType', e.target.value)} className={`${logInput} font-bold cursor-pointer`}>
                                                <option value="credit">CR — Credit</option>
                                                <option value="debit">DR — Debit</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => setLogs([...logs, { ...emptyLog, id: Date.now() }])}
                                className="w-full py-3.5 border-2 border-dashed border-white/10 rounded-xl text-slate-400 font-bold text-xs hover:border-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                            >
                                + Add Row
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="px-4 sm:px-6 py-4 border-t border-white/5 shrink-0 flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
                            <span className="text-slate-400 font-bold text-sm">{logs.length} item(s)</span>
                            <button
                                onClick={submitLogs}
                                disabled={isSaving}
                                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-slate-950 font-black rounded-xl uppercase tracking-widest active:scale-95 transition-transform text-sm disabled:opacity-60"
                            >
                                {isSaving ? 'Saving...' : 'Save Logs to Board'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL 2: JOURNAL ENTRY ───────────────────────────────────── */}
            {recordToJournalize && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col overflow-hidden">

                    {/* Header bar */}
                    <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-white/5 bg-slate-950 shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3 text-white min-w-0">
                            <BookOpen size={20} className="text-amber-400 shrink-0" />
                            <h2 className="font-black text-base sm:text-2xl tracking-tight uppercase truncate">
                                {recordToJournalize.is_posted ? 'Edit Journal Entry' : 'Create Journal Entry'}
                            </h2>
                        </div>
                        <button
                            onClick={() => setRecordToJournalize(null)}
                            className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors shrink-0 ml-3"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
                        <div className="max-w-5xl mx-auto w-full space-y-4 sm:space-y-6 pb-6">

                            {/* Record summary card */}
                            <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl border border-white/5 text-white flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-400 mb-1">{recordToJournalize.transactionDate}</p>
                                    <p className="text-base sm:text-lg font-bold truncate">{recordToJournalize.particulars}</p>
                                </div>
                                <div className="sm:text-right shrink-0">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Amount to Distribute</p>
                                    <p className="text-xl sm:text-2xl font-mono font-black text-amber-400">
                                        {formatCurrency(recordToJournalize.debit > 0 ? recordToJournalize.debit : recordToJournalize.credit)}
                                    </p>
                                </div>
                            </div>

                            {/* Account distributions */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 space-y-3 text-white">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Distributions</h3>
                                    <button
                                        onClick={() => setJournalEntries([...journalEntries, { ...emptySplit }])}
                                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 text-[10px] font-black uppercase"
                                    >
                                        <PlusCircle size={13} /> Add Account
                                    </button>
                                </div>

                                {journalEntries.map((entry, eIdx) => (
                                    <div key={eIdx} className="bg-slate-900/50 p-3 sm:p-4 rounded-2xl border border-white/5 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-4 sm:items-start">

                                        {/* Account selector — full width on mobile */}
                                        <div className="sm:col-span-6 relative">
                                            <div
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl p-2.5 sm:p-3 flex justify-between items-center cursor-pointer"
                                                onClick={() => setOpenDropdown(openDropdown === eIdx ? null : eIdx)}
                                            >
                                                <span className="font-bold text-xs truncate pr-2">
                                                    {entry.accountCode ? `${entry.accountCode} - ${entry.accountName}` : 'Select Account...'}
                                                </span>
                                                <ChevronDown size={15} className="text-slate-400 shrink-0" />
                                            </div>
                                            {openDropdown === eIdx && (
                                                <div className="absolute z-[120] left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                                    <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-white/5">
                                                        <Search size={13} className="text-slate-400 shrink-0" />
                                                        <input
                                                            autoFocus
                                                            placeholder="Search account..."
                                                            className="bg-transparent border-0 text-white text-xs w-full focus:ring-0"
                                                            value={accountSearch}
                                                            onChange={e => setAccountSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="max-h-48 overflow-auto py-2">
                                                        {filteredAccounts.map(acc => (
                                                            <div
                                                                key={acc.accountCode}
                                                                onClick={() => {
                                                                    handleJournalEntryChange(eIdx, 'accountCode', acc.accountCode);
                                                                    handleJournalEntryChange(eIdx, 'accountName', acc.accountName);
                                                                    setOpenDropdown(null);
                                                                    setAccountSearch('');
                                                                }}
                                                                className="px-4 py-2.5 text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                                                            >
                                                                {acc.accountCode} - {acc.accountName}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* DR / CR / Remove — row on mobile */}
                                        <div className="flex gap-2 sm:contents">
                                            <div className="flex-1 sm:col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Debit"
                                                    value={entry.debit || ''}
                                                    className="w-full bg-rose-500/10 border-0 rounded-xl text-rose-400 text-right text-xs py-2.5 px-3 focus:ring-rose-500"
                                                    onChange={e => handleJournalEntryChange(eIdx, 'debit', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1 sm:col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Credit"
                                                    value={entry.credit || ''}
                                                    className="w-full bg-emerald-500/10 border-0 rounded-xl text-emerald-400 text-right text-xs py-2.5 px-3 focus:ring-emerald-500"
                                                    onChange={e => handleJournalEntryChange(eIdx, 'credit', e.target.value)}
                                                />
                                            </div>
                                            <div className="sm:col-span-2 flex justify-end items-center">
                                                <button
                                                    onClick={() => setJournalEntries(journalEntries.filter((_, i) => i !== eIdx))}
                                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Post button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={submitJournal}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto px-8 sm:px-16 py-4 sm:py-5 bg-amber-500 text-amber-950 font-black rounded-2xl uppercase tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-60 text-sm"
                                >
                                    {isSaving ? 'Processing...' : (recordToJournalize.journal_status === 'pending_review' ? 'Update Pending Journal' : 'Submit for Review')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminSidebarLayout>
    );
}
