import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';

export default function AdminLoanDocuments({ loan, requiredType = [], existingDocuments = []} ) {
    const dropRef = useRef(null);
    const [ files, setFiles ] = useState([]);
    const [ docsType, setDocsType ] = useState(requiredType?.[0] ?? '');

    const pendingCount = useMemo(
        () => files.filter(f => f.status === 'Pending' || f.status === 'Error').length,
        [files]
    );

    // drag/drop handlers
    const onDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (dropRef.current)
            dropRef.current.classList.add('ring-2', 'ring-green-500');
    }, []);

    const onDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (dropRef.current)
            dropRef.current.classList.add('ring-2', 'ring-green-500');
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (dropRef.current)
            dropRef.current.classList.add('ring-2', 'ring-green-500');

        const dropped = Array.from(e.dataTransfer.files || []);
        if (!dropped.length)
            return;

        const mapped = dropped.map((f) => ({
            file: f,
            docsType,
            status: 'Pending',
        }));

        setFiles((prev) => [...prev, ...mapped]);
    }, [docsType]);

    // file picker
    const onPick = (e) => {
        const picked = Array.from(e.target.files || []);
        if (!picked.length)
            return;

        const mapped = picked.map((f) => ({
            file: f,
            docsType,
            status: 'Pending'
        }));

        setFiles((prev) => [...prev, ...mapped]);
        e.target.value = '';
    };

    const updateDocTypeFor = (idx, value) => {
        setFiles((prev) => prev.map((it, i) => i === idx ? {...it, docsType: value } : it));
    };

    const removeFile = (idx) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    // Single Upload
    const uploadOne = async (idx) => {
        const item = files[idx];
        if (!item)
            return;

        setFiles((prev) => 
            prev.map((it, i) => 
                (i === idx ? 
                { ...it, status: 'Uploading' } 
                : it)
            )
        );

        try {
            const form = new FormData();
            form.append('files[0][file]', item.file);
            form.append('files[0][docsType]', item.docsType || '');

            const url = route('admin.loans.documents.store', { loanReference: loan.loanReference });
            await axios.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });

            setFiles((prev) => 
                prev.map((it, i) => 
                    (i === idx ? 
                    { ...it, status: 'success' } 
                    : it)
                )
            );
            toast.success(`${item.file.name} uploaded`);
            toast.reload({ only: ['existingDocuments'] });
        } catch (error) {
            console.error(error);
            const msg = error?.response?.data?.message || 'Upload failed.';
            toast.error(msg);

            setFiles((prev) =>
                prev.map((it, i) =>
                    (i === idx ?
                    { ...it, status: 'error'}
                    : it)
                )
            );
        }
    };

    // upload all pending/error
    const uploadAll = async () => {
        const toUpload = files
        .map((it, i) => ({ ...it, idx: i }))
        .filter((it) => it.status === 'Pending' || it.status === 'Error');

        if (toUpload.length === 0) {
            toast('Nothing to upload.');
            return;
        }

        // Mark only those as uploading
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
            await axios.post(url, form, { headers: {'Content-Type': 'multipart/form-data' } });

            setFiles((prev) =>
                prev.map((it, i) =>
                    toUpload.some(t => t.idx === i) ? { ...it, status: 'success' } : it
                )
            );

            toast.success(`Uploaded ${toUpload.length} file(s).`);
            toast.reload({ only: ['existingDocuments'] });
        } catch (error) {
            console.error(err);
            const msg = err?.response?.data?.message || 'Upload failed';
            toast.error(msg);

            setFiles((prev) =>
                prev.map((it, i) =>
                    toUpload.some(t => t.idx === i) ? { ...it, status: 'error' } : it
                )
            );
        }
    };

    return (
        <>
            <Head title="Upload Documents">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="p-4 md:p-6 space-y-6">
                    <h1 className="text-2xl font-bold text-green-600">
                        Upload Documents — {loan.loanReference}
                    </h1>

                    {/* Doc type to apply to new picks/drops */}
                    <div>
                        <label className="text-sm font-medium">Document Type</label>
                        <select
                            value={docsType}
                            onChange={(e) => setDocsType(e.target.value)}
                            className="w-full md:w-64 rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500"
                        >
                            {requiredType.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Drag & Drop Area */}
                    <div
                        ref={dropRef}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className="bg-white rounded-xl shadow p-6 border border-dashed border-gray-300 text-center"
                    >
                        <p className="text-gray-600 mb-2 font-medium">Drag & drop files here</p>
                        <p className="text-gray-500 text-sm mb-4">or click the button below</p>
                        <label className="inline-block">
                            <input type="file" multiple onChange={onPick} className="hidden" accept="image/*,application/pdf" />
                            <span className="px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 cursor-pointer">
                            Browse files
                            </span>
                        </label>
                    </div>

                    {/* Pending/Selected Files */}
                    <div className="bg-white rounded-xl shadow p-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-green-600">
                                Pending Uploads <span className='text-gray-500 text-sm'>({pendingCount} pending)</span>
                            </h2>
                            <button
                                onClick={uploadAll}
                                disabled={files.length === 0}
                                className={`px-4 py-2 rounded text-white ${files.length === 0 ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                Upload All
                            </button>
                        </div>

                        {files.length === 0 ? (
                            <p className="text-sm text-gray-500 mt-2">No files yet. Drag & drop or browse.</p>
                        ) : (
                            <ul className="mt-4 grid md:grid-cols-2 gap-3">
                                {files.map((item, idx) => {
                                const borderColor =
                                    item.status === 'Success' ? 'border-green-500'
                                    : item.status === 'Error' ? 'border-red-500'
                                    : item.status === 'Uploading' ? 'border-blue-400'
                                    : 'border-gray-200';

                                return (
                                    <li key={`${item.file.name}-${idx}`} className={`border ${borderColor} rounded p-3`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{item.file.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {(item.file.size / 1024).toFixed(1)} KB • {item.file.type || 'unknown'}
                                                    </div>

                                                    {/* per-file docType (editable) */}
                                                    <div className="mt-2">
                                                        <label className="text-xs text-gray-500 mr-2">type</label>
                                                        <select
                                                            value={item.docsType}
                                                            onChange={(e) => updateDocTypeFor(idx, e.target.value)}
                                                            className="rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500 text-sm"
                                                        >
                                                            {requiredType.map((t) => (
                                                                <option key={t} value={t}>{t}</option>
                                                            ))}
                                                            <option value="">(none)</option>
                                                        </select>
                                                    </div>

                                                {/* status */}
                                                <div className="text-xs mt-2">
                                                    {item.status === 'Pending' && <span className="text-gray-500">Pending</span>}
                                                    {item.status === 'Uploading' && <span className="text-blue-600">Uploading…</span>}
                                                    {item.status === 'Success' && <span className="text-green-600 font-medium">Uploaded ✔</span>}
                                                    {item.status === 'Error' && <span className="text-red-600">Error — try again</span>}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => uploadOne(idx)}
                                                    disabled={item.status === 'uploading' || item.status === 'Success'}
                                                    className={`px-3 py-1 rounded text-white text-sm ${
                                                        item.status === 'Success'
                                                        ? 'bg-gray-400'
                                                        : 'bg-green-600 hover:bg-green-700'
                                                    }`}
                                                    title="Upload this file"
                                                >
                                                    {item.status === 'success' ? 'Done' : 'Upload'}
                                                </button>

                                                <button
                                                    onClick={() => removeFile(idx)}
                                                    disabled={item.status === 'Uploading'}
                                                    className="px-3 py-1 rounded text-red-600 hover:bg-red-50 text-sm"
                                                    title="Remove"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Existing uploaded documents from server */}
                    <div className="bg-white rounded-xl shadow p-4">
                        <h2 className="text-lg font-semibold text-green-600 mb-3">existingDocuments</h2>
                        {existingDocuments.length === 0 ? (
                            <p className="text-sm text-gray-500">None uploaded yet.</p>
                        ) : (
                            <ul className="grid md:grid-cols-2 gap-3">
                                {existingDocuments.map((d) => (
                                    <li key={d.id} className="border rounded p-2">
                                        <div className="text-sm font-medium">{d.originalName}</div>
                                        <div className="text-xs text-gray-500">
                                            {d.docsType || '—'} • {d.mimeType} • {(d.size / 1024).toFixed(1)} KB
                                        </div>
                                        <a
                                            href={route('admin.loans.documents.preview', {
                                                loanReference: loan.loanReference,
                                                documentId: d.id
                                            })}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 text-sm hover:underline"
                                        >
                                            preview
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Proceed Button */}
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={() =>
                                router.visit(route('admin.loans.showLoan', {loanReference: loan.loanReference}))
                            }
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transition"
                        >
                            Proceed to Loan Review
                        </button>
                    </div>

                </div>
            </AdminSidebarLayout>
        </>
    );
}