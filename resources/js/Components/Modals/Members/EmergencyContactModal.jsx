
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

export const EmergencyContactModal = ({ member, onClose }) => {
    const { data, setData, post, processing, errors } = useForm({
        contactPersonName: member.emergency_contact.contactPersonName || '',
        contactPersonAddress: member.emergency_contact.contactPersonAddress || '',
        contactPersonPhone: member.emergency_contact.contactPersonPhone || '',
        contactPersonRelation: member.emergency_contact.contactPersonRelation || '',
});

const submit = (e) => {
    e.preventDefault();
    post(route('admin.members.update-emergency-info', { id: member.id }), {
        preserveScroll: true,
        onSuccess: () => {
            toast.success('Emergency info updated successfully.');
            onClose();
        },
    });
};

return (
    <ModalWrapper title="Edit Emergency Contact Info" onClose={onClose} onSubmit={submit} processing={processing}>
        <div className="overflow-y-auto max-h-[70vh] px-4 pb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 tracking-wide">Emergency Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Contact Person Name</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.contactPersonName}
                        onChange={(e) => setData('contactPersonName', e.target.value)}
                    />
                    {errors.contactPersonName && <p className="text-xs text-red-500">{errors.contactPersonName}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Relationship</label>
                    <select
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.contactPersonRelation}
                        onChange={(e) => setData('contactPersonRelation', e.target.value)}
                    >
                        <option value="">Select Relationship</option>
                        <option value="Parent">Parent</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Relative">Relative</option>
                        <option value="Colleague">Colleague</option>
                    </select>
                    {errors.contactPersonRelation && <p className="text-xs text-red-500">{errors.contactPersonRelation}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Address</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.contactPersonAddress}
                        onChange={(e) => setData('contactPersonAddress', e.target.value)}
                    />
                    {errors.contactPersonAddress && <p className="text-xs text-red-500">{errors.contactPersonAddress}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Contact No.</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.contactPersonPhone}
                        onChange={(e) => setData('contactPersonPhone', e.target.value)}
                    />
                    {errors.contactPersonPhone && <p className="text-xs text-red-500">{errors.contactPersonPhone}</p>}
                </div>
            </div>
        </div>
    </ModalWrapper>
    );
};
