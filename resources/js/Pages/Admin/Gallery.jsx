import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { 
    Trash2, Upload, Filter, Image as ImageIcon, CloudUpload, Search, 
    ZoomIn, Loader2, Plus, X, ChevronLeft, ChevronRight, CheckCircle2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function GalleryIndex({ images: initialImages = [], filters }) {
    const { data, setData, post, processing, reset, clearErrors } = useForm({
        category: 'General Assembly',
        caption: '',
        images: [],
    });

    // --- STATE ---
    const [images, setImages] = useState(initialImages);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    const fileInputRef = useRef(null);

    const categories = [
        "General Assembly",
        "Oath-Taking",
        "Information Drive",
        "Outreach",
        "Events"
    ];

    // --- EFFECTS ---
    useEffect(() => {
        setImages(initialImages);
    }, [initialImages]);

    // --- FILTERING (Client-side) ---
    const filteredImages = useMemo(() => {
        return images.filter(img => {
            const matchesSearch = search === '' || 
                img.caption?.toLowerCase().includes(search.toLowerCase()) ||
                img.category?.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || img.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [images, search, categoryFilter]);

    // --- PAGINATION ---
    const total = filteredImages.length;
    const totalPages = Math.ceil(total / perPage) || 1;
    const paginatedImages = filteredImages.slice(
        (currentPage - 1) * perPage, 
        currentPage * perPage
    );

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // --- HANDLERS ---
    const openModal = () => {
        reset();
        clearErrors();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setData('images', Array.from(e.target.files));
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setData('images', Array.from(e.dataTransfer.files));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (data.images.length === 0) {
            toast.error("Please select at least one image.");
            return;
        }

        post(route('admin.gallery.store'), {
            onSuccess: () => {
                toast.success("Images uploaded successfully!");
                closeModal();
            },
            onError: () => toast.error("Failed to upload images.")
        });
    };

    const handleDelete = (id) => {
        if (confirm('Delete this image permanently?')) {
            router.delete(route('admin.gallery.destroy', id), {
                onSuccess: () => toast.success("Image deleted.")
            });
        }
    };

    return (
        <>
            <Head title="Gallery Manager">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            
            <AdminSidebarLayout>
                <div className="space-y-6">
                    
                    {/* --- HEADER --- */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ImageIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                Gallery Manager
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Upload and manage cooperative photos.
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={openModal}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>Upload Photos</span>
                            </button>
                        </div>
                    </div>

                    {/* --- FILTERS --- */}
                    <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-4 shadow-sm transition-colors">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-white/40" />
                                <input 
                                    type="text" 
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    placeholder="Search caption..." 
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-sm"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="w-full md:w-64 relative">
                                <Filter className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-white/40" />
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm appearance-none cursor-pointer"
                                >
                                    <option value="All">All Categories</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            {/* Per Page */}
                            <div className="w-full md:w-32">
                                <select
                                    value={perPage}
                                    onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm cursor-pointer"
                                >
                                    <option value={10}>10 Rows</option>
                                    <option value={20}>20 Rows</option>
                                    <option value={50}>50 Rows</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* --- DATA DISPLAY --- */}
                    <div className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm overflow-hidden transition-colors">
                        
                        {/* 1. DESKTOP TABLE */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Thumbnail</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Caption</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-200">
                                    {paginatedImages.length === 0 ? (
                                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No images found.</td></tr>
                                    ) : (
                                        paginatedImages.map((img) => (
                                            <tr key={img.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="h-12 w-16 bg-slate-100 dark:bg-white/10 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                                                        <img src={`/storage/${img.image_path}`} alt="thumbnail" className="h-full w-full object-cover" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                                        {img.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="text-slate-900 dark:text-white truncate max-w-xs block" title={img.caption}>{img.caption || '—'}</span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <a href={`/storage/${img.image_path}`} target="_blank" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-emerald-600 transition-colors">
                                                            <ZoomIn size={16} />
                                                        </a>
                                                        <button onClick={() => handleDelete(img.id)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-600 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 2. MOBILE CARD LIST (Grid Style for Gallery) */}
                        <div className="block sm:hidden p-4">
                            {paginatedImages.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 dark:text-slate-400">No images found.</div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {paginatedImages.map((img) => (
                                        <div key={img.id} className="relative group bg-slate-50 dark:bg-white/5 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                                            <div className="aspect-square w-full">
                                                <img src={`/storage/${img.image_path}`} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                                                <p className="text-[10px] text-white/80 uppercase tracking-wider font-bold mb-0.5">{img.category}</p>
                                                <p className="text-xs text-white truncate">{img.caption || 'No Caption'}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(img.id)}
                                                className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full backdrop-blur-md"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* PAGINATION */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                Page <span className="font-semibold text-slate-900 dark:text-white">{currentPage}</span> of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handlePageChange(currentPage - 1)} 
                                    disabled={currentPage <= 1} 
                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={() => handlePageChange(currentPage + 1)} 
                                    disabled={currentPage >= totalPages} 
                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-50 transition"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- UPLOAD MODAL --- */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={closeModal} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5 shrink-0">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Photos</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Add new images to the gallery.</p>
                                    </div>
                                    <button onClick={closeModal} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition"><X size={20} className="text-slate-400"/></button>
                                </div>

                                <div className="p-6 overflow-y-auto">
                                    <form onSubmit={submit} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Category</label>
                                            <select 
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                value={data.category}
                                                onChange={e => setData('category', e.target.value)}
                                            >
                                                {categories.map(cat => <option key={cat} value={cat} className="text-slate-900">{cat}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Caption</label>
                                            <textarea 
                                                rows="3"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                                                placeholder="Optional description..."
                                                value={data.caption}
                                                onChange={e => setData('caption', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Images</label>
                                            <div 
                                                className={`relative min-h-[160px] border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center text-center p-4
                                                    ${isDragging 
                                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
                                                        : 'border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 hover:border-emerald-400'
                                                    }`}
                                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                                onDrop={onDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <input 
                                                    type="file" 
                                                    multiple 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange} 
                                                />
                                                
                                                {data.images.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <div className="w-10 h-10 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                                            <CheckCircle2 size={20} />
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{data.images.length} files selected</p>
                                                        <p className="text-xs text-slate-500">Click to change</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <CloudUpload size={24} className="mx-auto text-slate-400" />
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Click to upload or drag here</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-end gap-3">
                                            <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 transition-colors">Cancel</button>
                                            <button 
                                                type="submit" 
                                                disabled={processing || data.images.length === 0}
                                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95"
                                            >
                                                {processing ? 'Uploading...' : 'Upload Photos'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </AdminSidebarLayout>
        </>
    );
}