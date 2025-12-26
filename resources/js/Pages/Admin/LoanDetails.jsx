import React, { useEffect, useState, useRef } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import {
  FileText, CheckCircle2, XCircle, ExternalLink, ShieldCheck, UploadCloud,
  ArrowLeft, User, AlertCircle, Download, Trash2, Loader2, Lock, Paperclip,
  Banknote, Wallet
} from "lucide-react";

// --- HELPERS ---
const formatDocLabel = (key) => {
    if (!key) return "Document";
    return key
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const asMoney = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0).toLocaleString("en-PH", {
    style: "currency", currency: "PHP"
});

const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
};

const POST_DOC_TYPES = [
    { key: 'signedApplication', label: 'Signed Application' },
    { key: 'releaseVoucher', label: 'Release Voucher' },
    { key: 'borrowerPhoto', label: 'Borrower Photo with Money' },
    { key: 'scannedCheck', label: 'Scanned Check' },
];

export default function AdminLoanDetails({ loanReference }) {
    const { auth } = usePage().props;
    const userRole = (auth?.user?.role || "").toLowerCase();
    const canManage = ['super-admin', 'loan-processor'].includes(userRole);
    
    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [loan, setLoan] = useState(null);
    const [member, setMember] = useState(null);
    const [requirements, setRequirements] = useState([]); 
    const [existingDocuments, setExistingDocuments] = useState([]);
    const [postApprovalDocs, setPostApprovalDocs] = useState([]);
    
    // Actions State
    const [processing, setProcessing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [declineModalOpen, setDeclineModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState("");

    // --- FETCH DATA ---
    const loadDetails = async () => {
        try {
            const { data } = await axios.get(route('admin.api.loans.details', loanReference));
            
            setLoan(data.loan);
            setMember(data.member);
            
            let reqs = [];
        if (data.requirements && data.requirements.length > 0) {
            reqs = data.requirements;
        } else if (data.requiredType && data.requiredType.length > 0) {
            reqs = data.requiredType.map(key => ({ key, label: formatDocLabel(key) }));
        }
            setRequirements(reqs);

            setExistingDocuments(data.existingDocuments || []);
            setPostApprovalDocs(data.postApprovalDocuments || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load loan details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDetails(); }, [loanReference]);

    // --- HANDLERS ---

    // 1. Pre-Approval Upload
    const handlePreUpload = async (e, docType) => {
        const files = e.target.files;
        if (!files || files.length === 0)
            return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append(`files[${i}][file]`, files[i]);
            formData.append(`files[${i}][docsType]`, docType);
        }

        setUploading(true);
        try {
            await axios.post(route('admin.loans.documents.store', loanReference), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Document uploaded.");
            loadDetails(); 
        } catch (error) {
            console.error(error);
            toast.error("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    // 2. Post-Approval Upload
    const handlePostUpload = async (e, docType) => {
        const files = e.target.files;
        if (!files || files.length === 0)
            return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append(`files[${i}][file]`, files[i]);
            formData.append(`files[${i}][docsType]`, docType);
        }

        setUploading(true);
        try {
            await axios.post(route('admin.loans.postApprovalDocs.store', loanReference), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Post-approval document saved.");
            loadDetails(); 
        } catch (error) {
            console.error(error);
            toast.error("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    // 3. Status Updates
    const updateStatus = (status) => {
        toast((t) => (
        <div className="flex flex-col gap-3 min-w-[200px]">
            <div className="font-medium text-slate-800">
                Mark loan as <span className="font-bold text-emerald-600">{status}</span>?
            </div>
            <div className="flex gap-2 justify-end">
                <button 
                    onClick={() => toast.dismiss(t.id)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => {
                    toast.dismiss(t.id);
                    executeStatusUpdate(status);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition"
                >
                    Confirm
                </button>
            </div>
        </div>
        ), { duration: Infinity, position: 'top-center' });
    };

    const executeStatusUpdate = async (status) => {
        setProcessing(true);
        try {
            let url = "";
            if(status === 'Approved') url = route('admin.loan.approve', loanReference);
            if(status === 'Released') url = route('admin.loan.release', loanReference);
            
            await axios.post(url);
            toast.success(`Loan ${status} successfully.`);
            loadDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || "Action failed.");
        } finally {
            setProcessing(false);
        }
    };

    const handleDecline = async () => {
        setProcessing(true);
        try {
            await axios.post(route('admin.loan.decline', loanReference), { remarks: declineReason });
            toast.success("Loan declined.");
            setDeclineModalOpen(false);
            loadDetails();
        } catch (error) {
            toast.error("Failed to decline.");
        } finally {
            setProcessing(false);
        }
    };

    const acknowledgeDownloads = async () => {
        try {
            await axios.post(route('admin.loan.ackDownloads', loanReference));
            toast.success("Acknowledged.");
            setConfirmOpen(false);
            loadDetails();
        } catch (e) {
            toast.error("Failed to acknowledge.");
        }
    };

    const hasRoute = (name) => (typeof route === "function" && route().has ? route().has(name) : false);

    // --- RENDER ---
    
    if (loading) return (
        <AdminSidebarLayout>
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <Loader2 className="h-10 w-10 animate-spin mb-3 text-emerald-600" /> 
                <span className="text-sm font-medium">Loading Loan Details...</span>
            </div>
        </AdminSidebarLayout>
    );

    if (!loan) return <AdminSidebarLayout><div className="p-10 text-center">Loan not found.</div></AdminSidebarLayout>;

    const loanStatus = (loan.status || "").trim();
    const isPending = loanStatus === 'Pending';
    const isApproved = loanStatus === 'Approved' || loanStatus === 'approved';
    const isReleased = loanStatus === 'Released' || loanStatus === 'released';
    const isDeclined = loanStatus === 'Declined';
    const downloadsAck = !!loan.downloadsAcknowledged;

    const missingReqs = requirements.filter(r => !existingDocuments.some(d => d.docsType === r.key));
    const isComplete = missingReqs.length === 0;
    
    const hasAllPostApprovalDocs = POST_DOC_TYPES.every(type => 
        postApprovalDocs.some(d => d.docsType === type.key)
    );
    
    const canRelease = isApproved && hasAllPostApprovalDocs && downloadsAck;

    return (
        <>
            <Head title={`Loan #${loanReference}`}>
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                {/* HEADER & ACTIONS */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link href={route('admin.loans')} className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-emerald-600 transition mb-2">
                            <ArrowLeft size={14} className="mr-1"/> Back to Loans
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText className="text-emerald-600 h-7 w-7"/> 
                                Loan <span className="font-mono text-slate-500">#{loanReference}</span>
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                isApproved ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                isReleased ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                isDeclined ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                                {loan.status}
                            </span>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-wrap gap-2">
                        {isPending && canManage && (
                            <>
                                <button 
                                    onClick={() => setDeclineModalOpen(true)} 
                                    disabled={processing}
                                    className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm transition shadow-sm"
                                >
                                    Decline
                                </button>
                                <button 
                                    onClick={() => updateStatus('Approved')} 
                                    disabled={processing || !isComplete}
                                    className={`px-6 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                                >
                                    {processing ? <Loader2 className="animate-spin h-4 w-4"/> : <CheckCircle2 size={16}/>}
                                    Approve Loan
                                </button>
                            </>
                        )}
                        {isApproved && (
                            <>
                                {hasRoute('admin.loan.download.application') && (
                                    <a href={route('admin.loan.download.application', loanReference)} target="_blank" className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition shadow-sm flex items-center gap-2">
                                        <Download size={16}/> Application
                                    </a>
                                )}
                                {hasRoute('admin.loan.download.releaseVoucher') && (
                                    <a href={route('admin.loan.download.releaseVoucher', loanReference)} target="_blank" className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition shadow-sm flex items-center gap-2">
                                        <Download size={16}/> Voucher
                                    </a>
                                )}
                                {canManage && (
                                    <button 
                                        onClick={() => updateStatus('Released')}
                                        disabled={processing || !canRelease}
                                        className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold text-sm shadow-lg shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? <Loader2 className="animate-spin h-4 w-4"/> : <Wallet size={16}/>}
                                        Release Funds
                                    </button>
                                )}
                            </>
                        )}
                        
                        {/* LOAN LEDGER BUTTON (Only shows if Released) */}
                        {isReleased && hasRoute('admin.loan.download.ledger') && (
                            <a href={route('admin.loan.download.ledger', loanReference)} target="_blank" className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition shadow-sm flex items-center gap-2">
                                <FileText size={16}/> Ledger
                            </a>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* LEFT COLUMN: INFO */}
                    <div className="space-y-6 xl:col-span-1">
                        {/* BORROWER INFO */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/10">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                                <User size={14}/> Borrower Details
                            </h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg uppercase">
                                    {member?.firstName?.[0]}{member?.lastName?.[0]}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-lg">
                                        {member?.lastName}, {member?.firstName}
                                    </div>
                                    <div className="text-sm text-slate-500">@{member?.username}</div>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-slate-50 dark:border-white/5 pb-2">
                                    <span className="text-slate-500">Branch</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{member?.branchService || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 dark:border-white/5 pb-2">
                                    <span className="text-slate-500">Email</span>
                                    <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{member?.email || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* LOAN SUMMARY */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/10">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                                <Banknote size={14}/> Loan Details
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500">Principal</span>
                                    <span className="font-bold text-slate-900 dark:text-white font-mono">{asMoney(loan.loanAmount)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500">Net Proceeds</span>
                                    <span className="font-bold text-emerald-600 font-mono">{asMoney(loan.netProceeds)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500">Monthly Amort.</span>
                                    <span className="font-bold text-slate-900 dark:text-white font-mono">{asMoney(loan.monthlyAmortization)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500">Term</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{loan.termYears} Years ({loan.termYears * 12} mos)</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Created At</span>
                                        <span>{formatDate(loan.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Processed By</span>
                                        <span className="font-medium text-emerald-600">
                                            {loan.processor?.name || loan.processor?.username || 'System'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* APPROVAL ACTIONS CARD (Downloads Confirmation) */}
                        {isApproved && canManage && !isReleased && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/10">
                                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                                    <ShieldCheck size={14}/> Release Requirements
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Post-Approval Docs</span>
                                        {hasAllPostApprovalDocs ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> Complete</span> : <span className="text-rose-600 flex items-center gap-1"><XCircle size={12}/> Incomplete</span>}
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Downloads Confirmed</span>
                                        {downloadsAck ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> Yes</span> : <button onClick={() => setConfirmOpen(true)} className="text-amber-600 hover:underline flex items-center gap-1"><AlertCircle size={12}/> Confirm Now</button>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: REQUIREMENTS */}
                    <div className="xl:col-span-2 space-y-6">
                        
                        {/* PRE-APPROVAL REQUIREMENTS CHECKLIST */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex flex-wrap justify-between items-center gap-2">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <ShieldCheck className="text-emerald-500" size={18} /> 
                                        Pre-Approval Requirements
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {requirements.length} required documents based on {member?.branchService || 'branch'}.
                                    </p>
                                </div>
                                <div className="text-xs font-semibold px-3 py-1 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-sm">
                                    {isComplete ? (
                                        <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> Complete</span>
                                    ) : (
                                        <span className="text-amber-600 flex items-center gap-1"><AlertCircle size={12}/> Incomplete</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {requirements.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        No specific requirements mapped for this branch service.
                                    </div>
                                ) : (
                                    requirements.map((req, idx) => {
                                        const uploadedFiles = existingDocuments.filter(d => d.docsType === req.key);
                                        const isUploaded = uploadedFiles.length > 0;

                                        return (
                                            <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                    <div className="flex gap-3">
                                                        <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${isUploaded ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
                                                            {isUploaded ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={`text-sm font-semibold ${isUploaded ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                {req.label}
                                                            </p>
                                                            
                                                            {uploadedFiles.length > 0 ? (
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {uploadedFiles.map(file => (
                                                                        <a 
                                                                            key={file.id} 
                                                                            href={route('admin.loans.preDocuments.preview', { loanReference, documentId: file.id })} 
                                                                            target="_blank"
                                                                            className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                                                                        >
                                                                            <Paperclip size={12} />
                                                                            <span className="truncate max-w-[150px]">{file.originalName}</span>
                                                                            <ExternalLink size={10} className="opacity-50"/>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-slate-400 mt-1 italic">No document uploaded yet.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {isPending && canManage && (
                                                        <div className="shrink-0 pt-1">
                                                            <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${isUploaded ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500 shadow-sm'}`}>
                                                                <UploadCloud size={14} />
                                                                {isUploaded ? 'Add Another' : 'Upload'}
                                                                <input 
                                                                    type="file" 
                                                                    className="hidden" 
                                                                    onChange={(e) => handlePreUpload(e, req.key)} 
                                                                    disabled={uploading}
                                                                />
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* POST APPROVAL DOCS */}
                        {(isApproved || isReleased) && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Lock className="text-blue-500" size={18} /> Post-Approval Documents
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-slate-500 mb-4">
                                        Upload signed vouchers, checks, and photos here. These are required before release.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {POST_DOC_TYPES.map(type => {
                                            const uploadedDoc = postApprovalDocs.find(d => d.docsType === type.key);
                                            const isUploaded = !!uploadedDoc;

                                            return (
                                                <div key={type.key} className="relative group p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${isUploaded ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{type.label}</span>
                                                        </div>
                                                        {/* UPLOAD BUTTON FOR POST-APPROVAL */}
                                                        {!isUploaded && !isReleased && canManage && (
                                                            <label className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1">
                                                                <UploadCloud size={14}/> Upload
                                                                <input 
                                                                    type="file" 
                                                                    className="hidden" 
                                                                    onChange={(e) => handlePostUpload(e, type.key)} 
                                                                    disabled={uploading}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>

                                                    {isUploaded ? (
                                                        <a 
                                                            href={route('admin.loans.postDocuments.preview', { loanReference, documentId: uploadedDoc.id })}
                                                            target="_blank"
                                                            className="flex items-center gap-3 mt-2 bg-slate-100 dark:bg-white/10 p-2 rounded-lg hover:bg-slate-200 transition"
                                                        >
                                                            <div className="text-blue-500"><FileText size={16}/></div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-xs font-medium truncate text-slate-700 dark:text-slate-200">{uploadedDoc.originalName}</div>
                                                            </div>
                                                            <ExternalLink size={12} className="text-slate-400"/>
                                                        </a>
                                                    ) : (
                                                        <div className="mt-2 text-xs text-slate-400 italic">Not uploaded</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* CONFIRM DOWNLOADS MODAL */}
                {confirmOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Confirm Downloads</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Confirm you have downloaded all required documents?</p>
                        <div className="flex justify-end gap-3"><button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">Cancel</button><button onClick={acknowledgeDownloads} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold">Confirm</button></div>
                    </div>
                    </div>
                )}

                {/* DECLINE MODAL */}
                {declineModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeclineModalOpen(false)}/>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Decline Loan Application</h2>
                            <p className="text-sm text-slate-500 mb-4">Please provide a reason for declining this loan. This will be sent to the member.</p>
                            <textarea 
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-white/5 h-32 mb-4 outline-none focus:ring-2 focus:ring-rose-500"
                                placeholder="Reason for rejection..."
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setDeclineModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                                <button 
                                    onClick={handleDecline} 
                                    disabled={processing || !declineReason.trim()}
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20 disabled:opacity-50"
                                >
                                    {processing ? 'Declining...' : 'Confirm Decline'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </AdminSidebarLayout>
        </>
    );
}