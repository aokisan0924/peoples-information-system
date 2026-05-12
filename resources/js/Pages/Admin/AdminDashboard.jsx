import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Users, Banknote, Wallet, TrendingUp, Activity, 
    Hourglass, PieChart as PieChartIcon, Download, 
    RefreshCw, ArrowUpRight, ArrowDownRight, CircleDot, ShieldCheck
} from 'lucide-react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

export default function AdminDashboard({ dashboardSummary, chartData, branchData, genderData, ageData, accountStatusData }) {
    
    // --- BUTTON FUNCTIONALITY ---
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = () => {
        setIsSyncing(true);
        router.reload({
            only: ['dashboardSummary', 'chartData', 'branchData', 'genderData', 'ageData', 'accountStatusData'],
            onFinish: () => setIsSyncing(false),
        });
    };

    const handleExport = () => { 
        window.location.href = '/admin/export/dashboard'; 
    };

    // --- FORMATTERS & COLORS ---
    const formatCurrency = (val) => {
        if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `₱${(val / 1000).toFixed(0)}k`;
        return `₱${val}`;
    };

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];
    
    const GENDER_CONFIG = {
        'Male':   { color: '#3b82f6', label: 'Male' },
        'Female': { color: '#f43f5e', label: 'Female' },
        'Unspecified': { color: '#94a3b8', label: 'Unspecified' },
    };

    // Ensure frontend safety for consolidated gender data
    const processedGenderData = useMemo(() => {
        if (!genderData) return [];
        const totals = { 'Male': 0, 'Female': 0, 'Unspecified': 0 };
        genderData.forEach(item => {
            const name = item.name;
            if (['Male', 'M'].includes(name)) totals['Male'] += item.value;
            else if (['Female', 'F'].includes(name)) totals['Female'] += item.value;
            else totals['Unspecified'] += item.value;
        });
        return Object.keys(totals).filter(k => totals[k] > 0).map(k => ({ name: k, value: totals[k] }));
    }, [genderData]);

    return (
        <>
            <Head title="Executive Dashboard" />
            <AdminSidebarLayout>
                <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
                    
                    {/* HEADER SECTION */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">PIS Dashboard</h1>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <CircleDot size={10} className="animate-pulse" /> Live Analytics
                                </span>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Consolidated cooperative data.</p>
                            </div>
                        </motion.div>

                        <div className="flex items-center gap-3">
                            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                                <Download size={16} /> Export Reports
                            </button>
                            <button onClick={handleSync} disabled={isSyncing} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? 'Syncing...' : 'Sync Data'}
                            </button>
                        </div>
                    </div>

                    {/* DYNAMIC STATS GRID */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                        <StatCard label="Total Members" value={dashboardSummary.totalMembers} icon={Users} color="blue" trend={dashboardSummary.trends.members} />
                        <StatCard label="Share Capital" value={dashboardSummary.totalShareCapital} prefix="₱" icon={Banknote} color="emerald" trend={dashboardSummary.trends.capital} />
                        <StatCard label="Savings Deposit" value={dashboardSummary.totalSavings} prefix="₱" icon={Wallet} color="amber" trend={dashboardSummary.trends.savings} />
                        <StatCard label="Time Deposit" value={dashboardSummary.totalTimeDeposits} prefix="₱" icon={Hourglass} color="purple" trend={dashboardSummary.trends.time} />
                        <StatCard label="Loan Revenue" value={dashboardSummary.totalLoanIncome} prefix="₱" icon={TrendingUp} color="rose" trend={dashboardSummary.trends.income} />
                    </motion.div>

                    {/* MAIN CHARTS SECTION */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="xl:col-span-8 rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/40 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div><h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Financial Velocity</h3><p className="text-xs text-slate-500 mt-1">6-month growth trajectory of key assets</p></div>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    {/* Safely fallback to Array if data is serialized improperly */}
                                    <AreaChart data={Array.isArray(chartData) ? chartData : Object.values(chartData)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:12}} dy={15} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:12}} tickFormatter={formatCurrency} />
                                        
                                        <Tooltip formatter={(value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)} contentStyle={{borderRadius:'16px', background:'#0f172a', border:'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }} labelStyle={{ color: '#94a3b8', fontWeight: 'bold', paddingBottom: '4px' }} />
                                        <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }} />

                                        <Area name="Loan Income" type="monotone" dataKey="loan_income" stroke="#3b82f6" strokeWidth={4} fillOpacity={0.1} fill="#3b82f6" />
                                        <Area name="Share Capital" type="monotone" dataKey="capital" stroke="#10b981" strokeWidth={2} fillOpacity={0} strokeDasharray="5 5" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-4 rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/40 p-8 shadow-sm">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Branch of Service</h3>
                            <p className="text-xs text-slate-500 mb-8">Active member distribution</p>
                            <div className="h-[300px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={branchData} innerRadius={85} outerRadius={110} paddingAngle={8} dataKey="value">
                                            {branchData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={10} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{borderRadius:'16px', background:'#0f172a', border:'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white">{dashboardSummary.totalMembers}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Members</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* DEMOGRAPHICS SECTION - 3 COLUMNS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        
                        {/* 1. GENDER */}
                        <ChartWrapper title="Gender" subtitle="Male / Female" icon={Users} iconColor="text-blue-500">
                            <ResponsiveContainer width="100%" height="100%">
                                {processedGenderData && processedGenderData.length > 0 ? (
                                    <PieChart>
                                        <Pie data={processedGenderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5} stroke="none" labelLine={false}>
                                            {processedGenderData.map((entry, index) => <Cell key={`cell-${index}`} fill={GENDER_CONFIG[entry.name]?.color || '#94a3b8'} cornerRadius={6} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{borderRadius:'12px', background:'#0f172a', border:'none'}} itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-2">{value}</span>} />
                                    </PieChart>
                                ) : ( <div className="flex h-full items-center justify-center text-slate-400">No data.</div> )}
                            </ResponsiveContainer>
                        </ChartWrapper>

                        {/* 2. AGE */}
                        <ChartWrapper title="Age Range" subtitle="Generational spread" icon={Activity} iconColor="text-amber-500">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ageData} margin={{ top: 20, right: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.05)" />
                                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fontSize:12, fill: '#94a3b8'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize:12, fill: '#94a3b8'}} />
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius:'12px', background:'#0f172a', border:'none'}} itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }} labelStyle={{ color: '#94a3b8', fontWeight: 'bold', paddingBottom: '4px' }} />
                                    <Bar dataKey="count" fill="#f59e0b" radius={[10, 10, 0, 0]} barSize={35} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartWrapper>

                        {/* 3. CORRECTED: ACCOUNT STATUS */}
                        <ChartWrapper title="Account Status" subtitle="Member verification standing" icon={ShieldCheck} iconColor="text-purple-500">
                            <ResponsiveContainer width="100%" height="100%">
                                {accountStatusData && accountStatusData.length > 0 ? (
                                    <BarChart data={accountStatusData} margin={{ top: 20, right: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:12, fill: '#94a3b8'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize:12, fill: '#94a3b8'}} />
                                        
                                        <Tooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                                            contentStyle={{borderRadius:'12px', background:'#0f172a', border:'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                                            itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#94a3b8', fontWeight: 'bold', paddingBottom: '4px' }}
                                        />
                                        
                                        <Bar name="Members" dataKey="value" fill="#8b5cf6" radius={[10, 10, 0, 0]} barSize={45} />
                                    </BarChart>
                                ) : ( <div className="flex h-full items-center justify-center text-slate-400">No data.</div> )}
                            </ResponsiveContainer>
                        </ChartWrapper>

                    </div>
                </div>
            </AdminSidebarLayout>
        </>
    );
}

