import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastNotificationProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
    message,
    type = 'info',
    isVisible,
    onClose,
    duration = 4000
}) => {
    const [isRendered, setIsRendered] = useState(false);
    const [isAnimateIn, setIsAnimateIn] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsRendered(true);
            // Small delay to allow render before animation starts
            requestAnimationFrame(() => setIsAnimateIn(true));

            const timer = setTimeout(() => {
                setIsAnimateIn(false);
                setTimeout(onClose, 300); // Wait for exit animation
            }, duration);

            return () => clearTimeout(timer);
        } else {
            setIsAnimateIn(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isRendered) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-white" />;
            case 'error': return <XCircle className="w-5 h-5 text-white" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-white" />;
            default: return <Info className="w-5 h-5 text-white" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success': return 'bg-emerald-600 text-white shadow-emerald-500/30';
            case 'error': return 'bg-rose-600 text-white shadow-rose-500/30';
            case 'warning': return 'bg-amber-500 text-white shadow-amber-500/30';
            default: return 'bg-blue-600 text-white shadow-blue-500/30';
        }
    };

    return createPortal(
        <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none p-6">
            <div
                className={`
          pointer-events-auto flex items-center gap-3 px-6 py-3 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-500 ease-out transform
          ${getColors()}
          ${isAnimateIn ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-95'}
        `}
            >
                <div className="shrink-0">{getIcon()}</div>
                <p className="text-white font-bold text-sm whitespace-nowrap drop-shadow-sm">{message}</p>
                <button
                    onClick={() => {
                        setIsAnimateIn(false);
                        setTimeout(onClose, 300);
                    }}
                    className="ml-2 p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        </div>,
        document.body
    );
};
