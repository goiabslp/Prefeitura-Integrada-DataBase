import React from 'react';
import { ArrowLeft, TrendingUp, Droplet, DollarSign, Truck } from 'lucide-react';

interface AbastecimentoDashboardProps {
    onBack: () => void;
}

export const AbastecimentoDashboard: React.FC<AbastecimentoDashboardProps> = ({ onBack }) => {
    return (
        <div className="flex-1 h-full bg-slate-50 p-6 overflow-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard do Abastecimento</h1>
                        <p className="text-slate-500 font-medium">Indicadores de consumo e custos</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Gasto Total (Mês)</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">R$ 12.450,00</h3>
                        <div className="mt-auto pt-4 flex items-center gap-2 text-xs font-bold text-emerald-600">
                            <TrendingUp className="w-3 h-3" /> +5.2% vs mês anterior
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <Droplet className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Litros Consumidos</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">2.350 L</h3>
                        <div className="mt-auto pt-4 flex items-center gap-2 text-xs font-bold text-blue-600">
                            <TrendingUp className="w-3 h-3" /> Consumo estável
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                                <Truck className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Veículos Ativos</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">18</h3>
                        <div className="mt-auto pt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                            Frota total: 22
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Média Km/L (Geral)</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">9.2 km/L</h3>
                        <div className="mt-auto pt-4 flex items-center gap-2 text-xs font-bold text-emerald-600">
                            Eficiência alta
                        </div>
                    </div>
                </div>

                {/* Placeholder Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm h-80 flex items-center justify-center">
                        <p className="text-slate-400 font-medium italic">Gráfico de Consumo Diário (Placeholder)</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm h-80 flex items-center justify-center">
                        <p className="text-slate-400 font-medium italic">Gráfico de Gastos por Tipo de Combustível (Placeholder)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
