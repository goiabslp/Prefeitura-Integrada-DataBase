
import React, { useRef, useEffect } from 'react';
import { Gavel, FileText, PenTool, CheckCircle2, Columns } from 'lucide-react';
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
  sectors = []
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
        editorRef.current.contentEditable = isReadOnly ? "false" : "true";
        lastViewingIndexRef.current = viewingIndex;
      }
    }
  }, [content.body, viewingIndex, currentStageIndex, historicStages, isReadOnly]);

  // AUTOMATION: Fetch Sector Counter for Left Block (Ref)
  useEffect(() => {
    const fetchSectorRef = async () => {
      // Only runs in initial stage and if block is enabled
      if (viewingIndex === 0 && state.document.showLeftBlock && sectors.length > 0) {
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

  const isViewingHistory = viewingIndex < currentStageIndex;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ADDRESSING BLOCKS - ONLY IN INITIAL STAGE */}
      {viewingIndex === 0 && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Columns className="w-4 h-4 text-blue-600" /> Blocos de Endereçamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LEFT BLOCK (REF) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase">Bloco Esquerdo (Ref)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.document.showLeftBlock}
                    disabled={isReadOnly}
                    onChange={(e) => handleUpdate('document', 'showLeftBlock', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              {state.document.showLeftBlock && (
                <textarea
                  value={content.leftBlockText}
                  disabled={true} // ALWAYS LOCKED FOR EDITING (Automation Rule)
                  onChange={(e) => handleUpdate('content', 'leftBlockText', e.target.value)}
                  className={`w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs h-20 resize-none focus:bg-white transition-all outline-none font-bold text-slate-600 select-none cursor-not-allowed`}
                  placeholder="Carregando numeração..."
                  title="Este número é gerado automaticamente pelo sistema."
                />
              )}
            </div>

            {/* RIGHT BLOCK (DESTINO) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase">Bloco Direito (Destino)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.document.showRightBlock}
                    disabled={isReadOnly}
                    onChange={(e) => handleUpdate('document', 'showRightBlock', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              {state.document.showRightBlock && (
                <textarea
                  value={content.rightBlockText}
                  disabled={isReadOnly}
                  onChange={(e) => handleUpdate('content', 'rightBlockText', e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs h-20 resize-none focus:bg-white transition-all outline-none placeholder:text-slate-400 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Ao Excelentíssimo..."
                />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Stepper Moved to App.tsx Global Header */}

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Gavel className="w-4 h-4 text-blue-600" /> {STAGES[viewingIndex]} {isViewingHistory ? '(Visualizando Histórico)' : ''}
        </h3>

        {viewingIndex > 0 && (
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-semibold text-slate-500 mb-2">Objeto do Processo</label>
            <input
              value={content.title}
              disabled={isReadOnly}
              onChange={(e) => handleUpdate('content', 'title', e.target.value)}
              className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="PROCESSO LICITATÓRIO"
            />
          </div>
        )}
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



        {/* Signature Selection Buttons */}
        {/* Signature Selection Buttons */}
        {!isReadOnly && (
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
      </div>
    </div>
  );
};
