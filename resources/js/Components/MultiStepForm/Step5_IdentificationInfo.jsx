import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import toast from "react-hot-toast";
import InputLabel from "../InputLabel";

export default function Step5_IdentificationInfo ({ data, onChange, onNext, onBack }) {
    const [formData, setFormData] = useState({
        tinNo: data.tinNo || '',
        gsisNo: data.gsisNo || '',
        crnUmidNo: data.crnUmidNo || '',
    });

    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect (() => {
        const handleScroll = () => {
            setShowScrollButton(window.scrollY > 300);
        };
        window.addEventListener("scroll", handleScroll);
        onChange(formData);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth"});
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const formatTin = (value) => {
        // Remove any character except numbers
        const numeric = value.replace(/[^\d]/g, '');
    
        // Insert hyphens after 3 and 6 digits (TIN is typically 9 digits: 123-456-789)
        return numeric
            .slice(0, 9) // limit to 9 digits
            .replace(/(\d{3})(\d{3})(\d{0,3})/, (match, p1, p2, p3) =>
                p3 ? `${p1}-${p2}-${p3}` : `${p1}-${p2}`
            );
    };

    const formatLongId = (value) => {
        const numeric = value.replace(/[^\d]/g, '');
    
        return numeric
            .slice(0, 12) // Only keep up to 12 digits
            .replace(
                /^(\d{0,2})(\d{0,9})(\d{0,1})$/,
                (match, p1, p2, p3) => {
                    let result = '';
                    if (p1) result += p1;
                    if (p2) result += `-${p2}`;
                    if (p3) result += `-${p3}`;
                    return result;
                }
            );
    };
    const handleSubmit = (e) => {
        e.preventDefault();
    
        const tinNumeric = formData.tinNo.replace(/[^\d]/g, '');
        if (tinNumeric.length !== 9) {
            toast.error("TIN number must be exactly 9 digits.");
            return;
        }
    
        onChange(formData);
        onNext();
    }

    const inputBaseClass = "w-full rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500";

    return (
        <>
            <Head title="Membership Registration - People's Multi-Purpose Cooperative">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl shadow-lg">
                <div className="text-2xl font-bold text-green-700 border-b pb-2">V. Identification Information</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <InputLabel htmlFor="tinNo" value="TIN No"/>
                        <input
                            type="text"
                            id="tinNo"
                            name="tinNo"
                            value={formData.tinNo}
                            onChange={e => handleChange('tinNo', formatTin(e.target.value))}
                            className={inputBaseClass}
                            placeholder="123-456-789"
                            maxLength={11}
                            required
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="gsisNo" value="GSIS/SSS No"/>
                        <input
                            type="text"
                            id="gsisNo"
                            name="gsisNo"
                            value={formData.gsisNo}
                            onChange={e => handleChange('gsisNo', formatLongId(e.target.value))}
                            className={inputBaseClass}
                            placeholder="12-123456789-0"
                            maxLength={13}
                        />
                    </div>
                </div>
                <div>
                    <InputLabel htmlFor="crnUmidNo" value="CRN/UMID No"/>
                    <input
                        type="text"
                        id="crnUmidNo"
                        name="crnUmidNo"
                        value={formData.crnUmidNo}
                        onChange={e => handleChange('crnUmidNo', formatLongId(e.target.value))}
                        className={inputBaseClass}
                        placeholder="12-123456789-0"
                        maxLength={13}
                    />
                </div>
                <div className="flex justify-between pt-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        Next
                    </button>
                </div>
            </form>
            {/* Scroll-To-Top Button */}
            {showScrollButton && (
                <motion.button
                    onClick={scrollToTop}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y:0 }}
                    exit={{ opacity: 0, y: 20 }}
                    whileHover={{ scale: 1.1 }}
                    className="fixed bottom-6 right-6 bg-green-700 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition"
                >
                    <ArrowUp size={24}/>
                </motion.button>
            )}
        </>
    );
};