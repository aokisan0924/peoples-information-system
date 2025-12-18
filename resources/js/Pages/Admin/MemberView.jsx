import React, { useState, useMemo, useEffect } from "react";
import { Head, usePage, useForm } from "@inertiajs/react";
import { Tab } from "@headlessui/react";
import { User2, Building2, Shield, HeartHandshake, IdCard, PhoneCall,  Users,  CreditCard, PiggyBank, Banknote, Hourglass, X, Wallet, Coins, Receipt, CalendarClock, Eye } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import phAddresses from "@/data/ph-addresses.json";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";

const Section = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2 mb-4">
            <span className="inline-block w-1 h-5 bg-green-600 rounded-sm" />
            {title}
        </h2>
        {children}
    </div>
)

const InfoGrid = ({ data }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm text-gray-800">
        {Object.entries(data).map(([label, value], index) => (
            <div key={index} className="space-y-1">
                <div className="text-gray-500 text-xs uppercase tracking-wide">
                    {label}
                </div>
                <div className="font-medium text-base">
                    {value === null || value === undefined || value === "" ? "-" : value}
                </div>
            </div>
        ))}
    </div>
)

const tabs = [
    { key: "basic",        label: "Basic Info",          icon: User2 },
    { key: "branch",       label: "Branch Service",      icon: Building2 },
    { key: "afp",          label: "AFP Info",            icon: Shield },
    { key: "spouse",       label: "Spouse Info",         icon: HeartHandshake },
    { key: "parents",      label: "Parents Info",        icon: Users },
    { key: "id",           label: "Identification Info", icon: IdCard },
    { key: "emergency",    label: "Emergency Contact",   icon: PhoneCall },
    { key: "dependents",   label: "Dependents",          icon: Users },
    { key: "loans",        label: "Loans",               icon: CreditCard },
    { key: "shareCapital", label: "Share Capital",       icon: Banknote },
    { key: "savings",      label: "Savings Deposit",     icon: PiggyBank },
    { key: "timeDeposit",  label: "Time Deposit",        icon: Hourglass },
]

const regionsSource = phAddresses.region_list ?? phAddresses;

const getRegionEntries = () => {
    return Object.entries(regionsSource).map(([regionCode, regionData]) => ({
        code: regionCode,
        name: regionData.region_name || regionCode,
        provinceList: regionData.province_list || {},
    }));
};

