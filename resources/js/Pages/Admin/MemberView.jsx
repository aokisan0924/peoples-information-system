import React, { useState, useMemo, useEffect, useRef } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { 
    CheckCircle2, ChevronLeft, ChevronRight, CreditCard, 
    FileText, IdCard, Landmark, Loader2, Phone, Save, Shield, 
    User, Users, X, Mail, Banknote, PiggyBank, Hourglass, Camera 
} from "lucide-react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import phAddresses from "@/data/ph-addresses.json";

// --- ADDRESS LOGIC HELPERS ---
const regionsSource = phAddresses.region_list ?? phAddresses;
const getRegionEntries = () => {
    return Object.entries(regionsSource).map(([regionCode, regionData]) => ({
        code: regionCode,
        name: regionData.region_name || regionCode,
        provinceList: regionData.province_list || {}
    }));
};

export default function MemberView() {
    const { props } = usePage();
    const { MemberData } = props;
    
    // --- DATA EXTRACTION ---
    const basicInfo = MemberData?.basicInfoData || {};
    const memberId = basicInfo.encrypted || basicInfo.id;

    const branchService = MemberData?.branchServiceData || {};
    const afpInfo = MemberData?.afpData || {};
    const identificationInfo = MemberData?.identificationData || {};
    const spouseInfo = MemberData?.spouseData || {};
    const parentsInfo = MemberData?.parentsData || {};
    const emergencyContact = MemberData?.emergencyData || {};
    const dependents = Array.isArray(MemberData?.dependentsData) ? MemberData.dependentsData : [];
    const releasedLoans = Array.isArray(MemberData?.releasedLoansData) ? MemberData.releasedLoansData : [];
    
    // Financial Data
    const shareCapital = MemberData?.shareCapitalData || { rows: [], summary: {} };
    const savings = MemberData?.savingsData || { rows: [], summary: {} };
    const timeDeposits = MemberData?.timeDepositData || { deposits: [], summaryAll: {} };

    // --- UI STATE ---
    const [activeSection, setActiveSection] = useState("overview");
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editTab, setEditTab] = useState("basicInfo");
    const [isSaving, setIsSaving] = useState(false);
    const [imgError, setImgError] = useState(false);
    
    // --- NEW: PHOTO UPLOAD STATE ---
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);
    const photoInputRef = useRef(null);
    
    // --- AUTH MODAL STATE (SINGLE CREDENTIAL SENDER) ---
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [adminPassword, setAdminPassword] = useState("");
    const [isSending, setIsSending] = useState(false);

    // --- ADDRESS STATE ---
    const [selectedRegion, setSelectedRegion] = useState(() => basicInfo.region || '');
    const [selectedProvince, setSelectedProvince] = useState(() => basicInfo.province || '');
    const [selectedCity, setSelectedCity] = useState(() => basicInfo.city || '');
    const [selectedBarangay, setSelectedBarangay ] = useState(() => basicInfo.barangay || '');

    // --- ADDRESS MEMOS ---
    const regionEntries = useMemo(() => getRegionEntries(), []);
    const regionOptions = useMemo(() => [...regionEntries].sort((a, b) => a.name.localeCompare(b.name)), [regionEntries]);

    const provinceOptions = useMemo(() => {
        if (!selectedRegion) return [];
        const regionEntry = regionEntries.find(r => r.code === selectedRegion || r.name === selectedRegion);
        return regionEntry ? Object.keys(regionEntry.provinceList).sort() : [];
    }, [selectedRegion, regionEntries]);

    const cityOptions = useMemo(() => {
        if (!selectedRegion || !selectedProvince) return [];
        const regionEntry = regionEntries.find(r => r.code === selectedRegion || r.name === selectedRegion);
        if (!regionEntry) return [];
        const province = regionEntry.provinceList[selectedProvince];
        return (province && province.municipality_list) ? Object.keys(province.municipality_list).sort() : [];
    }, [selectedRegion, selectedProvince, regionEntries]);

    const barangayOptions = useMemo(() => {
        if (!selectedRegion || !selectedProvince || !selectedCity) return [];
        const regionEntry = regionEntries.find(r => r.code === selectedRegion || r.name === selectedRegion);
        if (!regionEntry) return [];
        const province = regionEntry.provinceList[selectedProvince];
        if (!province || !province.municipality_list) return [];
        const cityObj = province.municipality_list[selectedCity];
        return (cityObj && cityObj.barangay_list) ? cityObj.barangay_list : [];
    }, [selectedRegion, selectedProvince, selectedCity, regionEntries]);

    // --- BRANCH OPTIONS ---
    const branchOptions = {
        "ACTIVE MILITARY": ["ARMY", "AIR FORCE", "NAVY", "RESERVIST"],
        "RETIRED MILITARY": ["ARMY", "AIR FORCE", "NAVY", "RESERVIST"],
        "BENEFICIARY": ["WIDOW", "DEPENDENT", "PARENTS"],
        "RESERVIST": [],
        "CIVILIAN EMPLOYEES": ["AFFC", "PNFC", "FCPA"],
        "PMPC": ["BOARD OF DIRECTORS", "MANAGEMENT", "STAFF", "PROBATIONARY"],
        "CDEA": [],
        "BRGY": ["CAMP AGUINALDO", "FORT MAGSAYSAY", "UPI"],
    };
    const [availableSubBranches, setAvailableSubBranches] = useState([]);

    // --- FORMS STATE ---
    const [basicInfoForm, setBasicInfoForm] = useState({
        firstName: basicInfo.firstName || "",
        middleName: basicInfo.middleName || "",
        lastName: basicInfo.lastName || "",
        suffix: basicInfo.suffix || "",
        nickname: basicInfo.nickname || "",
        gender: basicInfo.gender || "",
        dob: basicInfo.dob || "",
        civilStatus: basicInfo.civilStatus || "",
        religion: basicInfo.religion || "",
        nationality: basicInfo.nationality || "",
        email: basicInfo.email || "",
        accountStatus: basicInfo.accountStatus || "",
        contact: basicInfo.contact || "",
        fullAddress: basicInfo.fullAddress || "",
        membershipDate: basicInfo.membershipDate || "",
    });

    const [branchForm, setBranchForm] = useState({
        branchService: branchService?.branchService || "",
        subBranch: branchService?.subBranch || "",
    });

    const [afpForm, setAfpForm] = useState({
        afpsn: afpInfo?.afpsn || "",
        rank: afpInfo?.rank || "",
        designation: afpInfo?.designation || "",
        afpId: afpInfo?.afpId || "",
        presentAssignment: afpInfo?.presentAssignment || "",
        yearsInService: afpInfo?.yearsInService || "",
        cadEnlistment: afpInfo?.cadEnlistment || "",
        retirementDate: afpInfo?.retirementDate || "",
        pensionDate: afpInfo?.pensionDate || "",
    });

    const [identificationForm, setIdentificationForm] = useState({
        tinNo: identificationInfo?.tinNo || "",
        gsisNo: identificationInfo?.gsisNo || "",
        crnUmidNo: identificationInfo?.crnUmidNo || "",
    });

    const [spouseForm, setSpouseForm] = useState({
        spouseName: spouseInfo?.spouseName || "",
        spouseDob: spouseInfo?.spouseDob || "",
        dateMarriage: spouseInfo?.dateMarriage || "",
    });

    const [parentsForm, setParentsForm] = useState({
        fatherName: parentsInfo?.fatherName || "",
        fatherAge: parentsInfo?.fatherAge || "",
        motherName: parentsInfo?.motherName || "",
        motherAge: parentsInfo?.motherAge || "",
    });

    const [emergencyForm, setEmergencyForm] = useState({
        contactPersonName: emergencyContact?.contactPersonName || "",
        contactPersonAddress: emergencyContact?.contactPersonAddress || "",
        contactPersonPhone: emergencyContact?.contactPersonPhone || "",
        contactPersonRelation: emergencyContact?.contactPersonRelation || "",
    });

    const [dependentsForm, setDependentsForm] = useState(() => {
        return dependents.map((d) => ({
            id: d.id ?? null,
            name: d.name ?? "",
            dob: d.dob ?? "",
            gender: d.gender ?? "",
        }));
    });

    // --- EFFECTS ---
    useEffect(() => {
        const subs = branchOptions[branchForm.branchService] || [];
        setAvailableSubBranches(subs);
        if (!subs.includes(branchForm.subBranch)) {
            setBranchForm(prev => ({ ...prev, subBranch: "" }));
        }
    }, [branchForm.branchService]);

    // --- DERIVED VIEW DATA ---
    const fullName = useMemo(() => {
        return `${basicInfo.firstName ?? ""} ${basicInfo.middleName ?? ""} ${basicInfo.lastName ?? ""} ${basicInfo.suffix ?? ""}`.replace(/\s+/g, " ");
    }, [basicInfo]);

    // --- FORMATTERS ---
    const formatTin = (val) => val.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1-$2").replace(/(\d{3})(\d)/, "$1-$2").replace(/(\d{3})(\d{1,3})/, "$1-$2").substring(0, 15);
    const formatGsis = (val) => val.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1-$2").replace(/(\d{7})(\d)/, "$1-$2").substring(0, 12);
    const formatCRN = (val) => val.replace(/\D/g, "").replace(/(\d{4})(\d)/, "$1-$2").replace(/(\d{7})(\d)/, "$1-$2").substring(0, 15);
    const formatMoney = (val) => {
        const num = Number((val ?? "0").toString().replace(/,/g, ""));
        return isNaN(num) ? "0.00" : new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(num);
    };
    const safeText = (v, f = "—") => (v && v.toString().trim().length ? v : f);

    // --- API SAVERS (ADMIN ROUTES) ---
    const handleSaveCurrentTab = async () => {
        setIsSaving(true);
        try {
            let url = "";
            let payload = {};
            const getRoute = (name) => route(name, { id: memberId });

            if (editTab === "basicInfo") {
                url = getRoute('admin.members.update-basic-info');
                payload = {
                    ...basicInfoForm,
                    region: selectedRegion,
                    province: selectedProvince,
                    city: selectedCity,
                    barangay: selectedBarangay
                };
            } else if (editTab === "branchService") {
                url = getRoute("admin.members.update-branch-service");
                payload = branchForm;
            } else if (editTab === "identification") {
                url = getRoute("admin.members.update-identification-info");
                payload = identificationForm;
            } else if (editTab === "afpInfo") {
                url = getRoute("admin.members.update-afp-info");
                payload = afpForm;
            } else if (editTab === "spouseInfo") {
                url = getRoute("admin.members.update-spouse-info");
                payload = spouseForm;
            } else if (editTab === "parentsInfo") {
                url = getRoute("admin.members.update-parents-info");
                payload = parentsForm;
            } else if (editTab === "emergencyInfo") {
                url = getRoute("admin.members.update-emergency-info");
                payload = emergencyForm;
            } else if (editTab === "dependentsInfo") {
                url = getRoute("admin.members.update-dependents-info");
                payload = { dependents: dependentsForm };
            }

            const { data } = await axios.post(url, payload);

            if (data?.success) {
                toast.success(data?.message || "Updated successfully");
                window.location.reload();
            } else {
                toast.error(data?.message || "Failed to update");
            }
        } catch (error) {
            console.error(error);
            const resp = error?.response?.data;
            const msg = resp?.message || (resp?.errors && Object.values(resp.errors)[0]?.[0]) || "Failed to save.";
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    // --- NEW: HANDLE PHOTO UPLOAD ---
    const handlePhotoChange = async (e) => {
        setImgError(false);
        const file = e.target.files?.[0];
        if (!file) return;

        setIsPhotoUploading(true);
        const formData = new FormData();
        formData.append("profile_image", file);

        try {
            const { data } = await axios.post(route("admin.members.update-photo", { id: memberId }), formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (data?.success) {
                toast.success(data?.message || "Photo updated successfully");
                window.location.reload();
            } else {
                toast.error(data?.message || "Failed to update photo");
            }
        } catch (error) {
            console.error(error);
            const msg = error?.response?.data?.message || "Failed to upload photo.";
            toast.error(msg);
        } finally {
            setIsPhotoUploading(false);
            if (photoInputRef.current) photoInputRef.current.value = "";
        }
    };

    // --- PAGINATION HOOK ---
    const useClientPagination = (rows, pageSize = 6) => {
        const [page, setPage] = useState(1);
        const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
        const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);
        return { page, totalPages, pageRows, goPrev: () => setPage(p => Math.max(1, p - 1)), goNext: () => setPage(p => Math.min(totalPages, p + 1)) };
    };

    const dependentsPager = useClientPagination(dependents, 6);
    const loansPager = useClientPagination(releasedLoans, 6);
    const shareCapitalPager = useClientPagination(shareCapital.rows || [], 10);
    const savingsPager = useClientPagination(savings.rows || [], 10);

    // --- MAIN RENDER ---
    return (
        <>
            <Head title={`Member - ${basicInfo.firstName}`}>
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="space-y-6">
                    <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
                    
                    {/* HEADER CARD */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-sm transition-colors relative">
                        <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        
                        <div className="p-5 sm:p-7 relative z-10">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                                    
                                    {/* UPDATED: AVATAR WITH PHOTO UPLOAD BUTTON */}
                                    <div className="relative shrink-0">
                                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/10 shrink-0">
                                            {basicInfo.profileImage && !imgError ? (
                                                <img 
                                                    src={basicInfo.profileImage.startsWith('http') || basicInfo.profileImage.startsWith('/') ? basicInfo.profileImage : `/storage/${basicInfo.profileImage}`} 
                                                    alt={fullName} 
                                                    className="h-full w-full object-cover"
                                                    onError={() => setImgError(true)} 
                                                />
                                            ) : (
                                                <div className="h-full w-full grid place-items-center bg-emerald-100 text-emerald-600 font-bold text-2xl dark:bg-emerald-500/20 dark:text-emerald-400 uppercase">
                                                    {basicInfo.firstName?.[0]}{basicInfo.lastName?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        {/* CAMERA UPLOAD OVERLAY */}
                                        <button
                                            type="button"
                                            onClick={() => photoInputRef.current?.click()}
                                            className="absolute -bottom-2 -right-2 h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white grid place-items-center shadow-lg transition-transform hover:scale-105"
                                            disabled={isPhotoUploading}
                                            title="Update Member Photo"
                                        >
                                            {isPhotoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                        </button>
                                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">{fullName}</h1>
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-medium ${basicInfo.accountStatus !== 'inactive' ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                                                <CheckCircle2 className="h-3 w-3" />
                                                {basicInfo.accountStatus || "Active"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-slate-500 dark:text-white/70">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Phone className="h-4 w-4 text-slate-400 dark:text-white/50 shrink-0" />
                                                <span className="truncate">{safeText(basicInfo.contact)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="h-4 w-4 text-slate-400 dark:text-white/50 shrink-0" />
                                                <span className="truncate">{safeText(basicInfo.email)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto relative z-20">
                                    {/* SEND CREDENTIALS BUTTON */}
                                    <button 
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl text-sm font-bold hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100 dark:border-indigo-500/20"
                                    >
                                        <Mail size={16} /> Send Login
                                    </button>

                                    {/* EDIT PROFILE BUTTON */}
                                    <button
                                        onClick={() => { setEditTab("basicInfo"); setIsEditOpen(true); }}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-5 py-3 text-slate-700 font-semibold hover:bg-slate-50 dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/15 transition shadow-sm"
                                    >
                                        <Shield className="h-5 w-5" /> Edit Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="border-t border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 px-5 sm:px-7 py-4 relative z-10">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <MiniStat label="Share Capital" value={shareCapital.summary?.totalBalance} icon={Banknote} />
                                <MiniStat label="Savings" value={savings.summary?.totalBalance} icon={PiggyBank} />
                                <MiniStat label="AFP Serial" value={safeText(afpInfo.afpsn)} icon={IdCard} />
                                <MiniStat label="Branch" value={safeText(branchService.branchService)} icon={CreditCard} />
                            </div>
                        </div>
                    </div>

                    {/* CONTENT GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-3 hidden lg:block">
                            <div className="sticky top-20 space-y-2">
                                <SectionButton id="overview" icon={User} label="Overview" activeId={activeSection} onClick={setActiveSection} />
                                <SectionButton id="personal" icon={IdCard} label="Personal & IDs" activeId={activeSection} onClick={setActiveSection} />
                                <SectionButton id="service" icon={Shield} label="AFP / Branch Service" activeId={activeSection} onClick={setActiveSection} />
                                <SectionButton id="financials" icon={Banknote} label="Financial Ledgers" activeId={activeSection} onClick={setActiveSection} />
                                <SectionButton id="loans" icon={Landmark} label="Released Loans" activeId={activeSection} onClick={setActiveSection} />
                                <SectionButton id="contacts" icon={Phone} label="Family & Emergency" activeId={activeSection} onClick={setActiveSection} />
                                <SectionButton id="dependents" icon={Users} label="Dependents" activeId={activeSection} onClick={setActiveSection} />
                            </div>
                        </div>

                        <div className="lg:hidden col-span-1">
                            <select 
                                className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-slate-900 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-white/5 dark:border-white/10 dark:text-white"
                                value={activeSection}
                                onChange={(e) => setActiveSection(e.target.value)}
                            >
                                <option value="overview">Overview</option>
                                <option value="personal">Personal & IDs</option>
                                <option value="service">AFP / Branch Service</option>
                                <option value="financials">Financial Ledgers</option>
                                <option value="loans">Released Loans</option>
                                <option value="contacts">Family & Emergency</option>
                                <option value="dependents">Dependents</option>
                            </select>
                        </div>

                        <div className="lg:col-span-9 space-y-6">
                            {activeSection === "overview" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card title="Basic Information" icon={User} onEdit={() => { setEditTab("basicInfo"); setIsEditOpen(true); }}>
                                        <InfoRow label="Full Name" value={fullName} />
                                        <InfoRow label="Membership Date" value={basicInfo.membershipDate || "—"} />
                                        <InfoRow label="Birth Date" value={basicInfo.dob} />
                                        <InfoRow label="Civil Status" value={basicInfo.civilStatus} />
                                    </Card>
                                    <Card title="Identification" icon={IdCard} onEdit={() => { setEditTab("identification"); setIsEditOpen(true); }}>
                                        <InfoRow label="TIN" value={identificationInfo.tinNo} />
                                        <InfoRow label="GSIS" value={identificationInfo.gsisNo} />
                                        <InfoRow label="CRN/UMID" value={identificationInfo.crnUmidNo} />
                                    </Card>
                                    <Card title="Branch Service" icon={Shield} onEdit={() => { setEditTab("branchService"); setIsEditOpen(true); }}>
                                        <InfoRow label="Service" value={branchService.branchService} />
                                        <InfoRow label="Sub-Branch" value={branchService.subBranch} />
                                    </Card>
                                </div>
                            )}
                            {activeSection === "personal" && (
                                <div className="space-y-6">
                                    <Card title="Basic Information" icon={User} onEdit={() => { setEditTab("basicInfo"); setIsEditOpen(true); }}>
                                        <InfoRow label="Membership Date" value={basicInfo.membershipDate || "—"} />
                                        <InfoRow label="Nickname" value={basicInfo.nickname} />
                                        <InfoRow label="Gender" value={basicInfo.gender} />
                                        <InfoRow label="Nationality" value={basicInfo.nationality} />
                                        <InfoRow label="Religion" value={basicInfo.religion} />
                                        <InfoRow label="Email" value={basicInfo.email} />
                                        <InfoRow label="Mobile" value={basicInfo.contact} />
                                        <InfoRow label="Detailed Address" value={`${basicInfo.fullAddress || ""} ${basicInfo.barangay || ""} ${basicInfo.city || ""} ${basicInfo.province || ""}`} />
                                    </Card>
                                    <Card title="Identification" icon={IdCard} onEdit={() => { setEditTab("identification"); setIsEditOpen(true); }}>
                                        <InfoRow label="TIN No." value={identificationInfo.tinNo} />
                                        <InfoRow label="GSIS No." value={identificationInfo.gsisNo} />
                                        <InfoRow label="CRN/UMID" value={identificationInfo.crnUmidNo} />
                                    </Card>
                                </div>
                            )}
                            {activeSection === "service" && (
                                <div className="space-y-6">
                                    <Card title="Branch Service" icon={Shield} onEdit={() => { setEditTab("branchService"); setIsEditOpen(true); }}>
                                        <InfoRow label="Branch" value={branchService.branchService} />
                                        <InfoRow label="Sub-Branch" value={branchService.subBranch} />
                                    </Card>
                                    <Card title="AFP Info" icon={Landmark} onEdit={() => { setEditTab("afpInfo"); setIsEditOpen(true); }}>
                                        <InfoRow label="Serial No" value={afpInfo.afpsn} />
                                        <InfoRow label="Rank" value={afpInfo.rank} />
                                        <InfoRow label="Designation" value={afpInfo.designation} />
                                        <InfoRow label="AFP ID" value={afpInfo.afpId} />
                                        <InfoRow label="Unit Asgmt" value={afpInfo.presentAssignment} />
                                        <InfoRow label="Retirement" value={afpInfo.retirementDate} />
                                    </Card>
                                </div>
                            )}
                            
                            {/* --- FINANCIAL LEDGERS --- */}
                            {activeSection === "financials" && (
                                <div className="space-y-8">
                                    {/* Share Capital */}
                                    <div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                            <MiniStat label="SC Balance" value={`₱ ${shareCapital.summary?.totalBalance || '0.00'}`} icon={Banknote} />
                                            <MiniStat label="Paid Shares" value={shareCapital.summary?.paidCapital || '0'} icon={CheckCircle2} />
                                            <MiniStat label="Total Deposits" value={`₱ ${shareCapital.summary?.totalDeposits || '0.00'}`} icon={Save} />
                                            <MiniStat label="Total Withdrawals" value={`₱ ${shareCapital.summary?.totalWithdrawals || '0.00'}`} icon={CreditCard} />
                                        </div>
                                        <TableShell title="Share Capital Ledger" icon={Banknote}
                                            footer={<TablePager page={shareCapitalPager.page} totalPages={shareCapitalPager.totalPages} onPrev={shareCapitalPager.goPrev} onNext={shareCapitalPager.goNext} />}
                                        >
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Credit</th><th className="px-4 py-3 text-right">Debit</th><th className="px-4 py-3 text-right">Balance</th></tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                                        {shareCapitalPager.pageRows.map((r, i) => (
                                                            <tr key={i} className="text-slate-700 dark:text-white/90">
                                                                <td className="px-4 py-2 font-mono text-xs">{r.transactionDate}</td>
                                                                <td className="px-4 py-2 text-right text-emerald-600">{r.credit ? `₱ ${r.credit}` : '-'}</td>
                                                                <td className="px-4 py-2 text-right text-rose-600">{r.debit ? `₱ ${r.debit}` : '-'}</td>
                                                                <td className="px-4 py-2 text-right font-bold">₱ {r.balance}</td>
                                                            </tr>
                                                        ))}
                                                        {!shareCapitalPager.pageRows.length && <tr><td colSpan={4} className="p-4 text-center text-slate-400">No records found.</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </TableShell>
                                    </div>

                                    {/* Savings */}
                                    <div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                            <MiniStat label="SD Balance" value={`₱ ${savings.summary?.totalBalance || '0.00'}`} icon={PiggyBank} />
                                            <MiniStat label="Total Deposits" value={`₱ ${savings.summary?.totalDeposits || '0.00'}`} icon={Save} />
                                            <MiniStat label="Total Withdrawals" value={`₱ ${savings.summary?.totalWithdrawals || '0.00'}`} icon={CreditCard} />
                                        </div>
                                        <TableShell title="Savings Deposit Ledger" icon={PiggyBank}
                                            footer={<TablePager page={savingsPager.page} totalPages={savingsPager.totalPages} onPrev={savingsPager.goPrev} onNext={savingsPager.goNext} />}
                                        >
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500">
                                                            <th className="px-4 py-3">Date</th>
                                                            <th className="px-4 py-3">Ref No.</th>
                                                            <th className="px-4 py-3 text-right">Credit</th>
                                                            <th className="px-4 py-3 text-right">Debit</th>
                                                            <th className="px-4 py-3 text-right">Balance</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                                        {savingsPager.pageRows.map((r, i) => (
                                                            <tr key={i} className="text-slate-700 dark:text-white/90">
                                                                <td className="px-4 py-2 font-mono text-xs">{r.transactionDate}</td>
                                                                <td className="px-4 py-2 font-mono text-xs text-slate-500">{r.referenceNumber || '—'}</td>
                                                                <td className="px-4 py-2 text-right text-emerald-600 font-medium">
                                                                    {r.credit ? `+${r.credit}` : '-'}
                                                                </td>
                                                                <td className="px-4 py-2 text-right text-rose-600 font-medium">
                                                                    {r.debit ? `-${r.debit}` : '-'}
                                                                </td>
                                                                <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">₱ {r.balance}</td>
                                                            </tr>
                                                        ))}
                                                        {!savingsPager.pageRows.length && <tr><td colSpan={5} className="p-4 text-center text-slate-400">No records found.</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </TableShell>
                                    </div>

                                    {/* Time Deposit */}
                                    <div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                            <MiniStat label="Total Principal" value={`₱ ${timeDeposits.summaryAll?.totalPrincipal || '0.00'}`} icon={Hourglass} />
                                            <MiniStat label="Current Value" value={`₱ ${timeDeposits.summaryAll?.totalCurrentBalance || '0.00'}`} icon={Banknote} />
                                            <MiniStat label="Active Accounts" value={timeDeposits.summaryAll?.totalCount || '0'} icon={FileText} />
                                        </div>
                                        <div className="space-y-3">
                                            {timeDeposits.deposits?.map((td, i) => (
                                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors gap-4 dark:bg-white/5 dark:border-white/10">
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">{td.summary.timeDepositCode}</div>
                                                        <div className="text-xs text-slate-500 dark:text-white/60 mt-1">{td.summary.startDate} — {td.summary.maturityDate}</div>
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                        <div className="font-mono font-bold text-emerald-600 text-lg">₱ {td.summary.principal}</div>
                                                        <div className="text-xs text-slate-400">Principal Amount</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {!timeDeposits.deposits?.length && <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl dark:bg-white/5 dark:text-white/50">No Time Deposits found.</div>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === "contacts" && (
                                <div className="space-y-6">
                                    <Card title="Spouse Info" icon={Users} onEdit={() => { setEditTab("spouseInfo"); setIsEditOpen(true); }}>
                                        <InfoRow label="Name" value={spouseInfo.spouseName} />
                                        <InfoRow label="DOB" value={spouseInfo.spouseDob} />
                                        <InfoRow label="Marriage Date" value={spouseInfo.dateMarriage} />
                                    </Card>
                                    <Card title="Parents Info" icon={Users} onEdit={() => { setEditTab("parentsInfo"); setIsEditOpen(true); }}>
                                        <InfoRow label="Father" value={`${parentsInfo.fatherName || "—"} (${parentsInfo.fatherAge || "?"})`} />
                                        <InfoRow label="Mother" value={`${parentsInfo.motherName || "—"} (${parentsInfo.motherAge || "?"})`} />
                                    </Card>
                                    <Card title="Emergency Contact" icon={Phone} onEdit={() => { setEditTab("emergencyInfo"); setIsEditOpen(true); }}>
                                        <InfoRow label="Name" value={emergencyContact.contactPersonName} />
                                        <InfoRow label="Relation" value={emergencyContact.contactPersonRelation} />
                                        <InfoRow label="Phone" value={emergencyContact.contactPersonPhone} />
                                        <InfoRow label="Address" value={emergencyContact.contactPersonAddress} />
                                    </Card>
                                </div>
                            )}
                            {activeSection === "dependents" && (
                                <TableShell title="Dependents" icon={Users}
                                    footer={<TablePager page={dependentsPager.page} totalPages={dependentsPager.totalPages} onPrev={dependentsPager.goPrev} onNext={dependentsPager.goNext} />}
                                >
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-left">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"><th className="px-4 py-3">Name</th><th className="px-4 py-3">DOB</th><th className="px-4 py-3">Gender</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                                {dependentsPager.pageRows.length ? dependentsPager.pageRows.map((d, i) => (
                                                    <tr key={i} className="text-sm text-slate-700 dark:text-white/85">
                                                        <td className="px-4 py-3">{d.name}</td>
                                                        <td className="px-4 py-3">{d.dob}</td>
                                                        <td className="px-4 py-3">{d.gender}</td>
                                                    </tr>
                                                )) : <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-500 dark:text-white/60">No dependents found.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </TableShell>
                            )}
                            {activeSection === "loans" && (
                                <TableShell title="Released Loans" icon={Landmark}
                                    footer={<TablePager page={loansPager.page} totalPages={loansPager.totalPages} onPrev={loansPager.goPrev} onNext={loansPager.goNext} />}
                                >
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-left">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                                {loansPager.pageRows.length ? loansPager.pageRows.map((l, i) => (
                                                    <tr key={i} className="text-sm text-slate-700 dark:text-white/85">
                                                        <td className="px-4 py-3 font-mono text-xs">{safeText(l.loanReference)}</td>
                                                        <td className="px-4 py-3">{safeText(l.loanType)}</td>
                                                        <td className="px-4 py-3 font-medium">{formatMoney(l.loanAmount)}</td>
                                                        <td className="px-4 py-3"><span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-100">{safeText(l.status)}</span></td>
                                                    </tr>
                                                )) : <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500 dark:text-white/60">No released loans found.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </TableShell>
                            )}
                        </div>
                    </div>

                    {/* EDIT MODAL */}
                    <AnimatePresence>
                        {isEditOpen && (
                            <ModalShell title="Update Member Profile" subtitle="Edit details by section." onClose={() => setIsEditOpen(false)}>
                                <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
                                    {/* TABS */}
                                    <div className="shrink-0 lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto scrollbar-hide border-b lg:border-b-0 border-slate-200 dark:border-white/10 pb-3 lg:pb-0 px-1">
                                        <ModalTab id="basicInfo" label="Basic Info" icon={User} active={editTab} onClick={setEditTab} />
                                        <ModalTab id="branchService" label="Branch Service" icon={Shield} active={editTab} onClick={setEditTab} />
                                        <ModalTab id="identification" label="Identification" icon={IdCard} active={editTab} onClick={setEditTab} />
                                        <ModalTab id="afpInfo" label="AFP Info" icon={Landmark} active={editTab} onClick={setEditTab} />
                                        <ModalTab id="spouseInfo" label="Spouse Info" icon={Users} active={editTab} onClick={setEditTab} />
                                        <ModalTab id="parentsInfo" label="Parents Info" icon={Users} active={editTab} onClick={setEditTab} />
                                        <ModalTab id="emergencyInfo" label="Emergency Contact" icon={Phone} active={editTab} onClick={setEditTab} />
                                        <ModalTab id="dependentsInfo" label="Dependents" icon={Users} active={editTab} onClick={setEditTab} />
                                    </div>

                                    {/* FORM CONTENT */}
                                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                        <div className="flex-1 overflow-y-auto min-h-0 rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 p-4 sm:p-5">
                                            {/* FORM FIELDS LOGIC */}
                                            {editTab === "basicInfo" && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <Field label="First Name" value={basicInfoForm.firstName} onChange={(v) => setBasicInfoForm(p=>({...p, firstName:v}))} />
                                                        <Field label="Middle Name" value={basicInfoForm.middleName} onChange={(v) => setBasicInfoForm(p=>({...p, middleName:v}))} />
                                                        <Field label="Last Name" value={basicInfoForm.lastName} onChange={(v) => setBasicInfoForm(p=>({...p, lastName:v}))} />
                                                        <Field label="Suffix" value={basicInfoForm.suffix} onChange={(v) => setBasicInfoForm(p=>({...p, suffix:v}))} />
                                                        <Field label="Nickname" value={basicInfoForm.nickname} onChange={(v) => setBasicInfoForm(p=>({...p, nickname:v}))} />
                                                        <SelectField label="Gender" value={basicInfoForm.gender} onChange={(v) => setBasicInfoForm(p=>({...p, gender:v}))} options={["Male", "Female"]} />
                                                        <Field label="Birth Date" type="date" value={basicInfoForm.dob} onChange={(v) => setBasicInfoForm(p=>({...p, dob:v}))} />
                                                        <SelectField label="Civil Status" value={basicInfoForm.civilStatus} onChange={(v) => setBasicInfoForm(p=>({...p, civilStatus:v}))} options={["Single", "Married", "Widowed", "Separated", "Divorced"]} />
                                                        
                                                        {/* NEW: MEMBERSHIP DATE FIELD */}
                                                        <Field label="Membership Date" type="date" value={basicInfoForm.membershipDate} onChange={(v) => setBasicInfoForm(p=>({...p, membershipDate:v}))} />
                                                        
                                                        <Field label="Religion" value={basicInfoForm.religion} onChange={(v) => setBasicInfoForm(p=>({...p, religion:v}))} />
                                                        <Field label="Nationality" value={basicInfoForm.nationality} onChange={(v) => setBasicInfoForm(p=>({...p, nationality:v}))} />
                                                        <Field label="Email" type="email" value={basicInfoForm.email} onChange={(v) => setBasicInfoForm(p=>({...p, email:v}))} />
                                                        <Field label="Contact No." value={basicInfoForm.contact} onChange={(v) => setBasicInfoForm(p=>({...p, contact:v}))} />
                                                    </div>
                                                    <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                                        <div className="text-slate-900 dark:text-white font-semibold mb-3">Address Information</div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <SelectFieldV2 label="Region" value={selectedRegion} onChange={(v) => { setSelectedRegion(v); setSelectedProvince(""); setSelectedCity(""); setSelectedBarangay(""); }} 
                                                                options={regionOptions.map(r => ({ value: r.code, label: r.name }))} 
                                                            />
                                                            <SelectFieldV2 label="Province" value={selectedProvince} onChange={(v) => { setSelectedProvince(v); setSelectedCity(""); setSelectedBarangay(""); }} 
                                                                options={provinceOptions.map(p => ({ value: p, label: p }))} disabled={!selectedRegion}
                                                            />
                                                            <SelectFieldV2 label="City / Municipality" value={selectedCity} onChange={(v) => { setSelectedCity(v); setSelectedBarangay(""); }} 
                                                                options={cityOptions.map(c => ({ value: c, label: c }))} disabled={!selectedProvince}
                                                            />
                                                            <SelectFieldV2 label="Barangay" value={selectedBarangay} onChange={(v) => setSelectedBarangay(v)} 
                                                                options={barangayOptions.map(b => ({ value: b, label: b }))} disabled={!selectedCity}
                                                            />
                                                            <div className="sm:col-span-2">
                                                                <Field label="Detailed Address (Street/Unit)" value={basicInfoForm.fullAddress} onChange={(v) => setBasicInfoForm(p=>({...p, fullAddress:v}))} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {/* ... (Other tabs logic) ... */}
                                            {editTab === "branchService" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <SelectFieldV2 label="Branch of Service" value={branchForm.branchService} 
                                                        onChange={(v) => setBranchForm(p => ({ ...p, branchService: v }))}
                                                        options={Object.keys(branchOptions).map(k => ({ value: k, label: k }))}
                                                    />
                                                    <SelectFieldV2 label="Sub-Branch" value={branchForm.subBranch} 
                                                        onChange={(v) => setBranchForm(p => ({ ...p, subBranch: v }))}
                                                        options={availableSubBranches.map(k => ({ value: k, label: k }))}
                                                        disabled={!branchForm.branchService}
                                                    />
                                                </div>
                                            )}
                                            {editTab === "identification" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Field label="TIN No." value={identificationForm.tinNo} onChange={(v) => setIdentificationForm(p=>({...p, tinNo: formatTin(v)}))} />
                                                    <Field label="GSIS No." value={identificationForm.gsisNo} onChange={(v) => setIdentificationForm(p=>({...p, gsisNo: formatGsis(v)}))} />
                                                    <Field label="CRN/UMID No." value={identificationForm.crnUmidNo} onChange={(v) => setIdentificationForm(p=>({...p, crnUmidNo: formatCRN(v)}))} />
                                                </div>
                                            )}
                                            {editTab === "afpInfo" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Field label="AFP Serial No" value={afpForm.afpsn} onChange={(v) => setAfpForm(p=>({...p, afpsn:v}))} />
                                                    <Field label="Rank" value={afpForm.rank} onChange={(v) => setAfpForm(p=>({...p, rank:v}))} />
                                                    <Field label="Designation" value={afpForm.designation} onChange={(v) => setAfpForm(p=>({...p, designation:v}))} />
                                                    <Field label="AFP ID" value={afpForm.afpId} onChange={(v) => setAfpForm(p=>({...p, afpId:v}))} />
                                                    <Field label="Present Assignment" value={afpForm.presentAssignment} onChange={(v) => setAfpForm(p=>({...p, presentAssignment:v}))} />
                                                    <Field label="Years in Service" value={afpForm.yearsInService} onChange={(v) => setAfpForm(p=>({...p, yearsInService:v}))} />
                                                    <Field label="Enlistment Date" type="date" value={afpForm.cadEnlistment} onChange={(v) => setAfpForm(p=>({...p, cadEnlistment:v}))} />
                                                    <Field label="Retirement Date" type="date" value={afpForm.retirementDate} onChange={(v) => setAfpForm(p=>({...p, retirementDate:v}))} />
                                                    <Field label="Pension Date" type="date" value={afpForm.pensionDate} onChange={(v) => setAfpForm(p=>({...p, pensionDate:v}))} />
                                                </div>
                                            )}
                                            {editTab === "spouseInfo" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Field label="Spouse Name" value={spouseForm.spouseName} onChange={(v) => setSpouseForm(p=>({...p, spouseName:v}))} />
                                                    <Field label="Date of Birth" type="date" value={spouseForm.spouseDob} onChange={(v) => setSpouseForm(p=>({...p, spouseDob:v}))} />
                                                    <Field label="Date of Marriage" type="date" value={spouseForm.dateMarriage} onChange={(v) => setSpouseForm(p=>({...p, dateMarriage:v}))} />
                                                </div>
                                            )}
                                            {editTab === "parentsInfo" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Field label="Father Name" value={parentsForm.fatherName} onChange={(v) => setParentsForm(p=>({...p, fatherName:v}))} />
                                                    <Field label="Father Age" value={parentsForm.fatherAge} onChange={(v) => setParentsForm(p=>({...p, fatherAge:v}))} />
                                                    <Field label="Mother Name" value={parentsForm.motherName} onChange={(v) => setParentsForm(p=>({...p, motherName:v}))} />
                                                    <Field label="Mother Age" value={parentsForm.motherAge} onChange={(v) => setParentsForm(p=>({...p, motherAge:v}))} />
                                                </div>
                                            )}
                                            {editTab === "emergencyInfo" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Field label="Contact Person Name" value={emergencyForm.contactPersonName} onChange={(v) => setEmergencyForm(p=>({...p, contactPersonName:v}))} />
                                                    <SelectFieldV2 label="Relationship" value={emergencyForm.contactPersonRelation} onChange={(v) => setEmergencyForm(p=>({...p, contactPersonRelation:v}))} 
                                                        options={["Father","Mother","Spouse","Brother","Sister","Son","Daughter","Relative","Guardian","Friend","Colleague","Neighbor","Others"].map(x=>({value:x, label:x}))} 
                                                    />
                                                    <Field label="Phone" value={emergencyForm.contactPersonPhone} onChange={(v) => setEmergencyForm(p=>({...p, contactPersonPhone:v}))} />
                                                    <div className="sm:col-span-2">
                                                        <Field label="Address" value={emergencyForm.contactPersonAddress} onChange={(v) => setEmergencyForm(p=>({...p, contactPersonAddress:v}))} />
                                                    </div>
                                                </div>
                                            )}
                                            {editTab === "dependentsInfo" && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="text-slate-900 dark:text-white font-semibold">Dependents List</div>
                                                        <button type="button" onClick={() => setDependentsForm(p => [...p, { id: null, name: "", dob: "", gender: "" }])} className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15 px-4 py-2 text-slate-700 dark:text-white font-semibold text-xs">Add Dependent</button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {dependentsForm.map((row, idx) => (
                                                            <div key={idx} className="flex flex-col md:flex-row gap-3 p-3 rounded-2xl bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10">
                                                                <Field label="Name" value={row.name} onChange={(v) => setDependentsForm(p => p.map((r, i) => i === idx ? { ...r, name: v } : r))} />
                                                                <Field label="DOB" type="date" value={row.dob} onChange={(v) => setDependentsForm(p => p.map((r, i) => i === idx ? { ...r, dob: v } : r))} />
                                                                <SelectField label="Gender" value={row.gender} onChange={(v) => setDependentsForm(p => p.map((r, i) => i === idx ? { ...r, gender: v } : r))} options={["Male", "Female"]} />
                                                                <div className="flex items-end pb-1">
                                                                    <button type="button" onClick={() => setDependentsForm(p => p.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-xs font-semibold">Remove</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {dependentsForm.length === 0 && <p className="text-slate-500 dark:text-white/50 text-center py-4">No dependents added.</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 flex justify-end gap-3 shrink-0 pt-2 border-t border-slate-200 dark:border-white/10">
                                            <button onClick={() => setIsEditOpen(false)} className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/15 font-semibold">Close</button>
                                            <button onClick={handleSaveCurrentTab} disabled={isSaving} className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-70 flex items-center gap-2 shadow-lg">
                                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </ModalShell>
                        )}
                    </AnimatePresence>

                    {/* SUPER ADMIN AUTHORIZATION MODAL */}
                    <AnimatePresence>
                        {isAuthModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                                                <Shield size={24} />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Admin Authorization</h3>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                            Generating new credentials for <strong>{basicInfo.firstName} {basicInfo.lastName}</strong> will overwrite their existing password. Please enter your Super-Admin password to proceed.
                                        </p>

                                        <input 
                                            type="password"
                                            placeholder="Enter your admin password..."
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition dark:bg-white/5 dark:border-white/10 dark:text-white mb-6"
                                            autoFocus
                                        />

                                        <div className="flex gap-3 justify-end">
                                            <button 
                                                onClick={() => {
                                                    setIsAuthModalOpen(false);
                                                    setAdminPassword("");
                                                }}
                                                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                disabled={!adminPassword || isSending}
                                                onClick={() => {
                                                    setIsSending(true);
                                                    router.post(`/admin/members/${memberId}/send-credentials`, {
                                                        admin_password: adminPassword
                                                    }, {
                                                        preserveScroll: true,
                                                        onSuccess: (page) => {
                                                            setIsSending(false);
                                                            setIsAuthModalOpen(false);
                                                            setAdminPassword("");
                                                            if (page.props.flash?.success) toast.success(page.props.flash.success);
                                                            if (page.props.flash?.error) toast.error(page.props.flash.error);
                                                        },
                                                        onError: () => {
                                                            setIsSending(false);
                                                            toast.error("Network error occurred.");
                                                        }
                                                    });
                                                }}
                                                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition disabled:opacity-50"
                                            >
                                                {isSending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                                Authorize & Send
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </AdminSidebarLayout>
        </>
    );
}

// --- SUB-COMPONENTS ---

function ModalShell({ title, subtitle, onClose, children }) {
    return (
        <motion.div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center px-0 sm:px-4 pb-3 sm:pb-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div 
                className="relative w-full max-w-5xl bg-white dark:bg-[#0f1f1a] shadow-2xl flex flex-col mx-3 sm:mx-0 h-[95dvh] sm:h-auto sm:max-h-[85vh] rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden" 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
                <div className="shrink-0 flex justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10">
                    <div>
                        <div className="text-xl font-semibold text-slate-900 dark:text-white">{title}</div>
                        <div className="text-sm text-slate-500 dark:text-white/60">{subtitle}</div>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 grid place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-4 sm:p-6 pb-10 sm:pb-6 flex-1 overflow-hidden h-full flex flex-col">
                    {children}
                </div>
            </motion.div>
        </motion.div>
    );
}

function ModalTab({ id, label, icon: Icon, active, onClick }) {
    const isActive = active === id;
    return (
        <button onClick={() => onClick(id)} className={`w-auto sm:w-full flex items-center gap-2 lg:gap-3 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-left transition border shrink-0 whitespace-nowrap lg:whitespace-normal ${isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-600/15 dark:border-emerald-400/30 dark:text-emerald-100" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:text-white/90 dark:hover:bg-white/10"}`}>
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-white/60"}`} />
            <span className="font-semibold text-xs sm:text-sm">{label}</span>
        </button>
    );
}

function SectionButton({ id, icon: Icon, label, activeId, onClick }) {
    const active = activeId === id;
    return (
        <button onClick={() => onClick(id)} className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition border ${active ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-600/15 dark:border-emerald-400/30 dark:text-emerald-100" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:text-white/90 dark:hover:bg-white/10"}`}>
            <span className={`grid place-items-center h-10 w-10 rounded-xl ${active ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-slate-100 dark:bg-white/10"}`}>
                <Icon className="h-5 w-5" />
            </span>
            <div className="font-semibold text-sm">{label}</div>
        </button>
    );
}

function MiniStat({ label, value, icon: Icon }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 min-w-0 dark:border-white/10 dark:bg-white/5">
            <span className="grid place-items-center h-10 w-10 rounded-2xl bg-slate-100 text-slate-500 shrink-0 dark:bg-white/10 dark:text-white/75">
                <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
                <div className="text-xs text-slate-500 dark:text-white/50 truncate">{label}</div>
                <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">{value || "—"}</div>
            </div>
        </div>
    );
}

function Card({ title, icon: Icon, children, onEdit }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-white/10 dark:bg-white/5 dark:shadow-[0_10px_40px_-20px_rgba(0,0,0,.7)]">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <span className="grid place-items-center h-10 w-10 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/80">
                        <Icon className="h-5 w-5" />
                    </span>
                    <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
                </div>
                <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-slate-700 font-semibold text-xs dark:bg-white/10 dark:hover:bg-white/15 dark:border-white/10 dark:text-white transition">
                    <FileText className="h-3 w-3" /> Edit
                </button>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between gap-4 py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
            <span className="text-sm text-slate-500 dark:text-white/50">{label}</span>
            <span className="text-sm text-slate-900 font-medium dark:text-white/90 text-right">{value || "—"}</span>
        </div>
    );
}

function TableShell({ title, icon: Icon, children, footer }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/10">
                <span className="grid place-items-center h-10 w-10 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/80">
                    <Icon className="h-5 w-5" />
                </span>
                <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
            </div>
            <div className="p-0">{children}</div>
            {footer && <div className="px-5 py-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">{footer}</div>}
        </div>
    );
}

function TablePager({ page, totalPages, onPrev, onNext }) {
    return (
        <div className="flex items-center justify-center gap-2">
            <button onClick={onPrev} disabled={page <= 1} className="h-8 w-8 grid place-items-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:border-transparent dark:hover:bg-white/10 dark:text-white">
                <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-500 dark:text-white/60">Page {page} of {totalPages}</span>
            <button onClick={onNext} disabled={page >= totalPages} className="h-8 w-8 grid place-items-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:border-transparent dark:hover:bg-white/10 dark:text-white">
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-white/50 ml-1">{label}</label>
            <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:bg-emerald-500/10 dark:placeholder:text-white/20" />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-white/50 ml-1">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:bg-emerald-500/10 [&>option]:text-slate-900 dark:[&>option]:text-white dark:[&>option]:bg-slate-900 cursor-pointer">
                <option value="">Select</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}

function SelectFieldV2({ label, value, onChange, options, disabled }) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-white/50 ml-1">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:bg-emerald-500/10 [&>option]:text-slate-900 dark:[&>option]:text-white dark:[&>option]:bg-slate-900 cursor-pointer">
                <option value="">Select {label}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}