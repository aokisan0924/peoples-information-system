import React, { useEffect, useState } from "react";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import { 
    UserPlus, Search, ShieldCheck, Edit, CheckCircle2, Circle, CheckSquare, Loader2, X
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
    { id: 'manage_accounting', label: 'Manage Accounting', desc: 'Full access to General Ledger & Chart of Accounts.' },
    { id: 'access_bank', label: 'Access Bank Records', desc: 'Manage bank deposits and transfers.' }, 
    { id: 'access_cash_tools', label: 'Access Cash Tools', desc: 'Manage Petty Cash and E-Wallet logs.' }, 
];

// DEFAULT PRESETS
const ROLE_PRESETS = {
    'super-admin': ['view_loans', 'process_loans', 'manage_members', 'manage_deposits', 'view_reports', 'manage_accounting', 'access_bank', 'access_cash_tools'],
    'accounting-clerk': ['manage_accounting', 'access_bank', 'access_cash_tools'], 
    'bookkeeper': ['access_bank', 'access_cash_tools'],
    'loan-processor-cashier': ['access_cash_tools', 'view_loans', 'manage_members'],
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
                    
                    {/* --- HEADER --- */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ShieldCheck className="h-8 w-8 text-emerald-600" /> 
                                Admin Management
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Manage staff access and granular permissions.
                            </p>
                        </div>
                        <button 
                            onClick={openCreateModal} 
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-50 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                            <UserPlus size={18} /> 
                            <span>Add New Admin</span>
                        </button>
                    </div>

                    {/* --- SEARCH BAR --- */}
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search by name or email..." 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all" 
                            />
                        </div>
                    </div>

                    {/* --- DATA DISPLAY --- */}
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
                        
                        {/* 1. DESKTOP TABLE */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">User Details</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Branch</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                                    {filteredAdmins.length === 0 ? (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-500">No admins found.</td></tr>
                                    ) : (
                                        filteredAdmins.map(admin => (
                                            <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                                                            {admin.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white">{admin.name}</div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{admin.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                                        admin.role === 'super-admin' 
                                                        ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20' 
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10'
                                                    }`}>
                                                        {admin.role.replace(/-/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                    {admin.branch}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => openEditModal(admin)} 
                                                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit size={18}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 2. MOBILE CARD LIST */}
                        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-white/5">
                            {filteredAdmins.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400">No admins found.</div>
                            ) : (
                                filteredAdmins.map(admin => (
                                    <div key={admin.id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm shrink-0">
                                                    {admin.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 dark:text-white truncate">{admin.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{admin.email}</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => openEditModal(admin)} 
                                                className="p-2 rounded-lg bg-slate-50 dark:bg-white/10 text-slate-500 hover:text-emerald-600 transition-colors shrink-0"
                                            >
                                                <Edit size={18}/>
                                            </button>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 text-xs pt-2 border-t border-slate-50 dark:border-white/5">
                                            <div className="px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-medium">
                                                {admin.role.replace(/-/g, ' ')}
                                            </div>
                                            <div className="px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                {admin.branch}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
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
    const initialPermissions = isEditing 
        ? (Array.isArray(adminToEdit.permissions) ? adminToEdit.permissions : []) 
        : ROLE_PRESETS['loan-processor-cashier'];

    const { data, setData, post, patch, processing, errors } = useForm({
        name: adminToEdit?.name || "",
        email: adminToEdit?.email || "",
        password: "",
        password_confirmation: "",
        // If editing an old 'loan-processor' or 'cashier', force them into the new merged state in the form
        role: (adminToEdit?.role === 'loan-processor' || adminToEdit?.role === 'cashier') ? 'loan-processor-cashier' : (adminToEdit?.role || "loan-processor-cashier"),
        branch: adminToEdit?.branch || "Main Office",
        permissions: initialPermissions, 
    });

    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        setData(prev => ({
            ...prev,
            role: newRole,
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
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {isEditing ? <Edit size={18} className="text-emerald-600"/> : <UserPlus size={18} className="text-emerald-600"/>}
                            {isEditing ? "Edit Admin Access" : "Create Admin User"}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Configure user details and system permissions.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition"><X size={20} className="text-slate-500" /></button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                                <option value="accounting-clerk">Accounting Clerk</option>
                                <option value="bookkeeper">Bookkeeper</option>
                                <option value="loan-processor-cashier">Loan Processor / Cashier</option> {/* MERGED */}
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
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{perm.desc}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-100 dark:border-white/10 pt-2"></div>

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

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-white/5 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition">Cancel</button>
                    <button onClick={submit} disabled={processing} className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95">
                        {processing && <Loader2 size={16} className="animate-spin" />}
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
        <div className="space-y-1.5 w-full min-w-0">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">{label}</label>
            {children}
            {error && <p className="text-xs text-rose-500 ml-1">{error}</p>}
        </div>
    );
}