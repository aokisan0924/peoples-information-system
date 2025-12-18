
import React, { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import toast from "react-hot-toast";

const ModalWrapper = ({ title, children, onClose, onSubmit, processing }) => (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl w-full max-w-3xl shadow-xl border border-gray-200">
            <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h2>
    
                <form onSubmit={onSubmit} className="space-y-6">
                    {children}
                    <div className="flex justify-end gap-3 border-t pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
            
                        <button
                            type="submit"
                            disabled={processing}
                            className={`inline-flex items-center px-5 py-2 text-sm font-medium rounded-md shadow-sm transition-colors duration-150 ${
                            processing
                                ? 'bg-green-400 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                        >
                            {processing ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
);

const emptyDependents = () => ({
    name: '',
    dob: '',
    gender: '',
});

export const DependentsModal = ({ member, onClose }) => {
    const { data, setData, post, processing, errors } = useForm({
        dependents: member.dependents?.length > 0
        ? member.dependents.map(dep => ({
            id: dep.id || null,
            name: dep.name || '',
            dob: dep.dob || '',
            gender: dep.gender || '',
        }))
        : [emptyDependents()],
    });

    const updateField = (index, field, value) => {
        const updated = [...data.dependents];
        updated[index][field] = value;
        setData('dependents', updated);
    };

    const addDependent = () => {
        setData('dependents', [...data.dependents, emptyDependents()]);
    };

    const removeDependent = (index) => {
        const updated = [...data.dependents];
        updated.splice(index, 1);
        setData('dependents', updated.length > 0 ? updated : [emptyDependents()]);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.update-dependents-info', { encrypted: member.encrypted }), {
            preserveScroll: true,
            onSuccess: () => {
            toast.success('Dependents updated successfully.');
            onClose();
            },
        });
    };

return (
    <ModalWrapper title="Edit Emergency Contact Info" onClose={onClose} onSubmit={submit} processing={processing}>
        <div className="overflow-y-auto max-h-[70vh] px-4 pb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 tracking-wide">Dependents</h3>
            <div className="space-y-6">
            {data.dependents.map((dep, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end border p-4 rounded-md bg-gray-50">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700">Full Name</label>
                        <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={dep.name}
                        onChange={(e) => updateField(index, 'name', e.target.value)}
                        />
                        {errors[`dependents.${index}.name`] && <p className="text-xs text-red-500">{errors[`dependents.${index}.name`]}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700">Date of Birth</label>
                        <input
                        type="date"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={dep.dateOfBirth}
                        onChange={(e) => updateField(index, 'dateOfBirth', e.target.value)}
                        />
                        {errors[`dependents.${index}.dateOfBirth`] && <p className="text-xs text-red-500">{errors[`dependents.${index}.dateOfBirth`]}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700">Gender</label>
                        <select
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={dep.gender}
                        onChange={(e) => updateField(index, 'gender', e.target.value)}
                        >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        </select>
                        {errors[`dependents.${index}.gender`] && <p className="text-xs text-red-500">{errors[`dependents.${index}.gender`]}</p>}
                    </div>

                    <div className="col-span-1 md:col-span-3 text-right">
                        <button
                        type="button"
                        onClick={() => removeDependent(index)}
                        className="text-sm text-red-600 hover:underline"
                        >
                        Remove
                        </button>
                    </div>
                </div>
            ))}

                <button
                    type="button"
                    onClick={addDependent}
                    className="text-sm font-medium text-green-600 hover:underline"
                >
                    + Add Dependent
                </button>
            </div>
        </div>
    </ModalWrapper>
    );
};