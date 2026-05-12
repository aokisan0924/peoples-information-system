import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { BookOpen, Plus, X, Trash2, Search, ChevronDown, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GeneralJournal({ logs, chartOfAccounts, filters }) {
    const [month, setMonth] = useState(filters.month);
    const [year, setYear] = useState(filters.year);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [referenceNo, setReferenceNo] = useState(`ADJ-${Date.now().toString().slice(-6)}`);
    const [particulars, setParticulars] = useState('');
    
    const emptySplit = { id: Date.now(), accountCode: '', accountName: '', debit: '', credit: '' };
    const [entries, setEntries] = useState([{ ...emptySplit }, { ...emptySplit, id: Date.now() + 1 }]);
    const [openDropdown, setOpenDropdown] = useState(null); 
    const [accountSearch, setAccountSearch] = useState("");

    const formatCurrency = (val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num === 0) return '-';
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num);
    };

    const filteredAccounts = useMemo(() => 
        (chartOfAccounts || []).filter(acc => 
            acc.accountName.toLowerCase().includes(accountSearch.toLowerCase()) || acc.accountCode.includes(accountSearch)
        ), [accountSearch, chartOfAccounts]
    );

    const handleFilter = () => router.get(route('admin.accounting.journal.index'), { month, year }, { preserveState: true });

    const handleEntryChange = (idx, field, value) => {
        const newEntries = [...entries];
        newEntries[idx][field] = value;
        if (field === 'debit' && value !== '') newEntries[idx]['credit'] = '';
        if (field === 'credit' && value !== '') newEntries[idx]['debit'] = '';
        setEntries(newEntries);
    };

    const totalDebit = entries.reduce((sum, e) => sum + parseFloat(e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + parseFloat(e.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    const submitJournal = (e) => {
        e.preventDefault();
        if (!isBalanced) return toast.error("Debits must equal Credits to post.");

        setIsSaving(true);
        router.post(route('admin.accounting.journal.store'), { transactionDate, referenceNo, particulars, entries }, {
            onSuccess: () => {
                setShowModal(false); setParticulars(''); setReferenceNo(`ADJ-${Date.now().toString().slice(-6)}`);
                setEntries([{ ...emptySplit }, { ...emptySplit, id: Date.now() + 1 }]);
                toast.success("Adjustment Posted!"); setIsSaving(false);
            },
            onError: () => setIsSaving(false)
        });
    };

    return (
        <AdminSidebarLayout>
            <Head title="General Journal" />
            <div className="max-w-[100rem] mx-auto p-4 sm:p-6 space-y-6 pb-20">
                <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl flex justify-between items-center">
                    <h1 className="text-3xl font-black text-white flex gap-3 uppercase"><BookOpen className="text-amber-400" /> General Journal</h1>
                    <div className="flex gap-4">
                        <div className="flex bg-white/5 p-2 rounded-xl gap-2">
                            <select value={month} onChange={e => setMonth(e.target.value)} className="bg-slate-900 border-0 text-white font-bold text-sm focus:ring-0">
                                {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select value={year} onChange={e => setYear(e.target.value)} className="bg-slate-900 border-0 text-white font-bold text-sm focus:ring-0">
                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <button onClick={handleFilter} className="px-4 bg-amber-500 text-amber-950 font-bold rounded-lg text-xs">View</button>
                        </div>
                        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 bg-amber-500 text-amber-950 rounded-xl font-black text-sm"><Plus size={18} /> New Adjustment</button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-[2rem] border border-white/10 shadow-xl overflow-hidden">
                    <table className="w-full text-left text-sm min-w-[1000px] border-collapse">
                        <thead className="bg-slate-900/95 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <tr><th className="px-6 py-5">Date & Ref</th><th className="px-6 py-5 w-1/3">Particulars & Accounts</th><th className="px-6 py-5 text-right">Debit</th><th className="px-6 py-5 text-right">Credit</th><th className="px-6 py-5 text-center">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {logs.length === 0 && <tr><td colSpan="5" className="p-12 text-center text-slate-400 italic">No adjustments found.</td></tr>}
                            {logs.map((log) => (
                                <React.Fragment key={log.referenceNo}>
                                    <tr className="bg-amber-900/10">
                                        <td className="px-6 py-4"><div className="font-bold text-white">{new Date(log.transactionDate).toLocaleDateString()}</div><div className="font-mono text-xs text-amber-400">{log.referenceNo}</div></td>
                                        <td className="px-6 py-4 font-black uppercase text-white">{log.particulars}</td>
                                        <td></td><td></td><td className="text-center"><span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase">Posted</span></td>
                                    </tr>
                                    {log.entries.map((entry, idx) => (
                                        <tr key={idx} className="hover:bg-white/5">
                                            <td></td><td className="px-6 py-2"><span className={`font-mono text-xs ${entry.credit > 0 ? 'ml-8 text-slate-500' : 'text-slate-300 font-bold'}`}>{entry.accountCode} - {entry.accountName}</span></td>
                                            <td className="px-6 py-2 text-right font-mono text-slate-300">{formatCurrency(entry.debit)}</td>
                                            <td className="px-6 py-2 text-right font-mono text-slate-300">{formatCurrency(entry.credit)}</td><td></td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col p-6 overflow-hidden">
                    <div className="flex justify-between mb-8 text-white"><h2 className="font-black text-2xl uppercase">New Adjusting Entry</h2><button onClick={() => setShowModal(false)}><X size={24}/></button></div>
                    <div className="max-w-5xl mx-auto w-full flex-1 overflow-y-auto space-y-6 pb-20">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-xl grid grid-cols-3 gap-6">
                            <div><label className="text-[10px] font-black uppercase text-amber-400">Date</label><input type="date" required value={transactionDate} onChange={e => setTransactionDate(e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-2 text-sm text-white"/></div>
                            <div><label className="text-[10px] font-black uppercase text-amber-400">Ref No.</label><input type="text" required value={referenceNo} onChange={e => setReferenceNo(e.target.value.toUpperCase())} className="w-full bg-slate-800 border-0 rounded-xl mt-2 text-sm uppercase text-white"/></div>
                            <div><label className="text-[10px] font-black uppercase text-amber-400">Particulars</label><input type="text" required value={particulars} onChange={e => setParticulars(e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-2 text-sm text-white"/></div>
                        </div>

                        <div className="bg-white/5 rounded-[2rem] p-8 space-y-4 shadow-xl text-white">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase">Account Splits</h3>
                            {entries.map((entry, eIdx) => (
                                <div key={entry.id} className="grid grid-cols-12 gap-4 items-start bg-slate-900/80 p-4 rounded-2xl">
                                    <div className="col-span-6 relative">
                                        <div className="w-full bg-slate-800 rounded-xl p-3 flex justify-between cursor-pointer" onClick={() => setOpenDropdown(openDropdown === eIdx ? null : eIdx)}><span className="text-xs">{entry.accountCode ? `${entry.accountCode} - ${entry.accountName}` : 'Select Account...'}</span><ChevronDown size={16}/></div>
                                        {openDropdown === eIdx && (
                                            <div className="absolute z-[120] left-0 right-0 mt-2 bg-slate-800 rounded-2xl overflow-hidden">
                                                <div className="p-3 flex items-center gap-2"><Search size={14}/><input autoFocus placeholder="Search..." className="bg-transparent border-0 text-white text-xs w-full" value={accountSearch} onChange={e => setAccountSearch(e.target.value)} /></div>
                                                <div className="max-h-60 overflow-auto">
                                                    {filteredAccounts.map(acc => (<div key={acc.accountCode} onClick={() => { handleEntryChange(eIdx, 'accountCode', acc.accountCode); handleEntryChange(eIdx, 'accountName', acc.accountName); setOpenDropdown(null); setAccountSearch(''); }} className="px-4 py-3 text-xs hover:bg-amber-500 hover:text-slate-900 cursor-pointer">{acc.accountCode} - {acc.accountName}</div>))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2"><input type="number" placeholder="Debit" value={entry.debit} className="w-full bg-slate-800 rounded-xl text-right text-xs" onChange={e => handleEntryChange(eIdx, 'debit', e.target.value)}/></div>
                                    <div className="col-span-2"><input type="number" placeholder="Credit" value={entry.credit} className="w-full bg-slate-800 rounded-xl text-right text-xs" onChange={e => handleEntryChange(eIdx, 'credit', e.target.value)}/></div>
                                    <div className="col-span-2 flex justify-end"><button onClick={() => setEntries(entries.filter(e => e.id !== entry.id))} className="text-rose-500"><Trash2 size={16}/></button></div>
                                </div>
                            ))}
                            <button onClick={() => setEntries([...entries, { ...emptySplit, id: Date.now() }])} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-slate-400 font-bold text-xs hover:border-amber-500 uppercase">+ Add Line</button>
                        </div>

                        <div className="flex justify-between items-center p-6 rounded-2xl border bg-slate-900/50">
                            <div><p className="text-[10px] text-slate-500 uppercase">Total Debits</p><p className={`text-2xl font-mono font-black ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(totalDebit)}</p></div>
                            <div className="text-right"><p className="text-[10px] text-slate-500 uppercase">Total Credits</p><p className={`text-2xl font-mono font-black ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(totalCredit)}</p></div>
                        </div>

                        <div className="flex justify-end pt-4"><button onClick={submitJournal} disabled={isSaving || !isBalanced} className={`px-16 py-5 font-black rounded-2xl uppercase ${isBalanced ? 'bg-amber-500 text-amber-950 hover:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>{isSaving ? 'Processing...' : 'Post to General Ledger'}</button></div>
                    </div>
                </div>
            )}
        </AdminSidebarLayout>
    );
}