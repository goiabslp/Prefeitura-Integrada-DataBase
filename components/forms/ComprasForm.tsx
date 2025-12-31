
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ShoppingCart, FileText, PenTool, CheckCircle2, Columns,
  Plus, Trash2, Hash, Layers, MessageSquare, AlignLeft,
  Minus, ChevronDown, Package, Archive, Scale, Briefcase, Box,
  AlertTriangle, ShieldAlert, Zap, Info, User, Search, Check, UserCheck
} from 'lucide-react';
import { AppState, ContentData, DocumentConfig, Signature, PurchaseItem, Person, Sector, Job } from '../../types';

interface ComprasFormProps {
  state: AppState;
  content: ContentData;
  docConfig: DocumentConfig;
  allowedSignatures: Signature[];
  handleUpdate: (section: keyof AppState, key: string, value: any) => void;
  onUpdate: (newState: AppState) => void;
  persons: Person[];
  sectors: Sector[];
  jobs: Job[];
}

const UNIT_OPTIONS = [
  { value: 'Unidade', label: 'Unidade', icon: Box },
  { value: 'Pacote', label: 'Pacote', icon: Package },
  { value: 'Caixa', label: 'Caixa', icon: Archive },
  { value: 'Kg', label: 'Kg', icon: Scale },
  { value: 'Serviço', label: 'Serviço', icon: Briefcase },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'Normal', label: 'Normal', icon: Info, color: 'slate' },
  { value: 'Média', label: 'Média', icon: Zap, color: 'indigo' },
  { value: 'Alta', label: 'Alta', icon: AlertTriangle, color: 'amber' },
  { value: 'Urgência', label: 'Urgência', icon: ShieldAlert, color: 'rose' },
] as const;