export default function MemberView() {
    const { props } = usePage();
    const { MemberData } = props;
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
    const [ activeSection, setActiveSection ] = useState(null);
    const [ isSubmittingBasic, setIsSubmittingBasic ] = useState(false);
    const [ isSubmittingBranch, setIsSubmittingBranch ] = useState(false);
    const [ availableSubBranches, setAvailableSubBranches ] = useState([]);
    const [ isSubmittingAfp, setIsSubmittingAfp ] = useState(false);
    const [ isSubmittingSpouse, setIsSubmittingSpouse ] = useState(false);
    const [ isSubmittingParents, setIsSubmittingParents ] = useState(false);
    const [ isSubmittingIdentification, setIsSubmittingIdentification ] = useState(false);
    const [ isSubmittingEmergency, setIsSubmittingEmergency ] = useState(false);
    const [ isSubmittingDependents, setIsSubmittingDependents ] = useState(false);
    const [ dependentErrors, setDependentErrors ] = useState({});
    const [ loanModalOpen, setLoanModalOpen ] = useState(false);
    const [ selectedLoan, setSelectedLoan ] = useState(null);
    const [ activeTimeDeposit, setActiveTimeDeposit ] = useState(null);

    const basicInfo = MemberData.basicInfoData;
    const encrypted = basicInfo?.encrypted ?? null;

    const handleBasicInfoSubmit = async (e) => {
        e.preventDefault();

        if (!encrypted) {
            toast.error('missing member reference');
            return;
        }

        const formEl = e.target;
        const formData = new FormData(formEl);
        const payload = Object.fromEntries(formData.entries());

        setIsSubmittingBasic(true);

        try {
            const { data } = await axios.post(
                route('admin.members.update-basic-info', { encrypted }),
                payload
            );

            if (!data?.success) {
                toast.error(data?.message || 'Failed to update');
                return
            }

            toast.success(data?.message || 'Updated successfully');
            setActiveSection(null);
        } catch (error) {
            const httpStatus = error?.response?.status;
            const resp = error?.response?.data;

            if (httpStatus === 422) {
                const firstError = 
                    resp?.message ||
                    (resp?.errors && Object.values(resp.errors)[0]?.[0]) ||
                    'Please check the form for erros';
                toast.error(firstError);
            } else if (httpStatus === 404) {
                toast.error(resp?.message || 'Member not found');
            } else {
                toast.error('Failed to update');
            }
        } finally {
            setIsSubmittingBasic(false);
        }
    }

    const branchService = MemberData.branchServiceData;
    const branchOptions = {
        "ACTIVE MILITARY": ["ARMY", "AIR FORCE", "NAVY", "RESERVIST"],
        "RETIRED MILITARY": ["ARMY", "AIR FORCE", "NAVY", "RESERVIST"],
        "BENEFICIARY": ["WIDOW", "DEPENDENT", "PARENTS"],
        "CIVILIAN EMPLOYEES": ["AFFC", "PNFC", "FCPA"],
        "PMPC": ["BOARD OF DIRECTORS", "MANAGEMENT", "STAFF", "PROBATIONARY"],
        "CDEA": [],
    }

    const [branchForm, setBranchForm] = useState({
        branchService: branchService?.branch_service?.branchService || "",
        subBranch: branchService?.branch_service?.subBranch || "",
    });

    useEffect(() => {
        const subs = branchOptions[branchForm.branchService] || [];
        setAvailableSubBranches(subs);
    
        if (!subs.includes(branchForm.subBranch)) {
            setBranchForm(prev => ({ ...prev, subBranch: "" }));
        }
    }, [branchForm.branchService]);

    const handleBranchServiceSubmit = async (e) => {
        e.preventDefault();
    
        if (!encrypted) {
            toast.error("Missing member reference.");
            return;
        }
    
        setIsSubmittingBranch(true);
    
        try {
            const { data } = await axios.post(
                route("admin.members.update-branch-service", { encrypted }),
                branchForm
            );
    
            if (!data?.success) {
                toast.error(data?.message || "Failed to update Branch Service.");
                return;
            }
    
            toast.success(data?.message || "Updated successfully.");
            setActiveSection(null);
    
        } catch (error) {
            const httpStatus = error?.response?.status;
            const resp       = error?.response?.data;
    
            if (httpStatus === 422) {
                const firstError =
                    resp?.message ||
                    (resp?.errors && Object.values(resp.errors)[0]?.[0]) ||
                    "Validation failed.";
                toast.error(firstError);
            } else {
                toast.error("Failed to update Branch Service. Try again.");
            }
        } finally {
            setIsSubmittingBranch(false);
        }
    };

    const afpInfo = MemberData.afpData;

    const handleAfpInfoSubmit = async (e) => {
        e.preventDefault();
    
        if (!encrypted) {
            toast.error("Missing member reference.");
            return;
        }
    
        const formEl   = e.target;
        const formData = new FormData(formEl);
        const payload  = Object.fromEntries(formData.entries());
    
        setIsSubmittingAfp(true);
    
        try {
            const { data } = await axios.post(
                route("admin.members.update-afp-info", { encrypted }),
                payload
            );
    
            if (!data?.success) {
                toast.error(data?.message || "Failed to update AFP Info.");
                return;
            }
    
            toast.success(data?.message || "Updated successfully.");
            setActiveSection(null);
    
        } catch (error) {
            const httpStatus = error?.response?.status;
            const resp       = error?.response?.data;
    
            if (httpStatus === 422) {
                const firstError =
                    resp?.message ||
                    (resp?.errors && Object.values(resp.errors)[0]?.[0]) ||
                    "Please check the AFP Info fields.";
                toast.error(firstError);
            } else if (httpStatus === 404) {
                toast.error(resp?.message || "Member not found.");
            } else {
                toast.error("Failed to update AFP Info. Please try again.");
            }
        } finally {
            setIsSubmittingAfp(false);
        }
    };

    const spouseInfo = MemberData.spouseData;

    const handleSpouseInfoSubmit = async (e) => {
        e.preventDefault();
    
        if (!encrypted) {
            toast.error("Missing member reference.");
            return;
        }
    
        const formEl   = e.target;
        const formData = new FormData(formEl);
        const payload  = Object.fromEntries(formData.entries());
    
        setIsSubmittingSpouse(true);
    
        try {
            const { data } = await axios.post(
                route("admin.members.update-spouse-info", { encrypted }),
                payload
            );
    
            if (!data?.success) {
                toast.error(data?.message || "Failed to update Spouse Info.");
                return;
            }
    
            toast.success(data?.message || "Spouse Info updated.");
            setActiveSection(null);
    

        } catch (error) {
            const httpStatus = error?.response?.status;
            const resp       = error?.response?.data;
    
            if (httpStatus === 422) {
                const firstError =
                    resp?.message ||
                    (resp?.errors && Object.values(resp.errors)[0]?.[0]) ||
                    "Please check the Spouse Info fields.";
                toast.error(firstError);
            } else if (httpStatus === 404) {
                toast.error(resp?.message || "Member not found.");
            } else {
                toast.error("Failed to update Spouse Info. Please try again.");
            }
        } finally {
            setIsSubmittingSpouse(false);
        }
    };

    const parentsInfo = MemberData.parentsData;

    const handleParentsInfoSubmit = async (e) => {
        e.preventDefault();
    
        if (!encrypted) {
            toast.error("Missing member reference.");
            return;
        }
    
        const formEl   = e.target;
        const formData = new FormData(formEl);
        const payload  = Object.fromEntries(formData.entries());
    
        setIsSubmittingParents(true);
    
        try {
            const { data } = await axios.post(
                route("admin.members.update-parents-info", { encrypted }),
                payload
            );
    
            if (!data?.success) {
                toast.error(data?.message || "Failed to update Parents Info.");
                return;
            }
    
            toast.success(data?.message || "Updated successfully.");
            setActiveSection(null);
    

        } catch (error) {
            const httpStatus = error?.response?.status;
            const resp       = error?.response?.data;
    
            if (httpStatus === 422) {
                const firstError =
                    resp?.message ||
                    (resp?.errors && Object.values(resp.errors)[0]?.[0]) ||
                    "Please check the Parents Info fields.";
                toast.error(firstError);
            } else if (httpStatus === 404) {
                toast.error(resp?.message || "Member not found.");
            } else {
                toast.error("Failed to update Parents Info. Please try again.");
            }
        } finally {
            setIsSubmittingParents(false);
        }
    };

    const identificationInfo = MemberData.identificationData;
    const [ identificationForm, setIdentificationForm ] = useState({
        tinNo: identificationInfo?.tinNo || "",
        gsisNo: identificationInfo?.gsisNo || "",
        crnUmidNo: identificationInfo?.crnUmidNo || "",
    });

    const formatTin = (value) => {
        return value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1-$2")
        .replace(/(\d{3})(\d)/, "$1-$2")
        .replace(/(\d{3})(\d{1,3})/, "$1-$2")
        .substring(0, 15);
    }

    const formatGsis = (value) => {
        return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1-$2")
        .replace(/(\d{7})(\d)/, "$1-$2")
        .substring(0, 12);
    }

    const formatCRN = (value) => {
        return value
            .replace(/\D/g, "")
            .replace(/(\d{4})(\d)/, "$1-$2")
            .replace(/(\d{7})(\d)/, "$1-$2")
            .substring(0, 15);
    };

    const handleIdentificationInfoSubmit = async (e) => {
        e.preventDefault();
    
        if (!encrypted) {
            toast.error("Missing member reference.");
            return;
        }
    
        const formEl   = e.target;
        const formData = new FormData(formEl);
        const payload  = Object.fromEntries(formData.entries());
    
        setIsSubmittingIdentification(true);
    
        try {
            const { data } = await axios.post(
                route("admin.members.update-identification-info", { encrypted }),
                payload
            );
    
            if (!data?.success) {
                toast.error(data?.message || "Failed to update Identification Info.");
                return;
            }
    
            toast.success(data?.message || "Updated successfully.");
            setActiveSection(null);
    

        } catch (error) {
            const httpStatus = error?.response?.status;
            const resp       = error?.response?.data;
    
            if (httpStatus === 422) {
                const firstError =
                    resp?.message ||
                    (resp?.errors && Object.values(resp.errors)[0]?.[0]) ||
                    "Please check the Identification Info fields.";
                toast.error(firstError);
            } else if (httpStatus === 404) {
                toast.error(resp?.message || "Member not found.");
            } else {
                toast.error("Failed to update Identification Info. Please try again.");
            }
        } finally {
            setIsSubmittingIdentification(false);
        }
    };

    const emergencyInfo = MemberData.emergencyData;

    const handleEmergencyInfoSubmit = async (e) => {
        e.preventDefault();
    
        if (!encrypted) {
            toast.error("Missing member reference.");
            return;
        }
    
        const formEl   = e.target;
        const formData = new FormData(formEl);
        const payload  = Object.fromEntries(formData.entries());
    
        setIsSubmittingEmergency(true);
    
        try {
            const { data } = await axios.post(
                route("admin.members.update-emergency-info", { encrypted }),
                payload
            );
    
            if (!data?.success) {
                toast.error(data?.message || "Failed to update Emergency Info.");
                return;
            }
    
            toast.success(data?.message || "Updated successfully.");
            setActiveSection(null);
    

        } catch (error) {
            const httpStatus = error?.response?.status;
            const resp       = error?.response?.data;
    
            if (httpStatus === 422) {
                const firstError =
                    resp?.message ||
                    (resp?.errors && Object.values(resp.errors)[0]?.[0]) ||
                    "Please check the Emergency Info fields.";
                toast.error(firstError);
            } else if (httpStatus === 404) {
                toast.error(resp?.message || "Member not found.");
            } else {
                toast.error("Failed to update Emergency Info. Please try again.");
            }
        } finally {
            setIsSubmittingEmergency(false);
        }
    };

    const dependentsInfo = MemberData.dependentsData || [];

    const [ dependentsForm, setDependentsForm ] = useState(
        dependentsInfo.map((d) => ({
            id: d.id ?? null,
            name: d.name ?? '',
            dob: d.dob ?? '',
            gender: d.gender ?? ''
        }))
    )

    const addDependent = () => {
        setDependentsForm((prev) => [
            ...prev,
            { id: null, name: "", dob: "", gender: "" },
        ]);
    };
    
    const removeDependent = (index) => {
        setDependentsForm((prev) => prev.filter((_, i) => i !== index));
    };
    
    const updateField = (index, field, value) => {
        setDependentsForm((prev) =>
            prev.map((dep, i) =>
                i === index ? { ...dep, [field]: value } : dep
            )
        );
    };

    const handleDependentsSubmit = async (e) => {
        e.preventDefault();
    
        if (!encrypted) {
            toast.error("Missing member reference.");
            return;
        }
    
        setIsSubmittingDependents(true);
        setDependentErrors({});
    
        try {
            const payload = { dependents: dependentsForm };
    
            const { data } = await axios.post(
                route("admin.members.update-dependents-info", { encrypted }),
                payload
            );
    
            if (!data?.success) {
                if (data?.errors) setDependentErrors(data.errors);
                toast.error(data?.message || "Failed to update dependents.");
                return;
            }
    
            toast.success(data?.message || "Dependents updated successfully.");
            setActiveSection(null);
            window.location.reload();
        } catch (error) {
            const status = error?.response?.status;
            const resp   = error?.response?.data;
    
            if (status === 422 && resp?.errors) {
                setDependentErrors(resp.errors);
                const first =
                    Object.values(resp.errors)[0]?.[0] || "Validation failed.";
                toast.error(first);
            } else {
                toast.error("Failed to update dependents. Please try again.");
            }
        } finally {
            setIsSubmittingDependents(false);
        }
    };
    
    const releasedLoans = MemberData.releasedLoansData || [];

    const formatLongDate = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const openLoanModal = (loan) => {
        setSelectedLoan(loan);
        setLoanModalOpen(true);
    }

    const closeLoanModal = () => {
        setSelectedLoan(null);
        setLoanModalOpen(false);
    }

    const shareCapital = MemberData.shareCapitalData || {};
    const shareRows = shareCapital.rows || [];
    const shareSummary = shareCapital.summary || {};

    const [sharePage, setSharePage] = useState(1);
    const sharePerPage = 10;

    const totalShareRows = shareRows.length;
    const shareLastPage = Math.max(1, Math.ceil(totalShareRows / sharePerPage));

    const shareStartIndex = (sharePage - 1) * sharePerPage;
    const sharePageRows = shareRows.slice(shareStartIndex, shareStartIndex + sharePerPage);

    useEffect(() => {
        if (sharePage > shareLastPage) {
            setSharePage(shareLastPage);
        }
    }, [totalShareRows, shareLastPage, sharePage]);

    const savings = MemberData.savingsData || {};
    const savingsRows = savings.rows || [];
    const savingsSummary = savings.summary || {};

    const [ savingsPage, setSavingsPage ] = useState(1);
    const savingsPerPage = 10;

    const totalSavingsRows = savingsRows.length;
    const savingsLastPage = Math.max(1, Math.ceil(totalSavingsRows / savingsPerPage));
    
    const savingsStartIndex = (savingsPage - 1) * savingsPerPage;
    const savingsPageRows = savingsRows.slice(
        savingsStartIndex,
        savingsStartIndex + savingsPerPage
    );

    useEffect(() => {
        if (savingsPage > savingsLastPage) {
            setSavingsPage(savingsLastPage);
        }
    }, [ totalSavingsRows, savingsLastPage, savingsPage ]);

    const timeDepositData = MemberData.timeDepositData || {};
    const timeDepositSummary = timeDepositData.summaryAll || {};
    const timeDeposits = timeDepositData.deposits || [];

    const [timeDepositPage, setTimeDepositPage] = useState(1);
    const timeDepositsPerPage = 10;

    const totalTimeDeposits = timeDeposits.length;
    const timeDepositsLastPage = Math.max(
        1,
        Math.ceil(totalTimeDeposits / timeDepositsPerPage)
    );

    const timeDepositsStartIndex = (timeDepositPage - 1) * timeDepositsPerPage;
    const pagedTimeDeposits = timeDeposits.slice(
        timeDepositsStartIndex,
        timeDepositsStartIndex + timeDepositsPerPage
    );

    const [ selectedRegion, setSelectedRegion ] = useState(() => basicInfo.region || "");
    const [ selectedProvince, setSelectedProvince ] = useState(() => basicInfo.province || "");
    const [ selectedCity, setSelectedCity ] = useState(() => basicInfo.city || "");
    const [ selectedBarangay, setSelectedBarangay ] = useState(() => basicInfo.barangay || "");

    const regionEntries = useMemo(() => getRegionEntries(), []);
    
    const regionOptions = useMemo(() => {
        return [...regionEntries].sort((a, b) => a.name.localeCompare(b.name));
    }, [regionEntries]);

    const provinceOptions = useMemo(() => {
        if (!selectedRegion)
            return [];

        const regionEntry = regionEntries.find(
            (r) => r.code === selectedRegion || r.name === selectedRegion
        );
        if (!regionEntry)
            return [];

        return Object.keys(regionEntry.provinceList).sort();
    }, [selectedRegion, regionEntries]);

    const cityOptions = useMemo(() => {
        if (!selectedRegion || !selectedProvince)
            return [];

        const regionEntry = regionEntries.find(
            (r) => r.code === selectedRegion || r.name === selectedRegion
        );
        if (!regionEntry)
            return [];

        const province = regionEntry.provinceList[selectedProvince];
        if (!province || !province.municipality_list)
            return [];

        return Object.keys(province.municipality_list).sort();
    }, [selectedRegion, selectedProvince, regionEntries]);

    const barangayOptions = useMemo(() => {
        if (!selectedRegion || !selectedProvince || !selectedCity)
            return [];

        const regionEntry = regionEntries.find(
            (r) => r.code === selectedRegion || r.name === selectedRegion
        );
        if (!regionEntry)
            return [];

        const province = regionEntry.provinceList[selectedProvince];
        if (!province || !province.municipality_list)
            return [];

        const cityObj = province.municipality_list[selectedCity];
        if (!cityObj || !cityObj.barangay_list)
            return [];

        return cityObj.barangay_list;
    }, [selectedRegion, selectedProvince, selectedCity, regionEntries]);

    return (
        <>
            <Head title="Member Profile">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <Tab.Group>
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* LEFT COLUMN: profile + side tabs */}
                                <div className="w-full md:w-1/3 lg:w-1/4">
                                    {/* Profile Card */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
                                        {basicInfo.profileImage ? (
                                            <img
                                                src={`/storage/${basicInfo.profileImage}`}
                                                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-green-600 shadow-md"
                                                alt="Profile"
                                            />
                                        ) : (
                                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-green-300 to-green-600 text-white flex items-center justify-center text-3xl sm:text-4xl font-bold border-4 border-green-600 shadow-md">
                                                {(basicInfo.firstName ?? "").charAt(0)}
                                                {(basicInfo.lastName ?? "").charAt(0)}
                                            </div>
                                        )}

                                        <div className="mt-3 text-center space-y-1">
                                            <div className="text-lg font-semibold text-gray-900 break-words">
                                                {basicInfo.firstName}{" "}
                                                {basicInfo.middleName ?? ""}{" "}
                                                {basicInfo.lastName}{" "}
                                                {basicInfo.suffix ?? ""}
                                            </div>
                                            <div className="text-xs uppercase tracking-wide text-gray-500">
                                                Member ID: {basicInfo.username ?? basicInfo.id}
                                            </div>
                                            {branchService.branch_service && (
                                                <div className="inline-flex items-center px-2 py-1 mt-1 rounded-full bg-green-50 text-xs text-green-700 font-semibold">
                                                    {branchService.branch_service.branchService}
                                                    {branchService.branch_service.subBranch
                                                        ? ` • ${branchService.branch_service.subBranch}`
                                                        : ""}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Side Tabs */}
                                    <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-2 md:p-3">
                                        {/* Desktop: vertical tabs */}
                                        <div className="hidden md:block">
                                            <Tab.List className="flex flex-col gap-1">
                                                {tabs.map(({ key, label, icon: Icon }) => (
                                                    <Tab
                                                        key={key}
                                                        className={({ selected }) =>
                                                            [
                                                                "flex items-center gap-2 text-sm px-3 py-2 rounded-lg w-full text-left transition-all duration-150 focus:outline-none",
                                                                selected
                                                                    ? "bg-green-600 text-white shadow-sm"
                                                                    : "text-gray-700 hover:bg-gray-50",
                                                            ].join(" ")
                                                        }
                                                    >
                                                        <Icon className="w-4 h-4 shrink-0" />
                                                        <span>{label}</span>
                                                    </Tab>
                                                ))}
                                            </Tab.List>
                                        </div>

                                        {/* Mobile: horizontal pill tabs */}
                                        <div className="md:hidden mb-1">
                                            <Tab.List className="flex overflow-x-auto gap-2 pb-1">
                                                {tabs.map(({ key, label }) => (
                                                    <Tab
                                                        key={key}
                                                        className={({ selected }) =>
                                                            [
                                                                "whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-all duration-150 focus:outline-none",
                                                                selected
                                                                    ? "bg-green-600 text-white border-green-600"
                                                                    : "bg-white text-gray-700 border-gray-200",
                                                            ].join(" ")
                                                        }
                                                    >
                                                        {label}
                                                    </Tab>
                                                ))}
                                            </Tab.List>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: tab panels */}
                                <div className="w-full md:w-2/3 lg:w-3/4">
                                    <Tab.Panels>
                                        {/* BASIC INFO */}
                                        <Tab.Panel>
                                            <Section title="Basic Info">
                                                <div className="flex justify-end mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSection("Basic Info")}
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded shadow-sm transition duration-150"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                                <InfoGrid
                                                    data={{
                                                        "Full Name": `${basicInfo.firstName} ${basicInfo.middleName ?? ""} ${basicInfo.lastName} ${basicInfo.suffix ?? ""}`,
                                                        Nickname: basicInfo.nickname ?? "-",
                                                        Gender: basicInfo.gender,
                                                        Age: basicInfo.age,
                                                        "Date of Birth": formatLongDate(basicInfo.dob),
                                                        Religion: basicInfo.religion,
                                                        "Civil Status": basicInfo.civilStatus,
                                                        Nationality: basicInfo.nationality,
                                                        Email: basicInfo.email,
                                                        Contact: basicInfo.contact,
                                                        Address: basicInfo.fullAddress,
                                                    }}
                                                />
                                            </Section>
                                        </Tab.Panel>

                                        {/* BRANCH SERVICE */}
                                        <Tab.Panel>
                                            <Section title="Branch Service">
                                                <div className="flex justify-end mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSection("Branch Service")}
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded shadow-sm transition duration-150"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                                {branchService ? (
                                                    <InfoGrid
                                                        data={{
                                                            Branch: branchService.branchService,
                                                            "Sub Branch": branchService.subBranch,
                                                        }}
                                                    />
                                                ) : (
                                                    <p className="italic text-gray-500">
                                                        No branch service info.
                                                    </p>
                                                )}
                                            </Section>
                                        </Tab.Panel>

                                        {/* AFP INFO */}
                                        <Tab.Panel>
                                            <Section title="AFP Info">
                                                <div className="flex justify-end mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSection("AFP Info")}
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded shadow-sm transition duration-150"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                                {afpInfo ? (
                                                    <InfoGrid
                                                        data={{
                                                            'AFP Serial no': afpInfo.afpsn,
                                                            'Rank': afpInfo.rank,
                                                            'Designation': afpInfo.designation,
                                                            'AFP ID': afpInfo.afpId,
                                                            'Present Assignment': afpInfo.presentAssignment,
                                                            'Control No.': afpInfo.controlNo,
                                                            'Years in Service': afpInfo.yearsInService,
                                                            'CAD Enlistment Date': afpInfo.cadEnlistment,
                                                            'Retirement Date': afpInfo.retirementDate,
                                                            'Pension Date': afpInfo.pensionDate 
                                                        }}
                                                    />
                                                ) : (
                                                    <p className="italic text-gray-500">
                                                        No AFP info.
                                                    </p>
                                                )}
                                            </Section>
                                        </Tab.Panel>

                                        {/* SPOUSE INFO */}
                                        <Tab.Panel>
                                            <Section title="Spouse Info">
                                                <div className="flex justify-end mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSection("Spouse Info")}
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded shadow-sm transition duration-150"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                                {spouseInfo ? (
                                                    <InfoGrid
                                                        data={{
                                                            'Spouse Name': spouseInfo.spouseName,
                                                            'Age': spouseInfo.spouseAge,
                                                            'Date of Birth': spouseInfo.spouseDob,
                                                            'Date of Marriage': spouseInfo.dateMarriage,
                                                        }}
                                                    />
                                                ) : (
                                                    <p className="italic text-gray-500">
                                                        No Spouse info.
                                                    </p>
                                                )}
                                            </Section>
                                        </Tab.Panel>

                                        {/* PARENTS INFO */}
                                        <Tab.Panel>
                                            <Section title="Parents Info">
                                                <div className="flex justify-end mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSection("Parents Info")}
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded shadow-sm transition duration-150"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                                {parentsInfo ? (
                                                    <InfoGrid
                                                        data={{
                                                            'Mother Name': parentsInfo.motherName,
                                                            'Mother Age': parentsInfo.motherAge,
                                                            'Father Name': parentsInfo.fatherName,
                                                            'Father Age': parentsInfo.fatherAge,
                                                        }}
                                                    />
                                                ) : (
                                                    <p className="italic text-gray-500">
                                                        No parents info.
                                                    </p>
                                                )}
                                            </Section>
                                        </Tab.Panel>

                                        {/* IDENTIFICATION INFO */}
                                        <Tab.Panel>
                                            <Section title="Identification Info">
                                                <div className="flex justify-end mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSection("Identification Info")}
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded shadow-sm transition duration-150"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                                {identificationInfo ? (
                                                    <InfoGrid
                                                        data={{
                                                            'TIN No': identificationInfo.tinNo,
                                                            'SSS/GSIS No': identificationInfo.gsisNo,
                                                            'CRN UMID No': identificationInfo.crnUmidNo,
                                                        }}
                                                    />
                                                ) : (
                                                    <p className="italic text-gray-500">
                                                        No parents info.
                                                    </p>
                                                )}
                                            </Section>
                                        </Tab.Panel>

                                        {/* EMERGENCY INFO */}
                                        <Tab.Panel>
                                            <Section title="Emergency Info">
                                                <div className="flex justify-end mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSection("Emergency Info")}
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded shadow-sm transition duration-150"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                                {emergencyInfo ? (
                                                    <InfoGrid
                                                        data={{
                                                            'CONTACT PERSON NAME': emergencyInfo.contactPersonName,
                                                            'ADDRESS': emergencyInfo.contactPersonAddress,
                                                            'CONTACT NO': emergencyInfo.contactPersonPhone,
                                                            'RELATIONSHIP': emergencyInfo.contactPersonRelation,
                                                        }}
                                                    />
                                                ) : (
                                                    <p className="italic text-gray-500">
                                                        No emergency info.
                                                    </p>
                                                )}
                                            </Section>
                                        </Tab.Panel>

                                        {/* DEPENDENTS INFO TABLE */}
                                        <Tab.Panel>
                                            <Section title="Dependents">
                                                <div className="flex justify-end mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSection("Dependents")}
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded shadow-sm transition duration-150"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>

                                                {dependentsInfo && dependentsInfo.length > 0 ? (
                                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                        <table className="min-w-full text-xs sm:text-sm">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left font-semibold text-gray-600 w-12">
                                                                        #
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                        Name
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                        Date of Birth
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                        Gender
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {dependentsInfo.map((dep, index) => (
                                                                    <tr key={dep.id ?? index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-2 text-gray-500">
                                                                            {index + 1}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-gray-900">
                                                                            {dep.name || "-"}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-gray-700">
                                                                            {dep.dob || "-"}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-gray-700">
                                                                            {dep.gender || "-"}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <p className="italic text-gray-500">
                                                        No dependents recorded.
                                                    </p>
                                                )}
                                            </Section>
                                        </Tab.Panel>

                                        {/* LOANS TAB – Released Loans Only */}
                                        <Tab.Panel>
                                            <Section title="Loans">
                                                {releasedLoans.length === 0 ? (
                                                    <p className="italic text-gray-500">
                                                        No released loans for this member.
                                                    </p>
                                                ) : (
                                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                        <table className="min-w-full text-xs sm:text-sm">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left font-semibold text-gray-600 w-10">
                                                                        #
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                        Loan Ref
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                        Type
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                                        Loan Class
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                                        Monthly Amort.
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                        Released Date
                                                                    </th>
                                                                    <th className="px-3 py-2 text-center font-semibold text-gray-600 w-24">
                                                                        Action
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {releasedLoans.map((loan, index) => (
                                                                    <tr key={loan.id ?? index} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-2 text-gray-500">
                                                                            {index + 1}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-gray-900">
                                                                            {loan.loanReference}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-gray-700">
                                                                            {loan.loanType || "-"}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right text-gray-900">
                                                                            {loan.loanClassification || "-"}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right text-gray-900">
                                                                            ₱ {loan.monthlyAmortization}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-gray-700">
                                                                            {formatLongDate(loan.releasedDate || "-")}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openLoanModal(loan)}
                                                                                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition"
                                                                            >
                                                                                <Eye className="w-3 h-3" />
                                                                                <span>View</span>
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </Section>
                                        </Tab.Panel>

                                        {/* SHARE CAPITAL TAB */}
                                        <Tab.Panel>
                                            <Section title="Share Capital">
                                                {/* Cards */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-xs">
                                                    {/* Total Balance */}
                                                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 p-3">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                                            Total Balance
                                                        </p>
                                                        <p className="mt-1 text-lg font-bold text-gray-900">
                                                            ₱ {shareSummary.totalBalance || "0.00"}
                                                        </p>
                                                    </div>

                                                    {/* Paid Capital */}
                                                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50/60 p-3">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                                                            Paid Capital
                                                        </p>
                                                        <p className="mt-1 text-lg font-bold text-gray-900">
                                                            {shareSummary.paidCapital || "0.00"}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            Estimated number of paid capital shares.
                                                        </p>
                                                    </div>

                                                    {/* Total Deposits */}
                                                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                                            Total Deposits
                                                        </p>
                                                        <p className="mt-1 text-base font-bold text-emerald-700">
                                                            ₱ {shareSummary.totalDeposits || "0.00"}
                                                        </p>
                                                    </div>

                                                    {/* Total Withdrawals */}
                                                    <div className="rounded-2xl border border-red-100 bg-white p-3">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600">
                                                            Total Withdrawals
                                                        </p>
                                                        <p className="mt-1 text-base font-bold text-red-600">
                                                            ₱ {shareSummary.totalWithdrawals || "0.00"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Table */}
                                                <div className="rounded-xl border border-gray-200 overflow-x-auto">
                                                    <table className="min-w-full text-xs sm:text-sm">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                    Date of Transaction
                                                                </th>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                    Date Posted
                                                                </th>
                                                                <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                                    Debit
                                                                </th>
                                                                <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                                    Credit
                                                                </th>
                                                                <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                                    Balance
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {sharePageRows.length === 0 && (
                                                                <tr>
                                                                    <td
                                                                        colSpan={5}
                                                                        className="px-3 py-4 text-center text-sm text-gray-500"
                                                                    >
                                                                        No share capital transactions found.
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            {sharePageRows.map((row) => {
                                                                const isDeposit = row.transactionType === "deposit";
                                                                const isWithdrawal = row.transactionType === "withdrawal";

                                                                return (
                                                                    <tr key={row.id} className="hover:bg-gray-50">
                                                                        {/* Date of Transaction */}
                                                                        <td className="px-3 py-2 text-gray-800">
                                                                            {row.transactionDate || "—"}
                                                                        </td>

                                                                        {/* Date Posted */}
                                                                        <td className="px-3 py-2 text-gray-800">
                                                                            {row.postedDate || "—"}
                                                                        </td>

                                                                        {/* Debit – withdrawal, red, "-" */}
                                                                        <td className="px-3 py-2 text-right">
                                                                            {isWithdrawal && row.debit ? (
                                                                                <span className="font-semibold text-red-600">
                                                                                    - ₱ {row.debit}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-400">—</span>
                                                                            )}
                                                                        </td>

                                                                        {/* Credit – deposit, green */}
                                                                        <td className="px-3 py-2 text-right">
                                                                            {isDeposit && row.credit ? (
                                                                                <span className="font-semibold text-emerald-700">
                                                                                    ₱ {row.credit}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-400">—</span>
                                                                            )}
                                                                        </td>

                                                                        {/* Balance */}
                                                                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                                                            ₱ {row.balance}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>

                                                    {/* Pagination footer – similar feel to SavingsDeposit */}
                                                    {totalShareRows > 0 && (
                                                        <div className="flex items-center justify-between px-3 py-2 text-[11px] text-gray-600 bg-white border-t border-gray-200">
                                                            <div>
                                                                Showing{" "}
                                                                <span className="font-semibold">
                                                                    {totalShareRows === 0
                                                                        ? 0
                                                                        : shareStartIndex + 1}
                                                                    {" - "}
                                                                    {Math.min(shareStartIndex + sharePerPage, totalShareRows)}
                                                                </span>{" "}
                                                                of{" "}
                                                                <span className="font-semibold">{totalShareRows}</span>{" "}
                                                                entries
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSharePage((p) => Math.max(1, p - 1))
                                                                    }
                                                                    disabled={sharePage <= 1}
                                                                    className={`px-2.5 py-1 rounded border text-[11px] ${
                                                                        sharePage <= 1
                                                                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                                                    }`}
                                                                >
                                                                    Previous
                                                                </button>
                                                                <span>
                                                                    Page{" "}
                                                                    <span className="font-semibold">{sharePage}</span>{" "}
                                                                    of{" "}
                                                                    <span className="font-semibold">{shareLastPage}</span>
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSharePage((p) =>
                                                                            Math.min(shareLastPage, p + 1)
                                                                        )
                                                                    }
                                                                    disabled={sharePage >= shareLastPage}
                                                                    className={`px-2.5 py-1 rounded border text-[11px] ${
                                                                        sharePage >= shareLastPage
                                                                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                                                    }`}
                                                                >
                                                                    Next
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Section>
                                        </Tab.Panel>

                                        {/* SAVINGS DEPOSIT TAB */}
                                        <Tab.Panel>
                                            <Section title="Savings Deposit">
                                                {/* Cards */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-xs">
                                                    {/* Total Balance */}
                                                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 p-3">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                                            Total Savings Balance
                                                        </p>
                                                        <p className="mt-1 text-lg font-bold text-gray-900">
                                                            ₱ {savingsSummary.totalBalance || "0.00"}
                                                        </p>
                                                    </div>

                                                    {/* Total Deposits */}
                                                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                                            Total Deposits
                                                        </p>
                                                        <p className="mt-1 text-base font-bold text-emerald-700">
                                                            ₱ {savingsSummary.totalDeposits || "0.00"}
                                                        </p>
                                                    </div>

                                                    {/* Total Withdrawals */}
                                                    <div className="rounded-2xl border border-red-100 bg-white p-3">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600">
                                                            Total Withdrawals
                                                        </p>
                                                        <p className="mt-1 text-base font-bold text-red-600">
                                                            ₱ {savingsSummary.totalWithdrawals || "0.00"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Table */}
                                                <div className="rounded-xl border border-gray-200 overflow-x-auto">
                                                    <table className="min-w-full text-xs sm:text-sm">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                    Date of Transaction
                                                                </th>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                    Transaction Type
                                                                </th>
                                                                <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                                    Debit
                                                                </th>
                                                                <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                                    Credit
                                                                </th>
                                                                <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                                    Balance
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {savingsPageRows.length === 0 && (
                                                                <tr>
                                                                    <td
                                                                        colSpan={5}
                                                                        className="px-3 py-4 text-center text-sm text-gray-500"
                                                                    >
                                                                        No savings deposit transactions found.
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            {savingsPageRows.map((row) => {
                                                                const isDeposit = row.transactionType === "deposit";
                                                                const isWithdrawal = row.transactionType === "withdrawal";

                                                                return (
                                                                    <tr key={row.id} className="hover:bg-gray-50">
                                                                        {/* Date of Transaction */}
                                                                        <td className="px-3 py-2 text-gray-800">
                                                                            {row.transactionDate || "—"}
                                                                        </td>

                                                                        {/* Date Posted */}
                                                                        <td className="px-3 py-2 text-gray-800">
                                                                            <span
                                                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                                    isDeposit
                                                                                        ? "bg-emerald-50 text-emerald-700"
                                                                                        : "bg-red-50 text-red-700"
                                                                                }`}
                                                                            >
                                                                                {isDeposit
                                                                                    ? "Deposit"
                                                                                    : "Withdrawal"}
                                                                            </span>
                                                                        </td>

                                                                        {/* Debit – withdrawal, red with "-" */}
                                                                        <td className="px-3 py-2 text-right">
                                                                            {isWithdrawal && row.debit ? (
                                                                                <span className="font-semibold text-red-600">
                                                                                    - ₱ {row.debit}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-400">—</span>
                                                                            )}
                                                                        </td>

                                                                        {/* Credit – deposit, green */}
                                                                        <td className="px-3 py-2 text-right">
                                                                            {isDeposit && row.credit ? (
                                                                                <span className="font-semibold text-emerald-700">
                                                                                    ₱ {row.credit}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-400">—</span>
                                                                            )}
                                                                        </td>

                                                                        {/* Balance */}
                                                                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                                                            ₱ {row.balance}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>

                                                    {/* Pagination footer */}
                                                    {totalSavingsRows > 0 && (
                                                        <div className="flex items-center justify-between px-3 py-2 text-[11px] text-gray-600 bg-white border-t border-gray-200">
                                                            <div>
                                                                Showing{" "}
                                                                <span className="font-semibold">
                                                                    {totalSavingsRows === 0
                                                                        ? 0
                                                                        : savingsStartIndex + 1}
                                                                    {" - "}
                                                                    {Math.min(
                                                                        savingsStartIndex + savingsPerPage,
                                                                        totalSavingsRows
                                                                    )}
                                                                </span>{" "}
                                                                of{" "}
                                                                <span className="font-semibold">{totalSavingsRows}</span>{" "}
                                                                entries
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSavingsPage((p) => Math.max(1, p - 1))
                                                                    }
                                                                    disabled={savingsPage <= 1}
                                                                    className={`px-2.5 py-1 rounded border text-[11px] ${
                                                                        savingsPage <= 1
                                                                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                                                    }`}
                                                                >
                                                                    Previous
                                                                </button>
                                                                <span>
                                                                    Page{" "}
                                                                    <span className="font-semibold">{savingsPage}</span>{" "}
                                                                    of{" "}
                                                                    <span className="font-semibold">
                                                                        {savingsLastPage}
                                                                    </span>
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSavingsPage((p) =>
                                                                            Math.min(savingsLastPage, p + 1)
                                                                        )
                                                                    }
                                                                    disabled={savingsPage >= savingsLastPage}
                                                                    className={`px-2.5 py-1 rounded border text-[11px] ${
                                                                        savingsPage >= savingsLastPage
                                                                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                                                    }`}
                                                                >
                                                                    Next
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Section>
                                        </Tab.Panel>

                                        {/* TIME DEPOSIT TAB */}
                                        <Tab.Panel>
                                            <Section title="Time Deposit">
                                                {/* If no TD at all */}
                                                {timeDeposits.length === 0 ? (
                                                    <p className="text-sm text-gray-500 italic">
                                                        No time deposit records for this member.
                                                    </p>
                                                ) : (
                                                    <>
                                                        {/* Summary cards for ALL TDs */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-xs">
                                                            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 p-3">
                                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                                                    Total Principal (All Time Deposits)
                                                                </p>
                                                                <p className="mt-1 text-lg font-bold text-gray-900">
                                                                    ₱ {timeDepositSummary.totalPrincipal || "0.00"}
                                                                </p>
                                                            </div>

                                                            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50/60 p-3">
                                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                                                                    Total Current Balance
                                                                </p>
                                                                <p className="mt-1 text-lg font-bold text-gray-900">
                                                                    ₱ {timeDepositSummary.totalCurrentBalance || "0.00"}
                                                                </p>
                                                            </div>

                                                            <div className="rounded-2xl border border-amber-100 bg-white p-3">
                                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                                                                    Total Available Interest
                                                                </p>
                                                                <p className="mt-1 text-base font-bold text-amber-700">
                                                                    ₱ {timeDepositSummary.totalAvailableInterest || "0.00"}
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 mt-1">
                                                                    Sum of interest that can still be withdrawn.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Table of all TDs */}
                                                        <div className="rounded-xl border border-gray-200 overflow-x-auto">
                                                            <table className="min-w-full text-xs sm:text-sm">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                            TD Code
                                                                        </th>
                                                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                            Start Date
                                                                        </th>
                                                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                            Maturity Date
                                                                        </th>
                                                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                                            Principal
                                                                        </th>
                                                                        <th className="px-3 py-2 text-center font-semibold text-gray-600">
                                                                            Term / Rate
                                                                        </th>
                                                                        <th className="px-3 py-2 text-center font-semibold text-gray-600">
                                                                            Action
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100">
                                                                    {pagedTimeDeposits.map((td, idx) => {
                                                                        const s = td.summary || {};
                                                                        return (
                                                                            <tr key={s.timeDepositId ?? idx} className="hover:bg-gray-50">
                                                                                <td className="px-3 py-2 text-gray-800">
                                                                                    {s.timeDepositCode || "—"}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-gray-800">
                                                                                    {s.startDate || "—"}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-gray-800">
                                                                                    {s.maturityDate || "—"}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-right text-gray-900">
                                                                                    ₱ {s.principal || "0.00"}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center text-gray-800">
                                                                                    {s.termYears} yr @ {s.interestRate}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setActiveTimeDeposit(td)}
                                                                                        className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                                                                    >
                                                                                        View
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>

                                                            {/* Pagination footer */}
                                                            {totalTimeDeposits > 0 && (
                                                                <div className="flex items-center justify-between px-3 py-2 text-[11px] text-gray-600 bg-white border-t border-gray-200">
                                                                    <div>
                                                                        Showing{" "}
                                                                        <span className="font-semibold">
                                                                            {totalTimeDeposits === 0
                                                                                ? 0
                                                                                : timeDepositsStartIndex + 1}
                                                                            {" - "}
                                                                            {Math.min(
                                                                                timeDepositsStartIndex + timeDepositsPerPage,
                                                                                totalTimeDeposits
                                                                            )}
                                                                        </span>{" "}
                                                                        of{" "}
                                                                        <span className="font-semibold">
                                                                            {totalTimeDeposits}
                                                                        </span>{" "}
                                                                        time deposits
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setTimeDepositPage((p) => Math.max(1, p - 1))
                                                                            }
                                                                            disabled={timeDepositPage <= 1}
                                                                            className={`px-2.5 py-1 rounded border text-[11px] ${
                                                                                timeDepositPage <= 1
                                                                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                                                            }`}
                                                                        >
                                                                            Previous
                                                                        </button>
                                                                        <span>
                                                                            Page{" "}
                                                                            <span className="font-semibold">
                                                                                {timeDepositPage}
                                                                            </span>{" "}
                                                                            of{" "}
                                                                            <span className="font-semibold">
                                                                                {timeDepositsLastPage}
                                                                            </span>
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setTimeDepositPage((p) =>
                                                                                    Math.min(timeDepositsLastPage, p + 1)
                                                                                )
                                                                            }
                                                                            disabled={timeDepositPage >= timeDepositsLastPage}
                                                                            className={`px-2.5 py-1 rounded border text-[11px] ${
                                                                                timeDepositPage >= timeDepositsLastPage
                                                                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                                                            }`}
                                                                        >
                                                                            Next
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </Section>
                                        </Tab.Panel>

                                    </Tab.Panels>
                                </div>
                            </div>
                        </Tab.Group>
                    </div>
                </div>
            </AdminSidebarLayout>

            {/* Basic Information Modal */}
            <AnimatePresence>
                {activeSection === "Basic Info" && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                        Update Info
                                    </p>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Basic Information
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection(null)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form
                                onSubmit={handleBasicInfoSubmit}
                                className="px-5 pb-4 pt-3 space-y-6"
                            >
                                <input type="hidden" name="_token" value={csrfToken} />

                                {/* PERSONAL DETAILS */}
                                <section>
                                    <h3 className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase mb-2">
                                        Personal Details
                                    </h3>
                                    <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        {/* FIRST NAME */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                First Name
                                            </label>
                                            <input
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                name="firstName"
                                                defaultValue={basicInfo.firstName}
                                            />
                                        </div>

                                        {/* MIDDLE NAME */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Middle Name
                                            </label>
                                            <input
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                name="middleName"
                                                defaultValue={basicInfo.middleName}
                                            />
                                        </div>

                                        {/* LAST NAME */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Last Name
                                            </label>
                                            <input
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                name="lastName"
                                                defaultValue={basicInfo.lastName}
                                            />
                                        </div>

                                        {/* SUFFIX */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Suffix
                                            </label>
                                            <input
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                name="suffix"
                                                defaultValue={basicInfo.suffix}
                                            />
                                        </div>

                                        {/* NICKNAME */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Nickname
                                            </label>
                                            <input
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                name="nickname"
                                                defaultValue={basicInfo.nickname}
                                            />
                                        </div>

                                        {/* GENDER */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Gender
                                            </label>
                                            <select
                                                name="gender"
                                                defaultValue={basicInfo.gender || ""}
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                <option value="" disabled>
                                                    Select gender
                                                </option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>

                                        {/* DOB */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Date of Birth
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                name="dob"
                                                defaultValue={basicInfo.dob}
                                            />
                                        </div>

                                        {/* CIVIL STATUS */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Civil Status
                                            </label>
                                            <select
                                                name="civilStatus"
                                                defaultValue={basicInfo.civilStatus || ""}
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                <option value="" disabled>
                                                    Select civil status
                                                </option>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                                <option value="Widowed">Widowed</option>
                                                <option value="Separated">Separated</option>
                                                <option value="Divorced">Divorced</option>
                                            </select>
                                        </div>

                                        {/* RELIGION */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Religion
                                            </label>
                                            <input
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                name="religion"
                                                defaultValue={basicInfo.religion}
                                            />
                                        </div>

                                        {/* NATIONALITY */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Nationality
                                            </label>
                                            <input
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                name="nationality"
                                                defaultValue={basicInfo.nationality}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* CONTACT DETAILS */}
                                <section>
                                    <h3 className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase mb-2">
                                        Contact Details
                                    </h3>
                                    <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        {/* EMAIL */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                name="email"
                                                defaultValue={basicInfo.email}
                                            />
                                        </div>

                                        {/* CONTACT */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Contact Number
                                            </label>
                                            <input
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                name="contact"
                                                defaultValue={basicInfo.contact}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* ADDRESS */}
                                <section>
                                    <h3 className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase mb-2">
                                        Address
                                    </h3>
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* REGION */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Region
                                                </label>
                                                <select
                                                    name="region"
                                                    value={selectedRegion}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setSelectedRegion(value);
                                                        setSelectedProvince("");
                                                        setSelectedCity("");
                                                        setSelectedBarangay("");
                                                    }}
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value="">Select Region</option>
                                                    {regionOptions.map((r) => (
                                                        <option key={r.code} value={r.code}>
                                                            {r.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* PROVINCE */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Province
                                                </label>
                                                <select
                                                    name="province"
                                                    value={selectedProvince}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setSelectedProvince(value);
                                                        setSelectedCity("");
                                                        setSelectedBarangay("");
                                                    }}
                                                    disabled={!selectedRegion}
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value="">Select Province</option>
                                                    {provinceOptions.map((prov) => (
                                                        <option key={prov} value={prov}>
                                                            {prov}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* CITY / MUNICIPALITY */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    City / Municipality
                                                </label>
                                                <select
                                                    name="city"
                                                    value={selectedCity}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setSelectedCity(value);
                                                        setSelectedBarangay("");
                                                    }}
                                                    disabled={!selectedProvince}
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value="">Select City / Municipality</option>
                                                    {cityOptions.map((city) => (
                                                        <option key={city} value={city}>
                                                            {city}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* BARANGAY */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Barangay
                                                </label>
                                                <select
                                                    name="barangay"
                                                    value={selectedBarangay}
                                                    onChange={(e) => setSelectedBarangay(e.target.value)}
                                                    disabled={!selectedCity}
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value="">Select Barangay</option>
                                                    {barangayOptions.map((brgy) => (
                                                        <option key={brgy} value={brgy}>
                                                            {brgy}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* FULL ADDRESS */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Full Address (Detailed)
                                            </label>
                                            <textarea
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-emerald-500 text-sm min-h-[70px] bg-white"
                                                name="fullAddress"
                                                defaultValue={basicInfo.fullAddress}
                                            ></textarea>
                                        </div>
                                    </div>
                                </section>

                                {/* Footer */}
                                <div className="pt-2 pb-1 flex justify-end gap-2 border-t mt-2 bg-white sticky bottom-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(null)}
                                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingBasic}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                                    >
                                        {isSubmittingBasic ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Branch of Service Modal */}
            <AnimatePresence>
                {activeSection === "Branch Service" && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                        Update Info
                                    </p>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Branch of Service
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection(null)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* FORM (same behavior as BranchServiceModal.jsx) */}
                            <form onSubmit={handleBranchServiceSubmit} className="flex-1 flex flex-col">
                                {/* BODY */}
                                <div className="flex-1 overflow-y-auto px-5 py-4">
                                    <div className="overflow-y-auto max-h-[70vh] px-1 pb-4">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 tracking-wide">
                                            Branch of Service Details
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 text-sm">
                                            {/* BRANCH SERVICE */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Branch of Service
                                                </label>
                                                <select
                                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                                    value={branchForm.branchService}
                                                    onChange={(e) => setBranchForm(prev => ({ ...prev, branchService: e.target.value }))}
                                                >
                                                    <option value="">Select Branch</option>
                                                    {Object.keys(branchOptions).map(branch => (
                                                        <option key={branch} value={branch}>{branch}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* SUB BRANCH */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Sub Branch
                                                </label>
                                                <select
                                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                                    value={branchForm.subBranch}
                                                    disabled={availableSubBranches.length === 0}
                                                    onChange={(e) => setBranchForm(prev => ({ ...prev, subBranch: e.target.value }))}
                                                >
                                                    <option value="">Select Sub Branch</option>
                                                    {availableSubBranches.map(sub => (
                                                        <option key={sub} value={sub}>{sub}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER */}
                                <div className="px-5 py-3 border-t bg-white flex justify-end gap-2 sticky bottom-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(null)}
                                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingBranch}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white ${
                                            isSubmittingBranch
                                                ? "bg-green-400 cursor-not-allowed"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                    >
                                        {isSubmittingBranch ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AFP Info Modal */}
            <AnimatePresence>
                {activeSection === "AFP Info" && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                        Update Info
                                    </p>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        AFP Info
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection(null)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* FORM (same behavior as BranchServiceModal.jsx) */}
                            <form onSubmit={handleAfpInfoSubmit} className="flex-1 flex flex-col">
                                {/* BODY */}
                                <div className="flex-1 overflow-y-auto px-5 py-4">
                                    <div className="overflow-y-auto max-h-[70vh] px-1 pb-4">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 tracking-wide">
                                            AFP Info Details
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 text-sm">
                                            {/* AFP INFO */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    AFP Serial No
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="afpsn"
                                                    defaultValue={afpInfo.afpsn}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Rank
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="rank"
                                                    defaultValue={afpInfo.rank}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Designation
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="designation"
                                                    defaultValue={afpInfo.designation}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    AFP ID
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="afpId"
                                                    defaultValue={afpInfo.afpId}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Present Assignment
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="presentAssignment"
                                                    defaultValue={afpInfo.presentAssignment}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Control No
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="controlNo"
                                                    defaultValue={afpInfo.controlNo}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Years in Service
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="yearsInService"
                                                    defaultValue={afpInfo.yearsInService}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    CAD Enlistment Date
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="cadEnlistment"
                                                    defaultValue={afpInfo.cadEnlistment}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Retirement Date
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="retirementDate"
                                                    defaultValue={afpInfo.retirementDate}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Pension Date
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="pensionDate"
                                                    defaultValue={afpInfo.pensionDate}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER */}
                                <div className="px-5 py-3 border-t bg-white flex justify-end gap-2 sticky bottom-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(null)}
                                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingAfp}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white ${
                                            isSubmittingAfp
                                                ? "bg-green-400 cursor-not-allowed"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                    >
                                        {isSubmittingAfp ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Spouse Info Modal */}
            <AnimatePresence>
                {activeSection === "Spouse Info" && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                        Update Info
                                    </p>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Spouse Info
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection(null)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSpouseInfoSubmit} className="flex-1 flex flex-col">
                                {/* BODY */}
                                <div className="flex-1 overflow-y-auto px-5 py-4">
                                    <div className="overflow-y-auto max-h-[70vh] px-1 pb-4">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 tracking-wide">
                                            Spouse Info Details
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 text-sm">
                                            {/* SPOUSE NAME */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Spouse Name
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="spouseName"
                                                    defaultValue={spouseInfo?.spouseName || ""}
                                                />
                                            </div>

                                            {/* SPOUSE DATE OF BIRTH */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Date of Birth
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="spouseDob"
                                                    defaultValue={spouseInfo?.spouseDob || ""}
                                                />
                                            </div>

                                            {/* DATE OF MARRIAGE */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Date of Marriage
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="dateMarriage"
                                                    defaultValue={spouseInfo?.dateMarriage || ""}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER */}
                                <div className="px-5 py-3 border-t bg-white flex justify-end gap-2 sticky bottom-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(null)}
                                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingSpouse}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white ${
                                            isSubmittingSpouse
                                                ? "bg-green-400 cursor-not-allowed"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                    >
                                        {isSubmittingSpouse ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Parents Info Modal */}
            <AnimatePresence>
                {activeSection === "Parents Info" && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                        Update Info
                                    </p>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Parents Info
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection(null)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleParentsInfoSubmit} className="flex-1 flex flex-col">
                                {/* BODY */}
                                <div className="flex-1 overflow-y-auto px-5 py-4">
                                    <div className="overflow-y-auto max-h-[70vh] px-1 pb-4">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 tracking-wide">
                                            Parents Info Details
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 text-sm">
                                            {/* PARENTS NAME */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Mother Name
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="motherName"
                                                    defaultValue={parentsInfo?.motherName || ""}
                                                />
                                            </div>

                                            {/* MOTHER AGE */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Mother Age
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="motherAge"
                                                    defaultValue={parentsInfo?.motherAge || ""}
                                                />
                                            </div>

                                            {/* FATHER NAME */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Father Name
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="fatherName"
                                                    defaultValue={parentsInfo?.fatherName || ""}
                                                />
                                            </div>

                                            {/* FATHER AGE */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Mother Age
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="fatherAge"
                                                    defaultValue={parentsInfo?.fatherAge || ""}
                                                />
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER */}
                                <div className="px-5 py-3 border-t bg-white flex justify-end gap-2 sticky bottom-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(null)}
                                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingParents}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white ${
                                            isSubmittingParents
                                                ? "bg-green-400 cursor-not-allowed"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                    >
                                        {isSubmittingParents ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Identification Info Modal */}
            <AnimatePresence>
                {activeSection === "Identification Info" && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                        Update Info
                                    </p>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Identification Info
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection(null)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleIdentificationInfoSubmit} className="flex-1 flex flex-col">
                                {/* BODY */}
                                <div className="flex-1 overflow-y-auto px-5 py-4">
                                    <div className="overflow-y-auto max-h-[70vh] px-1 pb-4">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 tracking-wide">
                                            Identification Info Details
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 text-sm">
                                            {/* TIN NO */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    TIN No
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white 
                                                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="tinNo"
                                                    value={identificationForm.tinNo}
                                                    onChange={(e) =>
                                                        setIdentificationForm(prev => ({
                                                            ...prev,
                                                            tinNo: formatTin(e.target.value)
                                                        }))
                                                    }
                                                />
                                            </div>

                                            {/* SSS/GSIS */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    SSS/GSIS
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white 
                                                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="gsisNo"
                                                    value={identificationForm.gsisNo}
                                                    onChange={(e) =>
                                                        setIdentificationForm(prev => ({
                                                            ...prev,
                                                            gsisNo: formatGsis(e.target.value)
                                                        }))
                                                    }
                                                />
                                            </div>

                                            {/* CRN UMID NO */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    CRN UMID No
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white 
                                                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="crnUmidNo"
                                                    value={identificationForm.crnUmidNo}
                                                    onChange={(e) =>
                                                        setIdentificationForm(prev => ({
                                                            ...prev,
                                                            crnUmidNo: formatCRN(e.target.value)
                                                        }))
                                                    }
                                                />
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER */}
                                <div className="px-5 py-3 border-t bg-white flex justify-end gap-2 sticky bottom-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(null)}
                                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingIdentification}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white ${
                                            isSubmittingIdentification
                                                ? "bg-green-400 cursor-not-allowed"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                    >
                                        {isSubmittingIdentification ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Emergency Info Modal */}
            <AnimatePresence>
                {activeSection === "Emergency Info" && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                        Update Info
                                    </p>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Emergenct Contact Info
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection(null)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleEmergencyInfoSubmit} className="flex-1 flex flex-col">
                                {/* BODY */}
                                <div className="flex-1 overflow-y-auto px-5 py-4">
                                    <div className="overflow-y-auto max-h-[70vh] px-1 pb-4">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 tracking-wide">
                                            Identification Info Details
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 text-sm">
                                            {/* CONTACT PERSON NAME */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Contact Person Name
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white 
                                                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="contactPersonName"
                                                    defaultValue={emergencyInfo?.contactPersonName || ""}
                                                />
                                            </div>

                                            {/*  CONTACT PERSON ADDRESS */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    CONTACT PERSON ADDRESS
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white 
                                                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="contactPersonAddress"
                                                    defaultValue={emergencyInfo?.contactPersonAddress || ""}
                                                />
                                            </div>

                                            {/* CONTACT NO */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    CONTACT
                                                </label>
                                                <input
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white 
                                                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    name="contactPersonPhone"
                                                    defaultValue={emergencyInfo?.contactPersonPhone || ""}
                                                />
                                            </div>

                                            {/* RELATIONSHIP */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    RELATIONSHIP
                                                </label>
                                                <select
                                                    name="contactPersonRelation"
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    defaultValue={emergencyInfo?.contactPersonRelation || ""}
                                                >
                                                    <option value="" disabled>Select relationship</option>
                                                    <option value="Father">Father</option>
                                                    <option value="Mother">Mother</option>
                                                    <option value="Spouse">Spouse</option>
                                                    <option value="Brother">Brother</option>
                                                    <option value="Sister">Sister</option>
                                                    <option value="Son">Son</option>
                                                    <option value="Daughter">Daughter</option>
                                                    <option value="Relative">Relative</option>
                                                    <option value="Guardian">Guardian</option>
                                                    <option value="Friend">Friend</option>
                                                    <option value="Colleague">Colleague</option>
                                                    <option value="Neighbor">Neighbor</option>
                                                    <option value="Others">Others</option>
                                                </select>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER */}
                                <div className="px-5 py-3 border-t bg-white flex justify-end gap-2 sticky bottom-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(null)}
                                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingEmergency}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white ${
                                            isSubmittingEmergency
                                                ? "bg-green-400 cursor-not-allowed"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                    >
                                        {isSubmittingEmergency ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dependents Info Modal */}
            <AnimatePresence>
                {activeSection === "Dependents" && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                        Update Info
                                    </p>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Dependents
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection(null)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* FORM */}
                            <form onSubmit={handleDependentsSubmit} className="flex-1 flex flex-col">
                                {/* BODY */}
                                <div className="flex-1 overflow-y-auto px-5 py-4">
                                    <div className="overflow-y-auto max-h-[70vh] px-1 pb-4">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 tracking-wide">
                                            Dependents Details
                                        </h3>

                                        <div className="space-y-6 text-sm">
                                            {dependentsForm.length > 0 ? (
                                                dependentsForm.map((dep, index) => (
                                                    <div key={dep.id ?? index}
                                                        className="grid grid-cols-1 md:grid-cols-3 gap-5 border p-4 rounded-md bg-gray-50"
                                                    >
                                                        {/* FULL NAME */}
                                                        <div className="space-y-1">
                                                            <label className="text-sm font-semibold text-gray-700">
                                                                Full Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                                                value={dep.name}
                                                                onChange={(e) => updateField(index, "name", e.target.value)}
                                                            />
                                                            {dependentErrors[`dependents.${index}.name`] && (
                                                                <p className="text-xs text-red-500">
                                                                    {dependentErrors[`dependents.${index}.name`]}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* DOB */}
                                                        <div className="space-y-1">
                                                            <label className="text-sm font-semibold text-gray-700">
                                                                Date of Birth
                                                            </label>
                                                            <input
                                                                type="date"
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                                                value={dep.dob}
                                                                onChange={(e) => updateField(index, "dob", e.target.value)}
                                                            />
                                                            {dependentErrors[`dependents.${index}.dob`] && (
                                                                <p className="text-xs text-red-500">
                                                                    {dependentErrors[`dependents.${index}.dob`]}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* GENDER */}
                                                        <div className="space-y-1">
                                                            <label className="text-sm font-semibold text-gray-700">
                                                                Gender
                                                            </label>
                                                            <select
                                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                                                                value={dep.gender}
                                                                onChange={(e) => updateField(index, "gender", e.target.value)}
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="Male">Male</option>
                                                                <option value="Female">Female</option>
                                                            </select>
                                                            {dependentErrors[`dependents.${index}.gender`] && (
                                                                <p className="text-xs text-red-500">
                                                                    {dependentErrors[`dependents.${index}.gender`]}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="col-span-1 md:col-span-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeDependent(index)}
                                                                className="text-sm text-red-600 hover:underline"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-500 italic">No dependents added yet.</p>
                                            )}

                                            {/* ADD BUTTON */}
                                            <button
                                                type="button"
                                                onClick={addDependent}
                                                className="text-sm font-medium text-green-600 hover:underline"
                                            >
                                                + Add Dependent
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER */}
                                <div className="px-5 py-3 border-t bg-white flex justify-end gap-2 sticky bottom-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(null)}
                                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingDependents}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white ${
                                            isSubmittingDependents
                                                ? "bg-green-400 cursor-not-allowed"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                    >
                                        {isSubmittingDependents ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

           {/* Loan Details Modal – Refined Design */}
            <AnimatePresence>
                {loanModalOpen && selectedLoan && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                                        Released Loan
                                    </p>
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        {selectedLoan.loanReference}
                                        <span
                                            className={`
                                                inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border
                                                ${
                                                    String(selectedLoan.status).toLowerCase() === "released"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-gray-50 text-gray-600 border-gray-200"
                                                }
                                            `}
                                        >
                                            {selectedLoan.status}
                                        </span>
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {selectedLoan.loanType || "Loan"} • Term:{" "} 
                                        <span className="font-medium">
                                            {selectedLoan.termYears} year(s)
                                        </span> • {selectedLoan.loanClassification}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeLoanModal}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* BODY */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                                {/* Highlight Card – Net Proceeds */}
                                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <Wallet size={18} className="text-emerald-700" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                                                Net Proceeds
                                            </p>
                                            <p className="text-xl font-bold text-gray-900">
                                                ₱ {selectedLoan.netProceeds}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end gap-1 text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Receipt size={14} className="text-gray-400" />
                                            <span>
                                                Monthly Amortization:{" "}
                                                <span className="font-semibold text-gray-900">
                                                    ₱ {selectedLoan.monthlyAmortization}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CalendarClock size={14} className="text-gray-400" />
                                            <span>
                                                Released on:{" "}
                                                <span className="font-semibold text-gray-900">
                                                    {formatLongDate(selectedLoan.releasedDate || "—")}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Overview Cards Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    {/* Loan Amount */}
                                    <div className="border rounded-xl p-3 bg-gray-50/60">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] text-gray-500 uppercase">
                                                Loan Amount
                                            </span>
                                            <Coins size={14} className="text-gray-400" />
                                        </div>
                                        <p className="text-base font-semibold text-gray-900">
                                            ₱ {selectedLoan.loanAmount}
                                        </p>
                                    </div>

                                    {/* Gross Amount */}
                                    <div className="border rounded-xl p-3 bg-gray-50/60">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] text-gray-500 uppercase">
                                                Gross Amount
                                            </span>
                                            <Coins size={14} className="text-gray-400" />
                                        </div>
                                        <p className="text-base font-semibold text-gray-900">
                                            ₱ {selectedLoan.gross}
                                        </p>
                                    </div>

                                    {/* Term */}
                                    <div className="border rounded-xl p-3 bg-gray-50/60">
                                        <span className="text-[11px] text-gray-500 uppercase">
                                            Term
                                        </span>
                                        <p className="mt-1 text-base font-semibold text-gray-900">
                                            {selectedLoan.termYears} year(s)
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Approx. {selectedLoan.termYears * 12} months
                                        </p>
                                    </div>

                                    {/* Status + Type */}
                                    <div className="border rounded-xl p-3 bg-gray-50/60 space-y-1">
                                        <span className="text-[11px] text-gray-500 uppercase">
                                            Loan Info
                                        </span>
                                        <p className="text-sm text-gray-900">
                                            Type:{" "}
                                            <span className="font-semibold">
                                                {selectedLoan.loanType || "—"} 
                                            </span>
                                        </p>
                                        
                                        <p className="text-xs text-gray-600">
                                            Status:{" "}
                                            <span className="font-semibold">
                                                {selectedLoan.status}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="px-5 py-3 border-t bg-white flex justify-end gap-2 sticky bottom-0">
                                <button
                                    type="button"
                                    onClick={closeLoanModal}
                                    className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TIME DEPOSIT DETAILS MODAL */}
            <AnimatePresence>
                {activeTimeDeposit && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                        Time Deposit Details
                                    </p>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {activeTimeDeposit.summary?.timeDepositCode}{" "}
                                        • {activeTimeDeposit.summary?.memberName}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTimeDeposit(null)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto px-5 py-4">
                                {/* Summary cards for this TD */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-xs">
                                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                            Principal
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-gray-900">
                                            ₱ {activeTimeDeposit.summary?.principal}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50/60 p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                                            Current Balance
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-gray-900">
                                            ₱ {activeTimeDeposit.summary?.currentBalance}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Principal plus interest, net of withdrawals.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-amber-100 bg-white p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                                            Available Interest
                                        </p>
                                        <p className="mt-1 text-base font-bold text-amber-700">
                                            ₱ {activeTimeDeposit.summary?.availableInterest}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Interest that can still be withdrawn.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-white p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                            Term & Rate
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {activeTimeDeposit.summary?.termYears} year(s) @{" "}
                                            {activeTimeDeposit.summary?.interestRate}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Credited years:{" "}
                                            {activeTimeDeposit.summary?.creditedYears}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-white p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                            Dates
                                        </p>
                                        <p className="mt-1 text-xs text-gray-700">
                                            <span className="font-semibold">Start:</span>{" "}
                                            {activeTimeDeposit.summary?.startDate || "—"}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-700">
                                            <span className="font-semibold">Maturity:</span>{" "}
                                            {activeTimeDeposit.summary?.maturityDate || "—"}
                                        </p>
                                    </div>
                                </div>

                                {/* Ledger table for this TD */}
                                <div className="rounded-xl border border-gray-200 overflow-x-auto">
                                    <table className="min-w-full text-xs sm:text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                    Date
                                                </th>
                                                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                    Description
                                                </th>
                                                <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                    Debit
                                                </th>
                                                <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                    Credit
                                                </th>
                                                <th className="px-3 py-2 text-right font-semibold text-gray-600">
                                                    Balance
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {activeTimeDeposit.transactions?.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="px-3 py-4 text-center text-sm text-gray-500"
                                                    >
                                                        No ledger entries.
                                                    </td>
                                                </tr>
                                            )}

                                            {activeTimeDeposit.transactions?.map((row, idx) => {
                                                const isCredit = row.type === "credit";
                                                const isDebit = row.type === "debit";

                                                return (
                                                    <tr key={`${row.date}-${idx}`} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2 text-gray-800">
                                                            {row.date || "—"}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-800">
                                                            {row.description || "—"}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            {isDebit && row.debit ? (
                                                                <span className="font-semibold text-red-600">
                                                                    - ₱ {row.debit}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            {isCredit && row.credit ? (
                                                                <span className="font-semibold text-emerald-700">
                                                                    ₱ {row.credit}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                                            ₱ {row.balance}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 border-t bg-white flex justify-end gap-2 sticky bottom-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveTimeDeposit(null)}
                                    className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
