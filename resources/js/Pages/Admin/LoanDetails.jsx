import React, { useEffect, useState, useMemo } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import {
  FileText, CheckCircle2, XCircle, ExternalLink, ShieldCheck, UploadCloud,
  ArrowLeft, User, AlertCircle, Download, Loader2, Lock, Paperclip,
  Banknote, Wallet, BookOpen, Minus, Calculator
} from "lucide-react";

// --- HELPERS ---
const formatDocLabel = (key) => {
    if (!key) return "Document";
    return key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const asMoney = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0).toLocaleString("en-PH", {
    style: "currency", currency: "PHP"
});

const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
};

// DYNAMIC POST-APPROVAL DOCS BASED ON BRANCH SERVICE
const getPostDocTypes = (branchService) => {
    const service = (branchService || "").trim().toUpperCase();
    const isPensioner = ['RETIRED MILITARY', 'RETIRED', 'PENSIONER', 'BENEFICIARY', 'RETIRED/PENSIONER/BENEFICIARY'].includes(service);

    const docs = [
        { key: 'signedApplication', label: 'Signed Application' },
        { key: 'releaseVoucher', label: 'Release Voucher' },
        { key: 'disclosureStatement', label: 'Disclosure Statement' },
        { key: 'dataPrivacyConsent', label: 'Data Privacy Consent' },
        { key: 'authorityToDeduct', label: 'Authority to Deduct' },
        { key: 'borrowerPhoto', label: 'Borrower Photo with Money' },
        { key: 'scannedCheck', label: 'Scanned Check' },
    ];

    // Only inject GHQ Requirement if the member is a pensioner
    if (isPensioner) docs.push({ key: 'ghqDeclaration', label: 'GHQ Declaration' });
    
    return docs;
};

