import React from 'react';
import { HardHat, ArrowLeft, Hammer, Construction } from 'lucide-react';

interface ObrasModuleProps {
    onBack: () => void;
}

export const ObrasModule: React.FC<ObrasModuleProps> = ({ onBack }) => {
    return (
        <>
            {/* Fixed Back Button - Standardized Position */}
            <button
                onClick={onBack}
                className="fixed top-24 left-4 md:top-28 md:left-8 z-[999] group flex items-center gap-2 text-slate-500 hover:text-orange-600 font-bold transition-all p-2 pr-4 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg hover:shadow-xl hover:bg-white hover:-translate-y-0.5 hover:border-orange-100"
                title="Voltar ao Menu"
            >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-slate-400 group-hover:text-orange-600" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold group-hover:text-orange-700">Voltar</span>
            </button>

            <div className="flex-1 bg-slate-50 font-sans flex flex-col overflow-y-auto relative z-0">
                <div className="flex-1 flex flex-col items-center justify-center w-full min-h-full p-4 md:p-8 pt-36 md:pt-40 container mx-auto">
                    <div className="w-full flex-1 flex flex-col items-center justify-center">

                        {/* Header */}
                        <div className="flex flex-col items-center mb-10 shrink-0 animation-delay-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-5 rounded-[2rem] bg-gradient-to-br from-orange-50 to-orange-100/50 mb-5 shadow-sm ring-8 ring-white/50">
                                <HardHat className="w-12 h-12 text-orange-600 drop-shadow-sm" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight text-center drop-shadow-sm">Módulo de Obras</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 text-center max-w-lg">
                                Gestão de projetos urbanos, manutenção de vias e infraestrutura
                            </p>
                        </div>

                        {/* Content Area - Placeholder / Empty State */}
                        <div className="w-full max-w-2xl animate-in zoom-in duration-500 fill-mode-backwards p-2" style={{ animationDelay: '100ms' }}>
                            <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-[0_20px_50px_rgb(0,0,0,0.04)] relative overflow-hidden text-center group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-bl-[100%] -mr-16 -mt-16 transition-transform duration-700 ease-out group-hover:scale-125"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 rounded-tr-[100%] -ml-16 -mb-16 transition-transform duration-700 ease-out group-hover:scale-110"></div>

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-orange-50 rounded-[2rem] flex items-center justify-center text-orange-500 mb-6 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                                        <Construction className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Em Desenvolvimento</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
                                        Estamos construindo ferramentas poderosas para otimizar os processos da Secretaria de Obras. Novas funcionalidades estarão disponíveis em breve.
                                    </p>

                                    <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full border border-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest">
                                        <Hammer className="w-3 h-3 animate-bounce" /> Breve Lançamento
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};
