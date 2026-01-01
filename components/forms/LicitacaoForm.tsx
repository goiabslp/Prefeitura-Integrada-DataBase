
import React, { useRef, useEffect } from 'react';
import { Gavel, FileText, PenTool, CheckCircle2 } from 'lucide-react';
import { AppState, ContentData, DocumentConfig, Signature } from '../../types';

interface LicitacaoFormProps {
  state: AppState;
  content: ContentData;
  allowedSignatures: Signature[];
  handleUpdate: (section: keyof AppState, key: string, value: any) => void;
  onUpdate: (newState: AppState) => void;
}

export const LicitacaoForm: React.FC<LicitacaoFormProps> = ({
  state,
  content,
  allowedSignatures,
  handleUpdate,
  onUpdate
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
  }, []);

  const STAGES = ['Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'];
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
        if (viewingIndex < currentStageIndex && historicStages[viewingIndex]) {
          // Viewing history
          editorRef.current.innerHTML = historicStages[viewingIndex].body;
          editorRef.current.contentEditable = "false";
        } else {
          // Viewing current
          // Only overwrite if it's a stage change to avoid losing cursor position
          if (isStageChange) {
            editorRef.current.innerHTML = content.body;
          }
          editorRef.current.contentEditable = "true";
        }
        lastViewingIndexRef.current = viewingIndex;
      }
    }
  }, [content.body, viewingIndex, currentStageIndex, historicStages]);

  const handleNextStage = () => {
    // 1. Save current stage
    const currentStageData = {
      id: Date.now().toString(),
      title: STAGES[currentStageIndex],
      body: content.body,
      signatureName: content.signatureName,
      signatureRole: content.signatureRole,
      signatureSector: content.signatureSector
    };

    const newStages = [...historicStages, currentStageData];

    // 2. Update state: add stage to history, increment index, clear body for new stage
    // Also update viewingIndex to new stage
    onUpdate({
      ...state,
      content: {
        ...state.content,
        licitacaoStages: newStages,
        currentStageIndex: currentStageIndex + 1,
        viewingStageIndex: currentStageIndex + 1, // Advance view
        body: '', // Clear for next stage
      }
    });
  };

  const isViewingHistory = viewingIndex < currentStageIndex;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stepper Moved to App.tsx Global Header */}

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Gavel className="w-4 h-4 text-blue-600" /> {STAGES[viewingIndex]} {isViewingHistory ? '(Visualizando Histórico)' : ''}
        </h3>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <label className="block text-xs font-semibold text-slate-500 mb-2">Objeto da Licitação (Geral)</label>
          <input
            value={content.title}
            onChange={(e) => handleUpdate('content', 'title', e.target.value)}
            disabled={isViewingHistory}
            className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none ${isViewingHistory ? 'opacity-60 cursor-not-allowed' : ''}`}
            placeholder="Ex: Credenciamento de Saúde nº 01/2024"
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Detalhes da Etapa</h3>
        <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm ${isViewingHistory ? 'bg-slate-50' : ''}`}>
          <div
            ref={editorRef}
            onInput={(e) => {
              if (!isViewingHistory) {
                handleUpdate('content', 'body', (e.target as HTMLDivElement).innerHTML);
              }
            }}
            className="w-full bg-white p-6 text-sm leading-relaxed min-h-[400px] outline-none prose prose-slate max-w-none empty:before:content-['Digite_os_detalhes_desta_etapa...'] empty:before:text-slate-300"
          />
        </div>
      </div>

      {!isViewingHistory && (
        <div className="flex justify-end pt-4">
          <button
            onClick={handleNextStage}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Concluir {STAGES[currentStageIndex]} e Avançar</span>
          </button>
        </div>
      )}

      {!isViewingHistory && (
        <div className="space-y-4 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4" /> Assinatura da Etapa</h3>
          <div className="grid grid-cols-1 gap-3">
            {allowedSignatures.map((sig) => {
              const isSelected = content.signatureName === sig.name;
              return (
                <button
                  key={sig.id}
                  onClick={() => onUpdate({ ...state, content: { ...state.content, signatureName: sig.name, signatureRole: sig.role, signatureSector: sig.sector } })}
                  className={`text-left p-4 rounded-2xl border transition-all ${isSelected ? 'bg-blue-50 border-blue-500 shadow-md' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{sig.name}</p>
                      <p className="text-[10px] uppercase font-medium text-slate-500">{sig.role}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
