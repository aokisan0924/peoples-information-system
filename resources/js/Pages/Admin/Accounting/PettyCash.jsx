import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { 
    Wallet2, Plus, X, TableProperties, Trash2, 
    ChevronRight, CalendarDays, ReceiptText,
    ArrowUpRight, ArrowDownLeft, Edit2, Check, FileDigit, Search, ChevronDown, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PettyCash({ records, months, chartOfAccounts, beginningBalance, filters }) {
    const [month, setMonth] = useState(filters.month);
    const [year, setYear] = useState(filters.year);
    const [showModal, setShowModal] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [debitAccount, setDebitAccount] = useState(null); 
    const [creditAccount, setCreditAccount] = useState(null); 
    const [searchDebit, setSearchDebit] = useState('');
    const [searchCredit, setSearchCredit] = useState('');
    const [openDropdown, setOpenDropdown] = useState(null); 
    const [selectedVouchers, setSelectedVouchers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const emptyRow = { id: Date.now(), transactionDate: new Date().toISOString().split('T')[0], or_number: '', particulars: '', debit: '', credit: '' };
    const [rows, setRows] = useState([{ ...emptyRow }]);
    const [isSaving, setIsSaving] = useState(false);

    const filteredDebitAccounts = useMemo(() => 
        chartOfAccounts.filter(acc => 
            acc.accountName.toLowerCase().includes(searchDebit.toLowerCase()) ||
            acc.accountCode.includes(searchDebit)
        ), [searchDebit, chartOfAccounts]
    );

    const filteredCreditAccounts = useMemo(() => 
        chartOfAccounts.filter(acc => 
            acc.accountName.toLowerCase().includes(searchCredit.toLowerCase()) ||
            acc.accountCode.includes(searchCredit)
        ), [searchCredit, chartOfAccounts]
    );

    const handleFilter = (e) => {
        if(e) e.preventDefault();
        router.get(route('admin.accounting.petty.index'), { month, year }, { preserveState: true });
    };

    const handlePostJournal = () => {
        if(!debitAccount || !creditAccount) {
            toast.error("Please select both Debit and Credit accounts");
            return;
        }
        router.post(route('admin.accounting.petty.journalize'), {
            petty_cash_id: selectedRecord.id,
            debitAccount: debitAccount.accountCode,
            creditAccount: creditAccount.accountCode
        }, {
            onSuccess: () => {
                setShowJournalModal(false);
                setDebitAccount(null);
                setCreditAccount(null);
                setSearchDebit('');
                setSearchCredit('');
                toast.success("Journal Entry created successfully");
            }
        });
    };

    const handleBatchPrint = (count) => {
        if (selectedVouchers.length === 0) return;
        const ids = selectedVouchers.join(',');
        window.open(route('admin.accounting.petty.print', { ids, perPage: count }));
    };

    const toggleSelect = (id) => {
        setSelectedVouchers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const startEditing = (record) => {
        setEditingId(record.id);
        setEditForm({ ...record });
    };

    const handleSaveEdit = () => {
        router.put(route('admin.accounting.petty.update', editingId), editForm, {
            onSuccess: () => {
                setEditingId(null);
                toast.success("Log updated successfully");
            }
        });
    };

    const handleCellChange = (id, field, value) => {
        setRows(rows.map(row => {
            if (row.id === id) {
                const newRow = { ...row, [field]: value };
                if (field === 'debit' && value !== '') newRow.credit = '';
                if (field === 'credit' && value !== '') newRow.debit = '';
                return newRow;
            }
            return row;
        }));
    };

    const handleAddRow = () => {
        setRows([...rows, { ...emptyRow, id: Date.now() + Math.random() }]);
    };

    const removeRow = (id) => {
        if (rows.length > 1) setRows(rows.filter(r => r.id !== id));
    };

    const submitBulkEntry = (e) => {
        e.preventDefault();
        setIsSaving(true);
        router.post(route('admin.accounting.petty.bulk-store'), { entries: rows }, {
            onSuccess: () => {
                setShowModal(false);
                setRows([{ ...emptyRow }]);
                setIsSaving(false);
                toast.success("Petty cash synchronized");
            },
            onError: () => setIsSaving(false)
        });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
    let runningBalance = beginningBalance;

    return (
        <AdminSidebarLayout>
            <Head title="Petty Cash Fund">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <div className="w-full max-w-[110rem] mx-auto space-y-4 md:space-y-6 px-2 sm:px-4">
                <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-10 shadow-2xl border border-white/5">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                        <div className="space-y-2 w-full xl:w-auto">
                            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                                Petty Cash <span className="text-emerald-400">Fund</span>
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                                <span className="flex items-center gap-2 font-mono"><Wallet2 size={14} className="text-emerald-400"/> {filters.branch} Branch</span>
                                <span className="flex items-center gap-2"><CalendarDays size={14} className="text-emerald-400"/> {filters.monthName} {year}</span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                            <div className="flex bg-white/5 backdrop-blur-md p-1 rounded-xl border border-white/10 w-full sm:w-auto">
                                <select value={month} onChange={e => setMonth(e.target.value)} className="bg-transparent border-0 text-white font-bold text-sm focus:ring-0 cursor-pointer flex-1 px-4">
                                    {months.map(m => (<option key={m.value} value={m.value} className="text-slate-900">{m.label}</option>))}
                                </select>
                                <button onClick={handleFilter} className="p-2 bg-emerald-500 text-slate-900 rounded-lg hover:bg-emerald-400 transition-all m-1"><ChevronRight size={18} /></button>
                            </div>
                            <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-950 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all w-full sm:w-auto">
                                <TableProperties size={18} /> Batch Entry
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 md:mt-8">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 inline-block w-full sm:w-auto text-center sm:text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mb-1">Beginning Balance</p>
                            <h3 className="text-lg md:text-xl font-black text-white font-mono">{formatCurrency(beginningBalance)}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden mb-20">
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                                    <th className="px-4 py-5 w-10">
                                        <input type="checkbox" className="rounded border-slate-300" onChange={(e) => {
                                                if(e.target.checked) setSelectedVouchers(records.filter(r => r.is_posted).map(r => r.id));
                                                else setSelectedVouchers([]);
                                            }} 
                                        />
                                    </th>
                                    <th className="px-8 py-5">OR#</th>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5">Particulars</th>
                                    <th className="px-8 py-5 text-right">Disburse (Debit)</th>
                                    <th className="px-8 py-5 text-right">Replenish (Credit)</th>
                                    <th className="px-8 py-5 text-right bg-emerald-400/5 font-black">Balance</th>
                                    <th className="px-8 py-5 w-24 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5 font-medium">
                                {records.map(record => {
                                    runningBalance = runningBalance + parseFloat(record.credit) - parseFloat(record.debit);
                                    const isEditing = editingId === record.id;
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-emerald-400/5 transition-colors group">
                                            <td className="px-4 py-5 text-center">
                                                {record.is_posted && (<input type="checkbox" className="rounded border-slate-300 text-emerald-500" checked={selectedVouchers.includes(record.id)} onChange={() => toggleSelect(record.id)} />)}
                                            </td>
                                            <td className="px-8 py-5 font-mono text-[10px] font-black text-emerald-600">
                                                {isEditing ? <input type="text" value={editForm.or_number} onChange={e => setEditForm({...editForm, or_number: e.target.value})} className="bg-transparent border-0 p-0 font-mono text-[10px] w-full focus:ring-0" /> : (record.or_number || '—')}
                                            </td>
                                            <td className="px-8 py-5 text-xs text-slate-400">{record.transactionDate}</td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">{record.particulars}</td>
                                            <td className="px-8 py-5 text-right font-mono text-rose-500 font-bold">{record.debit > 0 ? formatCurrency(record.debit) : '—'}</td>
                                            <td className="px-8 py-5 text-right font-mono text-emerald-500 font-bold">{record.credit > 0 ? formatCurrency(record.credit) : '—'}</td>
                                            <td className="px-8 py-5 text-right font-mono font-black text-slate-900 dark:text-white bg-emerald-400/5">{formatCurrency(runningBalance)}</td>
                                            <td className="px-8 py-5 text-center flex justify-center gap-2">
                                                <button disabled={record.is_posted} onClick={() => { setSelectedRecord(record); setShowJournalModal(true); }} 
                                                    className={`p-2 transition-all flex items-center gap-1 ${record.is_posted ? 'text-slate-200 opacity-20 cursor-not-allowed' : 'text-slate-300 hover:text-indigo-500'}`}
                                                    title={record.is_posted ? "Already Journalized" : "Create Journal Entry"}
                                                >
                                                    <FileDigit size={16} /> <span className="text-[10px] font-black">{record.is_posted ? '01' : '01'}</span>
                                                </button>
                                                {record.is_posted ? (
                                                    <button onClick={() => window.open(route('admin.accounting.petty.print', { ids: record.id, perPage: 1 }))} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"><Printer size={16} /></button>
                                                ) : (
                                                    <div className="p-2 text-white/10 flex items-center gap-1 cursor-help" title="Journalize to enable printing"><Printer size={16} /><span className="text-[10px] font-black">0</span></div>
                                                )}
                                                {isEditing ? (<button onClick={handleSaveEdit} className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg"><Check size={14}/></button>) : (
                                                    !record.is_posted && (<button onClick={() => startEditing(record)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-500 transition-all"><Edit2 size={14}/></button>)
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedVouchers.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-[150]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-lg text-slate-900"><Printer size={18}/></div>
                        <span className="font-bold text-sm">{selectedVouchers.length} Vouchers Selected</span>
                    </div>
                    <div className="h-8 w-px bg-white/10 mx-2"></div>
                    <div className="flex gap-2">
                        <button onClick={() => handleBatchPrint(3)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase transition-all">3 Per Page</button>
                        <button onClick={() => handleBatchPrint(4)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase transition-all">4 Per Page</button>
                    </div>
                    <button onClick={() => setSelectedVouchers([])} className="ml-4 p-2 text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                </div>
            )}

            {showJournalModal && (
                <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/10 overflow-visible text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3"><div className="p-3 bg-indigo-500 rounded-2xl text-white"><FileDigit size={24}/></div><h2 className="text-2xl font-black text-black dark:text-white">Create Journal Entry</h2></div>
                            <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                        </div>
                        <p className="text-sm text-slate-500 mb-8 italic">Preparing for: <strong className="text-black dark:text-white">{selectedRecord?.particulars}</strong></p>
                        <div className="space-y-6">
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase text-emerald-500 mb-2 block tracking-widest">Debit (+ Expense)</label>
                                <div className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex justify-between items-center cursor-pointer" onClick={() => setOpenDropdown(openDropdown === 'debit' ? null : 'debit')}>
                                    <span className="font-bold text-sm text-black dark:text-white">{debitAccount ? `${debitAccount.accountCode} - ${debitAccount.accountName}` : 'Select Account...'}</span><ChevronDown size={18} className="text-slate-400" />
                                </div>
                                {openDropdown === 'debit' && (
                                    <div className="absolute z-[120] left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                        <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-white/5">
                                            <Search size={14} className="text-slate-400" /><input autoFocus placeholder="Search..." className="bg-transparent border-0 text-white text-xs w-full focus:ring-0" value={searchDebit} onChange={e => setSearchDebit(e.target.value)} />
                                        </div>
                                        <div className="max-h-48 overflow-auto py-2">
                                            {filteredDebitAccounts.map(acc => (<div key={acc.id} onClick={() => { setDebitAccount(acc); setOpenDropdown(null); setSearchDebit(''); }} className="px-4 py-3 text-xs font-bold hover:bg-emerald-500 text-white cursor-pointer">{acc.accountCode} - {acc.accountName}</div>))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase text-rose-500 mb-2 block tracking-widest">Credit (- Asset)</label>
                                <div className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex justify-between items-center cursor-pointer" onClick={() => setOpenDropdown(openDropdown === 'credit' ? null : 'credit')}>
                                    <span className="font-bold text-sm text-black dark:text-white">{creditAccount ? `${creditAccount.accountCode} - ${creditAccount.accountName}` : 'Select Account...'}</span><ChevronDown size={18} className="text-slate-400" />
                                </div>
                                {openDropdown === 'credit' && (
                                    <div className="absolute z-[120] left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                        <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-white/5">
                                            <Search size={14} className="text-slate-400" /><input autoFocus placeholder="Search..." className="bg-transparent border-0 text-white text-xs w-full focus:ring-0" value={searchCredit} onChange={e => setSearchCredit(e.target.value)} />
                                        </div>
                                        <div className="max-h-48 overflow-auto py-2">
                                            {filteredCreditAccounts.map(acc => (<div key={acc.id} onClick={() => { setCreditAccount(acc); setOpenDropdown(null); setSearchCredit(''); }} className="px-4 py-3 text-xs font-bold hover:bg-rose-500 text-white cursor-pointer">{acc.accountCode} - {acc.accountName}</div>))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setShowJournalModal(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-300">Cancel</button>
                                <button onClick={handlePostJournal} disabled={!debitAccount || !creditAccount} className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm disabled:opacity-30">Post Entry</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col">
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-slate-900 shadow-xl">
                        <div className="flex items-center gap-3 text-white"><ReceiptText size={20} className="text-emerald-400"/> <h2 className="font-black text-xl tracking-tight">Batch OR Entry</h2></div>
                        <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><X size={24}/></button>
                    </div>
                    <div className="flex-1 overflow-auto p-8 space-y-3">
                        {rows.map((row, idx) => (
                            <div key={row.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/[0.08] transition-all group">
                                <span className="text-white/20 font-black w-6">{idx + 1}</span>
                                <input type="date" value={row.transactionDate} onChange={e => handleCellChange(row.id, 'transactionDate', e.target.value)} className="bg-transparent border-0 text-white text-xs focus:ring-0 p-0" />
                                <input type="text" placeholder="OR#" value={row.or_number} onChange={e => handleCellChange(row.id, 'or_number', e.target.value.toUpperCase())} className="bg-transparent border-0 text-emerald-400 font-mono text-xs w-24 focus:ring-0 p-0" />
                                <input type="text" placeholder="PARTICULARS" value={row.particulars} onChange={e => handleCellChange(row.id, 'particulars', e.target.value)} className="flex-1 bg-transparent border-0 text-white text-xs focus:ring-0 p-0" />
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Debit" value={row.debit} onChange={e => handleCellChange(row.id, 'debit', e.target.value)} className="w-28 bg-rose-500/10 rounded-xl text-rose-400 text-right text-xs border-0 focus:ring-rose-500" />
                                    <input type="number" placeholder="Credit" value={row.credit} onChange={e => handleCellChange(row.id, 'credit', e.target.value)} className="w-28 bg-emerald-500/10 rounded-xl text-emerald-400 text-right text-xs border-0 focus:ring-emerald-500" />
                                    <button onClick={() => removeRow(row.id)} className="p-2 text-rose-500/40 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                        <button onClick={handleAddRow} className="w-full py-6 border-2 border-dashed border-white/5 text-white/20 font-black text-xs hover:border-emerald-500/50 hover:text-emerald-500 transition-all uppercase tracking-widest">+ Add New Entry Line</button>
                    </div>
                    <div className="p-8 border-t border-white/5 bg-slate-900 flex justify-center">
                        <button onClick={submitBulkEntry} disabled={isSaving} className="w-full max-w-md py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest">
                            {isSaving ? 'Synchronizing...' : 'Post Petty Cash Log'}
                        </button>
                    </div>
                </div>
            )}
        </AdminSidebarLayout>
    );
}