import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Landmark, Plus, X, TableProperties, Trash2, CalendarDays, ReceiptText, ArrowUpRight, ArrowDownLeft, Edit2, Check, BookOpen, PlusCircle, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BankRecords({ records, currentBank, chartOfAccounts, beginningBalance, endingBalance, filters }) {
    const [date, setDate] = useState(filters.date);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const emptyRow = { id: Date.now(), transaction_date: filters.date, reference_no: '', particulars: '', debit: '', credit: '' };
    const [rows, setRows] = useState([{ ...emptyRow }]);

    const [recordToJournalize, setRecordToJournalize] = useState(null);
    const emptySplit = { accountCode: '', accountName: '', debit: 0, credit: 0 };
    const [journalEntries, setJournalEntries] = useState([{ ...emptySplit }, { ...emptySplit }]);
    const [openDropdown, setOpenDropdown] = useState(null); 
    const [accountSearch, setAccountSearch] = useState("");

    const handleJournalEntryChange = (index, field, value) => {
        setJournalEntries((prevEntries) => 
            prevEntries.map((entry, i) => 
                i === index ? { ...entry, [field]: value } : entry
            )
        );
    };
    
    const formatCurrency = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return '₱0.00';
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num);
    };

    const filteredAccounts = useMemo(() => 
        (chartOfAccounts || []).filter(acc => 
            acc.accountName.toLowerCase().includes(accountSearch.toLowerCase()) || acc.accountCode.includes(accountSearch)
        ), [accountSearch, chartOfAccounts]
    );

    const handleFilterChange = (e) => {
        const newDate = e.target.value;
        setDate(newDate);
        router.get(route('admin.accounting.bank.index'), { date: newDate }, { preserveState: true });
    };

    const addRow = () => setRows([...rows, { ...emptyRow, id: Date.now() }]);
    const removeRow = (id) => setRows(rows.filter(r => r.id !== id));
    const handleCellChange = (id, field, value) => setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));

    const submitBulkEntry = () => {
        setIsSaving(true);
        const formattedRows = rows.map(r => ({
            transactionDate: r.transaction_date, referenceNo: r.reference_no, particulars: r.particulars, debit: r.debit, credit: r.credit
        }));
        router.post(route('admin.accounting.bank.storeBulk'), { accountCode: filters.accountCode, entries: formattedRows }, {
            onSuccess: () => { setShowModal(false); setRows([{ ...emptyRow, id: Date.now() }]); toast.success('Bank records synchronized!'); setIsSaving(false); },
            onError: () => setIsSaving(false)
        });
    };

    const handleSaveEdit = () => {
        router.put(route('admin.accounting.bank.update', editingId), editForm, { onSuccess: () => { setEditingId(null); toast.success("Record updated"); }});
    };

    const handleOpenJournal = (record) => {
        setRecordToJournalize(record);
        if (record.ledger_entries && record.ledger_entries.length > 0) {
            setJournalEntries(record.ledger_entries.map(le => ({ 
                accountCode: le.accountCode, 
                accountName: le.accountName, 
                debit: le.debit, 
                credit: le.credit 
            })));
        } else {
            setJournalEntries([{...emptySplit}, {...emptySplit}]);
        }
    };

    const submitJournal = () => {
        setIsSaving(true);
        
        const totalUserDebit = journalEntries.reduce((sum, entry) => sum + (parseFloat(entry.debit) || 0), 0);
        const totalUserCredit = journalEntries.reduce((sum, entry) => sum + (parseFloat(entry.credit) || 0), 0);

        if (totalUserDebit.toFixed(2) !== totalUserCredit.toFixed(2)) {
            toast.error(`Not Balanced! Total DR: ₱${totalUserDebit.toFixed(2)} | Total CR: ₱${totalUserCredit.toFixed(2)}`);
            setIsSaving(false);
            return;
        }

        const endpoint = recordToJournalize.is_posted
            ? route('admin.accounting.bank.update-journal', recordToJournalize.id)
            : route('admin.accounting.bank.journalize', recordToJournalize.id);

        toast.promise(
            axios.post(endpoint, { entries: journalEntries }),
            {
                loading: recordToJournalize.is_posted ? 'Updating General Ledger...' : 'Posting to General Ledger...',
                success: () => {
                    setShowModal(false);
                    setRecordToJournalize(null);
                    router.reload();
                    return recordToJournalize.is_posted ? 'Journal updated successfully!' : 'Journalized successfully!';
                },
                error: (err) => {
                    return err.response?.data?.error || 'Failed to post journal entries.';
                }
            }
        ).finally(() => {
            setIsSaving(false);
        });
    };

    let runningBalance = Number(beginningBalance) || 0;

    return (
        <AdminSidebarLayout>
            <Head title="Bank Account Ledger" />
            <div className="w-full max-w-[110rem] mx-auto space-y-6 px-4 pb-28">
                
                <div className="bg-slate-900 rounded-[2rem] p-6 lg:p-8 shadow-2xl border border-white/5">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="space-y-2">
                            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight uppercase">Bank <span className="text-emerald-400">Ledger</span></h1>
                            <div className="flex bg-emerald-500/10 py-1.5 px-4 rounded-full border border-emerald-500/20 items-center gap-3">
                                <Landmark size={14} className="text-emerald-400"/>
                                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.1em]">Ledger: <span className="text-white ml-2">{currentBank?.accountName} ({currentBank?.accountCode})</span></p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
                            <div className="flex bg-white/5 backdrop-blur-md p-2 rounded-xl border border-white/10 items-center gap-2 px-4 w-full sm:w-auto h-[52px]">
                                <CalendarDays size={18} className="text-emerald-400 shrink-0"/>
                                <input type="date" value={date} onChange={handleFilterChange} className="bg-transparent border-0 text-white font-bold text-sm focus:ring-0 w-full cursor-pointer" />
                            </div>
                            <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 px-8 h-[52px] bg-white text-slate-950 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all w-full sm:w-auto uppercase">
                                <Plus size={18} /> Add Records
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-sm">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Beginning Balance</p>
                        <p className="text-2xl font-black text-white font-mono mt-1">{formatCurrency(beginningBalance)}</p>
                    </div>
                    <div className="bg-slate-900 border border-emerald-500/20 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><ReceiptText size={48}/></div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest relative z-10">Ending Balance</p>
                        <p className="text-2xl font-black text-emerald-400 font-mono mt-1 relative z-10">{formatCurrency(endingBalance)}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-[2rem] border border-white/5 shadow-sm overflow-hidden mb-20 overflow-x-auto">
                    <table className="w-full text-left text-white min-w-[900px]">
                        <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-white/5">
                            <tr>
                                <th className="px-6 py-5">Date</th>
                                <th className="px-6 py-5">Ref. Number</th>
                                <th className="px-6 py-5">Particulars</th>
                                <th className="px-6 py-5 text-right">DR</th>
                                <th className="px-6 py-5 text-right">CR</th>
                                <th className="px-6 py-5 text-right bg-emerald-400/5 text-emerald-500">Balance</th>
                                <th className="px-6 py-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium">
                            {records.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-slate-500 text-sm italic uppercase tracking-widest">No branch bank records found for this day.</td></tr>}
                            {records.map(record => {
                                runningBalance = runningBalance + (Number(record.credit) || 0) - (Number(record.debit) || 0);
                                const isEditing = editingId === record.id;
                                
                                return (
                                    <tr key={record.id} className="hover:bg-emerald-400/5 transition-colors group text-white text-sm">
                                        <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                                            {isEditing ? <input type="date" value={editForm.transaction_date} onChange={e => setEditForm({...editForm, transaction_date: e.target.value})} className="bg-slate-900 border-emerald-500/50 rounded p-1" /> : new Date(record.transaction_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[10px] font-black text-indigo-400 uppercase">
                                            {isEditing ? <input type="text" value={editForm.reference_no || ''} onChange={e => setEditForm({...editForm, reference_no: e.target.value})} className="bg-slate-900 border-emerald-500/50 rounded w-full p-1" /> : (record.reference_no || '—')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-200 min-w-[200px]">
                                            {isEditing ? <input type="text" value={editForm.particulars} onChange={e => setEditForm({...editForm, particulars: e.target.value})} className="bg-slate-900 border-emerald-500/50 rounded w-full p-1" /> : record.particulars}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-rose-400 font-bold whitespace-nowrap">{record.debit > 0 ? formatCurrency(record.debit) : '—'}</td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">{record.credit > 0 ? formatCurrency(record.credit) : '—'}</td>
                                        <td className="px-6 py-4 text-right font-mono font-black text-white bg-emerald-400/5 whitespace-nowrap">{formatCurrency(runningBalance)}</td>

                                        <td className="px-6 py-4 text-center flex justify-center gap-3 items-center">
                                            {isEditing ? (
                                                <button onClick={handleSaveEdit} className="text-emerald-500 hover:text-emerald-400" title="Save"><Check size={18}/></button>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleOpenJournal(record)} className={record.is_posted ? "text-emerald-500" : "text-amber-500"} title={record.is_posted ? "Edit Journal" : "Create Journal"}><BookOpen size={18}/></button>
                                                    <button onClick={() => { setEditingId(record.id); setEditForm({...record}); }} className="text-slate-400 hover:text-indigo-400" title="Edit"><Edit2 size={18}/></button>
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

            {/* SYNC MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-[2rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-white/5"><h2 className="text-xl font-black text-white uppercase"><TableProperties className="inline mr-2 text-emerald-400"/> Synced Log</h2><button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X size={24}/></button></div>
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {rows.map((row) => (
                                <div key={row.id} className="bg-white/5 p-4 rounded-2xl relative border border-white/5 flex flex-col lg:flex-row gap-4 items-end">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                        <div><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Date</label><input type="date" value={row.transaction_date} onChange={e => handleCellChange(row.id, 'transaction_date', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-xs text-white"/></div>
                                        <div><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Ref. No.</label><input type="text" value={row.reference_no} onChange={e => handleCellChange(row.id, 'reference_no', e.target.value.toUpperCase())} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-xs uppercase text-white"/></div>
                                        <div><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Particulars</label><input type="text" value={row.particulars} onChange={e => handleCellChange(row.id, 'particulars', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-xs text-white"/></div>
                                    </div>
                                    <div className="flex gap-4 w-full lg:w-auto items-center">
                                        <div className="relative group flex-1"><ArrowUpRight size={14} className="absolute left-3 top-3 text-rose-500"/><input type="number" placeholder="DR" value={row.debit} onChange={(e) => handleCellChange(row.id, 'debit', e.target.value)} className="w-full lg:w-28 bg-rose-500/10 border-0 rounded-xl text-rose-400 font-black text-right text-xs py-2 pr-2 pl-8" /></div>
                                        <div className="relative group flex-1"><ArrowDownLeft size={14} className="absolute left-3 top-3 text-emerald-500"/><input type="number" placeholder="CR" value={row.credit} onChange={(e) => handleCellChange(row.id, 'credit', e.target.value)} className="w-full lg:w-28 bg-emerald-500/10 border-0 rounded-xl text-emerald-400 font-black text-right text-xs py-2 pr-2 pl-8" /></div>
                                        <button onClick={() => removeRow(row.id)} className="p-2 text-rose-500/40 hover:text-rose-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addRow} className="w-full py-4 rounded-2xl border-2 border-dashed border-white/5 text-white/20 font-black text-[10px] uppercase tracking-[0.2em] hover:text-emerald-500 transition-all">+ Add Row</button>
                        </div>
                        <div className="p-4 md:p-8 border-t border-white/5 flex justify-center"><button onClick={submitBulkEntry} disabled={isSaving} className="w-full md:w-80 py-4 bg-emerald-500 text-slate-950 font-black rounded-xl uppercase">{isSaving ? 'Processing...' : 'Sync to Ledger'}</button></div>
                    </div>
                </div>
            )}

            {/* JOURNALIZE MODAL */}
            {recordToJournalize && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col p-4 md:p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3 text-white"><BookOpen size={24} className={recordToJournalize.is_posted ? "text-emerald-400" : "text-amber-400"}/> <h2 className="font-black text-xl md:text-2xl tracking-tight uppercase">Journal Entry</h2></div>
                        <button onClick={() => setRecordToJournalize(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white"><X size={24}/></button>
                    </div>

                    <div className="max-w-5xl mx-auto w-full flex-1 overflow-y-auto space-y-6 pb-20">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div><p className="text-xs text-slate-400 mb-1">{new Date(recordToJournalize.transaction_date).toLocaleDateString()} | {recordToJournalize.reference_no}</p><p className="text-lg font-bold">{recordToJournalize.particulars}</p></div>
                            <div className="md:text-right"><p className="text-[10px] uppercase font-black text-slate-500">Base Accounting Entry</p>
                                <div className="flex gap-4 mt-1">
                                    <span className="text-emerald-400 font-mono font-bold text-sm">DR: {formatCurrency(recordToJournalize.credit || 0)}</span>
                                    <span className="text-rose-400 font-mono font-bold text-sm">CR: {formatCurrency(recordToJournalize.debit || 0)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-4 md:p-8 space-y-4 text-white">
                            <div className="flex justify-between items-center px-2"><h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Offsetting Accounts</h3><button onClick={() => setJournalEntries([...journalEntries, {...emptySplit}])} className="text-emerald-400 flex items-center gap-2 text-[10px] font-black uppercase"><PlusCircle size={14}/> Add</button></div>
                            {journalEntries.map((entry, eIdx) => (
                                <div key={eIdx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                    <div className="md:col-span-6 relative">
                                        <div className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 flex justify-between items-center cursor-pointer" onClick={() => setOpenDropdown(openDropdown === eIdx ? null : eIdx)}><span className="font-bold text-xs">{entry.accountCode ? `${entry.accountCode} - ${entry.accountName}` : 'Select Account...'}</span><ChevronDown size={16} className="text-slate-400" /></div>
                                        {openDropdown === eIdx && (
                                            <div className="absolute z-[120] left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                                <div className="p-3 border-b border-white/5 flex items-center gap-2"><Search size={14} className="text-slate-400" /><input autoFocus placeholder="Search..." className="bg-transparent border-0 text-white text-xs w-full focus:ring-0" value={accountSearch} onChange={e => setAccountSearch(e.target.value)} /></div>
                                                <div className="max-h-48 overflow-auto py-2">
                                                    {filteredAccounts.map(acc => (<div key={acc.accountCode} onClick={() => { handleJournalEntryChange(eIdx, 'accountCode', acc.accountCode); handleJournalEntryChange(eIdx, 'accountName', acc.accountName); setOpenDropdown(null); setAccountSearch(''); }} className="px-4 py-3 text-xs font-bold hover:bg-emerald-500 cursor-pointer">{acc.accountCode} - {acc.accountName}</div>))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2"><input type="number" placeholder="Debit" value={entry.debit || ''} className="w-full bg-emerald-500/10 border-0 rounded-xl text-emerald-400 text-right text-xs" onChange={e => handleJournalEntryChange(eIdx, 'debit', e.target.value)}/></div>
                                    <div className="md:col-span-2"><input type="number" placeholder="Credit" value={entry.credit || ''} className="w-full bg-rose-500/10 border-0 rounded-xl text-rose-400 text-right text-xs" onChange={e => handleJournalEntryChange(eIdx, 'credit', e.target.value)}/></div>
                                    <div className="md:col-span-2 flex justify-end"><button onClick={() => setJournalEntries(journalEntries.filter((_, i) => i !== eIdx))} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button></div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4"><button onClick={submitJournal} disabled={isSaving} className="w-full md:w-auto px-16 py-5 bg-amber-500 text-amber-950 font-black rounded-2xl uppercase tracking-widest">{isSaving ? 'Processing...' : 'Post to General Ledger'}</button></div>
                    </div>
                </div>
            )}
        </AdminSidebarLayout>
    );
}