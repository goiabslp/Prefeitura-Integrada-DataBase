import React, { useState, useEffect } from 'react';
import { Users, Tractor, MapPin, Search, Plus, Filter, MoreHorizontal, User, Phone, Mail, FileText, CheckCircle2, Clock, Calendar, Map, X, ArrowRight, ChevronRight, Star } from 'lucide-react';

type Tab = 'produtores' | 'maquinario' | 'propriedades';

export const AgricultureRegistrations: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('produtores');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null); // Start with null for modal behavior

    const mockProdutores = [
        { id: 1, name: 'João da Silva', doc: '123.456.789-00', contact: '(31) 99876-5432', email: 'joao.silva@email.com', loc: 'Córrego Fundo', status: 'ativo', activity: '2 dias atrás' },
        { id: 2, name: 'Maria Oliveira', doc: '234.567.890-11', contact: '(31) 98765-4321', email: 'maria.oli@email.com', loc: 'Vargem Grande', status: 'pendente', activity: '5 horas atrás' },
        { id: 3, name: 'Antônio Santos', doc: '345.678.901-22', contact: '(31) 99999-8888', email: 'santos.ant@email.com', loc: 'Centro Rural', status: 'ativo', activity: '1 semana atrás' },
        { id: 4, name: 'Lúcia Ferreira', doc: '456.789.012-33', contact: '(31) 97777-6666', email: 'lucia.fer@email.com', loc: 'Serra Verde', status: 'inativo', activity: '1 mês atrás' },
        { id: 5, name: 'Pedro Costa', doc: '567.890.123-44', contact: '(31) 95555-4444', email: 'pedro.c@email.com', loc: 'Córrego Fundo', status: 'ativo', activity: '3 dias atrás' },
    ];

    const mockMaquinario = [
        { id: 1, name: 'Trator MF 4275', model: 'Massey Ferguson', year: '2019', ident: 'TR-01', status: 'disponivel', maintenance: 'Em dia' },
        { id: 2, name: 'Grade Aradora', model: 'Baldan', year: '2020', ident: 'GR-03', status: 'em_uso', maintenance: 'Próxima em 15d' },
        { id: 3, name: 'Plantadeira', model: 'Jumil', year: '2018', ident: 'PL-02', status: 'manutencao', maintenance: 'Atrasada' },
    ];

    const mockPropriedades = [
        { id: 1, name: 'Sítio Boa Esperança', car: 'MG-123456...', area: '45.5', loc: 'Zona Norte', status: 'regular', culture: 'Milho' },
        { id: 2, name: 'Fazenda Santa Rita', car: 'MG-654321...', area: '120.0', loc: 'Zona Leste', status: 'analise', culture: 'Soja' },
        { id: 3, name: 'Chácara do Sol', car: 'MG-987654...', area: '12.0', loc: 'Zona Sul', status: 'pendente', culture: 'Hortaliças' },
    ];

    useEffect(() => {
        setIsLoading(true);
        setSelectedId(null);
        setTimeout(() => {
            setIsLoading(false);
        }, 400);
    }, [activeTab]);

    const getData = () => {
        switch (activeTab) {
            case 'produtores': return mockProdutores;
            case 'maquinario': return mockMaquinario;
            case 'propriedades': return mockPropriedades;
        }
    };

    const getSelectedItem = () => getData().find(item => item.id === selectedId);

    const getColumns = (tab: Tab) => {
        switch (tab) {
            case 'produtores': return ['Produtor', 'Documento', 'Localidade', 'Status'];
            case 'maquinario': return ['Equipamento', 'Modelo/Ano', 'Ident.', 'Status'];
            case 'propriedades': return ['Localidade', 'CAR', 'Área (ha)', 'Situação'];
        }
    };

    const StatusBadge = ({ status, glass = false }: { status: string, glass?: boolean }) => {
        const styles: Record<string, string> = {
            ativo: glass ? 'bg-white/20 text-white backdrop-blur-md border-white/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
            disponivel: glass ? 'bg-white/20 text-white backdrop-blur-md border-white/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
            regular: glass ? 'bg-white/20 text-white backdrop-blur-md border-white/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
            pendente: glass ? 'bg-amber-500/20 text-white backdrop-blur-md border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-200',
            manutencao: glass ? 'bg-amber-500/20 text-white backdrop-blur-md border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-200',
            analise: glass ? 'bg-blue-500/20 text-white backdrop-blur-md border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-200',
            em_uso: glass ? 'bg-blue-500/20 text-white backdrop-blur-md border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-200',
            inativo: glass ? 'bg-white/10 text-white/70 backdrop-blur-md border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles['inativo']} shadow-sm`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const DetailsModal = () => {
        const item = getSelectedItem() as any;
        if (!item || !selectedId) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center isolate">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setSelectedId(null)}
                ></div>

                {/* Modal Content */}
                <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-scale-in m-4">
                    <button
                        onClick={() => setSelectedId(null)}
                        className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Reuse Hero Design */}
                    <div className="relative pb-4">
                        <div className="h-32 bg-gradient-to-br from-emerald-600 to-teal-900"></div>
                        <div className="px-6 -mt-12 flex flex-col items-center text-center relative z-10 w-full">
                            <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl shadow-emerald-900/10 mb-4">
                                <div className="w-full h-full rounded-2xl bg-slate-50 flex items-center justify-center text-emerald-600 overflow-hidden relative">
                                    {activeTab === 'produtores' && <User className="w-10 h-10" />}
                                    {activeTab === 'maquinario' && <Tractor className="w-10 h-10" />}
                                    {activeTab === 'propriedades' && <MapPin className="w-10 h-10" />}
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2 px-2">{item.name}</h3>
                            <div className="flex gap-2 mb-4">
                                <StatusBadge status={item.status} />
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pb-8 space-y-6">
                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex flex-col items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-emerald-100 hover:scale-[1.02] transition-all">
                                <FileText className="w-5 h-5 mb-1" /> Editar
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-slate-100 hover:scale-[1.02] transition-all">
                                <Star className="w-5 h-5 mb-1" /> Favorito
                            </button>
                        </div>

                        {/* Details List */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Documento</p>
                                    <p className="text-base font-bold text-slate-800">{item.doc || item.ident || item.car}</p>
                                </div>
                            </div>
                            {(item.contact) && (
                                <div className="flex items-center gap-4 group p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Contato</p>
                                        <p className="text-base font-bold text-slate-800">{item.contact}</p>
                                    </div>
                                </div>
                            )}
                            {(item.loc) && (
                                <div className="flex items-center gap-4 group p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                        <Map className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Localização</p>
                                        <p className="text-base font-bold text-slate-800">{item.loc}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full animate-fade-in pt-2 relative">
            {/* Modal Portal */}
            <DetailsModal />

            {/* Header & Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Filter className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Cadastros</h2>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Gestão de Recursos</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-slate-200 shadow-sm backdrop-blur-sm">
                    <div className="flex bg-slate-100/50 rounded-xl p-1 mr-2 relative">
                        {(['produtores', 'maquinario', 'propriedades'] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative z-10 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 ${activeTab === tab
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                {
                                    {
                                        produtores: 'Produtores',
                                        maquinario: 'Maquinário',
                                        propriedades: 'Localidade'
                                    }[tab]
                                }
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-48 focus:w-64 transition-all pl-10 pr-4 py-2 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:bg-white rounded-lg"
                        />
                    </div>

                    <button className="ml-2 w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-105 transition-all">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col relative transition-all duration-300">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                                <Filter className="w-6 h-6 text-emerald-500" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando...</span>
                        </div>
                    </div>
                )}
                <div className="overflow-auto flex-1 custom-scrollbar p-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-slate-100">
                                <th className="py-4 px-6 w-10">
                                    <div className="w-4 h-4 border-2 border-slate-300 rounded"></div>
                                </th>
                                {getColumns(activeTab).map((col, idx) => (
                                    <th key={idx} className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        {col}
                                    </th>
                                ))}
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {getData().map((item: any) => (
                                <tr
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    className="group transition-all duration-300 cursor-pointer hover:bg-slate-50"
                                >
                                    <td className="py-4 px-6 relative">
                                        <input type="checkbox" className="opacity-0 group-hover:opacity-100 rounded border-slate-300 text-emerald-600 transition-opacity" onClick={e => e.stopPropagation()} />
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 flex items-center justify-center text-xs font-bold transition-all shadow-sm">
                                                {activeTab === 'produtores' && <User className="w-5 h-5" />}
                                                {activeTab === 'maquinario' && <Tractor className="w-5 h-5" />}
                                                {activeTab === 'propriedades' && <MapPin className="w-5 h-5" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate text-slate-700 group-hover:text-emerald-700 transition-colors">
                                                    {item.name}
                                                </p>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mt-0.5">{item.type || 'Registro'}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {activeTab === 'produtores' && (
                                        <>
                                            <td className="py-4 px-4 text-xs font-semibold text-slate-600">{item.doc}</td>
                                            <td className="py-4 px-4 text-xs font-semibold text-slate-600">{item.loc}</td>
                                        </>
                                    )}
                                    {activeTab === 'maquinario' && (
                                        <>
                                            <td className="py-4 px-4 text-xs font-semibold text-slate-600">{item.model} <span className="text-slate-400 font-normal">/ {item.year}</span></td>
                                            <td className="py-4 px-4 text-xs font-semibold text-slate-600">{item.ident}</td>
                                        </>
                                    )}
                                    {activeTab === 'propriedades' && (
                                        <>
                                            <td className="py-4 px-4 text-xs font-semibold text-slate-600">{item.car}</td>
                                            <td className="py-4 px-4 text-xs font-semibold text-slate-600">{item.area} ha</td>
                                        </>
                                    )}

                                    <td className="py-4 px-4">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-500 transition-all opacity-0 group-hover:opacity-100">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
