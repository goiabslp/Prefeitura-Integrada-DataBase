
import React, { useRef, useEffect, useState } from 'react';
import { Gavel, FileText, PenTool, CheckCircle2, Columns, Eye, EyeOff, Plus, Minus, Trash2, Box, Package, Archive, Scale, Briefcase, ShoppingCart, ChevronDown } from 'lucide-react';
import { AppState, ContentData, DocumentConfig, Signature, User, Sector, PurchaseItem } from '../../types';
import * as counterService from '../../services/counterService';

interface LicitacaoFormProps {
  state: AppState;
  content: ContentData;
  allowedSignatures: Signature[];
  handleUpdate: (section: keyof AppState, key: string, value: any) => void;
  onUpdate: (newState: AppState) => void;
  onFinish?: () => void;
  isReadOnly?: boolean;
  currentUser?: User | null;
  sectors?: Sector[];
  orderStatus?: string;
}

const UNIT_OPTIONS = [
  { value: 'Unidade', label: 'Unidade', icon: Box },
  { value: 'Pacote', label: 'Pacote', icon: Package },
  { value: 'Caixa', label: 'Caixa', icon: Archive },
  { value: 'Kg', label: 'Kg', icon: Scale },
  { value: 'Serviço', label: 'Serviço', icon: Briefcase },
] as const;

