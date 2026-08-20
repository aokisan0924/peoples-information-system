import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Briefcase, CalendarDays, Plus, Edit2, Trash2, X, MapPin, Check, BookOpen, PlusCircle, Search, ChevronDown, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PPEDepreciation({ data, categories, chartOfAccounts, journalStatus, filters }) {
    const [month, setMonth] = useState(filters.month);
    const [year, setYear] = useState(filters.year);
    
    // UI States
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // --- BATCH INPUT STATE ---
    const emptyRow = { id: Date.now(), category: categories[0], date_acquired: '', particular: '', amount: '', life_years: '' };
    const [rows, setRows] = useState([{ ...emptyRow }]);

    // Journal Modal States
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [journalType, setJournalType] = useState(null); 
    const [journalAmount, setJournalAmount] = useState(0);
    
    const emptySplit = { accountCode: '', accountName: '', debit: 0, credit: 0 };
    const [journalEntries, setJournalEntries] = useState([{ ...emptySplit }, { ...emptySplit }]);
    const [openDropdown, setOpenDropdown] = useState(null); 
    const [accountSearch, setAccountSearch] = useState("");

    const filteredAccounts = useMemo(() => 
        (chartOfAccounts || []).filter(acc => 
            acc.accountName.toLowerCase().includes(accountSearch.toLowerCase()) || acc.accountCode.includes(accountSearch)
        ), [accountSearch, chartOfAccounts]
    );

    const months = [
        { val: '01', label: 'January' }, { val: '02', label: 'February' }, { val: '03', label: 'March' }, { val: '04', label: 'April' },
        { val: '05', label: 'May' }, { val: '06', label: 'June' }, { val: '07', label: 'July' }, { val: '08', label: 'August' },
        { val: '09', label: 'September' }, { val: '10', label: 'October' }, { val: '11', label: 'November' }, { val: '12', label: 'December' }
    ];

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('admin.accounting.ppe.index'), { month, year }, { preserveState: true });
    };

    // --- BATCH SUBMIT HANDLERS ---
    const handleRowChange = (id, field, value) => setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    const addRow = () => setRows([...rows, { ...emptyRow, id: Date.now() }]);
    const removeRow = (id) => setRows(rows.filter(r => r.id !== id));

    const submitBulkAdd = (e) => {
        e.preventDefault();
        setIsSaving(true);
        router.post(route('admin.accounting.ppe.store'), { assets: rows }, {
            onSuccess: () => { 
                setShowModal(false); 
                setRows([{ ...emptyRow, id: Date.now() }]); 
                toast.success("Batch Assets Registered."); 
                setIsSaving(false); 
            },
            onError: () => { toast.error("Check form errors."); setIsSaving(false); }
        });
    };

    const handleSaveEdit = () => {
        router.put(route('admin.accounting.ppe.update', editingId), editForm, {
            onSuccess: () => { setEditingId(null); toast.success("PPE updated."); }
        });
    };

    const handleDelete = (id) => {
        if(confirm("Delete this asset? This cannot be undone.")) {
            router.delete(route('admin.accounting.ppe.destroy', id), { onSuccess: () => toast.success("Asset deleted.") });
        }
    };

    const openJournalModal = (type, targetAmount) => {
        if (targetAmount <= 0) {
            toast.error("No depreciation amount to journalize for this category.");
            return;
        }
        setJournalType(type);
        setJournalAmount(targetAmount);
        setJournalEntries([{ ...emptySplit }, { ...emptySplit }]);
        setShowJournalModal(true);
    };

    const submitJournal = () => {
        const d = journalEntries.reduce((sum, e) => sum + parseFloat(e.debit || 0), 0);
        const c = journalEntries.reduce((sum, e) => sum + parseFloat(e.credit || 0), 0);

        if (Math.abs(d - c) > 0.01) { toast.error("Unbalanced! Total Debits must equal Total Credits."); return; }
        if (Math.abs(d - journalAmount) > 0.01) { toast.error(`Total entries must equal the Target Amount (${formatCurrency(journalAmount)}).`); return; }

        setIsSaving(true);
        router.post(route('admin.accounting.ppe.journalize'), { month, year, branch: filters.branch, type: journalType, entries: journalEntries }, {
            onSuccess: () => { setShowJournalModal(false); toast.success("Depreciation journalized!"); setIsSaving(false); },
            onError: () => setIsSaving(false)
        });
    };

    const handleJournalEntryChange = (idx, field, value) => { const newEntries = [...journalEntries]; newEntries[idx][field] = value; setJournalEntries(newEntries); };
    const formatCurrency = (amount) => { const val = parseFloat(amount || 0); if (val === 0) return "-"; return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val); };

    let grandTotalAmount = 0, grandTotalMonthlyDeprn = 0, grandTotalDeprn = 0, grandTotalNet = 0;
    let transportDeprn = 0, othersDeprn = 0;

    return (
        <AdminSidebarLayout>
            <Head title={`PPE Depreciation - ${filters.monthName} ${filters.year}`} />
            
            <div className="max-w-[100rem] mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-500 pb-20">
                {/* Header */}
                <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                            <Briefcase className="text-emerald-400" size={28} /> PPE Depreciation
                        </h1>
                        <div className="flex items-center gap-3 text-slate-400 font-bold text-xs uppercase tracking-widest">
                            <span className="flex items-center gap-2 font-mono text-emerald-400"><MapPin size={14}/> {filters.branch}</span>
                            <span className="flex items-center gap-2"><CalendarDays size={14}/> As of {filters.monthName} {filters.year}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <div className="flex bg-white/5 backdrop-blur-md p-2 rounded-xl border border-white/10 gap-2">
                            <select value={month} onChange={e => setMonth(e.target.value)} className="bg-transparent border-0 text-white font-bold text-sm focus:ring-0 cursor-pointer px-2">
                                {months.map(m => <option key={m.val} value={m.val} className="bg-slate-900">{m.label}</option>)}
                            </select>
                            <select value={year} onChange={e => setYear(e.target.value)} className="bg-transparent border-0 text-white font-bold text-sm focus:ring-0 cursor-pointer px-2">
                                {[2022, 2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                            </select>
                            <button onClick={handleFilter} className="px-4 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-all text-xs uppercase tracking-widest">View</button>
                        </div>
                        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-white text-slate-950 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all">
                            <Plus size={18} /> Register Assets
                        </button>
                    </div>
                </div>

                <div className="hidden">
                    {categories.map(category => {
                        const items = data[category] || [];
                        items.forEach(item => {
                            if (category === 'Transport Equipment') transportDeprn += parseFloat(item.monthly_deprn);
                            else othersDeprn += parseFloat(item.monthly_deprn);
                        });
                        return null;
                    })}
                </div>

                {/* --- MONTHLY JOURNAL ACTIONS PANEL --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-indigo-500/20 p-6 rounded-2xl flex justify-between items-center shadow-lg">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Target Journal Amount</p>
                            <h3 className="text-white font-black text-xl uppercase">Transport Equipment</h3>
                            <p className="text-2xl font-mono font-black text-indigo-400 mt-1">{formatCurrency(transportDeprn)}</p>
                        </div>
                        <div>
                            <button disabled={journalStatus.transport === 'approved'} onClick={() => openJournalModal('transport', transportDeprn)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${journalStatus.transport ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500 text-amber-950 shadow-xl shadow-amber-500/10 hover:bg-amber-400'}`}>
                                {journalStatus.transport === 'approved' ? <><CheckCircle2 size={16}/> Approved</> : journalStatus.transport === 'pending_review' ? <><BookOpen size={16}/> Edit Pending</> : <><BookOpen size={16}/> Submit Journal</>}
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-900 border border-fuchsia-500/20 p-6 rounded-2xl flex justify-between items-center shadow-lg">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Target Journal Amount</p>
                            <h3 className="text-white font-black text-xl uppercase">Other Categories</h3>
                            <p className="text-2xl font-mono font-black text-fuchsia-400 mt-1">{formatCurrency(othersDeprn)}</p>
                        </div>
                        <div>
                            <button disabled={journalStatus.others === 'approved'} onClick={() => openJournalModal('others', othersDeprn)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${journalStatus.others ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500 text-amber-950 shadow-xl shadow-amber-500/10 hover:bg-amber-400'}`}>
                                {journalStatus.others === 'approved' ? <><CheckCircle2 size={16}/> Approved</> : journalStatus.others === 'pending_review' ? <><BookOpen size={16}/> Edit Pending</> : <><BookOpen size={16}/> Submit Journal</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px]">
                        <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                            <tr>
                                <th className="px-6 py-5">Date Acquired</th>
                                <th className="px-6 py-5">Particular</th>
                                <th className="px-6 py-5 text-right">Amount</th>
                                <th className="px-6 py-5 text-center">Life</th>
                                <th className="px-6 py-5 text-right">Monthly Deprn</th>
                                <th className="px-6 py-5 text-right">Total Deprn</th>
                                <th className="px-6 py-5 text-right bg-emerald-50 dark:bg-emerald-400/5 text-emerald-700 dark:text-emerald-500">Net Amount</th>
                                <th className="px-6 py-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {categories.map(category => {
                                const items = data[category] || [];
                                if (items.length === 0) return null;

                                let subTotalAmount = 0, subTotalMonthlyDeprn = 0, subTotalDeprn = 0, subTotalNet = 0;

                                return (
                                    <React.Fragment key={category}>
                                        <tr className="bg-slate-100/50 dark:bg-slate-900 border-y border-slate-200 dark:border-white/10">
                                            <td colSpan="8" className="px-6 py-4 font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">{category}</td>
                                        </tr>
                                        {items.map(item => {
                                            subTotalAmount += parseFloat(item.amount); subTotalMonthlyDeprn += parseFloat(item.monthly_deprn);
                                            subTotalDeprn += parseFloat(item.total_deprn); subTotalNet += parseFloat(item.net_amount);
                                            grandTotalAmount += parseFloat(item.amount); grandTotalMonthlyDeprn += parseFloat(item.monthly_deprn);
                                            grandTotalDeprn += parseFloat(item.total_deprn); grandTotalNet += parseFloat(item.net_amount);
                                            
                                            const isEditing = editingId === item.id;
                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-300">
                                                    <td className="px-6 py-4 text-xs font-mono">{isEditing ? <input type="date" value={editForm.date_acquired} onChange={e => setEditForm({...editForm, date_acquired: e.target.value})} className="bg-transparent border border-emerald-500/50 rounded p-1 w-full" /> : item.date_acquired}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{isEditing ? <input type="text" value={editForm.particular} onChange={e => setEditForm({...editForm, particular: e.target.value})} className="bg-transparent border border-emerald-500/50 rounded p-1 w-full" /> : item.particular}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{isEditing ? <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="bg-transparent border border-emerald-500/50 rounded p-1 w-24 text-right" /> : formatCurrency(item.amount)}</td>
                                                    <td className="px-6 py-4 text-center font-bold">{isEditing ? <input type="number" value={editForm.life_years} onChange={e => setEditForm({...editForm, life_years: e.target.value})} className="bg-transparent border border-emerald-500/50 rounded p-1 w-16 text-center" /> : `${item.life_years} yrs`}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(item.monthly_deprn)}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(item.total_deprn)}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/5">{formatCurrency(item.net_amount)}</td>
                                                    <td className="px-6 py-4 text-center flex justify-center gap-3">
                                                        {isEditing ? (<button onClick={handleSaveEdit} className="text-emerald-600 hover:text-emerald-500"><Check size={18}/></button>) : (<><button onClick={() => { setEditingId(item.id); setEditForm({...item}); }} className="text-slate-400 hover:text-indigo-500"><Edit2 size={18}/></button><button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={18}/></button></>)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-white/10">
                                            <td colSpan="2" className="px-6 py-3 text-right font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-[10px]">Sub-Total</td>
                                            <td className="px-6 py-3 text-right font-mono font-black text-slate-900 dark:text-white">{formatCurrency(subTotalAmount)}</td>
                                            <td className="px-6 py-3 text-center">-</td>
                                            <td className="px-6 py-3 text-right font-mono font-black text-slate-900 dark:text-white">{formatCurrency(subTotalMonthlyDeprn)}</td>
                                            <td className="px-6 py-3 text-right font-mono font-black text-slate-900 dark:text-white">{formatCurrency(subTotalDeprn)}</td>
                                            <td className="px-6 py-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/5">{formatCurrency(subTotalNet)}</td>
                                            <td></td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                            
                            {grandTotalAmount > 0 && (
                                <tr className="bg-emerald-100/50 dark:bg-emerald-950/40 border-t-2 border-emerald-500/20">
                                    <td colSpan="2" className="px-6 py-5 text-right font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest text-xs">G-R-A-N-D T-O-T-A-L</td>
                                    <td className="px-6 py-5 text-right font-mono font-black text-lg text-emerald-900 dark:text-emerald-300">{formatCurrency(grandTotalAmount)}</td>
                                    <td className="px-6 py-5 text-center">-</td>
                                    <td className="px-6 py-5 text-right font-mono font-black text-lg text-emerald-900 dark:text-emerald-300">{formatCurrency(grandTotalMonthlyDeprn)}</td>
                                    <td className="px-6 py-5 text-right font-mono font-black text-lg text-rose-600 dark:text-rose-400">{formatCurrency(grandTotalDeprn)}</td>
                                    <td className="px-6 py-5 text-right font-mono font-black text-xl text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/5">{formatCurrency(grandTotalNet)}</td>
                                    <td></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- BATCH ADD PPE MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-[2rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2"><Briefcase className="text-emerald-400"/> Register Assets</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {rows.map((row) => (
                                <div key={row.id} className="bg-white/5 p-6 rounded-2xl relative border border-white/5 text-white">
                                    {rows.length > 1 && (
                                        <button onClick={() => removeRow(row.id)} className="absolute top-4 right-4 text-rose-500 hover:text-rose-400"><Trash2 size={16}/></button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-3"><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Category</label>
                                            <select value={row.category} onChange={e => handleRowChange(row.id, 'category', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm focus:ring-emerald-500">
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Date Acquired</label><input type="date" required value={row.date_acquired} onChange={e => handleRowChange(row.id, 'date_acquired', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm focus:ring-emerald-500"/></div>
                                        <div className="md:col-span-3"><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Particular (Asset Name)</label><input type="text" required placeholder="E.g. Toyota Innova 2015" value={row.particular} onChange={e => handleRowChange(row.id, 'particular', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm focus:ring-emerald-500"/></div>
                                        <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Amount</label><input type="number" required min="1" step="0.01" value={row.amount} onChange={e => handleRowChange(row.id, 'amount', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm font-bold text-right focus:ring-emerald-500"/></div>
                                        <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Life (Years)</label><input type="number" required min="1" placeholder="e.g. 5" value={row.life_years} onChange={e => handleRowChange(row.id, 'life_years', e.target.value)} className="w-full bg-slate-800 border-0 rounded-xl mt-1 text-sm font-bold text-center focus:ring-emerald-500"/></div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addRow} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-slate-400 font-bold text-xs hover:border-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
                                + Add Asset Row
                            </button>
                        </div>
                        
                        <div className="p-6 border-t border-white/5 shrink-0 flex justify-between items-center">
                            <span className="text-white font-bold">{rows.length} asset(s)</span>
                            <button onClick={submitBulkAdd} disabled={isSaving} className="px-8 py-3 bg-emerald-500 text-slate-950 font-black rounded-xl uppercase tracking-widest active:scale-95 transition-transform">
                                {isSaving ? 'Saving...' : 'Register Assets'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- JOURNALIZE DEPRECIATION MODAL --- */}
            {showJournalModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col p-4 md:p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3 text-white"><BookOpen size={24} className={journalStatus[journalType] ? "text-emerald-400" : "text-amber-400"}/> <h2 className="font-black text-xl md:text-2xl tracking-tight uppercase">{journalStatus[journalType] ? 'Edit Journal Entry' : 'Create Journal Entry'}</h2></div>
                        <button onClick={() => setShowJournalModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white"><X size={24}/></button>
                    </div>

                    <div className="max-w-5xl mx-auto w-full flex-1 overflow-y-auto space-y-6 pb-20">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div><p className="text-xs text-slate-400 mb-1">Batch Entry | {filters.monthName} {filters.year}</p><p className="text-lg font-bold">{journalType === 'transport' ? 'Transport Equipment Depreciation' : 'Other PPE Depreciation'}</p></div>
                            <div className="md:text-right"><p className="text-[10px] uppercase font-black text-slate-500">Target Distribution Amount</p><p className="text-2xl font-mono font-black text-amber-400">{formatCurrency(journalAmount)}</p></div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-4 md:p-8 space-y-4 text-white">
                            <div className="flex justify-between items-center px-2"><h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Splits</h3><button onClick={() => setJournalEntries([...journalEntries, {...emptySplit}])} className="text-emerald-400 flex items-center gap-2 text-[10px] font-black uppercase"><PlusCircle size={14}/> Add Account</button></div>
                            {journalEntries.map((entry, eIdx) => (
                                <div key={eIdx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                    <div className="md:col-span-6 relative">
                                        <div className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 flex justify-between items-center cursor-pointer" onClick={() => setOpenDropdown(openDropdown === eIdx ? null : eIdx)}><span className="font-bold text-xs">{entry.accountCode ? `${entry.accountCode} - ${entry.accountName}` : 'Select Expense / Accum Deprn...'}</span><ChevronDown size={16} className="text-slate-400" /></div>
                                        {openDropdown === eIdx && (
                                            <div className="absolute z-[120] left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                                <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-white/5"><Search size={14} className="text-slate-400" /><input autoFocus placeholder="Search..." className="bg-transparent border-0 text-white text-xs w-full focus:ring-0" value={accountSearch} onChange={e => setAccountSearch(e.target.value)} /></div>
                                                <div className="max-h-48 overflow-auto py-2">
                                                    {filteredAccounts.map(acc => (<div key={acc.accountCode} onClick={() => { handleJournalEntryChange(eIdx, 'accountCode', acc.accountCode); handleJournalEntryChange(eIdx, 'accountName', acc.accountName); setOpenDropdown(null); setAccountSearch(''); }} className="px-4 py-3 text-xs font-bold hover:bg-emerald-500 cursor-pointer text-white">{acc.accountCode} - {acc.accountName}</div>))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2"><input type="number" placeholder="Debit" value={entry.debit || ''} className="w-full bg-rose-500/10 border-0 rounded-xl text-rose-400 text-right text-xs focus:ring-rose-500" onChange={e => handleJournalEntryChange(eIdx, 'debit', e.target.value)}/></div>
                                    <div className="md:col-span-2"><input type="number" placeholder="Credit" value={entry.credit || ''} className="w-full bg-emerald-500/10 border-0 rounded-xl text-emerald-400 text-right text-xs focus:ring-emerald-500" onChange={e => handleJournalEntryChange(eIdx, 'credit', e.target.value)}/></div>
                                    <div className="md:col-span-2 flex justify-end"><button onClick={() => setJournalEntries(journalEntries.filter((_, i) => i !== eIdx))} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-4"><button onClick={submitJournal} disabled={isSaving} className="w-full md:w-auto px-16 py-5 bg-amber-500 text-amber-950 font-black rounded-2xl uppercase tracking-widest">{isSaving ? 'Processing...' : (journalStatus[journalType] === 'pending_review' ? 'Update Pending Journal' : 'Submit for Review')}</button></div>
                    </div>
                </div>
            )}

        </AdminSidebarLayout>
    );
}
