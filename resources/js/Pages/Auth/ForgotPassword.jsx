import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import toast from "react-hot-toast";

export default function ForgotPassword() {
    const [step, setStep] = useState("identify"); // "identify" | "reset"
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [otpErrors, setOtpErrors] = useState({});
    const [identifier, setIdentifier] = useState("");
    const [otpToken, setOtpToken] = useState("");
    const [destinationMask, setDestinationMask] = useState("");
    const [channel, setChannel] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const inputBaseClasses =
        "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

    const buttonPrimaryClasses =
        "w-full inline-flex justify-center items-center rounded-xl bg-emerald-600 text-white text-sm font-semibold py-2.5 shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";

    const handleSubmitIdentify = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await window.axios.post(
                route("member.password.sendOtp"),
                { identifier }
            );

            if (response.data?.success) {
                setOtpToken(response.data.otpToken);
                setChannel(response.data.channel);
                setDestinationMask(response.data.destinationMask);
                setStep("reset");
                setOtpErrors({});

                toast.success("Verification code sent successfully.");
            }
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                "Unable to process request. Please try again.";

            toast.error(msg);

            setErrors({
                identifier: [msg],
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReset = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setOtpErrors({});

        try {
            const response = await window.axios.post(
                route("member.password.verifyOtp"),
                {
                    otpToken,
                    otpCode,
                    newPassword,
                    confirmNewPassword,
                }
            );

            if (response.data?.success) {
                toast.success(
                    response.data.message || "Password reset successful."
                );

                if (response.data.redirect) {
                    setTimeout(() => {
                        window.location.href = response.data.redirect;
                    }, 1200);
                }
            }
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                "Unable to verify the code. Please try again.";

            toast.error(msg);

            setOtpErrors({
                general: msg,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderError = (field) =>
        errors[field] ? (
            <p className="mt-1 text-xs text-red-600">{errors[field][0]}</p>
        ) : null;

    const renderOtpError = (field) =>
        otpErrors[field] ? (
            <p className="mt-1 text-xs text-red-600">{otpErrors[field]}</p>
        ) : null;

    const isIdentifyStep = step === "identify";
    const isResetStep = step === "reset";

    return (
        <>
            <Head title="Forgot Password">
                <link rel="icon" type="image/png" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-100 flex items-center justify-center px-4 py-6">
                <div className="w-full max-w-5xl bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden grid lg:grid-cols-[1.1fr,1fr]">
                    {/* LEFT SIDE */}
                    <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-white p-7 sm:p-8 flex flex-col justify-between">
                        <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-soft-light bg-[radial-gradient(circle_at_0_0,white_0,transparent_55%),radial-gradient(circle_at_100%_0,white_0,transparent_55%)]" />

                        <div className="relative z-10 space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1 text-[11px] font-medium tracking-wide uppercase">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                <span>Account Recovery</span>
                            </div>

                            <div>
                                <h1 className="text-2xl sm:text-3xl font-semibold leading-snug">
                                    Reset your PMPC member password
                                </h1>
                                <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 max-w-md">
                                    We&apos;ll verify your account via your registered email or mobile
                                    number, then allow you to securely set a new password with OTP
                                    confirmation.
                                </p>
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex items-center gap-2 text-xs">
                                    <div
                                        className={`h-7 w-7 rounded-full border flex items-center justify-center text-[11px] font-semibold ${
                                            isIdentifyStep
                                                ? "bg-white text-emerald-700 border-white"
                                                : "bg-emerald-500/30 text-emerald-50 border-emerald-300/70"
                                        }`}
                                    >
                                        1
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="uppercase tracking-wide text-[10px] text-emerald-200">
                                            Step 1
                                        </span>
                                        <span className="text-[11px] font-medium">
                                            Identify account
                                        </span>
                                    </div>
                                </div>

                                <div className="h-px flex-1 bg-emerald-300/40" />

                                <div className="flex items-center gap-2 text-xs">
                                    <div
                                        className={`h-7 w-7 rounded-full border flex items-center justify-center text-[11px] font-semibold ${
                                            isResetStep
                                                ? "bg-white text-emerald-700 border-white"
                                                : "bg-emerald-500/20 text-emerald-50 border-emerald-300/50"
                                        }`}
                                    >
                                        2
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="uppercase tracking-wide text-[10px] text-emerald-200">
                                            Step 2
                                        </span>
                                        <span className="text-[11px] font-medium">
                                            Set new password
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-6 sm:mt-8 space-y-3 text-[11px] sm:text-xs text-emerald-100/90">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-[13px]">
                                    🔒
                                </span>
                                <p>Your password is never sent in plain text. Only you can set it.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-[13px]">
                                    📱
                                </span>
                                <p>Make sure you have access to your registered email or mobile.</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="bg-white">
                        <div className="px-6 sm:px-7 pt-6 pb-7">
                            <div className="mb-4 flex flex-col items-center gap-3 sm:items-start sm:gap-2">
                                <div className="block sm:hidden mb-1">
                                    <img
                                        src="/images/logo/pis_logo.png"
                                        alt="PIS Logo"
                                        className="h-10 w-10 rounded-2xl bg-emerald-50 p-1.5 border border-emerald-100 shadow-inner"
                                    />
                                </div>

                                <div className="text-center sm:text-left space-y-1 w-full">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
                                        Forgot Password
                                    </p>
                                    <h2 className="mt-1 text-base sm:text-lg font-semibold text-slate-900">
                                        {isIdentifyStep
                                            ? "Find your PMPC account"
                                            : "Enter code & set a new password"}
                                    </h2>
                                    <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                                        {isIdentifyStep
                                            ? "Provide your registered email or mobile number so we can locate your account."
                                            : `We sent a verification code to ${destinationMask}. Enter it below and choose a new password.`}
                                    </p>
                                </div>
                            </div>

                            {isIdentifyStep && (
                                <form onSubmit={handleSubmitIdentify} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-700">
                                            Email or Mobile Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className={inputBaseClasses}
                                            placeholder="example@gmail.com or 09xxxxxxxxx"
                                        />
                                        {renderError("identifier")}
                                    </div>

                                    <div className="pt-2 space-y-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={buttonPrimaryClasses}
                                        >
                                            {isSubmitting
                                                ? "Sending verification code..."
                                                : "Send verification code"}
                                        </button>
                                        <p className="text-[11px] text-slate-400 text-center">
                                            We&apos;ll send a one-time code to your registered email or
                                            mobile number.
                                        </p>
                                    </div>

                                    <div className="mt-3 text-center">
                                        <Link
                                            href={route("login")}
                                            className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline"
                                        >
                                            Back to login
                                        </Link>
                                    </div>
                                </form>
                            )}

                            {isResetStep && (
                                <form onSubmit={handleSubmitReset} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-700">
                                            Verification Code (OTP){' '}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(e) =>
                                                setOtpCode(e.target.value.replace(/\D/g, ""))
                                            }
                                            className={`${inputBaseClasses} text-center tracking-[0.5em]`}
                                            placeholder="••••••"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-700">
                                            New Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) =>
                                                setNewPassword(e.target.value)
                                            }
                                            className={inputBaseClasses}
                                            autoComplete="new-password"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-700">
                                            Confirm New Password{' '}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmNewPassword}
                                            onChange={(e) =>
                                                setConfirmNewPassword(e.target.value)
                                            }
                                            className={inputBaseClasses}
                                            autoComplete="new-password"
                                        />
                                    </div>

                                    {renderOtpError("general")}

                                    <div className="pt-2 space-y-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={buttonPrimaryClasses}
                                        >
                                            {isSubmitting
                                                ? "Updating password..."
                                                : "Confirm & Update Password"}
                                        </button>
                                        <p className="text-[11px] text-slate-400 text-center">
                                            After a successful reset, you&apos;ll be redirected to the
                                            login page.
                                        </p>
                                    </div>

                                    <div className="mt-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep("identify");
                                                setOtpErrors({});
                                            }}
                                            className="text-[11px] text-slate-500 hover:text-emerald-600 hover:underline"
                                        >
                                            Change email or mobile number
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
