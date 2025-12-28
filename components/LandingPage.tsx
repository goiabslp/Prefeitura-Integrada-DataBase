
import React from 'react';
import { Sparkles, FileText, Layout, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Navbar Minimalista */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Gerador de Documentos</span>
        </div>
        <button onClick={onStart} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
          Entrar no Sistema
        </button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Potencializado por IA
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
            Crie propostas <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">irresistíveis</span> em segundos.
          </h1>
          
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
            Abandone os editores complexos. Gere documentos com identidade visual perfeita, conteúdo assistido por Inteligência Artificial e design profissional automaticamente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-lg font-bold transition-all shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 flex items-center justify-center gap-2 group"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2">
              Ver Exemplos
            </button>
          </div>

          <div className="pt-8 flex items-center gap-6 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Exportação PDF HD</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Customização Total</span>
            </div>
          </div>
        </div>

        {/* Visual Decoration */}
        <div className="relative hidden lg:block animate-fade-in">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-200/50 rounded-full blur-3xl opacity-50 mix-blend-multiply filter"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl opacity-50 mix-blend-multiply filter"></div>
          
          <div className="relative bg-white/40 backdrop-blur-xl border border-white/50 p-4 rounded-3xl shadow-2xl shadow-indigo-100/50 transform rotate-[-2deg] hover:rotate-0 transition-all duration-700">
            <div className="bg-white rounded-2xl overflow-hidden shadow-inner border border-slate-100">
               {/* Mockup visual of the editor interface */}
               <div className="h-4 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 px-3">
                 <div className="w-2 h-2 rounded-full bg-red-400"></div>
                 <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                 <div className="w-2 h-2 rounded-full bg-green-400"></div>
               </div>
               <div className="p-8 space-y-4 opacity-80">
                  <div className="h-8 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-100 rounded"></div>
                    <div className="h-3 w-full bg-slate-100 rounded"></div>
                    <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <div className="h-24 w-1/2 bg-indigo-50 rounded border border-indigo-100"></div>
                    <div className="h-24 w-1/2 bg-purple-50 rounded border border-purple-100"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
