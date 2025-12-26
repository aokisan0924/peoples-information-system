import React, { useEffect, useState } from "react";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import { 
    Save, UserPlus, Search, ShieldCheck, MapPin, 
    Mail, Lock, User, X, Edit, Calendar, CheckCircle2, Circle, CheckSquare 
} from "lucide-react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

// DEFINED PERMISSIONS
const PERMISSIONS_LIST = [
    { id: 'view_loans', label: 'View Loans', desc: 'Read-only access to loan tables and details.' },
    { id: 'process_loans', label: 'Process Loans', desc: 'Create, approve, decline, and release loans.' },
    { id: 'manage_members', label: 'Manage Members', desc: 'Add, edit, and view member profiles.' },
    { id: 'manage_deposits', label: 'Manage Deposits', desc: 'Access Share Capital, Savings, and Time Deposits.' },
    { id: 'view_reports', label: 'View Reports', desc: 'Access analytics and generated PDF reports.' },
];

// DEFAULT PRESETS
const ROLE_PRESETS = {
    'super-admin': ['view_loans', 'process_loans', 'manage_members', 'manage_deposits', 'view_reports'],
    'loan-processor': ['view_loans', 'process_loans', 'manage_members', 'manage_deposits'],
    'cashier': ['view_loans', 'manage_members', 'manage_deposits'], // Note: No process_loans
    'admin-officer': ['view_loans', 'manage_members', 'manage_deposits', 'view_reports'],
};

export default function ManageAdmins({ admins }) {
    const { auth } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adminToEdit, setAdminToEdit] = useState(null);
    const [search, setSearch] = useState("");

    // Security Check
    useEffect(() => {
        if ((auth?.user?.role || "").toLowerCase() !== 'super-admin') {
            toast.error("Unauthorized access.");
            router.visit(route('admin.dashboard'));
        }
    }, [auth]);

    const filteredAdmins = admins.filter(admin => 
        admin.name.toLowerCase().includes(search.toLowerCase()) ||
        admin.email.toLowerCase().includes(search.toLowerCase())
    );

    const openCreateModal = () => { setAdminToEdit(null); setIsModalOpen(true); };
    const openEditModal = (admin) => { setAdminToEdit(admin); setIsModalOpen(true); };

    if ((auth?.user?.role || "").toLowerCase() !== 'super-admin') return null;

    return (
        <>
            <Head title="Manage Admins">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ShieldCheck className="h-7 w-7 text-emerald-600" /> Admin Management
                            </h1>
                            <p className="text-sm text-slate-500">Manage staff access and granular permissions.</p>
                        </div>
                        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-semibold shadow-lg shadow-emerald-500/20 transition-all">
                            <UserPlus size={18} /> Add New Admin
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input type="text" placeholder="Search admins..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Branch</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {filteredAdmins.map(admin => (
                                        <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{admin.name}</div>
                                                <div className="text-xs text-slate-500">{admin.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-300 uppercase">
                                                    {admin.role.replace('-', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{admin.branch}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => openEditModal(admin)} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                                                    <Edit size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isModalOpen && <AdminFormModal adminToEdit={adminToEdit} onClose={() => setIsModalOpen(false)} />}
                </AnimatePresence>
            </AdminSidebarLayout>
        </>
        
    );
}

