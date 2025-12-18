import { useState, useEffect } from "react";
import { Head, Link, usePage, useForm } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ArrowUp, HelpCircle, Users, Wallet } from "lucide-react";
import CountUp from "react-countup";
import PublicLayout from "@/Layouts/PublicLayout";

const slides = [
    {
        image: "/images/home/HomePageSlideShow/slide1.jpg",
        title: "Easy & Flexible Loans",
        description:
            "Low-interest rates and quick approvals to help you achieve your goals.",
    },
    {
        image: "/images/home/HomePageSlideShow/slide2.jpg",
        title: "Secure Savings & Investments",
        description:
            "Grow your money with our high-yield savings and investment options.",
    },
    {
        image: "/images/home/HomePageSlideShow/slide3.jpg",
        title: "Community Development",
        description:
            "Join a cooperative that supports local businesses and livelihoods.",
    },
];

const partners = [
    { src: "/images/home/partners/ph_airforce_logo.png", alt: "Philippine Air Force" },
    { src: "/images/home/partners/ph_army_logo.png", alt: "Philippine Army" },
    { src: "/images/home/partners/ph_navy_logo.png", alt: "Philippine Navy" },
    { src: "/images/home/partners/afp_logo.png", alt: "Armed Forces of the Philippines" },
    { src: "/images/home/partners/reservist_logo.png", alt: "Reservist" },
    { src: "/images/home/partners/ocd_logo.png", alt: "CDEA" },
    { src: "/images/home/partners/paramount_logo.png", alt: "Paramount" },
    { src: "/images/home/partners/st_peter_logo.png", alt: "St. Peter Life Plan" },
];

const howDoIOptions = [
    { label: "Apply for Membership", link: "/member-benefit" },
    { label: "Loan Application", link: "/loan-information" },
    { label: "Savings Deposit Account", link: "/savings-deposit" },
    { label: "Share Capital Deposit Account", link: "/share-capital" },
    { label: "Time Deposit Account", link: "/time-deposit" },
    { label: "Petty Cash Loan", link: "/petty-cash" },
    { label: "St. Peter Life Plan", link: "/st-peter-life-plan" },
    { label: "Know More About PMPC Products & Services", link: "/products-services" },
];

