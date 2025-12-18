import { motion, AnimatePresence } from "framer-motion";

export default function LoadingOverlay({ isLoading }) {
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    className="fixed inset-0 bg-white/70 z-[9999] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="h-14 w-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
