import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUp, X, Images, Filter as FilterIcon, Camera, Users, Megaphone, HandHeart,
} from "lucide-react";
import PublicLayout from "@/Layouts/PublicLayout";

// ACCEPT PROPS HERE
export default function Gallery({ dbImages = [] }) {
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    // Dynamic Categories based on unique values in DB, plus standard ones
    const categories = [
        "All",
        "General Assembly",
        "Oath-Taking",
        "Information Drive",
        "Outreach",
        "Events"
    ];

    // USE DB IMAGES INSTEAD OF HARDCODED ARRAY
    const filteredImages =
        selectedCategory === "All"
            ? dbImages
            : dbImages.filter((img) => img.category === selectedCategory);

    const pageSize = 12;
    const totalPages = Math.ceil(filteredImages.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const currentImages = filteredImages.slice(startIndex, startIndex + pageSize);

    // ... (Keep existing useEffects for scroll, etc.)
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollButton(window.scrollY > 300);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const fadeUp = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const categoryIcon = (category) => {
        if (category === "General Assembly") return <Users className="h-4 w-4" />;
        if (category === "Oath-Taking") return <HandHeart className="h-4 w-4" />;
        if (category === "Information Drive") return <Megaphone className="h-4 w-4" />;
        if (category === "Outreach") return <HandHeart className="h-4 w-4" />;
        return <Images className="h-4 w-4" />;
    };

    return (
        <>
            <Head title="Gallery - People's Multi-Purpose Cooperative">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <PublicLayout>
                {/* HERO */}
                <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-800 to-green-700 text-white py-16 sm:py-20 px-6 sm:px-10">
                    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.7fr,1.3fr] gap-10 items-center relative z-10">
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.22em] text-emerald-100 mb-4">
                                Stories in Photos · PMPC Gallery
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow">
                                Photo Gallery
                            </h1>

                            <p className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed">
                                Relive highlights from our General Assemblies, outreach programs,
                                information drives, and oath-taking ceremonies.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <a
                                    href="#gallery"
                                    className="inline-flex items-center justify-center rounded-lg px-6 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold bg-white text-green-900 shadow-md hover:bg-emerald-50 transition"
                                >
                                    Browse photos
                                </a>
                                <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-emerald-100/90">
                                    <Camera className="h-4 w-4" />
                                    <span>{dbImages.length} photos archived</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="lg:justify-self-end"
                        >
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl">
                                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100 mb-3">
                                    Highlights
                                </p>
                                <div className="space-y-3 text-sm text-emerald-50/95">
                                    <div className="flex items-center gap-3">
                                        <Images className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Events
                                            </p>
                                            <p className="text-base font-semibold">
                                                General Assembly, Oath-Taking, Information Drives
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FilterIcon className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Filter by Category
                                            </p>
                                            <p className="text-base font-semibold">
                                                Quickly browse by type of activity
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <HandHeart className="h-6 w-6 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Community
                                            </p>
                                            <p className="text-base font-semibold">
                                                Capturing moments of service and solidarity
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
                </section>

                {/* MAIN CONTENT */}
                <section
                    id="gallery"
                    className="bg-gradient-to-b from-emerald-50 via-white to-gray-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
                >
                    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
                        {/* Filter */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4 }}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        >
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-emerald-800">
                                    Browse by Event
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Filter photos by activity or view all memories together.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => setSelectedCategory(category)}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition ${
                                            selectedCategory === category
                                                ? "bg-emerald-600 text-white border-emerald-600 shadow"
                                                : "bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300"
                                        }`}
                                    >
                                        {categoryIcon(category)}
                                        <span>{category}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Info line */}
                        <div className="text-sm text-gray-600">
                            Showing{" "}
                            <span className="font-semibold text-emerald-700">
                                {filteredImages.length === 0 ? 0 : startIndex + 1}
                                {"–"}
                                {Math.min(startIndex + pageSize, filteredImages.length)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-emerald-700">
                                {filteredImages.length}
                            </span>{" "}
                            photos
                            {selectedCategory !== "All" && (
                                <> in <span className="font-semibold">{selectedCategory}</span></>
                            )}
                            .
                        </div>

                        {/* Grid */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                                <AnimatePresence>
                                    {currentImages.map((image, index) => (
                                        <motion.button
                                            key={`${image.id}-${index}`}
                                            type="button"
                                            className="group relative overflow-hidden rounded-2xl cursor-pointer bg-gray-100 shadow-sm hover:shadow-lg transition-shadow"
                                            whileHover={{ y: -3 }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setSelectedImage(image)}
                                        >
                                            <img
                                                src={image.src}
                                                alt={image.caption || "Gallery Image"}
                                                className="w-full h-40 sm:h-48 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between px-3 pb-2">
                                                <div className="flex flex-col text-left">
                                                    <span className="text-[10px] font-medium text-white uppercase tracking-[0.12em]">
                                                        {image.category}
                                                    </span>
                                                    {image.caption && <span className="text-[10px] text-white/80 line-clamp-1">{image.caption}</span>}
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {filteredImages.length === 0 && (
                                <div className="text-center text-gray-500 text-sm mt-8">
                                    No photos found for this category yet.
                                </div>
                            )}
                        </motion.div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1.5 rounded-md text-sm border ${
                                            currentPage === 1
                                                ? "text-gray-400 border-gray-200 cursor-not-allowed bg-white"
                                                : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                        }`}
                                    >
                                        Previous
                                    </button>
                                    {/* (Simplified pagination for brevity) */}
                                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1.5 rounded-md text-sm border ${
                                            currentPage === totalPages
                                                ? "text-gray-400 border-gray-200 cursor-not-allowed bg-white"
                                                : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                        }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Lightbox Modal */}
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedImage(null)}
                        >
                            <motion.div
                                className="relative max-w-4xl w-full"
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    className="absolute -top-3 -right-3 bg-white text-gray-700 p-2 rounded-full shadow hover:bg-gray-100 transition"
                                    onClick={() => setSelectedImage(null)}
                                >
                                    <X size={16} />
                                </button>
                                <img
                                    src={selectedImage.src}
                                    alt="Selected Gallery"
                                    className="w-full h-auto rounded-xl shadow-lg"
                                />
                                <div className="mt-2 flex justify-between items-center bg-black/50 p-2 rounded-lg backdrop-blur-md">
                                    <span className="text-xs sm:text-sm text-white font-bold">{selectedImage.category}</span>
                                    {selectedImage.caption && <span className="text-xs text-white/90">{selectedImage.caption}</span>}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Scroll-To-Top Button */}
                {showScrollButton && (
                    <motion.button
                        onClick={scrollToTop}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.1 }}
                        className="fixed bottom-6 right-6 bg-green-700 text-white p-3 rounded-full shadow-lg hover:bg-green-800 transition"
                    >
                        <ArrowUp size={24} />
                    </motion.button>
                )}
            </PublicLayout>
        </>
    );
}