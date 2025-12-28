import React, { useState, useMemo } from 'react';
import { Search, History, Car, User, MapPin, Clock, Eye, Filter, Calendar } from 'lucide-react';
import { Vehicle, Person, VehicleSchedule, ScheduleStatus } from '../types';

interface VehicleScheduleHistoryProps {
  schedules: VehicleSchedule[];
  vehicles: Vehicle[];
  persons: Person[];
  onViewDetails: (s: VehicleSchedule) => void;
}

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

const STATUS_MAP: Record<ScheduleStatus, { label: string, color: string, icon: any }> = {
  pendente: { label: 'Aguardando', color: 'amber', icon: Clock },
  confirmado: { label: 'Confirmado', color: 'emerald', icon: CheckCircle2 },
  em_curso: { label: 'Em Curso', color: 'blue', icon: MapPin },
  concluido: { label: 'Concluído', color: 'slate', icon: History },
  cancelado: { label: 'Rejeitado/Cancelado', color: 'rose', icon: X },
};

export const VehicleScheduleHistory: React.FC<VehicleScheduleHistoryProps> = ({
  schedules,
  vehicles,
  persons,
  onViewDetails
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return schedules
      .filter(s => {
        const v = vehicles.find(veh => veh.id === s.vehicleId);
        const d = persons.find(p => p.id === s.driverId);
        const term = searchTerm.toLowerCase();
        return (
          v?.model.toLowerCase().includes(term) || 
          v?.plate.toLowerCase().includes(term) || 
          d?.name.toLowerCase().includes(term) || 
          s.destination.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.departureDateTime.localeCompare(a.departureDateTime));
  }, [schedules, vehicles, persons, searchTerm]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6 flex flex-col h-full">
        {/* Barra de Busca */}
        <div className="relative group shrink-0">
          <input 
            type="text" 
            placeholder="Pesquisar no histórico (Placa, Motorista, Destino)..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-4 pb-8">
            {filtered.length > 0 ? (
              filtered.map(s => {
                const v = vehicles.find(veh => veh.id === s.vehicleId);
                const d = persons.find(p => p.id === s.driverId);
                const cfg = STATUS_MAP[s.status];
                
                return (
                  <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-slate-900 transition-colors"></div>
                    
                    <div className="flex items-center gap-6 flex-1 ml-2">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shrink-0">
                        <Car className="w-8 h-8" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{v?.model || 'Desconhecido'}</h4>
                          <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">{v?.plate || '---'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1.5 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                           <span className="flex items-center gap-2"><User className="w-4 h-4 text-slate-300" /> {d?.name || '---'}</span>
                           <span className="flex items-center gap-2 text-indigo-600"><MapPin className="w-4 h-4" /> {s.destination}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 md:border-l md:border-slate-100 md:pl-8">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Partida em</p>
                        <p className="text-sm font-black text-slate-800">{new Date(s.departureDateTime).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className={`px-5 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest bg-${cfg.color}-50 text-${cfg.color}-700 border-${cfg.color}-200 flex items-center gap-2.5`}>
                        <cfg.icon className="w-4 h-4" /> {cfg.label}
                      </div>
                      <button onClick={() => onViewDetails(s)} className="p-3 bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all active:scale-95"><Eye className="w-5 h-5" /></button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center">
                <History className="w-16 h-16 text-slate-200 mb-4" />
                <p className="text-xl font-black text-slate-400 uppercase tracking-widest">Nenhum registro localizado</p>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 flex justify-between items-center px-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total de {filtered.length} agendamentos</span>
           <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filtro Ativo: Todos</span>
           </div>
        </div>
      </div>
    </div>
  );
};