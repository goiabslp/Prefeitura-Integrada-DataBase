import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CrewMember, Person, VehicleSchedule } from '../types';
import { User, X, Plus, Trash2, Edit2, MapPin, Clock, Save } from 'lucide-react';

interface VehicleCrewModalProps {
  schedule: VehicleSchedule;
  persons: Person[];
  onClose: () => void;
  onSave: (scheduleId: string, driverId: string, passengers: CrewMember[]) => Promise<void>;
  isSaving?: boolean;
}

export const VehicleCrewModal: React.FC<VehicleCrewModalProps> = ({
  schedule,
  persons,
  onClose,
  onSave,
  isSaving = false
}) => {
  const [driverId, setDriverId] = useState(schedule.driverId);
  const [passengers, setPassengers] = useState<CrewMember[]>(schedule.passengers || []);
  const [editingPassengerIndex, setEditingPassengerIndex] = useState<number | null>(null);

  // Form states for passenger
  const [pName, setPName] = useState('');
  const [pDeparture, setPDeparture] = useState('');
  const [pTime, setPTime] = useState('');
  const [pLocation, setPLocation] = useState('');

  const resetForm = () => {
    setPName('');
    setPDeparture('');
    setPTime('');
    setPLocation('');
    setEditingPassengerIndex(null);
  };

  const handleAddPassenger = () => {
    if (!pName || !pDeparture || !pTime || !pLocation) {
        alert("Preencha todos os campos do passageiro");
        return;
    }
    const newPassenger: CrewMember = {
      name: pName,
      departureLocation: pDeparture,
      appointmentTime: pTime,
      appointmentLocation: pLocation
    };
    
    if (editingPassengerIndex !== null) {
      const updated = [...passengers];
      updated[editingPassengerIndex] = newPassenger;
      setPassengers(updated);
    } else {
      setPassengers([...passengers, newPassenger]);
    }
    resetForm();
  };

  const handleEditPassenger = (index: number) => {
    const p = passengers[index];
    setPName(p.name);
    setPDeparture(p.departureLocation);
    setPTime(p.appointmentTime);
    setPLocation(p.appointmentLocation);
    setEditingPassengerIndex(index);
  };

  const handleDeletePassenger = (index: number) => {
    if (window.confirm("Remover este passageiro?")) {
        setPassengers(passengers.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    await onSave(schedule.id, driverId, passengers);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Tripulação do Veículo</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Protocolo: {schedule.protocol}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Driver Section (Slot 1 - Fixed) */}
          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <User className="w-32 h-32" />
             </div>
             <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                     <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">01</span>
                     <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Condutor (Vaga Fixa)</h4>
                 </div>
                 
                 <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selecione o Motorista</label>
                     <select 
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                     >
                         {persons.map(p => (
                             <option key={p.id} value={p.id}>{p.name} {p.jobId ? '(Motorista)' : ''}</option>
                         ))}
                     </select>
                 </div>
             </div>
          </div>

          {/* Passengers Section (Slots 2-5) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                 <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    Passageiros / Pacientes
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[10px]">{passengers.length}/4 Vagas</span>
                 </h4>
            </div>

            {/* List */}
             <div className="grid gap-3">
                 {passengers.map((p, idx) => (
                     <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                         <div className="flex items-center gap-4">
                             <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-black group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                 {String(idx + 2).padStart(2, '0')}
                             </span>
                             <div>
                                 <p className="font-bold text-slate-800">{p.name}</p>
                                 <div className="flex items-center gap-3 text-[10px] text-slate-500 uppercase tracking-wide mt-1">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.appointmentTime}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.appointmentLocation}</span>
                                 </div>
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                             <button onClick={() => handleEditPassenger(idx)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                             <button onClick={() => handleDeletePassenger(idx)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                         </div>
                     </div>
                 ))}
                 
                 {passengers.length === 0 && (
                     <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-sm font-medium">
                         Nenhum passageiro adicionado.
                     </div>
                 )}
             </div>

             {/* Add Form */}
             {passengers.length < 4 && (
                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 mt-4 animate-fade-in">
                     <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                         {editingPassengerIndex !== null ? 'Editar Passageiro' : 'Adicionar Novo Passageiro'}
                     </h5>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div className="md:col-span-2">
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome Completo</label>
                             <input type="text" value={pName} onChange={(e) => setPName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500" placeholder="Nome do passageiro" />
                         </div>
                         <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Local de Partida</label>
                             <input type="text" value={pDeparture} onChange={(e) => setPDeparture(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500" placeholder="Ex: Secretaria de Saúde" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Horário</label>
                                 <input type="time" value={pTime} onChange={(e) => setPTime(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500" />
                             </div>
                         </div>
                         <div className="md:col-span-2">
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Local do Compromisso</label>
                             <input type="text" value={pLocation} onChange={(e) => setPLocation(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500" placeholder="Ex: Hospital Regional" />
                         </div>
                     </div>
                     
                     <div className="flex justify-end gap-2">
                         {editingPassengerIndex !== null && (
                             <button onClick={resetForm} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700">Cancelar</button>
                         )}
                         <button 
                            onClick={handleAddPassenger}
                            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                         >
                             {editingPassengerIndex !== null ? <Edit2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                             {editingPassengerIndex !== null ? 'Atualizar' : 'Adicionar à Lista'}
                         </button>
                     </div>
                 </div>
             )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 z-20">
            <button 
                onClick={onClose} 
                disabled={isSaving}
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-500/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSaving ? (
                    <>Salvando...</>
                ) : (
                    <>
                        <Save className="w-4 h-4" /> Salvar Alterações
                    </>
                )}
            </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
