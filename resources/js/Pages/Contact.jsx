import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaFacebook } from "react-icons/fa";
import PublicLayout from "@/Layouts/PublicLayout";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function Contact() {
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSending) return;

        try {
            setIsSending(true);

            await axios.post("/contact/send", {
                name,
                email,
                message,
            });

            toast.success("Your message has been sent!");
            setName("");
            setEmail("");
            setMessage("");
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message || "Something went wrong. Please try again."
            );
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollButton(window.scrollY > 300);
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const fadeUp = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <>
            <Head title="Contact Us - People's Multi-Purpose Cooperative">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <PublicLayout>
                {/* HERO — 2-column modern layout */}
                <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white py-16 sm:py-20 px-6 sm:px-10">
                    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.7fr,1.3fr] gap-10 items-center relative z-10">
                        {/* Left: Title & copy */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.22em] text-emerald-100 mb-4">
                                Get in Touch · People&apos;s MPC
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow">
                                Contact Us
                            </h1>

                            <p className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed">
                                Reach our main office or satellite branches for membership,
                                loans, savings, and other cooperative services. We&apos;re ready
                                to assist wherever you are assigned.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <a
                                    href="#contact-form"
                                    className="inline-flex items-center justify-center rounded-lg px-6 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold bg-white text-green-900 shadow-md hover:bg-emerald-50 transition"
                                >
                                    Send us a message
                                </a>
                                <a
                                    href="#offices"
                                    className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-xs sm:text-sm font-medium bg-white/10 border border-white/40 text-emerald-50 hover:bg-white/15 transition"
                                >
                                    View office locations
                                </a>
                            </div>
                        </motion.div>

                        {/* Right: Quick contact highlight card */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="lg:justify-self-end"
                        >
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100 mb-1">
                                    Quick Contacts
                                </p>

                                <div className="space-y-3 text-sm text-emerald-50/95">
                                    <div className="flex items-start gap-3">
                                        <FaPhone className="mt-1 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Main Office Hotline
                                            </p>
                                            <p className="text-base font-semibold">
                                                +63 965 953 2196
                                            </p>
                                            <p className="text-[11px] text-emerald-100/80 mt-0.5">
                                                Office hours: 8:00 AM – 5:00 PM, Monday to Friday
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <FaEnvelope className="mt-1 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Email
                                            </p>
                                            <p className="text-base font-semibold">
                                                peoplesmpcooperative@gmail.com
                                            </p>
                                            <p className="text-[11px] text-emerald-100/80 mt-0.5">
                                                For membership, loan inquiries, and general concerns
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <FaFacebook className="mt-1 text-yellow-300" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                                                Facebook Page
                                            </p>
                                            <p className="text-base font-semibold">
                                                facebook.com/PMPCooperative
                                            </p>
                                            <p className="text-[11px] text-emerald-100/80 mt-0.5">
                                                For announcements, updates, and quick replies
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
                <section className="bg-gradient-to-b from-emerald-50 via-white to-gray-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-start">
                        {/* Branch Details */}
                        <motion.div
                            id="offices"
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4 }}
                            className="space-y-6"
                        >
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-2">
                                    Our Offices
                                </h2>
                                <p className="text-sm sm:text-base text-gray-600 max-w-xl">
                                    Visit our offices or reach us through email, phone, or Facebook.
                                    Our staff will be glad to assist you.
                                </p>
                            </div>

                            <div className="grid gap-5">
                                {/* Main Office */}
                                <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-sm border border-emerald-50 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-lg font-semibold flex items-center text-emerald-800">
                                            <FaMapMarkerAlt className="mr-2 text-green-700" />
                                            Main Office
                                        </h3>
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            Isabela
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-3">
                                        Stall #2, Principe Building, Maharlika Highway, Upi, Gamu,
                                        Isabela
                                    </p>
                                    <div className="space-y-1.5 text-sm text-gray-700">
                                        <p className="flex items-center">
                                            <FaEnvelope className="mr-2 text-green-700" />
                                            peoplesmpcooperative@gmail.com
                                        </p>
                                        <p className="flex items-center">
                                            <FaFacebook className="mr-2 text-green-700" />
                                            www.facebook.com/PMPCooperative
                                        </p>
                                        <p className="flex items-center">
                                            <FaPhone className="mr-2 text-green-700" />
                                            Mobile: +63 965 953 2196
                                        </p>
                                    </div>
                                </div>

                                {/* Cubao Satellite Office */}
                                <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-sm border border-emerald-50 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-lg font-semibold flex items-center text-emerald-800">
                                            <FaMapMarkerAlt className="mr-2 text-green-700" />
                                            Cubao Satellite Office
                                        </h3>
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            Quezon City
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-3">
                                        20-E, 2nd Camarilla St., Brgy. San Roque, Cubao, Quezon City
                                    </p>
                                    <div className="space-y-1.5 text-sm text-gray-700">
                                        <p className="flex items-center">
                                            <FaEnvelope className="mr-2 text-green-700" />
                                            peoplesmpcooperative@gmail.com
                                        </p>
                                        <p className="flex items-center">
                                            <FaFacebook className="mr-2 text-green-700" />
                                            www.facebook.com/PMPCooperative
                                        </p>
                                        <p className="flex items-center">
                                            <FaPhone className="mr-2 text-green-700" />
                                            (02) 8848-9760
                                        </p>
                                        <p className="flex items-center">
                                            <FaPhone className="mr-2 text-green-700" />
                                            Mobile: +63 953 033 1580
                                        </p>
                                    </div>
                                </div>

                                {/* Fort Magsaysay Satellite Office */}
                                <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-sm border border-emerald-50 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-lg font-semibold flex items-center text-emerald-800 mb-1">
                                            <FaMapMarkerAlt className="mr-2 text-green-700" />
                                            Fort Magsaysay Satellite Office
                                        </h3>
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            Nueva Ecija
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-3">
                                        Fort Ramon Magsaysay, Palayan City, Nueva Ecija
                                    </p>
                                    <div className="space-y-1.5 text-sm text-gray-700">
                                        <p className="flex items-center">
                                            <FaEnvelope className="mr-2 text-green-700" />
                                            peoplesmpcooperative@gmail.com
                                        </p>
                                        <p className="flex items-center">
                                            <FaFacebook className="mr-2 text-green-700" />
                                            www.facebook.com/PMPCooperative
                                        </p>
                                        <p className="flex items-center">
                                            <FaPhone className="mr-2 text-green-700" />
                                            Mobile: +63 968 263 5186
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            id="contact-form"
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-md border border-emerald-50"
                        >
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-emerald-800 text-center sm:text-left">
                                Send Us a Message
                            </h2>
                            <p className="text-sm text-gray-600 mb-6 text-center sm:text-left">
                                Share your inquiries, feedback, or concerns and we&apos;ll get back
                                to you as soon as we can.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-sm bg-white"
                                        placeholder="Your Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-sm bg-white"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Message
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-sm resize-none bg-white"
                                        rows="4"
                                        placeholder="How can we help you?"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="w-full bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base shadow disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSending ? "Sending..." : "Send Message"}
                                </button>
                            </form>

                            <p className="mt-3 text-[11px] text-gray-500 text-center sm:text-left">
                                For urgent concerns, please contact us through our official phone
                                numbers or Facebook page.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-emerald-700 text-white text-center py-16 px-6">
                    <div className="container mx-auto max-w-4xl">
                        <h2 className="text-3xl sm:text-4xl font-bold">
                            Become a Member Today!
                        </h2>
                        <p className="mt-3 text-base sm:text-lg opacity-90">
                            Join People&apos;s MPC and enjoy secure, member-focused financial
                            services wherever you are assigned.
                        </p>
                        <button
                            onClick={() =>
                                window.open("/register", "_blank", "noopener,noreferrer")
                            }
                            className="mt-6 inline-flex items-center justify-center bg-white text-green-700 px-8 py-3 text-lg font-semibold rounded-lg shadow hover:bg-gray-100 transition-colors duration-200"
                        >
                            Become a Member
                        </button>
                    </div>
                </section>

                {/* Scroll-To-Top Button */}
                {showScrollButton && (
                    <motion.button
                        onClick={scrollToTop}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.1 }}
                        className="fixed bottom-6 right-6 bg-emerald-700 text-white p-3 rounded-full shadow-lg hover:bg-emerald-800 transition"
                    >
                        <ArrowUp size={24} />
                    </motion.button>
                )}
            </PublicLayout>
        </>
    );
}