function DataRow({ label, value, highlight, isTitle }) {
    return (
        <div className={`flex justify-between items-center py-1.5 ${isTitle ? 'border-t border-slate-200/50 dark:border-white/10 mt-2 pt-3' : ''}`}>
            <span className={`text-[10px] uppercase tracking-widest ${isTitle ? 'font-black text-slate-700 dark:text-slate-300' : 'font-bold text-slate-500 dark:text-slate-400'}`}>{label}</span>
            <span className={`font-mono text-xs ${highlight ? 'font-black text-emerald-600 dark:text-emerald-400' : 'font-bold text-slate-800 dark:text-slate-200'} ${isTitle ? 'text-sm font-black' : ''}`}>{value}</span>
        </div>
    );
}

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
    const [journalEntries, setJournalEntries] = useState([]);
    
    // Actions State
    const [processing, setProcessing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [declineModalOpen, setDeclineModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState("");

    const loadDetails = async () => {
        try {
            const { data } = await axios.get(route('admin.api.loans.details', loanReference));
            setLoan(data.loan);
            setMember(data.member);
            setJournalEntries(data.journalEntries || []);
            setRequirements(data.requirements?.length ? data.requirements : (data.requiredType || []).map(key => ({ key, label: formatDocLabel(key) })));
            setExistingDocuments(data.existingDocuments || []);
            setPostApprovalDocs(data.postApprovalDocuments || []);
        } catch (error) { toast.error("Failed to load loan details."); } 
        finally { setLoading(false); }
    };

    useEffect(() => { loadDetails(); }, [loanReference]);

    // Generate strict document map based on member's branch
    const postDocTypes = useMemo(() => getPostDocTypes(member?.branchService), [member?.branchService]);

    const handleUpload = async (e, docType, endpoint) => {
        const files = e.target.files;
        if (!files?.length) return;

        const formData = new FormData();
        Array.from(files).forEach((file, i) => {
            formData.append(`files[${i}][file]`, file);
            formData.append(`files[${i}][docsType]`, docType);
        });

        setUploading(true);
        try {
            await axios.post(route(endpoint, loanReference), formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            toast.success("Document saved securely.");
            loadDetails(); 
        } catch (error) { toast.error("Upload failed."); } 
        finally { setUploading(false); }
    };

    const executeStatusUpdate = async (status) => {
        setProcessing(true);
        try {
            await axios.post(status === 'Approved' ? route('admin.loan.approve', loanReference) : route('admin.loan.release', loanReference));
            toast.success(`Loan ${status} successfully.`);
            loadDetails();
        } catch (error) { toast.error(error.response?.data?.message || "Action failed."); } 
        finally { setProcessing(false); }
    };

    const updateStatus = (status) => {
        toast((t) => (
        <div className="flex flex-col gap-3 min-w-[200px]">
            <div className="font-medium text-slate-800">Mark loan as <span className="font-bold text-emerald-600">{status}</span>?</div>
            <div className="flex gap-2 justify-end">
                <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                <button onClick={() => { toast.dismiss(t.id); executeStatusUpdate(status); }} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg">Confirm</button>
            </div>
        </div>
        ), { duration: Infinity, position: 'top-center' });
    };

    const handleDecline = async () => {
        setProcessing(true);
        try {
            await axios.post(route('admin.loan.decline', loanReference), { remarks: declineReason });
            toast.success("Loan declined.");
            setDeclineModalOpen(false);
            loadDetails();
        } catch (error) { toast.error("Failed to decline."); } 
        finally { setProcessing(false); }
    };

    const acknowledgeDownloads = async () => {
        try {
            await axios.post(route('admin.loan.ackDownloads', loanReference));
            toast.success("Downloads confirmed.");
            setConfirmOpen(false);
            loadDetails();
        } catch (e) { toast.error("Action failed."); }
    };

    const hasRoute = (name) => (typeof route === "function" && route().has ? route().has(name) : false);

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
    const isApproved = loanStatus.toLowerCase() === 'approved';
    const isReleased = loanStatus.toLowerCase() === 'released';
    const isDeclined = loanStatus === 'Declined';
    const downloadsAck = !!loan.downloadsAcknowledged;

    const isComplete = requirements.every(r => existingDocuments.some(d => d.docsType === r.key));
    const hasAllPostApprovalDocs = postDocTypes.every(type => postApprovalDocs.some(d => d.docsType === type.key));
    const canRelease = isApproved && hasAllPostApprovalDocs && downloadsAck;

    const totalDeductions = (loan.serviceFee || 0) + (loan.insurance || 0) + (loan.advanceInterest || 0) + (loan.capCon || 0) + (loan.membershipFee || 0);

    return (
        <>
            <Head title={`Loan #${loanReference}`} />
            <Toaster position="top-right" />
            <AdminSidebarLayout>
                
                {/* TOP HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link href={route('admin.loans')} className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-emerald-600 transition mb-2">
                            <ArrowLeft size={14} className="mr-1"/> Back to Loans
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText className="text-emerald-600 h-7 w-7"/> Loan <span className="font-mono text-slate-500">#{loanReference}</span>
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${isApproved ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : isReleased ? 'bg-blue-100 text-blue-700 border-blue-200' : isDeclined ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                {loan.status}
                            </span>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-wrap items-center gap-2">
                        {isPending && canManage && (
                            <>
                                <button onClick={() => setDeclineModalOpen(true)} disabled={processing} className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm shadow-sm">Decline</button>
                                <button onClick={() => updateStatus('Approved')} disabled={processing || !isComplete} className="px-6 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2">
                                    {processing ? <Loader2 className="animate-spin h-4 w-4"/> : <CheckCircle2 size={16}/>} Approve Loan
                                </button>
                            </>
                        )}
                        
                        {/* THE NEW BATCH DOWNLOAD QUICK-MENU */}
                        {isApproved && (
                            <>
                                <div className="flex items-center flex-wrap gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm mr-2">
                                    {hasRoute('admin.loan.download.application') && <a href={route('admin.loan.download.application', loanReference)} target="_blank" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5"><Download size={13}/> App</a>}
                                    {hasRoute('admin.loan.download.releaseVoucher') && <a href={route('admin.loan.download.releaseVoucher', loanReference)} target="_blank" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5"><Download size={13}/> Voucher</a>}
                                    {hasRoute('admin.loan.download.disclosure') && <a href={route('admin.loan.download.disclosure', loanReference)} target="_blank" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5"><Download size={13}/> Disclosure</a>}
                                    {hasRoute('admin.loan.download.dataPrivacy') && <a href={route('admin.loan.download.dataPrivacy', loanReference)} target="_blank" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5"><Download size={13}/> Privacy</a>}
                                    {hasRoute('admin.loan.download.authorityToDeduct') && <a href={route('admin.loan.download.authorityToDeduct', loanReference)} target="_blank" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5"><Download size={13}/> Authority</a>}
                                    {postDocTypes.some(d => d.key === 'ghqDeclaration') && hasRoute('admin.loan.download.ghqDeclaration') && (
                                        <a href={route('admin.loan.download.ghqDeclaration', loanReference)} target="_blank" className="px-3 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5"><Download size={13}/> GHQ Decl.</a>
                                    )}
                                </div>
                                {canManage && (
                                    <button onClick={() => updateStatus('Released')} disabled={processing || !canRelease} className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2">
                                        {processing ? <Loader2 className="animate-spin h-4 w-4"/> : <Wallet size={16}/>} Release Funds
                                    </button>
                                )}
                            </>
                        )}
                        
                        {isReleased && hasRoute('admin.loan.download.ledger') && (
                            <a href={route('admin.loan.download.ledger', loanReference)} target="_blank" className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-sm flex items-center gap-2"><FileText size={16}/> Ledger</a>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* LEFT COLUMN: INFO & FINANCIALS */}
                    <div className="space-y-6 xl:col-span-1">
                        
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/10">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2"><User size={14}/> Borrower Details</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg uppercase">{member?.firstName?.[0]}{member?.lastName?.[0]}</div>
                                <div><div className="font-bold text-slate-900 dark:text-white text-lg">{member?.lastName}, {member?.firstName}</div><div className="text-sm text-slate-500">@{member?.username}</div></div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-slate-50 dark:border-white/5 pb-2"><span className="text-slate-500">Branch</span><span className="font-medium text-slate-900 dark:text-white">{member?.branchService || 'N/A'}</span></div>
                                <div className="flex justify-between border-b border-slate-50 dark:border-white/5 pb-2"><span className="text-slate-500">Email</span><span className="font-medium text-slate-900 dark:text-white truncate">{member?.email || 'N/A'}</span></div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/10">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2"><Banknote size={14}/> Loan Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-1"><span className="text-slate-500">Principal</span><span className="font-bold font-mono">{asMoney(loan.loanAmount)}</span></div>
                                <div className="flex justify-between py-1"><span className="text-slate-500">Net Proceeds</span><span className="font-bold text-emerald-600 font-mono">{asMoney(loan.netProceeds)}</span></div>
                                <div className="flex justify-between py-1"><span className="text-slate-500">Monthly Amort.</span><span className="font-bold font-mono">{asMoney(loan.monthlyAmortization)}</span></div>
                                <div className="flex justify-between py-1"><span className="text-slate-500">Term</span><span className="font-medium">{loan.termYears} Years ({loan.termYears * 12} mos)</span></div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/10">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2"><Calculator size={14}/> Financial Breakdown</h3>
                            <div className="space-y-1 mb-6"><DataRow label="Gross Loan" value={asMoney(loan.grossAmount)} /><DataRow label="Principal" value={asMoney(loan.loanAmount)} isTitle /></div>
                            <div className="space-y-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><Minus size={12} className="text-rose-500"/> Deductions</p>
                                <DataRow label="Service Fee" value={asMoney(loan.serviceFee)} />
                                <DataRow label="Insurance" value={asMoney(loan.insurance)} />
                                <DataRow label="Advance Interest" value={asMoney(loan.advanceInterest)} />
                                <DataRow label="Capital Contrib." value={asMoney(loan.capCon)} />
                                <DataRow label="Membership Fee" value={asMoney(loan.membershipFee)} />
                                <DataRow label="Total Deductions" value={asMoney(totalDeductions)} isTitle />
                            </div>
                        </div>
                        
                        {/* RELEASE REQUIREMENTS GAUGE */}
                        {isApproved && canManage && !isReleased && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/10">
                                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2"><ShieldCheck size={14}/> Release Requirements</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Post-Approval Docs</span>
                                        {hasAllPostApprovalDocs ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> Complete</span> : <span className="text-rose-600 flex items-center gap-1"><XCircle size={12}/> {postApprovalDocs.length}/{postDocTypes.length} Docs</span>}
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Downloads Confirmed</span>
                                        {downloadsAck ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> Yes</span> : <button onClick={() => setConfirmOpen(true)} className="text-amber-600 hover:underline flex items-center gap-1"><AlertCircle size={12}/> Confirm Now</button>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: TABS & DOCUMENTS */}
                    <div className="xl:col-span-2 space-y-6">

                        {/* GENERAL LEDGER */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2"><BookOpen size={14}/> General Ledger</h3>
                                <div className="flex items-center gap-2">
                                    {hasRoute('admin.loan.download.accountingEntry') && (
                                        <a href={route('admin.loan.download.accountingEntry', loanReference)} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[9px] font-black uppercase shadow-sm">
                                            <Download size={12} strokeWidth={2.5} /> Print Entry
                                        </a>
                                    )}
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 text-[9px] uppercase font-black text-slate-400 border-b border-slate-100">
                                        <tr><th className="px-4 py-3">Account</th><th className="px-4 py-3 text-right">Debit</th><th className="px-4 py-3 text-right">Credit</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {journalEntries.map(entry => (
                                            <tr key={entry.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3"><div className="font-bold text-[11px]">{entry.accountName}</div><div className="text-[10px] font-mono text-indigo-500">{entry.accountCode}</div></td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-xs">{Number(entry.debit) > 0 ? asMoney(entry.debit) : '-'}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-xs">{Number(entry.credit) > 0 ? asMoney(entry.credit) : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {/* PRE-APPROVAL CHECKLIST */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <div><h3 className="font-bold flex items-center gap-2"><ShieldCheck className="text-emerald-500" size={18} /> Pre-Approval Requirements</h3></div>
                                <div className="text-xs font-semibold px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-sm">{isComplete ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> Complete</span> : <span className="text-amber-600 flex items-center gap-1"><AlertCircle size={12}/> Incomplete</span>}</div>
                            </div>
                            
                            <div className="divide-y divide-slate-100">
                                {requirements.map((req, idx) => {
                                    const uploadedFiles = existingDocuments.filter(d => d.docsType === req.key);
                                    const isUploaded = uploadedFiles.length > 0;
                                    return (
                                        <div key={idx} className="p-4 hover:bg-slate-50 flex justify-between">
                                            <div className="flex gap-3">
                                                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${isUploaded ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
                                                    {isUploaded ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-semibold ${isUploaded ? 'text-slate-900' : 'text-slate-500'}`}>{req.label}</p>
                                                    {uploadedFiles.map(file => (
                                                        <a key={file.id} href={route('admin.loans.preDocuments.preview', { loanReference, documentId: file.id })} target="_blank" className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 mt-2 rounded-lg hover:bg-emerald-100"><Paperclip size={12} /> {file.originalName} <ExternalLink size={10} className="opacity-50"/></a>
                                                    ))}
                                                </div>
                                            </div>
                                            {isPending && canManage && (
                                                <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${isUploaded ? 'bg-white border-slate-200 text-slate-600' : 'bg-blue-600 text-white'}`}>
                                                    <UploadCloud size={14} /> {isUploaded ? 'Replace' : 'Upload'}
                                                    <input type="file" className="hidden" onChange={(e) => handleUpload(e, req.key, 'admin.loans.documents.store')} disabled={uploading}/>
                                                </label>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* POST APPROVAL DOCS GRID */}
                        {(isApproved || isReleased) && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50"><h3 className="font-bold flex items-center gap-2"><Lock className="text-blue-500" size={18} /> Post-Approval Documents</h3></div>
                                <div className="p-6">
                                    <p className="text-sm text-slate-500 mb-4">Download the forms from the top menu, have the borrower sign them, and upload the signed copies here. All files must be uploaded before funds can be released.</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {postDocTypes.map(type => {
                                            const uploadedDoc = postApprovalDocs.find(d => d.docsType === type.key);
                                            const isUploaded = !!uploadedDoc;

                                            return (
                                                <div key={type.key} className="relative p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${isUploaded ? 'bg-emerald-500' : 'bg-slate-300'}`}></div><span className="text-sm font-semibold">{type.label}</span></div>
                                                        
                                                        {/* POST UPLOAD */}
                                                        {!isUploaded && !isReleased && canManage && (
                                                            <label className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1"><UploadCloud size={14}/> Upload
                                                                <input type="file" className="hidden" onChange={(e) => handleUpload(e, type.key, 'admin.loans.postApprovalDocs.store')} disabled={uploading}/>
                                                            </label>
                                                        )}
                                                    </div>

                                                    {isUploaded ? (
                                                        <a href={route('admin.loans.postDocuments.preview', { loanReference, documentId: uploadedDoc.id })} target="_blank" className="flex items-center gap-3 mt-2 bg-slate-100 p-2 rounded-lg hover:bg-slate-200">
                                                            <div className="text-blue-500"><FileText size={16}/></div><div className="min-w-0 flex-1 text-xs font-medium truncate">{uploadedDoc.originalName}</div><ExternalLink size={12} className="text-slate-400"/>
                                                        </a>
                                                    ) : (<div className="mt-2 text-xs text-slate-400 italic">Pending Upload</div>)}
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm p-6">
                        <h3 className="text-lg font-bold mb-2">Confirm Downloads</h3>
                        <p className="text-sm text-slate-600 mb-6">Confirm you have downloaded all required documents?</p>
                        <div className="flex justify-end gap-3"><button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium">Cancel</button><button onClick={acknowledgeDownloads} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold">Confirm</button></div>
                    </div>
                    </div>
                )}

                {/* DECLINE MODAL */}
                {declineModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                            <h2 className="text-lg font-bold mb-4">Decline Loan Application</h2>
                            <textarea className="w-full p-3 rounded-xl border border-slate-200 h-32 mb-4" placeholder="Reason for rejection..." value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
                            <div className="flex justify-end gap-3"><button onClick={() => setDeclineModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100">Cancel</button><button onClick={handleDecline} disabled={processing || !declineReason.trim()} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 disabled:opacity-50">Confirm Decline</button></div>
                        </div>
                    </div>
                )}

            </AdminSidebarLayout>
        </>
    );
}