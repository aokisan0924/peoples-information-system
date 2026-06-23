import React, { useState, useMemo, useEffect, useRef } from "react";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import {
    CheckCircle2, ChevronLeft, ChevronRight, Edit3,
    FileText, IdCard, Landmark, Loader2, Phone, Save, Shield,
    User, Users, X, Mail, Banknote, Camera,
    TrendingUp, Hash, ArrowLeft, Pencil, MapPin, ChevronDown
} from "lucide-react";
import SidebarLayout from "@/Layouts/SidebarLayout";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";
import phAddresses from "@/data/ph-addresses.json";

// ─── ADDRESS HELPERS ──────────────────────────────────────────────────────────
const regionsSource = phAddresses.region_list ?? phAddresses;
const getRegionEntries = () =>
    Object.entries(regionsSource).map(([regionCode, regionData]) => ({
        code: regionCode,
        name: regionData.region_name || regionCode,
        provinceList: regionData.province_list || {},
    }));

// ─── SECTION CONFIG ───────────────────────────────────────────────────────────
const SECTIONS = [
    { id: "overview",   icon: User,     label: "Overview"           },
    { id: "personal",   icon: IdCard,   label: "Personal & IDs"     },
    { id: "service",    icon: Shield,   label: "AFP & Branch"       },
    { id: "contacts",   icon: Phone,    label: "Family & Emergency" },
    { id: "dependents", icon: Users,    label: "Dependents"         },
];

