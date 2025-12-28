import React from 'react';
import { User } from '../types';
import { AdminMenu } from './forms/AdminMenu';

interface AdminDashboardProps {
  currentUser: User;
  onTabChange: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onTabChange
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Painel Administrativo</h1>
        <p className="text-slate-500 font-medium">Selecione um módulo para gerenciar.</p>
      </div>

      <AdminMenu currentUser={currentUser} onTabChange={onTabChange} />
    </div>
  );
};
