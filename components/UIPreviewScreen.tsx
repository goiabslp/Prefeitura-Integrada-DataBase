
import React from 'react';
import { UIConfig } from '../types';
import { LogIn, Layout, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { getCachedImage, IMAGE_KEYS } from '../services/cacheService';

interface UIPreviewScreenProps {
  ui: UIConfig;
}

export const UIPreviewScreen: React.FC<UIPreviewScreenProps> = ({ ui }) => {
  return (
    <div className="flex-1 h-full bg-slate-100 p-8 overflow-auto custom-scrollbar animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-12 pb-20">

        {/* Header Preview Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Layout className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Preview: Cabeçalho do Sistema</h2>
            <span className="text-[10px] font-black uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200 text-slate-400">Escala Real</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
            <header className="w-full bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                {ui.headerLogoUrl ? (
                  <img
                    src={getCachedImage(ui.headerLogoUrl, IMAGE_KEYS.headerLogoUrl) || ui.headerLogoUrl}
                    alt="Logo Header"
                    style={{ height: `${ui.headerLogoHeight}px` }}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-xl font-black text-slate-300">Logo</span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="h-3 w-24 bg-slate-100 rounded mb-1"></div>
                  <div className="h-2 w-16 bg-slate-50 rounded ml-auto"></div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-slate-300" />
                </div>
                <div className="p-2.5 text-slate-300">
                  <LogOut className="w-5 h-5" />
                </div>
              </div>
            </header>
            <div className="p-12 bg-slate-50 flex flex-col items-center justify-center gap-4">
              <div className="w-full max-w-md h-4 bg-white rounded-full border border-slate-200"></div>
              <div className="w-full max-w-sm h-4 bg-white rounded-full border border-slate-200"></div>
              <p className="text-slate-400 text-xs font-medium mt-4 italic text-center">Área de conteúdo da Dashboard (Simulação)</p>
            </div>
          </div>
        </section>

        {/* Login Preview Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <LogIn className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Preview: Tela de Login</h2>
            <span className="text-[10px] font-black uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200 text-slate-400">Escala 80%</span>
          </div>

          <div className="relative rounded-3xl shadow-2xl border border-slate-200 overflow-hidden bg-slate-900 aspect-video flex items-center justify-center p-12">
            {/* Login Background Simulation */}
            <div className="absolute inset-0 z-0">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px]"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-purple-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl relative z-10 p-8 flex flex-col items-center">
              <div className="mb-10 flex flex-col items-center">
                {ui.loginLogoUrl ? (
                  <img
                    src={getCachedImage(ui.loginLogoUrl, IMAGE_KEYS.loginLogoUrl) || ui.loginLogoUrl}
                    alt="Logo Login"
                    style={{ height: `${ui.loginLogoHeight * 0.8}px` }} // Scaled for preview area
                    className="object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <LogIn className="w-8 h-8 text-white/50" />
                  </div>
                )}
              </div>

              <div className="w-full space-y-4">
                <div className="h-10 w-full bg-white/5 border border-white/10 rounded-xl"></div>
                <div className="h-10 w-full bg-white/5 border border-white/10 rounded-xl"></div>
                <div className="h-12 w-full bg-indigo-600 rounded-xl mt-6"></div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 w-full text-center">
                <div className="h-2 w-24 bg-white/10 rounded-full mx-auto"></div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