function AdminFormModal({ adminToEdit, onClose }) {
    const isEditing = !!adminToEdit;
    
    // Determine initial permissions
    // If editing, use DB value. If creating, use default loan-processor preset.
    const initialPermissions = isEditing 
        ? (Array.isArray(adminToEdit.permissions) ? adminToEdit.permissions : []) 
        : ROLE_PRESETS['loan-processor'];

    const { data, setData, post, patch, processing, errors } = useForm({
        name: adminToEdit?.name || "",
        email: adminToEdit?.email || "",
        password: "",
        password_confirmation: "",
        role: adminToEdit?.role || "loan-processor",
        branch: adminToEdit?.branch || "Main Office",
        permissions: initialPermissions, 
    });

    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        setData(prev => ({
            ...prev,
            role: newRole,
            // Auto-select permissions based on role preset
            permissions: ROLE_PRESETS[newRole] || []
        }));
    };

    const togglePermission = (permId) => {
        const current = data.permissions;
        if (current.includes(permId)) {
            setData("permissions", current.filter(p => p !== permId));
        } else {
            setData("permissions", [...current, permId]);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        const action = isEditing ? patch : post;
        const url = isEditing ? route("admin.update-user", adminToEdit.id) : route("admin.store-user");
        
        action(url, {
            onSuccess: () => { toast.success(isEditing ? "Updated successfully" : "Created successfully"); onClose(); },
            onError: () => toast.error("Please check the form for errors.")
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {isEditing ? <Edit size={18} className="text-emerald-600"/> : <UserPlus size={18} className="text-emerald-600"/>}
                            {isEditing ? "Edit Admin Access" : "Create Admin User"}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Configure user details and system permissions.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition"><X size={20} className="text-slate-500" /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Identity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputGroup label="Full Name" error={errors.name}>
                            <input className="input-field" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Juan Dela Cruz" />
                        </InputGroup>
                        <InputGroup label="Email Address" error={errors.email}>
                            <input className="input-field" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="admin@pmpc.com" />
                        </InputGroup>
                    </div>

                    {/* Role & Branch */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputGroup label="Role Preset" error={errors.role}>
                            <select className="input-field" value={data.role} onChange={handleRoleChange}>
                                <option value="super-admin">Super Admin (Full Access)</option>
                                <option value="loan-processor">Loan Processor</option>
                                <option value="cashier">Cashier</option>
                                <option value="admin-officer">Admin Officer</option>
                            </select>
                        </InputGroup>
                        <InputGroup label="Branch" error={errors.branch}>
                            <select className="input-field" value={data.branch} onChange={e => setData('branch', e.target.value)}>
                                <option value="Main Office">Main Office</option>
                                <option value="Cubao Satellite Office">Cubao Satellite Office</option>
                                <option value="Fort Magsaysay Satellite Office">Fort Magsaysay Satellite Office</option>
                            </select>
                        </InputGroup>
                    </div>

                    {/* Permissions Section - Only show if NOT Super Admin */}
                    {data.role !== 'super-admin' && (
                        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-white/5">
                                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                                    <CheckSquare size={14}/> Page Access
                                </h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">These are pre-selected based on the role, but you can customize them.</p>
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {PERMISSIONS_LIST.map(perm => {
                                    const isChecked = data.permissions.includes(perm.id);
                                    return (
                                        <label 
                                            key={perm.id} 
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                isChecked 
                                                ? "bg-white dark:bg-white/10 border-emerald-500/50 shadow-sm" 
                                                : "border-transparent hover:bg-white dark:hover:bg-white/5"
                                            }`}
                                        >
                                            <div className={`mt-0.5 ${isChecked ? "text-emerald-600" : "text-slate-300 dark:text-slate-600"}`}>
                                                {isChecked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                checked={isChecked}
                                                onChange={() => togglePermission(perm.id)}
                                            />
                                            <div>
                                                <p className={`text-sm font-semibold ${isChecked ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{perm.label}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{perm.desc}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <hr className="border-slate-100 dark:border-white/10" />

                    {/* Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputGroup label={isEditing ? "New Password (Optional)" : "Password"} error={errors.password}>
                            <input type="password" className="input-field" value={data.password} onChange={e => setData('password', e.target.value)} placeholder={isEditing ? "Leave blank to keep current" : "••••••••"} />
                        </InputGroup>
                        <InputGroup label="Confirm Password" error={errors.password_confirmation}>
                            <input type="password" className="input-field" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} placeholder={isEditing ? "Leave blank to keep current" : "••••••••"} />
                        </InputGroup>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-white/5">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition">Cancel</button>
                    <button onClick={submit} disabled={processing} className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                        {isEditing ? "Save Changes" : "Create Account"}
                    </button>
                </div>
            </motion.div>

            <style>{`
                .input-field { width: 100%; padding: 0.6rem 0.8rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; background: #fff; color: #0f172a; font-size: 0.875rem; outline: none; transition: all 0.2s; }
                .dark .input-field { background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: #fff; }
                .input-field:focus { border-color: #10b981; box-shadow: 0 0 0 1px #10b981; }
                .dark option { background-color: #0f172a; }
            `}</style>
        </div>
    );
}

function InputGroup({ label, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">{label}</label>
            {children}
            {error && <p className="text-xs text-rose-500 ml-1">{error}</p>}
        </div>
    );
}