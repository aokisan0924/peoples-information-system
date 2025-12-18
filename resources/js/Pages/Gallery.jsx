import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUp,
    X,
    Images,
    Filter as FilterIcon,
    Camera,
    Users,
    Megaphone,
    HandHeart,
} from "lucide-react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function Gallery() {
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    const categories = [
        "All",
        "General Assembly",
        "Oath-Taking",
        "Information Drive",
        "Outreach",
    ];

    const images = [
        { src: "/images/gallery/gallery1.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery2.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery3.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery4.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery5.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery6.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery7.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery8.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery9.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery10.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery11.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery12.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery13.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery14.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery15.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery16.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery17.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery18.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery19.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery20.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery21.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery22.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery23.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery24.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery25.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery26.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery27.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery28.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery29.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery30.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery31.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery32.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery33.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery34.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery35.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery36.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery37.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery38.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery39.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery40.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery41.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery42.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery43.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery44.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery45.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery46.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery47.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery48.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery49.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery50.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery51.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery52.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery53.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery54.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery55.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery56.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery57.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery58.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery59.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery60.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery61.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery62.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery63.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery64.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery65.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery66.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery67.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery68.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery69.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery70.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery71.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery72.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery73.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery74.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery75.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery76.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery77.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery78.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery79.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery80.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery81.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery82.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery83.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery84.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery85.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery86.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery87.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery88.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery89.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery90.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery91.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery92.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery93.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery94.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery95.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery96.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery97.jpg", category: "General Assembly" },
        { src: "/images/gallery/gallery98.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery99.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery100.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery101.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery102.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery103.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery104.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery105.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery106.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery107.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery108.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery109.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery110.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery111.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery112.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery113.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery114.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery115.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery116.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery117.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery118.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery119.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery120.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery121.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery122.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery123.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery124.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery125.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery126.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery127.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery128.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery129.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery130.jpg", category: "Information Drive" },
        { src: "/images/gallery/gallery131.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery132.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery133.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery134.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery135.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery136.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery137.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery138.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery139.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery140.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery141.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery142.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery143.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery144.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery145.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery146.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery147.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery148.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery149.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery150.jpg", category: "Oath-Taking" },
        { src: "/images/gallery/gallery151.jpg", category: "Oath-Taking" },
    ];

    const filteredImages =
        selectedCategory === "All"
            ? images
            : images.filter((img) => img.category === selectedCategory);

    const pageSize = 12;
    const totalPages = Math.ceil(filteredImages.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const currentImages = filteredImages.slice(startIndex, startIndex + pageSize);

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
                                    <span>
                                        {images.length} photos archived
                                    </span>
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

                    {/* Decorative glows */}
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
                                <>
                                    {" "}
                                    in{" "}
                                    <span className="font-semibold">
                                        {selectedCategory}
                                    </span>
                                </>
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
                                            key={`${image.src}-${index}`}
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
                                                alt={`Gallery Image ${startIndex + index + 1}`}
                                                className="w-full h-40 sm:h-48 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between px-3 pb-2">
                                                <span className="text-[11px] font-medium text-white uppercase tracking-[0.12em]">
                                                    {image.category}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-[11px] text-white/90 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
                                                    <Camera className="h-3 w-3" />
                                                    View
                                                </span>
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

                                    <div className="flex flex-wrap gap-1">
                                        {Array.from({ length: totalPages }).map((_, idx) => {
                                            const page = idx + 1;
                                            return (
                                                <button
                                                    key={page}
                                                    type="button"
                                                    onClick={() => handlePageChange(page)}
                                                    className={`w-8 h-8 rounded-md text-sm font-medium border transition ${
                                                        currentPage === page
                                                            ? "bg-emerald-600 text-white border-emerald-600"
                                                            : "bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300"
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                    </div>

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

                                <div className="text-xs text-gray-500">
                                    Page{" "}
                                    <span className="font-semibold text-emerald-700">
                                        {currentPage}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-semibold text-emerald-700">
                                        {totalPages}
                                    </span>
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
                                <div className="mt-2 text-xs sm:text-sm text-gray-100/90 text-right pr-1">
                                    {selectedImage.category}
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
