import React, { useState, useEffect } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Head } from '@inertiajs/react';
import { Calendar, X, ZoomIn } from 'lucide-react';

export default function NewsFeed({ news }) {
    const [selectedPost, setSelectedPost] = useState(null);

    // Disable background scrolling when modal is open
    useEffect(() => {
        if (selectedPost) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [selectedPost]);

    return (
        <PublicLayout>
            <Head title="News & Updates" />
            
            {/* HERO SECTION */}
            <div className="bg-emerald-900 text-white py-16 px-4 text-center">
                <h1 className="text-4xl font-bold mb-2">News & Updates</h1>
                <p className="text-emerald-200">Stay updated with the latest happenings at PMPC.</p>
            </div>

            {/* NEWS GRID */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                {news.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">No news updates available yet.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {news.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedPost(item)}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer group"
                            >
                                {/* Thumbnail Image (First Image Only) */}
                                <div className="h-56 overflow-hidden bg-slate-100 relative">
                                    {item.images && item.images.length > 0 ? (
                                        <>
                                            <img 
                                                src={`/storage/${item.images[0]}`} 
                                                alt={item.title} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            {/* Multiple Images Indicator */}
                                            {item.images.length > 1 && (
                                                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                                                    +{item.images.length - 1} more
                                                </div>
                                            )}
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <div className="bg-white/90 p-2 rounded-full text-emerald-700 shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    <ZoomIn size={20} />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                                            No Image
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="font-bold text-xl text-slate-900 mb-3 leading-tight group-hover:text-emerald-700 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
                                        {item.caption}
                                    </p>
                                    
                                    <div className="pt-4 border-t border-slate-100 flex items-center text-xs text-slate-400 font-medium">
                                        <Calendar size={14} className="mr-1.5" />
                                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- FULL VIEW MODAL --- */}
            {selectedPost && (
                <div 
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedPost(null)}
                >
                    <div 
                        className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
                    >
                        {/* Close Button */}
                        <button 
                            onClick={() => setSelectedPost(null)}
                            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* LEFT: Scrollable Content (Images) */}
                        <div className="w-full md:w-2/3 bg-black flex flex-col overflow-y-auto max-h-[50vh] md:max-h-[90vh]">
                            {selectedPost.images && selectedPost.images.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                    {selectedPost.images.map((img, idx) => (
                                        <img 
                                            key={idx} 
                                            src={`/storage/${img}`} 
                                            alt={`Image ${idx + 1}`} 
                                            className="w-full h-auto object-contain"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-white/50 h-64">
                                    No Images
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Details Panel */}
                        <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 h-[50vh] md:h-auto">
                            
                            {/* Sticky Header inside modal */}
                            <div className="p-6 border-b border-slate-100 dark:border-white/10">
                                <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold mb-2">
                                    <Calendar size={16} />
                                    {new Date(selectedPost.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {selectedPost.title}
                                </h2>
                            </div>

                            {/* Scrollable Caption */}
                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-base">
                                    {selectedPost.caption}
                                </p>
                            </div>

                            {/* Footer / Share (Optional placeholder) */}
                            <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center">
                                <p className="text-xs text-slate-400">People's Multi-Purpose Cooperative News</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}