
import React, { useRef, useEffect } from 'react';
import { Gavel, FileText, PenTool, CheckCircle2, Columns, Eye, EyeOff } from 'lucide-react';
import { AppState, ContentData, DocumentConfig, Signature, User, Sector } from '../../types';
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
