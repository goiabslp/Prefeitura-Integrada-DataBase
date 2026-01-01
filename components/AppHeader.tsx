
import React from 'react';
import {
  Settings,
  LogOut,
  User as UserIcon,
  ChevronDown,
  FileText,
  Home,
  RefreshCw
} from 'lucide-react';
import { User, UIConfig, BlockType } from '../types';

interface AppHeaderProps {
  currentUser: User;
  uiConfig: UIConfig;
  activeBlock: BlockType | null;
  onLogout: () => void;
  onOpenAdmin: (tab?: string | null) => void;
  onGoHome: () => void;
  currentView: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentUser,
  uiConfig,
  activeBlock,
  onLogout,
  onOpenAdmin,
  onGoHome,
  currentView,
  onRefresh,
  isRefreshing
}) => {
  const isAdmin = currentUser.role === 'admin';
  const isNotHome = currentView !== 'home';

  const getModuleTitle = () => {
    if (currentView === 'admin') return "Painel Administrativo";
    if (currentView === 'tracking') {
      if (activeBlock === 'licitacao') return "Histórico de Processos";
      return `Histórico: ${activeBlock?.toUpperCase()}`;
    }
    if (currentView === 'vehicle-scheduling') return "Gestão de Veículos Municipais";

    switch (activeBlock) {
      case 'oficio': return "Módulo de Ofícios";
      case 'compras': return "Módulo de Compras";
      case 'licitacao': return "Módulo de Licitação";
      case 'diarias': return "Diárias e Custeio";
      default: return "Painel de Controle";
    }
  };

  return (
    <header className="sticky top-0 z-[60] w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0">
      <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">

        {/* Lado Esquerdo: Logo e Título */}
        <div className="flex items-center gap-6">
          <button
            onClick={onGoHome}
            className="flex items-center gap-3 hover:opacity-80 transition-all active:scale-95 group"
            title="Ir para o Início"
          >
            {uiConfig.headerLogoUrl ? (
              <img
                src={uiConfig.headerLogoUrl}
                alt="Logo"
                style={{ height: `${uiConfig.headerLogoHeight || 32}px` }}
                className="object-contain"
              />
            ) : (
              <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20 group-hover:bg-indigo-700 transition-colors">
                <FileText className="w-5 h-5 text-white" />
              </div>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Tela Atual</span>
            <span className="text-sm font-bold text-slate-900 tracking-tight">{getModuleTitle()}</span>
          </div>
        </div>

        {/* Lado Direito: Ações e Perfil */}
        <div className="flex items-center gap-2 md:gap-4">

          {isNotHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Início</span>
            </button>
          )}

          {isAdmin && currentView !== 'admin' && (
            <button
              onClick={() => onOpenAdmin(null)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-slate-900/10 active:scale-95"
            >
              <Settings className="w-4 h-4" />
              Administração
            </button>
          )}

          <div className="h-8 w-px bg-slate-200 mx-1"></div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Atualizar dados do sistema"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden xl:inline">Atualizar</span>
          </button>

          <div className="flex items-center gap-3 pl-2">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900 leading-none">{currentUser.name.split(' ')[0]}</span>
              <span className="text-[10px] font-medium text-slate-500 mt-0.5">{currentUser.jobTitle || 'Usuário'}</span>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-1 p-1 rounded-xl hover:bg-slate-100 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shadow-sm ${currentUser.role === 'admin' ? 'bg-indigo-600 text-white' :
                  (currentUser.role === 'compras' || currentUser.role === 'licitacao') ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                  {currentUser.name.charAt(0)}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                <div className="px-4 py-2 mb-2 border-b border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível: {currentUser.role}</p>
                </div>
                <button
                  onClick={() => onOpenAdmin('users')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  Meu Perfil
                </button>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
