
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Signature, User, Person, Sector, Job } from '../types';
import { Plus, Search, Edit2, Trash2, PenTool, Save, X, ShieldAlert, User as UserIcon, Briefcase, Network, ChevronDown, Check } from 'lucide-react';

interface SignatureManagementScreenProps {
  signatures: Signature[];
  persons: Person[];
  sectors: Sector[];
  jobs: Job[];
  onAddSignature: (sig: Signature) => void;
  onUpdateSignature: (sig: Signature) => void;
  onDeleteSignature: (id: string) => void;
  isReadOnly?: boolean;
  currentUser: User;
}

export const SignatureManagementScreen: React.FC<SignatureManagementScreenProps> = ({
  signatures,
  persons,
  sectors,
  jobs,
  onAddSignature,
  onUpdateSignature,
  onDeleteSignature,
  isReadOnly = false,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSig, setEditingSig] = useState<Signature | null>(null);

  // Dropdown states
  const [isPersonDropdownOpen, setIsPersonDropdownOpen] = useState(false);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [sectorSearch, setSectorSearch] = useState('');

  const [formData, setFormData] = useState<Partial<Signature>>({
    name: '',
    role: '',
    sector: ''
  });

  // Refs for click outside detection
  const personDropdownRef = useRef<HTMLDivElement>(null);
  const jobDropdownRef = useRef<HTMLDivElement>(null);
  const sectorDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (personDropdownRef.current && !personDropdownRef.current.contains(event.target as Node)) {
        setIsPersonDropdownOpen(false);
      }
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(event.target as Node)) {
        setIsJobDropdownOpen(false);
      }
      if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(event.target as Node)) {
        setIsSectorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isAdmin = currentUser.role === 'admin';

  // Filtra as assinaturas: Admins vêem tudo, colaboradores vêem apenas as permitidas
  const baseSignatures = isAdmin
    ? signatures
    : signatures.filter(sig => (currentUser.allowedSignatureIds || []).includes(sig.id));

  const sortedSignatures = [...baseSignatures].sort((a, b) => a.name.localeCompare(b.name));

  const filteredSignatures = sortedSignatures.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (sig?: Signature) => {
    if (isReadOnly) return;
    if (sig) {
      setEditingSig(sig);
      setFormData({ ...sig });
    } else {
      setEditingSig(null);
      setFormData({ name: '', role: '', sector: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (isReadOnly) return;
    if (!formData.name || !formData.role) {
      alert("Nome e Cargo são obrigatórios.");
      return;
    }

    const sigData = {
      id: editingSig ? editingSig.id : Date.now().toString(),
      name: formData.name,
      role: formData.role,
      sector: formData.sector || ''
    } as Signature;

    if (editingSig) {
      onUpdateSignature(sigData);
    } else {
      onAddSignature(sigData);
    }
    setIsModalOpen(false);
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1";

  return (
    <div className="flex-1 h-full bg-slate-100 p-6 md:p-12 overflow-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Assinaturas</h2>
            <p className="text-slate-500 mt-1">
              {isAdmin
                ? 'Crie e gerencie as assinaturas disponíveis para uso nos documentos.'
                : 'Visualize as assinaturas que você tem permissão para utilizar.'}
            </p>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Assinatura
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar assinatura..."
            className="flex-1 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid gap-4">
          {filteredSignatures.map(sig => (
            <div key={sig.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 shadow-sm">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{sig.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{sig.role}</p>
                  {sig.sector && (
                    <p className="text-xs text-slate-400 mt-0.5">{sig.sector}</p>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-1 border-l border-slate-100 pl-3 ml-2">
                  <button
                    onClick={() => handleOpenModal(sig)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteSignature(sig.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredSignatures.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
              <ShieldAlert className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-lg font-bold text-slate-500">Nenhuma assinatura disponível</p>
              <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                {isAdmin
                  ? 'Não há assinaturas cadastradas. Use o botão "Nova Assinatura" para começar.'
                  : 'Você ainda não possui permissão para acessar nenhuma assinatura. Contate um administrador.'}
              </p>
            </div>
          )}
        </div>

        {!isReadOnly && isModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingSig ? 'Editar Assinatura' : 'Nova Assinatura'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* SELECTOR DE PESSOA */}
                <div className="relative" ref={personDropdownRef}>
                  <label className={labelClass}><UserIcon className="w-3.5 h-3.5 inline mr-1.5 align-text-bottom text-indigo-500" /> Nome Completo</label>
                  <div
                    onClick={() => setIsPersonDropdownOpen(!isPersonDropdownOpen)}
                    className={`${inputClass} flex items-center justify-between cursor-pointer group hover:border-indigo-300 relative z-10`}
                  >
                    <span className={formData.name ? 'text-slate-900 font-bold' : 'text-slate-400 font-normal'}>
                      {formData.name || 'Selecione ou digite o nome...'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isPersonDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isPersonDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-60">
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 sticky top-0">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                          autoFocus
                          className="bg-transparent outline-none text-sm font-medium w-full text-slate-700"
                          placeholder="Pesquisar pessoa..."
                          value={personSearch}
                          onChange={e => setPersonSearch(e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <div className="overflow-y-auto custom-scrollbar p-1">
                        <button
                          onClick={() => {
                            setFormData({ ...formData, name: personSearch });
                            setIsPersonDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          Usar texto: "{personSearch}"
                        </button>
                        {persons.filter(p => p.name.toLowerCase().includes(personSearch.toLowerCase())).map(person => (
                          <button
                            key={person.id}
                            onClick={() => {
                              // Auto-fill role and sector logic
                              const personJob = jobs.find(j => j.id === person.jobId)?.name || '';
                              const personSector = sectors.find(s => s.id === person.sectorId)?.name || '';

                              setFormData({
                                ...formData,
                                name: person.name,
                                role: personJob || formData.role,
                                sector: personSector || formData.sector
                              });
                              setIsPersonDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between group"
                          >
                            <span>{person.name}</span>
                            {formData.name === person.name && <Check className="w-4 h-4 text-emerald-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SELECTOR DE CARGO */}
                <div className="relative" ref={jobDropdownRef}>
                  <label className={labelClass}><Briefcase className="w-3.5 h-3.5 inline mr-1.5 align-text-bottom text-indigo-500" /> Cargo</label>
                  <div
                    onClick={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
                    className={`${inputClass} flex items-center justify-between cursor-pointer group hover:border-indigo-300 relative z-[5]`}
                  >
                    <span className={formData.role ? 'text-slate-900 font-bold' : 'text-slate-400 font-normal'}>
                      {formData.role || 'Selecione ou digite o cargo...'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isJobDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-60">
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 sticky top-0">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                          autoFocus
                          className="bg-transparent outline-none text-sm font-medium w-full text-slate-700"
                          placeholder="Pesquisar cargo..."
                          value={jobSearch}
                          onChange={e => setJobSearch(e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <div className="overflow-y-auto custom-scrollbar p-1">
                        <button
                          onClick={() => {
                            setFormData({ ...formData, role: jobSearch });
                            setIsJobDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          Usar texto: "{jobSearch}"
                        </button>
                        {jobs.filter(j => j.name.toLowerCase().includes(jobSearch.toLowerCase())).map(job => (
                          <button
                            key={job.id}
                            onClick={() => {
                              setFormData({ ...formData, role: job.name });
                              setIsJobDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between group"
                          >
                            <span>{job.name}</span>
                            {formData.role === job.name && <Check className="w-4 h-4 text-emerald-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SELECTOR DE SETOR */}
                <div className="relative" ref={sectorDropdownRef}>
                  <label className={labelClass}><Network className="w-3.5 h-3.5 inline mr-1.5 align-text-bottom text-indigo-500" /> Setor</label>
                  <div
                    onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
                    className={`${inputClass} flex items-center justify-between cursor-pointer group hover:border-indigo-300 relative z-[1]`}
                  >
                    <span className={formData.sector ? 'text-slate-900 font-bold' : 'text-slate-400 font-normal'}>
                      {formData.sector || 'Selecione ou digite o setor...'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isSectorDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isSectorDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-60">
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 sticky top-0">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                          autoFocus
                          className="bg-transparent outline-none text-sm font-medium w-full text-slate-700"
                          placeholder="Pesquisar setor..."
                          value={sectorSearch}
                          onChange={e => setSectorSearch(e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <div className="overflow-y-auto custom-scrollbar p-1">
                        <button
                          onClick={() => {
                            setFormData({ ...formData, sector: sectorSearch });
                            setIsSectorDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          Usar texto: "{sectorSearch}"
                        </button>
                        {sectors.filter(s => s.name.toLowerCase().includes(sectorSearch.toLowerCase())).map(sector => (
                          <button
                            key={sector.id}
                            onClick={() => {
                              setFormData({ ...formData, sector: sector.name });
                              setIsSectorDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between group"
                          >
                            <span>{sector.name}</span>
                            {formData.sector === sector.name && <Check className="w-4 h-4 text-emerald-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
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
