
import React, { useMemo } from 'react';
import { AppState, PurchaseItem } from '../types';
import { PageWrapper } from './PageWrapper';

interface ComprasPreviewProps {
  state: AppState;
  isGenerating: boolean;
}

export const ComprasPreview: React.FC<ComprasPreviewProps> = ({ state, isGenerating }) => {
  const { branding, document: docConfig, content } = state;

  const showPriorityNote = content.priority === 'Alta' || content.priority === 'Urgência';

  const pages = useMemo(() => {
    // Calibração ultra-conservadora para evitar transbordo no rodapé
    const SECURITY_MARGIN_LINES = 4; 
    const TOTAL_LINES_CAPACITY = 32; 
    const CHARS_PER_LINE = 65;
    
    // Espaço para assinatura (aprox 9 linhas)
    const SIGNATURE_LINES = 9;

    // Limite para páginas normais (A partir da 2)
    const LIMIT_NORMAL = TOTAL_LINES_CAPACITY - SECURITY_MARGIN_LINES;

    const items = [...(content.purchaseItems || [])];
    
    // SEMPRE começamos com a Página 1 vazia de itens (reservada para justificativas e dados do solicitante)
    const resultPages: PurchaseItem[][] = [[]];
    
    if (items.length === 0) {
      return resultPages;
    }

    // Título "Itens da Requisição" na Página 2 ocupa ~3 linhas + 2 linhas de espaço extra solicitado
    let currentLinesUsed = 5; 
    let currentPageItems: PurchaseItem[] = [];

    // Loop de distribuição de itens começando da Página 2 (índice 1 no array)
    while (items.length > 0) {
      const item = items[0];
      const linesForName = Math.max(1, Math.ceil((item.name || '').length / CHARS_PER_LINE));
      const totalItemLines = linesForName + 1.2; 

      if ((currentLinesUsed + totalItemLines) <= LIMIT_NORMAL) {
        currentPageItems.push(items.shift()!);
        currentLinesUsed += totalItemLines;

        if (items.length === 0) {
          // Checa se cabe a assinatura na última página
          if ((currentLinesUsed + SIGNATURE_LINES) > LIMIT_NORMAL) {
            resultPages.push(currentPageItems);
            resultPages.push([]); // Página extra só para assinatura
          } else {
            resultPages.push(currentPageItems);
          }
        }
      } else {
        // Virada de página para itens
        resultPages.push(currentPageItems);
        currentPageItems = [];
        currentLinesUsed = 0;
      }
    }
    
    return resultPages;
  }, [content.purchaseItems, content.body, content.priorityJustification, content.priority, showPriorityNote]);

  const priorityStyles = {
    'Normal': 'bg-slate-100 text-slate-600 border-slate-200',
    'Média': 'bg-slate-100 text-slate-800 border-slate-300',
    'Alta': 'bg-amber-50 text-amber-700 border-amber-200',
    'Urgência': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <>
      {pages.map((itemsOnPage, pageIndex) => (
        <PageWrapper key={pageIndex} state={state} pageIndex={pageIndex} totalPages={pages.length} isGenerating={isGenerating}>
          {pageIndex === 0 && (
            <div className="mb-6">
              {/* 1. Blocos de Endereçamento (Topo) */}
              <div className="flex justify-between items-start text-[9.5pt]">
                {docConfig.showLeftBlock && content.leftBlockText && (
                  <div 
                    className="whitespace-pre-wrap max-w-[45%] leading-snug text-black"
                    style={{ 
                      fontSize: `${docConfig.leftBlockStyle?.size || 9}pt`, 
                      color: '#000000'
                    }}
                  >
                    {content.leftBlockText}
                  </div>
                )}
                {docConfig.showRightBlock && content.rightBlockText && (
                  <div 
                    className="whitespace-pre-wrap text-right max-w-[45%] leading-snug text-black"
                    style={{ 
                      fontSize: `${docConfig.rightBlockStyle?.size || 9}pt`, 
                      color: '#000000'
                    }}
                  >
                    {content.rightBlockText}
                  </div>
                )}
              </div>

              <div className="h-6" />

              {/* 2. Cabeçalho de Identificação */}
              <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex justify-between items-center">
                <span className="font-black text-[7pt] uppercase tracking-[0.2em] text-emerald-800">Pedido de Compra Administrativo</span>
                <span className="font-mono text-[8pt] text-black">
                  Protocolo: <span className="font-normal">{content.protocol || 'AGUARDANDO FINALIZAÇÃO'}</span>
                </span>
              </div>

              {/* 3. Dados do Solicitante (SOLICITADO) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden my-4">
                <div className="bg-slate-50 px-3 py-1 border-b border-slate-200">
                  <span className="font-black text-[6.5pt] text-slate-500 uppercase tracking-wider">Identificação do Solicitante</span>
                </div>
                <div className="p-3 grid grid-cols-12 gap-4">
                  <div className="col-span-6">
                    <span className="text-[5.5pt] font-black text-slate-400 uppercase block leading-none mb-1">Nome Completo</span>
                    <span className="font-bold text-[10pt] text-black leading-none">{content.requesterName || '---'}</span>
                  </div>
                  <div className="col-span-3 border-l border-slate-100 pl-3">
                    <span className="text-[5.5pt] font-black text-slate-400 uppercase block leading-none mb-1">Cargo / Função</span>
                    <span className="font-semibold text-[8.5pt] text-slate-700 leading-none">{content.requesterRole || '---'}</span>
                  </div>
                  <div className="col-span-3 border-l border-slate-100 pl-3">
                    <span className="text-[5.5pt] font-black text-slate-400 uppercase block leading-none mb-1">Setor Origem</span>
                    <span className="font-semibold text-[8.5pt] text-slate-700 leading-none">{content.requesterSector || '---'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Título / Finalidade */}
              <div className="flex items-center gap-3 border-b-2 border-emerald-100 pb-2 mt-6">
                <div className="flex-1 flex flex-col gap-1">
                  <h1 className="font-bold leading-tight tracking-tight text-[16pt] text-black">
                    {content.title}
                  </h1>
                </div>
                <div className={`px-3 py-1 rounded-full text-[8pt] font-black uppercase tracking-widest border shrink-0 ${priorityStyles[content.priority || 'Normal']}`}>
                  {content.priority || 'Normal'}
                </div>
              </div>

              {/* Justificativa Geral */}
              {content.body && (
                <div className="bg-emerald-50/20 p-4 rounded-xl border-l-4 border-emerald-200 my-4">
                  <p className="text-[7pt] font-black text-emerald-800 uppercase tracking-widest mb-1">Justificativa do Pedido:</p>
                  <p className="text-[10pt] text-black leading-relaxed italic whitespace-pre-wrap">
                    {content.body}
                  </p>
                </div>
              )}

              {/* Justificativa de Prioridade (Condicionado) */}
              {showPriorityNote && content.priorityJustification && (
                <div className="bg-rose-50/20 p-4 rounded-xl border-l-4 border-rose-200 my-4">
                  <p className="text-[7pt] font-black text-rose-800 uppercase tracking-widest mb-1">Nota de Prioridade ({content.priority}):</p>
                  <p className="text-[10pt] text-black leading-relaxed italic whitespace-pre-wrap">
                    {content.priorityJustification}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex-1 flex flex-col pb-12">
             {/* Título da Seção de Itens - Exibido apenas na Página 2 (índice 1) antes dos itens */}
             {pageIndex === 1 && content.purchaseItems && content.purchaseItems.length > 0 && (
                <div className="bg-slate-50 border border-slate-100 px-4 py-1 rounded-lg mb-10">
                  <span className="font-black text-[7pt] uppercase tracking-[0.2em] text-slate-600">Itens da Requisição</span>
                </div>
             )}

             {itemsOnPage.length > 0 && (
                <div className="space-y-3">
                   {itemsOnPage.map((item, idx) => {
                      // Calcula o índice absoluto baseado nas páginas anteriores
                      const absoluteIndex = pages.slice(0, pageIndex).reduce((acc, curr) => acc + curr.length, 0) + idx + 1;
                      return (
                        <div key={item.id} className="flex items-start gap-3 text-[11pt] border-b border-emerald-50 pb-2">
                           <span className="font-black text-emerald-700 min-w-[30px]">{absoluteIndex.toString().padStart(2, '0')}.</span>
                           <div className="flex-1">
                              <span className="text-black font-medium leading-relaxed">{item.name || '---'}</span>
                              <div className="flex gap-4 mt-0.5 text-[8.5pt] font-bold uppercase tracking-widest text-slate-500">
                                 <span>Quantidade: <span className="text-black">{item.quantity}</span></span>
                                 <span>Unidade: <span className="text-black">{item.unit}</span></span>
                              </div>
                           </div>
                        </div>
                      );
                   })}
                </div>
             )}

             {/* Assinatura na última página */}
             {pageIndex === pages.length - 1 && (
               <div className="mt-auto">
                 <div className="pt-24 flex justify-center">
                   <div className="w-72 border-t-2 border-slate-950 pt-2 text-center">
                     <p className="font-black uppercase text-[10pt] text-black">{content.signatureName || 'Solicitante'}</p>
                     <p className="text-[8pt] font-bold text-slate-500 uppercase tracking-widest">{content.signatureRole}</p>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </PageWrapper>
      ))}
    </>
  );
};
