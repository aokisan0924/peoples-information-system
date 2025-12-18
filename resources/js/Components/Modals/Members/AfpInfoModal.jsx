
import React from "react";
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

export const AfpInfoModal = ({ member, onClose }) => {
    const { data, setData, post, processing, errors } = useForm({
        afpsn: member.afp_info.afpsn || '',
        rank: member.afp_info.rank || '',
        designation: member.afp_info.designation || '',
        afpId: member.afp_info.afpId || '',
        presentAssignment: member.afp_info.presentAssignment || '',
        controlNo: member.afp_info.controlNo || '', 
        yearsInService: member.afp_info.yearsInService || '',
        cadEnlistment: member.afp_info.cadEnlistment || '',
        retirementDate: member.afp_info.retirementDate || '',
        pensionDate: member.afp_info.pensionDate || ''
});

const submit = (e) => {
    e.preventDefault();
    post(route('admin.update-afp-info', { encrypted: member.encrypted }), {
        preserveScroll: true,
        onSuccess: () => {
            toast.success('AFP Info updated successfully.');
            onClose();
        },
    });
};

return (
    <ModalWrapper title="Edit AFP Info" onClose={onClose} onSubmit={submit} processing={processing}>
        <div className="overflow-y-auto max-h-[70vh] px-4 pb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 tracking-wide">AFP Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">AFPSN</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.afpsn}
                        onChange={(e) => setData('afpsn', e.target.value)}
                    />
                    {errors.afpsn && <p className="text-xs text-red-500">{errors.afpsn}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Rank</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.rank}
                        onChange={(e) => setData('rank', e.target.value)}
                    />
                    {errors.rank && <p className="text-xs text-red-500">{errors.rank}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Designation</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.designation}
                        onChange={(e) => setData('designation', e.target.value)}
                    />
                    {errors.designation && <p className="text-xs text-red-500">{errors.designation}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">AFP ID</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.afpId}
                        onChange={(e) => setData('afpId', e.target.value)}
                    />
                    {errors.afpId && <p className="text-xs text-red-500">{errors.afpId}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Present Assignment</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.presentAssignment}
                        onChange={(e) => setData('presentAssignment', e.target.value)}
                    />
                    {errors.presentAssignment && <p className="text-xs text-red-500">{errors.presentAssignment}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Control No</label>
                    <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.controlNo}
                        onChange={(e) => setData('controlNo', e.target.value)}
                    />
                    {errors.controlNo && <p className="text-xs text-red-500">{errors.controlNo}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Years in Service</label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.yearsInService}
                        onChange={(e) => setData('yearsInService', e.target.value)}
                    />
                    {errors.yearsInService && <p className="text-xs text-red-500">{errors.yearsInService}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">CAD Enlistment Date</label>
                    <input
                        type="date"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.cadEnlistment}
                        onChange={(e) => setData('cadEnlistment', e.target.value)}
                    />
                    {errors.cadEnlistment && <p className="text-xs text-red-500">{errors.cadEnlistment}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Retirement Date</label>
                    <input
                        type="date"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.retirementDate}
                        onChange={(e) => setData('retirementDate', e.target.value)}
                    />
                    {errors.retirementDate && <p className="text-xs text-red-500">{errors.retirementDate}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Pension Date</label>
                    <input
                        type="date"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                        value={data.retirementDate}
                        onChange={(e) => setData('retirementDate', e.target.value)}
                    />
                    {errors.retirementDate && <p className="text-xs text-red-500">{errors.retirementDate}</p>}
                </div>
            </div>
        </div>
    </ModalWrapper>
    );
};
