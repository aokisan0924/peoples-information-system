import React, { useEffect, useState } from 'react';
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import InputLabel from '../InputLabel';

export default function Step3_MemberBranchService({ data, onChange, onNext, onBack }) {
    const [state, setState] = useState({
        formData: {
        branchService: data.branchService || '',
        subBranch: data.subBranch || '',
        },
        showScrollButton: false,
    });

    const { formData, showScrollButton } = state;

    const branchService = ['ACTIVE MILITARY', 'RETIRED MILITARY', 'BENEFICIARY', 'CIVILIAN EMPLOYEES', 'PMPC'];
    const optionsMap = {
        'ACTIVE MILITARY': ['ARMY', 'AIR FORCE', 'NAVY', 'RESERVIST'],
        'RETIRED MILITARY': ['ARMY', 'AIR FORCE', 'NAVY', 'RESERVIST'],
        'BENEFICIARY': ['WIDOW', 'DEPENDENT', 'PARENTS'],
        'CIVILIAN EMPLOYEES': ['AFFC', 'PNFC', 'FCPA'],
        'PMPC': ['BOARD OF DIRECTORS', 'MANAGEMENT'],
    };

    const subOptions = optionsMap[formData.branchService] || [];

    useEffect(() => {
        const handleScroll = () => {
        setState(prev => ({ ...prev, showScrollButton: window.scrollY > 300 }));
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleChange = (key, value) => {
        setState(prev => ({
        ...prev,
        formData: {
            ...prev.formData,
            [key]: value,
            ...(key === 'branchService' && { subBranch: '' }),
        },
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onChange(formData);
        onNext();
    };

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    const inputBaseClass = "w-full rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500";

    return (
        <>
        <Head title="Membership Registration - People's Multi-Purpose Cooperative">
            <link rel="icon" href="/images/logo/pis_logo.png" />
        </Head>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-green-700 border-b pb-2">III. Branch of Service</h2>
            <InputLabel htmlFor="branchService" value="Branch of Service" />
            <select
                id="branchService"
                value={formData.branchService}
                onChange={(e) => handleChange('branchService', e.target.value)}
                className={inputBaseClass}
                required
            >
                <option value="">Select Branch of Service</option>
                {branchService.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>

            {subOptions.length > 0 && (
                <div>
                <InputLabel htmlFor="subBranch" value="Specific Group" />
                <select
                    id="subBranch"
                    value={formData.subBranch}
                    onChange={(e) => handleChange('subBranch', e.target.value)}
                    className={inputBaseClass}
                    required
                >
                    <option value="">Select Option</option>
                    {subOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                </div>
            )}
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
        </form>
        </>
    );
}
