import React, { useMemo } from 'react';
import { Activity, X, Hammer, Rocket } from 'lucide-react';
import { Order, UserRole, BlockType } from '../../types';

interface TasksDashboardProps {
    orders: Order[];
    userRole: UserRole;
    userName: string;
    onViewOrder: (order: Order) => void;
    onViewAll: (type: BlockType) => void;
    onClose?: () => void;
}

export const TasksDashboard: React.FC<TasksDashboardProps> = ({ onClose }) => {

    return (
        <div className="w-full h-full flex flex-col bg-white/50 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden relative">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/50 flex items-center justify-between shrink-0 bg-white/30">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        Minhas Tarefas
                    </h2>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Central de atividades e pendências</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors ml-1"
                        title="Fechar Tarefas"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* List - Construction Placehoder */}
            <div className="flex-1 overflow-hidden flex flex-col items-center justify-center p-8 text-center space-y-6">

                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-white to-slate-50 rounded-[2rem] shadow-xl border border-white flex items-center justify-center transform rotate-3 transition-transform hover:rotate-6 duration-500">
                        <Hammer className="w-10 h-10 text-indigo-600 drop-shadow-sm" />
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg animate-bounce">
                            <Rocket className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className="max-w-xs space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                        Em Construção
                    </h3>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                        Estamos preparando um novo módulo de tarefas mais inteligente e integrado para você.
                    </p>
                </div>

                <div className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Disponível em breve
                </div>
            </div>

            {/* Footer Background Decoration */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>
        </div>
    );
};
