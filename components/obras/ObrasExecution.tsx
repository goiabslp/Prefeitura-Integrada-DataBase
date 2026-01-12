import React from 'react';
import { Hammer, Filter, Search, ChevronLeft, ChevronRight, Clock, MapPin, User, MoreHorizontal, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ObrasExecution: React.FC = () => {
    // Mock Data
    const works = [
        { id: 1, type: 'Tapa Buraco', requester: 'Morador: Sr. João', local: 'Rua das Flores, 123', date: '2024-03-15', status: 'Em Andamento', priority: 'Alta' },
        { id: 2, type: 'Manutenção de Estrada', requester: 'Assoc. Rural', local: 'Estrada do Café, km 5', date: '2024-03-16', status: 'Pendente', priority: 'Normal' },
        { id: 3, type: 'Reparo de Ponte', requester: 'Defesa Civil', local: 'Córrego Fundo', date: '2024-03-16', status: 'Agendado', priority: 'Urgência' },
        { id: 4, type: 'Poda de Árvore', requester: 'Escola Municipal', local: 'Praça Central', date: '2024-03-18', status: 'Concluído', priority: 'Normal' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Concluído': return 'bg-emerald-500';
            case 'Em Andamento': return 'bg-blue-500';
            case 'Agendado': return 'bg-purple-500';
            case 'Pendente': return 'bg-amber-500';
            default: return 'bg-slate-500';
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'Urgência': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Urgência</span>;
            case 'Alta': return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Alta</span>;
            default: return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Normal</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Execução de Obras</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acompanhamento de serviços</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar obras..."
                            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-500 w-64 shadow-sm"
                        />
                    </div>
                    <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6 flex-1 min-h-0 overflow-hidden">
                {/* Status Column (Mock) */}
                <div className="md:col-span-2 space-y-4 overflow-y-auto custom-scrollbar">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm sticky top-0">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4">Resumo do Dia</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Tarefas Pendentes</span>
                                <span className="text-xs font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">5</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Em Andamento</span>
                                <span className="text-xs font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">3</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Concluídas</span>
                                <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">8</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-[2rem] shadow-xl shadow-orange-500/20 text-white">
                        <h3 className="text-lg font-black mb-1 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Atenção</h3>
                        <p className="text-orange-50 text-xs leading-relaxed opacity-90">
                            Há 2 solicitações de urgência aguardando vistoria técnica na região central.
                        </p>
                    </div>
                </div>

                {/* Works List */}
                <div className="md:col-span-5 space-y-4 overflow-y-auto custom-scrollbar pb-4">
                    {works.map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${getStatusColor(item.status)}`}></div>

                            <div className="flex items-start justify-between pl-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getPriorityBadge(item.priority)}
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {item.date}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                        {item.status === 'Concluído' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Hammer className="w-5 h-5 text-slate-400" />}
                                        {item.type}
                                    </h3>
                                </div>
                                <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6 pl-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Solicitante</p>
                                        <p className="text-xs font-bold text-slate-700">{item.requester}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Local</p>
                                        <p className="text-xs font-bold text-slate-700">{item.local}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 pl-4 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status: {item.status}</span>
                                <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${getStatusColor(item.status)}`} style={{ width: item.status === 'Concluído' ? '100%' : item.status === 'Em Andamento' ? '60%' : '0%' }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
