import { motion } from "framer-motion";
import { FaVolleyballBall } from "react-icons/fa";

interface VolleyballLoaderProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
    overlay?: boolean;
}

export const VolleyballLoader = ({ size = 'medium', message, overlay = false }: VolleyballLoaderProps) => {
    const sizeClasses = {
        small: 'text-3xl',
        medium: 'text-6xl',
        large: 'text-8xl'
    };

    const textSizes = {
        small: 'text-sm',
        medium: 'text-lg',
        large: 'text-xl'
    };

    const containerClasses = overlay
        ? "fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 backdrop-blur-sm"
        : "flex flex-col items-center justify-center";

    const content = (
        <>
            <motion.div
                className={`relative flex items-center justify-center ${sizeClasses[size]}`}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            >
                <FaVolleyballBall className="text-orange-500 drop-shadow-md" />
            </motion.div>
            {message && (
                <motion.p
                    className={`mt-4 font-semibold text-blue-800 ${textSizes[size]}`}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    {message}
                </motion.p>
            )}
        </>
    );

    if (overlay) {
        return (
            <div className={containerClasses}>
                <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center space-y-4 min-w-[200px]">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            {content}
        </div>
    );
};