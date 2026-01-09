import React from 'react';
import { Calendar as CalendarIcon, Filter, Search, ChevronLeft, ChevronRight, Clock, MapPin, User, MoreHorizontal } from 'lucide-react';

export const SchedulingView: React.FC = () => {
    // Mock Data
    const schedules = [
        { id: 1, resource: 'Trator John Deere', requester: 'João da Silva', local: 'Sítio Recanto', date: '2024-03-15', status: 'Confirmado' },
        { id: 2, resource: 'Retroescavadeira CAT', requester: 'Secretaria de Obras', local: 'Estrada Vicinal 3', date: '2024-03-16', status: 'Pendente' },
        { id: 3, resource: 'Caminhão Pipa', requester: 'Maria Oliveira', local: 'Fazenda Boa Vista', date: '2024-03-16', status: 'Em Andamento' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Programação</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Agenda de serviços e maquinário</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 w-64 shadow-sm"
                        />
                    </div>
                    <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                {/* Mini Calendar (Mock) */}
                <div className="md:col-span-2 space-y-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Março 2024</h3>
                            <div className="flex gap-1">
                                <button className="p-1 hover:bg-slate-50 rounded-lg"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                                <button className="p-1 hover:bg-slate-50 rounded-lg"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-2">
                            <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 31 }, (_, i) => (
                                <button key={i} className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i === 14 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'hover:bg-slate-50 text-slate-600'}`}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 rounded-[2rem] shadow-xl shadow-indigo-600/20 text-white">
                        <h3 className="text-lg font-black mb-1">Dica</h3>
                        <p className="text-indigo-100 text-xs leading-relaxed opacity-90">
                            Verifique a disponibilidade dos tratores antes de confirmar agendamentos para longos períodos.
                        </p>
                    </div>
                </div>

                {/* Schedule List */}
                <div className="md:col-span-5 space-y-4">
                    {schedules.map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${item.status === 'Confirmado' ? 'bg-emerald-500' :
                                    item.status === 'Em Andamento' ? 'bg-blue-500' : 'bg-amber-500'
                                }`}></div>

                            <div className="flex items-start justify-between pl-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${item.status === 'Confirmado' ? 'bg-emerald-50 text-emerald-600' :
                                                item.status === 'Em Andamento' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            {item.status}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <CalendarIcon className="w-3 h-3" /> {item.date}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800">{item.resource}</h3>
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
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
