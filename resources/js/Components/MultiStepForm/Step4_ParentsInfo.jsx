import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import InputLabel from "../InputLabel";

export default function Step4_ParentsInfo ({ data, onChange, onNext, onBack}) {
    const [formData, setFormData] = useState({
        motherName: data.motherName || '',
        motherAge: data.motherAge || '',
        fatherName: data.fatherName || '',
        fatherAge: data.fatherAge || '',
    });

    const [showScrollButton, setShowScrollButton] = useState(false);

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

    const handleChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onChange(formData);
        onNext();
    };

    const inputBaseClass = "w-full rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500";

    return (
        <>
            <Head title="Membership Registration - People's Multi-Purpose Cooperative">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-green-700 border-b pb-2">IV. Parents Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <InputLabel htmlFor="motherName" value="Monther's Name"/>
                        <input
                            type="text"
                            id="motherName"
                            name="motherName"
                            value={formData.motherName}
                            onChange={e => handleChange('motherName', e.target.value)}
                            className={inputBaseClass}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="motherAge" value="Monther's Age"/>
                        <input
                            type="number"
                            id="motherAge"
                            name="motherAge"
                            value={formData.motherAge}
                            onChange={e => handleChange('motherAge', e.target.value)}
                            className={inputBaseClass}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="fatherName" value="Father's Name"/>
                        <input
                            type="text"
                            id="fatherName"
                            name="fatherName"
                            value={formData.fatherName}
                            onChange={e => handleChange('fatherName', e.target.value)}
                            className={inputBaseClass}
                        />
                    </div>
                        <div>
                        <InputLabel htmlFor="fatherAge" value="Father's Age"/>
                        <input
                            type="number"
                            id="fatherAge"
                            name="fatherAge"
                            value={formData.fatherAge}
                            onChange={e => handleChange('fatherAge', e.target.value)}
                            className={inputBaseClass}
                        />
                    </div>
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
                    animate={{ opacity: 1, y: 0 }}
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