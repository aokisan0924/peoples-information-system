import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, 
    FileText, IdCard, Landmark, Loader2, Phone, Save, Shield, 
    User, Users, X, MapPin, Mail } from "lucide-react";
import SidebarLayout from "@/Layouts/SidebarLayout";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";
import phAddresses from "@/data/ph-addresses.json";

const regionsSource = phAddresses.region_list ?? phAddresses;
const getRegionEntries = () => {
    return Object.entries(regionsSource).map(([regionCode, regionData]) => ({
        code: regionCode,
        name: regionData.region_name || regionCode,
        provinceList: regionData.province_list || {}
    }));
};

export default function ClientProfile() {
    const { props } = usePage();
    const { MemberData } = props;
    
    const basicInfo = MemberData?.basicInfoData || {};
    const branchService = MemberData?.branchServiceData || {};
    const afpInfo = MemberData?.afpData || {};
    const identificationInfo = MemberData?.identificationData || {};
    const spouseInfo = MemberData?.spouseData || {};
    const parentsInfo = MemberData?.parentsData || {};
    const emergencyContact = MemberData?.emergencyData || {};
    const dependents = Array.isArray(MemberData?.dependentsData) ? MemberData.dependentsData : [];
    const releasedLoans = Array.isArray(MemberData?.releasedLoansData) ? MemberData.releasedLoansData : [];

    const [activeSection, setActiveSection] = useState("overview");
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editTab, setEditTab] = useState("basicInfo");
    const [isSaving, setIsSaving] = useState(false);
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);
    const photoInputRef = useRef(null);
    const [imgError, setImgError] = useState(false);

    const [selectedRegion, setSelectedRegion] = useState(() => basicInfo.region || '');
    const [selectedProvince, setSelectedProvince] = useState(() => basicInfo.province || '');
    const [selectedCity, setSelectedCity] = useState(() => basicInfo.city || '');
    const [selectedBarangay, setSelectedBarangay ] = useState(() => basicInfo.barangay || '');

    const regionEntries = useMemo(() => getRegionEntries(), []);
    const regionOptions = useMemo(() => {
        return [...regionEntries].sort((a, b) => a.name.localeCompare(b.name));
    }, [regionEntries]);

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

    const [basicInfoForm, setBasicInfoForm] = useState({
        firstName: basicInfo.firstName || "", middleName: basicInfo.middleName || "",
        lastName: basicInfo.lastName || "", suffix: basicInfo.suffix || "",
        nickname: basicInfo.nickname || "", gender: basicInfo.gender || "",
        dob: basicInfo.dob || "", civilStatus: basicInfo.civilStatus || "",
        religion: basicInfo.religion || "", nationality: basicInfo.nationality || "",
        email: basicInfo.email || "", contact: basicInfo.contact || "", fullAddress: basicInfo.fullAddress || "",
    });

    const [branchForm, setBranchForm] = useState({ branchService: branchService?.branchService || "", subBranch: branchService?.subBranch || "" });
    const [afpForm, setAfpForm] = useState({ afpsn: afpInfo?.afpsn || "", rank: afpInfo?.rank || "", designation: afpInfo?.designation || "", afpId: afpInfo?.afpId || "", presentAssignment: afpInfo?.presentAssignment || "", yearsInService: afpInfo?.yearsInService || "", cadEnlistment: afpInfo?.cadEnlistment || "", retirementDate: afpInfo?.retirementDate || "", pensionDate: afpInfo?.pensionDate || "" });
    const [identificationForm, setIdentificationForm] = useState({ tinNo: identificationInfo?.tinNo || "", gsisNo: identificationInfo?.gsisNo || "", crnUmidNo: identificationInfo?.crnUmidNo || "" });
    const [spouseForm, setSpouseForm] = useState({ spouseName: spouseInfo?.spouseName || "", spouseDob: spouseInfo?.spouseDob || "", dateMarriage: spouseInfo?.dateMarriage || "" });
    const [parentsForm, setParentsForm] = useState({ fatherName: parentsInfo?.fatherName || "", fatherAge: parentsInfo?.fatherAge || "", motherName: parentsInfo?.motherName || "", motherAge: parentsInfo?.motherAge || "" });
    const [emergencyForm, setEmergencyForm] = useState({ contactPersonName: emergencyContact?.contactPersonName || "", contactPersonAddress: emergencyContact?.contactPersonAddress || "", contactPersonPhone: emergencyContact?.contactPersonPhone || "", contactPersonRelation: emergencyContact?.contactPersonRelation || "" });
    const [dependentsForm, setDependentsForm] = useState(() => dependents.map((d) => ({ id: d.id ?? null, name: d.name ?? "", dob: d.dob ?? "", gender: d.gender ?? "" })));

    useEffect(() => {
        const subs = branchOptions[branchForm.branchService] || [];
        setAvailableSubBranches(subs);
        if (!subs.includes(branchForm.subBranch)) setBranchForm(prev => ({ ...prev, subBranch: "" }));
    }, [branchForm.branchService]);

    const fullName = useMemo(() => `${basicInfo.firstName ?? ""} ${basicInfo.middleName ?? ""} ${basicInfo.lastName ?? ""} ${basicInfo.suffix ?? ""}`.replace(/\s+/g, " "), [basicInfo]);
    const photoUrl = useMemo(() => {
        if (!basicInfo.profileImage) return null;
        if (basicInfo.profileImage.startsWith("http")) return basicInfo.profileImage;
        if (basicInfo.profileImageUrl) return basicInfo.profileImageUrl;
        return `/storage/${basicInfo.profileImage}`;
    }, [basicInfo.profileImage, basicInfo.profileImageUrl]);

    const formatTin = (val) => val.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1-$2").replace(/(\d{3})(\d)/, "$1-$2").replace(/(\d{3})(\d{1,3})/, "$1-$2").substring(0, 15);
    const formatGsis = (val) => val.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1-$2").replace(/(\d{7})(\d)/, "$1-$2").substring(0, 12);
    const formatCRN = (val) => val.replace(/\D/g, "").replace(/(\d{4})(\d)/, "$1-$2").replace(/(\d{7})(\d)/, "$1-$2").substring(0, 15);
    const safeText = (v, f = "—") => (v && v.toString().trim().length ? v : f);

    const handleSaveCurrentTab = async () => {
        setIsSaving(true);
        try {
            let url = ""; 
            let payload = {};
            
            if (editTab === "basicInfo") {
                url = route("member.update-basic-info"); 
                payload = { 
                    ...basicInfoForm, 
                    region: selectedRegion, 
                    province: selectedProvince, 
                    city: selectedCity, 
                    barangay: selectedBarangay 
                }; 
            } else if (editTab === "branchService") { 
                url = route("member.update-branch-service"); 
                payload = branchForm; 
            } else if (editTab === "identification") {
                url = route("member.update-identification-info"); 
                payload = identificationForm; 
            } else if (editTab === "afpInfo") {
                url = route("member.update-afp-info"); 
                payload = afpForm; 
            } else if (editTab === "spouseInfo") {
                url = route("member.update-spouse-info");
                payload = spouseForm;
            } else if (editTab === "parentsInfo") {
                url = route("member.update-parents-info");
                payload = parentsForm;
            } else if (editTab === "emergencyInfo") {
                url = route("member.update-emergency-info");
                payload = emergencyForm;
            } else if (editTab === "dependentsInfo") {
                url = route("member.update-dependents-info");
                payload = { dependents: dependentsForm };
            }

            const { data } = await axios.post(url, payload);
            
            if (data?.success) { 
                toast.success(data?.message || "Updated successfully"); 
                setTimeout(() => {
                    window.location.reload(); 
                }, 1000);
            } else { 
                toast.error(data?.message || "Failed to update"); 
            }
        } catch (error) {
            console.error("SAVE ERROR:", error);
            const resp = error?.response?.data;
            toast.error(resp?.message || (resp?.errors && Object.values(resp.errors)[0]?.[0]) || "Failed to save.");
        } finally {
            setIsSaving(false);
        }
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
            if (data?.success) { toast.success(data?.message || "Photo updated"); window.location.reload(); } 
            else { toast.error(data?.message || "Failed to update photo"); }
        } catch (error) {
            const errorMsg = error?.response?.data?.errors?.profileImage?.[0] 
                || error?.response?.data?.message 
                || "Failed to upload photo.";
            toast.error(errorMsg, { id: "modal-toaster" });
        } finally {
            setIsPhotoUploading(false);
            if (photoInputRef.current) photoInputRef.current.value = "";
        }
    };

    const useClientPagination = (rows, pageSize = 6) => {
        const [page, setPage] = useState(1);
        const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
        const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);
        return { page, totalPages, pageRows, goPrev: () => setPage(p => Math.max(1, p - 1)), goNext: () => setPage(p => Math.min(totalPages, p + 1)) };
    };

    const dependentsPager = useClientPagination(dependents, 6);
    const loansPager = useClientPagination(releasedLoans, 6);

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title={`Profile`}>
                    <link rel="icon" href="/images/logo/pis_logo.png" />
                </Head>
                
                <div className="max-w-7xl mx-auto space-y-6 pb-24 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-4 relative z-0">
                    
                    {/* HEADER CARD */}
                    <div className="relative rounded-3xl sm:rounded-[2rem] border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#0f1f1a] overflow-hidden shadow-sm transition-all duration-300">
                        {/* Decorative Background Accents */}
                        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
                        
                        <div className="relative z-10 p-5 sm:p-8">
                            <div className="flex flex-col md:flex-row md:items-center gap-6 sm:gap-8">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 flex-1 min-w-0 text-center sm:text-left w-full">
                                    
                                    {/* Avatar Wrapper */}
                                    <div className="relative shrink-0 group mx-auto sm:mx-0">
                                        <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 ring-4 ring-white dark:ring-[#0f1f1a] shadow-lg transition-transform duration-300 group-hover:scale-[1.02]">
                                            {basicInfo.profileImage && !imgError ? (
                                                <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" onError={() => setImgError(true)} />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 font-black text-3xl sm:text-4xl dark:from-emerald-500/20 dark:to-emerald-500/10 dark:text-emerald-400 uppercase tracking-tighter">
                                                    {basicInfo.firstName?.[0]}{basicInfo.lastName?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => photoInputRef.current?.click()} 
                                            className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 border-2 border-white dark:border-[#0f1f1a]" 
                                            disabled={isPhotoUploading}
                                        >
                                            {isPhotoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                        </button>
                                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                    </div>

                                    <div className="min-w-0 flex-1 w-full flex flex-col items-center sm:items-start justify-center pt-2 sm:pt-3">
                                        <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap mb-3 w-full">
                                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-full">{fullName}</h1>
                                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 shadow-sm">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                {basicInfo.civilStatus || "Member"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col w-full sm:flex-row gap-2 sm:gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center justify-center sm:justify-start gap-2 min-w-0 w-full sm:w-auto bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
                                                <Phone className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                                                <span className="truncate">{safeText(basicInfo.contact)}</span>
                                            </div>
                                            <div className="flex items-center justify-center sm:justify-start gap-2 min-w-0 w-full sm:w-auto bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
                                                <Mail className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                                                <span className="truncate">{safeText(basicInfo.email)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                                    <button 
                                        onClick={() => { setEditTab("basicInfo"); setIsEditOpen(true); }} 
                                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-white border border-slate-200 px-6 py-3 sm:py-3.5 text-slate-700 font-bold hover:bg-slate-50 shadow-sm dark:bg-white/10 dark:border-white/10 dark:text-white transition-all active:scale-[0.98]"
                                    >
                                        <Shield className="h-5 w-5 text-slate-400 dark:text-slate-300" /> 
                                        Update Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* MINI STATS */}
                        <div className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 px-5 sm:px-8 py-5">
                            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                                <MiniStat label="Dependents" value={dependents.length} icon={Users} />
                                <MiniStat label="Released Loans" value={releasedLoans.length} icon={Landmark} />
                                <MiniStat label="AFP Serial" value={safeText(afpInfo.afpsn)} icon={IdCard} />
                                <MiniStat label="Branch" value={safeText(branchService.branchService)} icon={CreditCard} />
                            </div>
                        </div>
                    </div>

                    {/* MAIN CONTENT GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                        
                        {/* DESKTOP SIDEBAR NAV */}
                        <div className="lg:col-span-3 hidden lg:block">
                            <div className="sticky top-24 space-y-2">
                                <SectionButton id="overview" icon={User} label="Overview" activeId={activeSection} onClick={setActiveSection} />
                                <SectionButton id="personal" icon={IdCard} label="Personal & IDs" activeId={activeSection} onClick={setActiveSection} />
                                <SectionButton id="service" icon={Shield} label="AFP & Branch" activeId={activeSection} onClick={setActiveSection} />
                                <SectionButton id="contacts" icon={Phone} label="Family & Emergency" activeId={activeSection} onClick={setActiveSection} />
                                <SectionButton id="dependents" icon={Users} label="Dependents" activeId={activeSection} onClick={setActiveSection} />
                            </div>
                        </div>

                        {/* MOBILE NAV TAB BAR */}
                        <div className="lg:hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
                            <div className="flex overflow-x-auto gap-2 pb-4 pt-2 snap-x snap-mandatory custom-scrollbar w-full">
                                <MobileNavTab id="overview" icon={User} label="Overview" activeId={activeSection} onClick={setActiveSection} />
                                <MobileNavTab id="personal" icon={IdCard} label="Personal" activeId={activeSection} onClick={setActiveSection} />
                                <MobileNavTab id="service" icon={Shield} label="Branch" activeId={activeSection} onClick={setActiveSection} />
                                <MobileNavTab id="contacts" icon={Phone} label="Emergency" activeId={activeSection} onClick={setActiveSection} />
                                <MobileNavTab id="dependents" icon={Users} label="Dependents" activeId={activeSection} onClick={setActiveSection} />
                            </div>
                        </div>

                        {/* CONTENT CARDS */}
                        <div className="lg:col-span-9 space-y-6 lg:space-y-8">
                            {activeSection === "overview" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                    <Card title="Basic Information" icon={User} onEdit={() => { setEditTab("basicInfo"); setIsEditOpen(true); }}>
                                        <InfoRow label="Full Name" value={fullName} />
                                        <InfoRow label="Birth Date" value={basicInfo.dob} />
                                        <InfoRow label="Civil Status" value={basicInfo.civilStatus} />
                                        <InfoRow label="Address" value={basicInfo.fullAddress} className="break-words whitespace-normal" />
                                    </Card>
                                    <Card title="Identification" icon={IdCard} onEdit={() => { setEditTab("identification"); setIsEditOpen(true); }}>
                                        <InfoRow label="TIN" value={identificationInfo.tinNo} />
                                        <InfoRow label="GSIS" value={identificationInfo.gsisNo} />
                                        <InfoRow label="CRN/UMID" value={identificationInfo.crnUmidNo} />
                                    </Card>
                                    <Card title="Branch Service" icon={Shield} onEdit={() => { setEditTab("branchService"); setIsEditOpen(true); }} className="md:col-span-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8">
                                            <InfoRow label="Service" value={branchService.branchService} />
                                            <InfoRow label="Sub-Branch" value={branchService.subBranch} />
                                        </div>
                                    </Card>
                                </div>
                            )}
                            {activeSection === "personal" && (
                                <div className="space-y-6 lg:space-y-8">
                                    <Card title="Basic Information" icon={User} onEdit={() => { setEditTab("basicInfo"); setIsEditOpen(true); }}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8">
                                            <InfoRow label="Nickname" value={basicInfo.nickname} />
                                            <InfoRow label="Gender" value={basicInfo.gender} />
                                            <InfoRow label="Nationality" value={basicInfo.nationality} />
                                            <InfoRow label="Religion" value={basicInfo.religion} />
                                            <InfoRow label="Email" value={basicInfo.email} />
                                            <InfoRow label="Mobile" value={basicInfo.contact} />
                                        </div>
                                        <div className="mt-4 pt-2">
                                            <InfoRow label="Detailed Address" value={`${basicInfo.fullAddress || ""} ${basicInfo.barangay || ""} ${basicInfo.city || ""} ${basicInfo.province || ""}`} className="break-words whitespace-normal" />
                                        </div>
                                    </Card>
                                    <Card title="Identification" icon={IdCard} onEdit={() => { setEditTab("identification"); setIsEditOpen(true); }}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8">
                                            <InfoRow label="TIN No." value={identificationInfo.tinNo} />
                                            <InfoRow label="GSIS No." value={identificationInfo.gsisNo} />
                                            <InfoRow label="CRN/UMID" value={identificationInfo.crnUmidNo} />
                                        </div>
                                    </Card>
                                </div>
                            )}
                            {activeSection === "service" && (
                                <div className="space-y-6 lg:space-y-8">
                                    <Card title="Branch Service" icon={Shield} onEdit={() => { setEditTab("branchService"); setIsEditOpen(true); }}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8">
                                            <InfoRow label="Branch" value={branchService.branchService} />
                                            <InfoRow label="Sub-Branch" value={branchService.subBranch} />
                                        </div>
                                    </Card>
                                    <Card title="AFP Info" icon={Landmark} onEdit={() => { setEditTab("afpInfo"); setIsEditOpen(true); }}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8">
                                            <InfoRow label="Serial No" value={afpInfo.afpsn} />
                                            <InfoRow label="Rank" value={afpInfo.rank} />
                                            <InfoRow label="Designation" value={afpInfo.designation} />
                                            <InfoRow label="AFP ID" value={afpInfo.afpId} />
                                            <InfoRow label="Unit Asgmt" value={afpInfo.presentAssignment} />
                                            <InfoRow label="Years in Service" value={afpInfo.yearsInService} />
                                            <InfoRow label="Enlistment Date" value={afpInfo.cadEnlistment} />
                                            <InfoRow label="Retirement" value={afpInfo.retirementDate} />
                                            <InfoRow label="Pension Date" value={afpInfo.pensionDate} />
                                        </div>
                                    </Card>
                                </div>
                            )}
                            {activeSection === "contacts" && (
                                <div className="space-y-6 lg:space-y-8">
                                    <Card title="Emergency Contact" icon={Phone} onEdit={() => { setEditTab("emergencyInfo"); setIsEditOpen(true); }}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8">
                                            <InfoRow label="Name" value={emergencyContact.contactPersonName} />
                                            <InfoRow label="Relation" value={emergencyContact.contactPersonRelation} />
                                            <InfoRow label="Phone" value={emergencyContact.contactPersonPhone} />
                                        </div>
                                        <div className="mt-4 pt-2">
                                            <InfoRow label="Address" value={emergencyContact.contactPersonAddress} className="break-words whitespace-normal" />
                                        </div>
                                    </Card>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                        <Card title="Spouse Info" icon={Users} onEdit={() => { setEditTab("spouseInfo"); setIsEditOpen(true); }}>
                                            <InfoRow label="Name" value={spouseInfo.spouseName} />
                                            <InfoRow label="DOB" value={spouseInfo.spouseDob} />
                                            <InfoRow label="Marriage Date" value={spouseInfo.dateMarriage} />
                                        </Card>
                                        <Card title="Parents Info" icon={Users} onEdit={() => { setEditTab("parentsInfo"); setIsEditOpen(true); }}>
                                            <InfoRow label="Father" value={`${parentsInfo.fatherName || "—"} (${parentsInfo.fatherAge || "?"})`} />
                                            <InfoRow label="Mother" value={`${parentsInfo.motherName || "—"} (${parentsInfo.motherAge || "?"})`} />
                                        </Card>
                                    </div>
                                </div>
                            )}
                            {activeSection === "dependents" && (
                                <TableShell title="Dependents" icon={Users} footer={<TablePager page={dependentsPager.page} totalPages={dependentsPager.totalPages} onPrev={dependentsPager.goPrev} onNext={dependentsPager.goNext} />}>
                                    <div className="overflow-x-auto w-full custom-scrollbar">
                                        <table className="min-w-full text-left">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                                                    <th className="px-4 sm:px-6 py-4 font-bold whitespace-nowrap">Name</th>
                                                    <th className="px-4 sm:px-6 py-4 font-bold whitespace-nowrap">Date of Birth</th>
                                                    <th className="px-4 sm:px-6 py-4 font-bold whitespace-nowrap">Gender</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                {dependentsPager.pageRows.length ? dependentsPager.pageRows.map((d, i) => (
                                                    <tr key={i} className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap truncate max-w-[150px] sm:max-w-xs">{d.name}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{d.dob}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${d.gender === 'Female' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20'}`}>
                                                                {d.gender}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )) : <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">No dependents recorded.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </TableShell>
                            )}
                        </div>
                    </div>
                </div>

                {/* ULTRA-PREMIUM NATIVE MODAL */}
                <AnimatePresence>
                    {isEditOpen && (
                        <ModalShell title="Update Profile" subtitle="Keep your information up to date." onClose={() => setIsEditOpen(false)}>
                            
                            {/* OUTER CONTAINER */}
                            <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden relative">
                                
                                {/* 1. TABS: Sticky horizontal on Mobile, Left vertical sidebar on Desktop */}
                                <div className="shrink-0 flex flex-row lg:flex-col lg:w-60 gap-2 overflow-x-auto snap-x snap-mandatory custom-scrollbar border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10 px-3 py-3 lg:p-5 bg-white/90 dark:bg-[#0f1f1a]/90 backdrop-blur-xl z-20 sticky top-0 lg:static">
                                    <ModalTab id="basicInfo" label="Basic Info" icon={User} active={editTab} onClick={setEditTab} />
                                    <ModalTab id="branchService" label="Branch" icon={Shield} active={editTab} onClick={setEditTab} />
                                    <ModalTab id="identification" label="IDs" icon={IdCard} active={editTab} onClick={setEditTab} />
                                    <ModalTab id="afpInfo" label="AFP Info" icon={Landmark} active={editTab} onClick={setEditTab} />
                                    <ModalTab id="spouseInfo" label="Spouse" icon={Users} active={editTab} onClick={setEditTab} />
                                    <ModalTab id="parentsInfo" label="Parents" icon={Users} active={editTab} onClick={setEditTab} />
                                    <ModalTab id="emergencyInfo" label="Emergency" icon={Phone} active={editTab} onClick={setEditTab} />
                                    <ModalTab id="dependentsInfo" label="Dependents" icon={Users} active={editTab} onClick={setEditTab} />
                                </div>

                                {/* 2. RIGHT/BOTTOM SIDE: Form Content + Action Buttons */}
                                <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50 dark:bg-[#060c0a] relative">
                                    
                                    {/* SCROLLABLE FORM AREA */}
                                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
                                        
                                        {/* WRAPPER FOR MAX WIDTH ON DESKTOP */}
                                        <div className="max-w-3xl mx-auto w-full">
                                            {editTab === "basicInfo" && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <Field label="First Name" value={basicInfoForm.firstName} onChange={(v) => setBasicInfoForm(p=>({...p, firstName:v}))} />
                                                        <Field label="Middle Name" value={basicInfoForm.middleName} onChange={(v) => setBasicInfoForm(p=>({...p, middleName:v}))} />
                                                        <Field label="Last Name" value={basicInfoForm.lastName} onChange={(v) => setBasicInfoForm(p=>({...p, lastName:v}))} />
                                                        <Field label="Suffix" value={basicInfoForm.suffix} onChange={(v) => setBasicInfoForm(p=>({...p, suffix:v}))} />
                                                        <Field label="Nickname" value={basicInfoForm.nickname} onChange={(v) => setBasicInfoForm(p=>({...p, nickname:v}))} />
                                                        <SelectField label="Gender" value={basicInfoForm.gender} onChange={(v) => setBasicInfoForm(p=>({...p, gender:v}))} options={["Male", "Female"]} />
                                                        <Field label="Birth Date" type="date" value={basicInfoForm.dob} onChange={(v) => setBasicInfoForm(p=>({...p, dob:v}))} />
                                                        <SelectField label="Civil Status" value={basicInfoForm.civilStatus} onChange={(v) => setBasicInfoForm(p=>({...p, civilStatus:v}))} options={["Single", "Married", "Widowed", "Separated", "Divorced"]} />
                                                        <Field label="Religion" value={basicInfoForm.religion} onChange={(v) => setBasicInfoForm(p=>({...p, religion:v}))} />
                                                        <Field label="Nationality" value={basicInfoForm.nationality} onChange={(v) => setBasicInfoForm(p=>({...p, nationality:v}))} />
                                                        <Field label="Email" type="email" value={basicInfoForm.email} onChange={(v) => setBasicInfoForm(p=>({...p, email:v}))} />
                                                        <Field label="Contact No." value={basicInfoForm.contact} onChange={(v) => setBasicInfoForm(p=>({...p, contact:v}))} />
                                                    </div>
                                                    <div className="pt-6 border-t border-slate-200/70 dark:border-white/10">
                                                        <div className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                                                            <MapPin className="text-emerald-500" size={18} /> Address Information
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <SelectFieldV2 label="Region" value={selectedRegion} onChange={(v) => { setSelectedRegion(v); setSelectedProvince(""); setSelectedCity(""); setSelectedBarangay(""); }} options={regionOptions.map(r => ({ value: r.code, label: r.name }))} />
                                                            <SelectFieldV2 label="Province" value={selectedProvince} onChange={(v) => { setSelectedProvince(v); setSelectedCity(""); setSelectedBarangay(""); }} options={provinceOptions.map(p => ({ value: p, label: p }))} disabled={!selectedRegion} />
                                                            <SelectFieldV2 label="City / Municipality" value={selectedCity} onChange={(v) => { setSelectedCity(v); setSelectedBarangay(""); }} options={cityOptions.map(c => ({ value: c, label: c }))} disabled={!selectedProvince} />
                                                            <SelectFieldV2 label="Barangay" value={selectedBarangay} onChange={(v) => setSelectedBarangay(v)} options={barangayOptions.map(b => ({ value: b, label: b }))} disabled={!selectedCity} />
                                                            <div className="sm:col-span-2"><Field label="Detailed Address (Street/Unit)" value={basicInfoForm.fullAddress} onChange={(v) => setBasicInfoForm(p=>({...p, fullAddress:v}))} /></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {editTab === "branchService" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <SelectFieldV2 label="Branch of Service" value={branchForm.branchService} onChange={(v) => setBranchForm(p => ({ ...p, branchService: v }))} options={Object.keys(branchOptions).map(k => ({ value: k, label: k }))} />
                                                    <SelectFieldV2 label="Sub-Branch" value={branchForm.subBranch} onChange={(v) => setBranchForm(p => ({ ...p, subBranch: v }))} options={availableSubBranches.map(k => ({ value: k, label: k }))} disabled={!branchForm.branchService} />
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
                                                    <div className="sm:col-span-2"><Field label="Present Assignment" value={afpForm.presentAssignment} onChange={(v) => setAfpForm(p=>({...p, presentAssignment:v}))} /></div>
                                                    <Field label="Years in Service" value={afpForm.yearsInService} onChange={(v) => setAfpForm(p=>({...p, yearsInService:v}))} />
                                                    <Field label="Enlistment Date" type="date" value={afpForm.cadEnlistment} onChange={(v) => setAfpForm(p=>({...p, cadEnlistment:v}))} />
                                                    <Field label="Retirement Date" type="date" value={afpForm.retirementDate} onChange={(v) => setAfpForm(p=>({...p, retirementDate:v}))} />
                                                    <Field label="Pension Date" type="date" value={afpForm.pensionDate} onChange={(v) => setAfpForm(p=>({...p, pensionDate:v}))} />
                                                </div>
                                            )}
                                            {editTab === "spouseInfo" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="sm:col-span-2"><Field label="Spouse Name" value={spouseForm.spouseName} onChange={(v) => setSpouseForm(p=>({...p, spouseName:v}))} /></div>
                                                    <Field label="Date of Birth" type="date" value={spouseForm.spouseDob} onChange={(v) => setSpouseForm(p=>({...p, spouseDob:v}))} />
                                                    <Field label="Date of Marriage" type="date" value={spouseForm.dateMarriage} onChange={(v) => setSpouseForm(p=>({...p, dateMarriage:v}))} />
                                                </div>
                                            )}
                                            {editTab === "parentsInfo" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Field label="Father Name" value={parentsForm.fatherName} onChange={(v) => setParentsForm(p=>({...p, fatherName:v}))} />
                                                    <Field label="Father Age" type="number" value={parentsForm.fatherAge} onChange={(v) => setParentsForm(p=>({...p, fatherAge:v}))} />
                                                    <Field label="Mother Name" value={parentsForm.motherName} onChange={(v) => setParentsForm(p=>({...p, motherName:v}))} />
                                                    <Field label="Mother Age" type="number" value={parentsForm.motherAge} onChange={(v) => setParentsForm(p=>({...p, motherAge:v}))} />
                                                </div>
                                            )}
                                            {editTab === "emergencyInfo" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Field label="Contact Person Name" value={emergencyForm.contactPersonName} onChange={(v) => setEmergencyForm(p=>({...p, contactPersonName:v}))} />
                                                    <SelectFieldV2 label="Relationship" value={emergencyForm.contactPersonRelation} onChange={(v) => setEmergencyForm(p=>({...p, contactPersonRelation:v}))} options={["Father","Mother","Spouse","Brother","Sister","Son","Daughter","Relative","Guardian","Friend","Colleague","Neighbor","Others"].map(x=>({value:x, label:x}))} />
                                                    <div className="sm:col-span-2"><Field label="Phone" value={emergencyForm.contactPersonPhone} onChange={(v) => setEmergencyForm(p=>({...p, contactPersonPhone:v}))} /></div>
                                                    <div className="sm:col-span-2"><Field label="Address" value={emergencyForm.contactPersonAddress} onChange={(v) => setEmergencyForm(p=>({...p, contactPersonAddress:v}))} /></div>
                                                </div>
                                            )}
                                            {editTab === "dependentsInfo" && (
                                                <div className="space-y-4">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                        <div className="text-slate-900 dark:text-white font-semibold">Dependents List</div>
                                                        <button type="button" onClick={() => setDependentsForm(p => [...p, { id: null, name: "", dob: "", gender: "" }])} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 text-slate-700 font-semibold text-xs dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/10 dark:text-white transition shadow-sm">
                                                            Add Dependent
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {dependentsForm.map((row, idx) => (
                                                            <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
                                                                <div className="flex-1 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                                                                    <div className="w-full"><Field label="Name" value={row.name} onChange={(v) => setDependentsForm(p => p.map((r, i) => i === idx ? { ...r, name: v } : r))} /></div>
                                                                    <div className="w-full sm:w-40 shrink-0"><Field label="DOB" type="date" value={row.dob} onChange={(v) => setDependentsForm(p => p.map((r, i) => i === idx ? { ...r, dob: v } : r))} /></div>
                                                                    <div className="w-full sm:w-32 shrink-0"><SelectField label="Gender" value={row.gender} onChange={(v) => setDependentsForm(p => p.map((r, i) => i === idx ? { ...r, gender: v } : r))} options={["Male", "Female"]} /></div>
                                                                </div>
                                                                <div className="flex items-end pb-1 pt-2 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0 mt-2 sm:mt-0">
                                                                    <button type="button" onClick={() => setDependentsForm(p => p.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-600 text-sm font-semibold w-full sm:w-auto text-center py-2 sm:py-0 transition-colors">Remove</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {dependentsForm.length === 0 && <p className="text-slate-500 text-center py-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">No dependents added yet.</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. PINNED FOOTER (Safe-area padded for iOS devices) */}
                                    <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0f1f1a] z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                        <button 
                                            onClick={() => setIsEditOpen(false)} 
                                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition shadow-sm"
                                        >
                                            Close
                                        </button>
                                        <button 
                                            onClick={handleSaveCurrentTab} 
                                            disabled={isSaving} 
                                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
                                        >
                                            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </ModalShell>
                    )}
                </AnimatePresence>
            
            </PaymentReminderLayout>
        </SidebarLayout>
    );
}

// --- SUB-COMPONENTS ---

function ModalShell({ title, subtitle, onClose, children }) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        
        // 1. LOCK BACKGROUND SCROLL
        document.body.style.overflow = "hidden";
        
        // 2. ESCAPE KEY TO CLOSE
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <motion.div 
            className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center p-0 sm:p-4" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            {/* BACKDROP */}
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            {/* MODAL WINDOW */}
            <motion.div 
                className="relative w-full max-w-5xl bg-white dark:bg-[#0f1f1a] shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl overflow-hidden" 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }} 
                transition={{ type: "spring", damping: 30, stiffness: 300, mass: 1.2 }}
            >
                <div className="sm:hidden flex justify-center pt-3 pb-1 bg-white dark:bg-[#0f1f1a] w-full absolute top-0 z-50">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/20 rounded-full" />
                </div>

                {/* HEADER */}
                <div className="shrink-0 flex justify-between items-center px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-200/80 dark:border-white/10 z-20 bg-white dark:bg-[#0f1f1a] pt-8 sm:pt-6">
                    <div className="min-w-0 pr-4">
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">{title}</div>
                        <div className="text-xs sm:text-sm text-slate-500 dark:text-white/50 mt-0.5 truncate">{subtitle}</div>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition">
                        <X size={20} />
                    </button>
                </div>
                
                {/* MODAL BODY CONTAINER */}
                <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/30 dark:bg-transparent">
                    {children}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}

function ModalTab({ id, label, icon: Icon, active, onClick }) {
    const isActive = active === id;
    return (
        <button 
            onClick={() => onClick(id)} 
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 sm:px-4 sm:py-3 text-left transition snap-start shrink-0 whitespace-nowrap ${
                isActive 
                ? "bg-emerald-100 text-emerald-800 font-bold shadow-sm dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/30" 
                : "bg-transparent text-slate-500 font-semibold hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white border border-transparent"
            }`}
        >
            <Icon size={16} className={isActive ? "text-emerald-600 dark:text-emerald-300" : "text-slate-400 dark:text-slate-500"} />
            <span className="text-sm">{label}</span>
        </button>
    );
}

// --- PAGE LEVEL HELPERS ---

function MobileNavTab({ id, label, icon: Icon, activeId, onClick }) {
    const isActive = activeId === id;
    return (
        <button onClick={() => onClick(id)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 transition snap-start shrink-0 whitespace-nowrap font-semibold text-sm ${isActive ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-300 border border-slate-200/80 dark:border-white/10"}`}>
            <Icon size={16} className={isActive ? "text-white/90" : "text-slate-400 dark:text-slate-500"} />
            {label}
        </button>
    );
}

function SectionButton({ id, icon: Icon, label, activeId, onClick }) {
    const active = activeId === id;
    return (
        <button onClick={() => onClick(id)} className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition border ${active ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300 shadow-sm" : "bg-white border-transparent text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-200 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5"}`}>
            <span className={`grid place-items-center shrink-0 h-10 w-10 rounded-xl transition-colors ${active ? "bg-emerald-200/50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"}`}>
                <Icon size={18} />
            </span>
            <span className="text-[15px] truncate">{label}</span>
        </button>
    );
}

function MiniStat({ label, value, icon: Icon }) {
    return (
        <div className="group rounded-2xl border border-slate-200/80 bg-white px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0 dark:border-white/10 dark:bg-[#0f1f1a] hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all shadow-sm">
            <span className="grid place-items-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-50 text-slate-500 shrink-0 dark:bg-white/5 dark:text-white/75 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:group-hover:bg-emerald-500/20 dark:group-hover:text-emerald-400 transition-colors">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <div className="min-w-0 w-full">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate leading-none mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{value || "0"}</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-white/50 truncate uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

function Card({ title, icon: Icon, children, onEdit, className = "" }) {
    return (
        <div className={`rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden dark:border-white/10 dark:bg-[#0f1f1a] w-full ${className}`}>
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="grid place-items-center shrink-0 h-10 w-10 rounded-2xl bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 text-slate-600 dark:text-white/80 shadow-sm">
                        <Icon size={18} />
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">{title}</h2>
                </div>
                <button onClick={onEdit} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:text-emerald-600 px-3 py-1.5 text-slate-600 font-semibold text-xs dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors">
                    <FileText size={14} /> <span className="hidden sm:inline">Edit</span>
                </button>
            </div>
            <div className="p-4 sm:p-6 w-full overflow-hidden">{children}</div>
        </div>
    );
}

function InfoRow({ label, value, className = "" }) {
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1 sm:gap-4 py-3 sm:py-3.5 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] px-3 sm:px-2 -mx-3 sm:-mx-2 rounded-lg transition-colors w-full min-w-0">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
            <span className={`text-sm font-bold text-slate-900 dark:text-white/90 sm:text-right min-w-0 sm:pl-4 break-words whitespace-normal w-full sm:w-auto ${className}`}>
                {value || "—"}
            </span>
        </div>
    );
}

function TableShell({ title, icon: Icon, children, footer }) {
    return (
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden dark:border-white/10 dark:bg-[#0f1f1a] w-full">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <span className="grid place-items-center shrink-0 h-10 w-10 rounded-2xl bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 text-slate-600 dark:text-white/80 shadow-sm">
                    <Icon size={18} />
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">{title}</h2>
            </div>
            <div className="p-0 overflow-hidden w-full max-w-full">{children}</div>
            {footer && <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">{footer}</div>}
        </div>
    );
}

function TablePager({ page, totalPages, onPrev, onNext }) {
    return (
        <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
                <button onClick={onPrev} disabled={page <= 1} className="h-8 w-8 grid place-items-center rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:text-white transition"><ChevronLeft size={16} /></button>
                <button onClick={onNext} disabled={page >= totalPages} className="h-8 w-8 grid place-items-center rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:text-white transition"><ChevronRight size={16} /></button>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
    return (
        <div className="space-y-1.5 w-full min-w-0">
            <label className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 ml-1">{label}</label>
            <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-emerald-500 dark:focus:bg-emerald-500/5 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div className="space-y-1.5 w-full min-w-0">
            <label className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 ml-1">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all dark:bg-white/5 dark:border-white/10 dark:text-white [&>option]:text-slate-900 dark:[&>option]:text-white dark:[&>option]:bg-slate-900 cursor-pointer">
                <option value="">Select</option>{options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
        </div>
    );
}

function SelectFieldV2({ label, value, onChange, options, disabled }) {
    return (
        <div className="space-y-1.5 w-full min-w-0">
            <label className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 ml-1">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:border-white/10 dark:text-white [&>option]:text-slate-900 dark:[&>option]:text-white dark:[&>option]:bg-slate-900 cursor-pointer">
                <option value="">Select {label}</option>{options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
        </div>
    );
}