import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { 
    Landmark, Plus, X, TableProperties, Trash2, 
    ChevronRight, Wallet, CalendarDays, ReceiptText,
    ArrowUpRight, ArrowDownLeft, Edit2, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BankRecords({ records, bankAccounts, months, beginningBalance, filters }) {
    const [month, setMonth] = useState(filters.month);
    const [year, setYear] = useState(filters.year);
    const [showModal, setShowModal] = useState(false);
    
    // --- EDITING STATE ---
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // --- SPREADSHEET MODAL STATE ---
    const emptyRow = { id: Date.now(), transactionDate: new Date().toISOString().split('T')[0], referenceNo: '', particulars: '', debit: '', credit: '' };
    const [rows, setRows] = useState([{ ...emptyRow }]);
    const [isSaving, setIsSaving] = useState(false);

    const handleFilter = (e) => {
        if(e) e.preventDefault();
        router.get(route('admin.accounting.bank.index'), { accountCode: filters.accountCode, month, year }, { preserveState: true });
    };

    const handleBankSwitch = (code) => {
        router.get(route('admin.accounting.bank.index'), { accountCode: code, month, year });
    };

    // Inline Editing Logic
    const startEditing = (record) => {
        setEditingId(record.id);
        setEditForm({ ...record });
    };

    const handleSaveEdit = () => {
        router.put(route('admin.accounting.bank.update', editingId), editForm, {
            onSuccess: () => {
                setEditingId(null);
                toast.success("Transaction updated successfully");
            }
        });
    };

    // Spreadsheet Modal Logic
    const addRow = () => setRows([...rows, { ...emptyRow, id: Date.now() + Math.random() }]);
    const removeRow = (id) => rows.length > 1 && setRows(rows.filter(r => r.id !== id));

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
        router.post(route('admin.accounting.bank.bulk-store'), { 
            entries: rows, 
            accountCode: filters.accountCode 
        }, {
            onSuccess: () => {
                setShowModal(false);
                setRows([{ ...emptyRow }]);
                setIsSaving(false);
                toast.success("Bank records synchronized");
            },
            onError: () => setIsSaving(false)
        });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
    let runningBalance = beginningBalance;

    return (
        <AdminSidebarLayout>
            <Head title={`Bank Ledger - ${filters.bankName}`}>
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            
            <div className="w-full max-w-[110rem] mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500 px-2 sm:px-4">
                
                {/* --- RESPONSIVE HERO HEADER --- */}
                <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-10 shadow-2xl border border-white/5">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                        <div className="space-y-2 w-full xl:w-auto">
                            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight break-words">
                                {filters.bankName}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                                <span className="flex items-center gap-2"><Wallet size={14} className="text-emerald-400"/> {filters.accountCode}</span>
                                <span className="flex items-center gap-2"><CalendarDays size={14} className="text-emerald-400"/> {filters.monthName} {year}</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                            {/* PERIOD SELECTOR WITH WORD-BASED MONTHS */}
                            <div className="flex flex-col sm:flex-row bg-white/5 backdrop-blur-md p-1 rounded-xl border border-white/10 w-full sm:w-auto">
                                <select 
                                    value={filters.accountCode} 
                                    onChange={e => handleBankSwitch(e.target.value)} 
                                    className="bg-transparent border-0 text-white font-bold text-sm focus:ring-0 cursor-pointer min-w-full sm:min-w-[200px]"
                                >
                                    {bankAccounts.map(bank => (
                                        <option key={bank.accountCode} value={bank.accountCode} className="text-slate-900">{bank.accountName}</option>
                                    ))}
                                </select>
                                <div className="flex border-t sm:border-t-0 sm:border-l border-white/10 mt-1 sm:mt-0">
                                    <select 
                                        value={month} 
                                        onChange={e => setMonth(e.target.value)} 
                                        className="bg-transparent border-0 text-white font-bold text-sm focus:ring-0 cursor-pointer flex-1 px-4"
                                    >
                                        {months.map(m => (
                                            <option key={m.value} value={m.value} className="text-slate-900">{m.label}</option>
                                        ))}
                                    </select>
                                    <button onClick={handleFilter} className="p-2 bg-emerald-500 text-slate-900 rounded-lg hover:bg-emerald-400 transition-all m-1">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>

                            <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-950 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all w-full sm:w-auto">
                                <TableProperties size={18} /> Spreadsheet Entry
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

                {/* --- TRANSACTION VIEW (TABLE FOR DESKTOP, CARDS FOR MOBILE) --- */}
                <div className="bg-white dark:bg-slate-950 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                    
                    {/* DESKTOP TABLE */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-white/5">
                                    <th className="px-8 py-5">Ref No</th>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5">Particulars</th>
                                    <th className="px-8 py-5 text-right">Out</th>
                                    <th className="px-8 py-5 text-right">In</th>
                                    <th className="px-8 py-5 text-right">Balance</th>
                                    <th className="px-8 py-5 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5 font-medium">
                                {records.map(record => {
                                    runningBalance += (parseFloat(record.debit) - parseFloat(record.credit));
                                    const isEditing = editingId === record.id;
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-emerald-400/5 transition-colors group">
                                            <td className="px-8 py-5 font-mono text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                                                {isEditing ? <input type="text" value={editForm.referenceNo} onChange={e => setEditForm({...editForm, referenceNo: e.target.value})} className="bg-transparent border-0 p-0 font-mono text-[10px] w-full focus:ring-0" /> : (record.referenceNo || '—')}
                                            </td>
                                            <td className="px-8 py-5 text-xs text-slate-400">
                                                {isEditing ? <input type="date" value={editForm.transactionDate} onChange={e => setEditForm({...editForm, transactionDate: e.target.value})} className="bg-transparent border-0 p-0 text-xs w-full focus:ring-0" /> : record.transactionDate}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {isEditing ? <input type="text" value={editForm.particulars} onChange={e => setEditForm({...editForm, particulars: e.target.value})} className="bg-transparent border-0 p-0 text-sm w-full focus:ring-0 font-bold" /> : record.particulars}
                                            </td>
                                            <td className="px-8 py-5 text-right font-mono text-rose-500 font-bold">
                                                {isEditing ? <input type="number" value={editForm.credit} onChange={e => setEditForm({...editForm, credit: e.target.value})} className="bg-transparent border-0 p-0 text-right w-full focus:ring-0 font-mono" /> : (record.credit > 0 ? formatCurrency(record.credit) : '—')}
                                            </td>
                                            <td className="px-8 py-5 text-right font-mono text-emerald-500 font-bold">
                                                {isEditing ? <input type="number" value={editForm.debit} onChange={e => setEditForm({...editForm, debit: e.target.value})} className="bg-transparent border-0 p-0 text-right w-full focus:ring-0 font-mono" /> : (record.debit > 0 ? formatCurrency(record.debit) : '—')}
                                            </td>
                                            <td className="px-8 py-5 text-right font-mono font-black text-slate-900 dark:text-white">{formatCurrency(runningBalance)}</td>
                                            <td className="px-8 py-5">
                                                {isEditing ? (
                                                    <button onClick={handleSaveEdit} className="p-2 bg-emerald-500 text-white rounded-lg"><Check size={14}/></button>
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

                    {/* MOBILE CARD VIEW */}
                    <div className="lg:hidden divide-y divide-slate-50 dark:divide-white/5">
                        {records.map(record => {
                            runningBalance += (parseFloat(record.debit) - parseFloat(record.credit));
                            const isDebit = record.debit > 0;
                            return (
                                <div key={record.id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                                                {record.referenceNo || 'No Ref'}
                                            </span>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{record.particulars}</h4>
                                            <p className="text-[10px] text-slate-400 font-medium italic">{record.transactionDate}</p>
                                        </div>
                                        <p className={`text-sm font-black ${isDebit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {isDebit ? `+${formatCurrency(record.debit)}` : `-${formatCurrency(record.credit)}`}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-white/5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Balance</span>
                                        <span className="text-xs font-black font-mono text-slate-900 dark:text-white">{formatCurrency(runningBalance)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- RESPONSIVE MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom-8 duration-500">
                    <div className="px-4 md:px-8 py-4 md:py-6 border-b border-white/5 flex items-center justify-between bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500 rounded-xl text-slate-950"><ReceiptText size={18}/></div>
                            <h2 className="text-sm md:text-lg font-black text-white">Batch Entry</h2>
                        </div>
                        <button onClick={() => setShowModal(false)} className="p-2 md:p-3 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"><X size={20}/></button>
                    </div>

                    <div className="flex-1 overflow-auto p-3 md:p-8">
                        <div className="max-w-6xl mx-auto space-y-3">
                            {rows.map((row, idx) => (
                                <div key={row.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col xl:flex-row items-center gap-3 md:gap-4 hover:bg-white/[0.08] transition-all">
                                    <div className="flex w-full xl:w-auto items-center justify-between xl:justify-start gap-4">
                                        <span className="text-[10px] font-black text-white/20 xl:w-6">{idx + 1}</span>
                                        <input type="date" value={row.transactionDate} onChange={(e) => handleCellChange(row.id, 'transactionDate', e.target.value)} className="bg-transparent border-0 text-white font-bold text-xs focus:ring-0 p-0" />
                                        <input type="text" placeholder="REF NO (OPTIONAL)" value={row.referenceNo} onChange={(e) => handleCellChange(row.id, 'referenceNo', e.target.value.toUpperCase())} className="bg-transparent border-0 text-emerald-400 font-black font-mono text-xs focus:ring-0 uppercase placeholder:text-emerald-900/50 p-0 w-32" />
                                    </div>
                                    <input type="text" placeholder="PARTICULARS" value={row.particulars} onChange={(e) => handleCellChange(row.id, 'particulars', e.target.value)} className="w-full bg-transparent border-0 text-white font-bold text-xs focus:ring-0 placeholder:text-slate-600 p-0" />
                                    <div className="flex w-full xl:w-auto gap-2">
                                        <div className="flex-1 relative">
                                            <ArrowUpRight size={10} className="absolute left-2 top-2 text-rose-500 opacity-50" />
                                            <input type="number" placeholder="Debit" value={row.credit} onChange={(e) => handleCellChange(row.id, 'credit', e.target.value)} className="w-full xl:w-28 bg-rose-500/10 border-0 rounded-xl text-rose-400 font-black text-right text-xs focus:ring-emerald-500 placeholder:text-rose-900 py-2 pr-2 pl-6" />
                                        </div>
                                        <div className="flex-1 relative">
                                            <ArrowDownLeft size={10} className="absolute left-2 top-2 text-emerald-500 opacity-50" />
                                            <input type="number" placeholder="Credit" value={row.debit} onChange={(e) => handleCellChange(row.id, 'debit', e.target.value)} className="w-full xl:w-28 bg-emerald-500/10 border-0 rounded-xl text-emerald-400 font-black text-right text-xs focus:ring-emerald-500 placeholder:text-emerald-900 py-2 pr-2 pl-6" />
                                        </div>
                                        <button onClick={() => removeRow(row.id)} className="p-2 text-rose-500/40 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addRow} className="w-full py-4 rounded-2xl border-2 border-dashed border-white/5 text-white/20 font-black text-[10px] uppercase tracking-[0.2em] hover:border-emerald-500/50 hover:text-emerald-500 transition-all">+ Add Row</button>
                        </div>
                    </div>

                    <div className="p-4 md:p-8 border-t border-white/5 flex justify-center bg-slate-900">
                        <button onClick={submitBulkEntry} disabled={isSaving} className="w-full md:w-80 py-4 bg-emerald-500 text-slate-950 font-black rounded-xl shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all text-sm">
                            {isSaving ? 'Processing...' : 'Post Transactions'}
                        </button>
                    </div>
                </div>
            )}
        </AdminSidebarLayout>
    );
}