// ─── PAGINATION HOOK ──────────────────────────────────────────────────────────
function useClientPagination(rows, pageSize = 6) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);
    return { page, totalPages, pageRows, goPrev: () => setPage(p => Math.max(1, p - 1)), goNext: () => setPage(p => Math.min(totalPages, p + 1)) };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ClientProfile() {
    const { props } = usePage();
    const { MemberData } = props;

    const basicInfo          = MemberData?.basicInfoData        || {};
    const branchService      = MemberData?.branchServiceData    || {};
    const afpInfo            = MemberData?.afpData              || {};
    const identificationInfo = MemberData?.identificationData   || {};
    const spouseInfo         = MemberData?.spouseData           || {};
    const parentsInfo        = MemberData?.parentsData          || {};
    const emergencyContact   = MemberData?.emergencyData        || {};
    const dependents         = Array.isArray(MemberData?.dependentsData)    ? MemberData.dependentsData    : [];
    const releasedLoans      = Array.isArray(MemberData?.releasedLoansData) ? MemberData.releasedLoansData : [];

    // ── UI STATE ──────────────────────────────────────────────────────────────
    const [activeSection, setActiveSection]       = useState("overview");
    const [isEditOpen, setIsEditOpen]             = useState(false);
    const [editTab, setEditTab]                   = useState("basicInfo");
    const [isSaving, setIsSaving]                 = useState(false);
    const [imgError, setImgError]                 = useState(false);
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);
    const photoInputRef = useRef(null);

    // ── ADDRESS STATE ─────────────────────────────────────────────────────────
    const [selectedRegion,   setSelectedRegion]   = useState(() => basicInfo.region   || "");
    const [selectedProvince, setSelectedProvince] = useState(() => basicInfo.province || "");
    const [selectedCity,     setSelectedCity]     = useState(() => basicInfo.city     || "");
    const [selectedBarangay, setSelectedBarangay] = useState(() => basicInfo.barangay || "");

    const regionEntries   = useMemo(() => getRegionEntries(), []);
    const regionOptions   = useMemo(() => [...regionEntries].sort((a, b) => a.name.localeCompare(b.name)), [regionEntries]);
    const provinceOptions = useMemo(() => {
        if (!selectedRegion) return [];
        const r = regionEntries.find(r => r.code === selectedRegion || r.name === selectedRegion);
        return r ? Object.keys(r.provinceList).sort() : [];
    }, [selectedRegion, regionEntries]);
    const cityOptions = useMemo(() => {
        if (!selectedRegion || !selectedProvince) return [];
        const r = regionEntries.find(r => r.code === selectedRegion || r.name === selectedRegion);
        if (!r) return [];
        const p = r.provinceList[selectedProvince];
        return p?.municipality_list ? Object.keys(p.municipality_list).sort() : [];
    }, [selectedRegion, selectedProvince, regionEntries]);
    const barangayOptions = useMemo(() => {
        if (!selectedRegion || !selectedProvince || !selectedCity) return [];
        const r = regionEntries.find(r => r.code === selectedRegion || r.name === selectedRegion);
        if (!r) return [];
        const p = r.provinceList[selectedProvince];
        const c = p?.municipality_list?.[selectedCity];
        return c?.barangay_list || [];
    }, [selectedRegion, selectedProvince, selectedCity, regionEntries]);

    // ── BRANCH OPTIONS ────────────────────────────────────────────────────────
    const branchOptions = {
        "ACTIVE MILITARY":    ["ARMY","AIR FORCE","NAVY","RESERVIST"],
        "RETIRED MILITARY":   ["ARMY","AIR FORCE","NAVY","RESERVIST"],
        "BENEFICIARY":        ["WIDOW","DEPENDENT","PARENTS"],
        "RESERVIST":          [],
        "CIVILIAN EMPLOYEES": ["AFFC","PNFC","FCPA"],
        "PMPC":               ["BOARD OF DIRECTORS","MANAGEMENT","STAFF","PROBATIONARY"],
        "CDEA":               [],
        "BRGY":               ["CAMP AGUINALDO","FORT MAGSAYSAY","UPI"],
    };
    const [availableSubBranches, setAvailableSubBranches] = useState([]);

    // ── FORM STATE ────────────────────────────────────────────────────────────
    const [basicInfoForm, setBasicInfoForm] = useState({
        firstName: basicInfo.firstName||"", middleName: basicInfo.middleName||"",
        lastName: basicInfo.lastName||"", suffix: basicInfo.suffix||"",
        nickname: basicInfo.nickname||"", gender: basicInfo.gender||"",
        dob: basicInfo.dob||"", civilStatus: basicInfo.civilStatus||"",
        religion: basicInfo.religion||"", nationality: basicInfo.nationality||"",
        email: basicInfo.email||"", contact: basicInfo.contact||"",
        fullAddress: basicInfo.fullAddress||"",
    });
    const [branchForm, setBranchForm]               = useState({ branchService: branchService?.branchService||"", subBranch: branchService?.subBranch||"" });
    const [afpForm, setAfpForm]                     = useState({ afpsn: afpInfo?.afpsn||"", rank: afpInfo?.rank||"", designation: afpInfo?.designation||"", afpId: afpInfo?.afpId||"", presentAssignment: afpInfo?.presentAssignment||"", yearsInService: afpInfo?.yearsInService||"", cadEnlistment: afpInfo?.cadEnlistment||"", retirementDate: afpInfo?.retirementDate||"", pensionDate: afpInfo?.pensionDate||"" });
    const [identificationForm, setIdentificationForm] = useState({ tinNo: identificationInfo?.tinNo||"", gsisNo: identificationInfo?.gsisNo||"", crnUmidNo: identificationInfo?.crnUmidNo||"" });
    const [spouseForm, setSpouseForm]               = useState({ spouseName: spouseInfo?.spouseName||"", spouseDob: spouseInfo?.spouseDob||"", dateMarriage: spouseInfo?.dateMarriage||"" });
    const [parentsForm, setParentsForm]             = useState({ fatherName: parentsInfo?.fatherName||"", fatherAge: parentsInfo?.fatherAge||"", motherName: parentsInfo?.motherName||"", motherAge: parentsInfo?.motherAge||"" });
    const [emergencyForm, setEmergencyForm]         = useState({ contactPersonName: emergencyContact?.contactPersonName||"", contactPersonAddress: emergencyContact?.contactPersonAddress||"", contactPersonPhone: emergencyContact?.contactPersonPhone||"", contactPersonRelation: emergencyContact?.contactPersonRelation||"" });
    const [dependentsForm, setDependentsForm]       = useState(() => dependents.map(d => ({ id: d.id??null, name: d.name??"", dob: d.dob??"", gender: d.gender??"" })));

    useEffect(() => {
        const subs = branchOptions[branchForm.branchService] || [];
        setAvailableSubBranches(subs);
        if (!subs.includes(branchForm.subBranch)) setBranchForm(p => ({ ...p, subBranch: "" }));
    }, [branchForm.branchService]);

    const fullName = useMemo(() =>
        `${basicInfo.firstName??""} ${basicInfo.middleName??""} ${basicInfo.lastName??""} ${basicInfo.suffix??""}`.replace(/\s+/g," ").trim()
    , [basicInfo]);

    const photoUrl = useMemo(() => {
        if (!basicInfo.profileImage) return null;
        if (basicInfo.profileImage.startsWith("http") || basicInfo.profileImage.startsWith("/")) return basicInfo.profileImage;
        if (basicInfo.profileImageUrl) return basicInfo.profileImageUrl;
        return `/storage/${basicInfo.profileImage}`;
    }, [basicInfo.profileImage, basicInfo.profileImageUrl]);

    const formatTin  = v => v.replace(/\D/g,"").replace(/(\d{3})(\d)/,"$1-$2").replace(/(\d{3})(\d)/,"$1-$2").replace(/(\d{3})(\d{1,3})/,"$1-$2").substring(0,15);
    const formatGsis = v => v.replace(/\D/g,"").replace(/(\d{2})(\d)/,"$1-$2").replace(/(\d{7})(\d)/,"$1-$2").substring(0,12);
    const formatCRN  = v => v.replace(/\D/g,"").replace(/(\d{4})(\d)/,"$1-$2").replace(/(\d{7})(\d)/,"$1-$2").substring(0,15);
    const safeText   = (v, f="—") => (v && v.toString().trim().length ? v : f);
    const isActive   = basicInfo.accountStatus !== "inactive";

    const openEdit = (tab) => { setEditTab(tab); setIsEditOpen(true); };

    // ── SAVERS ────────────────────────────────────────────────────────────────
    const handleSaveCurrentTab = async () => {
        setIsSaving(true);
        try {
            const tabMap = {
                basicInfo:      { url: route("member.update-basic-info"),          payload: { ...basicInfoForm, region: selectedRegion, province: selectedProvince, city: selectedCity, barangay: selectedBarangay } },
                branchService:  { url: route("member.update-branch-service"),      payload: branchForm },
                identification: { url: route("member.update-identification-info"), payload: identificationForm },
                afpInfo:        { url: route("member.update-afp-info"),            payload: afpForm },
                spouseInfo:     { url: route("member.update-spouse-info"),         payload: spouseForm },
                parentsInfo:    { url: route("member.update-parents-info"),        payload: parentsForm },
                emergencyInfo:  { url: route("member.update-emergency-info"),      payload: emergencyForm },
                dependentsInfo: { url: route("member.update-dependents-info"),     payload: { dependents: dependentsForm } },
            };
            const { url, payload } = tabMap[editTab] || {};
            if (!url) return;
            const { data } = await axios.post(url, payload);
            if (data?.success) { toast.success(data?.message || "Updated successfully"); setTimeout(() => window.location.reload(), 1000); }
            else toast.error(data?.message || "Failed to update");
        } catch (error) {
            const resp = error?.response?.data;
            toast.error(resp?.message || (resp?.errors && Object.values(resp.errors)[0]?.[0]) || "Failed to save.");
        } finally { setIsSaving(false); }
    };

    const handlePhotoChange = async (e) => {
        setImgError(false);
        const file = e.target.files?.[0];
        if (!file) return;
        setIsPhotoUploading(true);
        const formData = new FormData();
        formData.append("profileImage", file);
        try {
            const { data } = await axios.post(route("member.updateProfilePhoto"), formData, { headers: { "Content-Type": "multipart/form-data" } });
            if (data?.success) { toast.success("Photo updated!"); window.location.reload(); }
            else toast.error(data?.message || "Failed to update photo");
        } catch (error) {
            toast.error(error?.response?.data?.errors?.profileImage?.[0] || error?.response?.data?.message || "Failed to upload photo.");
        } finally { setIsPhotoUploading(false); if (photoInputRef.current) photoInputRef.current.value = ""; }
    };

    // ── PAGINATORS ────────────────────────────────────────────────────────────
    const dependentsPager = useClientPagination(dependents, 6);
    const loansPager      = useClientPagination(releasedLoans, 6);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="My Profile">
                    <link rel="icon" href="/images/logo/pis_logo.png" />
                </Head>
                <Toaster position="top-right" toastOptions={{ style: { borderRadius: "14px", fontWeight: 600, fontSize: "13px" } }} />

                <div className="min-h-screen bg-slate-50 dark:bg-[#080e0c] transition-colors duration-300">

                    {/* ── HERO BANNER ───────────────────────────────────────── */}
                    <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 dark:from-emerald-800 dark:via-emerald-900 dark:to-teal-950 overflow-hidden">
                        {/* Decorative blobs */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />
                            <div className="absolute top-8 left-8 w-40 h-40 bg-emerald-300/10 rounded-full blur-2xl" />
                        </div>

                        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-20 sm:pb-24">
                            {/* Top bar */}
                            <div className="flex items-center justify-between mb-6 sm:mb-8">
                                <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-emerald-100 hover:text-white text-sm font-semibold transition-colors">
                                    <ArrowLeft className="h-4 w-4" /> Back
                                </button>
                                <button
                                    onClick={() => openEdit("basicInfo")}
                                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-bold transition-all shadow-lg active:scale-95"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span>Edit Profile</span>
                                </button>
                            </div>

                            {/* Profile row */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 rounded-2xl sm:rounded-3xl overflow-hidden ring-4 ring-white/30 shadow-2xl bg-white/10">
                                        {basicInfo.profileImage && !imgError ? (
                                            <img
                                                src={photoUrl}
                                                alt={fullName}
                                                className="h-full w-full object-cover"
                                                onError={() => setImgError(true)}
                                            />
                                        ) : (
                                            <div className="h-full w-full grid place-items-center bg-emerald-500/40 text-white font-black text-3xl uppercase select-none">
                                                {basicInfo.firstName?.[0]}{basicInfo.lastName?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => photoInputRef.current?.click()}
                                        disabled={isPhotoUploading}
                                        title="Change photo"
                                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-white text-emerald-700 grid place-items-center shadow-xl hover:bg-emerald-50 transition-all active:scale-95"
                                    >
                                        {isPhotoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                                    </button>
                                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                </div>

                                {/* Name / meta */}
                                <div className="flex-1 min-w-0 pb-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">{fullName || "Member"}</h1>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${isActive ? "bg-emerald-400/20 border-emerald-300/30 text-emerald-100" : "bg-white/10 border-white/20 text-white/60"}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-300" : "bg-white/40"}`} />
                                            {basicInfo.accountStatus || "Active Member"}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3 sm:gap-5 text-emerald-100/80 text-sm">
                                        {basicInfo.contact && (
                                            <span className="flex items-center gap-1.5">
                                                <Phone className="h-3.5 w-3.5 opacity-70" />
                                                <span>{basicInfo.contact}</span>
                                            </span>
                                        )}
                                        {basicInfo.email && (
                                            <span className="flex items-center gap-1.5">
                                                <Mail className="h-3.5 w-3.5 opacity-70" />
                                                <span className="truncate max-w-[200px]">{basicInfo.email}</span>
                                            </span>
                                        )}
                                        {branchService.branchService && (
                                            <span className="flex items-center gap-1.5">
                                                <Shield className="h-3.5 w-3.5 opacity-70" />
                                                <span>{branchService.branchService}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── STAT CARDS (overlap the banner) ──────────────────── */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 relative z-10 mb-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { label: "Dependents",    value: dependents.length,                    icon: Users,   color: "from-emerald-500 to-teal-500"  },
                                { label: "Released Loans",value: releasedLoans.length,                 icon: Landmark,color: "from-sky-500 to-blue-600"       },
                                { label: "AFP Serial",    value: safeText(afpInfo.afpsn),              icon: IdCard,  color: "from-violet-500 to-purple-600"  },
                                { label: "Branch",        value: safeText(branchService.branchService),icon: Shield,  color: "from-amber-500 to-orange-500"   },
                            ].map((s, i) => (
                                <div key={i} className="bg-white dark:bg-[#111a16] rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg shadow-emerald-900/5 dark:shadow-black/30 p-4 flex items-center gap-3 overflow-hidden relative">
                                    <div className={`shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center shadow-md`}>
                                        <s.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">{s.label}</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">{s.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── MAIN CONTENT ─────────────────────────────────────── */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">

                            {/* ── DESKTOP SIDEBAR ──────────────────────────── */}
                            <aside className="hidden lg:block lg:col-span-3">
                                <div className="sticky top-6 bg-white dark:bg-[#111a16] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Sections</p>
                                    </div>
                                    <nav className="p-2 space-y-0.5">
                                        {SECTIONS.map(s => (
                                            <SectionButton key={s.id} id={s.id} icon={s.icon} label={s.label} activeId={activeSection} onClick={setActiveSection} />
                                        ))}
                                    </nav>
                                </div>
                            </aside>

                            {/* ── MOBILE NAV (horizontal pills) ────────────── */}
                            <div className="lg:hidden col-span-1">
                                <div className="bg-white dark:bg-[#111a16] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-2">
                                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                                        {SECTIONS.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setActiveSection(s.id)}
                                                className={`inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                                    activeSection === s.id
                                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                                        : "text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/5"
                                                }`}
                                            >
                                                <s.icon className="h-3.5 w-3.5" />{s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── SECTION CONTENT ──────────────────────────── */}
                            <main className="lg:col-span-9 space-y-4 sm:space-y-5">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeSection}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                    >

                                        {/* OVERVIEW */}
                                        {activeSection === "overview" && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                                <InfoCard title="Basic Information" icon={User} onEdit={() => openEdit("basicInfo")}>
                                                    <InfoRow label="Full Name"    value={fullName} />
                                                    <InfoRow label="Date of Birth"value={basicInfo.dob} />
                                                    <InfoRow label="Civil Status" value={basicInfo.civilStatus} />
                                                    <InfoRow label="Address"      value={basicInfo.fullAddress} />
                                                </InfoCard>
                                                <InfoCard title="Identification" icon={IdCard} onEdit={() => openEdit("identification")}>
                                                    <InfoRow label="TIN"      value={identificationInfo.tinNo} />
                                                    <InfoRow label="GSIS"     value={identificationInfo.gsisNo} />
                                                    <InfoRow label="CRN/UMID" value={identificationInfo.crnUmidNo} />
                                                </InfoCard>
                                                <InfoCard title="Branch Service" icon={Shield} onEdit={() => openEdit("branchService")}>
                                                    <InfoRow label="Service"    value={branchService.branchService} />
                                                    <InfoRow label="Sub-Branch" value={branchService.subBranch} />
                                                </InfoCard>
                                                <InfoCard title="AFP Info" icon={Landmark} onEdit={() => openEdit("afpInfo")}>
                                                    <InfoRow label="Serial No"  value={afpInfo.afpsn} />
                                                    <InfoRow label="Rank"       value={afpInfo.rank} />
                                                    <InfoRow label="Retirement" value={afpInfo.retirementDate} />
                                                </InfoCard>
                                            </div>
                                        )}

                                        {/* PERSONAL */}
                                        {activeSection === "personal" && (
                                            <div className="space-y-4 sm:space-y-5">
                                                <InfoCard title="Basic Information" icon={User} onEdit={() => openEdit("basicInfo")}>
                                                    <InfoRow label="Nickname"    value={basicInfo.nickname} />
                                                    <InfoRow label="Gender"      value={basicInfo.gender} />
                                                    <InfoRow label="Nationality" value={basicInfo.nationality} />
                                                    <InfoRow label="Religion"    value={basicInfo.religion} />
                                                    <InfoRow label="Email"       value={basicInfo.email} />
                                                    <InfoRow label="Mobile"      value={basicInfo.contact} />
                                                    <InfoRow label="Full Address" value={[basicInfo.fullAddress, basicInfo.barangay, basicInfo.city, basicInfo.province].filter(Boolean).join(", ")} />
                                                </InfoCard>
                                                <InfoCard title="Identification" icon={IdCard} onEdit={() => openEdit("identification")}>
                                                    <InfoRow label="TIN No."  value={identificationInfo.tinNo} />
                                                    <InfoRow label="GSIS No." value={identificationInfo.gsisNo} />
                                                    <InfoRow label="CRN/UMID" value={identificationInfo.crnUmidNo} />
                                                </InfoCard>
                                            </div>
                                        )}

                                        {/* SERVICE */}
                                        {activeSection === "service" && (
                                            <div className="space-y-4 sm:space-y-5">
                                                <InfoCard title="Branch Service" icon={Shield} onEdit={() => openEdit("branchService")}>
                                                    <InfoRow label="Branch"     value={branchService.branchService} />
                                                    <InfoRow label="Sub-Branch" value={branchService.subBranch} />
                                                </InfoCard>
                                                <InfoCard title="AFP Information" icon={Landmark} onEdit={() => openEdit("afpInfo")}>
                                                    <InfoRow label="Serial No"        value={afpInfo.afpsn} />
                                                    <InfoRow label="Rank"             value={afpInfo.rank} />
                                                    <InfoRow label="Designation"      value={afpInfo.designation} />
                                                    <InfoRow label="AFP ID"           value={afpInfo.afpId} />
                                                    <InfoRow label="Unit Assignment"  value={afpInfo.presentAssignment} />
                                                    <InfoRow label="Years in Service" value={afpInfo.yearsInService} />
                                                    <InfoRow label="Enlistment Date"  value={afpInfo.cadEnlistment} />
                                                    <InfoRow label="Retirement Date"  value={afpInfo.retirementDate} />
                                                    <InfoRow label="Pension Date"     value={afpInfo.pensionDate} />
                                                </InfoCard>
                                            </div>
                                        )}

                                        {/* CONTACTS */}
                                        {activeSection === "contacts" && (
                                            <div className="space-y-4 sm:space-y-5">
                                                <InfoCard title="Emergency Contact" icon={Phone} onEdit={() => openEdit("emergencyInfo")}>
                                                    <InfoRow label="Name"     value={emergencyContact.contactPersonName} />
                                                    <InfoRow label="Relation" value={emergencyContact.contactPersonRelation} />
                                                    <InfoRow label="Phone"    value={emergencyContact.contactPersonPhone} />
                                                    <InfoRow label="Address"  value={emergencyContact.contactPersonAddress} />
                                                </InfoCard>
                                                <InfoCard title="Spouse Info" icon={Users} onEdit={() => openEdit("spouseInfo")}>
                                                    <InfoRow label="Name"          value={spouseInfo.spouseName} />
                                                    <InfoRow label="Date of Birth" value={spouseInfo.spouseDob} />
                                                    <InfoRow label="Marriage Date" value={spouseInfo.dateMarriage} />
                                                </InfoCard>
                                                <InfoCard title="Parents Info" icon={Users} onEdit={() => openEdit("parentsInfo")}>
                                                    <InfoRow label="Father" value={`${parentsInfo.fatherName || "—"} (${parentsInfo.fatherAge || "?"})`} />
                                                    <InfoRow label="Mother" value={`${parentsInfo.motherName || "—"} (${parentsInfo.motherAge || "?"})`} />
                                                </InfoCard>
                                            </div>
                                        )}

                                        {/* DEPENDENTS */}
                                        {activeSection === "dependents" && (
                                            <div>
                                                <SectionHeading>Dependents</SectionHeading>
                                                <LedgerTable
                                                    columns={["Name", "Date of Birth", "Gender"]}
                                                    pager={dependentsPager}
                                                    renderRow={(d, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-sm">{d.name || "—"}</td>
                                                            <td className="px-4 py-3 text-slate-500 dark:text-white/60 text-sm">{d.dob || "—"}</td>
                                                            <td className="px-4 py-3 text-slate-500 dark:text-white/60 text-sm">{d.gender || "—"}</td>
                                                        </tr>
                                                    )}
                                                />
                                            </div>
                                        )}

                                    </motion.div>
                                </AnimatePresence>
                            </main>
                        </div>
                    </div>
                </div>

                {/* ── EDIT MODAL ───────────────────────────────────────────── */}
                <AnimatePresence>
                    {isEditOpen && (
                        <motion.div
                            className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            role="dialog" aria-modal="true"
                        >
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md"
                                onClick={() => setIsEditOpen(false)}
                                aria-hidden="true"
                            />

                            {/* Modal panel */}
                            <motion.div
                                className="relative w-full max-w-5xl flex flex-col bg-white dark:bg-[#0d1a14] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden"
                                style={{ maxHeight: "92dvh" }}
                                initial={{ opacity: 0, scale: 0.97, y: -16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97, y: -16 }}
                                transition={{ type: "spring", damping: 32, stiffness: 380, mass: 0.8 }}
                            >
                                {/* ── MODAL HEADER ────────────────────────── */}
                                <div className="shrink-0 flex items-center justify-between gap-4 px-5 sm:px-7 py-4 sm:py-5 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-800">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-xl bg-white/15 grid place-items-center shrink-0">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">Update Profile</h2>
                                            <p className="text-xs text-emerald-100/70 mt-0.5 hidden sm:block">Changes are saved per section</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditOpen(false)}
                                        aria-label="Close"
                                        className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors active:scale-95"
                                    >
                                        <X className="h-4 w-4 text-current" />
                                    </button>
                                </div>

                                {/* ── MODAL BODY ──────────────────────────── */}
                                <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

                                    {/* Left sidebar — horizontal on mobile, vertical on lg */}
                                    <div className="shrink-0 lg:w-56 lg:border-r border-b lg:border-b-0 border-slate-100 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02]">
                                        {/* Mobile: horizontal scrollable pill row */}
                                        <div className="lg:hidden flex gap-1.5 overflow-x-auto scrollbar-hide px-4 py-3">
                                            {[
                                                { id: "basicInfo",      label: "Basic Info",  icon: User     },
                                                { id: "branchService",  label: "Branch",      icon: Shield   },
                                                { id: "identification", label: "IDs",         icon: IdCard   },
                                                { id: "afpInfo",        label: "AFP",         icon: Landmark },
                                                { id: "spouseInfo",     label: "Spouse",      icon: Users    },
                                                { id: "parentsInfo",    label: "Parents",     icon: Users    },
                                                { id: "emergencyInfo",  label: "Emergency",   icon: Phone    },
                                                { id: "dependentsInfo", label: "Dependents",  icon: Users    },
                                            ].map(t => {
                                                const active = editTab === t.id;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setEditTab(t.id)}
                                                        className={`inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                                            active
                                                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                                                                : "bg-white dark:bg-white/5 text-slate-500 dark:text-white/50 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10"
                                                        }`}
                                                    >
                                                        <t.icon className="h-3 w-3 text-current" />
                                                        {t.label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Desktop: vertical nav list */}
                                        <nav className="hidden lg:flex flex-col p-3 gap-0.5 h-full overflow-y-auto">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 px-3 pb-2 pt-1">Sections</p>
                                            {[
                                                { id: "basicInfo",      label: "Basic Info",     icon: User,     desc: "Name, contact, address"   },
                                                { id: "branchService",  label: "Branch Service", icon: Shield,   desc: "Military / civilian"       },
                                                { id: "identification", label: "Identification", icon: IdCard,   desc: "TIN, GSIS, CRN"            },
                                                { id: "afpInfo",        label: "AFP Info",       icon: Landmark, desc: "Rank, serial, retirement"  },
                                                { id: "spouseInfo",     label: "Spouse",         icon: Users,    desc: "Spouse details"            },
                                                { id: "parentsInfo",    label: "Parents",        icon: Users,    desc: "Father & mother"           },
                                                { id: "emergencyInfo",  label: "Emergency",      icon: Phone,    desc: "Emergency contact"         },
                                                { id: "dependentsInfo", label: "Dependents",     icon: Users,    desc: "Dependents list"           },
                                            ].map(t => {
                                                const active = editTab === t.id;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setEditTab(t.id)}
                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                                                            active
                                                                ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                                                : "text-slate-600 dark:text-white/60 hover:bg-white dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                                        }`}
                                                    >
                                                        <span className={`grid place-items-center h-8 w-8 rounded-lg shrink-0 transition-colors ${
                                                            active
                                                                ? "bg-emerald-100 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                                                                : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40 group-hover:bg-slate-200 dark:group-hover:bg-white/15"
                                                        }`}>
                                                            <t.icon className="h-3.5 w-3.5 text-current" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold truncate">{t.label}</p>
                                                            <p className="text-[10px] text-slate-400 dark:text-white/30 truncate leading-tight">{t.desc}</p>
                                                        </div>
                                                        {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </nav>
                                    </div>

                                    {/* Right form area */}
                                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                        {/* Form section header */}
                                        <div className="shrink-0 flex items-center gap-3 px-5 sm:px-6 py-3.5 border-b border-slate-100 dark:border-white/[0.06] bg-white dark:bg-transparent">
                                            {{
                                                basicInfo:      <><div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 grid place-items-center"><User      className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Basic Information</span></>,
                                                branchService:  <><div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-500/20 grid place-items-center"><Shield    className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Branch Service</span></>,
                                                identification: <><div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-500/20 grid place-items-center"><IdCard    className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Identification</span></>,
                                                afpInfo:        <><div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 grid place-items-center"><Landmark  className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">AFP Info</span></>,
                                                spouseInfo:     <><div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 grid place-items-center"><Users     className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Spouse Info</span></>,
                                                parentsInfo:    <><div className="h-7 w-7 rounded-lg bg-orange-100 dark:bg-orange-500/20 grid place-items-center"><Users     className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Parents Info</span></>,
                                                emergencyInfo:  <><div className="h-7 w-7 rounded-lg bg-red-100 dark:bg-red-500/20 grid place-items-center"><Phone     className="h-3.5 w-3.5 text-red-600 dark:text-red-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Emergency Contact</span></>,
                                                dependentsInfo: <><div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 grid place-items-center"><Users     className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Dependents</span></>,
                                            }[editTab]}
                                        </div>

                                        {/* Scrollable form body */}
                                        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6">

                                            {editTab === "basicInfo" && (
                                                <div className="space-y-5">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                        <Field label="First Name"   value={basicInfoForm.firstName}  onChange={v => setBasicInfoForm(p=>({...p,firstName:v}))} />
                                                        <Field label="Middle Name"  value={basicInfoForm.middleName} onChange={v => setBasicInfoForm(p=>({...p,middleName:v}))} />
                                                        <Field label="Last Name"    value={basicInfoForm.lastName}   onChange={v => setBasicInfoForm(p=>({...p,lastName:v}))} />
                                                        <Field label="Suffix"       value={basicInfoForm.suffix}     onChange={v => setBasicInfoForm(p=>({...p,suffix:v}))} />
                                                        <Field label="Nickname"     value={basicInfoForm.nickname}   onChange={v => setBasicInfoForm(p=>({...p,nickname:v}))} />
                                                        <SelectField label="Gender" value={basicInfoForm.gender} onChange={v => setBasicInfoForm(p=>({...p,gender:v}))} options={["Male","Female"]} />
                                                        <Field label="Birth Date" type="date" value={basicInfoForm.dob} onChange={v => setBasicInfoForm(p=>({...p,dob:v}))} />
                                                        <SelectField label="Civil Status" value={basicInfoForm.civilStatus} onChange={v => setBasicInfoForm(p=>({...p,civilStatus:v}))} options={["Single","Married","Widowed","Separated","Divorced"]} />
                                                        <Field label="Religion"    value={basicInfoForm.religion}    onChange={v => setBasicInfoForm(p=>({...p,religion:v}))} />
                                                        <Field label="Nationality" value={basicInfoForm.nationality} onChange={v => setBasicInfoForm(p=>({...p,nationality:v}))} />
                                                        <Field label="Email" type="email" value={basicInfoForm.email} onChange={v => setBasicInfoForm(p=>({...p,email:v}))} />
                                                        <Field label="Contact No." value={basicInfoForm.contact} onChange={v => setBasicInfoForm(p=>({...p,contact:v}))} />
                                                    </div>
                                                    <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 mb-3 flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-emerald-500" /> Address
                                                        </p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                            <SelectFieldV2 label="Region"   value={selectedRegion}   onChange={v=>{setSelectedRegion(v);setSelectedProvince("");setSelectedCity("");setSelectedBarangay("");}} options={regionOptions.map(r=>({value:r.code,label:r.name}))} />
                                                            <SelectFieldV2 label="Province" value={selectedProvince} onChange={v=>{setSelectedProvince(v);setSelectedCity("");setSelectedBarangay("");}} options={provinceOptions.map(p=>({value:p,label:p}))} disabled={!selectedRegion} />
                                                            <SelectFieldV2 label="City / Municipality" value={selectedCity} onChange={v=>{setSelectedCity(v);setSelectedBarangay("");}} options={cityOptions.map(c=>({value:c,label:c}))} disabled={!selectedProvince} />
                                                            <SelectFieldV2 label="Barangay" value={selectedBarangay} onChange={v=>setSelectedBarangay(v)} options={barangayOptions.map(b=>({value:b,label:b}))} disabled={!selectedCity} />
                                                            <div className="sm:col-span-2"><Field label="Street / Unit / Building" value={basicInfoForm.fullAddress} onChange={v=>setBasicInfoForm(p=>({...p,fullAddress:v}))} /></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {editTab === "branchService" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <SelectFieldV2 label="Branch of Service" value={branchForm.branchService} onChange={v=>setBranchForm(p=>({...p,branchService:v}))} options={Object.keys(branchOptions).map(k=>({value:k,label:k}))} />
                                                    <SelectFieldV2 label="Sub-Branch" value={branchForm.subBranch} onChange={v=>setBranchForm(p=>({...p,subBranch:v}))} options={availableSubBranches.map(k=>({value:k,label:k}))} disabled={!branchForm.branchService} />
                                                </div>
                                            )}

                                            {editTab === "identification" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <Field label="TIN No."      value={identificationForm.tinNo}    onChange={v=>setIdentificationForm(p=>({...p,tinNo:formatTin(v)}))} />
                                                    <Field label="GSIS No."     value={identificationForm.gsisNo}   onChange={v=>setIdentificationForm(p=>({...p,gsisNo:formatGsis(v)}))} />
                                                    <Field label="CRN/UMID No." value={identificationForm.crnUmidNo} onChange={v=>setIdentificationForm(p=>({...p,crnUmidNo:formatCRN(v)}))} />
                                                </div>
                                            )}

                                            {editTab === "afpInfo" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <Field label="AFP Serial No"    value={afpForm.afpsn}             onChange={v=>setAfpForm(p=>({...p,afpsn:v}))} />
                                                    <Field label="Rank"             value={afpForm.rank}              onChange={v=>setAfpForm(p=>({...p,rank:v}))} />
                                                    <Field label="Designation"      value={afpForm.designation}       onChange={v=>setAfpForm(p=>({...p,designation:v}))} />
                                                    <Field label="AFP ID"           value={afpForm.afpId}             onChange={v=>setAfpForm(p=>({...p,afpId:v}))} />
                                                    <div className="sm:col-span-2">
                                                        <Field label="Present Assignment" value={afpForm.presentAssignment} onChange={v=>setAfpForm(p=>({...p,presentAssignment:v}))} />
                                                    </div>
                                                    <Field label="Years in Service" value={afpForm.yearsInService}    onChange={v=>setAfpForm(p=>({...p,yearsInService:v}))} />
                                                    <Field label="Enlistment Date" type="date" value={afpForm.cadEnlistment}  onChange={v=>setAfpForm(p=>({...p,cadEnlistment:v}))} />
                                                    <Field label="Retirement Date" type="date" value={afpForm.retirementDate} onChange={v=>setAfpForm(p=>({...p,retirementDate:v}))} />
                                                    <Field label="Pension Date"    type="date" value={afpForm.pensionDate}    onChange={v=>setAfpForm(p=>({...p,pensionDate:v}))} />
                                                </div>
                                            )}

                                            {editTab === "spouseInfo" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <div className="sm:col-span-2">
                                                        <Field label="Spouse Full Name" value={spouseForm.spouseName}   onChange={v=>setSpouseForm(p=>({...p,spouseName:v}))} />
                                                    </div>
                                                    <Field label="Date of Birth"    type="date" value={spouseForm.spouseDob}    onChange={v=>setSpouseForm(p=>({...p,spouseDob:v}))} />
                                                    <Field label="Date of Marriage" type="date" value={spouseForm.dateMarriage} onChange={v=>setSpouseForm(p=>({...p,dateMarriage:v}))} />
                                                </div>
                                            )}

                                            {editTab === "parentsInfo" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <Field label="Father's Name" value={parentsForm.fatherName} onChange={v=>setParentsForm(p=>({...p,fatherName:v}))} />
                                                    <Field label="Father's Age" type="number" value={parentsForm.fatherAge} onChange={v=>setParentsForm(p=>({...p,fatherAge:v}))} />
                                                    <Field label="Mother's Name" value={parentsForm.motherName} onChange={v=>setParentsForm(p=>({...p,motherName:v}))} />
                                                    <Field label="Mother's Age" type="number" value={parentsForm.motherAge} onChange={v=>setParentsForm(p=>({...p,motherAge:v}))} />
                                                </div>
                                            )}

                                            {editTab === "emergencyInfo" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <Field label="Contact Person" value={emergencyForm.contactPersonName} onChange={v=>setEmergencyForm(p=>({...p,contactPersonName:v}))} />
                                                    <SelectFieldV2 label="Relationship" value={emergencyForm.contactPersonRelation} onChange={v=>setEmergencyForm(p=>({...p,contactPersonRelation:v}))} options={["Father","Mother","Spouse","Brother","Sister","Son","Daughter","Relative","Guardian","Friend","Colleague","Neighbor","Others"].map(x=>({value:x,label:x}))} />
                                                    <div className="sm:col-span-2">
                                                        <Field label="Phone Number" value={emergencyForm.contactPersonPhone}   onChange={v=>setEmergencyForm(p=>({...p,contactPersonPhone:v}))} />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <Field label="Address"      value={emergencyForm.contactPersonAddress} onChange={v=>setEmergencyForm(p=>({...p,contactPersonAddress:v}))} />
                                                    </div>
                                                </div>
                                            )}

                                            {editTab === "dependentsInfo" && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-slate-500 dark:text-white/40">{dependentsForm.length} dependent{dependentsForm.length !== 1 ? "s" : ""}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDependentsForm(p=>[...p,{id:null,name:"",dob:"",gender:""}])}
                                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-white transition shadow-sm"
                                                        >
                                                            + Add Dependent
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {dependentsForm.map((row, idx) => (
                                                            <div key={idx} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-4 space-y-3">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">Dependent {idx + 1}</span>
                                                                    <button type="button" onClick={()=>setDependentsForm(p=>p.filter((_,i)=>i!==idx))} className="h-7 w-7 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                                    <div className="sm:col-span-1">
                                                                        <Field label="Full Name" value={row.name} onChange={v=>setDependentsForm(p=>p.map((r,i)=>i===idx?{...r,name:v}:r))} />
                                                                    </div>
                                                                    <Field label="Date of Birth" type="date" value={row.dob} onChange={v=>setDependentsForm(p=>p.map((r,i)=>i===idx?{...r,dob:v}:r))} />
                                                                    <SelectField label="Gender" value={row.gender} onChange={v=>setDependentsForm(p=>p.map((r,i)=>i===idx?{...r,gender:v}:r))} options={["Male","Female"]} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {dependentsForm.length === 0 && (
                                                            <div className="flex flex-col items-center gap-2 py-10 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400 dark:text-white/30">
                                                                <Users className="h-7 w-7 opacity-50" />
                                                                <span className="text-sm font-medium">No dependents added yet</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        </div>{/* end scrollable form body */}

                                        {/* ── MODAL FOOTER ──────────────────── */}
                                        <div className="shrink-0 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02]">
                                            <p className="text-xs text-slate-400 dark:text-white/30 hidden sm:block">
                                                Only the current section will be saved.
                                            </p>
                                            <div className="flex gap-2.5 w-full sm:w-auto">
                                                <button
                                                    onClick={() => setIsEditOpen(false)}
                                                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/10 font-semibold text-sm transition-all active:scale-95"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveCurrentTab}
                                                    disabled={isSaving}
                                                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-60 transition-all active:scale-95"
                                                >
                                                    {isSaving
                                                        ? <><Loader2 className="h-4 w-4 animate-spin text-current" /> Saving...</>
                                                        : <><CheckCircle2 className="h-4 w-4 text-current" /> Save Changes</>
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </PaymentReminderLayout>
        </SidebarLayout>
    );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function SectionButton({ id, icon: Icon, label, activeId, onClick }) {
    const active = activeId === id;
    return (
        <button onClick={() => onClick(id)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold" : "text-slate-500 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold"}`}>
            <span className={`grid place-items-center h-7 w-7 rounded-lg ${active ? "bg-emerald-200 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40"}`}>
                <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm">{label}</span>
        </button>
    );
}

function InfoCard({ title, icon: Icon, children, onEdit }) {
    return (
        <div className="bg-white dark:bg-[#111a16] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid place-items-center h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Icon className="h-4 w-4 text-current" />
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{title}</span>
                </div>
                <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition text-xs font-semibold shrink-0">
                    <Edit3 className="h-3 w-3 text-current" /> Edit
                </button>
            </div>
            <div className="px-4 sm:px-5 py-1">{children}</div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-50 dark:border-white/[0.04] last:border-0">
            <span className="text-xs text-slate-400 dark:text-white/40 shrink-0 pt-0.5">{label}</span>
            <span className="text-xs sm:text-sm text-slate-900 dark:text-white/90 font-medium text-right break-words max-w-[65%]">{value || "—"}</span>
        </div>
    );
}

function SectionHeading({ children }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{children}</h2>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
        </div>
    );
}

function LedgerTable({ columns, pager, renderRow, hiddenCols = [] }) {
    return (
        <div className="bg-white dark:bg-[#111a16] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/10">
                            {columns.map((col, i) => (
                                <th key={i} className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 ${hiddenCols.includes(i) ? "hidden sm:table-cell" : ""}`}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                        {pager.pageRows.length > 0 ? pager.pageRows.map(renderRow) : (
                            <tr><td colSpan={columns.length} className="px-4 py-10"><EmptyState text="No records found." /></td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {pager.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400 dark:text-white/30 font-medium">Page {pager.page} of {pager.totalPages}</span>
                    <div className="flex items-center gap-1.5">
                        <button onClick={pager.goPrev} disabled={pager.page <= 1} className="h-7 w-7 grid place-items-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
                            <ChevronLeft className="h-3.5 w-3.5 text-current" />
                        </button>
                        <button onClick={pager.goNext} disabled={pager.page >= pager.totalPages} className="h-7 w-7 grid place-items-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
                            <ChevronRight className="h-3.5 w-3.5 text-current" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-slate-300 dark:text-white/20">
            <FileText className="h-8 w-8 mb-2 text-current" />
            <p className="text-sm font-medium">{text}</p>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 dark:text-white/40 ml-0.5">{label}</label>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 dark:text-white/40 ml-0.5">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:bg-[#1a2c25] dark:border-white/10 dark:text-white cursor-pointer appearance-none"
                >
                    <option value="">Select</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
        </div>
    );
}

function SelectFieldV2({ label, value, onChange, options, disabled }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 dark:text-white/40 ml-0.5">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition disabled:opacity-40 disabled:cursor-not-allowed dark:bg-[#1a2c25] dark:border-white/10 dark:text-white cursor-pointer appearance-none"
                >
                    <option value="">Select {label}</option>
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
        </div>
    );
}