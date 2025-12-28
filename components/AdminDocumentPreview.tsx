
import React from 'react';
import { AppState } from '../types';
import { PageWrapper } from './PageWrapper';
import { Layout, Type, AlignLeft, MousePointer2 } from 'lucide-react';

interface AdminDocumentPreviewProps {
  state: AppState;
}

export const AdminDocumentPreview: React.FC<AdminDocumentPreviewProps> = ({ state }) => {
  const { branding, document: docConfig } = state;

  return (
    <div className="flex justify-center items-start overflow-auto w-full h-full bg-slate-200/40 backdrop-blur-sm pt-8 pb-20 px-4">
      <div className="origin-top transition-transform duration-300 scale-[0.45] md:scale-[0.55] lg:scale-[0.6] xl:scale-[0.7] 2xl:scale-[0.8]">
        <div className="flex flex-col items-center">
          <PageWrapper state={state} pageIndex={0} totalPages={1} isGenerating={false}>
            {/* Visualização da Estrutura de Design */}
            <div className="flex flex-col h-full border-2 border-dashed border-indigo-200 rounded-xl p-8 relative bg-indigo-50/5">
              
              {/* Overlay de Guia de Design */}
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-full shadow-lg z-30 animate-pulse">
                <Layout className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Modo Design Estrutural</span>
              </div>

              {/* Blocos de Endereçamento */}
              <div className="flex justify-between items-start mb-12">
                <div className="w-[45%] p-4 border border-dashed border-slate-300 rounded-lg relative group">
                  <div className="absolute -top-3 left-2 px-2 bg-white text-[8px] font-black text-slate-400 uppercase tracking-tighter border border-slate-200 rounded">Bloco Esquerdo</div>
                  <div 
                    className="whitespace-pre-wrap font-bold"
                    style={{ 
                      fontSize: `${docConfig.leftBlockStyle?.size || 10}pt`, 
                      color: docConfig.leftBlockStyle?.color || '#191822' 
                    }}
                  >
                    Exemplo de Referência<br />
                    Ofício nº 000/2024<br />
                    Assunto: Tópico Exemplo
                  </div>
                </div>

                <div className="w-[45%] p-4 border border-dashed border-slate-300 rounded-lg relative text-right">
                  <div className="absolute -top-3 right-2 px-2 bg-white text-[8px] font-black text-slate-400 uppercase tracking-tighter border border-slate-200 rounded">Bloco Direito</div>
                  <div 
                    className="whitespace-pre-wrap font-bold"
                    style={{ 
                      fontSize: `${docConfig.rightBlockStyle?.size || 10}pt`, 
                      color: docConfig.rightBlockStyle?.color || '#191822' 
                    }}
                  >
                    Ao Excelentíssimo Senhor<br />
                    Autoridade de Exemplo<br />
                    Nesta Cidade
                  </div>
                </div>
              </div>

              {/* Título */}
              <div className="mb-12 p-6 border border-dashed border-indigo-300 rounded-2xl bg-white/50 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Estilo do Título</div>
                <h1 
                  className="font-bold leading-tight tracking-tight" 
                  style={{ 
                    fontSize: `${docConfig.titleStyle?.size || 32}pt`, 
                    color: docConfig.titleStyle?.color || branding.primaryColor, 
                    textAlign: docConfig.titleStyle?.alignment || 'left' 
                  }}
                >
                  Título do Documento de Exemplo
                </h1>
              </div>

              {/* Placeholder de Corpo (Apenas Guia) */}
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/30 p-12 text-center">
                <Type className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Área de Conteúdo Variável</p>
                <p className="text-slate-300 text-[9px] mt-2 max-w-xs mx-auto">Esta área será preenchida dinamicamente conforme o módulo operacional selecionado (Ofício, Compras, etc).</p>
                
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-[8px] font-black text-slate-500 uppercase">Cor Primária</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div className="w-3 h-3 rounded-full bg-slate-800"></div>
                    <span className="text-[8px] font-black text-slate-500 uppercase">Cor Secundária</span>
                  </div>
                </div>
              </div>

              {/* Guia de Assinatura */}
              <div className="mt-12 flex flex-col items-center text-center p-4 border border-dashed border-slate-200 rounded-xl bg-white/40">
                <div className="w-64 border-t border-slate-400 pt-2">
                  <p className="font-bold uppercase text-[10pt] text-slate-800">Nome do Responsável</p>
                  <p className="text-[8pt] text-slate-400 font-medium">Cargo do Signatário</p>
                </div>
                <div className="mt-2 flex items-center gap-1 text-indigo-400">
                  <MousePointer2 className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Área de Autenticação</span>
                </div>
              </div>
            </div>
          </PageWrapper>
        </div>
      </div>
    </div>
  );
};
