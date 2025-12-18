import React, { useRef, useState } from "react";
import { Head } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import SignatureCanvas from "react-signature-canvas";

export default function Step10_UserSignature({ data, onChange, onNext, onBack }) {
    const sigCanvasRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);

    const clearSignature = () => {
        if (sigCanvasRef.current) {
            sigCanvasRef.current.clear();
            onChange({ ...data, signatureData: '' });
            toast.success("Signature cleared successfully!");
        }
    };

    const handleSaveSignature = async () => {
        if (sigCanvasRef.current?.isEmpty()) {
            toast.error('Please provide your signature before proceeding.');
            return;
        }
        setIsSaving(true);
    
        // Convert signature to base64 PNG
        const base64Data = sigCanvasRef.current.getCanvas().toDataURL("image/png");

        // Save the base64 string
        onChange({
        ...data,
        signatureData: base64Data,
        });
        
        toast.success("Signature saved successfully!");
        setIsSaving(false);
        onNext();
    };

    return (
        <>
            <Head title="Membership Registration - People's Multi-Purpose Cooperative">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold mb-8 text-center">User Signature</h2>

                <div className="border-2 border-dashed border-gray-400 rounded-xl p-4 mb-8 bg-gray-50">
                <SignatureCanvas
                    ref={sigCanvasRef}
                    penColor="black"
                    backgroundColor="rgb(243 244 246)"
                    canvasProps={{
                        className: "w-full h-64 rounded-lg",
                        style: { touchAction: "none" },
                    }}
                    minWidth={1.5}
                    maxWidth={2.5}
                    velocityFilterWeight={0.7}
                />

                </div>

                <div className="flex justify-end mb-8">
                    <button
                        type="button"
                        onClick={clearSignature}
                        aria-label="Clear Signature"
                        className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Clear Signature
                    </button>
                </div>

                <div className="flex justify-between">
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Go Back"
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveSignature}
                        aria-label="Save and Continue"
                        className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                            isSaving ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                        }`}
                    >
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                                Saving...
                            </span>
                        ) : (
                            "Next"
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
