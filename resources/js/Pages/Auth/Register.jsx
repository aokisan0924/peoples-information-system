import React, { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import toast from "react-hot-toast";

export default function Register({ genderOptions }) {
    const [step, setStep] = useState("form"); // "form" | "otp"
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [otpErrors, setOtpErrors] = useState({});
    const [otpToken, setOtpToken] = useState("");
    const [phoneMask, setPhoneMask] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [computedAge, setComputedAge] = useState("");
    const [cooldown, setCooldown] = useState(0);

    const [form, setForm] = useState({
        lastName: "",
        firstName: "",
        middleName: "",
        suffix: "",
        email: "",
        phoneNumber: "",
        gender: "",
        dateOfBirth: "",
    });

    // countdown timer for resend OTP
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const calculateAge = (dateStr) => {
        if (!dateStr) return "";
        const dateOfBirth = new Date(dateStr);
        if (Number.isNaN(dateOfBirth.getTime())) return "";

        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const m = today.getMonth() - dateOfBirth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
            age--;
        }
        return age >= 0 ? String(age) : "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === "dateOfBirth") {
            setComputedAge(calculateAge(value));
        }
    };

    // STEP 1 – send OTP
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Manual check to avoid unnecessary API calls
        if (!form.dateOfBirth) {
            toast.error("Date of birth is required.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await window.axios.post(route("register.sendOtp"), form);

            if (response.data?.success) {
                setOtpToken(response.data.otpToken);
                setPhoneMask(response.data.phoneMask || "");
                setStep("otp");
                setCooldown(30);
                toast.success("OTP sent successfully.");
            }
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                toast.error("Please check the form and try again.");
            } else {
                toast.error(
                    error.response?.data?.message ||
                        "Unable to send OTP. Please try again."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // STEP 2 – verify OTP
    const handleSubmitOtp = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setOtpErrors({});

        try {
            const response = await window.axios.post(route("register.verifyOtp"), {
                otpToken,
                otpCode,
            });

            if (response.data?.success) {
                toast.success("Registration completed! Credentials sent.");

                setTimeout(() => {
                    if (response.data.redirect) {
                        window.location.href = response.data.redirect;
                    }
                }, 1000);
            }
        } catch (error) {
            const msg =
                error.response?.data?.message ||
                "Incorrect or expired code. Please try again.";

            toast.error(msg);
            setOtpErrors({ general: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    // RESEND OTP
    const handleResendOtp = async () => {
        if (!otpToken || cooldown > 0) return;

        try {
            const response = await window.axios.post(
                route("register.resendOtp"),
                { otpToken }
            );

            if (response.data?.success) {
                toast.success("A new OTP has been sent.");
                setCooldown(30);
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    "Unable to resend the code. Please try again."
            );
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

    const isFormStep = step === "form";
    const isOtpStep = step === "otp";

    return (
        <>
            <Head title="Member Registration">
                <link rel="icon" type="image/png" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-100 flex items-center justify-center px-4 py-6">
                <div className="w-full max-w-5xl bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden grid lg:grid-cols-[1.05fr,1fr]">
                    {/* LEFT SIDE – hero with LESS empty space */}
                    <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-white p-7 sm:p-8 flex flex-col justify-center gap-8">
                        <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-soft-light bg-[radial-gradient(circle_at_0_0,white_0,transparent_55%),radial-gradient(circle_at_100%_0,white_0,transparent_55%)]" />

                        <div className="relative z-10 space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1 text-[11px] font-medium tracking-wide uppercase">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                <span>Secure Digital Onboarding</span>
                            </div>

                            <div>
                                <h1 className="text-2xl sm:text-3xl font-semibold leading-snug">
                                    Join People&apos;s Multi-Purpose Cooperative
                                </h1>
                                <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 max-w-md">
                                    Start with your basic details. We&apos;ll verify your mobile
                                    number with a one-time password (OTP) and then send your login
                                    credentials securely to your email and phone.
                                </p>
                            </div>
                        </div>

                        {/* Step indicator + quick tips grouped closer — removes giant gap */}
                        <div className="relative z-10 space-y-4 text-[11px] sm:text-xs text-emerald-100/90">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-xs">
                                    <div
                                        className={`h-7 w-7 rounded-full border flex items-center justify-center text-[11px] font-semibold ${
                                            isFormStep
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
                                            Enter details
                                        </span>
                                    </div>
                                </div>

                                <div className="h-px flex-1 bg-emerald-300/40" />

                                <div className="flex items-center gap-2 text-xs">
                                    <div
                                        className={`h-7 w-7 rounded-full border flex items-center justify-center text-[11px] font-semibold ${
                                            isOtpStep
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
                                            Verify OTP
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-[13px]">
                                        ✓
                                    </span>
                                    <p>
                                        After verification, your username and a temporary password
                                        will be sent to your email and mobile.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-[13px]">
                                        🔒
                                    </span>
                                    <p>Change your password immediately after your first login.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-[13px]">
                                        📱
                                    </span>
                                    <p>Use an active mobile number that you can access now.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE – form / OTP */}
                    <div className="bg-white">
                        <div className="px-6 sm:px-7 pt-6 pb-7">
                            <div className="mb-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
                                    Member Registration
                                </p>
                                <h2 className="mt-1 text-base sm:text-lg font-semibold text-slate-900">
                                    {isFormStep ? "Basic Information" : "Mobile Verification"}
                                </h2>
                                <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                                    {isFormStep
                                        ? "Provide your basic details. We’ll send an OTP to your mobile number, then your login credentials after verification."
                                        : "Enter the 6-digit code we sent to your mobile number to complete your registration."}
                                </p>
                            </div>

                            {/* STEP 1 – FORM */}
                            {isFormStep && (
                                <form onSubmit={handleSubmitForm} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-slate-700">
                                                Last Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                autoComplete="family-name"
                                                value={form.lastName}
                                                onChange={handleChange}
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            />
                                            {renderError("lastName")}
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-700">
                                                First Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                autoComplete="given-name"
                                                value={form.firstName}
                                                onChange={handleChange}
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            />
                                            {renderError("firstName")}
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-700">
                                                Middle Name
                                            </label>
                                            <input
                                                type="text"
                                                name="middleName"
                                                value={form.middleName}
                                                onChange={handleChange}
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            />
                                            {renderError("middleName")}
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-700">
                                                Suffix
                                            </label>
                                            <input
                                                type="text"
                                                name="suffix"
                                                value={form.suffix}
                                                onChange={handleChange}
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                placeholder="Jr., Sr., III"
                                            />
                                            {renderError("suffix")}
                                        </div>
                                    </div>

                                    {/* dateOfBirth + Age */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-slate-700">
                                                Date of Birth <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="dateOfBirth"
                                                value={form.dateOfBirth}
                                                onChange={handleChange}
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            />
                                            {renderError("dateOfBirth")}
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-700">
                                                Age (auto)
                                            </label>
                                            <input
                                                type="text"
                                                value={computedAge}
                                                readOnly
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 shadow-sm"
                                                placeholder="-"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-700">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                        {renderError("email")}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-slate-700">
                                                Mobile Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                inputMode="tel"
                                                autoComplete="tel"
                                                value={form.phoneNumber}
                                                onChange={handleChange}
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                placeholder="09xxxxxxxxx"
                                            />
                                            {renderError("phoneNumber")}
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-700">
                                                Gender <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="gender"
                                                value={form.gender}
                                                onChange={handleChange}
                                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            >
                                                <option value="">Select gender</option>
                                                {genderOptions?.map((g) => (
                                                    <option key={g.value} value={g.value}>
                                                        {g.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {renderError("gender")}
                                        </div>
                                    </div>

                                    <div className="pt-2 space-y-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full inline-flex justify-center items-center rounded-xl bg-emerald-600 text-white text-sm font-semibold py-2.5 shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSubmitting ? "Sending OTP..." : "Continue & Send OTP"}
                                        </button>
                                        <p className="text-[11px] text-slate-500 text-center">
                                            We&apos;ll send a one-time password (OTP) to your mobile
                                            number and then your login credentials after verification.
                                        </p>
                                    </div>
                                </form>
                            )}

                            {/* STEP 2 – OTP */}
                            {isOtpStep && (
                                <form onSubmit={handleSubmitOtp} className="space-y-4">
                                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-[11px] text-emerald-900 flex items-start gap-2">
                                        <div className="mt-0.5">
                                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] text-white font-semibold">
                                                !
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Check your SMS</p>
                                            <p className="mt-0.5">
                                                A 6-digit verification code was sent to{" "}
                                                <span className="font-mono font-semibold">
                                                    {phoneMask}
                                                </span>
                                                . Do not share this code with anyone.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-700">
                                            One-Time Password (OTP){" "}
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
                                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-lg tracking-[0.5em] text-center font-mono text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            placeholder="••••••"
                                        />
                                        {renderOtpError("otpCode")}
                                    </div>

                                    {renderOtpError("general")}

                                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep("form");
                                                setOtpErrors({});
                                            }}
                                            className="underline underline-offset-2 decoration-emerald-400 hover:text-emerald-600"
                                        >
                                            Edit details
                                        </button>

                                        <button
                                            type="button"
                                            disabled={cooldown > 0}
                                            onClick={handleResendOtp}
                                            className={`${
                                                cooldown > 0
                                                    ? "opacity-40 cursor-not-allowed"
                                                    : "underline underline-offset-2 decoration-emerald-400 hover:text-emerald-600"
                                            }`}
                                        >
                                            {cooldown > 0
                                                ? `Resend in ${cooldown}s`
                                                : "Resend OTP"}
                                        </button>
                                    </div>

                                    <p className="text-[11px] text-slate-400 text-right">
                                        Code expires in 5 minutes
                                    </p>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full inline-flex justify-center items-center rounded-xl bg-emerald-600 text-white text-sm font-semibold py-2.5 shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSubmitting
                                                ? "Verifying..."
                                                : "Verify & Complete Registration"}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* LOGIN LINK */}
                            <div className="mt-5 border-t border-slate-100 pt-4 text-center">
                                <p className="text-[11px] text-slate-500">
                                    Already registered?{" "}
                                    <a
                                        href={route("login")}
                                        className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                    >
                                        Log in here
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