export default function Home() {
    const { stats = {}, status } = usePage().props;
    const totalMembers = Number(stats.totalMembers ?? 0);
    const totalLoanAvailment = Number(stats.totalLoanAvailment ?? 0);

    const [currentSlide, setCurrentSlide] = useState(0);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [selected, setSelected] = useState("Select Question");
    const [isOpen, setIsOpen] = useState(false);

    const marqueePartners = [...partners, ...partners];

    const submit = (e) => {
        e.preventDefault();
        post(route("member.login.post"), {
            onFinish: () => reset("password"),
        });
    };

    useEffect(() => {
        const interval = setInterval(
            () => setCurrentSlide((prev) => (prev + 1) % slides.length),
            10000
        );

        const handleScroll = () => setShowScrollButton(window.scrollY > 300);

        window.addEventListener("scroll", handleScroll);

        return () => {
            clearInterval(interval);
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const currentSlideData = slides[currentSlide];

    return (
        <>
            <Head title="Home - People's MPC">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <PublicLayout>
                {/* HERO SECTION */}
                <section className="relative w-full overflow-hidden bg-gray-950">
                    <div className="absolute inset-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlideData.image}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 1 }}
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                    backgroundImage: `url(${currentSlideData.image})`,
                                }}
                            />
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-green-900/60" />
                    </div>

                    <div className="relative container mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-24">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                            {/* Left - Hero Copy */}
                            <div className="space-y-5 sm:space-y-6">
                                <span className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-xs sm:text-sm font-medium text-green-300 ring-1 ring-green-500/40">
                                    Kaagapay mo sa Pag-Asenso!
                                </span>

                                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                                    People&apos;s MPC,{" "}
                                    <span className="text-green-300">
                                        your partner in financial growth.
                                    </span>
                                </h1>

                                <p className="text-sm sm:text-base lg:text-lg text-gray-200 max-w-xl">
                                    Accessible loans, secure savings, and lifetime membership designed
                                    to support uniformed personnel, families, and the community.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-green-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-green-500/30 hover:bg-green-400 transition"
                                    >
                                        Become a Member
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Link>
                                    <Link
                                        href="/calculator"
                                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/30 text-white text-sm sm:text-base hover:bg-white/10 transition"
                                    >
                                        Loan Calculator
                                    </Link>
                                </div>

                                {/* Slide caption */}
                                <div className="mt-2 text-xs sm:text-sm text-gray-300">
                                    <span className="font-semibold text-green-300">
                                        {currentSlideData.title}
                                    </span>
                                    <span className="mx-1">•</span>
                                    {currentSlideData.description}
                                </div>

                                {/* Slide dots */}
                                <div className="flex items-center gap-2 mt-3">
                                    {slides.map((_, index) => (
                                        <button
                                            key={index}
                                            className={`h-2.5 w-2.5 rounded-full transition-all ${
                                                currentSlide === index
                                                    ? "bg-green-400 w-6"
                                                    : "bg-gray-500/60"
                                            }`}
                                            onClick={() => setCurrentSlide(index)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Right - PMPC Glass Logo Card */}
                            <div className="flex justify-center lg:justify-end">
                                <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden">

                                    {/* Soft Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/20 via-transparent to-emerald-600/10 pointer-events-none"></div>

                                    {/* Logo */}
                                    <div className="relative flex justify-center mb-4">
                                        <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-md flex items-center justify-center p-3">
                                            <img
                                                src="/images/logo/pis_logo.png"
                                                alt="PMPC Logo"
                                                className="h-full w-full object-contain drop-shadow-lg"
                                            />
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h2 className="relative text-xl sm:text-2xl font-bold text-white leading-tight drop-shadow-lg">
                                        People’s Multi-Purpose Cooperative
                                    </h2>

                                    {/* Tagline */}
                                    <p className="relative text-[12px] sm:text-sm text-emerald-200 mt-2 tracking-wide font-medium">
                                        Kaagapay mo sa Pag-Asenso
                                    </p>

                                    {/* Short one-liner */}
                                    <p className="relative text-sm text-gray-200/80 mt-4 leading-snug">
                                        Serving AFP since 2003.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* HOW DO I – CARD */}
                <section className="w-full bg-gray-50 border-b border-gray-100">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10 flex justify-center">
                        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-100 px-5 sm:px-7 py-6 sm:py-7 flex flex-col md:flex-row gap-5 md:gap-7 items-start md:items-center">
                            {/* Left side: label + icon */}
                            <div className="flex items-start gap-3 w-full md:w-auto">
                                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-green-100 via-emerald-50 to-white flex items-center justify-center ring-2 ring-green-100">
                                    <HelpCircle className="text-green-700 h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-gray-500">
                                        Need help?
                                    </p>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                                        How do I…
                                    </h3>
                                    <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-xs">
                                        Quickly jump to the action you want to do inside
                                        People&apos;s MPC.
                                    </p>
                                </div>
                            </div>

                            {/* Right side: dropdown */}
                            <div className="relative w-full">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen((prev) => !prev)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm sm:text-base shadow-sm hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition"
                                >
                                    <span className="truncate">{selected}</span>
                                    <ChevronDown
                                        className={`h-4 w-4 text-gray-500 transform transition-transform ${
                                            isOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {/* Dropdown list */}
                                {isOpen && (
                                    <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {howDoIOptions.map((option, index) => (
                                            <Link
                                                key={index}
                                                href={option.link}
                                                className="block px-4 py-2.5 text-sm hover:bg-green-50 text-gray-700"
                                                onClick={() => {
                                                    setSelected(option.label);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                {option.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                <p className="mt-2 text-[11px] sm:text-xs text-gray-400">
                                    You will be redirected to the selected page.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PRODUCT / FEATURES SECTION */}
                <section className="bg-gray-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    Products & Services
                                </h2>
                                <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl">
                                    From membership to loans and savings, PMPC offers flexible
                                    programs tailored to your needs.
                                </p>
                            </div>

                            <Link
                                href="/products-services"
                                className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-600"
                            >
                                View all products
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            {/* 1 — Lifetime Membership */}
                            <motion.article
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0 * 0.12 }}
                                whileHover={{ y: -3 }}
                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="relative h-40 sm:h-48 overflow-hidden">
                                    <img
                                        src="/images/home/features/bepart_pmpc.jpg"
                                        alt="Lifetime Membership"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                                    <h3 className="absolute bottom-3 left-4 text-lg sm:text-xl font-semibold text-white drop-shadow">
                                        Lifetime Membership
                                    </h3>
                                </div>

                                <div className="p-5 sm:p-6 flex flex-col flex-1">
                                    <p className="text-sm sm:text-base text-gray-600 flex-1">
                                        Enjoy lifetime access to cooperative benefits, dividends, and
                                        member-focused services.
                                    </p>

                                    <div className="mt-4">
                                        <Link
                                            href="/member-benefit"
                                            className="inline-flex items-center text-sm font-medium text-green-700 group-hover:text-green-600"
                                        >
                                            Learn more
                                            <ChevronRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.article>

                            {/* 2 — Loans */}
                            <motion.article
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 1 * 0.12 }}
                                whileHover={{ y: -3 }}
                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="relative h-40 sm:h-48 overflow-hidden">
                                    <img
                                        src="/images/home/features/soldier_loan.jpg"
                                        alt="Loan Programs"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                                    <h3 className="absolute bottom-3 left-4 text-lg sm:text-xl font-semibold text-white drop-shadow">
                                        Loan Programs
                                    </h3>
                                </div>

                                <div className="p-5 sm:p-6 flex flex-col flex-1">
                                    <p className="text-sm sm:text-base text-gray-600 flex-1">
                                        Transparent loan offerings with fair rates and structured terms
                                        for your various needs.
                                    </p>

                                    <div className="mt-4">
                                        <Link
                                            href="/loan-information"
                                            className="inline-flex items-center text-sm font-medium text-green-700 group-hover:text-green-600"
                                        >
                                            Learn more
                                            <ChevronRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.article>

                            {/* 3 — Savings Deposit */}
                            <motion.article
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 2 * 0.12 }}
                                whileHover={{ y: -3 }}
                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="relative h-40 sm:h-48 overflow-hidden">
                                    <img
                                        src="/images/home/features/savings.jpg"
                                        alt="Savings Deposit"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                                    <h3 className="absolute bottom-3 left-4 text-lg sm:text-xl font-semibold text-white drop-shadow">
                                        Savings Deposit
                                    </h3>
                                </div>

                                <div className="p-5 sm:p-6 flex flex-col flex-1">
                                    <p className="text-sm sm:text-base text-gray-600 flex-1">
                                        Grow your money with secure savings deposits and competitive
                                        interest credited every 6 months.
                                    </p>

                                    <div className="mt-4 space-y-2">
                                        <Link
                                            href="/savings-deposit"
                                            className="inline-flex items-center text-sm font-medium text-green-700 group-hover:text-green-600"
                                        >
                                            Learn more
                                            <ChevronRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.article>
                        </div>
                    </div>
                </section>

                {/* PARTNERS MARQUEE */}
                <section className="bg-white border-y border-gray-100">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
                        <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-gray-500 text-center mb-6 sm:mb-8">
                            Our Trusted Partners
                        </p>

                        <div className="relative overflow-hidden">
                            {/* Fade edges for nicer look */}
                            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-16 bg-gradient-to-r from-white to-transparent" />
                            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-16 bg-gradient-to-l from-white to-transparent" />

                            <motion.div
                                className="flex items-center gap-10 sm:gap-14 md:gap-16"
                                initial={{ x: 0 }}
                                animate={{ x: "-50%" }}
                                transition={{
                                    repeat: Infinity,
                                    repeatType: "loop",
                                    duration: 60,
                                    ease: "linear",
                                }}
                            >
                                {marqueePartners.map((partner, index) => (
                                    <div
                                        key={index}
                                        className="shrink-0 px-6 sm:px-8 py-3 sm:py-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center"
                                    >
                                        <img
                                            src={partner.src}
                                            alt={partner.alt}
                                            className="h-16 sm:h-18 md:h-20 object-contain opacity-80 hover:opacity-100 transition"
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* STATS SECTION (DB-driven) */}
                <section className="bg-gradient-to-b from-gray-50 via-white to-gray-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-green-700/80">
                                    Cooperative Snapshot
                                </p>
                                <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">
                                    Real-time key figures
                                </h2>
                                <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl">
                                    High-level overview of People&apos;s MPC membership and total loan
                                    availment based on actual system data.
                                </p>
                            </div>
                        </div>

                        {/* Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                            {/* Members card */}
                            <div className="relative bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">
                                            Members
                                        </p>
                                        <p className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
                                            <CountUp
                                                end={totalMembers}
                                                duration={2.5}
                                                separator=","
                                            />
                                        </p>
                                    </div>
                                    <div className="h-11 w-11 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                                        <Users className="h-5 w-5 text-green-700" />
                                    </div>
                                </div>

                                <p className="text-sm sm:text-base text-gray-600">
                                    Individuals who chose People&apos;s MPC as their cooperative
                                    partner in financial growth and stability.
                                </p>

                                <div className="mt-4 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-[11px] font-medium text-green-700 border border-green-100">
                                    Live system count
                                </div>
                            </div>

                            {/* Loan availment card */}
                            <div className="relative bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">
                                            Total Loan Availment
                                        </p>
                                        <p className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
                                            <CountUp
                                                end={totalLoanAvailment}
                                                duration={2.5}
                                                decimals={2}
                                                prefix="₱"
                                                separator=","
                                            />
                                        </p>
                                    </div>
                                    <div className="h-11 w-11 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                        <Wallet className="h-5 w-5 text-emerald-700" />
                                    </div>
                                </div>

                                <p className="text-sm sm:text-base text-gray-600">
                                    Total gross amount of loans released to members through
                                    People&apos;s MPC loan programs.
                                </p>

                                <div className="mt-4 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                                    Based on released loan gross amounts
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Scroll-To-Top Button */}
                {showScrollButton && (
                    <motion.button
                        onClick={scrollToTop}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.08 }}
                        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-green-700 text-white p-2.5 sm:p-3 rounded-full shadow-lg"
                    >
                        <ArrowUp size={22} />
                    </motion.button>
                )}
            </PublicLayout>
        </>
    );
}
