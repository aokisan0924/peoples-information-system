import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import { FileText, Download, Calendar, Clock, Search, RefreshCw, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

export default function Reports({ reports }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1); // Defaults to current month (1-12)
    const [targetYear, setTargetYear] = useState(new Date().getFullYear()); // Defaults to current year

    const months = [
        { val: 1, label: 'January' }, { val: 2, label: 'February' }, { val: 3, label: 'March' }, { val: 4, label: 'April' },
        { val: 5, label: 'May' }, { val: 6, label: 'June' }, { val: 7, label: 'July' }, { val: 8, label: 'August' },
        { val: 9, label: 'September' }, { val: 10, label: 'October' }, { val: 11, label: 'November' }, { val: 12, label: 'December' }
    ];

    const formatMonth = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch { return dateString; }
    };

    const filteredReports = reports.filter(r => {
        const readableMonth = formatMonth(r.report_month).toLowerCase();
        return r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               readableMonth.includes(searchTerm.toLowerCase());
    });

    const handleGenerate = (e) => {
        e.preventDefault();
        setShowModal(false);
        setIsGenerating(true);
        
        const monthName = months.find(m => m.val === parseInt(targetMonth))?.label;
        const loadingToast = toast.loading(`Generating report for ${monthName} ${targetYear}...`);
        
        // Send the specific month and year to the backend
        router.post(route('admin.reports.generate'), {
            month: targetMonth,
            year: targetYear
        }, {
            onSuccess: () => {
                toast.dismiss(loadingToast);
                toast.success('Report successfully generated!');
                setIsGenerating(false);
            },
            onError: (errors) => {
                toast.dismiss(loadingToast);
                toast.error(errors?.error || 'Failed to generate report.');
                setIsGenerating(false);
            }
        });
    };

    return (
        <AdminSidebarLayout>
            <Head title="Monthly Reports" />
            
            <div className="space-y-6">
                
                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <FileText className="h-6 w-6 text-purple-600" />
                            Executive Reports
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            AI-generated financial analysis and performance reviews.
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search month or title..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                        
                        {/* OPEN MODAL BUTTON */}
                        <button 
                            onClick={() => setShowModal(true)}
                            disabled={isGenerating}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                        >
                            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                            {isGenerating ? "Generating..." : "New Report"}
                        </button>
                    </div>
                </div>

                {/* CONTENT GRID */}
                {filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
                        <div className="h-16 w-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <FileText className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No reports found</h3>
                        <p className="text-slate-500 text-sm mt-1">Click "New Report" to create your first report.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredReports.map((report) => (
                            <div key={report.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/10 hover:border-purple-500/50 hover:shadow-lg transition-all flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 flex items-center justify-center">
                                        <FileText size={24} />
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                        <Calendar size={10} />
                                        {formatMonth(report.report_month)}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug mb-2">{report.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
                                    <Clock size={12} />
                                    <span>Generated {new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex-1"></div>
                                <a href={route('admin.reports.download', report.id)} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:bg-purple-600 dark:hover:bg-purple-500 transition-all">
                                    <Download size={16} /> Download PDF
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* GENERATE REPORT MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-sm p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <Calendar className="text-purple-500"/> Generate Report
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleGenerate} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest">Select Month</label>
                                <select 
                                    value={targetMonth} 
                                    onChange={e => setTargetMonth(e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl mt-1 text-sm focus:ring-purple-500"
                                >
                                    {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest">Select Year</label>
                                <select 
                                    value={targetYear} 
                                    onChange={e => setTargetYear(e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl mt-1 text-sm focus:ring-purple-500"
                                >
                                    {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            
                            <button type="submit" className="w-full mt-4 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-purple-500/20">
                                Analyze & Generate
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminSidebarLayout>
    );
}