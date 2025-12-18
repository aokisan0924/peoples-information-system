import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Head } from "@inertiajs/react";

export default function DataPrivacy({ onAccept }) {
    const [state, setState] = useState({
        isVisible: false,
        isButtonDisabled: true,
        countdown: 5,
    });

    useEffect(() => {
        const showTimer = setTimeout(() => {
        setState(prev => ({ ...prev, isVisible: true }));
        }, 500);

        return () => clearTimeout(showTimer);
    }, []);

    useEffect(() => {
        if (state.isVisible && state.isButtonDisabled) {
        const countdownTimer = setInterval(() => {
            setState(prev => {
            if (prev.countdown <= 1) {
                clearInterval(countdownTimer);
                return { ...prev, isButtonDisabled: false, countdown: 0 };
            }
            return { ...prev, countdown: prev.countdown - 1 };
            });
        }, 1000);

        return () => clearInterval(countdownTimer);
        }
    }, [state.isVisible, state.isButtonDisabled]);

    const handleAccept = () => {
        setState(prev => ({ ...prev, isVisible: false }));
        onAccept(); // Proceed to registration
    };

    if (!state.isVisible) return null;

    return (
        <>
            <Head title="Data Privacy - People's Multi-Purpose Cooperative">
            </Head>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
                >
                    <h2 className="text-2xl font-bold mb-4 text-center">Data Privacy Consent</h2>
                    <div className="max-h-96 overflow-y-auto text-gray-700 text-sm mb-6">
                    <p>
                        By proceeding with your membership registration, you acknowledge and agree that People's Multi-Purpose Cooperative may collect, use, and process your personal information in accordance with the Data Privacy Act of 2012. Your information will be used solely for membership verification, communication, and other legitimate purposes related to the cooperative’s operations.
                    </p>
                    <p className="mt-4">
                        We ensure that your data is protected and handled with strict confidentiality. You may request access to your information or withdraw your consent at any time, subject to applicable laws and regulations.
                    </p>
                    </div>
                    <div className="flex justify-end space-x-4">
                    <button
                        onClick={handleAccept}
                        disabled={state.isButtonDisabled}
                        className={`px-6 py-2 rounded-xl transition text-white ${
                        state.isButtonDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                        }`}
                    >
                        {state.isButtonDisabled ? `Please wait (${state.countdown}s)` : "I Agree"}
                    </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
