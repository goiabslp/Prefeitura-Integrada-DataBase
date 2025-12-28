import React from 'react';
import { 
  FileText, Columns, PenTool, CheckCircle2, Eye, EyeOff, AlignJustify
} from 'lucide-react';
import { AppState, ContentData, DocumentConfig, Signature } from '../../types';

interface OficioFormProps {
  state: AppState;
  content: ContentData;
  docConfig: DocumentConfig;
  allowedSignatures: Signature[];
  handleUpdate: (section: keyof AppState, key: string, value: any) => void;
  onUpdate: (newState: AppState) => void;
}

export const OficioForm: React.FC<OficioFormProps> = ({ 
  state, 
  content, 
  docConfig, 
  allowedSignatures, 
  handleUpdate,
  onUpdate
}) => {

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Identificação do Ofício</h3>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <label className="block text-xs font-semibold text-slate-500 mb-2">Assunto / Título</label>
            <input 
              value={content.title} 
              onChange={(e) => handleUpdate('content', 'title', e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:bg-white transition-all outline-none" 
              placeholder="Ex: Solicitação de Material" 
            />
        </div>
      </div>

      <div className="space-y-6 border-t border-slate-200 pt-6">
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Columns className="w-4 h-4" /> Blocos de Endereçamento</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase">Bloco Direito (Destino)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={docConfig.showRightBlock} onChange={(e) => handleUpdate('document', 'showRightBlock', e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
               </div>
               {docConfig.showRightBlock && (
                  <textarea 
                    value={content.rightBlockText} 
                    onChange={(e) => handleUpdate('content', 'rightBlockText', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs h-24 resize-none focus:bg-white transition-all outline-none"
                    placeholder="Ao Excelentíssimo..."
                  />
               )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase">Bloco Esquerdo (Ref)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={docConfig.showLeftBlock} onChange={(e) => handleUpdate('document', 'showLeftBlock', e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
               </div>
               {docConfig.showLeftBlock && (
                  <textarea 
                    value={content.leftBlockText} 
                    onChange={(e) => handleUpdate('content', 'leftBlockText', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs h-24 resize-none focus:bg-white transition-all outline-none"
                    placeholder="Ofício nº..."
                  />
               )}
            </div>
         </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><AlignJustify className="w-4 h-4" /> Corpo do Ofício</h3>
         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <textarea 
              value={content.body}
              onChange={(e) => handleUpdate('content', 'body', e.target.value)}
              className="w-full bg-white p-6 text-sm leading-relaxed min-h-[400px] outline-none resize-none focus:bg-slate-50/30 transition-all"
              placeholder="Digite o texto do ofício aqui... Pressione Enter para novas linhas."
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            />
         </div>
         <p className="text-[10px] text-slate-400 italic">O texto será paginado automaticamente com base nas quebras de linha digitadas.</p>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
         <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4" /> Assinatura</h3>
            <button 
              onClick={() => handleUpdate('document', 'showSignature', !docConfig.showSignature)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                docConfig.showSignature 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {docConfig.showSignature ? <><Eye className="w-3 h-3" /> Visível</> : <><EyeOff className="w-3 h-3" /> Oculta</>}
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
                        signatureSector: sig.sector 
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
      </div>
    </div>
  );
};