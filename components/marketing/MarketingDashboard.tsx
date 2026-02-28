import React from 'react';
import { PlusCircle, List, ArrowLeft } from 'lucide-react';
import { MeusConteudosList } from './MeusConteudosList';

interface MarketingDashboardProps {
    onNavigate: (view: string, id?: string) => void;
    onBack?: () => void;
    userId: string;
}

export const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ onNavigate, onBack, userId }) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] w-full overflow-hidden">
            {/* Header com botão Voltar embutido para navegação fluida */}
            <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10 w-full mb-4 md:mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Marketing</h1>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Demandas e Soluções Criativas</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-hidden px-4 md:px-6 pb-4 md:pb-6 flex flex-col">
                <div className="max-w-6xl w-full mx-auto flex flex-col gap-4 md:gap-6 h-full min-h-0">
                    {/* Botões de Ação Principais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full shrink-0">
                        <button
                            onClick={() => onNavigate('new')}
                            className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 w-full text-left flex items-center gap-4"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-[100%] transition-transform duration-500 group-hover:scale-125"></div>
                            <div className="relative z-10 w-12 h-12 shrink-0 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white ring-1 ring-white/30">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-lg md:text-xl font-black text-white mb-0.5">Novo Conteúdo</h3>
                                <p className="text-indigo-100 text-xs font-medium max-w-[200px] leading-tight focus:outline-none">Criar nova solicitação de marketing na esteira.</p>
                            </div>
                        </button>

                        <div className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 md:p-5 shadow border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 w-full text-left flex items-center gap-4">
                            <div className="relative z-10 w-12 h-12 shrink-0 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 ring-1 ring-emerald-50">
                                <List className="w-6 h-6" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-lg md:text-xl font-black text-slate-800 mb-0.5">Meus Conteúdos</h3>
                                <p className="text-slate-500 text-xs font-medium max-w-[200px] leading-tight">Acompanhe o status e histórico de solicitações.</p>
                            </div>
                        </div>
                    </div>

                    {/* Meus Conteúdos Area */}
                    <div className="w-full flex-1 min-h-0 flex flex-col bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
                            <h3 className="font-bold text-slate-800 text-base md:text-lg">Suas Solicitações Recentes</h3>
                        </div>
                        <div className="flex-1 overflow-auto bg-white relative">
                            <MeusConteudosList userId={userId} onOpenDetails={(id) => onNavigate('details', id)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