// --- SUB-COMPONENTS ---
function StatCard({ label, value, prefix = "", icon: Icon, color, trend }) {
    const isNegative = trend?.includes('-');
    const trendColor = isNegative ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-500 bg-emerald-500/10';
    
    const colorStyles = {
        emerald: "bg-emerald-500/10 text-emerald-500", blue: "bg-blue-500/10 text-blue-500",
        amber: "bg-amber-500/10 text-amber-500", rose: "bg-rose-500/10 text-rose-500", purple: "bg-purple-500/10 text-purple-500",
    };

    return (
        <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/40 p-6 transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colorStyles[color]} transition-transform group-hover:scale-110`}>
                    <Icon size={22} />
                </div>
                {trend && (
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 ${trendColor}`}>
                        {isNegative ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />} 
                        {trend.split(' ')[0]}
                    </span>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                    <span className="text-lg opacity-40">{prefix}</span>
                    <CountUp end={value} duration={2} separator="," decimals={value % 1 !== 0 ? 2 : 0} />
                </div>
                {trend && <p className="text-[10px] text-slate-500 font-medium mt-2">{trend}</p>}
            </div>
        </div>
    );
}

function ChartWrapper({ title, subtitle, children, icon: Icon, iconColor }) {
    return (
        <motion.div 
            whileHover={{ y: -4 }}
            className="rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/40 p-8 shadow-sm transition-all"
        >
            <div className="flex items-center gap-4 mb-8">
                <div className={`p-3 rounded-2xl bg-slate-100 dark:bg-white/5 ${iconColor}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
                </div>
            </div>
            <div className="h-[300px] w-full">
                {children}
            </div>
        </motion.div>
    );
}