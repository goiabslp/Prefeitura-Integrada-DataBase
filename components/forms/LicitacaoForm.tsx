
import React, { useRef, useEffect } from 'react';
import { Gavel, FileText, PenTool, CheckCircle2 } from 'lucide-react';
import { AppState, ContentData, DocumentConfig, Signature } from '../../types';

interface LicitacaoFormProps {
  state: AppState;
  content: ContentData;
  allowedSignatures: Signature[];
  handleUpdate: (section: keyof AppState, key: string, value: any) => void;
  onUpdate: (newState: AppState) => void;
  onFinish?: () => void;
  isReadOnly?: boolean;
}

export const LicitacaoForm: React.FC<LicitacaoFormProps> = ({
  state,
  content,
  allowedSignatures,
  handleUpdate,
  onUpdate,
  onFinish,
  isReadOnly
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

  const isViewingHistory = viewingIndex < currentStageIndex;

  return (
    <div className="space-y-8 animate-fade-in">
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
