import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingModalProps {
    isOpen: boolean;
    title?: string;
    message?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
    isOpen,
    title = 'Processando',
    message = 'Aguarde um momento...'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4 border border-slate-100 animate-scale-in">

                {/* Spinner Container */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100"></div>
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-emerald-600 animate-pulse" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-2 mt-2">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{message}</p>
                </div>

                {/* Optional: Add a subtle animation bar */}
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 w-1/2 animate-loading-bar rounded-full"></div>
                </div>
            </div>
        </div>
    );
};
