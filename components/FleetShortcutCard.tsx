import React from 'react';
import { Car, ArrowRight } from 'lucide-react';

interface FleetShortcutCardProps {
    onClick: () => void;
    className?: string;
}

export const FleetShortcutCard: React.FC<FleetShortcutCardProps> = ({ onClick, className = '' }) => {
    return (
        <button onClick={onClick} className={`group relative rounded-[2.5rem] border transition-all duration-500 text-center flex flex-col items-center justify-center overflow-hidden bg-white border-slate-200 hover:border-cyan-400 scale-100 hover:scale-[1.05] ${className}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center mb-3 transition-all duration-500 bg-gradient-to-br from-cyan-600 to-cyan-700">
                    <Car className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Gestão de Frotas</h2>
                <p className="text-slate-500 text-xs font-medium">Veículos e Marcas</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-cyan-600 font-bold text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                Acessar <ArrowRight className="w-4 h-4" />
            </div>
        </button>
    );
};
