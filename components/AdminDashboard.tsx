
import React from 'react';
import { 
  FilePlus, Users, Settings, History, 
  TrendingUp, FileText, CheckCircle, Clock,
  ChevronRight, ArrowUpRight, ShieldCheck, PenTool
} from 'lucide-react';
import { UserRole } from '../types';

interface AdminDashboardProps {
  userName: string;
  onNewOrder: () => void;
  onManageUsers: () => void;
  onSettings: () => void;
  onHistory: () => void;
  onSignatures: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userName,
  onNewOrder,
  onManageUsers,
  onSettings,
  onHistory,
  onSignatures
}) => {
  const stats = [
    { label: 'PDFs Gerados', value: '0', icon: <FileText className="w-5 h-5" />, color: 'bg-blue-500' },
    { label: 'Usuários Ativos', value: '3', icon: <Users className="w-5 h-5" />, color: 'bg-indigo-500' },
    { label: 'Pendentes', value: '0', icon: <Clock className="w-5 h-5" />, color: 'bg-amber-500' },
    { label: 'Taxa de Sucesso', value: '-', icon: <CheckCircle className="w-5 h-5" />, color: 'bg-emerald-500' },
  ];

  const quickActions = [
    { 
      title: 'Gerar Novo PDF', 
      desc: 'Criar documento com IA', 
      icon: <FilePlus className="w-6 h-6" />, 
      onClick: onNewOrder,
      color: 'from-indigo-600 to-blue-600'
    },
    { 
      title: 'Gestão de Equipe', 
      desc: 'Usuários e permissões', 
      icon: <Users className="w-6 h-6" />, 
      onClick: onManageUsers,
      color: 'from-emerald-600 to-teal-600'
    },
    { 
      title: 'Assinaturas', 
      desc: 'Configurar responsáveis', 
      icon: <PenTool className="w-6 h-6" />, 
      onClick: onSignatures,
      color: 'from-purple-600 to-pink-600'
    },
    { 
      title: 'Identidade Visual', 
      desc: 'Logos e cores globais', 
      icon: <Settings className="w-6 h-6" />, 
      onClick: onSettings,
      color: 'from-slate-700 to-slate-900'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Olá, <span className="text-indigo-600">{userName.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 font-medium">Bem-vindo ao centro de comando da BrandDoc Pro.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Acesso Total Admin</span>
          </div>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className={`p-3 rounded-xl text-white ${stat.color} shadow-lg shadow-current/20`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br ${action.color} text-white shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl text-left h-48 flex flex-col justify-between`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <action.icon.type {...action.icon.props} className="w-24 h-24" />
            </div>
            
            <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-2xl flex items-center justify-center border border-white/20">
              {action.icon}
            </div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-bold leading-tight">{action.title}</h3>
              <p className="text-white/70 text-sm font-medium mt-1">{action.desc}</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1 rounded-full group-hover:bg-white/20 transition-colors">
                Abrir Módulo <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Activity Table Preview */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Documentos Recentes
          </h3>
          <button onClick={onHistory} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
            Ver Todo Histórico <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                  Nenhum documento gerado recentemente.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
