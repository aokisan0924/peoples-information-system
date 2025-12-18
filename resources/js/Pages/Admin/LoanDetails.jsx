import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Head, Link } from "@inertiajs/react";
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
} from "lucide-react";

const asMoney = (v) =>
  Number(v || 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });

export default function AdminLoanDetails({ loanReference }) {
  const [loan, setLoan] = useState(null);
  const [member, setMember] = useState(null);
  const [requiredType, setRequiredType] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]); // pre-approval docs
  const [postApprovalDocs, setPostApprovalDocs] = useState([]); // post-approval docs
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // -------------------------------
  // PRE-APPROVAL uploader states
  // -------------------------------
  const preDropRef = useRef(null);
  const [preQueueFiles, setPreQueueFiles] = useState([]); // [{ file, docsType, status }]
  const [preDocsType, setPreDocsType] = useState("");
  const prePendingCount = useMemo(
    () =>
      preQueueFiles.filter(
        (f) => f.status === "Pending" || f.status === "Error"
      ).length,
    [preQueueFiles]
  );

  const onPreDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    preDropRef.current?.classList.add("ring-2", "ring-emerald-500");
  }, []);

  const onPreDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    preDropRef.current?.classList.remove("ring-2", "ring-emerald-500");
  }, []);

  const onPreDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      preDropRef.current?.classList.remove("ring-2", "ring-emerald-500");
      const dropped = Array.from(e.dataTransfer?.files || []);
      if (!dropped.length) return;
      const mapped = dropped.map((f) => ({
        file: f,
        docsType: preDocsType,
        status: "Pending",
      }));
      setPreQueueFiles((prev) => [...prev, ...mapped]);
    },
    [preDocsType]
  );

  const onPrePick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const mapped = picked.map((f) => ({
      file: f,
      docsType: preDocsType,
      status: "Pending",
    }));
    setPreQueueFiles((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const updatePreDocsTypeFor = (idx, value) => {
    setPreQueueFiles((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, docsType: value } : it))
    );
  };

  const removePreQueued = (idx) => {
    setPreQueueFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadOnePre = async (idx) => {
    const item = preQueueFiles[idx];
    if (!item) return;

    setPreQueueFiles((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, status: "Uploading" } : it
      )
    );
    try {
      const form = new FormData();
      form.append("files[0][file]", item.file);
      form.append("files[0][docsType]", item.docsType || "");
      const url = route("admin.loans.documents.store", { loanReference });
      await axios.post(url, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPreQueueFiles((prev) =>
        prev.map((it, i) =>
          i === idx ? { ...it, status: "Success" } : it
        )
      );
      toast.success(`${item.file.name} uploaded`);
      fetchDetails();
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.message || "Upload failed.";
      toast.error(msg);
      setPreQueueFiles((prev) =>
        prev.map((it, i) =>
          i === idx ? { ...it, status: "Error" } : it
        )
      );
    }
  };

  const uploadAllPre = async () => {
    const toUpload = preQueueFiles
      .map((it, i) => ({ ...it, idx: i }))
      .filter((it) => it.status === "Pending" || it.status === "Error");

    if (!toUpload.length) {
      toast("Nothing to upload.");
      return;
    }

    setPreQueueFiles((prev) =>
      prev.map((it, i) =>
        toUpload.some((t) => t.idx === i)
          ? { ...it, status: "Uploading" }
          : it
      )
    );

    try {
      const form = new FormData();
      toUpload.forEach((item, i) => {
        form.append(`files[${i}][file]`, item.file);
        form.append(`files[${i}][docsType]`, item.docsType || "");
      });
      const url = route("admin.loans.documents.store", { loanReference });
      await axios.post(url, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPreQueueFiles((prev) =>
        prev.map((it, i) =>
          toUpload.some((t) => t.idx === i)
            ? { ...it, status: "Success" }
            : it
        )
      );
      toast.success(`Uploaded ${toUpload.length} file(s).`);
      fetchDetails();
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.message || "Upload failed";
      toast.error(msg);
      setPreQueueFiles((prev) =>
        prev.map((it, i) =>
          toUpload.some((t) => t.idx === i)
            ? { ...it, status: "Error" }
            : it
        )
      );
    }
  };

  // -------------------------------
  // POST-APPROVAL uploader states
  // -------------------------------
  const dropRef = useRef(null);
  const [queueFiles, setQueueFiles] = useState([]); // [{ file, docsType, status }]
  const [docsType, setDocsType] = useState("signedApplication");
  const pendingCount = useMemo(
    () =>
      queueFiles.filter(
        (f) => f.status === "Pending" || f.status === "Error"
      ).length,
    [queueFiles]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current?.classList.add("ring-2", "ring-emerald-500");
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current?.classList.remove("ring-2", "ring-emerald-500");
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropRef.current?.classList.remove("ring-2", "ring-emerald-500");
      const dropped = Array.from(e.dataTransfer?.files || []);
      if (!dropped.length) return;
      const mapped = dropped.map((f) => ({
        file: f,
        docsType,
        status: "Pending",
      }));
      setQueueFiles((prev) => [...prev, ...mapped]);
    },
    [docsType]
  );

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const mapped = picked.map((f) => ({
      file: f,
      docsType,
      status: "Pending",
    }));
    setQueueFiles((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const updateDocsTypeFor = (idx, value) => {
    setQueueFiles((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, docsType: value } : it))
    );
  };

  const removeQueued = (idx) => {
    setQueueFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const getStoreRouteName = () => {
    try {
      if (route().has("admin.loans.postApprovalDocs.store"))
        return "admin.loans.postApprovalDocs.store";
    } catch {}
    return "admin.loans.postApprovalDocs.store";
  };

  const uploadOne = async (idx) => {
    const item = queueFiles[idx];
    if (!item) return;
    setQueueFiles((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, status: "Uploading" } : it
      )
    );
    try {
      const form = new FormData();
      form.append("files[0][file]", item.file);
      form.append("files[0][docsType]", item.docsType || "");
      const url = route(getStoreRouteName(), { loanReference });
      await axios.post(url, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setQueueFiles((prev) =>
        prev.map((it, i) =>
          i === idx ? { ...it, status: "Success" } : it
        )
      );
      toast.success(`${item.file.name} uploaded`);
      fetchDetails();
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.message || "Upload failed.";
      toast.error(msg);
      setQueueFiles((prev) =>
        prev.map((it, i) =>
          i === idx ? { ...it, status: "Error" } : it
        )
      );
    }
  };

  const uploadAll = async () => {
    const toUpload = queueFiles
      .map((it, i) => ({ ...it, idx: i }))
      .filter((it) => it.status === "Pending" || it.status === "Error");

    if (!toUpload.length) {
      toast("Nothing to upload.");
      return;
    }

    setQueueFiles((prev) =>
      prev.map((it, i) =>
        toUpload.some((t) => t.idx === i)
          ? { ...it, status: "Uploading" }
          : it
      )
    );

    try {
      const form = new FormData();
      toUpload.forEach((item, i) => {
        form.append(`files[${i}][file]`, item.file);
        form.append(`files[${i}][docsType]`, item.docsType || "");
      });
      const url = route(getStoreRouteName(), { loanReference });
      await axios.post(url, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setQueueFiles((prev) =>
        prev.map((it, i) =>
          toUpload.some((t) => t.idx === i)
            ? { ...it, status: "Success" }
            : it
        )
      );
      toast.success(`Uploaded ${toUpload.length} file(s).`);
      fetchDetails();
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.message || "Upload failed";
      toast.error(msg);
      setQueueFiles((prev) =>
        prev.map((it, i) =>
          toUpload.some((t) => t.idx === i)
            ? { ...it, status: "Error" }
            : it
        )
      );
    }
  };

  // -------------------------------

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        route("admin.api.loans.details", { loanReference })
      );
      setLoan(res.data.loan);
      setMember(res.data.member);
      setRequiredType(res.data.requiredType || []);
      setExistingDocuments(res.data.existingDocuments || []);
      setPostApprovalDocs(res.data.postApprovalDocuments || []);
      setPreDocsType(
        (prev) => prev || res.data.requiredType?.[0] || ""
      );
    } catch {
      toast.error("Failed to load loan details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [loanReference]);

  const handleApprove = async () => {
    try {
      await axios.post(route("admin.loan.approve", { loanReference }));
      toast.success("Approved.");
      fetchDetails();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Approval failed.");
    }
  };

  const handleDecline = async () => {
    try {
      await axios.post(route("admin.loan.decline", { loanReference }));
      toast.success("Declined.");
      fetchDetails();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Decline failed.");
    }
  };

  const handleRelease = async () => {
    try {
      await axios.post(route("admin.loan.release", { loanReference }));
      toast.success("Released.");
      fetchDetails();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Release failed.");
    }
  };

  const acknowledgeDownloads = async () => {
    try {
      await axios.post(route("admin.loan.ackDownloads", { loanReference }));
      toast.success("Confirmed: documents printed/downloaded.");
      setConfirmOpen(false);
      setLoan((prev) => ({ ...prev, downloadsAcknowledged: true }));
      fetchDetails();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Confirmation failed.");
    }
  };

  // ------- status and gates -------
  const loanStatus = (loan?.status || "").trim().toLowerCase();
  const downloadsAck = !!loan?.downloadsAcknowledged;
  const isReleased = loanStatus === "released";

  const statusClass = (s) => {
    const k = (s || "").toLowerCase();
    return k === "pending"
      ? "bg-amber-100 text-amber-800"
      : k === "approved"
      ? "bg-blue-100 text-blue-800"
      : k === "released"
      ? "bg-emerald-100 text-emerald-800"
      : k === "declined"
      ? "bg-red-100 text-red-800"
      : k === "completed"
      ? "bg-teal-100 text-teal-800"
      : "bg-gray-100 text-gray-800";
  };

  // pre-approval completeness
  const hasAllPreRequired =
    requiredType.length > 0 &&
    requiredType.every((t) =>
      existingDocuments.some((d) => d.docsType === t)
    );

  // post-approval completeness
  const hasSignedApp = postApprovalDocs.some(
    (d) => d.docsType === "signedApplication"
  );
  const hasVoucher = postApprovalDocs.some(
    (d) => d.docsType === "releaseVoucher"
  );
  const hasProofPhoto = postApprovalDocs.some(
    (d) => d.docsType === "borrowerPhoto"
  );
  const hasScannedChk = postApprovalDocs.some(
    (d) => d.docsType === "scannedCheck"
  );
  const hasAllPostApprovalDocs =
    hasSignedApp && hasVoucher && hasProofPhoto && hasScannedChk;

  // show post-approval uploader only when approved + pre-approval complete
  const showPostApprovalUploader =
    loanStatus === "approved" && hasAllPreRequired && !isReleased;

  // enable release only after post-approval docs + downloads confirmed
  const canRelease =
    loanStatus === "approved" &&
    hasAllPostApprovalDocs &&
    downloadsAck;

  if (loading) {
    return (
      <>
        <Head title={`Loan: ${loanReference}`}>
          <link rel="icon" href="/images/logo/pis_logo.png" />
        </Head>
        <AdminSidebarLayout>
          <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-600">Loading loan details…</p>
            </div>
          </div>
        </AdminSidebarLayout>
      </>
    );
  }

  if (!loan || !member) {
    return (
      <>
        <Head title={`Loan: ${loanReference}`}>
          <link rel="icon" href="/images/logo/pis_logo.png" />
        </Head>
        <AdminSidebarLayout>
          <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  Loan not found
                </h1>
                <Link
                  href={route("admin.loans")}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                >
                  ← Back to Loans
                </Link>
              </div>
              <p className="text-sm text-red-600">
                The specified loan could not be found.
              </p>
            </div>
          </div>
        </AdminSidebarLayout>
      </>
    );
  }

  const StatPill = ({ ok, label }) => (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
        ok
          ? "bg-emerald-100 text-emerald-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      <CheckCircle2 size={14} />
      {label}
    </span>
  );

  const DocItem = ({ item, accent = "gray" }) => {
    const rawSize = typeof item.size === "number" ? item.size : 0;
    const sizeKb =
      rawSize > 0 ? (rawSize / 1024).toFixed(1) + " KB" : "—";

    return (
      <li className="border border-gray-100 rounded-xl p-3 hover:shadow-sm transition bg-white">
        <div className="flex items-start justify-between">
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
              accent === "green"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {item.docsType || "Unknown"}
          </span>
          <span className="text-[10px] text-gray-400">{sizeKb}</span>
        </div>

        <div className="mt-2 text-sm font-medium break-words flex items-start gap-2">
          <FileText size={16} className="shrink-0 mt-0.5 text-gray-500" />
          <span>{item.originalName}</span>
        </div>

        <div className="mt-1 text-xs text-gray-500">
          {item.mimeType || "—"}
        </div>

        <div className="mt-2">
          <a
            href={
              item.isPost
                ? route("admin.loans.postDocuments.preview", {
                    loanReference: loan.loanReference,
                    documentId: item.id,
                  })
                : route("admin.loans.preDocuments.preview", {
                    loanReference: loan.loanReference,
                    documentId: item.id,
                  })
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 text-xs hover:text-emerald-900"
          >
            View <ExternalLink size={14} />
          </a>
        </div>
      </li>
    );
  };

  const hasRoute = (name) =>
    typeof route === "function" && route().has
      ? route().has(name)
      : false;

  return (
    <>
      <Head title="Loan Details">
        <link rel="icon" href="/images/logo/pis_logo.png" />
      </Head>
      <AdminSidebarLayout>
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                Loan Details
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage pre-approval and post-approval requirements for this
                loan.
              </p>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  Reference:{" "}
                  <span className="font-semibold">
                    {loanReference}
                  </span>
                </span>
                <span
                  className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${statusClass(
                    loanStatus
                  )}`}
                >
                  Status: {loanStatus.toUpperCase()}
                </span>
              </div>
              {loanStatus === "approved" && (
                <div className="text-xs mt-3 flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      downloadsAck
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {downloadsAck
                      ? "Downloads confirmed"
                      : "Downloads not yet confirmed"}
                  </span>
                  <StatPill
                    ok={hasSignedApp}
                    label="Signed Application"
                  />
                  <StatPill ok={hasVoucher} label="Release Voucher" />
                  <StatPill
                    ok={hasProofPhoto}
                    label="Borrower Photo"
                  />
                  <StatPill
                    ok={hasScannedChk}
                    label="Scanned Check"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={route("admin.loans")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                ← Back to Loans
              </Link>
            </div>
          </div>

          {/* Borrower Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-base font-semibold mb-3 text-gray-900">
              Borrower Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>{" "}
                <span className="font-medium">
                  {member.lastName}, {member.firstName}{" "}
                  {member.middleName} {member.suffix}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Username:</span>{" "}
                <span className="font-medium">{member.username}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>{" "}
                <span className="font-medium">{member.email}</span>
              </div>
              <div>
                <span className="text-gray-500">
                  Branch of Service:
                </span>{" "}
                <span className="font-medium">
                  {member.branchService || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Pre-Approval Requirements */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                Pre-Approval Requirements
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Total uploaded: {existingDocuments.length}</span>
              </div>
            </div>

            {/* Upload UI — hidden when approved or released */}
            {!(loanStatus === "approved" || isReleased) && (
              <>
                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Document Type
                  </label>
                  <select
                    value={preDocsType}
                    onChange={(e) => setPreDocsType(e.target.value)}
                    className="w-full md:w-64 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 text-sm px-3 py-2"
                  >
                    {requiredType.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    {requiredType.length === 0 && (
                      <option value="">(no types configured)</option>
                    )}
                  </select>
                </div>

                <div
                  ref={preDropRef}
                  onDragOver={onPreDragOver}
                  onDragLeave={onPreDragLeave}
                  onDrop={onPreDrop}
                  className="bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-200 text-center px-4 py-6"
                >
                  <p className="text-gray-700 mb-1 text-sm font-medium">
                    Drag &amp; drop pre-approval documents here
                  </p>
                  <p className="text-gray-500 text-xs mb-3">
                    Or click the button below to browse files.
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 cursor-pointer shadow-sm">
                    <UploadCloud className="w-4 h-4" />
                    <span>Browse files</span>
                    <input
                      type="file"
                      multiple
                      onChange={onPrePick}
                      className="hidden"
                      accept="image/*,application/pdf"
                    />
                  </label>
                </div>

                {/* Pending uploads list */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Pending Uploads{" "}
                      <span className="text-gray-500 text-xs">
                        ({prePendingCount} pending)
                      </span>
                    </h3>
                    <button
                      onClick={uploadAllPre}
                      disabled={preQueueFiles.length === 0}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white ${
                        preQueueFiles.length === 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                      }`}
                    >
                      Upload All
                    </button>
                  </div>

                  {preQueueFiles.length === 0 ? (
                    <p className="text-xs text-gray-500 mt-2">
                      No files queued. Drag &amp; drop or browse to add
                      files.
                    </p>
                  ) : (
                    <ul className="mt-4 grid md:grid-cols-2 gap-3">
                      {preQueueFiles.map((item, idx) => {
                        const borderColor =
                          item.status === "Success"
                            ? "border-emerald-500"
                            : item.status === "Error"
                            ? "border-red-500"
                            : item.status === "Uploading"
                            ? "border-blue-400"
                            : "border-gray-200";
                        return (
                          <li
                            key={`${item.file.name}-${idx}`}
                            className={`border ${borderColor} rounded-xl p-3 bg-white`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {item.file.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(item.file.size / 1024).toFixed(1)}{" "}
                                  KB •{" "}
                                  {item.file.type || "unknown type"}
                                </div>

                                <div className="mt-2">
                                  <label className="text-[11px] text-gray-500 mr-2">
                                    Type
                                  </label>
                                  <select
                                    value={item.docsType}
                                    onChange={(e) =>
                                      updatePreDocsTypeFor(
                                        idx,
                                        e.target.value
                                      )
                                    }
                                    className="rounded-md border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 text-xs px-2 py-1"
                                  >
                                    {requiredType.map((t) => (
                                      <option
                                        key={t}
                                        value={t}
                                      >
                                        {t}
                                      </option>
                                    ))}
                                    <option value="">
                                      (none)
                                    </option>
                                  </select>
                                </div>

                                <div className="text-[11px] mt-2">
                                  {item.status === "Pending" && (
                                    <span className="text-gray-500">
                                      Pending
                                    </span>
                                  )}
                                  {item.status === "Uploading" && (
                                    <span className="text-blue-600">
                                      Uploading…
                                    </span>
                                  )}
                                  {item.status === "Success" && (
                                    <span className="text-emerald-600 font-medium">
                                      Uploaded ✔
                                    </span>
                                  )}
                                  {item.status === "Error" && (
                                    <span className="text-red-600">
                                      Error — try again
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() =>
                                    uploadOnePre(idx)
                                  }
                                  disabled={
                                    item.status === "Uploading" ||
                                    item.status === "Success"
                                  }
                                  className={`px-3 py-1 rounded-lg text-white text-xs ${
                                    item.status === "Success"
                                      ? "bg-gray-400"
                                      : "bg-emerald-600 hover:bg-emerald-700"
                                  }`}
                                >
                                  {item.status === "Success"
                                    ? "Done"
                                    : "Upload"}
                                </button>
                                <button
                                  onClick={() =>
                                    removePreQueued(idx)
                                  }
                                  disabled={
                                    item.status === "Uploading"
                                  }
                                  className="px-3 py-1 rounded-lg text-xs text-red-600 hover:bg-red-50"
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
              </>
            )}

            {/* Existing pre-approval documents */}
            {existingDocuments.length === 0 ? (
              <p className="text-xs text-gray-500 mt-4">
                No pre-approval documents uploaded yet.
              </p>
            ) : (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">
                  Uploaded Documents
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {existingDocuments.map((d) => (
                    <DocItem
                      key={`ex-${d.id}`}
                      item={d}
                      accent="gray"
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Post-Approval Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Post-Approval Documents
              </h2>
              {loanStatus === "approved" && (
                <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                  <StatPill
                    ok={hasSignedApp}
                    label="Signed Application"
                  />
                  <StatPill
                    ok={hasVoucher}
                    label="Release Voucher"
                  />
                  <StatPill
                    ok={hasProofPhoto}
                    label="Borrower Photo"
                  />
                  <StatPill
                    ok={hasScannedChk}
                    label="Scanned Check"
                  />
                </div>
              )}
            </div>

            {/* Upload UI — ONLY when approved + pre-complete + not released */}
            {showPostApprovalUploader && (
              <>
                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Document Type
                  </label>
                  <select
                    value={docsType}
                    onChange={(e) => setDocsType(e.target.value)}
                    className="w-full md:w-64 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 text-sm px-3 py-2"
                  >
                    <option value="signedApplication">
                      Signed Application
                    </option>
                    <option value="borrowerPhoto">
                      Borrower Photo
                    </option>
                    <option value="scannedCheck">
                      Scanned Check
                    </option>
                    <option value="releaseVoucher">
                      Loan Release Voucher
                    </option>
                  </select>
                </div>

                <div
                  ref={dropRef}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className="bg-blue-50/40 rounded-2xl border border-dashed border-blue-200 text-center px-4 py-6"
                >
                  <p className="text-gray-700 mb-1 text-sm font-medium">
                    Drag &amp; drop signed documents here
                  </p>
                  <p className="text-gray-500 text-xs mb-3">
                    Or click the button below to browse files.
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 cursor-pointer shadow-sm">
                    <UploadCloud className="w-4 h-4" />
                    <span>Browse files</span>
                    <input
                      type="file"
                      multiple
                      onChange={onPick}
                      className="hidden"
                      accept="image/*,application/pdf"
                    />
                  </label>
                </div>

                {/* Pending uploads list */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Pending Uploads{" "}
                      <span className="text-gray-500 text-xs">
                        ({pendingCount} pending)
                      </span>
                    </h3>
                    <button
                      onClick={uploadAll}
                      disabled={queueFiles.length === 0}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white ${
                        queueFiles.length === 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                      }`}
                    >
                      Upload All
                    </button>
                  </div>

                  {queueFiles.length === 0 ? (
                    <p className="text-xs text-gray-500 mt-2">
                      No files queued. Drag &amp; drop or browse to add
                      files.
                    </p>
                  ) : (
                    <ul className="mt-4 grid md:grid-cols-2 gap-3">
                      {queueFiles.map((item, idx) => {
                        const borderColor =
                          item.status === "Success"
                            ? "border-emerald-500"
                            : item.status === "Error"
                            ? "border-red-500"
                            : item.status === "Uploading"
                            ? "border-blue-400"
                            : "border-gray-200";
                        return (
                          <li
                            key={`${item.file.name}-${idx}`}
                            className={`border ${borderColor} rounded-xl p-3 bg-white`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {item.file.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(item.file.size / 1024).toFixed(1)}{" "}
                                  KB •{" "}
                                  {item.file.type || "unknown type"}
                                </div>

                                <div className="mt-2">
                                  <label className="text-[11px] text-gray-500 mr-2">
                                    Type
                                  </label>
                                  <select
                                    value={item.docsType}
                                    onChange={(e) =>
                                      updateDocsTypeFor(
                                        idx,
                                        e.target.value
                                      )
                                    }
                                    className="rounded-md border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 text-xs px-2 py-1"
                                  >
                                    <option value="signedApplication">
                                      Signed Application
                                    </option>
                                    <option value="borrowerPhoto">
                                      Borrower Photo
                                    </option>
                                    <option value="scannedCheck">
                                      Scanned Check
                                    </option>
                                    <option value="releaseVoucher">
                                      Loan Release Voucher
                                    </option>
                                    <option value="">
                                      (none)
                                    </option>
                                  </select>
                                </div>

                                <div className="text-[11px] mt-2">
                                  {item.status === "Pending" && (
                                    <span className="text-gray-500">
                                      Pending
                                    </span>
                                  )}
                                  {item.status === "Uploading" && (
                                    <span className="text-blue-600">
                                      Uploading…
                                    </span>
                                  )}
                                  {item.status === "Success" && (
                                    <span className="text-emerald-600 font-medium">
                                      Uploaded ✔
                                    </span>
                                  )}
                                  {item.status === "Error" && (
                                    <span className="text-red-600">
                                      Error — try again
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => uploadOne(idx)}
                                  disabled={
                                    item.status === "Uploading" ||
                                    item.status === "Success"
                                  }
                                  className={`px-3 py-1 rounded-lg text-white text-xs ${
                                    item.status === "Success"
                                      ? "bg-gray-400"
                                      : "bg-blue-600 hover:bg-blue-700"
                                  }`}
                                >
                                  {item.status === "Success"
                                    ? "Done"
                                    : "Upload"}
                                </button>
                                <button
                                  onClick={() =>
                                    removeQueued(idx)
                                  }
                                  disabled={
                                    item.status === "Uploading"
                                  }
                                  className="px-3 py-1 rounded-lg text-xs text-red-600 hover:bg-red-50"
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
              </>
            )}

            {/* Render uploaded post-approval docs (always visible, read-only) */}
            {postApprovalDocs.length === 0 ? (
              <p className="text-xs text-gray-500 mt-4">
                No post-approval documents uploaded yet.
              </p>
            ) : (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">
                  Uploaded Documents
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {postApprovalDocs.map((d) => (
                    <DocItem
                      key={`post-${d.id}`}
                      item={d}
                      accent="green"
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Actions
              </h2>
              <span className="text-xs text-gray-500">
                Status:{" "}
                <span className="font-semibold uppercase">
                  {loanStatus}
                </span>
              </span>
            </div>

            {/* PENDING STATE */}
            {loanStatus === "pending" && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleApprove}
                  disabled={!hasAllPreRequired}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white ${
                    hasAllPreRequired
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  title={
                    hasAllPreRequired
                      ? "Approve loan"
                      : "Upload all pre-approval documents first"
                  }
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
                <button
                  onClick={handleDecline}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm shadow-sm"
                >
                  <XCircle size={16} />
                  Decline
                </button>
              </div>
            )}

            {/* APPROVED STATE */}
            {loanStatus === "approved" && (
              <div className="space-y-4">
                {/* Downloads */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Download or print the documents below before proceeding:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hasRoute("admin.loan.download.application") && (
                      <a
                        href={route(
                          "admin.loan.download.application",
                          { loanReference }
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-800 text-xs hover:bg-gray-50"
                      >
                        <FileText size={16} />
                        Application <ExternalLink size={14} />
                      </a>
                    )}
                    {hasRoute("admin.loan.download.releaseVoucher") && (
                      <a
                        href={route(
                          "admin.loan.download.releaseVoucher",
                          { loanReference }
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-800 text-xs hover:bg-gray-50"
                      >
                        <FileText size={16} />
                        Release Voucher{" "}
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {hasRoute("admin.loan.download.ledger") && (
                      <a
                        href={route(
                          "admin.loan.download.ledger",
                          { loanReference }
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-800 text-xs hover:bg-gray-50"
                      >
                        <FileText size={16} />
                        Ledger <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Acknowledgement — only after post-approval docs are complete */}
                {hasAllPostApprovalDocs && !downloadsAck && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      Confirm that the Loan Application, Release Voucher,
                      and Loan Ledger have been downloaded or printed.
                    </p>
                    <button
                      onClick={() => setConfirmOpen(true)}
                      className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm shadow-sm"
                    >
                      Confirm Downloads
                    </button>
                  </div>
                )}

                {/* Primary action (Release) */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-gray-500">
                    Requirements: Signed Application, Release Voucher,
                    Borrower Photo, Scanned Check
                  </div>
                  <button
                    onClick={handleRelease}
                    disabled={!canRelease}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white transition ${
                      canRelease
                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    title={
                      canRelease
                        ? "Mark loan as released"
                        : "Upload all post-approval documents and confirm downloads first"
                    }
                    aria-disabled={!canRelease}
                  >
                    <ShieldCheck size={16} />
                    Mark as Released
                  </button>
                </div>
              </div>
            )}

            {/* RELEASED STATE */}
            {isReleased && (
              <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-sm">
                This loan has been{" "}
                <span className="font-semibold">Released</span>. Uploads
                and document management are now read-only.
              </div>
            )}
          </div>
        </div>
      </AdminSidebarLayout>

      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Confirm downloads
            </h3>
            <p className="text-sm text-gray-600">
              Please confirm that you have downloaded or printed the Loan
              Application, Release Voucher, and Loan Ledger for this loan.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={acknowledgeDownloads}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-sm text-white"
              >
                Yes, I confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
