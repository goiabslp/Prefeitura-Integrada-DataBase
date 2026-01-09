import React, { useState } from 'react';
import { Users, Tractor, MapPin, Search, Plus, Filter } from 'lucide-react';

type Tab = 'produtores' | 'maquinario' | 'propriedades';

export const AgricultureRegistrations: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('produtores');

    const renderHeader = (title: string, subtitle: string, buttonLabel: string) => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h3>
                <p className="text-sm font-medium text-slate-500">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
                    <Plus className="w-4 h-4" />
                    <span className="hidden md:inline">{buttonLabel}</span>
                </button>
            </div>
        </div>
    );

    const renderProdutores = () => (
        <div className="animate-fade-in">
            {renderHeader('Produtores Rurais', 'Gerencie o cadastro de produtores', 'Novo Produtor')}

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Users className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum produtor encontrado</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Utilize o botão acima para cadastrar o primeiro produtor rural no sistema.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderMaquinario = () => (
        <div className="animate-fade-in">
            {renderHeader('Maquinário e Veículos', 'Frota agrícola disponível', 'Novo Item')}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Tractor className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum maquinário cadastrado</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Cadastre tratores, caminhões e implementos para gerenciar a frota.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderPropriedades = () => (
        <div className="animate-fade-in">
            {renderHeader('Propriedades Rurais', 'Locais de atendimento', 'Nova Propriedade')}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <MapPin className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhuma propriedade</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Mapeie as propriedades rurais para facilitar o agendamento de serviços.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Filter className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cadastros</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestão de Recursos</p>
                    </div>
                </div>
            </div>

            <div className="flex p-1 bg-slate-200/50 border border-slate-200/60 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('produtores')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'produtores'
                            ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Produtores
                </button>
                <button
                    onClick={() => setActiveTab('maquinario')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'maquinario'
                            ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Tractor className="w-4 h-4" />
                    Maquinário
                </button>
                <button
                    onClick={() => setActiveTab('propriedades')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'propriedades'
                            ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <MapPin className="w-4 h-4" />
                    Propriedades
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                {activeTab === 'produtores' && renderProdutores()}
                {activeTab === 'maquinario' && renderMaquinario()}
                {activeTab === 'propriedades' && renderPropriedades()}
            </div>
        </div>
    );
};
