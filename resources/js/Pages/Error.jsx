import React from "react";
import { Head, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ShieldAlert, SearchX, ServerCrash, Wrench, ArrowLeft, Home } from "lucide-react";

export default function ErrorPage ({ status }) {
    const errorConfig = {
        403: {
            title: "Access Denied",
            description: "You do not have the required permissions to view this page. If you believe this is a mistake, please contact the system administrator.",
            icon: ShieldAlert,
            color: "text-rose-500",
            bgGlow: "bg-rose-500/20",
            borderColor: "border-rose-500/20",
            badge: "403 Forbidden"
        },
        404: {
            title: "Page Not Found",
            description: "The page you are looking for doesn't exist, has been renamed, or is temporarily unavailable.",
            icon: SearchX,
            color: "text-amber-500",
            bgGlow: "bg-amber-500/20",
            borderColor: "border-amber-500/20",
            badge: "404 Not Found"
        },
        500: {
            title: "Server Error",
            description: "Whoops, something went wrong on our servers. Our engineering team has been notified and is looking into it.",
            icon: ServerCrash,
            color: "text-indigo-500",
            bgGlow: "bg-indigo-500/20",
            borderColor: "border-indigo-500/20",
            badge: "500 Internal Error"
        },
        503: {
            title: "Service Unavailable",
            description: "We are currently undergoing scheduled maintenance to improve the system. We will be back online shortly.",
            color: "text-blue-500",
            bgGlow: "bg-blue-500/20",
            borderColor: "border-blue-500/20",
            badge: "503 Maintenance"
        }
    };

    const config = errorConfig[status] || errorConfig[404];
    const Icon = config.icon;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <Head title={config.title} />

            {/* Background Glowing Effects */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full blur-[100px] ${config.bgGlow} pointer-events-none`} />

            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-lg"
            >
                <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] border shadow-2xl overflow-hidden p-8 sm:p-12 text-center ${config.borderColor}`}>
                    
                    {/* Animated Icon Container */}
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [-10, 10, 0] }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className={`w-24 h-24 mx-auto rounded-3xl bg-slate-50 dark:bg-slate-800 shadow-inner flex items-center justify-center border ${config.borderColor} mb-8`}
                    >
                        <Icon size={48} className={config.color} strokeWidth={1.5} />
                    </motion.div>

                    {/* Badge */}
                    <motion.span 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                        className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 ${config.color} mb-4`}
                    >
                        {config.badge}
                    </motion.span>

                    {/* Text Content */}
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                        {config.title}
                    </h1>
                    <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
                        {config.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button 
                            onClick={() => window.history.back()}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                        >
                            <ArrowLeft size={18} /> Go Back
                        </button>
                        
                        {/* Send them to the main portal based on their role/status, defaulting to login page if unsure */}
                        <Link 
                            href="/"
                            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 shadow-lg ${
                                status === 403 
                                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-500/25' 
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
                            }`}
                        >
                            <Home size={18} /> Return to Safety
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};