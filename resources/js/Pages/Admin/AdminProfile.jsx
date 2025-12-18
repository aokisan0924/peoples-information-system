import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Save, User, MapPin, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProfile() {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <AdminSidebarLayout>
            <Head title="My Profile">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        My Profile
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage your account settings and security preferences.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN: Profile Info */}
                    <UpdateProfileInformationForm user={user} />

                    {/* RIGHT COLUMN: Password */}
                    <UpdatePasswordForm />
                </div>
            </div>
        </AdminSidebarLayout>
    );
}

// --- SUB-COMPONENT: Profile Info Form ---
function UpdateProfileInformationForm({ user }) {
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name || '',
        email: user.email || '',
        branch: user.branch || 'Main Office',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.profile.update'), {
            onSuccess: () => toast.success('Profile updated successfully.'),
            onError: () => toast.error('Failed to update profile.'),
        });
    };

    return (
        <section className="p-6 bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 transition-colors">
            <header className="mb-6">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-500" />
                    Profile Information
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Update your account's profile information and assigned branch.
                </p>
            </header>

            <form onSubmit={submit} className="space-y-6">
                {/* Name */}
                <div>
                    <InputLabel label="Full Name" />
                    <input
                        type="text"
                        className="input-field"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} />
                </div>

                {/* Email */}
                <div>
                    <InputLabel label="Email Address" icon={Mail} />
                    <input
                        type="email"
                        className="input-field"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} />
                </div>

                {/* Branch */}
                <div>
                    <InputLabel label="Assigned Branch" icon={MapPin} />
                    <div className="relative">
                        <select
                            className="input-field appearance-none cursor-pointer"
                            value={data.branch}
                            onChange={(e) => setData('branch', e.target.value)}
                        >
                            <option value="Main Office">Main Office</option>
                            <option value="Cubao Satellite Office">Cubao Satellite Office</option>
                            <option value="Fort Magsaysay Satellite Office">Fort Magsaysay Satellite Office</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                            <MapPin size={16} />
                        </div>
                    </div>
                    <InputError message={errors.branch} />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
                    >
                        <Save size={16} />
                        Save Changes
                    </button>

                    {recentlySuccessful && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
                            <CheckCircle2 size={14} /> Saved.
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}

// --- SUB-COMPONENT: Password Form ---
function UpdatePasswordForm() {
    const { data, setData, put, errors, processing, recentlySuccessful, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();
        put(route('admin.password.update'), {
            onSuccess: () => {
                reset();
                toast.success('Password updated.');
            },
            onError: () => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                }
                if (errors.current_password) {
                    reset('current_password');
                }
                toast.error('Failed to update password.');
            },
        });
    };

    return (
        <section className="p-6 bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 transition-colors">
            <header className="mb-6">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-500" />
                    Update Password
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Ensure your account is using a long, random password to stay secure.
                </p>
            </header>

            <form onSubmit={updatePassword} className="space-y-6">
                <div>
                    <InputLabel label="Current Password" />
                    <input
                        type="password"
                        className="input-field"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        placeholder="••••••••"
                    />
                    <InputError message={errors.current_password} />
                </div>

                <div>
                    <InputLabel label="New Password" />
                    <input
                        type="password"
                        className="input-field"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password} />
                </div>

                <div>
                    <InputLabel label="Confirm Password" />
                    <input
                        type="password"
                        className="input-field"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
                    >
                        <Save size={16} />
                        Update Password
                    </button>

                    {recentlySuccessful && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
                            <CheckCircle2 size={14} /> Saved.
                        </p>
                    )}
                </div>
            </form>

            {/* STYLES */}
            <style>{`
                .input-field {
                    width: 100%;
                    padding: 0.65rem 0.9rem;
                    border-radius: 0.75rem;
                    border: 1px solid #e2e8f0;
                    background-color: #ffffff;
                    color: #0f172a;
                    font-size: 0.875rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .dark .input-field {
                    background-color: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.1);
                    color: #ffffff;
                }
                .dark .input-field option {
                    background-color: #0f172a;
                    color: #ffffff;
                }
                .input-field:focus {
                    border-color: #10b981;
                    box-shadow: 0 0 0 1px #10b981;
                }
                .input-field::placeholder {
                    color: #94a3b8;
                }
                .dark .input-field::placeholder {
                    color: rgba(255,255,255,0.3);
                }
            `}</style>
        </section>
    );
}

// --- HELPER COMPONENTS ---
function InputLabel({ label, icon: Icon }) {
    return (
        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 ml-1">
            {Icon && <Icon size={14} className="text-emerald-500" />} {label}
        </label>
    );
}

function InputError({ message }) {
    if (!message) return null;
    return (
        <div className="flex items-center gap-1.5 mt-1.5 ml-1 text-rose-500 text-xs animate-pulse">
            <AlertCircle size={12} />
            <span>{message}</span>
        </div>
    );
}