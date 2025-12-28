
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

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content.body) {
      editorRef.current.innerHTML = content.body;
    }
  }, [content.body]);

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Gavel className="w-4 h-4 text-blue-600" /> Processo Licitatório
          </h3>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-500 mb-2">Objeto da Licitação</label>
              <input 
                value={content.title} 
                onChange={(e) => handleUpdate('content', 'title', e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none" 
                placeholder="Ex: Credenciamento de Saúde nº 01/2024" 
              />
          </div>
       </div>

       <div className="space-y-4 border-t border-slate-200 pt-6">
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Termo de Referência</h3>
         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div 
              ref={editorRef}
              contentEditable
              onInput={(e) => handleUpdate('content', 'body', (e.target as HTMLDivElement).innerHTML)}
              className="w-full bg-white p-6 text-sm leading-relaxed min-h-[400px] outline-none prose prose-slate max-w-none"
            />
         </div>
       </div>

       <div className="space-y-4 border-t border-slate-200 pt-6">
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4" /> Presidente da CPL / Responsável</h3>
         <div className="grid grid-cols-1 gap-3">
            {allowedSignatures.map((sig) => {
               const isSelected = content.signatureName === sig.name;
               return (
                  <button 
                    key={sig.id} 
                    onClick={() => onUpdate({ ...state, content: { ...state.content, signatureName: sig.name, signatureRole: sig.role, signatureSector: sig.sector }})} 
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
    </div>
  );
};
