import React from "react";
import { Head, useForm } from "@inertiajs/react";
import SidebarLayout from "@/Layouts/SidebarLayout";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";
import { Lock, ShieldCheck, Key, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ChangePassword() {
    const { data, setData, post, processing, errors, reset } = useForm({ currentPassword: "", newPassword: "", newPassword_confirmation: "" });

    const submit = (e) => {
        e.preventDefault();
        post(route("member.settings.update"), {
            onSuccess: () => { toast.success("Password updated successfully!"); reset(); },
            onError: () => { toast.error("Please check your entries."); },
        });
    };

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Change Password">
                    <link rel="icon" href="/images/logo/pis_logo.png" />
                </Head>
                <div className="flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 min-h-[80vh]">
                    <div className="w-full max-w-lg space-y-8">
                        <div className="text-center space-y-2">
                            <div className="mx-auto h-20 w-20 rounded-3xl bg-emerald-100 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mb-6 shadow-xl dark:shadow-emerald-900/40">
                                <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Secure Your Account</h1>
                            <p className="text-slate-500 dark:text-white/60 text-sm max-w-sm mx-auto">Update your password regularly to keep your account safe.</p>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
                            <form onSubmit={submit} className="space-y-5">
                                {["currentPassword", "newPassword", "newPassword_confirmation"].map((field, idx) => (
                                    <div key={field} className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-500 dark:text-white/60 ml-1 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                        <div className="relative group">
                                            {idx === 0 ? <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-white/30" /> : <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-white/30" />}
                                            <input type="password" value={data[field]} onChange={(e) => setData(field, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition placeholder:text-slate-400 dark:placeholder:text-white/20" placeholder="••••••••" />
                                        </div>
                                        {errors[field] && <p className="text-rose-500 dark:text-rose-400 text-xs ml-1">{errors[field]}</p>}
                                    </div>
                                ))}
                                <div className="pt-4">
                                    <button type="submit" disabled={processing} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3.5 shadow-lg shadow-emerald-900/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all">
                                        {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </PaymentReminderLayout>
        </SidebarLayout>
    );
}