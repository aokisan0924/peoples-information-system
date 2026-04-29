import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { 
    Wallet2, Plus, X, TableProperties, Trash2, 
    ChevronRight, CalendarDays, ReceiptText,
    ArrowUpRight, ArrowDownLeft, Edit2, Check, FileDigit, Search, ChevronDown, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EWallet({ records, months, beginningBalance, filters }) {
    const [month, setMonth] = useState(filters.month);
    const [year, setYear] = useState(filters.year);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Initial state for Batch Entry
    const emptyRow = { 
        id: Date.now(), 
        transactionDate: new Date().toISOString().split('T')[0], 
        referenceNo: '', 
        particulars: '', 
        walletType: 'GCash', 
        debit: '', 
        credit: '' 
    };
    const [rows, setRows] = useState([{ ...emptyRow }]);

    const handleFilter = (e) => {
        if(e) e.preventDefault();
        router.get(route('admin.accounting.ewallet.index'), { month, year }, { preserveState: true });
    };

    const startEditing = (record) => {
        setEditingId(record.id);
        setEditForm({ ...record });
    };

    const handleSaveEdit = () => {
        router.put(route('admin.accounting.ewallet.update', editingId), editForm, {
            onSuccess: () => {
                setEditingId(null);
                toast.success("Transaction updated successfully");
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

    const submitBulkEntry = (e) => {
        e.preventDefault();
        setIsSaving(true);
        router.post(route('admin.accounting.ewallet.bulk-store'), { entries: rows }, {
            onSuccess: () => {
                setShowModal(false);
                setRows([{ ...emptyRow }]);
                setIsSaving(false);
                toast.success("E-Wallet logs synchronized");
            },
            onError: () => setIsSaving(false)
        });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
    let runningBalance = beginningBalance;

    return (
        <AdminSidebarLayout>
            <Head title="E-Wallet Logs" />
            <div className="w-full max-w-[110rem] mx-auto space-y-4 md:space-y-6 px-2 sm:px-4">
                
                {/* --- HEADER SECTION --- */}
                <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-10 shadow-2xl border border-white/5">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                                E-Wallet <span className="text-emerald-400">Logs</span>
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                                <span className="flex items-center gap-2 font-mono"><Smartphone size={14} className="text-emerald-400"/> {filters.branch} Branch</span>
                                <span className="flex items-center gap-2"><CalendarDays size={14} className="text-emerald-400"/> {year}</span>
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
                                <TableProperties size={18} /> New Batch
                            </button>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 inline-block w-full sm:w-auto">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mb-1">Current Branch Balance</p>
                            <h3 className="text-lg md:text-xl font-black text-white font-mono">{formatCurrency(beginningBalance)}</h3>
                        </div>
                    </div>
                </div>

                {/* --- TABLE SECTION --- */}
                <div className="bg-white dark:bg-slate-950 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden mb-20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5">Ref ID</th>
                                    <th className="px-8 py-5">Type</th>
                                    <th className="px-8 py-5">Particulars</th>
                                    <th className="px-8 py-5 text-right">Debit</th>
                                    <th className="px-8 py-5 text-right">Credit</th>
                                    <th className="px-8 py-5 text-right bg-emerald-400/5 font-black text-emerald-500">Balance</th>
                                    <th className="px-8 py-5 w-24 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5 font-medium">
                                {records.map(record => {
                                    runningBalance = runningBalance + parseFloat(record.credit) - parseFloat(record.debit);
                                    const isEditing = editingId === record.id;
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-emerald-400/5 transition-colors group">
                                            <td className="px-8 py-5 text-xs text-slate-400">{record.transactionDate}</td>
                                            <td className="px-8 py-5 font-mono text-[10px] font-black text-indigo-500">
                                                {isEditing ? <input type="text" value={editForm.referenceNo} onChange={e => setEditForm({...editForm, referenceNo: e.target.value})} className="bg-transparent border-0 p-0 font-mono text-[10px] w-full focus:ring-0" /> : (record.referenceNo || '—')}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${record.walletType === 'GCash' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {record.walletType}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">{record.particulars}</td>
                                            <td className="px-8 py-5 text-right font-mono text-rose-500 font-bold">{record.debit > 0 ? formatCurrency(record.debit) : '—'}</td>
                                            <td className="px-8 py-5 text-right font-mono text-emerald-500 font-bold">{record.credit > 0 ? formatCurrency(record.credit) : '—'}</td>
                                            <td className="px-8 py-5 text-right font-mono font-black text-slate-900 dark:text-white bg-emerald-400/5">{formatCurrency(runningBalance)}</td>
                                            <td className="px-8 py-5 text-center flex justify-center gap-2">
                                                {isEditing ? (
                                                    <button onClick={handleSaveEdit} className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg"><Check size={14}/></button>
                                                ) : (
                                                    <button onClick={() => startEditing(record)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-500 transition-all"><Edit2 size={14}/></button>
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

            {/* --- BATCH ENTRY MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col">
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-slate-900 shadow-xl">
                        <div className="flex items-center gap-3 text-white"><ReceiptText size={20} className="text-emerald-400"/> <h2 className="font-black text-xl tracking-tight">E-Wallet Batch Entry</h2></div>
                        <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><X size={24}/></button>
                    </div>
                    <div className="flex-1 overflow-auto p-8 space-y-3">
                        {rows.map((row, idx) => (
                            <div key={row.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/[0.08] transition-all group">
                                <span className="text-white/20 font-black w-6">{idx + 1}</span>
                                <input type="date" value={row.transactionDate} onChange={e => handleCellChange(row.id, 'transactionDate', e.target.value)} className="bg-transparent border-0 text-white text-xs focus:ring-0 p-0" />
                                <select value={row.walletType} onChange={e => handleCellChange(row.id, 'walletType', e.target.value)} className="bg-transparent border-0 text-emerald-400 font-black text-[10px] focus:ring-0 p-0 uppercase">
                                    <option value="GCash" className="bg-slate-800">GCash</option>
                                    <option value="Maya" className="bg-slate-800">Maya</option>
                                </select>
                                <input type="text" placeholder="REF ID" value={row.referenceNo} onChange={e => handleCellChange(row.id, 'referenceNo', e.target.value)} className="bg-transparent border-0 text-indigo-400 font-mono text-xs w-32 focus:ring-0 p-0" />
                                <input type="text" placeholder="PARTICULARS" value={row.particulars} onChange={e => handleCellChange(row.id, 'particulars', e.target.value)} className="flex-1 bg-transparent border-0 text-white text-xs focus:ring-0 p-0" />
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Debit" value={row.debit} onChange={e => handleCellChange(row.id, 'debit', e.target.value)} className="w-28 bg-rose-500/10 rounded-xl text-rose-400 text-right text-xs border-0 focus:ring-rose-500" />
                                    <input type="number" placeholder="Credit" value={row.credit} onChange={e => handleCellChange(row.id, 'credit', e.target.value)} className="w-28 bg-emerald-500/10 rounded-xl text-emerald-400 text-right text-xs border-0 focus:ring-emerald-500" />
                                    <button onClick={() => setRows(rows.filter(r => r.id !== row.id))} className="p-2 text-rose-500/40 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setRows([...rows, { ...emptyRow, id: Date.now() + Math.random() }])} className="w-full py-6 border-2 border-dashed border-white/5 text-white/20 font-black text-xs hover:border-emerald-500/50 hover:text-emerald-500 transition-all uppercase tracking-widest">+ Add Transaction Line</button>
                    </div>
                    <div className="p-8 border-t border-white/5 bg-slate-900 flex justify-center">
                        <button onClick={submitBulkEntry} disabled={isSaving} className="w-full max-w-md py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest">
                            {isSaving ? 'Synchronizing...' : 'Sync E-Wallet Logs'}
                        </button>
                    </div>
                </div>
            )}
        </AdminSidebarLayout>
    );
}