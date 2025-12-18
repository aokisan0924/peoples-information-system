import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import {
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  UploadCloud,
  ArrowLeft,
  User,
  AlertCircle,
  Download,
  Trash2,
  Loader2,
  Lock
} from "lucide-react";

export default function AdminLoanDetails({ loanReference }) {
  // --- AUTH CHECK ---
  const { auth } = usePage().props;
  const userRole = (auth?.user?.role || "").toLowerCase();
  const canManage = ['super-admin', 'loan-processor'].includes(userRole);

  const [loan, setLoan] = useState(null);
  const [member, setMember] = useState(null);
  const [requiredType, setRequiredType] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [postApprovalDocs, setPostApprovalDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // -------------------------------
  // PRE-APPROVAL uploader states
  // -------------------------------
  const preDropRef = useRef(null);
  const [preQueueFiles, setPreQueueFiles] = useState([]); 
  const [preDocsType, setPreDocsType] = useState("");
  const prePendingCount = useMemo(
    () => preQueueFiles.filter(f => f.status === "Pending" || f.status === "Error").length,
    [preQueueFiles]
  );

  const onPreDragOver = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    preDropRef.current?.classList.add("border-emerald-500", "bg-emerald-50", "dark:bg-emerald-500/10");
  }, []);

  const onPreDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    preDropRef.current?.classList.remove("border-emerald-500", "bg-emerald-50", "dark:bg-emerald-500/10");
  }, []);

  const onPreDrop = useCallback((e) => {
      e.preventDefault(); e.stopPropagation();
      preDropRef.current?.classList.remove("border-emerald-500", "bg-emerald-50", "dark:bg-emerald-500/10");
      const dropped = Array.from(e.dataTransfer?.files || []);
      if (!dropped.length) return;
      setPreQueueFiles((prev) => [...prev, ...dropped.map((f) => ({ file: f, docsType: preDocsType, status: "Pending" }))]);
    }, [preDocsType]);

  const onPrePick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setPreQueueFiles((prev) => [...prev, ...picked.map((f) => ({ file: f, docsType: preDocsType, status: "Pending" }))]);
    e.target.value = "";
  };

  const removePreQueued = (idx) => setPreQueueFiles((prev) => prev.filter((_, i) => i !== idx));

  const uploadAllPre = async () => {
    const toUpload = preQueueFiles.map((it, i) => ({ ...it, idx: i })).filter((it) => it.status === "Pending" || it.status === "Error");
    if (!toUpload.length) { toast("Nothing to upload."); return; }

    setPreQueueFiles((prev) => prev.map((it, i) => toUpload.some((t) => t.idx === i) ? { ...it, status: "Uploading" } : it));

    try {
      const form = new FormData();
      toUpload.forEach((item, i) => {
        form.append(`files[${i}][file]`, item.file);
        form.append(`files[${i}][docsType]`, item.docsType || "");
      });
      await axios.post(route("admin.loans.documents.store", { loanReference }), form, { headers: { "Content-Type": "multipart/form-data" } });

      setPreQueueFiles((prev) => prev.map((it, i) => toUpload.some((t) => t.idx === i) ? { ...it, status: "Success" } : it));
      toast.success(`Uploaded ${toUpload.length} file(s).`);
      fetchDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Upload failed");
      setPreQueueFiles((prev) => prev.map((it, i) => toUpload.some((t) => t.idx === i) ? { ...it, status: "Error" } : it));
    }
  };

  // -------------------------------
  // POST-APPROVAL uploader states
  // -------------------------------
  const dropRef = useRef(null);
  const [queueFiles, setQueueFiles] = useState([]); 
  const [docsType, setDocsType] = useState("signedApplication");
  const pendingCount = useMemo(() => queueFiles.filter(f => f.status === "Pending" || f.status === "Error").length, [queueFiles]);

  const onDragOver = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    dropRef.current?.classList.add("border-blue-500", "bg-blue-50", "dark:bg-blue-500/10");
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    dropRef.current?.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-500/10");
  }, []);

  const onDrop = useCallback((e) => {
      e.preventDefault(); e.stopPropagation();
      dropRef.current?.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-500/10");
      const dropped = Array.from(e.dataTransfer?.files || []);
      if (!dropped.length) return;
      setQueueFiles((prev) => [...prev, ...dropped.map((f) => ({ file: f, docsType, status: "Pending" }))]);
    }, [docsType]);

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setQueueFiles((prev) => [...prev, ...picked.map((f) => ({ file: f, docsType, status: "Pending" }))]);
    e.target.value = "";
  };

  const removeQueued = (idx) => setQueueFiles((prev) => prev.filter((_, i) => i !== idx));

  const uploadAll = async () => {
    const toUpload = queueFiles.map((it, i) => ({ ...it, idx: i })).filter((it) => it.status === "Pending" || it.status === "Error");
    if (!toUpload.length) { toast("Nothing to upload."); return; }

    setQueueFiles((prev) => prev.map((it, i) => toUpload.some((t) => t.idx === i) ? { ...it, status: "Uploading" } : it));

    try {
      const form = new FormData();
      toUpload.forEach((item, i) => {
        form.append(`files[${i}][file]`, item.file);
        form.append(`files[${i}][docsType]`, item.docsType || "");
      });
      await axios.post(route("admin.loans.postApprovalDocs.store", { loanReference }), form, { headers: { "Content-Type": "multipart/form-data" } });

      setQueueFiles((prev) => prev.map((it, i) => toUpload.some((t) => t.idx === i) ? { ...it, status: "Success" } : it));
      toast.success(`Uploaded ${toUpload.length} file(s).`);
      fetchDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Upload failed");
      setQueueFiles((prev) => prev.map((it, i) => toUpload.some((t) => t.idx === i) ? { ...it, status: "Error" } : it));
    }
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(route("admin.api.loans.details", { loanReference }));
      setLoan(res.data.loan);
      setMember(res.data.member);
      setRequiredType(res.data.requiredType || []);
      setExistingDocuments(res.data.existingDocuments || []);
      setPostApprovalDocs(res.data.postApprovalDocuments || []);
      setPreDocsType((prev) => prev || res.data.requiredType?.[0] || "");
    } catch {
      toast.error("Failed to load loan details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetails(); }, [loanReference]);

  // Actions
  const handleApprove = async () => { if(!canManage) return; try { await axios.post(route("admin.loan.approve", { loanReference })); toast.success("Approved."); fetchDetails(); } catch (e) { toast.error(e?.response?.data?.message || "Approval failed."); } };
  const handleDecline = async () => { if(!canManage) return; try { await axios.post(route("admin.loan.decline", { loanReference })); toast.success("Declined."); fetchDetails(); } catch (e) { toast.error(e?.response?.data?.message || "Decline failed."); } };
  const handleRelease = async () => { if(!canManage) return; try { await axios.post(route("admin.loan.release", { loanReference })); toast.success("Released."); fetchDetails(); } catch (e) { toast.error(e?.response?.data?.message || "Release failed."); } };
  const acknowledgeDownloads = async () => { if(!canManage) return; try { await axios.post(route("admin.loan.ackDownloads", { loanReference })); toast.success("Confirmed."); setConfirmOpen(false); setLoan(prev => ({...prev, downloadsAcknowledged: true})); fetchDetails(); } catch (e) { toast.error(e?.response?.data?.message || "Confirmation failed."); } };

  if (loading) return <AdminSidebarLayout><div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div></AdminSidebarLayout>;
  if (!loan || !member) return <AdminSidebarLayout><div className="p-6 text-center text-slate-500">Loan not found</div></AdminSidebarLayout>;

  const loanStatus = (loan?.status || "").trim().toLowerCase();
  const downloadsAck = !!loan?.downloadsAcknowledged;
  const isReleased = loanStatus === "released";
  const hasAllPreRequired = requiredType.length > 0 && requiredType.every(t => existingDocuments.some(d => d.docsType === t));
  const hasAllPostApprovalDocs = ['signedApplication','releaseVoucher','borrowerPhoto','scannedCheck'].every(t => postApprovalDocs.some(d => d.docsType === t));
  const canRelease = loanStatus === "approved" && hasAllPostApprovalDocs && downloadsAck;
  
  // Show downloads if approved OR released
  const showDownloads = loanStatus === "approved" || isReleased;

  const DocItem = ({ item, accent = "gray" }) => {
    const sizeKb = (item.size > 0 ? (item.size / 1024).toFixed(1) : 0) + " KB";
    return (
      <li className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className={`p-2 rounded-lg ${accent === 'green' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}><FileText size={18} /></div>
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.originalName}</p>
                <div className="flex gap-2 text-[10px] text-slate-500"><span className="uppercase font-bold">{item.docsType}</span><span>{sizeKb}</span></div>
            </div>
        </div>
        <a href={item.isPost ? route("admin.loans.postDocuments.preview", { loanReference, documentId: item.id }) : route("admin.loans.preDocuments.preview", { loanReference, documentId: item.id })} target="_blank" className="p-2 text-slate-400 hover:text-emerald-600"><ExternalLink size={16} /></a>
      </li>
    );
  };

  const hasRoute = (name) => (typeof route === "function" && route().has ? route().has(name) : false);

  return (
    <>
      <Head title="Loan Details" />
      <AdminSidebarLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Link href={route("admin.loans")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 transition-colors text-xs font-medium"><ArrowLeft size={14} /> Back</Link>
          </div>
          <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-600" /> Loan Details</h1></div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
                
                {/* Borrower Info */}
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2"><User size={16} className="text-emerald-500" /> Borrower</h2>
                    <div className="text-sm space-y-2">
                        <p className="font-medium text-slate-900 dark:text-white">{member.lastName}, {member.firstName}</p>
                        <p className="text-slate-500 text-xs">@{member.username}</p>
                        <p className="text-slate-500 text-xs">{member.email}</p>
                    </div>
                </div>

                {/* DOWNLOADS PANEL - Visible to ALL if approved/released */}
                {showDownloads && (
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Download size={16} className="text-emerald-500" /> Generated Files
                        </h2>
                        <div className="flex flex-col gap-2">
                            {hasRoute("admin.loan.download.application") && (
                                <a href={route("admin.loan.download.application", { loanReference })} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-sm text-slate-700 dark:text-slate-200 transition-colors group">
                                    <div className="p-1.5 bg-white dark:bg-white/10 rounded text-emerald-600"><FileText size={14} /></div>
                                    Application Form
                                    <ExternalLink size={12} className="ml-auto opacity-50 group-hover:opacity-100" />
                                </a>
                            )}
                            {hasRoute("admin.loan.download.releaseVoucher") && (
                                <a href={route("admin.loan.download.releaseVoucher", { loanReference })} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-sm text-slate-700 dark:text-slate-200 transition-colors group">
                                    <div className="p-1.5 bg-white dark:bg-white/10 rounded text-emerald-600"><FileText size={14} /></div>
                                    Release Voucher
                                    <ExternalLink size={12} className="ml-auto opacity-50 group-hover:opacity-100" />
                                </a>
                            )}
                            {hasRoute("admin.loan.download.ledger") && (
                                <a href={route("admin.loan.download.ledger", { loanReference })} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-sm text-slate-700 dark:text-slate-200 transition-colors group">
                                    <div className="p-1.5 bg-white dark:bg-white/10 rounded text-emerald-600"><FileText size={14} /></div>
                                    Loan Ledger
                                    <ExternalLink size={12} className="ml-auto opacity-50 group-hover:opacity-100" />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* ACTIONS PANEL */}
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Actions</h2>
                    {canManage ? (
                        <>
                            {loanStatus === "pending" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handleApprove} disabled={!hasAllPreRequired} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${hasAllPreRequired ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}><CheckCircle2 size={16} /> Approve</button>
                                    <button onClick={handleDecline} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100"><XCircle size={16} /> Decline</button>
                                </div>
                            )}
                            {loanStatus === "approved" && (
                                <div className="space-y-3">
                                    {hasAllPostApprovalDocs && !downloadsAck && <button onClick={() => setConfirmOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600"><CheckCircle2 size={16} /> Confirm Downloads</button>}
                                    <button onClick={handleRelease} disabled={!canRelease} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${canRelease ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}><ShieldCheck size={16} /> Mark as Released</button>
                                </div>
                            )}
                            {isReleased && <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 text-center"><p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Loan Released</p></div>}
                        </>
                    ) : (
                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 flex items-start gap-3">
                            <Lock className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Read-Only Access</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">You do not have permission to process transactions for this loan.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: DOCUMENTS */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4"><UploadCloud className="w-5 h-5 text-emerald-500" /> Pre-Approval Docs</h2>
                    
                    {canManage && !isReleased && loanStatus !== 'approved' && (
                        <div className="mb-6 space-y-4">
                            <div className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors" ref={preDropRef} onDragOver={onPreDragOver} onDragLeave={onPreDragLeave} onDrop={onPreDrop}>
                                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Drag & drop files here</p>
                                <label className="inline-flex items-center px-4 py-2 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer">Browse Files <input type="file" multiple onChange={onPrePick} className="hidden" accept="image/*,application/pdf" /></label>
                            </div>
                            {preQueueFiles.length > 0 && <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase text-slate-500">Pending: {preQueueFiles.length}</span><button onClick={uploadAllPre} className="text-xs font-bold text-emerald-600 hover:underline">Upload All</button></div>}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{existingDocuments.map((d) => <DocItem key={d.id} item={d} accent="gray" />)}</div>
                </div>

                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4"><ShieldCheck className="w-5 h-5 text-blue-500" /> Post-Approval Docs</h2>
                    
                    {canManage && loanStatus === 'approved' && !isReleased && (
                        <div className="mb-6 space-y-4">
                            <div className="border-2 border-dashed border-blue-200 dark:border-blue-500/30 rounded-xl p-6 text-center hover:bg-blue-50 transition-colors" ref={dropRef} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
                                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Drag & drop signed docs</p>
                                <label className="inline-flex items-center px-4 py-2 mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer">Browse Files <input type="file" multiple onChange={onPick} className="hidden" accept="image/*,application/pdf" /></label>
                            </div>
                            {queueFiles.length > 0 && <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase text-slate-500">Pending: {queueFiles.length}</span><button onClick={uploadAll} className="text-xs font-bold text-blue-600 hover:underline">Upload All</button></div>}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{postApprovalDocs.map((d) => <DocItem key={d.id} item={d} accent="green" />)}</div>
                </div>
            </div>
          </div>
        </div>
      </AdminSidebarLayout>
      
      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Confirm Downloads</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Confirm you have downloaded all required documents?</p>
            <div className="flex justify-end gap-3"><button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">Cancel</button><button onClick={acknowledgeDownloads} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold">Confirm</button></div>
          </div>
        </div>
      )}

        <style>{`
            .input-field {
                width: 100%;
                padding: 0.5rem 0.75rem;
                border-radius: 0.75rem;
                border: 1px solid #e2e8f0;
                background-color: #fff;
                color: #0f172a;
                outline: none;
                transition: all 0.2s;
            }
            .dark .input-field {
                background-color: rgba(255,255,255,0.05);
                border-color: rgba(255,255,255,0.1);
                color: #fff;
            }
            .input-field:focus {
                border-color: #10b981;
                box-shadow: 0 0 0 1px #10b981;
            }
        `}</style>
    </>
  );
}