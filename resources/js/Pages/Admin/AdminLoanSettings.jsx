import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Plus, Save, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';

export default function AdminLoanSettings() {
    const [ loading, setLoading ] = useState(false);
    const [ items, setItems ] = useState([]);
    const [ categoryFilter, setCategoryFilter ] = useState('ACTIVE_PENSIONER_V1');

    const [ newRow, setNewRow ] = useState({
        title: 'New Computation',
        category: 'ACTIVE_PENSIONER_V1',
        termMonths: 60,
        annualRateFormula: '0.09',
        monthlyRateFormula: 'annualInterestRate/12',
        serviceFeeFormula: 'netProceeds*0.121',
        insuranceFormula: '(netProceeds/1000)*terms',
        advanceInterestFormula: 'monthlyInterestRate*netProceeds*advanceInterestMonths',
        effectiveRateFormula: '(1+annualInterestRate/terms)^terms-1',
        isActive: false,
        notes: ''
    });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/admin/computations', { params: { category: categoryFilter } });
            setItems(data.data || []);
        } catch {
            toast.error('Failed to load computations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchItems(); 
    }, [categoryFilter]);

    const handleCreate = async () => {
        try {
            const payload = { ...newRow, category: (newRow.category || '').toUpperCase() };
            await axios.post('/admin/computations', payload);
            toast.success('Computation added.');
            setNewRow({ ...newRow, title: 'New Computation', isActive: false });
            fetchItems();
        } catch (e) {
            const errors = e?.response?.data?.errors;
            if (errors) {
                first = Object.values(errors)?.[0]?.[0];
                toast.error(first || 'Validation failed');
            } else {
                toast.error(e?.response?.data?.message || 'Saving failed.');
            }
        }
    };

    const handleUpdate = async (row) => {
        try {
            const payload = { ...row, category: (row.category || '').toUpperCase() };
            await axios.put(`/admin/computations/${row.id}`, payload);
            toast.success('Saved.');
            fetchItems();
        } catch (e) {
            const errors = e?.response?.data?.errors;
            if (errors) {
                first = Object.values(errors)?.[0]?.[0];
                toast.error(first || 'Validation failed');
            } else {
                toast.error(e?.response?.data?.message || 'Update failed.');
            }
        }
    };

    const handleActivate = async (id) => {
        try {
            await axios.post(`/admin/computations/${id}/set-active`);
            toast.success('Activated.');
            fetchItems();
        } catch (e) {
            const errors = e?.response?.data?.errors;
            if (errors) {
                first = Object.values(errors)?.[0]?.[0];
                toast.error(first || 'Validation failed');
            } else {
                toast.error(e?.response?.data?.message || 'Activate failed.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this computation? (Must be inactive)')) return;
        try {
            await axios.delete(`/admin/computations/${id}`);
            toast.success('Deleted.');
            fetchItems();
        } catch (e) {
            const errors = e?.response?.data?.errors;
            if (errors) {
                first = Object.values(errors)?.[0]?.[0];
                toast.error(first || 'Validation failed');
            } else {
                toast.error(e?.response?.data?.message || 'Delete failed.');
            }
        }
    };

    return (
        <>
            <Head title="Loan Settings">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold mb-6 text-green-600">Loan Computation Settings</h1>
                        <button 
                            onClick={fetchItems} 
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-gray-50">
                            <RefreshCw size={16} /> Refresh
                        </button>
                    </div>

                    {/* Filter */}
                    <div className="mb-6 flex items-center gap-3">
                        <label className="text-sm text-gray-600">Category</label>
                        <select 
                            className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="ACTIVE_PENSIONER_V1">ACTIVE_PENSIONER_V1</option>
                            <option value="CDEA">CDEA</option>
                        </select>
                    </div>

                    {/* Add new */}
                    <div className="bg-white rounded-xl shadow p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-2">
                            <input 
                                className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                                placeholder="Title" 
                                value={newRow.title} 
                                onChange={(e) => setNewRow({ ...newRow, title: e.target.value })} 
                            />
                            
                            <select 
                                className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                                value={newRow.category} 
                                onChange={(e) => setNewRow({ ...newRow, category: e.target.value.toUpperCase() })}
                            >

                                <option value="ACTIVE_PENSIONER_V1">ACTIVE_PENSIONER_V1</option>
                                <option value="CDEA">CDEA</option>
                            </select>

                            <select 
                                className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                                value={newRow.termMonths} 
                                onChange={(e) => setNewRow({ ...newRow, termMonths: 
                                Number(e.target.value) })}
                            >
                                <option value={60}>60</option>
                                <option value={48}>48</option>
                                <option value={36}>36</option>
                                <option value={24}>24</option>
                                <option value={12}>12</option>
                            </select>

                            <input 
                                className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500 " 
                                placeholder="annualRateFormula" 
                                readOnly 
                                value={newRow.annualRateFormula} 
                                onChange={(e) => setNewRow({ ...newRow, annualRateFormula: e.target.value })} 
                            />

                            <input 
                                className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500 " 
                                placeholder="monthlyRateFormula" 
                                readOnly 
                                value={newRow.monthlyRateFormula} 
                                onChange={(e) => setNewRow({ ...newRow, monthlyRateFormula: e.target .value })} 
                            />

                            <input 
                                className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                                placeholder="serviceFeeFormula" 
                                readOnly 
                                value={newRow.serviceFeeFormula} 
                                onChange={(e) => setNewRow({ ...newRow, serviceFeeFormula: e.target .value })} 
                            />

                            <input 
                                className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                                placeholder="insuranceFormula" 
                                readOnly 
                                value={newRow.insuranceFormula} 
                                onChange={(e) => setNewRow({ ...newRow, insuranceFormula: e.target .value })} 
                            />

                            <input 
                                className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                                placeholder="advanceInterestFormula" 
                                readOnly 
                                value={newRow.advanceInterestFormula} 
                                onChange={(e) => setNewRow({ ...newRow, advanceInterestFormula: e.target .value })} 
                            />

                            <input 
                                className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                                placeholder="effectiveRateFormula (optional)" 
                                readOnly 
                                value={newRow.effectiveRateFormula} 
                                onChange={(e) => setNewRow({ ...newRow, effectiveRateFormula: e.target.value })} 
                            />

                            <input 
                                className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                                placeholder="Notes (optional)" 
                                value={newRow.notes} 
                                onChange={(e) => setNewRow({ ...newRow, notes: e.target.value })} 
                            />
                        </div>

                        <div className="mt-4">
                            <button 
                                onClick={handleCreate} 
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2"
                            >
                                <Plus size={16} /> Add Computation
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr className="text-left text-xs uppercase tracking-wider text-gray-600">
                                        <th className="px-3 py-2">Title</th>
                                        <th className="px-3 py-2">Term</th>
                                        <th className="px-3 py-2">Annual</th>
                                        <th className="px-3 py-2">Monthly</th>
                                        <th className="px-3 py-2">Service Fee</th>
                                        <th className="px-3 py-2">Insurance</th>
                                        <th className="px-3 py-2">Advance Int</th>
                                        <th className="px-3 py-2">Effective</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {items.map((row) => (
                                        <EditableRow
                                            key={row.id}
                                            row={row}
                                            onSave={handleUpdate}
                                            onActivate={handleActivate}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                    {items.length === 0 && !loading && (
                                        <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={10}>No computations found.</td></tr>
                                    )}
                                    {loading && (
                                        <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={10}>Loading…</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminSidebarLayout>
        </>
    );
    }

    function EditableRow({ row, onSave, onActivate, onDelete }) {
    const [edit, setEdit] = useState({ ...row });

    useEffect(() => setEdit({ ...row }), [row]);

    return (
        <tr>
            <td className="px-3 py-2">
                <input className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            </td>

            <td className="px-3 py-2">
                <select 
                    className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                    value={edit.termMonths} 
                    onChange={(e) => setEdit({ ...edit, termMonths: Number(e.target.value) })}
                >
                    {[60,48,36,24,12].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </td>

            <td className="px-3 py-2">
                <input 
                    className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                    value={edit.annualRateFormula} 
                    onChange={(e) => setEdit({ ...edit, annualRateFormula: e.target.value })} 
                />
            </td>

            <td className="px-3 py-2">
                <input 
                    className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                    value={edit.monthlyRateFormula} 
                    onChange={(e) => setEdit({ ...edit, monthlyRateFormula: e.target.value })} 
                    readOnly
                />
            </td>

            <td className="px-3 py-2">
                <input 
                    className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                    value={edit.serviceFeeFormula} 
                    onChange={(e) => setEdit({ ...edit, serviceFeeFormula: e.target.value })} 
                />
            </td>

            <td className="px-3 py-2">
                <input 
                    className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                    value={edit.insuranceFormula} 
                    onChange={(e) => setEdit({ ...edit, insuranceFormula: e.target.value })}
                    readOnly 
                />
            </td>

            <td className="px-3 py-2">
                <input 
                    className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                    value={edit.advanceInterestFormula} 
                    onChange={(e) => setEdit({ ...edit, advanceInterestFormula: e.target.value })}
                    readOnly
                />
            </td>

            <td className="px-3 py-2">
                <input 
                    className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500" 
                    value={edit.effectiveRateFormula || ''} 
                    onChange={(e) => setEdit({ ...edit, effectiveRateFormula: e.target.value })} 
                    readOnly
                />
            </td>

            <td className="px-3 py-2">
                {row.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-sm"><ToggleRight size={16} /> Active</span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-200 text-gray-700 px-3 py-1.5 text-sm"><ToggleLeft size={16} /> Inactive</span>
                )}
            </td>

            <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => onSave(edit)} 
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-sm"
                    >
                        <Save size={16} /> Save
                    </button>
                    {!row.isActive && (
                        <button 
                            onClick={() => onActivate(row.id)} 
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 text-sm"
                        >
                            <ToggleLeft size={16} /> Activate
                        </button>
                    )}
                    
                    {!row.isActive && (
                        <button 
                            onClick={() => onDelete(row.id)} 
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-sm"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}
