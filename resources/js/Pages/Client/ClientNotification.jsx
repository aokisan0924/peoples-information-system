import { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import { Bell, CheckCircle, Clock, Info, FileWarning, ArrowRight, Filter, Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import axios from "axios";
import SidebarLayout from "@/Layouts/SidebarLayout";
import PaymentReminderLayout from "@/Layouts/PaymentReminderLayout";

export default function ClientNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [meta, setMeta] = useState({ currentPage: 1, perPage: 10, lastPage: 1, total: 0 });
    const [filters, setFilters] = useState({ status: "all", type: "all", perPage: 10 });
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = async (page = 1, overrides = {}) => {
        setIsLoading(true);
        try {
            const { data } = await axios.get("/client/notifications/list", { params: { page, ...filters, ...overrides } });
            setNotifications(data.data || []);
            setMeta(data.meta || meta);
        } catch { toast.error("Load failed."); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchNotifications(1); }, []);

    const handleMarkAsRead = async (id) => {
        await axios.post(`/client/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllAsRead = async () => {
        await axios.post("/client/notifications/read-all");
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success("All read.");
    };

    return (
        <SidebarLayout>
            <PaymentReminderLayout>
                <Head title="Notifications" />
                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between shadow-sm dark:shadow-xl transition-colors">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><Bell className="h-6 w-6" /></div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications {meta.total > 0 && <span className="text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 rounded-full ml-2">{meta.total}</span>}</h1>
                                <p className="text-sm text-slate-500 dark:text-white/60">Stay updated with your account.</p>
                            </div>
                        </div>
                        <button onClick={handleMarkAllAsRead} className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 text-sm font-medium transition flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Mark all read</button>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-xl min-h-[300px] flex flex-col transition-colors">
                        {isLoading && <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-white/40"><Loader2 className="animate-spin mr-2"/> Loading...</div>}
                        {!isLoading && notifications.length === 0 && <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-white/40">No notifications.</div>}
                        {!isLoading && notifications.length > 0 && (
                            <ul className="divide-y divide-slate-100 dark:divide-white/5">
                                {notifications.map(n => (
                                    <li key={n.id} className={`p-5 transition ${n.isRead ? 'bg-white dark:bg-transparent' : 'bg-emerald-50/50 dark:bg-white/[0.03]'} hover:bg-slate-50 dark:hover:bg-white/5 relative`}>
                                        {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400"><Bell className="h-5 w-5" /></div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <h3 className={`text-sm font-semibold ${n.isRead ? 'text-slate-700 dark:text-white/70' : 'text-slate-900 dark:text-white'}`}>{n.title}</h3>
                                                    <span className="text-xs text-slate-400 dark:text-white/30">{n.createdAgo}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-white/60 mt-1">{n.message}</p>
                                                {!n.isRead && <button onClick={() => handleMarkAsRead(n.id)} className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium hover:underline">Mark as read</button>}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {/* Pagination - Reuse logic from other files */}
                        {meta.lastPage > 1 && (
                            <div className="border-t border-slate-200 dark:border-white/10 p-4 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                                <span className="text-xs text-slate-500 dark:text-white/50">Page {meta.currentPage} of {meta.lastPage}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => fetchNotifications(meta.currentPage - 1)} disabled={meta.currentPage <= 1} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white disabled:opacity-50"><ChevronLeft className="h-4 w-4"/></button>
                                    <button onClick={() => fetchNotifications(meta.currentPage + 1)} disabled={meta.currentPage >= meta.lastPage} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white disabled:opacity-50"><ChevronRight className="h-4 w-4"/></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </PaymentReminderLayout>
        </SidebarLayout>
    );
}