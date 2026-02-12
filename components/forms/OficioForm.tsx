import React, { useRef, useState, useEffect } from 'react';
import {
  FileText, Columns, PenTool, CheckCircle2, Eye, EyeOff, AlignJustify, Image as ImageIcon, Loader2, Bold, Italic, Underline
} from 'lucide-react';
import { AppState, ContentData, DocumentConfig, Signature } from '../../types';
import { uploadFile } from '../../services/storageService';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Toolbar State
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Helpers for Rich Text -> State conversion
  const toHtml = (text: string) => {
    if (!text) return '';
    // Replace \n with <br> to render newlines in HTML
    return text.replace(/\n/g, '<br>');
  };

  const toText = (html: string) => {
    // Replace <br>, <div> with \n
    // First, handle empty lines (div with br) to avoid double spacing
    // div > br > /div -> single \n (standard line break)
    // The next div will add another \n if needed, but we want to avoid 3 \n for one blank line.

    let text = html
      .replace(/<div>\s*<br\s*\/?>\s*<\/div>/gi, '\n')
      .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<div\s*>/gi, '\n') // Chrome adds divs for new lines
      .replace(/<\/div>/gi, '')
      .replace(/<p\s*>/gi, '\n')
      .replace(/<\/p>/gi, '')
      .replace(/&nbsp;/gi, ' ');
    return text;
  };

  // Sync state to editor (Initial + External Updates)
  useEffect(() => {
    if (editorRef.current) {
      const currentText = toText(editorRef.current.innerHTML);
      // Only update if significantly different to avoid cursor jumping
      // Simple equality check on sanitized text
      if (currentText !== content.body) {
        editorRef.current.innerHTML = toHtml(content.body);
      }
    }
  }, [content.body]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    const text = toText(html);
    handleUpdate('content', 'body', text);
  };

  // Handle outside click to hide toolbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node) && editorRef.current && !editorRef.current.contains(event.target as Node)) {
        setShowToolbar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current?.contains(selection.anchorNode)) {
      setShowToolbar(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setToolbarPos({
      top: rect.top - 50,
      left: rect.left + (rect.width / 2) - 40 // Center
    });
    setShowToolbar(true);
  };

  const applyFormat = (command: string) => {
    document.execCommand(command, false);

    // Force sync after formatting
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = toText(html);
      handleUpdate('content', 'body', text);
    }
    // Keep selection? execCommand keeps it usually.
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);

    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const cleanText = toText(html);
      handleUpdate('content', 'body', cleanText);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Use standard 'attachments' bucket
      const publicUrl = await uploadFile(file, 'attachments');

      if (publicUrl) {
        const imageId = Date.now().toString();
        const newImage = {
          id: imageId,
          url: publicUrl,
          width: 500, // default width
          height: 300 // default aspect ratio placeholder
        };

        const token = `{{IMG::${imageId}}}`; // Just text token

        // Let's try executing insertText command
        editorRef.current?.focus();
        const success = document.execCommand('insertText', false, `\n${token}\n`);

        let newBody = content.body;
        if (!success) {
          // Fallback append
          newBody = content.body + `\n${token}\n`;
        } else {
          // If success, the DOM is updated. We need to grab it.
          newBody = toText(editorRef.current!.innerHTML);
        }

        const updatedContent = {
          ...content,
          body: newBody,
          images: [...(content.images || []), newImage]
        };

        onUpdate({
          ...state,
          content: updatedContent
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Columns className="w-4 h-4" /> Blocos de Endereçamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase">Bloco Esquerdo (Ref)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={docConfig.showLeftBlock} onChange={(e) => handleUpdate('document', 'showLeftBlock', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            {docConfig.showLeftBlock && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={content.leftBlockText?.split('\n')[0] || ''}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-500 cursor-not-allowed select-none opacity-70"
                  title="O número do ofício não pode ser alterado aqui."
                />
                <textarea
                  value={content.leftBlockText?.split('\n').slice(1).join('\n') || ''}
                  onChange={(e) => {
                    const firstLine = content.leftBlockText?.split('\n')[0] || '';
                    const newText = e.target.value;
                    handleUpdate('content', 'leftBlockText', firstLine + (newText ? '\n' + newText : ''));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs h-20 resize-none focus:bg-white transition-all outline-none placeholder:text-slate-400"
                  placeholder="Informações adicionais..."
                />
              </div>
            )}
          </div>

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
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Identificação do Ofício</h3>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 mb-2">Assunto / Título</label>
          <input
            value={content.title}
            onChange={(e) => handleUpdate('content', 'title', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:bg-white transition-all outline-none"
            placeholder="Novo Ofício"
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><AlignJustify className="w-4 h-4" /> Corpo do Ofício</h3>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onMouseUp={handleMouseUp}
            onPaste={handlePaste}
            className="w-full bg-white p-6 text-sm leading-relaxed min-h-[400px] outline-none focus:bg-slate-50/30 transition-all font-sans cursor-text"
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          />

          {/* Floating Toolbar */}
          {showToolbar && (
            <div
              ref={toolbarRef}
              className="fixed flex items-center gap-1 bg-slate-900 text-white p-1.5 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in duration-200"
              style={{ top: toolbarPos.top, left: toolbarPos.left }}
            >
              <button onClick={() => applyFormat('bold')} className="p-1.5 hover:bg-slate-700 rounded transition-colors" title="Negrito">
                <Bold className="w-4 h-4" />
              </button>
              <button onClick={() => applyFormat('italic')} className="p-1.5 hover:bg-slate-700 rounded transition-colors" title="Itálico">
                <Italic className="w-4 h-4" />
              </button>
              <button onClick={() => applyFormat('underline')} className="p-1.5 hover:bg-slate-700 rounded transition-colors" title="Sublinhado">
                <Underline className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Bar at Bottom of Textarea */}
          <div className="bg-slate-50 border-t border-slate-200 p-2 flex items-center justify-end">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-70 shadow-sm"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              Inserir Imagem
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 italic">O texto será paginado automaticamente com base nas quebras de linha digitadas.</p>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4" /> Assinatura</h3>
          <button
            onClick={() => handleUpdate('document', 'showSignature', !docConfig.showSignature)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${docConfig.showSignature
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

        {/* Opção de Assinatura Digital */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Assinar Digitalmente</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={content.useDigitalSignature || false}
              onChange={(e) => handleUpdate('content', 'useDigitalSignature', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};