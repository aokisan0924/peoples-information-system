import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Camera } from "lucide-react";
import { Head } from "@inertiajs/react";
import toast from "react-hot-toast";

export default function Step9_UserProfilePicture ({ data, onChange, onNext, onBack }) {
    const [state, setState] = useState({
        profileImage: data.profileImage || null,
        previewUrl: data.profileImage ? URL.createObjectURL(data.profileImage) : null,
        showScrollButton: false,
        cameraOpen: false,
    });

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setState(prev => ({ ...prev, showScrollButton: window.scrollY > 300 }));
        };

        const startCamera = async () => {
            if (state.cameraOpen && videoRef.current) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                } catch (error){
                    console.error("Camera access denied", error);
                    toast.error("Unable to access the camera");
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        startCamera();
        return () => {
            window.removeEventListener("scroll", handleScroll);
            const tracks = videoRef.current?.srcObject?.getTracks();
            tracks?.forEach(track => track.stop());
        }; 

    }, [state.cameraOpen]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const preview = URL.createObjectURL(file);
            setState(prev => ({ ...prev, profileImage: file, previewUrl: preview }));
            onChange({profileImage: file});
        } else {
            toast.warning("Please upload a valid image file");
        }
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleOpenCamera = async () => {
        setState(prev => ({ ...prev, cameraOpen: true }));
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext("2d");
            context.drawImage(videoRef.current, 0, 0, 300, 300);
            canvasRef.current.toBlob(blob => {
                if (blob) {
                    const preview = URL.createObjectURL(blob);
                    setState(prev => ({ ...prev, profileImage: blob, previewUrl: preview, cameraOpen: false }));
                    onChange({ profileImage: blob });
                    const tracks = videoRef.current?.srcObject?.getTracks();
                    tracks?.forEach(track => track.stop());
                    videoRef.current.pause();
                    videoRef.current.srcObject = null;
                }
            }, "image/png");
        }
    };

    const handleCloseCamera = () => {
        setState(prev => ({ ...prev, cameraOpen: false }));
        const tracks = videoRef.current?.srcObject?.getTracks();
        tracks?.forEach(track => track.stop());
        videoRef.current.pause();
        videoRef.current.srcObject = null;
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
        <>
            <Head title="Membership Registration - People's Multi-Purpose Cooperative">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="max-w-3xl mx-auto p-6">
                <h2 className="text-2xl font-bold mb-6 text-center">Upload Profile Picture</h2>
                

                <div className="flex flex-col items-center gap-6">
                {state.previewUrl ? (
                    <img
                    src={state.previewUrl}
                    alt="Profile Preview"
                    className="w-40 h-40 rounded-full object-cover border-2 border-gray-300"
                    />
                ) : (
                    <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    No Image
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                    type="button"
                    onClick={handleUploadClick}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all"
                    >
                    Choose Image
                    </button>

                    <button
                    type="button"
                    onClick={handleOpenCamera}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                    <Camera size={18} /> Take Photo
                    </button>
                </div>

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                </div>

                <div className="flex justify-between mt-10">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 rounded-xl bg-gray-400 text-white hover:bg-gray-500 transition-all"
                >
                    Back
                </button>

                <button
                    type="button"
                    onClick={onNext}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all"
                >
                    Next
                </button>
                </div>

                {state.showScrollButton && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 p-3 rounded-full bg-green-600 text-white shadow-lg"
                >
                    <ArrowUp size={20} />
                </motion.button>
                )}

                {state.cameraOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg flex flex-col items-center gap-4">
                    <h3 className="text-lg font-semibold mb-2 text-center">Align your face inside the circle</h3>
                    <div className="relative w-72 h-72 rounded-full overflow-hidden bg-black border-4 border-gray-300">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                    />
                    </div>
                    <canvas ref={canvasRef} width={300} height={300} className="hidden" />
                    <div className="flex gap-4 mt-4">
                        <button
                        onClick={handleCapture}
                        className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
                        >
                        Capture
                        </button>
                        <button
                        onClick={handleCloseCamera}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                        >
                        Cancel
                        </button>
                    </div>
                    </div>
                </div>
                )}
            </div>
        </>
    );
}
