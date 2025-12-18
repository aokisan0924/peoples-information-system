import { Head, useForm, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ShieldCheck, KeyRound } from "lucide-react";

export default function AdminTwoFactor() {
    const { props } = usePage();

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        code: "",
    });

    const [didAutoFormat, setDidAutoFormat] = useState(false);
    const year = useMemo(() => new Date().getFullYear(), []);

    useEffect(() => {
        if (errors?.code) toast.error(errors.code);
        if (errors?.email) toast.error(errors.email);
        if (props?.flash?.success) toast.success(props.flash.success);
    }, [errors, props?.flash]);

    const submit = (e) => {
        e.preventDefault();
        clearErrors();

        const cleaned = (data.code || "").replace(/\s+/g, "");
        setData("code", cleaned);
        setDidAutoFormat(true);

        post(route("admin.2fa.verify"), {
            preserveScroll: true,
            onStart: () => toast.dismiss(),
            onError: () => toast.error("Verification failed. Please try again."),
        });
    };

    const handleCodeChange = (e) => {
        const raw = e.target.value ?? "";
        // allow digits + spaces only; user-friendly on mobile keyboards
        const next = raw.replace(/[^\d\s]/g, "");
        setDidAutoFormat(false);
        setData("code", next);
    };

    const inputBase =
    "mt-1 block w-full rounded-xl border border-gray-200 bg-white/70 shadow-sm " +
    "placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 " +
    "dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40";

    return (
        <>
            <Head title="Two Factor Authentication" />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3200,
                    style: {
                        borderRadius: "14px",
                        background: "rgba(15, 23, 42, 0.95)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.08)",
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

                <div className="relative mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10 sm:px-6">
                    <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_90px_-45px_rgba(0,0,0,0.9)] backdrop-blur sm:p-8">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/20">
                                <ShieldCheck className="h-6 w-6 text-emerald-300" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight">
                                    Two-Factor Verification
                                </h2>
                                <p className="text-sm text-white/60">
                                    Enter the 6-digit code from your authenticator app.
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <form onSubmit={submit} className="mt-8 space-y-5">
                            <div>
                                <InputLabel htmlFor="code" value="Authentication Code" />
                                <div className="relative">
                                    <TextInput
                                        id="code"
                                        type="text"
                                        name="code"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        value={data.code}
                                        className={`${inputBase} pr-12`}
                                        autoFocus
                                        placeholder="123 456"
                                        onChange={handleCodeChange}
                                        onBlur={() => {
                                            // auto-space as UX sugar (optional)
                                            const digits = (data.code || "").replace(/\D/g, "").slice(0, 6);
                                            if (digits.length >= 4) {
                                                setData("code", `${digits.slice(0, 3)} ${digits.slice(3)}`);
                                            } else {
                                                setData("code", digits);
                                            }
                                            setDidAutoFormat(true);
                                        }}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/50">
                                        <KeyRound size={18} />
                                    </div>
                                </div>
                                <InputError message={errors.code} className="mt-2" />

                                {!errors.code && didAutoFormat && (
                                    <p className="mt-2 text-xs text-white/45">
                                        Tip: You can paste the code — we’ll clean spaces automatically.
                                    </p>
                                )}
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
                                    {processing ? "Verifying..." : "Verify Code"}
                                </span>
                            </PrimaryButton>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/55">
                                If your code keeps failing, check your device time (automatic time sync).
                            </div>
                        </form>

                        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/45">
                            © {year} People’s Multi-Purpose Cooperative. All Rights Reserved.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
