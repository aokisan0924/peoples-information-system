
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

export const BasicInfoModal = ({ member, onClose }) => {
    const { data, setData, post, processing, errors } = useForm({
        firstName: member.firstName || '',
        middleName: member.middleName || '',
        lastName: member.lastName || '',
        suffix: member.suffix || '',
        nickname: member.nickname || '',
        gender: member.gender || '',
        dob: member.dob || '',
        religion: member.religion || '',
        civilStatus: member.civilStatus || '',
        nationality: member.nationality || '',
        email: member.email || '',
        contact: member.contact || '',
        fullAddress: member.fullAddress || '',
});

const submit = (e) => {
    e.preventDefault();
    post(route('admin.members.update-basic-info', { id: member.id }), {
        preserveScroll: true,
        onSuccess: () => {
            toast.success('Basic Info updated successfully.');
            onClose();
        },
    });
};

return (
    <ModalWrapper title="Edit Basic Info" onClose={onClose} onSubmit={submit} processing={processing}>
        <div className="overflow-y-auto max-h-[70vh] px-4 pb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 tracking-wide">Name Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">First Name</label>
                    <input type="text" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.firstName} onChange={(e) => setData('firstName', e.target.value)} />
                    {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Last Name</label>
                    <input type="text" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.lastName} onChange={(e) => setData('lastName', e.target.value)} />
                    {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Middle Name</label>
                    <input type="text" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.middleName} onChange={(e) => setData('middleName', e.target.value)} />
                    {errors.middleName && <p className="text-xs text-red-500">{errors.middleName}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Suffix</label>
                    <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.suffix} onChange={(e) => setData('suffix', e.target.value)}>
                        <option value="">Select Suffix</option>
                        <option value="Jr.">Jr.</option>
                        <option value="Sr.">Sr.</option>
                        <option value="I">I</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                    </select>
                    {errors.suffix && <p className="text-xs text-red-500">{errors.suffix}</p>}
                </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 tracking-wide">Personal Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Nickname</label>
                    <input type="text" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.nickname} onChange={(e) => setData('nickname', e.target.value)} />
                    {errors.nickname && <p className="text-xs text-red-500">{errors.nickname}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Gender</label>
                    <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.gender} onChange={(e) => setData('gender', e.target.value)}>
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="MALE">Female</option>
                    </select>
                    {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Date of Birth</label>
                    <input type="date" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.dob} onChange={(e) => setData('dob', e.target.value)} />
                    {errors.dob && <p className="text-xs text-red-500">{errors.dob}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Religion</label>
                    <input type="text" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.religion} onChange={(e) => setData('religion', e.target.value)} />
                    {errors.religion && <p className="text-xs text-red-500">{errors.religion}</p>}
                </div>

                <div className="md:col-span-2 space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Nationality</label>
                    <input type="text" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.nationality} onChange={(e) => setData('nationality', e.target.value)} />
                    {errors.nationality && <p className="text-xs text-red-500">{errors.nationality}</p>}
                </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 tracking-wide">Contact Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <input type="email" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Contact</label>
                    <input type="text" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.contact} onChange={(e) => setData('contact', e.target.value)} />
                    {errors.contact && <p className="text-xs text-red-500">{errors.contact}</p>}
                </div>

                <div className="md:col-span-2 space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Full Address</label>
                    <textarea rows="2" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={data.fullAddress} onChange={(e) => setData('fullAddress', e.target.value)} />
                    {errors.fullAddress && <p className="text-xs text-red-500">{errors.fullAddress}</p>}
                </div>
            </div>
        </div>
    </ModalWrapper>
    );
};
