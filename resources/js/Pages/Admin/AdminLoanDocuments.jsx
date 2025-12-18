import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { 
    Upload, FileText, X, Check, AlertCircle, Loader2, 
    ArrowRight, HardDrive, MousePointer2, CloudUpload, Trash2, Eye 
} from 'lucide-react';

export default function AdminLoanDocuments({ loan, requiredType = [], existingDocuments = [] }) {
    const dropRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [docsType, setDocsType] = useState(requiredType?.[0] ?? '');

    const pendingCount = useMemo(
        () => files.filter(f => f.status === 'Pending' || f.status === 'Error').length,
        [files]
    );

    // --- DRAG & DROP HANDLERS ---
    const onDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropRef.current) dropRef.current.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-500/10');
    }, []);

    const onDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropRef.current) dropRef.current.classList.remove('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-500/10');
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropRef.current) dropRef.current.classList.remove('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-500/10');

        const dropped = Array.from(e.dataTransfer.files || []);
        if (!dropped.length) return;

        const mapped = dropped.map((f) => ({
            file: f,
            docsType,
            status: 'Pending',
        }));

        setFiles((prev) => [...prev, ...mapped]);
    }, [docsType]);

    // --- FILE PICKER ---
    const onPick = (e) => {
        const picked = Array.from(e.target.files || []);
        if (!picked.length) return;

        const mapped = picked.map((f) => ({
            file: f,
            docsType,
            status: 'Pending'
        }));

        setFiles((prev) => [...prev, ...mapped]);
        e.target.value = '';
    };

    const updateDocTypeFor = (idx, value) => {
        setFiles((prev) => prev.map((it, i) => i === idx ? { ...it, docsType: value } : it));
    };

    const removeFile = (idx) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    // --- UPLOAD LOGIC ---
    const uploadOne = async (idx) => {
        const item = files[idx];
        if (!item) return;

        setFiles((prev) => prev.map((it, i) => (i === idx ? { ...it, status: 'Uploading' } : it)));

        try {
            const form = new FormData();
            form.append('files[0][file]', item.file);
            form.append('files[0][docsType]', item.docsType || '');

            const url = route('admin.loans.documents.store', { loanReference: loan.loanReference });
            await axios.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });

            setFiles((prev) => prev.map((it, i) => (i === idx ? { ...it, status: 'Success' } : it)));
            toast.success(`${item.file.name} uploaded`);
            router.reload({ only: ['existingDocuments'] });
        } catch (error) {
            console.error(error);
            const msg = error?.response?.data?.message || 'Upload failed.';
            toast.error(msg);
            setFiles((prev) => prev.map((it, i) => (i === idx ? { ...it, status: 'Error' } : it)));
        }
    };

    const uploadAll = async () => {
        const toUpload = files
            .map((it, i) => ({ ...it, idx: i }))
            .filter((it) => it.status === 'Pending' || it.status === 'Error');

        if (toUpload.length === 0) {
            toast('Nothing to upload.');
            return;
        }

        setFiles((prev) =>
            prev.map((it, i) =>
                toUpload.some(t => t.idx === i) ? { ...it, status: 'Uploading' } : it
            )
        );

        try {
            const form = new FormData();
            toUpload.forEach((item, i) => {
                form.append(`files[${i}][file]`, item.file);
                form.append(`files[${i}][docsType]`, item.docsType || '');
            });

            const url = route('admin.loans.documents.store', { loanReference: loan.loanReference });
            await axios.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });

            setFiles((prev) =>
                prev.map((it, i) =>
                    toUpload.some(t => t.idx === i) ? { ...it, status: 'Success' } : it
                )
            );

            toast.success(`Uploaded ${toUpload.length} file(s).`);
            router.reload({ only: ['existingDocuments'] });
        } catch (error) {
            console.error(error);
            const msg = error?.response?.data?.message || 'Upload failed';
            toast.error(msg);

            setFiles((prev) =>
                prev.map((it, i) =>
                    toUpload.some(t => t.idx === i) ? { ...it, status: 'Error' } : it
                )
            );
        }
    };

    return (
        <AdminSidebarLayout>
            <Head title="Upload Documents">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="space-y-6">
                
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <CloudUpload className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            Upload Documents
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Reference: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{loan.loanReference}</span>
                        </p>
                    </div>
                    
                    {/* Doc Type Selector */}
                    <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 uppercase">Default Type:</span>
                        <select
                            value={docsType}
                            onChange={(e) => setDocsType(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium text-slate-900 dark:text-white focus:ring-0 cursor-pointer py-1 pr-8"
                        >
                            {requiredType.map((t) => (
                                <option key={t} value={t} className="text-slate-900">{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT COLUMN: UPLOAD AREA & PENDING LIST */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Drag & Drop Area */}
                        <div
                            ref={dropRef}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className="relative group flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                        >
                            <input type="file" multiple onChange={onPick} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,application/pdf" />
                            
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <div className="p-3 mb-3 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    <CloudUpload size={28} />
                                </div>
                                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold text-slate-900 dark:text-white">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">PDF, PNG, JPG (MAX. 10MB)</p>
                            </div>
                        </div>

                        {/* Pending Files List */}
                        {files.length > 0 && (
                            <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/5">
                                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <MousePointer2 size={16} className="text-emerald-500" /> 
                                        Pending Uploads <span className="text-xs font-normal text-slate-500">({pendingCount})</span>
                                    </h3>
                                    {pendingCount > 0 && (
                                        <button
                                            onClick={uploadAll}
                                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all"
                                        >
                                            Upload All
                                        </button>
                                    )}
                                </div>
                                <div className="p-4 grid gap-3">
                                    {files.map((item, idx) => (
                                        <div 
                                            key={`${item.file.name}-${idx}`} 
                                            className={`flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-xl border transition-all ${
                                                item.status === 'Success' 
                                                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5' 
                                                    : item.status === 'Error'
                                                    ? 'border-rose-200 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/5'
                                                    : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/5'
                                            }`}
                                        >
                                            {/* File Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-slate-400" />
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.file.name}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500">{(item.file.size / 1024).toFixed(1)} KB</span>
                                                    <span className="text-xs text-slate-300">•</span>
                                                    
                                                    {/* Status Badge */}
                                                    {item.status === 'Pending' && <span className="text-xs text-slate-500">Pending</span>}
                                                    {item.status === 'Uploading' && <span className="text-xs text-blue-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Uploading...</span>}
                                                    {item.status === 'Success' && <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><Check size={10}/> Uploaded</span>}
                                                    {item.status === 'Error' && <span className="text-xs text-rose-600 font-bold flex items-center gap-1"><AlertCircle size={10}/> Error</span>}
                                                </div>
                                            </div>

                                            {/* Type Selector & Actions */}
                                            <div className="flex items-center gap-3">
                                                <select
                                                    value={item.docsType}
                                                    onChange={(e) => updateDocTypeFor(idx, e.target.value)}
                                                    disabled={item.status === 'Success' || item.status === 'Uploading'}
                                                    className="rounded-lg border-slate-200 bg-white dark:bg-white/5 dark:border-white/10 text-xs py-1.5 pl-2 pr-7 focus:ring-emerald-500 disabled:opacity-50"
                                                >
                                                    {requiredType.map((t) => <option key={t} value={t} className="text-slate-900">{t}</option>)}
                                                    <option value="" className="text-slate-900">(none)</option>
                                                </select>

                                                {item.status !== 'Success' && (
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={() => uploadOne(idx)}
                                                            disabled={item.status === 'Uploading'}
                                                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition"
                                                            title="Upload"
                                                        >
                                                            <Upload size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => removeFile(idx)}
                                                            disabled={item.status === 'Uploading'}
                                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                                                            title="Remove"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: EXISTING DOCS & ACTIONS */}
                    <div className="space-y-6">
                        
                        {/* Server Files */}
                        <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <HardDrive size={16} className="text-blue-500" />
                                    Uploaded Documents
                                </h3>
                            </div>
                            
                            <div className="p-2 max-h-[400px] overflow-y-auto space-y-1">
                                {existingDocuments.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                        No documents uploaded yet.
                                    </div>
                                ) : (
                                    existingDocuments.map((d) => (
                                        <div key={d.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{d.originalName}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        {d.docsType || 'Uncategorized'} • {(d.size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <a
                                                href={route('admin.loans.documents.preview', {
                                                    loanReference: loan.loanReference,
                                                    documentId: d.id
                                                })}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition"
                                                title="Preview Document"
                                            >
                                                <Eye size={16} />
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Proceed Button */}
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-500/20 text-center">
                            <h4 className="text-emerald-800 dark:text-emerald-200 font-bold mb-1">Ready to Proceed?</h4>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mb-4">Ensure all required documents are uploaded before continuing.</p>
                            <button
                                onClick={() => router.visit(route('admin.loans.showLoan', { loanReference: loan.loanReference }))}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                Proceed to Review <ArrowRight size={16} />
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </AdminSidebarLayout>
    );
}