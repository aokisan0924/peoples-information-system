
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

export const IdentificationModal = ({ member, onClose }) => {
    const { data, setData, post, processing, errors } = useForm({
        tinNo:  member.identification_info.tinNo || '',
        gsisNo: member.identification_info.gsisNo || '',
        crnUmidNo: member.identification_info.crnUmidNo || '',
});

const formatTin = (value) => {
    const numeric = value.replace(/[^\d]/g, '');

    return numeric
        .slice(0, 9)
        .replace(/(\d{3})(\d{3})(\d{0,3})/, (match, p1, p2, p3) =>
            p3 ? `${p1}-${p2}-${p3}` : `${p1}-${p2}`
        );
}

const formatLongId = (value) => {
    const numeric = value.replace(/[^\d]/g, '');

    return numeric
        .slice(0, 12) // Only keep up to 12 digits
        .replace(
            /^(\d{0,2})(\d{0,9})(\d{0,1})$/,
            (match, p1, p2, p3) => {
                let result = '';
                if (p1) result += p1;
                if (p2) result += `-${p2}`;
                if (p3) result += `-${p3}`;
                return result;
            }
        );
}

const submit = (e) => {
    e.preventDefault();
    post(route('admin.update-identification-info', { encrypted: member.encrypted }), {
        preserveScroll: true,
        onSuccess: () => {
            toast.success('Parents info updated successfully.');
            onClose();
        },
    });
};

return (
    <ModalWrapper title="Edit Identification Info" onClose={onClose} onSubmit={submit} processing={processing}>
        <div className="overflow-y-auto max-h-[70vh] px-4 pb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 tracking-wide">Identification Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">TIN No</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.tinNo}
                        onChange={(e) => setData('tinNo', formatTin(e.target.value))}
                    />
                    {errors.tinNo && <p className="text-xs text-red-500">{errors.tinNo}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">GSIS/SSS No</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.gsisNo}
                        onChange={(e) => setData('gsisNo', formatLongId(e.target.value))}
                    />
                    {errors.gsisNo && <p className="text-xs text-red-500">{errors.gsisNo}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">CRN/UMID No</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.crnUmidNo}
                        onChange={(e) => setData('crnUmidNo', formatLongId(e.target.value))}
                    />
                    {errors.crnUmidNo && <p className="text-xs text-red-500">{errors.crnUmidNo}</p>}
                </div>
            </div>
        </div>
    </ModalWrapper>
    );
};