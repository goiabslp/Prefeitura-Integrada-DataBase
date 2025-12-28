
import React, { useRef } from 'react';
import { Upload, Layout, LogIn } from 'lucide-react';
import { AppState, UIConfig } from '../../types';

interface UIFormProps {
  ui: UIConfig;
  handleUpdate: (section: keyof AppState, key: string, value: any) => void;
}

export const UIForm: React.FC<UIFormProps> = ({ ui, handleUpdate }) => {
  const loginLogoInputRef = useRef<HTMLInputElement>(null);
  const headerLogoInputRef = useRef<HTMLInputElement>(null);

  const handleLoginLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleUpdate('ui', 'loginLogoUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleHeaderLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleUpdate('ui', 'headerLogoUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Layout className="w-4 h-4" /> Header (Topo) do Sistema
        </h3>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-3">Imagem da Logo (Header)</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden relative group shrink-0">
                {ui.headerLogoUrl ? <img src={ui.headerLogoUrl} alt="Logo Header" className="w-full h-full object-contain p-1.5" /> : <span className="text-[10px] text-slate-400 font-medium text-center">Nenhuma</span>}
                {ui.headerLogoUrl && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleUpdate('ui', 'headerLogoUrl', null)} className="text-white text-[10px] hover:underline">Limpar</button>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input type="file" ref={headerLogoInputRef} onChange={handleHeaderLogoUpload} accept="image/*" className="hidden" />
                <button onClick={() => headerLogoInputRef.current?.click()} className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                  <Upload className="w-3 h-3" />{ui.headerLogoUrl ? 'Alterar' : 'Carregar'} Logo
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Altura da Logo no Topo (px)</label>
            <input type="range" min="20" max="100" value={ui.headerLogoHeight} onChange={(e) => handleUpdate('ui', 'headerLogoHeight', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
            <div className="text-right text-[10px] text-slate-400 mt-1 font-bold">{ui.headerLogoHeight}px</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <LogIn className="w-4 h-4" /> Tela de Login
        </h3>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-3">Imagem da Logo (Login)</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden relative group shrink-0">
                {ui.loginLogoUrl ? <img src={ui.loginLogoUrl} alt="Logo Login" className="w-full h-full object-contain p-1.5" /> : <span className="text-[10px] text-slate-500 font-medium text-center">Nenhuma</span>}
                {ui.loginLogoUrl && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleUpdate('ui', 'loginLogoUrl', null)} className="text-white text-[10px] hover:underline">Limpar</button>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input type="file" ref={loginLogoInputRef} onChange={handleLoginLogoUpload} accept="image/*" className="hidden" />
                <button onClick={() => loginLogoInputRef.current?.click()} className="w-full px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                  <Upload className="w-3 h-3" />{ui.loginLogoUrl ? 'Alterar' : 'Carregar'} Logo
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Altura da Logo no Login (px)</label>
            <input type="range" min="30" max="200" value={ui.loginLogoHeight} onChange={(e) => handleUpdate('ui', 'loginLogoHeight', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
            <div className="text-right text-[10px] text-slate-400 mt-1 font-bold">{ui.loginLogoHeight}px</div>
          </div>
        </div>
      </div>
    </div>
  );
};
