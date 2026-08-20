import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { 
    X, Trash2, CalendarDays, Edit2, Smartphone, 
    PlusCircle, Search, ChevronDown, Check, Plus, BookOpen, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EWallet({ records, chartOfAccounts, beginningBalance, endingBalance, filters }) {
    const [date, setDate] = useState(filters.date);
    
    // UI States
    const [showLogModal, setShowLogModal] = useState(false);
    const [recordToJournalize, setRecordToJournalize] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Initial Log Phase (Supports Multiple)
    const emptyLog = { id: Date.now(), transactionDate: filters.date, referenceNo: '', particulars: '', walletType: 'GCash', amountType: 'credit', amount: '' };
    const [logs, setLogs] = useState([{ ...emptyLog }]);

    // Journal Phase
    const emptySplit = { accountCode: '', accountName: '', debit: 0, credit: 0 };
    const [journalEntries, setJournalEntries] = useState([{ ...emptySplit }, { ...emptySplit }]);
    const [openDropdown, setOpenDropdown] = useState(null); 
    const [accountSearch, setAccountSearch] = useState("");

    const filteredAccounts = useMemo(() => 
        chartOfAccounts.filter(acc => 
            acc.accountName.toLowerCase().includes(accountSearch.toLowerCase()) ||
            acc.accountCode.includes(accountSearch)
        ), [accountSearch, chartOfAccounts]
    );

    const handleFilterChange = (e) => {
        const newDate = e.target.value;
        setDate(newDate);
        router.get(route('admin.accounting.ewallet.index'), { date: newDate }, { preserveState: true });
    };

    // Phase 1: Submit Multiple Logs
    const submitLogs = (e) => {
        e.preventDefault();
        const payload = logs.map(log => ({
            transactionDate: log.transactionDate,
            referenceNo: log.referenceNo,
            particulars: log.particulars,
            walletType: log.walletType,
            debit: log.amountType === 'debit' ? parseFloat(log.amount || 0) : 0,
            credit: log.amountType === 'credit' ? parseFloat(log.amount || 0) : 0,
        }));

        setIsSaving(true);
        router.post(route('admin.accounting.ewallet.store-log'), { transactions: payload }, {
            onSuccess: () => {
                setShowLogModal(false);
                setLogs([{...emptyLog, id: Date.now()}]);
                toast.success("Transactions Logged successfully.");
                setIsSaving(false);
            },
            onError: () => setIsSaving(false)
        });
    };

    // Phase 2: Save Journal Entry
    const submitJournal = () => {
        const d = journalEntries.reduce((sum, e) => sum + parseFloat(e.debit || 0), 0);
        const c = journalEntries.reduce((sum, e) => sum + parseFloat(e.credit || 0), 0);
        
        if (Math.abs(d - c) > 0.01 || (d === 0 && c === 0)) {
            toast.error("Total Debits must equal Total Credits.");
            return;
        }

        setIsSaving(true);
        router.post(route('admin.accounting.ewallet.journalize', recordToJournalize.id), { entries: journalEntries }, {
            onSuccess: () => {
                setRecordToJournalize(null);
                setJournalEntries([{...emptySplit}, {...emptySplit}]);
                toast.success("Journal Entry created!");
                setIsSaving(false);
            },
            onError: () => setIsSaving(false)
        });
    };

    const handleSaveEdit = () => {
        router.put(route('admin.accounting.ewallet.update', editingId), editForm, {
            onSuccess: () => { setEditingId(null); toast.success("Record updated"); }
        });
    };

    const handleLogChange = (id, field, value) => {
        setLogs(logs.map(log => log.id === id ? { ...log, [field]: value } : log));
    };

    const handleJournalEntryChange = (idx, field, value) => {
        const newEntries = [...journalEntries];
        newEntries[idx][field] = value;
        setJournalEntries(newEntries);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
    let runningBalance = beginningBalance;

    return (
        <AdminSidebarLayout>
            <Head title="E-Wallet Daily Log" />
            <div className="w-full max-w-[110rem] mx-auto space-y-6 px-4 pb-28">
                
                {/* --- HEADER --- */}
                <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl border border-white/5">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase">E-Wallet <span className="text-emerald-400">Daily</span></h1>
                            <div className="flex items-center gap-3 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                <span className="flex items-center gap-2 font-mono"><Smartphone size={14} className="text-emerald-400"/> {filters.branch}</span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                            {/* DATE PICKER */}
                            <div className="flex bg-white/5 backdrop-blur-md p-2 rounded-xl border border-white/10 items-center gap-2 px-4">
                                <CalendarDays size={18} className="text-emerald-400"/>
                                <input type="date" value={date} onChange={handleFilterChange} className="bg-transparent border-0 text-white font-bold text-sm focus:ring-0 cursor-pointer" />
                            </div>
                            <button onClick={() => setShowLogModal(true)} className="flex items-center gap-2 px-8 py-3 bg-white text-slate-950 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all">
                                <Plus size={18} /> New Transaction
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- BALANCE CARDS --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-sm">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Beginning Balance</p>
                        <p className="text-2xl font-black text-white font-mono mt-1">{formatCurrency(beginningBalance)}</p>
                    </div>
                    <div className="bg-slate-900 border border-emerald-500/20 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><Smartphone size={48}/></div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest relative z-10">Ending Balance</p>
                        <p className="text-2xl font-black text-emerald-400 font-mono mt-1 relative z-10">{formatCurrency(endingBalance)}</p>
                    </div>
                </div>

                {/* --- TABLE SECTION (Fully Responsive) --- */}
                <div className="bg-white dark:bg-slate-950 rounded-[2rem] border border-white/5 shadow-sm overflow-hidden mb-20 overflow-x-auto">
                    <table className="w-full text-left text-white min-w-[900px]">
                        <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-white/5">
                            <tr>
                                <th className="px-6 py-5">Date</th>
                                <th className="px-6 py-5">Reference</th>
                                <th className="px-6 py-5">Particulars</th>
                                <th className="px-6 py-5">Wallet</th>
                                <th className="px-6 py-5 text-right">DR</th>
                                <th className="px-6 py-5 text-right">CR</th>
                                <th className="px-6 py-5 text-right bg-emerald-400/5 text-emerald-500">Balance</th>
                                <th className="px-6 py-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium">
                            {records.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-slate-500 text-sm">No transactions for this day.</td></tr>}
                            {records.map(record => {
                                runningBalance = runningBalance + parseFloat(record.credit) - parseFloat(record.debit);
                                const isEditing = editingId === record.id;
                                
                                return (
                                    <tr key={record.id} className="hover:bg-emerald-400/5 transition-colors group text-white text-sm">
                                        <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                                            {isEditing ? <input type="date" value={editForm.transactionDate} onChange={e => setEditForm({...editForm, transactionDate: e.target.value})} className="bg-slate-900 border-emerald-500/50 rounded p-1" /> : record.transactionDate}
                                        </td>

                                        <td className="px-6 py-4 font-mono text-[10px] font-black text-indigo-400 uppercase">
                                            {isEditing ? <input type="text" value={editForm.referenceNo || ''} onChange={e => setEditForm({...editForm, referenceNo: e.target.value})} className="bg-slate-900 border-emerald-500/50 rounded w-full p-1" /> : (record.referenceNo || '—')}
                                        </td>

                                        <td className="px-6 py-4 font-bold text-slate-200 min-w-[200px]">
                                            {isEditing ? <input type="text" value={editForm.particulars} onChange={e => setEditForm({...editForm, particulars: e.target.value})} className="bg-slate-900 border-emerald-500/50 rounded w-full p-1" /> : record.particulars}
                                        </td>

                                        <td className="px-6 py-4">
                                            {isEditing ? (
                                                <select value={editForm.walletType} onChange={e => setEditForm({...editForm, walletType: e.target.value})} className="bg-slate-900 border-emerald-500/50 rounded p-1 text-xs">
                                                    <option value="GCash">GCash</option>
                                                    <option value="Maya">Maya</option>
                                                    <option value="Bank Transfer">Bank Transfer</option>
                                                </select>
                                            ) : (
                                                <span className="bg-white/10 px-2 py-1 rounded text-xs">{record.walletType}</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right font-mono text-rose-400 font-bold whitespace-nowrap">{record.debit > 0 ? formatCurrency(record.debit) : '—'}</td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">{record.credit > 0 ? formatCurrency(record.credit) : '—'}</td>
                                        <td className="px-6 py-4 text-right font-mono font-black text-white bg-emerald-400/5 whitespace-nowrap">{formatCurrency(runningBalance)}</td>

                                        {/* ICONS ONLY FOR ACTIONS */}
                                        <td className="px-6 py-4 text-center flex justify-center gap-3 items-center">
                                            {isEditing ? (
                                                <button onClick={handleSaveEdit} className="text-emerald-500 hover:text-emerald-400" title="Save"><Check size={18}/></button>
                                            ) : (
                                                <>
                                                    {record.journal_status === 'pending_review' ? (
                                                        <span className="text-amber-400/70" title="Pending central journal review"><BookOpen size={18}/></span>
                                                    ) : !record.is_posted ? (
                                                        <button onClick={() => setRecordToJournalize(record)} className="text-amber-500 hover:text-amber-400" title="Create Journal Entry">
                                                            <BookOpen size={18}/>
                                                        </button>
                                                    ) : (
                                                        <span className="text-emerald-500/50" title="Journalized"><CheckCircle2 size={18}/></span>
                                                    )}
                                                    <button onClick={() => { setEditingId(record.id); setEditForm({...record}); }} className="text-slate-400 hover:text-indigo-400" title="Edit">
                                                        <Edit2 size={18}/>
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MULTI-TRANSACTION INITIAL LOG MODAL --- */}
            {showLogModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2"><Smartphone className="text-emerald-400"/> New Transactions (Batch)</h2>
                            <button onClick={() => setShowLogModal(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {logs.map((log, idx) => (
                                <div key={log.id} className="bg-white/5 p-6 rounded-2xl relative border border-white/5 text-white">
                                    {logs.length > 1 && (
                                        <button onClick={() => setLogs(logs.filter(l => l.id !== log.id))} className="absolute top-4 right-4 text-rose-500 hover:text-rose-400"><Trash2 size={16}/></button>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pr-6">
                                        <div><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Date</label><input type="date" required value={log.transactionDate} onChange={e => handleLogChange(log.id, 'transactionDate', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm focus:ring-emerald-500"/></div>
                                        <div><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Particulars</label><input type="text" required placeholder="Description" value={log.particulars} onChange={e => handleLogChange(log.id, 'particulars', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm focus:ring-emerald-500"/></div>
                                        <div><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Reference No</label><input type="text" placeholder="Optional" value={log.referenceNo} onChange={e => handleLogChange(log.id, 'referenceNo', e.target.value.toUpperCase())} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm uppercase font-mono focus:ring-emerald-500"/></div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Wallet Type</label>
                                            <select value={log.walletType} onChange={e => handleLogChange(log.id, 'walletType', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm font-bold focus:ring-emerald-500">
                                                <option value="GCash">GCash</option>
                                                <option value="Maya">Maya</option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Amount</label><input type="number" required min="1" step="0.01" value={log.amount} onChange={e => handleLogChange(log.id, 'amount', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm font-bold text-right focus:ring-emerald-500"/></div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Type</label>
                                            <select value={log.amountType} onChange={e => handleLogChange(log.id, 'amountType', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm font-bold focus:ring-emerald-500">
                                                <option value="credit">CR</option>
                                                <option value="debit">DR</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={() => setLogs([...logs, { ...emptyLog, id: Date.now() }])} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-slate-400 font-bold text-xs hover:border-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
                                + Add Row
                            </button>
                        </div>
                        <div className="p-6 border-t border-white/5 shrink-0 flex justify-between items-center">
                            <span className="text-white font-bold">{logs.length} item(s)</span>
                            <button onClick={submitLogs} disabled={isSaving} className="px-8 py-3 bg-emerald-500 text-slate-950 font-black rounded-xl uppercase tracking-widest active:scale-95 transition-transform">
                                {isSaving ? 'Saving...' : 'Save Logs to Board'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PHASE 2 MODAL: JOURNALIZE ENTRY --- */}
            {recordToJournalize && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3 text-white"><BookOpen size={24} className="text-amber-400"/> <h2 className="font-black text-2xl tracking-tight uppercase">Create Journal Entry</h2></div>
                        <button onClick={() => setRecordToJournalize(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><X size={28}/></button>
                    </div>

                    <div className="max-w-5xl mx-auto w-full flex-1 overflow-y-auto space-y-6 pb-20">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 text-white flex justify-between items-center">
                            <div><p className="text-xs text-slate-400 mb-1">{recordToJournalize.transactionDate}</p><p className="text-lg font-bold">{recordToJournalize.particulars}</p></div>
                            <div className="text-right"><p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Amount to Distribute</p><p className="text-2xl font-mono font-black text-amber-400">{formatCurrency(recordToJournalize.debit > 0 ? recordToJournalize.debit : recordToJournalize.credit)}</p></div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-4 text-white">
                            <div className="flex justify-between items-center px-2">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Distributions</h3>
                                <button onClick={() => setJournalEntries([...journalEntries, {...emptySplit}])} className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2 text-[10px] font-black uppercase"><PlusCircle size={14}/> Add Account</button>
                            </div>
                            {journalEntries.map((entry, eIdx) => (
                                <div key={eIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                    <div className="sm:col-span-6 relative">
                                        <div className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 flex justify-between items-center cursor-pointer" onClick={() => setOpenDropdown(openDropdown === eIdx ? null : eIdx)}>
                                            <span className="font-bold text-xs">{entry.accountCode ? `${entry.accountCode} - ${entry.accountName}` : 'Select Account...'}</span>
                                            <ChevronDown size={16} className="text-slate-400" />
                                        </div>
                                        {openDropdown === eIdx && (
                                            <div className="absolute z-[120] left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                                <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-white/5"><Search size={14} className="text-slate-400" /><input autoFocus placeholder="Search..." className="bg-transparent border-0 text-white text-xs w-full focus:ring-0" value={accountSearch} onChange={e => setAccountSearch(e.target.value)} /></div>
                                                <div className="max-h-48 overflow-auto py-2">
                                                    {filteredAccounts.map(acc => (
                                                        <div key={acc.accountCode} onClick={() => { handleJournalEntryChange(eIdx, 'accountCode', acc.accountCode); handleJournalEntryChange(eIdx, 'accountName', acc.accountName); setOpenDropdown(null); setAccountSearch(''); }} className="px-4 py-3 text-xs font-bold hover:bg-emerald-500 cursor-pointer">
                                                            {acc.accountCode} - {acc.accountName}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="sm:col-span-2"><input type="number" placeholder="Debit" value={entry.debit || ''} className="w-full bg-rose-500/10 border-0 rounded-xl text-rose-400 text-right text-xs focus:ring-rose-500" onChange={e => handleJournalEntryChange(eIdx, 'debit', e.target.value)}/></div>
                                    <div className="sm:col-span-2"><input type="number" placeholder="Credit" value={entry.credit || ''} className="w-full bg-emerald-500/10 border-0 rounded-xl text-emerald-400 text-right text-xs focus:ring-emerald-500" onChange={e => handleJournalEntryChange(eIdx, 'credit', e.target.value)}/></div>
                                    <div className="sm:col-span-2 flex justify-end"><button onClick={() => setJournalEntries(journalEntries.filter((_, i) => i !== eIdx))} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button></div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={submitJournal} disabled={isSaving} className="px-16 py-5 bg-amber-500 text-amber-950 font-black rounded-2xl uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                                {isSaving ? 'Processing...' : 'Post to General Ledger'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminSidebarLayout>
    );
}
