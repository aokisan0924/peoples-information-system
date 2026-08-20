import React, { useState, useMemo, useEffect, useRef } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import {
    CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Edit3,
    FileText, IdCard, Landmark, Loader2, Phone, Save, Shield,
    User, Users, X, Mail, Banknote, PiggyBank, Hourglass, Camera,
    TrendingUp, TrendingDown, Hash, ArrowLeft, Pencil
} from "lucide-react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import phAddresses from "@/data/ph-addresses.json";

// ─── ADDRESS HELPERS ──────────────────────────────────────────────────────────
const regionsSource = phAddresses.region_list ?? phAddresses;
const getRegionEntries = () =>
    Object.entries(regionsSource).map(([regionCode, regionData]) => ({
        code: regionCode,
        name: regionData.region_name || regionCode,
        provinceList: regionData.province_list || {}
    }));

// ─── SECTION CONFIG ───────────────────────────────────────────────────────────
const SECTIONS = [
    { id: "overview",   icon: User,     label: "Overview"            },
    { id: "personal",   icon: IdCard,   label: "Personal & IDs"      },
    { id: "service",    icon: Shield,   label: "AFP / Service"       },
    { id: "financials", icon: Banknote, label: "Financials"          },
    { id: "loans",      icon: Landmark, label: "Released Loans"      },
    { id: "contacts",   icon: Phone,    label: "Family & Emergency"  },
    { id: "dependents", icon: Users,    label: "Dependents"          },
];

// ─── PAGINATION HOOK ──────────────────────────────────────────────────────────
function useClientPagination(rows, pageSize = 6) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);
    return { page, totalPages, pageRows, goPrev: () => setPage(p => Math.max(1, p - 1)), goNext: () => setPage(p => Math.min(totalPages, p + 1)) };
}