export const ComprasForm: React.FC<ComprasFormProps> = ({
  state,
  content,
  docConfig,
  allowedSignatures,
  handleUpdate,
  onUpdate,
  persons,
  sectors,
  jobs
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isRequesterOpen, setIsRequesterOpen] = useState(false);
  const [requesterSearch, setRequesterSearch] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const requesterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
      if (requesterDropdownRef.current && !requesterDropdownRef.current.contains(event.target as Node)) {
        setIsRequesterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // FILTRO E ORDENAÇÃO ALFABÉTICA DOS SOLICITANTES
  const filteredRequesters = useMemo(() => {
    const term = requesterSearch.toLowerCase();
    return persons
      .filter(p => p.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [persons, requesterSearch]);

  // ORDENAÇÃO ALFABÉTICA DAS ASSINATURAS
  const sortedSignatures = useMemo(() => {
    return [...allowedSignatures].sort((a, b) => a.name.localeCompare(b.name));
  }, [allowedSignatures]);

  const handlePersonSelect = (personId: string) => {
    const person = persons.find(p => p.id === personId);
    if (person) {
      const job = jobs.find(j => j.id === person.jobId)?.name || '';
      const sector = sectors.find(s => s.id === person.sectorId)?.name || '';

      onUpdate({
        ...state,
        content: {
          ...state.content,
          requesterName: person.name,
          requesterRole: job,
          requesterSector: sector
        }
      });
    }
    setIsRequesterOpen(false);
    setRequesterSearch('');
  };

  const handleAddItem = () => {
    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unit: 'Unidade'
    };
    handleUpdate('content', 'purchaseItems', [...(content.purchaseItems || []), newItem]);
  };

  const handleRemoveItem = (id: string) => {
    handleUpdate('content', 'purchaseItems', (content.purchaseItems || []).filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, key: keyof PurchaseItem, value: any) => {
    handleUpdate('content', 'purchaseItems', (content.purchaseItems || []).map(item =>
      item.id === id ? { ...item, [key]: value } : item
    ));
  };

  const adjustQuantity = (id: string, delta: number) => {
    const items = content.purchaseItems || [];
    const item = items.find(i => i.id === id);
    if (item) {
      const newQty = Math.max(1, (item.quantity || 0) + delta);
      handleUpdateItem(id, 'quantity', newQty);
    }
  };

  const inputClass = "bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all w-full";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5";

  const showPriorityJustification = content.priority === 'Alta' || content.priority === 'Urgência';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Endereçamento */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Columns className="w-4 h-4 text-emerald-600" /> Blocos de Endereçamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bloco Esquerdo (Ref)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={docConfig.showLeftBlock} onChange={(e) => handleUpdate('document', 'showLeftBlock', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            {docConfig.showLeftBlock && (
              <textarea
                value={content.leftBlockText}
                onChange={(e) => handleUpdate('content', 'leftBlockText', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs h-24 resize-none focus:bg-white transition-all outline-none text-slate-700 font-medium"
                placeholder="Ref. Pedido..."
              />
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bloco Direito (Destino)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={docConfig.showRightBlock} onChange={(e) => handleUpdate('document', 'showRightBlock', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            {docConfig.showRightBlock && (
              <textarea
                value={content.rightBlockText}
                onChange={(e) => handleUpdate('content', 'rightBlockText', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs h-24 resize-none focus:bg-white transition-all outline-none text-slate-700 font-medium"
                placeholder={"Ao Departamento de Compras da\nPrefeitura de São José do Goiabal-MG"}
              />
            )}
          </div>
        </div>
      </div>

      {/* Dados do Solicitante (Dinamizado e Ordenado) */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" /> Dados do Solicitante
        </h3>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative" ref={requesterDropdownRef}>
            <label className={labelClass}>NOME COMPLETO</label>
            <div
              onClick={() => setIsRequesterOpen(!isRequesterOpen)}
              className={`${inputClass} flex items-center justify-between cursor-pointer py-3 ${isRequesterOpen ? 'border-emerald-500 ring-4 ring-emerald-500/5 bg-white' : ''}`}
            >
              <span className={content.requesterName ? 'text-slate-900 font-bold' : 'text-slate-400'}>
                {content.requesterName || 'Selecione o Solicitante...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isRequesterOpen ? 'rotate-180' : ''}`} />
            </div>

            {isRequesterOpen && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="p-3 border-b border-slate-100 bg-slate-50">
                  <div className="relative">
                    <input
                      type="text"
                      value={requesterSearch}
                      onChange={(e) => setRequesterSearch(e.target.value)}
                      placeholder="Pesquisar pessoa na lista..."
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {filteredRequesters.length > 0 ? (
                    filteredRequesters.map((person, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePersonSelect(person.id);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-emerald-50 text-left text-sm font-medium text-slate-700 transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className="group-hover:text-emerald-700">{person.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {jobs.find(j => j.id === person.jobId)?.name || 'N/A'} • {sectors.find(s => s.id === person.sectorId)?.name || 'N/A'}
                          </span>
                        </div>
                        {content.requesterName === person.name && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <User className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">Nenhuma pessoa encontrada.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cargo</label>
              <input
                type="text" value={content.requesterRole || ''}
                readOnly
                className={`${inputClass} bg-slate-100/50 cursor-not-allowed text-slate-500`}
                placeholder="Cargo automático"
              />
            </div>
            <div>
              <label className={labelClass}>Setor</label>
              <input
                type="text" value={content.requesterSector || ''}
                readOnly
                className={`${inputClass} bg-slate-100/50 cursor-not-allowed text-slate-500`}
                placeholder="Setor automático"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Identificação e Prioridade (Reordenado) */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-emerald-600" /> Requisição
        </h3>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <label className={labelClass}>Finalidade do Pedido</label>
            <input
              value={content.title}
              onChange={(e) => handleUpdate('content', 'title', e.target.value)}
              className={`${inputClass} font-bold text-slate-900 text-base`}
              placeholder="Ex: Requisição de Compras e Serviços de Material Escolar"
            />
          </div>

          {/* Bloco de Prioridade */}
          <div className="pt-2 border-t border-slate-100">
            <label className={labelClass}>Prioridade do Pedido</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = content.priority === opt.value;
                const colors = {
                  slate: isSelected ? 'bg-slate-600 border-slate-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100',
                  indigo: isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-400 hover:bg-indigo-100',
                  amber: isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'bg-amber-50 border-amber-100 text-amber-500 hover:bg-amber-100',
                  rose: isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100',
                };

                return (
                  <button
                    key={opt.value}
                    onClick={() => handleUpdate('content', 'priority', opt.value)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${colors[opt.color as keyof typeof colors]}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Justificativa de Prioridade (Condicional) */}
          {showPriorityJustification && (
            <div className="pt-4 animate-slide-up">
              <label className={labelClass}>Justificativa da {content.priority}</label>
              <div className="relative">
                <textarea
                  value={content.priorityJustification || ''}
                  onChange={(e) => handleUpdate('content', 'priorityJustification', e.target.value)}
                  className={`${inputClass} min-h-[100px] resize-none leading-relaxed p-4 border-rose-100 bg-rose-50/20`}
                  placeholder={`Por que este pedido tem prioridade ${content.priority}?`}
                />
                <MessageSquare className="absolute right-3 top-3 w-4 h-4 text-rose-300 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Justificativa do Pedido */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" /> Justificativa do Pedido
        </h3>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <label className={labelClass}>Descrição da Necessidade</label>
          <div className="relative">
            <textarea
              value={content.body}
              onChange={(e) => handleUpdate('content', 'body', e.target.value)}
              className={`${inputClass} min-h-[120px] resize-none leading-relaxed p-4`}
              placeholder="Descreva aqui o motivo da solicitação e a justificativa para a aquisição dos itens..."
            />
            <AlignLeft className="absolute right-3 top-3 w-4 h-4 text-slate-300 pointer-events-none" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 italic">Este texto aparecerá antes da lista de itens no documento final.</p>
        </div>
      </div>

      {/* ITENS DA REQUISIÇÃO */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" /> Itens da Requisição
          </h3>
          <button
            onClick={handleAddItem}
            className="group flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 active:scale-95 transition-all ring-offset-2 focus:ring-2 focus:ring-emerald-500"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Adicionar Item
          </button>
        </div>

        <div className="space-y-4" ref={dropdownRef}>
          {(content.purchaseItems || []).map((item, index) => {
            const CurrentUnitIcon = UNIT_OPTIONS.find(o => o.value === item.unit)?.icon || Box;

            return (
              <div key={item.id} className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm animate-fade-in group hover:border-emerald-300 hover:shadow-md transition-all">
                <div className="grid grid-cols-12 gap-4 sm:gap-5 items-end">
                  {/* Descrição do Item */}
                  <div className="col-span-12 lg:col-span-5">
                    <label className={labelClass}>Descrição do Item {index + 1}</label>
                    <div className="relative">
                      <input
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className={`${inputClass} py-3 pl-11`}
                        placeholder="Ex: Resma de Papel A4..."
                      />
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Quantidade Dinâmica */}
                  <div className="col-span-7 sm:col-span-6 lg:col-span-3">
                    <label className={labelClass}>Quantidade</label>
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 min-w-[120px]">
                      <button
                        type="button"
                        onClick={() => adjustQuantity(item.id, -1)}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-white text-slate-500 hover:text-emerald-600 hover:shadow-sm transition-all active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                        className="flex-1 min-w-0 bg-transparent border-none text-center text-sm font-bold text-slate-900 outline-none px-1"
                      />
                      <button
                        type="button"
                        onClick={() => adjustQuantity(item.id, 1)}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-white text-slate-500 hover:text-emerald-600 hover:shadow-sm transition-all active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Unidade de Medida Dinâmica */}
                  <div className="col-span-5 sm:col-span-5 lg:col-span-3 relative">
                    <label className={labelClass}>Unidade</label>
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                        className={`${inputClass} py-3 pl-10 sm:pl-11 text-left flex items-center justify-between group/btn relative hover:bg-slate-100/50`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CurrentUnitIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-500" />
                          <span className="truncate text-[11px] sm:text-sm">{item.unit}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${openDropdownId === item.id ? 'rotate-180' : ''}`} />
                      </button>

                      {openDropdownId === item.id && (
                        <div className="absolute z-[100] right-0 sm:left-0 sm:right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up py-1.5 ring-4 ring-slate-900/5 min-w-[160px]">
                          {UNIT_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const isSelected = item.unit === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  handleUpdateItem(item.id, 'unit', opt.value);
                                  setOpenDropdownId(null);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all ${isSelected
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
                                  }`}
                              >
                                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100'}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span>{opt.label}</span>
                                {isSelected && <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-600" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Excluir Item */}
                  <div className="col-span-12 sm:col-span-1 lg:col-span-1 flex justify-end pb-1">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-red-100 flex items-center gap-2 sm:block"
                      title="Remover Item"
                    >
                      <Trash2 className="w-5.5 h-5.5" />
                      <span className="sm:hidden text-xs font-bold uppercase tracking-widest">Remover</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {(!content.purchaseItems || content.purchaseItems.length === 0) && (
            <div className="p-10 sm:p-16 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center bg-white/50 backdrop-blur-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-inner">
                <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <p className="font-black text-slate-700 text-lg">Sua lista está vazia</p>
              <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Adicione produtos ou serviços para compor sua requisição.</p>
            </div>
          )}
        </div>
      </div>

      {/* ASSINATURA (Ordenada Alfabeticamente) */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4 text-indigo-600" /> Autorizador Responsável</h3>
        <div className="grid grid-cols-1 gap-3">
          {sortedSignatures.map((sig) => {
            const isSelected = content.signatureName === sig.name;
            return (
              <button
                key={sig.id}
                onClick={() => onUpdate({ ...state, content: { ...state.content, signatureName: sig.name, signatureRole: sig.role, signatureSector: sig.sector } })}
                className={`text-left p-5 rounded-[1.5rem] border transition-all duration-300 ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {sig.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{sig.name}</p>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{sig.role}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white animate-scale-in">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Opção de Assinatura Digital */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Assinar Digitalmente</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={content.useDigitalSignature || false}
              onChange={(e) => handleUpdate('content', 'useDigitalSignature', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
