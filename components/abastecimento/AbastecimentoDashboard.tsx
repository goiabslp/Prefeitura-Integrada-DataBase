import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, Droplet, DollarSign, Truck, Settings, PieChart, BarChart3, LayoutDashboard } from 'lucide-react';

interface AbastecimentoDashboardProps {
    onBack: () => void;
}

type TabType = 'overview' | 'vehicle' | 'config';

export const AbastecimentoDashboard: React.FC<AbastecimentoDashboardProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    const renderOverview = () => (
        <div className="space-y-8 animate-fade-in">
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
    );

    const renderVehicleView = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
                <Truck className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Visão Detalhada por Veículo</h3>
                <p className="text-slate-500 max-w-md">Selecione um veículo para visualizar histórico de abastecimento, média de consumo individual e custos acumulados.</p>
                <button className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">
                    Selecionar Veículo
                </button>
            </div>
        </div>
    );

    const renderConfig = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
                <Settings className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Configurações do Dashboard</h3>
                <p className="text-slate-500 max-w-md">Gerencie metas de consumo, alertas de média baixa e preferências de visualização dos gráficos.</p>
            </div>
        </div>
    );

    return (
        <div className="flex-1 h-full bg-slate-50 p-6 overflow-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all shadow-sm ring-1 ring-slate-200 bg-white">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard do Abastecimento</h1>
                            <p className="text-slate-500 font-medium">Indicadores de consumo e custos</p>
                        </div>
                    </div>

                    {/* Tab Navigation - Modern Segmented Control */}
                    <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-xl border border-slate-200/60 rounded-2xl w-full xl:w-fit self-start xl:self-auto overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out whitespace-nowrap ${activeTab === 'overview'
                                    ? 'bg-white text-cyan-600 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'fill-current' : ''}`} />
                            Visão Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('vehicle')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out whitespace-nowrap ${activeTab === 'vehicle'
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            <Truck className={`w-4 h-4 ${activeTab === 'vehicle' ? 'fill-current' : ''}`} />
                            Visão por Veículo
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out whitespace-nowrap ${activeTab === 'config'
                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            <Settings className={`w-4 h-4 ${activeTab === 'config' ? 'fill-current' : ''}`} />
                            Configuração
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[500px]">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'vehicle' && renderVehicleView()}
                    {activeTab === 'config' && renderConfig()}
                </div>
            </div>
        </div>
    );
};
