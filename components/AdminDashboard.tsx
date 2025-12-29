import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { AdminMenu } from './forms/AdminMenu';

interface AdminDashboardProps {
  currentUser: User;
  onTabChange: (tab: string) => void;
  onBack?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onTabChange,
  onBack
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-all"
              title="Voltar"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Painel Administrativo</h1>
        </div>
        <p className="text-slate-500 font-medium">Selecione um módulo para gerenciar.</p>
      </div>

      <AdminMenu currentUser={currentUser} onTabChange={onTabChange} />
    </div>
  );
};
