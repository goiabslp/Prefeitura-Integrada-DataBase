import React, { useState, useMemo } from 'react';
import { Search, History, Car, User, MapPin, Clock, Eye, Filter, Calendar, ArrowLeft, Building2, Target } from 'lucide-react';
import { Vehicle, Person, VehicleSchedule, ScheduleStatus, Sector } from '../types';

interface VehicleScheduleHistoryProps {
  schedules: VehicleSchedule[];
  vehicles: Vehicle[];
  persons: Person[];
  sectors: Sector[];
  onViewDetails: (s: VehicleSchedule) => void;
  onBack?: () => void;
}

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
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
  sectors,
  onViewDetails,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingPurpose, setViewingPurpose] = useState<VehicleSchedule | null>(null);

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
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in bg-slate-50 p-6 md:p-8 relative">
      <div className="max-w-6xl mx-auto w-full space-y-6 flex flex-col h-full">
        {onBack && (
          <button onClick={onBack} className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold w-fit transition-all">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs uppercase tracking-widest">Voltar</span>
          </button>
        )}

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
                const requesterPerson = persons.find(p => p.id === s.requesterPersonId);
                const sector = sectors.find(sec => sec.id === s.serviceSectorId);
                const cfg = STATUS_MAP[s.status];

                return (
                  <div key={s.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.15)] transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3 group relative overflow-hidden">

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                      <Car className="w-24 h-24 text-indigo-900 transform rotate-12 translate-x-8 -translate-y-8" />
                    </div>

                    {/* Cabeçalho do Card */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
                      {/* Lado Esquerdo: Veículo e Informações Principais */}
                      <div className="flex flex-col lg:flex-row gap-4 lg:items-center flex-1">

                        {/* Veículo Icon & Info */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all duration-300 shadow-inner border border-white">
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-700 transition-colors">{v?.model || 'Desconhecido'}</h4>
                            <span className="inline-block mt-0.5 font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 uppercase tracking-wider">{v?.plate || '---'}</span>
                          </div>
                        </div>

                        {/* Divider Mobile/Desktop */}
                        <div className="hidden lg:block w-px h-10 bg-slate-100 mx-1"></div>

                        {/* Informações de Viagem (Datas e Destino) - Header */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                          <div className="group/item flex flex-col gap-1.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Saída</p>
                            <div className="w-12 h-14 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm shrink-0 group-hover/item:border-indigo-200 group-hover/item:shadow-indigo-500/10 transition-all p-1">
                              <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5">
                                {new Date(s.departureDateTime).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                              </span>
                              <span className="text-lg font-black text-slate-700 leading-none group-hover/item:text-indigo-600 transition-colors mb-0.5">
                                {new Date(s.departureDateTime).getDate()}
                              </span>
                              <span className="text-[8px] font-bold text-slate-500 bg-slate-50 px-1 py-px rounded border border-slate-100">
                                {new Date(s.departureDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <div className="group/item flex flex-col gap-1.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Retorno</p>
                            {s.returnDateTime ? (
                              <div className="w-12 h-14 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm shrink-0 group-hover/item:border-indigo-200 group-hover/item:shadow-indigo-500/10 transition-all p-1">
                                <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5">
                                  {new Date(s.returnDateTime).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                </span>
                                <span className="text-lg font-black text-slate-700 leading-none group-hover/item:text-indigo-600 transition-colors mb-0.5">
                                  {new Date(s.returnDateTime).getDate()}
                                </span>
                                <span className="text-[8px] font-bold text-slate-500 bg-slate-50 px-1 py-px rounded border border-slate-100">
                                  {new Date(s.returnDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ) : (
                              <div className="w-12 h-14 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[10px] font-black text-slate-300">--</span>
                              </div>
                            )}
                          </div>

                          <div className="group/item overflow-hidden flex flex-col justify-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 group-hover/item:text-indigo-500 transition-colors"><MapPin className="w-3 h-3" /> Destino</p>
                            <p className="text-xs font-bold text-slate-700 truncate" title={s.destination}>{s.destination}</p>
                          </div>

                          {/* Botão Ver Motivo - No Header */}
                          <div className="flex items-center">
                            <button
                              onClick={() => setViewingPurpose(s)}
                              className="w-full px-3 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-bold uppercase tracking-wide rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 group/btn"
                            >
                              <Target className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" /> Ver Motivo da Viagem
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Status e Ações */}
                      <div className="flex items-center gap-2 shrink-0 lg:self-center self-start">
                        <div className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-sm bg-${cfg.color}-50/80 text-${cfg.color}-700 border-${cfg.color}-200 flex items-center gap-1.5`}>
                          <cfg.icon className="w-3 h-3" /> {cfg.label}
                        </div>
                        <button onClick={() => onViewDetails(s)} className="p-2 bg-white border border-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 rounded-lg transition-all active:scale-95 shadow-sm hover:shadow-md"><Eye className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Grid de Informações Secundárias */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 relative z-10 transition-colors group-hover:bg-indigo-50/30 group-hover:border-indigo-100/50">
                      {/* Solicitante */}
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><User className="w-3 h-3" /> Solicitante</p>
                        <p className="text-[10px] font-bold text-slate-600 truncate" title={requesterPerson?.name}>{requesterPerson?.name || '---'}</p>
                      </div>

                      {/* Motorista */}
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><User className="w-3 h-3" /> Motorista</p>
                        <p className="text-[10px] font-bold text-slate-600 truncate" title={d?.name}>{d?.name || '---'}</p>
                      </div>

                      {/* Setor */}
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Building2 className="w-3 h-3" /> Setor</p>
                        <p className="text-[10px] font-bold text-slate-600 truncate" title={sector?.name}>{sector?.name || '---'}</p>
                      </div>
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

      {/* Modal de Visualização do Objetivo */}
      {viewingPurpose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-slide-up">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Objetivo da Viagem</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detalhes do Agendamento</p>
                </div>
              </div>
              <button onClick={() => setViewingPurpose(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8">
              <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 relative">
                <p className="text-base text-slate-700 font-medium leading-relaxed">
                  "{viewingPurpose.purpose}"
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
              <button onClick={() => setViewingPurpose(null)} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-indigo-600 transition-all">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};