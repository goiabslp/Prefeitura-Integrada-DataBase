import React, { useMemo, useEffect } from 'react';
import { AppState } from '../types';
import { PageWrapper } from './PageWrapper';

interface LicitacaoPreviewProps {
  state: AppState;
  isGenerating: boolean;
}

export const LicitacaoPreview: React.FC<LicitacaoPreviewProps> = ({ state, isGenerating }) => {
  const { branding, document: docConfig, content } = state;

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
    const TOTAL_LINES_CAPACITY = 44;
    const SECURITY_MARGIN_LINES = 1;
    const HEADER_ESTIMATED_LINES = 6; // Header takes significant space now
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
          _isActiveView: true // Flag to force rendering even if empty
        };
      }

      // If generic filtering of future empty stages is desired (ONLY if they are truly empty in history too)
      // The `filter` below cleans up. 

      if (stageData) {
        // Ensure title is correct
        if (!stageData.title) stageData.title = STAGES_TITLES[i] || `Etapa ${i}`;
        allStages.push({ ...stageData, absoluteIndex: i });
      }
    }

    // Now filter any stages that have no body content (Empty/Skipped stages)
    // CRITICAL: We MUST include the stage that the user is currently VIEWING/EDITING
    // even if it's empty, otherwise the preview will disappear entirely for new processes.
    allStages = allStages.filter(s => {
      const isActiveDraft = s.id === 'active-draft' || s._isActiveView;
      const hasContent = s && s.body && s.body.trim().length > 0 && s.body !== '<p></p>';
      return isActiveDraft || hasContent;
    });

    // Process stages INDEPENDENTLY to enforce page breaks
    let allPages: { html: string, isStartStage: boolean, stageIndex: number, isFirstPageOfStage: boolean }[] = [];

    allStages.forEach((stage, index) => {
      let stageHtml = '';
      const stageInternalTitle = stage.title || (['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'][index] || `Etapa ${(index + 1).toString().padStart(2, '0')}`);

      // Header for the stage
      stageHtml += `<h3 class="text-blue-900 font-bold uppercase text-sm mb-6 pb-2 border-b border-blue-100">${stageInternalTitle}</h3>`;

      // Body
      stageHtml += stage.body || '<p class="text-slate-400 italic py-4">[Conteúdo da etapa em elaboração]</p>';

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

      // Split THIS stage into its own pages
      // Fix: Use lookbehind for <br> so it is preserved in the previous block instead of consumed
      const blocks = stageHtml.split(/(?<=<\/p>)|(?<=<\/div>)|(?<=<br\s*\/?>)/g).filter(b => b.trim());

      // Initialize first page for this stage
      let currentStagePages: string[] = [];
      let currentPageContent = '';
      let currentLinesUsed = 0;

      blocks.forEach((blockHTML) => {
        if (!blockHTML?.trim()) return;
        const plainText = blockHTML.replace(/<[^>]+>/g, '') || ' ';
        const isSignature = blockHTML.includes('signature-block');

        // Estimate lines
        let linesInBlock = Math.max(1, Math.ceil(plainText.length / CHARS_PER_LINE));

        // Add spacing cost for paragraphs (visual margin)
        if (blockHTML.includes('<p') || blockHTML.includes('<div')) linesInBlock += 0.8;

        // Adjust estimation for special blocks
        if (isSignature) linesInBlock += 5;
        if (blockHTML.includes('<h3')) linesInBlock += 3;

        // DYNAMIC CAPACITY: The first page of the first stage has LESS space if addressing blocks are shown
        const isFirstPageOfFirstStage = index === 0 && currentStagePages.length === 0;
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
      const isStartStage = index === 0;
      currentStagePages.forEach((html, pIdx) => {
        allPages.push({
          html,
          isStartStage,
          stageIndex: stage.absoluteIndex,
          isFirstPageOfStage: pIdx === 0
        });
      });
    });

    return allPages;
  }, [content.body, content.licitacaoStages, content.signatureName, content.signatureRole, content.signatureSector, content.signatures, content.currentStageIndex, content.viewingStageIndex]);

  const startStagePagesCount = pages.filter(p => p.isStartStage).length;
  const standardPagesCount = pages.length - startStagePagesCount;

  // AUTO-SCROLL LOGIC
  useEffect(() => {
    const viewIdx = content.viewingStageIndex ?? (content.currentStageIndex || 0);
    const timeoutId = setTimeout(() => {
      const element = document.getElementById(`licitacao-stage-${viewIdx}`);
      if (element) {
        const container = element.closest('.overflow-auto');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          // getBoundingClientRect is already scaled, so we just calculate the visual distance
          const relativeTop = elementRect.top - containerRect.top + container.scrollTop;

          container.scrollTo({
            top: relativeTop - 40, // Offset to show the top of the page nicely
            behavior: 'smooth'
          });
        }
      }
    }, 150);
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
            <div id={pageData.isFirstPageOfStage ? `licitacao-stage-${pageData.stageIndex}` : undefined} className="mb-6 flex flex-col gap-6">
              <div className="bg-blue-900 text-white px-4 py-2 rounded-lg font-black text-xs uppercase tracking-[0.3em] text-center">
                Processo Administrativo / Licitatório
              </div>

              {/* ADDRESSING BLOCKS */}
              {globalIndex === 0 && (
                <div className="flex justify-between items-start px-1">
                  <div
                    className={`whitespace-pre-wrap max-w-[45%] leading-snug ${(!docConfig.showLeftBlock || !content.leftBlockText) ? 'invisible' : ''}`}
                    style={{
                      fontSize: `${docConfig.leftBlockStyle?.size || 10}pt`,
                      color: docConfig.leftBlockStyle?.color || '#191822',
                      fontWeight: 'normal'
                    }}
                  >
                    {content.leftBlockText || ' '}
                  </div>

                  <div
                    className={`whitespace-pre-wrap text-right max-w-[45%] leading-snug ${(!docConfig.showRightBlock || !content.rightBlockText) ? 'invisible' : ''}`}
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

            {/* Global Digital Signature Footer (if enabled) - Only on last page */}
            {globalIndex === pages.length - 1 && content.digitalSignature?.enabled && (
              <div className="mt-auto pt-10 flex justify-center">
                <div className="text-[7pt] text-slate-500 uppercase tracking-widest leading-tight text-center">
                  <p className="font-bold text-emerald-600">Documento Finalizado e Consolidado</p>
                  <p>Hash Validador: <span className="font-mono text-slate-900">{content.digitalSignature.id}</span></p>
                </div>
              </div>
            )}
          </PageWrapper>
        );
      })}
    </>
  );
};
