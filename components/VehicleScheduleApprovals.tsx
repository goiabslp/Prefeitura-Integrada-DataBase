
import React from 'react';
import { ShieldCheck, Car, User, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, ArrowLeft } from 'lucide-react';
import { Vehicle, Person, VehicleSchedule, Sector } from '../types';

interface VehicleScheduleApprovalsProps {
  schedules: VehicleSchedule[];
  vehicles: Vehicle[];
  persons: Person[];
  sectors: Sector[];
  onApprove: (s: VehicleSchedule) => void;
  onReject: (s: VehicleSchedule) => void;
  onBack?: () => void;
}

export const VehicleScheduleApprovals: React.FC<VehicleScheduleApprovalsProps> = ({
  schedules,
  vehicles,
  persons,
  sectors,
  onApprove,
  onReject,
  onBack
}) => {
  const pending = schedules.filter(s => s.status === 'pendente').sort((a, b) => a.departureDateTime.localeCompare(b.departureDateTime));

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in bg-slate-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6 flex flex-col h-full">
        {onBack && (
          <button onClick={onBack} className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold w-fit transition-all">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs uppercase tracking-widest">Voltar</span>
          </button>
        )}

        <div className="bg-emerald-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-900/10 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Triagem de Frota</h3>
            <p className="text-emerald-100 text-sm mt-1 font-medium opacity-80">Autorize ou rejeite solicitações de saída de veículos.</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-sm font-black uppercase tracking-widest relative z-10">
            {pending.length} Pendentes
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-6 pb-8">
            {pending.length > 0 ? (
              pending.map(s => {
                const v = vehicles.find(veh => veh.id === s.vehicleId);
                const d = persons.find(p => p.id === s.driverId);
                const sec = sectors.find(sec => sec.id === s.serviceSectorId);

                return (
                  <div key={s.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-slide-up group">
                    <div className="p-8 flex flex-col md:flex-row gap-10">
                      <div className="flex-1 space-y-8">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl group-hover:rotate-3 transition-transform">
                            <Car className="w-9 h-9" />
                          </div>
                          <div>
                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{v?.model || 'Desconhecido'}</h4>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-widest">{v?.plate || '---'}</span>
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">{s.destination}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Setor Atendido</p>
                            <p className="text-sm font-bold text-slate-700 truncate">{sec?.name || '---'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Motorista</p>
                            <p className="text-sm font-bold text-slate-700">{d?.name.split(' ')[0] || '---'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Data de Saída</p>
                            <p className="text-sm font-bold text-slate-700">{new Date(s.departureDateTime).toLocaleString('pt-BR')}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Motivo</p>
                            <p className="text-xs font-medium text-slate-500 italic truncate leading-relaxed">"{s.purpose}"</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-10 shrink-0">
                        <button
                          onClick={() => onApprove(s)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 group"
                        >
                          <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" /> Aprovar Saída
                        </button>
                        <button
                          onClick={() => onReject(s)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-white text-rose-600 border border-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95"
                        >
                          <XCircle className="w-5 h-5" /> Rejeitar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center text-emerald-100 border border-emerald-50">
                  <ShieldCheck className="w-14 h-14" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">Fila Vazia</p>
                  <p className="text-slate-400 font-medium">Nenhuma solicitação aguardando aprovação no momento.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
