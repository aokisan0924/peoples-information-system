import { Head, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ShieldCheck, Copy, QrCode } from "lucide-react";

export default function AdminTwoFactorSetup({ google2faUrl, secret }) {
    const { props } = usePage();
    const year = useMemo(() => new Date().getFullYear(), []);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        toast("Scan the QR code, then verify your 6-digit code.", { icon: "🔐" });
        if (props?.flash?.success) toast.success(props.flash.success);
    }, [props?.flash]);

    const copySecret = async () => {
        try {
            await navigator.clipboard.writeText(String(secret || ""));
            setCopied(true);
            toast.success("Secret key copied.");
            setTimeout(() => setCopied(false), 1200);
        } catch (e) {
            toast.error("Copy failed. Please copy manually.");
        }
    };

    return (
        <>
            <Head title="Setup Two Factor Authentication">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
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
                                    Enable Two-Factor Authentication
                                </h2>
                                <p className="text-sm text-white/60">
                                    Add PIS Admin to Google Authenticator / Microsoft Authenticator.
                                </p>
                            </div>
                        </div>

                        {/* QR */}
                        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    <QrCode size={18} className="text-emerald-300" />
                                    Scan QR Code
                                </div>
                                <span className="text-xs text-white/45">Recommended</span>
                            </div>

                            <div className="mt-4 flex justify-center">
                                <div className="rounded-2xl bg-white p-3">
                                    <QRCodeSVG value={google2faUrl} size={210} />
                                </div>
                            </div>

                            <p className="mt-4 text-xs text-white/55">
                                If scanning fails, use the manual key below.
                            </p>
                        </div>

                        {/* Secret */}
                        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-white/70">Manual Setup Key</p>

                                <button
                                    type="button"
                                    onClick={copySecret}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                >
                                    <Copy size={16} />
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            </div>

                            <div className="mt-3 break-all rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-xs text-white/80">
                                {secret}
                            </div>

                            <p className="mt-3 text-xs text-white/50">
                                Keep this key private. Anyone with it can generate valid codes.
                            </p>
                        </div>

                        <PrimaryButton
                            className={
                                "mt-6 w-full justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-white " +
                                "shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
                            }
                            onClick={() => (window.location.href = route("admin.2fa.form"))}
                        >
                            Proceed to Verification
                        </PrimaryButton>

                        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/45">
                            © {year} People’s Multi-Purpose Cooperative. All Rights Reserved.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
