import React from "react";
import { Head } from "@inertiajs/react";
import { 
    Hourglass, 
    Phone, 
    Mail, 
    MapPin, 
    Info, 
    ShieldCheck, 
    Facebook,
    TrendingUp // Added for the rates section
} from "lucide-react";
import SidebarLayout from "@/Layouts/SidebarLayout";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";

export default function ClientTimeDeposit() {
    // Rates data configuration
    const rates = [
        { years: 1, rate: 0.063 },
        { years: 2, rate: 0.065 },
        { years: 3, rate: 0.070 },
        { years: 4, rate: 0.073 },
        { years: 5, rate: 0.075 },
    ];

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Time Deposit">
                    <link rel="icon" href="/images/logo/pis_logo.png" />
                </Head>
                
                <div className="space-y-6">
                    
                    {/* HERO HEADER */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm dark:shadow-2xl transition-colors">
                        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 flex items-center justify-center">
                                        <Hourglass className="h-5 w-5" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                                        Time Deposit
                                    </h1>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-white/60 max-w-2xl leading-relaxed">
                                    Secure your future with high-yield time deposits.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* MAIN CONTENT GRID */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        
                        {/* LEFT: INFO & RATES */}
                        <div className="xl:col-span-2 space-y-6">
                            
                            {/* ALERT BOX */}
                            <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-6 sm:p-8 shadow-lg transition-colors">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="shrink-0">
                                        <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center border border-amber-200 dark:border-amber-500/20">
                                            <Info className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                            Application Requires Assistance
                                        </h2>
                                        <p className="text-slate-600 dark:text-white/70 leading-relaxed">
                                            To ensure the security of your high-value transaction and to 
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400"> save you from paying high online processing fees</span>, 
                                            Time Deposit applications are currently handled directly by our staff.
                                        </p>
                                        <p className="text-slate-600 dark:text-white/70 leading-relaxed">
                                            Online payment gateways charge percentage-based convenience fees which can be significant for large Time Deposit amounts. By processing this directly with PMPC, you get the full value of your investment.
                                        </p>
                                        
                                        <div className="pt-2">
                                            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-white/80">
                                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                                <span>Your security and financial growth are our top priorities.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* INTEREST RATES DISPLAY */}
                            <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-6 sm:p-8 shadow-lg transition-colors">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-500" /> 
                                    Annual Interest Rates
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {rates.map((item) => (
                                        <div key={item.years} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center transition hover:scale-105 hover:bg-emerald-50/50 dark:hover:bg-white/10 cursor-default">
                                            <span className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wider font-semibold mb-1">
                                                {item.years} Year{item.years > 1 ? 's' : ''}
                                            </span>
                                            <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                                {(item.rate * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PROCESS STEPS */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StepCard number="01" title="Contact Us" desc="Call or visit the branch nearest to you to schedule an appointment." />
                                <StepCard number="02" title="Visit Branch" desc="Bring your valid ID and initial deposit amount." />
                                <StepCard number="03" title="Secure Certificate" desc="Receive your Time Deposit Certificate instantly." />
                            </div>
                        </div>

                        {/* RIGHT: CONTACT DETAILS */}
                        <div className="xl:col-span-1">
                            <div className="rounded-3xl border border-slate-200 bg-emerald-950 text-white p-6 shadow-xl relative overflow-hidden h-full flex flex-col">
                                {/* Background Decorations */}
                                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
                                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

                                <div className="relative z-10 space-y-6 flex-1">
                                    <h3 className="text-lg font-bold flex items-center gap-2 border-b border-white/10 pb-4">
                                        <Phone className="h-5 w-5 text-emerald-400" /> Contact Our Offices
                                    </h3>
                                    
                                    <div className="space-y-6 overflow-y-auto max-h-[600px] scrollbar-hide pr-1">
                                        {/* Main Office */}
                                        <OfficeCard 
                                            title="Main Office (Isabela)"
                                            address="Stall#2, Principe Bldg., Upi, Gamu, Isabela"
                                            contacts={["(+63) 965-953-2196"]}
                                        />

                                        {/* Cubao Office */}
                                        <OfficeCard 
                                            title="Cubao Satellite Office"
                                            address="20-E, 2nd Camarilla St. Brgy. San Roque, Cubao, Quezon City"
                                            contacts={["(02) 8848-9760", "(+63) 953-033-1580"]}
                                        />

                                        {/* Fort Magsaysay Office */}
                                        <OfficeCard 
                                            title="Fort Magsaysay Office"
                                            address="Purok 3, Brgy. Militar, Fort Magsaysay, Palayan, Nueva Ecija"
                                            contacts={["(+63) 968-263-5186"]}
                                        />
                                    </div>
                                </div>

                                <div className="relative z-10 mt-6 pt-6 border-t border-white/10 space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-emerald-100/80">
                                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <a href="mailto:peoplesmpcooperative@gmail.com" className="hover:text-white transition">
                                            peoplesmpcooperative@gmail.com
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-emerald-100/80">
                                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                            <Facebook className="h-4 w-4" />
                                        </div>
                                        <a 
                                            href="https://www.facebook.com/PMPCooperative" 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="hover:text-white transition"
                                        >
                                            facebook.com/PMPCooperative
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </PaymentReminderLayout>
        </SidebarLayout>
    );
}

// --- SUB-COMPONENTS ---

function StepCard({ number, title, desc }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 transition-colors hover:border-emerald-500/30 dark:hover:border-emerald-500/30 group">
            <div className="text-4xl font-bold text-slate-100 dark:text-white/10 mb-2 group-hover:text-emerald-50 dark:group-hover:text-white/20 transition-colors">{number}</div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{title}</h4>
            <p className="text-xs text-slate-500 dark:text-white/50 leading-relaxed">{desc}</p>
        </div>
    );
}

function OfficeCard({ title, address, contacts }) {
    return (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors">
            <h4 className="text-sm font-bold text-emerald-300 mb-2">{title}</h4>
            
            <div className="flex items-start gap-3 mb-3">
                <MapPin className="h-4 w-4 text-white/40 shrink-0 mt-0.5" />
                <p className="text-xs text-white/80 leading-relaxed">{address}</p>
            </div>

            <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-white/40 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    {contacts.map((contact, idx) => (
                        <p key={idx} className="text-xs text-white/80 font-mono">{contact}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}