import React from 'react';
import { Loader2 } from 'lucide-react';

interface GlobalLoadingProps {
    type?: 'inline' | 'overlay';
    message?: string;
    description?: string;
    className?: string;
    isOpen?: boolean; // Mainly for overlay mode
}

export const GlobalLoading: React.FC<GlobalLoadingProps> = ({
    type = 'inline',
    message = 'Carregando...',
    description,
    className = '',
    isOpen = true
}) => {
    if (!isOpen) return null;

    // Inline Mode (Simple, as requested)
    if (type === 'inline') {
        return (
            <div className={`flex flex-col items-center justify-center py-12 text-slate-400 ${className}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mb-4"></div>
                <p className="font-medium">{message}</p>
                {description && <p className="text-sm opacity-75 mt-1">{description}</p>}
            </div>
        );
    }

    // Overlay Mode (Full screen blocking, adapting the simple style to an overlay)
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4 border border-slate-100 animate-scale-in">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600"></div>

                <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-slate-700">{message}</h3>
                    {description && (
                        <p className="text-sm text-slate-500">{description}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
