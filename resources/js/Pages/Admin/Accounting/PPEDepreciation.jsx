import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Briefcase, CalendarDays, Plus, Edit2, Trash2, X, MapPin, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PPEDepreciation({ data, categories, filters }) {
    const [month, setMonth] = useState(filters.month);
    const [year, setYear] = useState(filters.year);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const initialFormState = { category: categories[0], date_acquired: '', particular: '', amount: '', life_years: '' };
    const [form, setForm] = useState(initialFormState);

    const months = [
        { val: '01', label: 'January' }, { val: '02', label: 'February' }, { val: '03', label: 'March' }, { val: '04', label: 'April' },
        { val: '05', label: 'May' }, { val: '06', label: 'June' }, { val: '07', label: 'July' }, { val: '08', label: 'August' },
        { val: '09', label: 'September' }, { val: '10', label: 'October' }, { val: '11', label: 'November' }, { val: '12', label: 'December' }
    ];

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('admin.accounting.ppe.index'), { month, year }, { preserveState: true });
    };

    const submitAdd = (e) => {
        e.preventDefault();
        setIsSaving(true);
        router.post(route('admin.accounting.ppe.store'), form, {
            onSuccess: () => { setShowModal(false); setForm(initialFormState); toast.success("PPE Added."); setIsSaving(false); },
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

    const formatCurrency = (amount) => {
        const val = parseFloat(amount || 0);
        if (val === 0) return "-";
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
    };

    let grandTotalAmount = 0, grandTotalMonthlyDeprn = 0, grandTotalDeprn = 0, grandTotalNet = 0;

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
                                {months.map(m => <option key={m.val} value={m.val} className="text-slate-900">{m.label}</option>)}
                            </select>
                            <select value={year} onChange={e => setYear(e.target.value)} className="bg-transparent border-0 text-white font-bold text-sm focus:ring-0 cursor-pointer px-2">
                                {[2022, 2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="text-slate-900">{y}</option>)}
                            </select>
                            <button onClick={handleFilter} className="px-4 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-all text-xs uppercase tracking-widest">View</button>
                        </div>
                        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-white text-slate-950 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all">
                            <Plus size={18} /> Add PPE Asset
                        </button>
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
                                        {/* Group Header */}
                                        <tr className="bg-slate-100/50 dark:bg-slate-900 border-y border-slate-200 dark:border-white/10">
                                            <td colSpan="8" className="px-6 py-4 font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">
                                                {category}
                                            </td>
                                        </tr>
                                        {/* Items */}
                                        {items.map(item => {
                                            subTotalAmount += parseFloat(item.amount); subTotalMonthlyDeprn += parseFloat(item.monthly_deprn);
                                            subTotalDeprn += parseFloat(item.total_deprn); subTotalNet += parseFloat(item.net_amount);
                                            grandTotalAmount += parseFloat(item.amount); grandTotalMonthlyDeprn += parseFloat(item.monthly_deprn);
                                            grandTotalDeprn += parseFloat(item.total_deprn); grandTotalNet += parseFloat(item.net_amount);
                                            
                                            const isEditing = editingId === item.id;
                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-300">
                                                    <td className="px-6 py-4 text-xs font-mono">
                                                        {isEditing ? <input type="date" value={editForm.date_acquired} onChange={e => setEditForm({...editForm, date_acquired: e.target.value})} className="bg-transparent border border-emerald-500/50 rounded p-1 w-full" /> : item.date_acquired}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                                                        {isEditing ? <input type="text" value={editForm.particular} onChange={e => setEditForm({...editForm, particular: e.target.value})} className="bg-transparent border border-emerald-500/50 rounded p-1 w-full" /> : item.particular}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        {isEditing ? <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="bg-transparent border border-emerald-500/50 rounded p-1 w-24 text-right" /> : formatCurrency(item.amount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold">
                                                        {isEditing ? <input type="number" value={editForm.life_years} onChange={e => setEditForm({...editForm, life_years: e.target.value})} className="bg-transparent border border-emerald-500/50 rounded p-1 w-16 text-center" /> : `${item.life_years} yrs`}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(item.monthly_deprn)}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(item.total_deprn)}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/5">{formatCurrency(item.net_amount)}</td>
                                                    <td className="px-6 py-4 text-center flex justify-center gap-3">
                                                        {isEditing ? (
                                                            <button onClick={handleSaveEdit} className="text-emerald-600 hover:text-emerald-500" title="Save"><Check size={18}/></button>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => { setEditingId(item.id); setEditForm({...item}); }} className="text-slate-400 hover:text-indigo-500" title="Edit"><Edit2 size={18}/></button>
                                                                <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-500" title="Delete"><Trash2 size={18}/></button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Subtotal */}
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
                            
                            {/* Grand Total */}
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-lg p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <Briefcase className="text-emerald-500"/> Add PPE Asset
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24}/></button>
                        </div>
                        <form onSubmit={submitAdd} className="space-y-5 text-slate-800 dark:text-white">
                            <div>
                                <label className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Category</label>
                                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl mt-1 text-sm focus:ring-emerald-500">
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Date Acquired</label>
                                    <input type="date" required value={form.date_acquired} onChange={e => setForm({...form, date_acquired: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl mt-1 text-sm focus:ring-emerald-500"/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Life (Years)</label>
                                    <input type="number" required min="1" placeholder="e.g. 5" value={form.life_years} onChange={e => setForm({...form, life_years: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl mt-1 text-sm font-bold text-center focus:ring-emerald-500"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Particular (Asset Name)</label>
                                <input type="text" required placeholder="E.g. Toyota Innova 2015" value={form.particular} onChange={e => setForm({...form, particular: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl mt-1 text-sm focus:ring-emerald-500"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Acquisition Amount</label>
                                <input type="number" required min="1" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl mt-1 text-sm font-bold text-right focus:ring-emerald-500"/>
                            </div>
                            
                            <button type="submit" disabled={isSaving} className="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-emerald-500/20">
                                {isSaving ? 'Saving...' : 'Register Asset'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminSidebarLayout>
    );
}