export default function MemberView() {
    const { props } = usePage();
    const { MemberData } = props;

    const basicInfo          = MemberData?.basicInfoData        || {};
    const memberId           = basicInfo.encrypted || basicInfo.id;
    const branchService      = MemberData?.branchServiceData    || {};
    const afpInfo            = MemberData?.afpData              || {};
    const identificationInfo = MemberData?.identificationData   || {};
    const spouseInfo         = MemberData?.spouseData           || {};
    const parentsInfo        = MemberData?.parentsData          || {};
    const emergencyContact   = MemberData?.emergencyData        || {};
    const dependents         = Array.isArray(MemberData?.dependentsData)   ? MemberData.dependentsData   : [];
    const releasedLoans      = Array.isArray(MemberData?.releasedLoansData) ? MemberData.releasedLoansData : [];
    const shareCapital       = MemberData?.shareCapitalData     || { rows: [], summary: {} };
    const savings            = MemberData?.savingsData          || { rows: [], summary: {} };
    const timeDeposits       = MemberData?.timeDepositData      || { deposits: [], summaryAll: {} };

    // ── UI STATE ──────────────────────────────────────────────────────────────
    const [activeSection, setActiveSection]       = useState("overview");
    const [isEditOpen, setIsEditOpen]             = useState(false);
    const [editTab, setEditTab]                   = useState("basicInfo");
    const [isSaving, setIsSaving]                 = useState(false);
    const [imgError, setImgError]                 = useState(false);
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen]   = useState(false);
    const [adminPassword, setAdminPassword]       = useState("");
    const [isSending, setIsSending]               = useState(false);
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
        email: basicInfo.email||"", accountStatus: basicInfo.accountStatus||"",
        contact: basicInfo.contact||"", fullAddress: basicInfo.fullAddress||"",
        membershipDate: basicInfo.membershipDate||"", branch: basicInfo.branch||"",
    });
    const [branchForm, setBranchForm]           = useState({ branchService: branchService?.branchService||"", subBranch: branchService?.subBranch||"" });
    const [afpForm, setAfpForm]                 = useState({ afpsn: afpInfo?.afpsn||"", rank: afpInfo?.rank||"", designation: afpInfo?.designation||"", afpId: afpInfo?.afpId||"", presentAssignment: afpInfo?.presentAssignment||"", yearsInService: afpInfo?.yearsInService||"", cadEnlistment: afpInfo?.cadEnlistment||"", retirementDate: afpInfo?.retirementDate||"", pensionDate: afpInfo?.pensionDate||"" });
    const [identificationForm, setIdentificationForm] = useState({ tinNo: identificationInfo?.tinNo||"", gsisNo: identificationInfo?.gsisNo||"", crnUmidNo: identificationInfo?.crnUmidNo||"" });
    const [spouseForm, setSpouseForm]           = useState({ spouseName: spouseInfo?.spouseName||"", spouseDob: spouseInfo?.spouseDob||"", dateMarriage: spouseInfo?.dateMarriage||"" });
    const [parentsForm, setParentsForm]         = useState({ fatherName: parentsInfo?.fatherName||"", fatherAge: parentsInfo?.fatherAge||"", motherName: parentsInfo?.motherName||"", motherAge: parentsInfo?.motherAge||"" });
    const [emergencyForm, setEmergencyForm]     = useState({ contactPersonName: emergencyContact?.contactPersonName||"", contactPersonAddress: emergencyContact?.contactPersonAddress||"", contactPersonPhone: emergencyContact?.contactPersonPhone||"", contactPersonRelation: emergencyContact?.contactPersonRelation||"" });
    const [dependentsForm, setDependentsForm]   = useState(() => dependents.map(d => ({ id: d.id??null, name: d.name??"", dob: d.dob??"", gender: d.gender??"" })));

    useEffect(() => {
        const subs = branchOptions[branchForm.branchService] || [];
        setAvailableSubBranches(subs);
        if (!subs.includes(branchForm.subBranch)) setBranchForm(p => ({ ...p, subBranch: "" }));
    }, [branchForm.branchService]);

    const fullName = useMemo(() =>
        `${basicInfo.firstName??""} ${basicInfo.middleName??""} ${basicInfo.lastName??""} ${basicInfo.suffix??""}`.replace(/\s+/g," ").trim()
    , [basicInfo]);

    const formatTin  = v => v.replace(/\D/g,"").replace(/(\d{3})(\d)/,"$1-$2").replace(/(\d{3})(\d)/,"$1-$2").replace(/(\d{3})(\d{1,3})/,"$1-$2").substring(0,15);
    const formatGsis = v => v.replace(/\D/g,"").replace(/(\d{2})(\d)/,"$1-$2").replace(/(\d{7})(\d)/,"$1-$2").substring(0,12);
    const formatCRN  = v => v.replace(/\D/g,"").replace(/(\d{4})(\d)/,"$1-$2").replace(/(\d{7})(\d)/,"$1-$2").substring(0,15);
    const formatMoney = val => {
        const num = Number((val??"0").toString().replace(/,/g,""));
        return isNaN(num) ? "₱0.00" : new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(num);
    };
    const safeText = (v, f="—") => (v && v.toString().trim().length ? v : f);

    const openEdit = (tab) => { setEditTab(tab); setIsEditOpen(true); };

    // ── SAVERS ────────────────────────────────────────────────────────────────
    const handleSaveCurrentTab = async () => {
        setIsSaving(true);
        try {
            const getRoute = name => route(name, { id: memberId });
            const tabMap = {
                basicInfo:      { url: getRoute("admin.members.update-basic-info"),          payload: { ...basicInfoForm, region: selectedRegion, province: selectedProvince, city: selectedCity, barangay: selectedBarangay } },
                branchService:  { url: getRoute("admin.members.update-branch-service"),      payload: branchForm },
                identification: { url: getRoute("admin.members.update-identification-info"), payload: identificationForm },
                afpInfo:        { url: getRoute("admin.members.update-afp-info"),            payload: afpForm },
                spouseInfo:     { url: getRoute("admin.members.update-spouse-info"),         payload: spouseForm },
                parentsInfo:    { url: getRoute("admin.members.update-parents-info"),        payload: parentsForm },
                emergencyInfo:  { url: getRoute("admin.members.update-emergency-info"),      payload: emergencyForm },
                dependentsInfo: { url: getRoute("admin.members.update-dependents-info"),     payload: { dependents: dependentsForm } },
            };
            const { url, payload } = tabMap[editTab] || {};
            if (!url) return;
            const { data } = await axios.post(url, payload);
            if (data?.success) { toast.success(data?.message || "Updated successfully"); window.location.reload(); }
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
        formData.append("profile_image", file);
        try {
            const { data } = await axios.post(route("admin.members.update-photo", { id: memberId }), formData, { headers: { "Content-Type": "multipart/form-data" } });
            if (data?.success) { toast.success("Photo updated!"); window.location.reload(); }
            else toast.error(data?.message || "Failed to update photo");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to upload photo.");
        } finally { setIsPhotoUploading(false); if (photoInputRef.current) photoInputRef.current.value = ""; }
    };

    // ── PAGINATORS ────────────────────────────────────────────────────────────
    const dependentsPager   = useClientPagination(dependents, 6);
    const loansPager        = useClientPagination(releasedLoans, 6);
    const shareCapitalPager = useClientPagination(shareCapital.rows || [], 10);
    const savingsPager      = useClientPagination(savings.rows || [], 10);

    const isActive = basicInfo.accountStatus !== "inactive";

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
            <Head title={`${fullName} — Member Profile`}>
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>

                <div className="min-h-screen bg-slate-50 dark:bg-[#080e0c] transition-colors duration-300">

                    {/* ── HERO BANNER ───────────────────────────────────────── */}
                    <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 dark:from-emerald-800 dark:via-emerald-900 dark:to-teal-950 overflow-hidden">
                        {/* decorative blobs */}
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
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all backdrop-blur-sm active:scale-95"
                                    >
                                        <Mail className="h-3.5 w-3.5" />
                                        <span className="hidden xs:inline">Send Login</span>
                                    </button>
                                    <button
                                        onClick={() => openEdit("basicInfo")}
                                        className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-bold transition-all shadow-lg active:scale-95"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        <span>Edit Profile</span>
                                    </button>
                                </div>
                            </div>

                            {/* Profile row */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 rounded-2xl sm:rounded-3xl overflow-hidden ring-4 ring-white/30 shadow-2xl bg-white/10">
                                        {basicInfo.profileImage && !imgError ? (
                                            <img
                                                src={basicInfo.profileImage.startsWith("http") || basicInfo.profileImage.startsWith("/") ? basicInfo.profileImage : `/storage/${basicInfo.profileImage}`}
                                                alt={fullName} className="h-full w-full object-cover"
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
                                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">{fullName}</h1>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${isActive ? "bg-emerald-400/20 border-emerald-300/30 text-emerald-100" : "bg-white/10 border-white/20 text-white/60"}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-300" : "bg-white/40"}`} />
                                            {basicInfo.accountStatus || "Active"}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3 sm:gap-5 text-emerald-100/80 text-sm">
                                        <span className="flex items-center gap-1.5">
                                            <Hash className="h-3.5 w-3.5 opacity-70" />
                                            <span className="font-mono font-semibold">{safeText(basicInfo.id)}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 opacity-70" />
                                            <span>{safeText(basicInfo.contact)}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 opacity-70" />
                                            <span className="truncate max-w-[200px]">{safeText(basicInfo.email)}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Shield className="h-3.5 w-3.5 opacity-70" />
                                            <span>{safeText(branchService.branchService)}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── STAT CARDS (overlap the banner) ──────────────────── */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 relative z-10 mb-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { label: "Share Capital",  value: formatMoney(shareCapital.summary?.totalBalance  || 0), icon: Banknote,  color: "from-emerald-500 to-teal-500"    },
                                { label: "Savings",        value: formatMoney(savings.summary?.totalBalance       || 0), icon: PiggyBank, color: "from-sky-500 to-blue-600"         },
                                { label: "AFP Serial",     value: safeText(afpInfo.afpsn),                               icon: IdCard,    color: "from-violet-500 to-purple-600"    },
                                { label: "Membership",     value: safeText(basicInfo.membershipDate),                   icon: CreditCard,color: "from-amber-500 to-orange-500"     },
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
                                                    <InfoRow label="Full Name"       value={fullName} />
                                                    <InfoRow label="Date of Birth"   value={basicInfo.dob} />
                                                    <InfoRow label="Civil Status"    value={basicInfo.civilStatus} />
                                                    <InfoRow label="Membership Date" value={basicInfo.membershipDate || "—"} />
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
                                                    <InfoRow label="Membership Date" value={basicInfo.membershipDate || "—"} />
                                                    <InfoRow label="Nickname"    value={basicInfo.nickname} />
                                                    <InfoRow label="Gender"      value={basicInfo.gender} />
                                                    <InfoRow label="Nationality" value={basicInfo.nationality} />
                                                    <InfoRow label="Religion"    value={basicInfo.religion} />
                                                    <InfoRow label="Email"       value={basicInfo.email} />
                                                    <InfoRow label="Mobile"      value={basicInfo.contact} />
                                                    <InfoRow label="Address"     value={`${basicInfo.fullAddress||""} ${basicInfo.barangay||""} ${basicInfo.city||""} ${basicInfo.province||""}`.trim()} />
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
                                                <InfoCard title="AFP Info" icon={Landmark} onEdit={() => openEdit("afpInfo")}>
                                                    <InfoRow label="Serial No"       value={afpInfo.afpsn} />
                                                    <InfoRow label="Rank"            value={afpInfo.rank} />
                                                    <InfoRow label="Designation"     value={afpInfo.designation} />
                                                    <InfoRow label="AFP ID"          value={afpInfo.afpId} />
                                                    <InfoRow label="Unit Assignment" value={afpInfo.presentAssignment} />
                                                    <InfoRow label="Retirement Date" value={afpInfo.retirementDate} />
                                                </InfoCard>
                                            </div>
                                        )}

                                        {/* FINANCIALS */}
                                        {activeSection === "financials" && (
                                            <div className="space-y-6">
                                                {/* Share Capital */}
                                                <section>
                                                    <SectionHeading>Share Capital</SectionHeading>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                                        <FinanceStat label="Balance"         value={formatMoney(shareCapital.summary?.totalBalance  || 0)} trend="up" />
                                                        <FinanceStat label="Paid Shares"     value={shareCapital.summary?.paidCapital || "0"}             />
                                                        <FinanceStat label="Total Deposits"  value={formatMoney(shareCapital.summary?.totalDeposits  || 0)} trend="up" />
                                                        <FinanceStat label="Withdrawals"     value={formatMoney(shareCapital.summary?.totalWithdrawals|| 0)} trend="down" />
                                                    </div>
                                                    <LedgerTable
                                                        columns={["Date","Credit","Debit","Balance"]}
                                                        pager={shareCapitalPager}
                                                        renderRow={(r, i) => (
                                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                                                                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-white/50">{r.transactionDate}</td>
                                                                <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{r.credit ? `₱${r.credit}` : "—"}</td>
                                                                <td className="px-4 py-3 text-right text-rose-500 dark:text-rose-400 font-semibold text-sm">{r.debit ? `₱${r.debit}` : "—"}</td>
                                                                <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white text-sm">₱{r.balance}</td>
                                                            </tr>
                                                        )}
                                                    />
                                                </section>

                                                {/* Savings */}
                                                <section>
                                                    <SectionHeading>Savings Deposit</SectionHeading>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                                        <FinanceStat label="Balance"         value={formatMoney(savings.summary?.totalBalance    || 0)} trend="up" />
                                                        <FinanceStat label="Total Deposits"  value={formatMoney(savings.summary?.totalDeposits   || 0)} trend="up" />
                                                        <FinanceStat label="Withdrawals"     value={formatMoney(savings.summary?.totalWithdrawals || 0)} trend="down" />
                                                    </div>
                                                    <LedgerTable
                                                        columns={["Date","Ref No.","Credit","Debit","Balance"]}
                                                        hiddenCols={[1]}
                                                        pager={savingsPager}
                                                        renderRow={(r, i) => (
                                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                                                                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-white/50">{r.transactionDate}</td>
                                                                <td className="px-4 py-3 font-mono text-xs text-slate-400 hidden sm:table-cell">{r.referenceNumber || "—"}</td>
                                                                <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{r.credit ? `+₱${r.credit}` : "—"}</td>
                                                                <td className="px-4 py-3 text-right text-rose-500 dark:text-rose-400 font-semibold text-sm">{r.debit ? `-₱${r.debit}` : "—"}</td>
                                                                <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white text-sm">₱{r.balance}</td>
                                                            </tr>
                                                        )}
                                                    />
                                                </section>

                                                {/* Time Deposits */}
                                                <section>
                                                    <SectionHeading>Time Deposits</SectionHeading>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                                        <FinanceStat label="Total Principal" value={formatMoney(timeDeposits.summaryAll?.totalPrincipal      || 0)} />
                                                        <FinanceStat label="Current Value"   value={formatMoney(timeDeposits.summaryAll?.totalCurrentBalance  || 0)} trend="up" />
                                                        <FinanceStat label="Active Accounts" value={timeDeposits.summaryAll?.totalCount || "0"} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        {timeDeposits.deposits?.map((td, i) => (
                                                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-[#111a16] border border-slate-200 dark:border-white/10 rounded-2xl p-4 gap-3 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors">
                                                                <div>
                                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{td.summary.timeDepositCode}</p>
                                                                    <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{td.summary.startDate} → {td.summary.maturityDate}</p>
                                                                </div>
                                                                <div className="sm:text-right">
                                                                    <p className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg">₱{td.summary.principal}</p>
                                                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Principal</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {!timeDeposits.deposits?.length && <EmptyState text="No time deposits found." />}
                                                    </div>
                                                </section>
                                            </div>
                                        )}

                                        {/* LOANS */}
                                        {activeSection === "loans" && (
                                            <div>
                                                <SectionHeading>Released Loans</SectionHeading>
                                                <LedgerTable
                                                    columns={["Reference","Type","Amount","Status"]}
                                                    hiddenCols={[1]}
                                                    pager={loansPager}
                                                    renderRow={(l, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                                                            <td className="px-4 py-3">
                                                                <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">{safeText(l.loanReference)}</p>
                                                                <p className="text-xs text-slate-400 sm:hidden mt-0.5">{safeText(l.loanType)}</p>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-white/70 hidden sm:table-cell">{safeText(l.loanType)}</td>
                                                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-sm">{formatMoney(l.loanAmount)}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 uppercase tracking-wide">
                                                                    {safeText(l.status)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )}
                                                />
                                            </div>
                                        )}

                                        {/* CONTACTS */}
                                        {activeSection === "contacts" && (
                                            <div className="space-y-4 sm:space-y-5">
                                                <InfoCard title="Spouse Info" icon={Users} onEdit={() => openEdit("spouseInfo")}>
                                                    <InfoRow label="Name"          value={spouseInfo.spouseName} />
                                                    <InfoRow label="Date of Birth" value={spouseInfo.spouseDob} />
                                                    <InfoRow label="Marriage Date" value={spouseInfo.dateMarriage} />
                                                </InfoCard>
                                                <InfoCard title="Parents Info" icon={Users} onEdit={() => openEdit("parentsInfo")}>
                                                    <InfoRow label="Father" value={`${parentsInfo.fatherName || "—"} (${parentsInfo.fatherAge || "?"})`} />
                                                    <InfoRow label="Mother" value={`${parentsInfo.motherName || "—"} (${parentsInfo.motherAge || "?"})`} />
                                                </InfoCard>
                                                <InfoCard title="Emergency Contact" icon={Phone} onEdit={() => openEdit("emergencyInfo")}>
                                                    <InfoRow label="Name"     value={emergencyContact.contactPersonName} />
                                                    <InfoRow label="Relation" value={emergencyContact.contactPersonRelation} />
                                                    <InfoRow label="Phone"    value={emergencyContact.contactPersonPhone} />
                                                    <InfoRow label="Address"  value={emergencyContact.contactPersonAddress} />
                                                </InfoCard>
                                            </div>
                                        )}

                                        {/* DEPENDENTS */}
                                        {activeSection === "dependents" && (
                                            <div>
                                                <SectionHeading>Dependents</SectionHeading>
                                                <LedgerTable
                                                    columns={["Name","Date of Birth","Gender"]}
                                                    pager={dependentsPager}
                                                    renderRow={(d, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-sm">{d.name}</td>
                                                            <td className="px-4 py-3 text-slate-500 dark:text-white/60 text-sm">{d.dob}</td>
                                                            <td className="px-4 py-3 text-slate-500 dark:text-white/60 text-sm">{d.gender}</td>
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
                                            <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">Update Member Profile</h2>
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

                                    {/* Left sidebar — vertical on lg, horizontal scroll on mobile */}
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
                                                const isActive = editTab === t.id;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setEditTab(t.id)}
                                                        className={`inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                                            isActive
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
                                                { id: "basicInfo",      label: "Basic Info",     icon: User,     desc: "Name, contact, address"  },
                                                { id: "branchService",  label: "Branch Service", icon: Shield,   desc: "Military / civilian"      },
                                                { id: "identification", label: "Identification", icon: IdCard,   desc: "TIN, GSIS, CRN"           },
                                                { id: "afpInfo",        label: "AFP Info",       icon: Landmark, desc: "Rank, serial, retirement" },
                                                { id: "spouseInfo",     label: "Spouse",         icon: Users,    desc: "Spouse details"           },
                                                { id: "parentsInfo",    label: "Parents",        icon: Users,    desc: "Father & mother"          },
                                                { id: "emergencyInfo",  label: "Emergency",      icon: Phone,    desc: "Emergency contact"        },
                                                { id: "dependentsInfo", label: "Dependents",     icon: Users,    desc: "Dependents list"          },
                                            ].map(t => {
                                                const isActive = editTab === t.id;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setEditTab(t.id)}
                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                                                            isActive
                                                                ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                                                : "text-slate-600 dark:text-white/60 hover:bg-white dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                                        }`}
                                                    >
                                                        <span className={`grid place-items-center h-8 w-8 rounded-lg shrink-0 transition-colors ${
                                                            isActive
                                                                ? "bg-emerald-100 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                                                                : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40 group-hover:bg-slate-200 dark:group-hover:bg-white/15"
                                                        }`}>
                                                            <t.icon className="h-3.5 w-3.5 text-current" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className={`text-sm font-bold truncate ${isActive ? "" : ""}`}>{t.label}</p>
                                                            <p className="text-[10px] text-slate-400 dark:text-white/30 truncate leading-tight">{t.desc}</p>
                                                        </div>
                                                        {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />}
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
                                                basicInfo: <><div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 grid place-items-center"><User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Basic Information</span></>,
                                                branchService: <><div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-500/20 grid place-items-center"><Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Branch Service</span></>,
                                                identification: <><div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-500/20 grid place-items-center"><IdCard className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Identification</span></>,
                                                afpInfo: <><div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 grid place-items-center"><Landmark className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">AFP Info</span></>,
                                                spouseInfo: <><div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 grid place-items-center"><Users className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Spouse Info</span></>,
                                                parentsInfo: <><div className="h-7 w-7 rounded-lg bg-orange-100 dark:bg-orange-500/20 grid place-items-center"><Users className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Parents Info</span></>,
                                                emergencyInfo: <><div className="h-7 w-7 rounded-lg bg-red-100 dark:bg-red-500/20 grid place-items-center"><Phone className="h-3.5 w-3.5 text-red-600 dark:text-red-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Emergency Contact</span></>,
                                                dependentsInfo: <><div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 grid place-items-center"><Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /></div><span className="text-sm font-bold text-slate-900 dark:text-white">Dependents</span></>,
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
                                                    <Field label="Membership Date" type="date" value={basicInfoForm.membershipDate} onChange={v => setBasicInfoForm(p=>({...p,membershipDate:v}))} />
                                                    <SelectFieldV2 label="Office Branch" value={basicInfoForm.branch} onChange={v => setBasicInfoForm(p=>({...p,branch:v}))} options={[
                                                        {value:"Main Office",label:"Main Office"},
                                                        {value:"Cubao Satellite Office",label:"Cubao Satellite Office"},
                                                        {value:"Fort Magsaysay Satellite Office",label:"Fort Magsaysay Satellite Office"},
                                                    ]} />
                                                    <Field label="Religion"    value={basicInfoForm.religion}    onChange={v => setBasicInfoForm(p=>({...p,religion:v}))} />
                                                    <Field label="Nationality" value={basicInfoForm.nationality} onChange={v => setBasicInfoForm(p=>({...p,nationality:v}))} />
                                                    <Field label="Email" type="email" value={basicInfoForm.email} onChange={v => setBasicInfoForm(p=>({...p,email:v}))} />
                                                    <Field label="Contact No." value={basicInfoForm.contact} onChange={v => setBasicInfoForm(p=>({...p,contact:v}))} />
                                                </div>
                                                <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 mb-3">Address</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                        <SelectFieldV2 label="Region"   value={selectedRegion}   onChange={v=>{setSelectedRegion(v);setSelectedProvince("");setSelectedCity("");setSelectedBarangay("");}} options={regionOptions.map(r=>({value:r.code,label:r.name}))} />
                                                        <SelectFieldV2 label="Province" value={selectedProvince} onChange={v=>{setSelectedProvince(v);setSelectedCity("");setSelectedBarangay("");}} options={provinceOptions.map(p=>({value:p,label:p}))} disabled={!selectedRegion} />
                                                        <SelectFieldV2 label="City / Municipality" value={selectedCity} onChange={v=>{setSelectedCity(v);setSelectedBarangay("");}} options={cityOptions.map(c=>({value:c,label:c}))} disabled={!selectedProvince} />
                                                        <SelectFieldV2 label="Barangay" value={selectedBarangay} onChange={v=>setSelectedBarangay(v)} options={barangayOptions.map(b=>({value:b,label:b}))} disabled={!selectedCity} />
                                                        <div className="sm:col-span-2"><Field label="Detailed Address (Street/Unit)" value={basicInfoForm.fullAddress} onChange={v=>setBasicInfoForm(p=>({...p,fullAddress:v}))} /></div>
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
                                                <Field label="TIN No."      value={identificationForm.tinNo}     onChange={v=>setIdentificationForm(p=>({...p,tinNo:formatTin(v)}))} />
                                                <Field label="GSIS No."     value={identificationForm.gsisNo}    onChange={v=>setIdentificationForm(p=>({...p,gsisNo:formatGsis(v)}))} />
                                                <Field label="CRN/UMID No." value={identificationForm.crnUmidNo} onChange={v=>setIdentificationForm(p=>({...p,crnUmidNo:formatCRN(v)}))} />
                                            </div>
                                        )}

                                        {editTab === "afpInfo" && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <Field label="AFP Serial No"      value={afpForm.afpsn}             onChange={v=>setAfpForm(p=>({...p,afpsn:v}))} />
                                                <Field label="Rank"               value={afpForm.rank}              onChange={v=>setAfpForm(p=>({...p,rank:v}))} />
                                                <Field label="Designation"        value={afpForm.designation}       onChange={v=>setAfpForm(p=>({...p,designation:v}))} />
                                                <Field label="AFP ID"             value={afpForm.afpId}             onChange={v=>setAfpForm(p=>({...p,afpId:v}))} />
                                                <Field label="Present Assignment" value={afpForm.presentAssignment} onChange={v=>setAfpForm(p=>({...p,presentAssignment:v}))} />
                                                <Field label="Years in Service"   value={afpForm.yearsInService}    onChange={v=>setAfpForm(p=>({...p,yearsInService:v}))} />
                                                <Field label="Enlistment Date" type="date" value={afpForm.cadEnlistment}  onChange={v=>setAfpForm(p=>({...p,cadEnlistment:v}))} />
                                                <Field label="Retirement Date" type="date" value={afpForm.retirementDate} onChange={v=>setAfpForm(p=>({...p,retirementDate:v}))} />
                                                <Field label="Pension Date"    type="date" value={afpForm.pensionDate}    onChange={v=>setAfpForm(p=>({...p,pensionDate:v}))} />
                                            </div>
                                        )}

                                        {editTab === "spouseInfo" && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <Field label="Spouse Name"      value={spouseForm.spouseName}   onChange={v=>setSpouseForm(p=>({...p,spouseName:v}))} />
                                                <Field label="Date of Birth" type="date" value={spouseForm.spouseDob}    onChange={v=>setSpouseForm(p=>({...p,spouseDob:v}))} />
                                                <Field label="Date of Marriage" type="date" value={spouseForm.dateMarriage} onChange={v=>setSpouseForm(p=>({...p,dateMarriage:v}))} />
                                            </div>
                                        )}

                                        {editTab === "parentsInfo" && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <Field label="Father Name" value={parentsForm.fatherName} onChange={v=>setParentsForm(p=>({...p,fatherName:v}))} />
                                                <Field label="Father Age"  value={parentsForm.fatherAge}  onChange={v=>setParentsForm(p=>({...p,fatherAge:v}))} />
                                                <Field label="Mother Name" value={parentsForm.motherName} onChange={v=>setParentsForm(p=>({...p,motherName:v}))} />
                                                <Field label="Mother Age"  value={parentsForm.motherAge}  onChange={v=>setParentsForm(p=>({...p,motherAge:v}))} />
                                            </div>
                                        )}

                                        {editTab === "emergencyInfo" && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <Field label="Contact Person Name" value={emergencyForm.contactPersonName} onChange={v=>setEmergencyForm(p=>({...p,contactPersonName:v}))} />
                                                <SelectFieldV2 label="Relationship" value={emergencyForm.contactPersonRelation} onChange={v=>setEmergencyForm(p=>({...p,contactPersonRelation:v}))} options={["Father","Mother","Spouse","Brother","Sister","Son","Daughter","Relative","Guardian","Friend","Colleague","Neighbor","Others"].map(x=>({value:x,label:x}))} />
                                                <Field label="Phone" value={emergencyForm.contactPersonPhone} onChange={v=>setEmergencyForm(p=>({...p,contactPersonPhone:v}))} />
                                                <div className="sm:col-span-2"><Field label="Address" value={emergencyForm.contactPersonAddress} onChange={v=>setEmergencyForm(p=>({...p,contactPersonAddress:v}))} /></div>
                                            </div>
                                        )}

                                        {editTab === "dependentsInfo" && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">Dependents List</p>
                                                    <button type="button" onClick={() => setDependentsForm(p=>[...p,{id:null,name:"",dob:"",gender:""}])} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition">
                                                        + Add Dependent
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {dependentsForm.map((row, idx) => (
                                                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                                            <Field label="Name" value={row.name} onChange={v=>setDependentsForm(p=>p.map((r,i)=>i===idx?{...r,name:v}:r))} />
                                                            <Field label="DOB" type="date" value={row.dob} onChange={v=>setDependentsForm(p=>p.map((r,i)=>i===idx?{...r,dob:v}:r))} />
                                                            <div className="flex gap-2 items-end">
                                                                <div className="flex-1"><SelectField label="Gender" value={row.gender} onChange={v=>setDependentsForm(p=>p.map((r,i)=>i===idx?{...r,gender:v}:r))} options={["Male","Female"]} /></div>
                                                                <button type="button" onClick={() => setDependentsForm(p=>p.filter((_,i)=>i!==idx))} className="mb-0.5 h-9 w-9 grid place-items-center rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"><X size={15}/></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {dependentsForm.length === 0 && <p className="text-slate-400 dark:text-white/40 text-center py-6 text-sm">No dependents added yet.</p>}
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

                {/* ── AUTH MODAL ───────────────────────────────────────────── */}
                <AnimatePresence>
                    {isAuthModalOpen && (
                        <motion.div
                            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >
                            <div
                                className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md"
                                onClick={() => { setIsAuthModalOpen(false); setAdminPassword(""); }}
                                aria-hidden="true"
                            />
                            <motion.div
                                className="relative w-full max-w-md bg-white dark:bg-[#0d1a14] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden"
                                initial={{ opacity: 0, scale: 0.96, y: -12 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -12 }}
                                transition={{ type: "spring", damping: 30, stiffness: 360, mass: 0.8 }}
                            >
                                {/* Accent header strip */}
                                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />

                                <div className="p-5 sm:p-7">
                                    {/* Icon + title */}
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 grid place-items-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                                            <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400 text-current" />
                                        </div>
                                        <div className="min-w-0 pt-0.5">
                                            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">Admin Authorization</h3>
                                            <p className="text-xs text-slate-500 dark:text-white/50 mt-1 leading-relaxed">
                                                Sending login credentials to{" "}
                                                <span className="font-bold text-slate-700 dark:text-white/80">{basicInfo.firstName} {basicInfo.lastName}</span>{" "}
                                                will overwrite their existing password.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { setIsAuthModalOpen(false); setAdminPassword(""); }}
                                            className="h-8 w-8 shrink-0 grid place-items-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
                                        >
                                            <X className="h-4 w-4 text-current" />
                                        </button>
                                    </div>

                                    {/* Warning callout */}
                                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 mb-5">
                                        <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 text-current" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                            Enter your <strong>Super-Admin password</strong> to verify your identity before proceeding.
                                        </p>
                                    </div>

                                    {/* Password input */}
                                    <div className="space-y-1.5 mb-5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Admin Password</label>
                                        <input
                                            type="password"
                                            placeholder="Enter your password..."
                                            value={adminPassword}
                                            onChange={e => setAdminPassword(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter" && adminPassword && !isSending) e.currentTarget.closest("div").querySelector("[data-submit]")?.click(); }}
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                                        <button
                                            onClick={() => { setIsAuthModalOpen(false); setAdminPassword(""); }}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 font-semibold text-sm transition-all active:scale-95 text-center"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            data-submit
                                            disabled={!adminPassword || isSending}
                                            onClick={() => {
                                                setIsSending(true);
                                                router.post(`/admin/members/${memberId}/send-credentials`, { password: adminPassword }, {
                                                    preserveScroll: true,
                                                    onSuccess: (page) => {
                                                        setIsSending(false); setIsAuthModalOpen(false); setAdminPassword("");
                                                        if (page.props.flash?.success) toast.success(page.props.flash.success);
                                                        if (page.props.flash?.error)   toast.error(page.props.flash.error);
                                                    },
                                                    onError: () => { setIsSending(false); toast.error("Network error."); }
                                                });
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
                                        >
                                            {isSending
                                                ? <><Loader2 className="h-4 w-4 animate-spin text-current" /> Verifying...</>
                                                : <><CheckCircle2 className="h-4 w-4 text-current" /> Authorize & Send</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </AdminSidebarLayout>
        </>
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

function FinanceStat({ label, value, trend }) {
    return (
        <div className="bg-white dark:bg-[#111a16] rounded-2xl border border-slate-200 dark:border-white/10 p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 leading-tight">{label}</p>
                {trend === "up"   && <TrendingUp   className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />}
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1.5 truncate">{value}</p>
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
                                <th key={i} className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 ${hiddenCols.includes(i) ? "hidden sm:table-cell" : ""} ${i === columns.length - 1 || i >= columns.length - 2 ? "text-right" : ""}`}>
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
            <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20" />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 dark:text-white/40 ml-0.5">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:bg-[#1a2c25] dark:border-white/10 dark:text-white cursor-pointer appearance-none">
                <option value="">Select</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
}

function SelectFieldV2({ label, value, onChange, options, disabled }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 dark:text-white/40 ml-0.5">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition disabled:opacity-40 disabled:cursor-not-allowed dark:bg-[#1a2c25] dark:border-white/10 dark:text-white cursor-pointer appearance-none">
                <option value="">Select {label}</option>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
}
