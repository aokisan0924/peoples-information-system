import React from 'react';
import { Head } from '@inertiajs/react';
import { 
    Users, 
    Banknote, 
    Wallet, 
    TrendingUp, 
    ArrowUpRight, 
    Activity, 
    Hourglass,
    PieChart as PieChartIcon
} from 'lucide-react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import CountUp from 'react-countup';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

export default function AdminDashboard({ dashboardSummary, chartData, branchData }) {
    
    // Helper to format currency
    const formatCurrency = (val) => {
        if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `₱${(val / 1000).toFixed(0)}k`;
        return `₱${val}`;
    };

    // Colors for Pie Chart Slices
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

    return (
        <AdminSidebarLayout>
            <Head title="Admin Dashboard">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="space-y-6">
                
                {/* HERO TITLE */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Dashboard Overview
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Real-time financial performance and member statistics.
                        </p>
                    </div>
                    <div className="text-xs font-medium px-3 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg">
                        Last Updated: {new Date().toLocaleDateString()}
                    </div>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Members" value={dashboardSummary.totalMembers} icon={Users} color="blue" />
                    <StatCard label="Share Capital" value={dashboardSummary.totalShareCapital} prefix="₱" icon={Banknote} color="emerald" />
                    <StatCard label="Savings Deposit" value={dashboardSummary.totalSavings} prefix="₱" icon={Wallet} color="amber" />
                    <StatCard label="Time Deposit" value={dashboardSummary.totalTimeDeposits} prefix="₱" icon={Hourglass} color="purple" />
                </div>

                {/* CHARTS GRID (Row 1) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* CHART 1: FINANCIAL FLOW (Takes up 2/3 width) */}
                    <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm p-6 transition-colors">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-emerald-500" />
                                    Financial Inflow
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Capital, Savings & Time Deposits (6 Months)</p>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} tickFormatter={formatCurrency} />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', color: 'var(--tooltip-text)', borderRadius: '12px' }} formatter={(value) => [formatCurrency(value), ""]} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                                    <Area name="Share Capital" type="monotone" dataKey="capital" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCapital)" stackId="1" />
                                    <Area name="Savings" type="monotone" dataKey="savings" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" stackId="1" />
                                    <Area name="Time Deposit" type="monotone" dataKey="time" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTime)" stackId="1" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CHART 2: BRANCH DISTRIBUTION (Pie Chart) - Takes 1/3 width */}
                    <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm p-6 transition-colors flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <PieChartIcon className="h-5 w-5 text-blue-500" />
                                    Branch Service
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Member distribution by branch</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
                            {branchData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={branchData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {branchData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', color: 'var(--tooltip-text)', borderRadius: '12px' }}
                                        />
                                        <Legend 
                                            layout="horizontal" 
                                            verticalAlign="bottom" 
                                            align="center"
                                            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-slate-400 dark:text-white/30 text-sm">No branch data available</div>
                            )}
                            
                            {/* Center Label for Donut */}
                            {branchData.length > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardSummary.totalMembers}</p>
                                        <p className="text-[10px] uppercase text-slate-400 dark:text-white/40 font-bold tracking-wider">Total</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CHARTS GRID (Row 2) */}
                <div className="grid grid-cols-1">
                    {/* CHART 3: MEMBER GROWTH (Bar Chart) - Full Width */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm p-6 transition-colors">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    Member Acquisition Trend
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">New members registered per month</p>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                                <ArrowUpRight className="h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: 'var(--chart-hover)' }} contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', color: 'var(--tooltip-text)', borderRadius: '12px' }} />
                                    <Bar name="New Members" dataKey="members" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* CSS Variables for Chart Theming */}
                <style>{`
                    :root {
                        --chart-text: #64748b;
                        --chart-grid: #e2e8f0;
                        --chart-hover: rgba(0,0,0,0.05);
                        --tooltip-bg: #ffffff;
                        --tooltip-border: #e2e8f0;
                        --tooltip-text: #1e293b;
                    }
                    .dark {
                        --chart-text: #94a3b8;
                        --chart-grid: rgba(255,255,255,0.1);
                        --chart-hover: rgba(255,255,255,0.05);
                        --tooltip-bg: #0f172a;
                        --tooltip-border: rgba(255,255,255,0.1);
                        --tooltip-text: #f8fafc;
                    }
                `}</style>
            </div>
        </AdminSidebarLayout>
    );
}

// --- STAT CARD COMPONENT ---
function StatCard({ label, value, prefix = "", icon: Icon, color }) {
    const colorStyles = {
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
        rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
        purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    };

    return (
        <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
                    <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                        {prefix}<CountUp end={value} duration={1.5} separator="," decimals={value % 1 !== 0 ? 2 : 0} />
                    </div>
                </div>
                <div className={`p-3 rounded-2xl ${colorStyles[color]} transition-transform group-hover:scale-110`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
}