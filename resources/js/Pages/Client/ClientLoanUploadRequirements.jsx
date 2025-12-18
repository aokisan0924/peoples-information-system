import React, { useState, useEffect } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { 
    FileText, 
    UploadCloud, 
    CheckCircle2, 
    AlertCircle, 
    ExternalLink, 
    ArrowUpRight,
    Loader2,
    Shield
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import SidebarLayout from "@/Layouts/SidebarLayout";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";

const asMoney = (v) =>
    (Number.isFinite(v) ? v : 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export default function ClientLoanUploadRequirements() {
    const { props } = usePage();
    const {
        loan,
        branchService,
        requirements: initialRequirements,
        uploadedCount: initialUploadedCount,
        totalRequired,
        allUploaded: initialAllUploaded,
    } = props;

    // --- STATE ---
    const [requirements, setRequirements] = useState(initialRequirements || []);
    const [uploadedCount, setUploadedCount] = useState(initialUploadedCount || 0);
    const [allUploaded, setAllUploaded] = useState(!!initialAllUploaded);
    const [uploadingKey, setUploadingKey] = useState(null);
    
    // Local status to handle immediate UI updates
    const [loanStatus, setLoanStatus] = useState(loan.status);
    const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

    // Sync local state if props update (e.g. after reload)
    useEffect(() => {
        setLoanStatus(loan.status);
    }, [loan.status]);

    const uploadUrl = `/client/loans/${loan.loanReference}/requirements`;
    const submitUrl = `/client/loans/${loan.loanReference}/requirements/submit`;

    // --- COMPUTED STATES ---
    
    // 1. Check if loan is in an editable state (Case insensitive)
    const normalizedStatus = (loanStatus || "").toLowerCase();
    const isEditable = ["pending", "for requirements"].includes(normalizedStatus);
    
    // 2. If not editable, it is considered submitted/processing/approved etc.
    const isSubmitted = !isEditable;

    // 3. Button Logic:
    // Enabled ONLY if: All docs uploaded AND Not currently submitting AND Is currently editable
    const canSubmitFinal = allUploaded && !isSubmittingFinal && isEditable;

    // --- HANDLERS ---

    const handleFileChange = async (reqKey, file, label) => {
        if (!file) return;
        
        // Block uploads if submitted OR if currently submitting the final application
        if (isSubmitted || isSubmittingFinal) {
            toast.error("Cannot upload files at this stage.");
            return;
        }

        const formData = new FormData();
        formData.append(`documents[${reqKey}]`, file);

        setUploadingKey(reqKey);

        try {
            const res = await axios.post(uploadUrl, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Document uploaded successfully.");

            if (Array.isArray(res?.data?.requirements)) {
                setRequirements(res.data.requirements);
            }
            if (typeof res?.data?.uploadedCount === "number") {
                setUploadedCount(res.data.uploadedCount);
            }
            if (typeof res?.data?.allUploaded === "boolean") {
                setAllUploaded(res.data.allUploaded);
            }
            if (res?.data?.loanStatus) {
                setLoanStatus(res.data.loanStatus);
            }
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.message || "Failed to upload document.";
            toast.error(msg);
        } finally {
            setUploadingKey(null);
        }
    };

    const handleSubmitForEvaluation = () => {
        if (!canSubmitFinal) return;

        setIsSubmittingFinal(true);

        axios
            .post(submitUrl)
            .then((res) => {
                const message = res?.data?.message || "Loan submitted successfully!";
                toast.success(message);

                // 1. Immediate UI Lock: Force status to something non-editable
                // If backend still returns 'Pending' due to DB delay, we force 'Submitted' locally
                const newStatus = res?.data?.loanStatus;
                setLoanStatus((newStatus && newStatus.toLowerCase() !== 'pending') ? newStatus : "Submitted");

                // 2. Reload page data to sync with server
                router.reload({ 
                    only: ['loan'],
                    onFinish: () => setIsSubmittingFinal(false) // Unlock spinner after reload
                });
            })
            .catch((err) => {
                console.error(err);
                const msg = err?.response?.data?.message || "Failed to submit loan.";
                toast.error(msg);
                setIsSubmittingFinal(false); // Only unlock on error
            });
    };

    const todayStr = new Date().toLocaleString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const progressPercent = totalRequired && totalRequired > 0
            ? Math.round((uploadedCount / totalRequired) * 100)
            : 0;

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Loan Requirements" />
                
                {/* FIX: Removed "min-h-screen bg-gradient..." 
                   Added "space-y-6" for layout spacing.
                   SidebarLayout controls the background now.
                */}
                <div className="space-y-6">
                    
                    {/* HERO HEADER */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm dark:shadow-2xl transition-colors">
                        <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                        <FileText className="h-3 w-3" />
                                        Loan Requirements Upload
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                                        Upload Documents
                                    </h1>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-white/60 max-w-xl leading-relaxed">
                                        Submit clear copies of the required documents for your 
                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium"> {branchService} </span> 
                                        loan application to proceed with evaluation.
                                    </p>
                                </div>
                                <div className="text-xs text-slate-400 dark:text-white/40 font-mono">
                                    Date: {todayStr}
                                </div>
                            </div>

                            {/* Loan Summary Card */}
                            <div className="w-full lg:w-80 rounded-2xl border border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/5 p-5">
                                <div className="mb-4">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400/80">
                                        Reference No.
                                    </div>
                                    <div className="font-mono text-sm text-slate-900 dark:text-white tracking-wide">{loan.loanReference}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="rounded-xl bg-white dark:bg-black/20 p-3 border border-slate-200 dark:border-white/5">
                                        <p className="text-[10px] uppercase text-slate-400 dark:text-white/40 mb-1">Net Proceeds</p>
                                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{asMoney(loan.netProceeds)}</p>
                                    </div>
                                    <div className="rounded-xl bg-white dark:bg-black/20 p-3 border border-slate-200 dark:border-white/5">
                                        <p className="text-[10px] uppercase text-slate-400 dark:text-white/40 mb-1">Term</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{loan.termYears} Year{loan.termYears > 1 ? 's' : ''}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-3">
                                    <span className="text-xs text-slate-500 dark:text-white/50">Current Status</span>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                                        isEditable
                                        ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' 
                                        : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                    }`}>
                                        {loanStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* INFO ALERT */}
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-4 flex gap-4 items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800 dark:text-amber-200/80">
                            <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Important Reminder</p>
                            <p>Please ensure all uploaded documents are clear, readable, and valid. Accepted formats: JPG, PNG, PDF (Max 20MB).</p>
                        </div>
                    </div>

                    {/* PROGRESS & ACTION */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm transition-colors">
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-900 dark:text-white font-medium">Upload Progress</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-mono">{uploadedCount} / {totalRequired}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                <div 
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out" 
                                    style={{ width: `${progressPercent}%` }} 
                                />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-white/40">
                                {allUploaded ? "All documents uploaded." : "Complete all uploads to enable submission."}
                            </p>
                        </div>

                        <div className="shrink-0">
                            <button
                                type="button"
                                onClick={handleSubmitForEvaluation}
                                disabled={!canSubmitFinal}
                                className={`w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all shadow-lg
                                    ${canSubmitFinal 
                                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 hover:-translate-y-0.5 cursor-pointer" 
                                        : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/30 cursor-not-allowed border border-slate-200 dark:border-white/5"
                                    }`}
                            >
                                {isSubmittingFinal ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : isSubmitted ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Submitted for Evaluation
                                    </>
                                ) : (
                                    <>
                                        Submit for Evaluation
                                        <ArrowUpRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* REQUIREMENTS GRID */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-white/80">
                                <Shield className="h-4 w-4" />
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Required Documents</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {requirements.map((req) => {
                                const isUploading = uploadingKey === req.key;
                                // Disable input if submitted or currently uploading/submitting
                                const isDisabled = isUploading || isSubmitted || isSubmittingFinal;

                                return (
                                    <div 
                                        key={req.key} 
                                        className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 transition-all ${isDisabled ? 'opacity-75' : 'hover:border-emerald-300 dark:hover:bg-white/[0.07] dark:hover:border-white/20'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                                                req.isUploaded 
                                                ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" 
                                                : "bg-slate-50 border-slate-100 text-slate-400 dark:bg-white/5 dark:border-white/10 dark:text-white/40"
                                            }`}>
                                                <UploadCloud className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={req.label}>
                                                    {req.label}
                                                </p>
                                                <div className="mt-1 flex flex-col gap-1">
                                                    {req.isUploaded ? (
                                                        <>
                                                            <p className="text-xs text-slate-500 dark:text-white/60 truncate">
                                                                {req.fileName}
                                                            </p>
                                                            {req.fileUrl && (
                                                                <a
                                                                    href={req.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                                                >
                                                                    View File <ExternalLink className="h-3 w-3" />
                                                                </a>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 dark:text-white/30 italic">No file uploaded yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                {req.isUploaded ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Uploaded
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Pending
                                                    </span>
                                                )}
                                            </div>

                                            <div className="relative">
                                                <input
                                                    id={`file-${req.key}`}
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                    className="hidden"
                                                    disabled={isDisabled}
                                                    onChange={(e) => handleFileChange(req.key, e.target.files[0], req.label)}
                                                />
                                                <label
                                                    htmlFor={`file-${req.key}`}
                                                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all
                                                        ${req.isUploaded 
                                                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white dark:border-white/10" 
                                                            : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md"
                                                        }
                                                        ${isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
                                                    `}
                                                >
                                                    {isUploading ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        req.isUploaded ? "Replace" : "Upload"
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </PaymentReminderLayout>
        </SidebarLayout>
    );
}