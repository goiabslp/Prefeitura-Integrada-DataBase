import React from 'react';
import { Sprout, ArrowLeft, Construction } from 'lucide-react';

interface AgricultureModuleProps {
    onBack: () => void;
}

export const AgricultureModule: React.FC<AgricultureModuleProps> = ({ onBack }) => {
    return (
        <div className="flex-1 h-full bg-slate-50 p-4 md:p-6 overflow-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6">
                <button
                    onClick={onBack}
                    className="group flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-bold transition-all w-fit"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs uppercase tracking-widest">Voltar para o Início</span>
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
                    <div className="bg-emerald-600 px-6 py-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-emerald-400 to-emerald-900"></div>
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl mb-6 mx-auto">
                                <Sprout className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">Módulo de Agricultura</h2>
                            <p className="text-emerald-50/80 text-sm font-medium max-w-md mx-auto">
                                Gestão de frotas agrícolas, assistência ao produtor e controle de insumos.
                            </p>
                        </div>
                    </div>

                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Construction className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Em Desenvolvimento</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                            Estamos preparando ferramentas específicas para otimizar os processos da Secretaria de Agricultura.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
