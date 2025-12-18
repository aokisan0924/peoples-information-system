import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { X } from "lucide-react";


export default function Step7_DependentsInfo ({ data, onChange, onNext, onBack }) {
    const [state, setState] = useState({
        dependents: Array.isArray(data?.dependents) && data.dependents.length
        ? data.dependents
        : [{ name: '', dob: '', gender: ''}],
        showScrollButton: false
    });

    useEffect(() => {
        const handleScroll = () => setState(prev => ({
            ...prev,
            showScrollButton: window.scrollY > 300
        }));

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth"});

    const handleChange = (index, key, value) => {
        const updated = [...state.dependents];
        updated[index][key] = value;
        setState(prev => ({ ...prev, dependents: updated}));
    };

    const addDependent = () => {
        setState(prev => ({
            ...prev,
            dependents: [...prev.dependents, {name: '', dob: '', gender: ''}]
        }));
    };

    const removeDependent = (index) => {
        setState(prev => ({
            ...prev,
            dependents: prev.dependents.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onChange({...data, dependents: state.dependents});
        onNext();
    }

    return (
        <>
            <Head title="Membership Registration - People's Multi-Purpose Cooperative">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-green-700 border-b pb-2">VII. Dependents Information</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 border text-left">Name</th>
                                <th className="px-4 py-2 border text-left">Date of Birth</th>
                                <th className="px-4 py-2 border text-left">Gender</th>
                                <th className="px-4 py-2 border text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state.dependents.map((dep, index) => (
                                <tr key={index} className="bg-white">
                                    <td className="px-4 py-2 border">
                                        <input
                                            type="text"
                                            value={dep.name}
                                            onChange={e => handleChange(index, 'name', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="Dependents Name"
                                            required
                                        />
                                    </td>
                                    <td className="px-4 py-2 border">
                                        <input
                                            type="date"
                                            value={dep.dob}
                                            onChange={e => handleChange(index, 'dob', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </td>
                                    <td className="px-4 py-2 border">
                                        <select
                                            value={dep.gender}
                                            onChange={e => handleChange(index, 'gender', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-2 border text-center">
                                        {state.dependents.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeDependent(index)}
                                                className="text-red-600 hover:text-red-800 transition" title="Remove Dependent"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        type="button"
                        onClick={addDependent}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                        + Add Dependent
                    </button>
                </div>

                <div className="flex justify-between pt-6">
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
                    onClick={scrollToTop}
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
};