export const LicitacaoForm: React.FC<LicitacaoFormProps> = ({
  state,
  content,
  allowedSignatures,
  handleUpdate,
  onUpdate,
  onFinish,
  isReadOnly,
  currentUser,
  sectors = [],
  orderStatus
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Initialize stages if not present
  useEffect(() => {
    if (content.currentStageIndex === undefined) {
      handleUpdate('content', 'currentStageIndex', 0);
    }
    if (!content.licitacaoStages) {
      handleUpdate('content', 'licitacaoStages', []);
    }
    if (!content.signatures) {
      handleUpdate('content', 'signatures', []);
    }
  }, []);

  const STAGES = ['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'];
  const currentStageIndex = content.currentStageIndex || 0;
  const historicStages = content.licitacaoStages || [];

  // Use lifted state for viewing index
  // fallback to currentStageIndex if undefined (though App.tsx tries to sync it)
  const viewingIndex = content.viewingStageIndex !== undefined ? content.viewingStageIndex : currentStageIndex;
  const isViewingHistory = viewingIndex < currentStageIndex;

  // Lock logic: Always Locked if Licitacao is Finished (completed)
  // Lock logic: Início (Index 0) is Locked if Status is Approved or above
  const isStageInicioLocked = viewingIndex === 0 && (orderStatus === 'approved' || orderStatus === 'completed');
  const isActuallyReadOnly = isReadOnly || isStageInicioLocked;

  // Handle content update for Editor based on Viewing Index
  // Fix: Only update innerHTML if we are switching stages or if the editor is empty (initial load)
  // We do NOT want to update innerHTML on every keystroke as it resets the cursor.
  const lastViewingIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      const isStageChange = lastViewingIndexRef.current !== viewingIndex;
      const shouldUpdate = isStageChange || (!editorRef.current.innerHTML && content.body);

      if (shouldUpdate) {
        // ALWAYS EDITABLE - the App.tsx logic handles swapping the data
        if (isStageChange) {
          if (viewingIndex < currentStageIndex && historicStages[viewingIndex]) {
            editorRef.current.innerHTML = historicStages[viewingIndex].body;
          } else if (viewingIndex === currentStageIndex) {
            editorRef.current.innerHTML = content.body;
          }
        }
        editorRef.current.contentEditable = isActuallyReadOnly ? "false" : "true";
        lastViewingIndexRef.current = viewingIndex;
      }
    }
  }, [content.body, viewingIndex, currentStageIndex, historicStages, isActuallyReadOnly]);

  // AUTOMATION: Fetch Sector Counter for Left Block (Ref)
  useEffect(() => {
    const fetchSectorRef = async () => {
      // Only runs in initial stage
      if (viewingIndex === 0 && sectors.length > 0) {
        // Priority: Requester Sector (from Settings) > Current User Sector
        const sectorName = content.requesterSector || currentUser?.sector;

        if (sectorName) {
          // Find sector ID from Name (or ID)
          const matchedSector = sectors.find(s => s.name === sectorName || s.id === sectorName);

          if (matchedSector) {
            try {
              const year = new Date().getFullYear();
              const nextCount = await counterService.getNextSectorCount(matchedSector.id, year);

              if (nextCount) {
                const formattedRef = `Ofício nº ${String(nextCount).padStart(3, '0')}/${year}`;

                // Update if different (Syncs with changes in Settings)
                if (content.leftBlockText !== formattedRef) {
                  handleUpdate('content', 'leftBlockText', formattedRef);
                }
              }
            } catch (error) {
              console.error("Failed to fetch next sector count for Licitacao", error);
            }
          }
        }
      }
    };

    fetchSectorRef();
  }, [viewingIndex, state.document.showLeftBlock, content.requesterSector, currentUser, sectors]);


  // ITEMS LOGIC
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


  return (
    <div className="space-y-8 animate-fade-in">
      {/* ADDRESSING BLOCKS - REMOVED FROM FORM UI AS REQUESTED */}
      {/* Kept exclusively for Preview rendering on Stage 0 */}
      {/* Stepper Moved to App.tsx Global Header */}

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Gavel className="w-4 h-4 text-blue-600" /> {STAGES[viewingIndex]} {isViewingHistory ? '(Visualizando Histórico)' : ''}
        </h3>

        {/* Objeto do Processo removed from here - Managed in Settings */}
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Detalhes da Etapa</h3>
        <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm ${isViewingHistory ? 'bg-slate-50' : ''}`}>
          <div
            ref={editorRef}
            onClick={(e) => {
              // Handle Tag Deletion via Event Delegation (Robust React State Update)
              const target = e.target as HTMLElement;
              const deleteBtn = target.closest('.signature-delete-btn');
              if (deleteBtn) {
                const tag = deleteBtn.closest('.signature-tag');
                if (tag) {
                  tag.remove();
                  // Force state update immediately after DOM manipulation
                  handleUpdate('content', 'body', (e.currentTarget as HTMLDivElement).innerHTML);
                }
              }
            }}
            onInput={(e) => {
              handleUpdate('content', 'body', (e.target as HTMLDivElement).innerHTML);
            }}
            className="w-full bg-white p-6 text-sm leading-relaxed min-h-[400px] outline-none prose prose-slate max-w-none empty:before:content-['Digite_os_detalhes_desta_etapa...'] empty:before:text-slate-300"
          />
        </div>
      </div>

      {/* ITEMS BLOCK */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" /> Adicionar Itens
          </h3>
          {!isActuallyReadOnly && (
            <button
              onClick={handleAddItem}
              className="group flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 active:scale-95 transition-all ring-offset-2 focus:ring-2 focus:ring-emerald-500"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Adicionar Item
            </button>
          )}
        </div>

        <div className="space-y-4">
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
                        disabled={isActuallyReadOnly}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className={`${inputClass} py-3 pl-11 disabled:bg-slate-100 disabled:text-slate-500`}
                        placeholder="Ex: Resma de Papel A4..."
                      />
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Quantidade Dinâmica */}
                  <div className="col-span-7 sm:col-span-6 lg:col-span-3">
                    <label className={labelClass}>Quantidade</label>
                    <div className={`flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 min-w-[120px] ${isActuallyReadOnly ? 'opacity-75' : ''}`}>
                      <button
                        type="button"
                        disabled={isActuallyReadOnly}
                        onClick={() => adjustQuantity(item.id, -1)}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-white text-slate-500 hover:text-emerald-600 hover:shadow-sm transition-all active:scale-90 disabled:cursor-not-allowed disabled:hover:text-slate-500"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        disabled={isActuallyReadOnly}
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                        className="flex-1 min-w-0 bg-transparent border-none text-center text-sm font-bold text-slate-900 outline-none px-1"
                      />
                      <button
                        type="button"
                        disabled={isActuallyReadOnly}
                        onClick={() => adjustQuantity(item.id, 1)}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-white text-slate-500 hover:text-emerald-600 hover:shadow-sm transition-all active:scale-90 disabled:cursor-not-allowed disabled:hover:text-slate-500"
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
                        disabled={isActuallyReadOnly}
                        onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                        className={`${inputClass} py-3 pl-10 sm:pl-11 text-left flex items-center justify-between group/btn relative hover:bg-slate-100/50 disabled:bg-slate-100 disabled:hover:bg-slate-100 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CurrentUnitIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-500" />
                          <span className="truncate text-[11px] sm:text-sm">{item.unit}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${openDropdownId === item.id ? 'rotate-180' : ''}`} />
                      </button>

                      {openDropdownId === item.id && !isActuallyReadOnly && (
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
                    {!isActuallyReadOnly && (
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-red-100 flex items-center gap-2 sm:block"
                        title="Remover Item"
                      >
                        <Trash2 className="w-5.5 h-5.5" />
                        <span className="sm:hidden text-xs font-bold uppercase tracking-widest">Remover</span>
                      </button>
                    )}
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
              <p className="font-black text-slate-700 text-lg">Sem itens adicionados</p>
              <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Adicione itens a esta etapa se necessário.</p>
            </div>
          )}
        </div>
      </div>


      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4" /> Assinatura da Etapa</h3>



        {/* Signature Selection logic - SPLIT based on Stage */}
        {!isActuallyReadOnly && (
          <>
            {/* ETAPA INICIO (0): Single Signature + Digital Option (Like Oficios) */}
            {viewingIndex === 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selecionar Assinante (Único)</span>
                  <button
                    onClick={() => handleUpdate('document', 'showSignature', !state.document.showSignature)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${state.document.showSignature
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                  >
                    {state.document.showSignature ? <><Eye className="w-3 h-3" /> Visível</> : <><EyeOff className="w-3 h-3" /> Oculta</>}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {allowedSignatures.map((sig) => {
                    const isSelected = content.signatureName === sig.name;
                    return (
                      <button
                        key={sig.id}
                        onClick={() => onUpdate({
                          ...state,
                          document: { ...state.document, showSignature: true },
                          content: {
                            ...state.content,
                            signatureName: sig.name,
                            signatureRole: sig.role,
                            signatureSector: sig.sector,
                            signatures: [] // Clear array if switching to single
                          }
                        })}
                        className={`text-left p-4 rounded-2xl border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{sig.name}</p>
                            <p className="text-[10px] uppercase font-medium text-slate-500">{sig.role}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Opção de Assinatura Digital (Stage 0 only) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Assinar Digitalmente (Requer 2FA)</span>
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
            ) : (
              // OTHER STAGES: Keep Multi-Signature Logic
              <div className="grid grid-cols-1 gap-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Adicionar Assinatura:</p>
                {allowedSignatures.map((sig) => {
                  return (
                    <button
                      key={sig.id}
                      onClick={() => {
                        // Insert marker as a TAG
                        const markerData = `[ASSINATURA: ${sig.name} | ${sig.role} | ${sig.sector}]`;
                        const tagHtml = `&nbsp;<span contenteditable="false" class="signature-tag bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded inline-flex items-center gap-2 text-xs font-bold select-none cursor-default" data-marker="${markerData}"><span class="pointer-events-none">🖊️ ${sig.name}</span><span class="signature-delete-btn cursor-pointer text-red-500 hover:text-red-700 font-black px-1 ml-1 hover:bg-white rounded" title="Remover">✕</span></span><br>&nbsp;`;

                        // 1. Update DOM directly if ref exists
                        let newBody = (content.body || '') + tagHtml;
                        if (editorRef.current) {
                          newBody = editorRef.current.innerHTML + tagHtml;
                          editorRef.current.innerHTML = newBody;
                        }

                        // 2. Update State
                        onUpdate({
                          ...state,
                          content: {
                            ...state.content,
                            body: newBody
                          }
                        });
                      }}
                      className="text-left p-4 rounded-2xl border bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98]"

                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{sig.name}</p>
                          <p className="text-[10px] uppercase font-medium text-slate-500">{sig.role}</p>
                        </div>
                        <div className="bg-blue-50 text-blue-600 rounded-full p-1">
                          <span className="text-[10px] font-bold px-2">INSERIR</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
