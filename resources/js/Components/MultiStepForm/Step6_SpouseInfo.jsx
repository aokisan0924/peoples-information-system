import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import InputLabel from "../InputLabel";

export default function Step6_SpouseInfo({ data, onChange, onNext, onBack }) {
    const [state, setState] = useState({
        formData: {
            spouseName: data.spouseName || '',
            spouseAge: data.spouseAge || '',
            spouseDob: data.spouseDob || '',
            dateMarriage: data.dateMarriage || '',
        },
        showScrollButton: false,
    });

    useEffect(() => {
        const handleScroll = () => {
            setState(prev => ({ ...prev, showScrollButton: window.scrollY > 300 }));
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 0 ? age : '';
    };

    const handleChange = (key, value) => {
        const updatedFormData = {
            ...state.formData,
            [key]: value,
        };

        if (key === 'spouseDob') {
            updatedFormData.spouseAge = calculateAge(value);
        }

        setState(prev => ({
            ...prev,
            formData: updatedFormData
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onChange(state.formData);
        onNext();
    };

    const inputBaseClass = "w-full rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500";

    return (
        <>
            <Head title="Membership Registration - People's Multi-Purpose Cooperative">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-green-700 border-b pb-2">VI. Spouse Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <InputLabel htmlFor="spouseName" value="Spouse Name" />
                        <input
                            type="text"
                            id="spouseName"
                            value={state.formData.spouseName}
                            onChange={e => handleChange('spouseName', e.target.value)}
                            className={inputBaseClass}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="spouseAge" value="Spouse Age" />
                        <input
                            type="number"
                            id="spouseAge"
                            value={state.formData.spouseAge}
                            readOnly
                            className={`${inputBaseClass} bg-gray-100 cursor-not-allowed`}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="spouseDob" value="Date of Birth" />
                        <input
                            type="date"
                            id="spouseDob"
                            value={state.formData.spouseDob}
                            onChange={e => handleChange('spouseDob', e.target.value)}
                            className={inputBaseClass}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="dateMarriage" value="Date of Marriage" />
                        <input
                            type="date"
                            id="dateMarriage"
                            value={state.formData.dateMarriage}
                            onChange={e => handleChange('dateMarriage', e.target.value)}
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

            {state.showScrollButton && (
                <motion.button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    whileHover={{ scale: 1.1 }}
                    className="fixed bottom-6 right-6 bg-green-700 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition"
                >
                    <ArrowUp size={24} />
                </motion.button>
            )}
        </>
    );
}
