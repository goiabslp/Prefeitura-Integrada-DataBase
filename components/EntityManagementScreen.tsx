
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Person, Sector, Job } from '../types';
import { 
  Plus, Search, Edit2, Trash2, Save, X, 
  User as UserIcon, Network, Briefcase, CheckCircle2, Trash, AlertTriangle, Info
} from 'lucide-react';

interface EntityManagementScreenProps {
  persons: Person[];
  sectors: Sector[];
  jobs: Job[];
  onAddPerson: (p: Person) => void;
  onUpdatePerson: (p: Person) => void;
  onDeletePerson: (id: string) => void;
  onAddSector: (s: Sector) => void;
  onUpdateSector: (s: Sector) => void;
  onDeleteSector: (id: string) => void;
  onAddJob: (j: Job) => void;
  onUpdateJob: (j: Job) => void;
  onDeleteJob: (id: string) => void;
}

export const EntityManagementScreen: React.FC<EntityManagementScreenProps> = ({
  persons, sectors, jobs,
  onAddPerson, onUpdatePerson, onDeletePerson,
  onAddSector, onUpdateSector, onDeleteSector,
  onAddJob, onUpdateJob, onDeleteJob
}) => {
  const [activeTab, setActiveTab] = useState<'persons' | 'sectors' | 'jobs'>('persons');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  // Modais customizados
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'warning'
  });

  const [formData, setFormData] = useState({
    name: '',
    jobId: '',
    sectorId: ''
  });

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        jobId: item.jobId || '',
        sectorId: item.sectorId || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', jobId: '', sectorId: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      return;
    }

    const commonData = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: formData.name
    };

    if (activeTab === 'persons') {
      const person: Person = { 
        ...commonData, 
        jobId: formData.jobId, 
        sectorId: formData.sectorId 
      };
      editingItem ? onUpdatePerson(person) : onAddPerson(person);
    } else if (activeTab === 'sectors') {
      const sector: Sector = { ...commonData };
      editingItem ? onUpdateSector(sector) : onAddSector(sector);
    } else {
      const job: Job = { ...commonData };
      editingItem ? onUpdateJob(job) : onAddJob(job);
    }

    setIsModalOpen(false);
  };

  const filteredItems = () => {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'persons') return persons.filter(p => p.name.toLowerCase().includes(term));
    if (activeTab === 'sectors') return sectors.filter(s => s.name.toLowerCase().includes(term));
    return jobs.filter(j => j.name.toLowerCase().includes(term));
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1";

  return (
    <div className="flex-1 h-full bg-slate-100 p-6 md:p-12 overflow-auto custom-scrollbar animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Base Organizacional</h2>
            <p className="text-slate-500 mt-1">Gerencie pessoas, setores e cargos independentemente.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar {activeTab === 'persons' ? 'Pessoa' : activeTab === 'sectors' ? 'Setor' : 'Cargo'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
          <button 
            onClick={() => { setActiveTab('persons'); setSearchTerm(''); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'persons' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <UserIcon className="w-4 h-4" /> Pessoas
          </button>
          <button 
            onClick={() => { setActiveTab('sectors'); setSearchTerm(''); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sectors' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Network className="w-4 h-4" /> Setores
          </button>
          <button 
            onClick={() => { setActiveTab('jobs'); setSearchTerm(''); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'jobs' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Briefcase className="w-4 h-4" /> Cargos
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder={`Buscar em ${activeTab === 'persons' ? 'pessoas' : activeTab === 'sectors' ? 'setores' : 'cargos'}...`}
            className="flex-1 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid gap-4">
           {filteredItems().map((item: any) => (
             <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 shadow-sm">
                    {activeTab === 'persons' ? <UserIcon className="w-6 h-6" /> : activeTab === 'sectors' ? <Network className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
                    {activeTab === 'persons' && (
                      <div className="flex gap-3 text-xs text-slate-500 mt-1 font-medium">
                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> {jobs.find(j => j.id === item.jobId)?.name || 'Sem Cargo'}
                        </span>
                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                          <Network className="w-3 h-3" /> {sectors.find(s => s.id === item.sectorId)?.name || 'Sem Setor'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                   <button 
                     onClick={() => setConfirmModal({
                         isOpen: true,
                         title: "Remover Item",
                         message: `Deseja realmente excluir "${item.name}"? Esta ação afetará documentos que utilizam esta referência.`,
                         type: 'danger',
                         onConfirm: () => {
                            if (activeTab === 'persons') onDeletePerson(item.id);
                            else if (activeTab === 'sectors') onDeleteSector(item.id);
                            else onDeleteJob(item.id);
                            setConfirmModal({ ...confirmModal, isOpen: false });
                         }
                     })} 
                     className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
             </div>
           ))}
           
           {filteredItems().length === 0 && (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
               <X className="w-12 h-12 text-slate-300 mb-4" />
               <p className="text-lg font-bold text-slate-500">Nenhum registro encontrado</p>
               <p className="text-sm text-slate-400 mt-1">Comece adicionando novos itens clicando no botão acima.</p>
             </div>
           )}
        </div>

        {isModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-slide-up">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingItem ? 'Editar' : 'Adicionar'} {activeTab === 'persons' ? 'Pessoa' : activeTab === 'sectors' ? 'Setor' : 'Cargo'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-8 space-y-6">
                 <div>
                    <label className={labelClass}>Nome Completo / Título</label>
                    <input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className={inputClass} 
                      placeholder="Digite o nome..." 
                      autoFocus
                    />
                 </div>

                 {activeTab === 'persons' && (
                   <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className={labelClass}>Cargo</label>
                        <select 
                          value={formData.jobId} 
                          onChange={e => setFormData({...formData, jobId: e.target.value})} 
                          className={inputClass}
                        >
                          <option value="">Selecione um Cargo</option>
                          {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Setor</label>
                        <select 
                          value={formData.sectorId} 
                          onChange={e => setFormData({...formData, sectorId: e.target.value})} 
                          className={inputClass}
                        >
                          <option value="">Selecione um Setor</option>
                          {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                   </div>
                 )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                 <button onClick={handleSave} className="px-8 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-xl flex items-center gap-2 transition-all"><Save className="w-5 h-5" /> Salvar</button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL DE CONFIRMAÇÃO PERSONALIZADO */}
        {confirmModal.isOpen && createPortal(
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-white/20">
                    <div className="p-8 text-center">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${
                            confirmModal.type === 'danger' ? 'bg-rose-50 text-rose-600 shadow-rose-500/10' : 
                            'bg-indigo-50 text-indigo-600 shadow-indigo-500/10'
                        }`}>
                            {confirmModal.type === 'danger' ? <Trash className="w-10 h-10" /> : <Info className="w-10 h-10" />}
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">{confirmModal.title}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">{confirmModal.message}</p>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                        <button 
                            onClick={confirmModal.onConfirm}
                            className={`w-full py-4 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-[0.98] ${
                                confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 
                                'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                            }`}
                        >
                            Confirmar Ação
                        </button>
                        <button 
                            onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                            className="w-full py-4 bg-white text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}
      </div>
    </div>
  );
};
