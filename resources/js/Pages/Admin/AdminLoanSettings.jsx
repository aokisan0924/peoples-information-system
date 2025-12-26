import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import { 
    Plus, Save, Trash2, ToggleLeft, ToggleRight, RefreshCw, Settings, 
    Calculator, ChevronDown, ChevronUp, Edit3 
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLoanSettings() {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState("ACTIVE_PENSIONER_V1");
    const [showAddForm, setShowAddForm] = useState(false);

    const [newRow, setNewRow] = useState({
        title: "New Computation",
        category: "ACTIVE_PENSIONER_V1",
        termMonths: 60,
        annualRateFormula: "0.09",
        monthlyRateFormula: "annualInterestRate/12",
        serviceFeeFormula: "netProceeds*0.121",
        insuranceFormula: "(netProceeds/1000)*terms",
        advanceInterestFormula:
            "monthlyInterestRate*netProceeds*advanceInterestMonths",
        effectiveRateFormula: "(1+annualInterestRate/terms)^terms-1",
        isActive: false,
        notes: "",
    });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/admin/computations", {
                params: { category: categoryFilter },
            });
            setItems(data.data || []);
        } catch {
            toast.error("Failed to load computations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [categoryFilter]);

    const handleCreate = async () => {
        try {
            const payload = {
                ...newRow,
                category: (newRow.category || "").toUpperCase(),
            };
            await axios.post("/admin/computations", payload);
            toast.success("Computation added.");
            setNewRow({
                ...newRow,
                title: "New Computation",
                isActive: false,
            });
            fetchItems();
            setShowAddForm(false);
        } catch (e) {
            const errors = e?.response?.data?.errors;
            if (errors) {
                const first = Object.values(errors)?.[0]?.[0];
                toast.error(first || "Validation failed");
            } else {
                toast.error(e?.response?.data?.message || "Saving failed.");
            }
        }
    };

    const handleUpdate = async (row) => {
        try {
            const payload = {
                ...row,
                category: (row.category || "").toUpperCase(),
            };
            await axios.put(`/admin/computations/${row.id}`, payload);
            toast.success("Saved.");
            fetchItems();
        } catch (e) {
            const errors = e?.response?.data?.errors;
            if (errors) {
                const first = Object.values(errors)?.[0]?.[0];
                toast.error(first || "Validation failed");
            } else {
                toast.error(e?.response?.data?.message || "Update failed.");
            }
        }
    };

    const handleActivate = async (id) => {
        try {
            await axios.post(`/admin/computations/${id}/set-active`);
            toast.success("Activated.");
            fetchItems();
        } catch (e) {
            const errors = e?.response?.data?.errors;
            if (errors) {
                const first = Object.values(errors)?.[0]?.[0];
                toast.error(first || "Validation failed");
            } else {
                toast.error(e?.response?.data?.message || "Activate failed.");
            }
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this computation? (Must be inactive)")) return;
        try {
            await axios.delete(`/admin/computations/${id}`);
            toast.success("Deleted.");
            fetchItems();
        } catch (e) {
            const errors = e?.response?.data?.errors;
            if (errors) {
                const first = Object.values(errors)?.[0]?.[0];
                toast.error(first || "Validation failed");
            } else {
                toast.error(e?.response?.data?.message || "Delete failed.");
            }
        }
    };

    return (
        <>
            <Head title="Loan Settings">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="space-y-6">
                    
                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <Settings className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                Loan Computation Settings
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Configure loan formulas, interest rates, and fees.
                            </p>
                        </div>
                        <button
                            onClick={fetchItems}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                        >
                            <RefreshCw size={18} />
                            <span>Refresh</span>
                        </button>
                    </div>

                    {/* FILTER & ADD */}
                    <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-4 shadow-sm transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    Category:
                                </label>
                                <select
                                    className="flex-1 md:flex-none rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white text-sm px-4 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    {/* FIX: Added explicit dark text color to options */}
                                    <option value="ACTIVE_PENSIONER_V1" className="text-slate-900 dark:text-slate-900">
                                        ACTIVE_PENSIONER_V1
                                    </option>
                                    <option value="CDEA" className="text-slate-900 dark:text-slate-900">CDEA</option>
                                </select>
                            </div>
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all"
                            >
                                {showAddForm ? <ChevronUp size={18} /> : <Plus size={18} />}
                                <span>{showAddForm ? "Close Form" : "Add New Computation"}</span>
                            </button>
                        </div>

                        {/* ADD FORM */}
                        <AnimatePresence>
                            {showAddForm && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                        <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2">
                                            <Calculator size={16} /> New Formula Configuration
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <InputGroup label="Title">
                                                <input
                                                    className="input-field"
                                                    placeholder="e.g. Standard Pension Loan"
                                                    value={newRow.title}
                                                    onChange={(e) => setNewRow({ ...newRow, title: e.target.value })}
                                                />
                                            </InputGroup>

                                            <InputGroup label="Category">
                                                <select
                                                    className="input-field"
                                                    value={newRow.category}
                                                    onChange={(e) => setNewRow({ ...newRow, category: e.target.value })}
                                                >
                                                    <option value="ACTIVE_PENSIONER_V1" className="text-slate-900 dark:text-slate-900">ACTIVE_PENSIONER_V1</option>
                                                    <option value="CDEA" className="text-slate-900 dark:text-slate-900">CDEA</option>
                                                </select>
                                            </InputGroup>

                                            <InputGroup label="Term (Months)">
                                                <select
                                                    className="input-field"
                                                    value={newRow.termMonths}
                                                    onChange={(e) => setNewRow({ ...newRow, termMonths: Number(e.target.value) })}
                                                >
                                                    {[60, 48, 36, 24, 12].map((n) => (
                                                        <option key={n} value={n} className="text-slate-900 dark:text-slate-900">{n} Months ({n/12} Years)</option>
                                                    ))}
                                                </select>
                                            </InputGroup>

                                            <InputGroup label="Annual Rate Formula">
                                                <input
                                                    className="input-field font-mono"
                                                    value={newRow.annualRateFormula}
                                                    onChange={(e) => setNewRow({ ...newRow, annualRateFormula: e.target.value })}
                                                />
                                            </InputGroup>

                                            <InputGroup label="Monthly Rate Formula">
                                                <input
                                                    className="input-field font-mono bg-slate-100 dark:bg-white/5 opacity-70"
                                                    readOnly
                                                    value={newRow.monthlyRateFormula}
                                                    onChange={(e) => setNewRow({ ...newRow, monthlyRateFormula: e.target.value })}
                                                />
                                            </InputGroup>

                                            <InputGroup label="Service Fee Formula">
                                                <input
                                                    className="input-field font-mono"
                                                    value={newRow.serviceFeeFormula}
                                                    onChange={(e) => setNewRow({ ...newRow, serviceFeeFormula: e.target.value })}
                                                />
                                            </InputGroup>

                                            <InputGroup label="Insurance Formula">
                                                <input
                                                    className="input-field font-mono"
                                                    value={newRow.insuranceFormula}
                                                    onChange={(e) => setNewRow({ ...newRow, insuranceFormula: e.target.value })}
                                                />
                                            </InputGroup>

                                            <InputGroup label="Advance Interest Formula">
                                                <input
                                                    className="input-field font-mono"
                                                    value={newRow.advanceInterestFormula}
                                                    onChange={(e) => setNewRow({ ...newRow, advanceInterestFormula: e.target.value })}
                                                />
                                            </InputGroup>

                                            <InputGroup label="Effective Rate Formula">
                                                <input
                                                    className="input-field font-mono bg-slate-100 dark:bg-white/5 opacity-70"
                                                    value={newRow.effectiveRateFormula || ""}
                                                    onChange={(e) => setNewRow({ ...newRow, effectiveRateFormula: e.target.value })}
                                                />
                                            </InputGroup>

                                            <div className="md:col-span-3">
                                                <InputGroup label="Notes (Optional)">
                                                    <input
                                                        className="input-field"
                                                        placeholder="Additional remarks..."
                                                        value={newRow.notes}
                                                        onChange={(e) => setNewRow({ ...newRow, notes: e.target.value })}
                                                    />
                                                </InputGroup>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={handleCreate}
                                                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
                                            >
                                                Save Computation
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* TABLE CARD */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm overflow-hidden transition-colors">
                        
                        {/* DESKTOP TABLE */}
                        <div className="hidden xl:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[150px]">Title</th>
                                        <th className="px-4 py-3 w-24">Term</th>
                                        <th className="px-4 py-3 min-w-[100px]">Annual</th>
                                        <th className="px-4 py-3 min-w-[140px]">Service Fee</th>
                                        <th className="px-4 py-3 min-w-[140px]">Insurance</th>
                                        <th className="px-4 py-3 min-w-[140px]">Adv. Interest</th>
                                        <th className="px-4 py-3 text-center w-28">Status</th>
                                        <th className="px-4 py-3 text-center w-40">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                                    {loading ? (
                                        <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Loading configurations...</td></tr>
                                    ) : items.length === 0 ? (
                                        <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No settings found.</td></tr>
                                    ) : (
                                        items.map((row) => (
                                            <EditableRow
                                                key={row.id}
                                                row={row}
                                                onSave={handleUpdate}
                                                onActivate={handleActivate}
                                                onDelete={handleDelete}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE / TABLET CARDS */}
                        <div className="block xl:hidden divide-y divide-slate-100 dark:divide-white/5">
                            {items.map((row) => (
                                <EditableCard
                                    key={row.id}
                                    row={row}
                                    onSave={handleUpdate}
                                    onActivate={handleActivate}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* SHARED STYLES */}
                <style>{`
                    .input-field {
                        width: 100%;
                        padding: 0.5rem 0.75rem;
                        border-radius: 0.5rem;
                        border: 1px solid #e2e8f0;
                        background-color: #fff;
                        font-size: 0.875rem;
                        color: #0f172a;
                        outline: none;
                        transition: all 0.2s;
                    }
                    .dark .input-field {
                        background-color: rgba(255,255,255,0.05);
                        border-color: rgba(255,255,255,0.1);
                        color: #fff;
                    }
                    .input-field:focus {
                        border-color: #10b981;
                        box-shadow: 0 0 0 1px #10b981;
                    }
                `}</style>
            </AdminSidebarLayout>
        </>
    );
}

// --- DESKTOP ROW COMPONENT ---
function EditableRow({ row, onSave, onActivate, onDelete }) {
    const [edit, setEdit] = useState({ ...row });
    useEffect(() => setEdit({ ...row }), [row]);

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <td className="px-4 py-3"><input className="input-field" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></td>
            <td className="px-4 py-3">
                <select className="input-field" value={edit.termMonths} onChange={(e) => setEdit({ ...edit, termMonths: Number(e.target.value) })}>
                    {[60, 48, 36, 24, 12].map(n => <option key={n} value={n} className="text-slate-900 dark:text-slate-900">{n}</option>)}
                </select>
            </td>
            <td className="px-4 py-3"><input className="input-field font-mono text-xs" value={edit.annualRateFormula} onChange={(e) => setEdit({ ...edit, annualRateFormula: e.target.value })} /></td>
            <td className="px-4 py-3"><input className="input-field font-mono text-xs" value={edit.serviceFeeFormula} onChange={(e) => setEdit({ ...edit, serviceFeeFormula: e.target.value })} /></td>
            <td className="px-4 py-3"><input className="input-field font-mono text-xs" value={edit.insuranceFormula} onChange={(e) => setEdit({ ...edit, insuranceFormula: e.target.value })} /></td>
            <td className="px-4 py-3"><input className="input-field font-mono text-xs" value={edit.advanceInterestFormula} onChange={(e) => setEdit({ ...edit, advanceInterestFormula: e.target.value })} /></td>
            
            <td className="px-4 py-3 text-center">
                {row.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                        <ToggleRight size={14} /> Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400">
                        <ToggleLeft size={14} /> Inactive
                    </span>
                )}
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onSave(edit)} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition" title="Save Changes"><Save size={16} /></button>
                    {!row.isActive && (
                        <>
                            <button onClick={() => onActivate(row.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition" title="Activate"><ToggleLeft size={16} /></button>
                            <button onClick={() => onDelete(row.id)} className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition" title="Delete"><Trash2 size={16} /></button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

// --- MOBILE CARD COMPONENT ---
function EditableCard({ row, onSave, onActivate, onDelete }) {
    const [edit, setEdit] = useState({ ...row });
    useEffect(() => setEdit({ ...row }), [row]);

    return (
        <div className="p-5 space-y-4">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Title</label>
                    <input className="input-field font-semibold" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
                </div>
                <div className="ml-4">
                    {row.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">Active</span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400">Inactive</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Term (Mos)</label>
                    <select className="input-field" value={edit.termMonths} onChange={(e) => setEdit({ ...edit, termMonths: Number(e.target.value) })}>
                        {[60, 48, 36, 24, 12].map(n => <option key={n} value={n} className="text-slate-900 dark:text-slate-900">{n}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Annual Rate</label>
                    <input className="input-field font-mono text-xs" value={edit.annualRateFormula} onChange={(e) => setEdit({ ...edit, annualRateFormula: e.target.value })} />
                </div>
            </div>

            <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Service Fee Formula</label>
                <input className="input-field font-mono text-xs" value={edit.serviceFeeFormula} onChange={(e) => setEdit({ ...edit, serviceFeeFormula: e.target.value })} />
            </div>

            <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Insurance Formula</label>
                <input className="input-field font-mono text-xs" value={edit.insuranceFormula} onChange={(e) => setEdit({ ...edit, insuranceFormula: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => onSave(edit)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow hover:bg-emerald-500 transition">Save Changes</button>
                {!row.isActive && (
                    <>
                        <button onClick={() => onActivate(row.id)} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow hover:bg-blue-500 transition">Activate</button>
                        <button onClick={() => onDelete(row.id)} className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold shadow hover:bg-rose-500 transition">Delete</button>
                    </>
                )}
            </div>
        </div>
    );
}

function InputGroup({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 uppercase tracking-wide">{label}</label>
            {children}
        </div>
    );
}