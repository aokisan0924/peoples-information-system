import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, useForm } from "@inertiajs/react";
import { Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function AdminLogin({ status }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const year = useMemo(() => new Date().getFullYear(), []);

    useEffect(() => {
        if (status) toast.success(status);
    }, [status]);

    useEffect(() => {
        // show the first validation error as toast (clean + helpful)
        const firstError = Object.values(errors || {})?.[0];
        if (firstError) toast.error(String(firstError));
    }, [errors]);

    const submit = (e) => {
        e.preventDefault();
        clearErrors();

        post(route("admin.login.post"), {
            preserveScroll: true,
            onStart: () => toast.dismiss(),
            onSuccess: () => toast.success("Welcome back."),
            onError: () => {
                // errors are handled by the useEffect toast + inline InputError
                toast.error("Login failed. Please check your credentials.");
            },
            onFinish: () => reset("password"),
        });
    };

    const inputBase =
        "mt-1 block w-full rounded-xl border border-gray-200 bg-white/70 shadow-sm " +
        "placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 " +
        "dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40";

    return (
        <>
            <Head title="Admin Login">
                <link rel="icon" type="image/png" href="/images/logo/pis_logo.png" />
            </Head>

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3500,
                    style: {
                        borderRadius: "14px",
                    },
                }}
            />

            <div className="min-h-screen bg-[#070A0F] text-white">
                {/* Background */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-3xl" />
                    <div className="absolute -bottom-40 -right-24 h-[520px] w-[520px] rounded-full bg-green-400/10 blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:22px_22px]" />
                </div>

                <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-10">
                    <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
                        {/* Left: Brand / Info panel */}
                        <div className="hidden lg:flex">
                            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/20">
                                        <ShieldCheck className="h-6 w-6 text-emerald-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/70">People’s Information System</p>
                                        <h1 className="text-2xl font-semibold tracking-tight">Admin Portal</h1>
                                    </div>
                                </div>

                                <div className="mt-10 space-y-4">
                                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <Sparkles className="mt-0.5 h-5 w-5 text-emerald-300" />
                                        <div>
                                            <p className="font-medium">Secure Access</p>
                                            <p className="text-sm text-white/70">
                                                Admin authentication only. Access is logged and protected.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                                        <div>
                                            <p className="font-medium">Operational Controls</p>
                                            <p className="text-sm text-white/70">
                                                Manage members, loans, savings, and cooperative workflows.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 text-sm text-white/55">
                                    Tip: Use a strong password and avoid public/shared devices.
                                </div>
                            </div>
                        </div>

                        {/* Right: Login card */}
                        <div className="flex items-center">
                            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur sm:p-8">
                                {/* Header */}
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                                        <img
                                            src="/images/logo/pis_logo.png"
                                            alt="PIS Logo"
                                            className="h-8 w-8"
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
                                        <p className="text-sm text-white/60">
                                            Enter your admin credentials to continue.
                                        </p>
                                    </div>
                                </div>

                                {/* Mobile-only brand snippet */}
                                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 lg:hidden">
                                    <p className="text-sm text-white/70">People’s Information System</p>
                                    <p className="mt-1 text-xs text-white/55">
                                        Admin Portal • Secure access for cooperative operations.
                                    </p>
                                </div>

                                <form onSubmit={submit} className="mt-8 space-y-5">
                                    <div>
                                        <InputLabel htmlFor="email" value="Email Address" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className={inputBase}
                                            autoComplete="email"
                                            isFocused={true}
                                            placeholder="admin@peoplesmpcoop.com"
                                            onChange={(e) => setData("email", e.target.value)}
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <InputLabel htmlFor="password" value="Password" />
                                        </div>

                                        <div className="relative mt-1">
                                            <TextInput
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={data.password}
                                                className={`${inputBase} pr-14`}
                                                autoComplete="current-password"
                                                placeholder="••••••••••••"
                                                onChange={(e) => setData("password", e.target.value)}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="absolute inset-y-0 right-3 flex items-center rounded-xl px-2 text-white/60 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <label className="flex items-center gap-2 text-sm text-white/70">
                                            <Checkbox
                                                name="remember"
                                                checked={data.remember}
                                                onChange={(e) => setData("remember", e.target.checked)}
                                                className="accent-emerald-500"
                                            />
                                            Remember me
                                        </label>

                                        <p className="text-xs text-white/50">
                                            Authorized personnel only.
                                        </p>
                                    </div>

                                    <PrimaryButton
                                        className={
                                            "group relative w-full justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-white " +
                                            "shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 " +
                                            "disabled:cursor-not-allowed disabled:opacity-70"
                                        }
                                        disabled={processing}
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            {processing && (
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            )}
                                            {processing ? "Signing in..." : "Log in"}
                                        </span>
                                    </PrimaryButton>

                                    <div className="pt-2 text-center text-xs text-white/45">
                                        By continuing, you agree to the cooperative’s internal security policies.
                                    </div>
                                </form>

                                {/* Footer */}
                                <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/45">
                                    © {year} People’s Multi-Purpose Cooperative. All Rights Reserved.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
