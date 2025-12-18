import { useEffect, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { 
    CheckCircle2, XCircle, Clock, TrendingUp, Banknote, History, 
    ArrowRight, Activity, Calendar 
} from "lucide-react";
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";
import axios from "axios";
import SidebarLayout from "@/Layouts/SidebarLayout";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";

export default function ClientDashboard() {
    const [capitalTotal, setCapitalTotal] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { props } = usePage();
    const auth = props.auth || {};
    const memberSource = auth.member || auth.user || {};

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [capitalRes, transRes, chartRes] = await Promise.all([
                    axios.get("/client/capital-total"),
                    axios.get("/client/recent-transactions", { params: { preview: true } }),
                    axios.get("/client/capital-chart"),
                ]);
                
                setCapitalTotal(capitalRes.data.total || 0);
                setTransactions(transRes.data || []);
                setChartData(chartRes.data || []);
            } catch (error) {
                console.error("Error loading dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const getDisplayName = () => {
        const { firstName, lastName, name, username } = memberSource;
        const fullName = `${firstName || ""} ${lastName || ""}`.trim();
        return fullName || name || username || "Member";
    };

    const getStatusVisuals = (status) => {
        const s = (status || "").toLowerCase();
        if (["paid", "posted", "released", "approved"].includes(s)) return { icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" };
        if (s === "pending") return { icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />, className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" };
        if (["cancelled", "failed", "declined"].includes(s)) return { icon: <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />, className: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" };
        return { icon: <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />, className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20" };
    };

    const formatCurrency = (amount) => Number(amount || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
    const monthsRecorded = chartData.length;
    const averageContribution = chartData.length > 0 ? chartData.reduce((sum, row) => sum + (Number(row.amount) || 0), 0) / chartData.length : 0;

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Dashboard">
                    <link rel="icon" href="/images/logo/pis_logo.png" />
                </Head>
                
                {/* REMOVED: min-h-screen bg-gradient... (SidebarLayout handles bg) */}
                <div className="space-y-6">
                    
                    {/* HERO SECTION */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-[0_20px_60px_-40px_rgba(0,0,0,.8)] transition-colors">
                        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                        Client Dashboard
                                    </span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                                    Welcome back, {getDisplayName()}
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-white/60 mt-2 max-w-xl leading-relaxed">
                                    Here's a unified view of your cooperative accounts, share capital growth, and recent financial activity.
                                </p>
                            </div>

                            <div className="flex flex-col items-start md:items-end gap-3">
                                <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">Total Share Capital</div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(capitalTotal)}</div>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Banknote className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SUMMARY CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryCard label="Months Recorded" value={monthsRecorded} subtext="Total active months" icon={Calendar} />
                        <SummaryCard label="Avg. Contribution" value={formatCurrency(averageContribution)} subtext="Monthly average" icon={TrendingUp} />
                        <SummaryCard label="Recent Activity" value={transactions.length} subtext="Transactions found" icon={History} />
                    </div>

                    {/* MAIN GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* CHART SECTION */}
                        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm dark:shadow-xl overflow-hidden flex flex-col transition-colors">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h2 className="font-semibold text-slate-900 dark:text-white">Capital Growth</h2>
                                </div>
                                <div className="text-xs text-slate-400 dark:text-white/40">Monthly Overview</div>
                            </div>
                            
                            <div className="p-6 flex-1 min-h-[300px]">
                                {isLoading ? (
                                    <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-white/30">
                                        <Activity className="animate-pulse w-6 h-6" />
                                    </div>
                                ) : chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" vertical={false} />
                                            <XAxis 
                                                dataKey="month" 
                                                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                                                axisLine={{ stroke: '#cbd5e1' }}
                                                tickLine={false}
                                                dy={10}
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(128,128,128,0.1)' }}
                                                contentStyle={{ 
                                                    backgroundColor: '#1e293b', 
                                                    borderColor: '#334155', 
                                                    borderRadius: '12px',
                                                    color: '#fff',
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                                }}
                                                itemStyle={{ color: '#34d399' }}
                                                formatter={(value) => [formatCurrency(value), "Amount"]}
                                            />
                                            <Bar 
                                                dataKey="amount" 
                                                radius={[4, 4, 0, 0]} 
                                                fill="#10b981" 
                                                barSize={40}
                                                activeBar={{ fill: '#34d399' }}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/30 gap-2">
                                        <TrendingUp className="w-8 h-8 opacity-20" />
                                        <p className="text-sm">No contribution data available yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RECENT TRANSACTIONS */}
                        <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm dark:shadow-xl overflow-hidden flex flex-col transition-colors">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                                        <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h2 className="font-semibold text-slate-900 dark:text-white">Recent History</h2>
                                </div>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
                                {transactions.length > 0 ? (
                                    <div className="space-y-3">
                                        {transactions.map((txn, index) => {
                                            const visuals = getStatusVisuals(txn.status);
                                            return (
                                                <div key={index} className="group p-3 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-white/5 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${visuals.className}`}>
                                                                {visuals.icon}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900 dark:text-white">{txn.particulars || txn.type || "Transaction"}</div>
                                                                <div className="text-xs text-slate-500 dark:text-white/40 font-mono">{txn.date}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(txn.amount)}</div>
                                                    </div>
                                                    <div className="flex items-center justify-between pl-11">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border ${visuals.className}`}>{txn.status || "—"}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/30 py-10 gap-2">
                                        <History className="w-8 h-8 opacity-20" />
                                        <p className="text-sm">No recent transactions found.</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                <Link href={route("member.transactions.index")} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-900/20">
                                    View All Transactions <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </PaymentReminderLayout>
        </SidebarLayout>
    );
}

function SummaryCard({ label, value, subtext, icon: Icon }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors group">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
                <div className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase tracking-wide">{label}</div>
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</div>
                <div className="text-[10px] text-slate-400 dark:text-white/40">{subtext}</div>
            </div>
        </div>
    );
}