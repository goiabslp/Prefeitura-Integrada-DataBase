import React, { useMemo, useEffect } from 'react';
import { AppState } from '../types';
import { PageWrapper } from './PageWrapper';

interface LicitacaoPreviewProps {
  state: AppState;
  isGenerating: boolean;
}

const hasRealContent = (html: string) => {
  if (!html) return false;
  const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return stripped.length > 0;
};

export const LicitacaoPreview: React.FC<LicitacaoPreviewProps> = ({ state, isGenerating }) => {
  const { branding = {} as any, document: docConfig = {} as any, content = {} as any } = state || {};

  // Standard Signature Helper matches DocumentPreview style
  const getSignatureHtml = (name?: string, role?: string, sector?: string) => {
    if (!name) return '';
    return `
      <div class="signature-block m-0 p-0 break-inside-avoid flex flex-col items-center justify-center" style="line-height: 0.3;">
        <div class="w-64 border-t border-slate-900 text-center" style="padding-top: 0px; border-color: #0f172a;">
             <p style="margin: 0; padding: 0; line-height: 1.1; font-size: 10pt; font-weight: 700; text-transform: uppercase; color: #0f172a;">${name}</p>
             <p style="margin: 0; padding: 0; line-height: 1.1; font-size: 8pt; color: #64748b; margin-top: 2px;">${role || 'Responsável'}</p>
             ${sector ? `<p style="margin: 0; padding: 0; line-height: 1.1; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-top: 2px;">${sector}</p>` : ''}
        </div>
      </div>
    `;
  };

  const pages = useMemo(() => {
    const TOTAL_LINES_CAPACITY = 62; // Maximize usage (Request: 62 lines)
    const SECURITY_MARGIN_LINES = 2; // Safety margin to prevent footer overlap
    const HEADER_ESTIMATED_LINES = 3; // Minimal header space
    const MAX_LINES_PER_PAGE = TOTAL_LINES_CAPACITY - SECURITY_MARGIN_LINES - HEADER_ESTIMATED_LINES;
    const CHARS_PER_LINE = 80;

    // 1. Get VALID history stages (ignoring empty ones) - Ensure sparse array is handled
    const historicStagesRaw = content.licitacaoStages || [];

    // User Requirement: Fixed Index Control (0..6) + Correct Order + Insertion Support
    // We iterate through fixed indices 0 to 6.
    // For the index currently being VIEWED/EDITED (`viewIdx`), we use the LIVE `content` state.
    // For others, we use `historicStagesRaw`.
    // Then we filter out empty stages.

    const viewIdx = content.viewingStageIndex ?? (content.currentStageIndex || 0);
    const STAGES_TITLES = ['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'];

    let allStages: any[] = [];

    // Iterate fixed range 0 to 6 (Max possible stages)
    for (let i = 0; i <= 6; i++) {
      let stageData: any = historicStagesRaw[i];

      // If this is the active view, override with current content
      if (i === viewIdx) {
        stageData = {
          ...stageData, // Preserve ID if exists
          id: stageData?.id || 'active-draft',
          title: STAGES_TITLES[i],
          body: content.body,
          signatureName: content.signatureName,
          signatureRole: content.signatureRole,
          signatureSector: content.signatureSector,
          signatures: content.signatures,
          _isActiveView: true, // Flag to force rendering even if empty
          stageIndex: i
        };
      } else if (stageData) {
        stageData = {
          ...stageData,
          stageIndex: i
        };
      }

      // If generic filtering of future empty stages is desired (ONLY if they are truly empty in history too)
      // The `filter` below cleans up. 

      if (stageData) {
        // Ensure title is correct
        if (!stageData.title) stageData.title = STAGES_TITLES[i] || `Etapa ${i}`;
        allStages.push(stageData);
      }
    }

    // Now filter any stages that have no body content (Empty/Skipped stages)
    // CRITICAL: We MUST include the stage that the user is currently VIEWING/EDITING
    // even if it's empty, otherwise the preview will disappear entirely for new processes.
    allStages = allStages.filter(s => {
      const isActiveDraft = s._isActiveView;
      const hasContent = hasRealContent(s.body);
      const hasSignatures = (s.signatures && s.signatures.length > 0) || s.signatureName;

      return isActiveDraft || hasContent || hasSignatures;
    });

    // Process stages INDEPENDENTLY to enforce page breaks
    let allPages: { html: string, isStartStage: boolean, stageIndex: number, isFirstPageOfStage: boolean }[] = [];

    allStages.forEach((stage) => {
      let stageHtml = '';
      const stageInternalTitle = stage.title;

      // Header for the stage
      // Display Priority Badge ONLY if we are in the Initial Stage (0) AND this is the Initial Stage content
      if (stage.stageIndex === 0 && content.priority && content.currentStageIndex === 0) {
        const priorityConfigs: Record<string, { style: string, icon: string, label: string }> = {
          'Normal': {
            style: 'bg-slate-100 text-slate-600 border-slate-200',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
            label: 'Normal'
          },
          'Média': {
            style: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            label: 'Média'
          },
          'Alta': {
            style: 'bg-amber-50 text-amber-700 border-amber-200',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
            label: 'Alta'
          },
          'Urgência': {
            style: 'bg-rose-50 text-rose-700 border-rose-200',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
            label: 'Urgência'
          },
        };

        const config = priorityConfigs[content.priority] || priorityConfigs['Normal'];

        stageHtml += `
          <div class="flex items-center justify-between mb-6 pb-2 border-b border-blue-100">
             <h3 class="text-blue-900 font-bold uppercase text-sm m-0 transform translate-y-0.5">${stageInternalTitle}</h3>
             <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[7pt] font-black uppercase tracking-widest border shrink-0 ${config.style} shadow-sm">
                ${config.icon}
                <span>${config.label}</span>
             </div>
          </div>
        `;
      } else {
        stageHtml += `<h3 class="text-blue-900 font-bold uppercase text-sm mb-6 pb-2 border-b border-blue-100">${stageInternalTitle}</h3>`;
      }

      // Body
      stageHtml += stage.body || '<p class="text-slate-400 italic py-4">[Conteúdo da etapa em elaboração]</p>';

      // Inject Priority Justification (Only for High/Urgent in Stage 0 AND if currently in Stage 0)
      if (stage.stageIndex === 0 && (content.priority === 'Alta' || content.priority === 'Urgência') && content.priorityJustification && content.currentStageIndex === 0) {
        stageHtml += `
           <div class="mt-2 mb-2 bg-rose-50/30 p-2 rounded-lg border-l-2 border-rose-200">
             <span class="block text-[10pt] font-black text-rose-800 uppercase tracking-widest mb-0.5">Nota de Prioridade (${content.priority}):</span>
             <span class="block text-[10pt] text-slate-900 leading-snug italic">${content.priorityJustification}</span>
           </div>
          `;
      }

      // Process Inline Signatures (Markers)
      // Regex detects: <span ... data-marker="[ASSINATURA: Name | Role | Sector]" ...>...</span>
      // Replace with getSignatureHtml output
      stageHtml = stageHtml.replace(/<span[^>]*data-marker="\[ASSINATURA:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\]"[^>]*>(?:<span[^>]*>[\s\S]*?<\/span>|[\s\S])*?<\/span>/g, (match, name, role, sector) => {
        return getSignatureHtml(name, role, sector);
      });
      // Fallback for plain text markers (legacy or pasted)
      stageHtml = stageHtml.replace(/(?<!data-marker=")(?<!<span[^>]*>)\[ASSINATURA:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\]/g, (match, name, role, sector) => {
        return getSignatureHtml(name, role, sector);
      });

      let signatureHtmlToInsert = '';
      // Special Handling for Stage 0 (Início) - Single Signature "Oficio Style"
      if (stage.stageIndex === 0) {
        // INJECT ITEMS IF PRESENT (Before Signature)
        if (content.purchaseItems && content.purchaseItems.length > 0) {
          // FORCE START ON NEW PAGE by injecting a marker
          stageHtml += '<div class="split-helper"></div><div id="PAGE_BREAK_MARKER"></div>';

          // Pagination Logic for Items
          const ITEMS_PER_PAGE = 9; // Limit requested by user
          const items = [...content.purchaseItems];
          const totalItems = items.length;

          for (let i = 0; i < totalItems; i += ITEMS_PER_PAGE) {
            const chunk = items.slice(i, i + ITEMS_PER_PAGE);
            const isLastChunk = i + ITEMS_PER_PAGE >= totalItems;

            // If not the first chunk (which already has a break before it), add a break
            if (i > 0) {
              stageHtml += '<div class="split-helper"></div><div id="PAGE_BREAK_MARKER"></div>';
            }

            // HEADER OF TABLE SECTION
            stageHtml += `
               <div class="mt-8 mb-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                 <div class="bg-blue-900 px-5 py-3 flex items-center justify-between">
                   <div class="flex items-center gap-2">
                      <span class="text-white font-black uppercase text-xs tracking-[0.2em]">Itens da Requisição ${i > 0 ? '(Continuação)' : ''}</span>
                   </div>
                   <span class="bg-white/10 text-white px-2 py-0.5 rounded text-[9pt] font-mono font-bold">${i + 1} - ${Math.min(i + ITEMS_PER_PAGE, totalItems)} de ${totalItems}</span>
                 </div>
                 
                 <table class="w-full text-left border-collapse">
                   <thead>
                     <tr class="bg-slate-50 border-b border-slate-200">
                       <th class="py-3 px-4 font-black text-slate-500 uppercase text-[8pt] w-14 text-center tracking-wider">Ref.</th>
                       <th class="py-3 px-4 font-black text-slate-600 uppercase text-[8pt] tracking-wider border-l border-slate-100">Descrição Detalhada do Item</th>
                       <th class="py-3 px-4 font-black text-slate-500 uppercase text-[8pt] w-28 text-center tracking-wider border-l border-slate-100">Unidade</th>
                       <th class="py-3 px-4 font-black text-slate-500 uppercase text-[8pt] w-24 text-center tracking-wider border-l border-slate-100">Qtd.</th>
                     </tr>
                   </thead>
                   <tbody class="text-[10pt]">
             `;

            chunk.forEach((item, idx) => {
              const absoluteIdx = i + idx;
              const isEven = idx % 2 === 0;
              const rowClass = isEven ? 'bg-white' : 'bg-slate-50/50';

              stageHtml += `
                 <tr class="${rowClass} border-b border-slate-100 last:border-0">
                   <td class="py-3 px-4 font-bold text-slate-400 text-center text-[9pt]">${(absoluteIdx + 1).toString().padStart(2, '0')}</td>
                   <td class="py-3 px-4 font-medium text-slate-800 border-l border-slate-100 leading-snug">${item.name}</td>
                   <td class="py-3 px-4 text-slate-500 text-center text-[9pt] font-semibold border-l border-slate-100 uppercase">${item.unit}</td>
                   <td class="py-3 px-4 font-bold text-slate-900 text-center bg-emerald-50/30 border-l border-slate-100">${item.quantity}</td>
                 </tr>
               `;
            });

            stageHtml += `
                   </tbody>
                 </table>
               </div>
               <div class="h-8"></div>
             `;
          }
        }

        // Check if we need to force a new page for the signature (if items pushed it too far)
        if (content.purchaseItems && content.purchaseItems.length > 0) {
          const ITEMS_PER_PAGE = 9;
          const totalItems = content.purchaseItems.length;
          const lastChunkSize = (totalItems % ITEMS_PER_PAGE) || ITEMS_PER_PAGE;
          if (lastChunkSize > 4) {
            stageHtml += '<div class="split-helper"></div><div id="PAGE_BREAK_MARKER"></div>';
          }
        }

        if (docConfig.showSignature && stage.signatureName) {
          let combinedBlock = `<div class="mt-0 mb-0">${getSignatureHtml(stage.signatureName, stage.signatureRole, stage.signatureSector)}</div>`;

          if (content.digitalSignature?.enabled) {
            combinedBlock += `
                <div class="mt-1 text-center" style="margin-top: 4px;">
                  <div class="text-[7pt] text-slate-500 uppercase tracking-widest leading-tight" style="font-size: 7pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.25;">
                    <p class="font-bold text-emerald-600" style="margin:0; font-weight: 700; color: #059669;">Documento Finalizado e Consolidado</p>
                    <p style="margin:0;">Hash Validador: <span class="font-mono text-slate-900" style="font-family: monospace; color: #0f172a;">${content.digitalSignature.id}</span></p>
                  </div>
                </div>
              `;
          }
          // Store the HTML to insert later, and append an ATOMIC placeholder that won't get fragmented by split()
          signatureHtmlToInsert = `<div class="signature-wrapper mt-0 break-inside-avoid">${combinedBlock}</div>`;
          stageHtml += '<div id="sig-placeholder"></div>';
        }
      }

      // Split THIS stage into its own pages
      // Fix: Use lookbehind for <br> so it is preserved in the previous block instead of consumed
      const blocks = stageHtml.split(/(?<=<\/p>)|(?<=<\/div>)|(?<=<br\s*\/?>)/g).filter(b => b.trim());

      // Initialize first page for this stage
      let currentStagePages: string[] = [];
      let currentPageContent = '';
      let currentLinesUsed = 0;

      blocks.forEach((originalBlockHTML) => {
        if (!originalBlockHTML?.trim()) return;

        // Force Page Break Detection
        if (originalBlockHTML.includes('id="PAGE_BREAK_MARKER"')) {
          if (currentPageContent) {
            currentStagePages.push(currentPageContent);
            currentPageContent = '';
            currentLinesUsed = 0;
          }
          return; // Skip rendering the marker itself
        }

        // Swap placeholder with real signature content
        let blockHTML = originalBlockHTML;
        if (blockHTML.includes('id="sig-placeholder"')) {
          blockHTML = signatureHtmlToInsert;
        }

        const plainText = blockHTML.replace(/<[^>]+>/g, '') || ' ';
        const isSignature = blockHTML.includes('signature-block');

        // Estimate lines
        let linesInBlock = Math.max(1, Math.ceil(plainText.length / CHARS_PER_LINE));

        // Add spacing cost for paragraphs (visual margin)
        if (blockHTML.includes('<p') || blockHTML.includes('<div')) linesInBlock += 0.8;

        // Adjust estimation for special blocks
        if (isSignature) linesInBlock += 5;
        if (blockHTML.includes('<h3')) linesInBlock += 3;
        if (blockHTML.includes('Nota de Prioridade')) linesInBlock += 10; // Aggressive spacing cost to force page break

        // DYNAMIC CAPACITY: The first page of the first stage has LESS space if addressing blocks are shown
        const isFirstPageOfFirstStage = stage.stageIndex === 0 && currentStagePages.length === 0;
        let effectiveMaxLines = MAX_LINES_PER_PAGE;
        if (isFirstPageOfFirstStage && (state.document.showLeftBlock || state.document.showRightBlock)) {
          effectiveMaxLines -= 8; // Reserved space for addressing blocks + extra margin
        }

        if ((currentLinesUsed + linesInBlock) > effectiveMaxLines) {
          // Push current page
          currentStagePages.push(currentPageContent);
          // Start new page
          currentPageContent = blockHTML;
          currentLinesUsed = linesInBlock;
        } else {
          currentPageContent += blockHTML;
          currentLinesUsed += linesInBlock;
        }
      });

      if (currentPageContent) currentStagePages.push(currentPageContent);

      // append this stage's pages to the master list with metadata
      const isStartStage = stage.stageIndex === 0;
      currentStagePages.forEach((html, pIdx) => {
        allPages.push({
          html,
          isStartStage,
          stageIndex: stage.stageIndex,
          isFirstPageOfStage: pIdx === 0
        });
      });
    });

    return allPages;
  }, [content.body, content.licitacaoStages, content.signatureName, content.signatureRole, content.signatureSector, content.signatures, content.currentStageIndex, content.viewingStageIndex, content.purchaseItems, content.digitalSignature, docConfig.showSignature, content.priority, content.priorityJustification]);

  const startStagePagesCount = pages.filter(p => p.isStartStage).length;
  const standardPagesCount = pages.length - startStagePagesCount;

  // AUTO-SCROLL LOGIC
  useEffect(() => {
    const viewIdx = content.viewingStageIndex ?? (content.currentStageIndex || 0);
    // Use a small timeout to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      const element = document.getElementById(`licitacao-stage-${viewIdx}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [content.viewingStageIndex, content.currentStageIndex]);

  return (
    <>
      {pages.map((pageData, globalIndex) => {
        let localPageIndex;
        let localTotalPages;
        let forceHide;

        if (pageData.isStartStage) {
          localPageIndex = globalIndex;
          localTotalPages = startStagePagesCount;
          forceHide = true;
        } else {
          localPageIndex = globalIndex - startStagePagesCount;
          localTotalPages = standardPagesCount;
          forceHide = false;
        }

        return (
          <PageWrapper
            key={globalIndex}
            state={state}
            pageIndex={localPageIndex}
            totalPages={localTotalPages}
            isGenerating={isGenerating}
            forceHidePageNumbers={forceHide}
          >
            <div id={pageData.isFirstPageOfStage ? `licitacao-stage-${pageData.stageIndex}` : undefined} className="mb-2 flex flex-col gap-2">
              <div className="bg-blue-900 text-white px-4 py-2 rounded-lg font-black text-xs uppercase tracking-[0.3em] text-center">
                Processo Administrativo / Licitatório
              </div>

              {/* ADDRESSING BLOCKS - Only on First Page of Stage 0 (Início) */}
              {pageData.stageIndex === 0 && pageData.isFirstPageOfStage && (
                <div className="flex justify-between items-start px-1 my-3">
                  <div
                    className={`whitespace-pre-wrap max-w-[45%] leading-snug ${(!content.leftBlockText) ? 'invisible' : ''}`}
                    style={{
                      fontSize: `${docConfig.leftBlockStyle?.size || 10}pt`,
                      color: docConfig.leftBlockStyle?.color || '#191822',
                      fontWeight: 'normal'
                    }}
                  >
                    {content.leftBlockText || ' '}
                  </div>

                  <div
                    className={`whitespace-pre-wrap text-right max-w-[45%] leading-snug ${(!content.rightBlockText) ? 'invisible' : ''}`}
                    style={{
                      fontSize: `${docConfig.rightBlockStyle?.size || 10}pt`,
                      color: docConfig.rightBlockStyle?.color || '#191822',
                      fontWeight: 'normal'
                    }}
                  >
                    {content.rightBlockText || ' '}
                  </div>
                </div>
              )}

              <h1 className="font-black leading-tight tracking-tight text-[24pt] text-blue-900 text-center uppercase">
                {`${content.title || ''}${content.title && content.protocol ? ' ' : ''}${content.protocol || ''}`}
              </h1>
              <div className="w-20 h-1 bg-blue-900 mx-auto" />
            </div>
            <div className="max-w-none w-full text-gray-800 leading-relaxed text-justify text-[10.5pt] whitespace-pre-wrap font-serif break-words" dangerouslySetInnerHTML={{ __html: pageData.html }} />

            {/* Global Digital Signature Footer REMOVED - Integrated into Stage 0 Block */}
          </PageWrapper>
        );
      })}
    </>
  );
};
