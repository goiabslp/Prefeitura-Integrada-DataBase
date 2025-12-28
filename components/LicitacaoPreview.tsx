
import React, { useMemo } from 'react';
import { AppState } from '../types';
import { PageWrapper } from './PageWrapper';

interface LicitacaoPreviewProps {
  state: AppState;
  isGenerating: boolean;
}

export const LicitacaoPreview: React.FC<LicitacaoPreviewProps> = ({ state, isGenerating }) => {
  const { branding, document: docConfig, content } = state;

  const pages = useMemo(() => {
    const MAX_LINES_PER_PAGE = 36;
    const CHARS_PER_LINE = 80;
    const blocks = content.body.split(/(?<=<\/p>)|(?<=<\/div>)|<br\s*\/?>/g);
    const resultPages: string[] = [];
    let currentPageContent = '';
    let currentLinesUsed = 0;

    blocks.forEach((blockHTML) => {
      if (!blockHTML?.trim()) return;
      const plainText = blockHTML.replace(/<[^>]+>/g, '') || ' ';
      const linesInBlock = Math.max(1, Math.ceil(plainText.length / CHARS_PER_LINE));

      if ((currentLinesUsed + linesInBlock) > MAX_LINES_PER_PAGE) {
        resultPages.push(currentPageContent);
        currentPageContent = blockHTML;
        currentLinesUsed = linesInBlock;
      } else {
        currentPageContent += blockHTML;
        currentLinesUsed += linesInBlock;
      }
    });

    if (currentPageContent) resultPages.push(currentPageContent);
    return resultPages;
  }, [content.body]);

  return (
    <>
      {pages.map((pageHtml, pageIndex) => (
        <PageWrapper key={pageIndex} state={state} pageIndex={pageIndex} totalPages={pages.length} isGenerating={isGenerating}>
          {pageIndex === 0 && (
            <div className="mb-6">
              <div className="bg-blue-900 text-white px-4 py-2 rounded-lg font-black text-xs uppercase tracking-[0.3em] mb-4 text-center">
                Processo Administrativo / Licitatório
              </div>
              <h1 className="font-black leading-tight tracking-tight text-[24pt] text-blue-900 text-center uppercase">
                {content.title}
              </h1>
              <div className="w-20 h-1 bg-blue-900 mx-auto mt-4" />
            </div>
          )}
          <div className="max-w-none text-gray-800 leading-loose text-justify text-[10.5pt] whitespace-pre-wrap font-serif" dangerouslySetInnerHTML={{ __html: pageHtml }} />

          {pageIndex === pages.length - 1 && (
            <div className="mt-auto pt-20 flex justify-center">
              <div className="w-80 border-t border-blue-900 pt-2 text-center">
                {content.digitalSignature?.enabled && (
                  <div className="mb-2 text-[7pt] text-slate-500 uppercase tracking-widest leading-tight">
                    <p className="font-bold text-emerald-600">Assinado Digitalmente</p>
                    <p>Autenticador Mobile 2FA</p>
                    <p>IP: {content.digitalSignature.ip}</p>
                    <p>ID: <span className="font-mono">{content.digitalSignature.id}</span></p>
                    <p className="text-[6pt] normal-case opacity-70">{new Date(content.digitalSignature.date).toLocaleString('pt-BR')}</p>
                  </div>
                )}
                <p className="font-black uppercase text-[10pt] text-blue-900">{content.signatureName}</p>
                <p className="text-[8pt] font-bold text-slate-500 uppercase">Comissão de Licitação</p>
              </div>
            </div>
          )}
        </PageWrapper>
      ))}
    </>
  );
};
