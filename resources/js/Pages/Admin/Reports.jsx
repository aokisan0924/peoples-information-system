import React, { useState } from "react";
import { Head } from "@inertiajs/react";
import AdminSidebarLayout from "@/Layouts/AdminSidebarLayout";
import { FileText, Download, Calendar, Clock, Search } from "lucide-react";

export default function Reports({ reports }) {
    const [searchTerm, setSearchTerm] = useState("");

    // Filter reports based on search input
    const filteredReports = reports.filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.report_month.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    
                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search reports..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* CONTENT GRID */}
                {filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
                        <div className="h-16 w-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <FileText className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No reports found</h3>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your search terms or check back next month.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredReports.map((report) => (
                            <div key={report.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/10 hover:border-purple-500/50 dark:hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 flex flex-col">
                                
                                {/* Icon & Meta Tag */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <FileText size={24} />
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        <Calendar size={10} />
                                        {report.report_month}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug mb-2 group-hover:text-purple-600 transition-colors">
                                    {report.title}
                                </h3>
                                
                                {/* Timestamp */}
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
                                    <Clock size={12} />
                                    <span>Generated {new Date(report.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>

                                {/* Spacer to push button down */}
                                <div className="flex-1"></div>

                                {/* Action Button */}
                                <a 
                                    href={route('admin.reports.download', report.id)} 
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:bg-purple-600 dark:hover:bg-purple-500 hover:text-white transition-all active:scale-95"
                                >
                                    <Download size={16} />
                                    Download PDF
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminSidebarLayout>
    );
}