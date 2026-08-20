
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

export const ParentsModal = ({ member, onClose }) => {
    const { data, setData, post, processing, errors } = useForm({
        fatherName: member.parents_info.fatherName || '',
        fatherAge: member.spouse_info.fatherAge || '',
        motherName: member.parents_info.motherName || '',
        motherAge: member.spouse_info.motherAge || '',
});


const submit = (e) => {
    e.preventDefault();
    post(route('admin.members.update-parents-info', { id: member.id }), {
        preserveScroll: true,
        onSuccess: () => {
            toast.success('Parents info updated successfully.');
            onClose();
        },
    });
};

return (
    <ModalWrapper title="Edit Parents Info" onClose={onClose} onSubmit={submit} processing={processing}>
        <div className="overflow-y-auto max-h-[70vh] px-4 pb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 tracking-wide">Parents Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Father's Name</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.fatherName}
                        onChange={(e) => setData('fatherName', e.target.value)}
                    />
                    {errors.fatherName && <p className="text-xs text-red-500">{errors.fatherName}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Father's Age</label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.fatherAge}
                        onChange={(e) => setData('fatherAge', e.target.value)}
                    />
                    {errors.fatherAge && <p className="text-xs text-red-500">{errors.fatherAge}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Mother's Name</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.motherName}
                        onChange={(e) => setData('motherName', e.target.value)}
                    />
                    {errors.motherName && <p className="text-xs text-red-500">{errors.motherName}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Mother's Age</label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.motherAge}
                        onChange={(e) => setData('motherAge', e.target.value)}
                    />
                    {errors.motherAge && <p className="text-xs text-red-500">{errors.motherAge}</p>}
                </div>
            </div>
        </div>
    </ModalWrapper>
    );
};
