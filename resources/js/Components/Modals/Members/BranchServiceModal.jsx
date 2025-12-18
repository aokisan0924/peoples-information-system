
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

const branchOptions = {
    "ACTIVE MILITARY": ["ARMY", "AIR FORCE", "NAVY", "RESERVIST"],
    "RETIRED MILITARY": ["ARMY", "AIR FORCE", "NAVY", "RESERVIST"],
    "BENEFICIARY": ["WIDOW", "DEPENDENT", "PARENTS"],
    "CIVILIAN EMPLOYEES": ["AFFC", "PNFC", "FCPA"],
    "PMPC": ["BOARD OF DIRECTORS", "MANAGEMENT", "STAFF", "PROBATIONARY"],
    "CDEA": []
};

export const BranchServiceModal = ({ member, onClose }) => {
    const { data, setData, post, processing, errors } = useForm({
        branchService: member.branch_service.branchService || '',
        subBranch: member.branch_service.subBranch || '',
});

const [availableSubBranches, setAvailableSubBranches] = useState([]);

useEffect (() => {
    setData({
        branchService: member.branch_service.branchService || '',
        subBranch: member.branch_service.subBranch || '',
    });
}, [member]);

useEffect(() => {
    setAvailableSubBranches(branchOptions[data.branchService] || []);
    if (!branchOptions[data.branchService]?.includes(data.subBranch)) {
        setData('subBranch', '');
    }
}, [data.branchService]);

const submit = (e) => {
    e.preventDefault();
    post(route('admin.update-branch-service', { encrypted: member.encrypted }), {
        preserveScroll: true,
        onSuccess: () => {
            toast.success('Branch Service updated successfully.');
            onClose();
        },
    });
};

return (
    <ModalWrapper title="Edit Branch of Service Info" onClose={onClose} onSubmit={submit} processing={processing}>
        <div className="overflow-y-auto max-h-[70vh] px-4 pb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 tracking-wide">Branch of Service Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Branch of Service</label>
                    <select 
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.branchService}
                        onChange={(e) => setData('branchService', e.target.value)}
                    >
                        <option value="">Select Branch</option>
                        {Object.keys(branchOptions).map(branch => (
                            <option key={branch} value={branch}>{branch}</option>
                        ))}
                    </select>
                    {errors.branchService && <p className="text-xs text-red-500">{errors.branchService}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Sub Branch</label>
                    <select 
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.subBranch}
                        onChange={(e) => setData('subBranch', e.target.value)}
                        disabled={availableSubBranches.length === 0}
                    >
                        <option value="">Select Sub Branch</option>
                        {availableSubBranches.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                    {errors.subBranch && <p className="text-xs text-red-500">{errors.subBranch}</p>}
                </div>
            </div>
        </div>
    </ModalWrapper>
    );
};