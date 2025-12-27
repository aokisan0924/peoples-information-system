import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { 
    Trash2, ImagePlus, X, Sparkles, Loader2, Megaphone, 
    Calendar, Send, CheckCircle2, MoreHorizontal, ImageIcon 
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

export default function NewsIndex({ news }) {
    const { data, setData, post, processing, reset } = useForm({
        title: '',
        caption: '',
        images: [],
    });

    // --- STATE ---
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // --- HANDLERS ---
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + data.images.length > 4) {
            toast.error("Maximum of 4 images allowed.");
            return;
        }
        setData('images', [...data.images, ...files]);
    };

    const removeImage = (index) => {
        const newImages = data.images.filter((_, i) => i !== index);
        setData('images', newImages);
    };

    const submit = (e) => {
        e.preventDefault();
        if (!data.title || !data.caption) {
            toast.error("Title and caption are required.");
            return;
        }

        post(route('admin.news.store'), { 
            onSuccess: () => {
                reset();
                toast.success("News posted successfully!");
            },
            onError: () => toast.error("Failed to post news.")
        });
    };

    const handleDelete = (id) => {
        if (confirm("Delete this news post?")) {
            router.delete(route('admin.news.destroy', id), {
                onSuccess: () => toast.success("Post deleted.")
            });
        }
    };

    // AI Generator
    const generateWithAi = async () => {
        if (!aiTopic) return toast.error("Please enter a topic.");
        setIsAiGenerating(true);
        try {
            const res = await axios.post(route('admin.news.generate-ai'), { prompt: aiTopic });
            if (res.data.success) {
                setData(prev => ({ ...prev, title: res.data.title, caption: res.data.caption }));
                setShowAiModal(false);
                setAiTopic('');
                toast.success("Content generated!");
            }
        } catch (error) {
            toast.error("AI Generation failed.");
        } finally {
            setIsAiGenerating(false);
        }
    };

    return (
        <>
            <Head title="News Manager">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            
            <AdminSidebarLayout>
                <div className="space-y-6">
                    
                    {/* --- HEADER --- */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Megaphone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                News & Updates
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Broadcast announcements to the member portal.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-white shadow-sm">
                                <CheckCircle2 size={16} className="mr-2 text-emerald-500" />
                                {news.length} <span className="ml-1 hidden sm:inline">Published Posts</span>
                            </div>
                        </div>
                    </div>

                    {/* --- COMPOSER CARD --- */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
                        {/* Gradient Accent */}
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 opacity-30"></div>
                        
                        <div className="p-6">
                            <form onSubmit={submit} className="space-y-4">
                                {/* Title */}
                                <input 
                                    type="text" 
                                    placeholder="Write a catchy headline..." 
                                    className="w-full text-lg font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-white"
                                    value={data.title} 
                                    onChange={e => setData('title', e.target.value)} 
                                />
                                
                                {/* Body */}
                                <textarea 
                                    placeholder="What's happening in the cooperative today?" 
                                    className="w-full h-24 resize-none text-slate-600 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 bg-transparent border-none focus:ring-0 p-0 text-sm leading-relaxed"
                                    value={data.caption} 
                                    onChange={e => setData('caption', e.target.value)}
                                />

                                {/* Image Previews Area */}
                                <AnimatePresence>
                                    {data.images.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: 'auto' }} 
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                                        >
                                            {data.images.map((file, i) => (
                                                <div key={i} className="relative w-20 h-20 flex-shrink-0 group rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-white/10">
                                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Toolbar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex gap-2">
                                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition text-xs font-bold uppercase tracking-wide border border-slate-200 dark:border-white/10">
                                            <ImagePlus size={16} className="text-emerald-500" />
                                            <span>Photo</span>
                                            <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowAiModal(true)} 
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition text-xs font-bold uppercase tracking-wide border border-purple-200 dark:border-purple-500/20"
                                        >
                                            <Sparkles size={16} />
                                            <span>AI Assist</span>
                                        </button>
                                    </div>

                                    <button 
                                        disabled={processing} 
                                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-slate-200/50 dark:shadow-emerald-900/20 transition-all active:scale-95"
                                    >
                                        {processing ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
                                        <span>Post Update</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* --- FEED GRID --- */}
                    <div className="pb-10">
                        <div className="flex items-center gap-2 mb-4 ml-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recent Updates</h3>
                        </div>
                        
                        {news.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                                <div className="bg-slate-50 dark:bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Megaphone className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">No announcements yet.</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Create your first post above.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {news.map((item) => (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={item.id} 
                                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col hover:shadow-md transition-shadow group"
                                    >
                                        {/* Image Section - Adaptive Layout */}
                                        {item.images?.length > 0 && (
                                            <div className={`relative w-full ${item.images.length === 1 ? 'h-52' : 'h-48 grid grid-cols-2 gap-0.5 bg-slate-100 dark:bg-black'}`}>
                                                {item.images.slice(0, 2).map((img, idx) => (
                                                    <div key={idx} className="relative h-full w-full overflow-hidden">
                                                        <img src={`/storage/${img}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                                                        
                                                        {/* Counter Overlay if > 2 images */}
                                                        {item.images.length > 2 && idx === 1 && (
                                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                                                <div className="flex flex-col items-center text-white">
                                                                    <ImageIcon size={20} className="opacity-80 mb-1" />
                                                                    <span className="font-bold text-lg tracking-tight">+{item.images.length - 2}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Content Section */}
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                                    {item.caption}
                                                </p>
                                            </div>

                                            {/* Card Footer */}
                                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                                                    <Calendar size={14} />
                                                    <span>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => handleDelete(item.id)} 
                                                    className="p-2 -mr-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                    title="Delete Post"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- AI MODAL --- */}
                <AnimatePresence>
                    {showAiModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAiModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                exit={{ scale: 0.95, opacity: 0 }} 
                                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
                            >
                                {/* Decorative BG */}
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-500/5 dark:to-indigo-500/5 -z-10"></div>

                                <div className="text-center mb-6 pt-2">
                                    <div className="w-14 h-14 bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Sparkles size={28} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">AI Content Assistant</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Generate a professional announcement.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Topic / Event</label>
                                        <input 
                                            autoFocus 
                                            type="text" 
                                            placeholder="e.g. General Assembly on Oct 24..."
                                            className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                            value={aiTopic} 
                                            onChange={(e) => setAiTopic(e.target.value)} 
                                            onKeyDown={(e) => e.key === 'Enter' && generateWithAi()}
                                        />
                                    </div>

                                    <button 
                                        onClick={generateWithAi} 
                                        disabled={isAiGenerating} 
                                        className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {isAiGenerating ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                                        {isAiGenerating ? 'Writing Magic...' : 'Generate Draft'}
                                    </button>
                                </div>

                                <button onClick={() => setShowAiModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </AdminSidebarLayout>
        </>
    );
}