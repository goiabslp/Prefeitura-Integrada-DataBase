
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, UserRole, Signature, AppPermission, Job, Sector, Person } from '../types';
import {
  Plus, Search, Edit2, Trash2, ShieldCheck, Users, Save, X, Key,
  PenTool, LayoutGrid, User as UserIcon, CheckCircle2, Gavel, ShoppingCart, Briefcase, Network,
  Eye, EyeOff, RotateCcw, AlertTriangle, Clock, Lock, Copy, Check, Info, Trash, ToggleRight, ArrowLeft
} from 'lucide-react';

interface UserManagementScreenProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  availableSignatures: Signature[];
  jobs: Job[];
  sectors: Sector[];
  persons?: Person[];
  onBack?: () => void;
}

// Subcomponente para o contador regressivo em tempo real
const TempPasswordCountdown: React.FC<{ expiresAt: number }> = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTime = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft <= 0) {
    return <span className="text-rose-400 font-black animate-pulse">EXPIRADA</span>;
  }

  return (
    <span className="font-mono font-bold">
      Expira em: {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
};

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  availableSignatures,
  jobs,
  sectors,
  persons = [],
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estado para Diálogos Customizados (Substituindo Confirm/Alert)
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'info'
  });
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const isAdmin = currentUser.role === 'admin';

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '',
    tempPassword: '',
    tempPasswordExpiresAt: undefined,
    role: 'collaborator',
    sector: '',
    jobTitle: '',
    allowedSignatureIds: [],
    email: '',
    whatsapp: '',
    permissions: ['parent_criar_oficio']
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

  const finalUserList = isAdmin
    ? sortedUsers.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : sortedUsers.filter(u => u.id === currentUser.id);

  // Move current user to the top if they are in the list
  const filteredUsers = isAdmin
    ? [
      ...finalUserList.filter(u => u.id === currentUser.id),
      ...finalUserList.filter(u => u.id !== currentUser.id)
    ]
    : finalUserList;

  const handleOpenModal = (user?: User) => {
    setShowPassword(false);
    setCopied(false);
    if (user) {
      setEditingUser(user);
      // Garantindo que agendamento de veículo esteja sempre presente no carregamento
      const basePerms = user.permissions || [];
      const perms = basePerms;

      setFormData({
        ...user,
        allowedSignatureIds: user.allowedSignatureIds || [],
        permissions: perms
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        tempPassword: '',
        tempPasswordExpiresAt: undefined,
        role: 'collaborator',
        sector: '',
        jobTitle: '',
        allowedSignatureIds: [],
        email: '',
        whatsapp: '+55',
        permissions: ['parent_criar_oficio']
      });
    }
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    if (!isAdmin) return;

    let updatedPermissions = [...(formData.permissions || [])];

    if (newRole !== 'admin' && newRole !== 'compras') {
      updatedPermissions = updatedPermissions.filter(p => p !== 'parent_compras_pedidos');
    }



    setFormData({
      ...formData,
      role: newRole,
      permissions: updatedPermissions
    });
  };

  const toggleSignaturePermission = (sigId: string) => {
    if (!isAdmin) return;
    setFormData(prev => {
      const currentIds = prev.allowedSignatureIds || [];
      if (currentIds.includes(sigId)) {
        return { ...prev, allowedSignatureIds: currentIds.filter(id => id !== sigId) };
      } else {
        return { ...prev, allowedSignatureIds: [...currentIds, sigId] };
      }
    });
  };

  const toggleAppPermission = (perm: AppPermission) => {
    if (!isAdmin) return;
    setFormData(prev => {
      const currentPerms = prev.permissions || [];
      if (currentPerms.includes(perm)) {
        return { ...prev, permissions: currentPerms.filter(p => p !== perm) };
      } else {
        return { ...prev, permissions: [...currentPerms, perm] };
      }
    });
  };

  const handleResetPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editingUser || !isAdmin) return;

    if (editingUser.id === currentUser.id) {
      showToast("Para alterar sua própria senha, utilize o campo 'Segurança de Acesso'.", 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Resetar Senha",
      message: `Deseja gerar uma senha temporária de 3 minutos para "${editingUser.name}"?`,
      type: 'warning',
      onConfirm: () => {
        const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let newPass = "";
        for (let i = 0; i < 8; i++) {
          newPass += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        const expiry = Date.now() + (3 * 60 * 1000); // 3 minutos

        const updatedUser = {
          ...editingUser,
          tempPassword: newPass,
          tempPasswordExpiresAt: expiry
        } as User;

        onUpdateUser(updatedUser);
        setFormData(prev => ({ ...prev, tempPassword: newPass, tempPasswordExpiresAt: expiry }));
        setCopied(false);
        setConfirmModal({ ...confirmModal, isOpen: false });
        showToast("Senha temporária gerada!");
      }
    });
  };

  const copyToClipboard = () => {
    if (formData.tempPassword) {
      navigator.clipboard.writeText(formData.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.username) {
      showToast("Por favor, preencha nome e usuário.", 'error');
      return;
    }

    if (!editingUser && !formData.password) {
      showToast("Senha é obrigatória para novos usuários.", 'error');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      showToast("A senha deve ter no mínimo 6 caracteres.", 'error');
      return;
    }

    // Check for duplicate username
    const usernameExists = users.some(u =>
      u.username.toLowerCase() === formData.username?.toLowerCase() &&
      (!editingUser || u.id !== editingUser.id)
    );

    if (usernameExists) {
      showToast("Este nome de usuário já está em uso.", 'error');
      return;
    }

    // Injetando agendamento caso tenha sido removido por algum erro
    const perms = formData.permissions || [];

    const userData = {
      ...formData,
      permissions: perms,
      id: editingUser ? editingUser.id : Date.now().toString(),
    } as User;

    if (editingUser) {
      onUpdateUser(userData);
      showToast("Usuário atualizado com sucesso!");
    } else {
      onAddUser(userData);
      showToast("Novo usuário cadastrado!");
    }
    setIsModalOpen(false);
  };

  const isEditingSelf = editingUser?.id === currentUser.id;
  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed";
  const selectClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1";

  const permissionsList: { id: AppPermission, label: string }[] = [
    { id: 'parent_criar_oficio', label: 'Módulo: Ofícios' },
    { id: 'parent_compras', label: 'Módulo: Compras' },
    { id: 'parent_licitacao', label: 'Módulo: Licitação' },
    { id: 'parent_diarias', label: 'Módulo: Diárias e Custeio' },
    { id: 'parent_agendamento_veiculo', label: 'Agendamento de Veículos' },
    { id: 'parent_frotas', label: 'Gestão de Frotas' },
    { id: 'parent_abastecimento', label: 'Gestão de Abastecimento' }, // New Item
    { id: 'parent_admin', label: 'Administrativo' },
    { id: 'parent_licitacao_triagem', label: 'Licitação: Triagem' },
    { id: 'parent_licitacao_processos', label: 'Licitação: Processos' },
    { id: 'parent_compras_pedidos', label: 'Gestão de Pedidos (Compras)' }
  ];

  return (
    <div className="flex-1 h-full bg-slate-100 p-6 overflow-auto custom-scrollbar">
      <div className="w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
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
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{isAdmin ? 'Gestão de Usuários' : 'Meu Perfil'}</h2>
            </div>
            <p className="text-slate-500 mt-1">{isAdmin ? 'Configuração de acessos e permissões da equipe.' : 'Gerencie seus dados pessoais de acesso ao sistema.'}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Novo Usuário
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar usuário..."
              className="flex-1 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <div className="grid gap-4">
          {filteredUsers.map(user => {
            const isCurrentUser = user.id === currentUser.id;
            return (
              <div
                key={user.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 
                  ${isCurrentUser
                    ? 'bg-indigo-50/50 border-indigo-200 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${user.role === 'admin' ? 'bg-indigo-600 text-white' :
                    (user.role === 'licitacao' || user.role === 'compras') ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 mt-0.5">

                      <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100/80 rounded text-xs font-semibold text-slate-600">
                        {user.jobTitle || 'Usuário'}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                        user.role === 'licitacao' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'compras' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                    {isAdmin && user.username !== 'admin' && user.id !== currentUser.id && (
                      <button
                        onClick={() => setConfirmModal({
                          isOpen: true,
                          title: "Excluir Usuário",
                          message: `Deseja realmente remover o acesso de "${user.name}"? Esta ação é irreversível.`,
                          type: 'danger',
                          onConfirm: () => {
                            onDeleteUser(user.id);
                            showToast("Usuário removido.");
                            setConfirmModal({ ...confirmModal, isOpen: false });
                          }
                        })}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL DE EDIÇÃO/CADASTRO */}
        {isModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">{isAdmin ? (editingUser ? 'Editar Usuário' : 'Novo Usuário') : 'Meu Perfil'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <label className={labelClass}>Tipo de Perfil</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { id: 'admin', label: 'Admin', desc: 'Acesso total.', icon: <ShieldCheck className="w-5 h-5" />, color: 'indigo' },
                      { id: 'licitacao', label: 'Licitação', desc: 'Módulos sem Admin.', icon: <Gavel className="w-5 h-5" />, color: 'blue' },
                      { id: 'compras', label: 'Compras', desc: 'Módulos + Visão.', icon: <ShoppingCart className="w-5 h-5" />, color: 'emerald' },
                      { id: 'collaborator', label: 'Colaborador', desc: 'Operação básica.', icon: <UserIcon className="w-5 h-5" />, color: 'slate' }
                    ].map((role) => {
                      const isSelected = formData.role === role.id;
                      const canEditRole = isAdmin;

                      return (
                        <button
                          key={role.id}
                          type="button"
                          disabled={!canEditRole}
                          onClick={() => handleRoleChange(role.id as UserRole)}
                          className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group ${isSelected
                            ? `bg-${role.color}-50 border-${role.color}-600 ring-4 ring-${role.color}-600/10`
                            : `bg-white border-slate-100 hover:border-slate-300 ${!canEditRole ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className={`p-2 rounded-xl transition-colors ${isSelected ? `bg-${role.color}-600 text-white` : `bg-slate-100 text-slate-400 group-hover:bg-emerald-100`
                              }`}>
                              {role.icon}
                            </div>
                            {isSelected && <CheckCircle2 className={`w-4 h-4 text-${role.color}-600 animate-fade-in`} />}
                          </div>
                          <div className="mt-3">
                            <h4 className={`font-bold text-sm ${isSelected ? `text-${role.color}-900` : 'text-slate-800'}`}>{role.label}</h4>
                            <p className="text-[10px] mt-0.5 leading-tight text-slate-500">{role.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Nome Completo</label>
                    {persons && persons.length > 0 ? (
                      <div className="relative group">
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setFormData(prev => ({ ...prev, name: newVal }));

                              // Auto-fill if exact match found
                              const match = persons.find(p => p.name.toLowerCase() === newVal.toLowerCase());
                              if (match) {
                                // Lookup names from IDs
                                const foundSector = match.sectorId ? sectors.find(s => s.id === match.sectorId)?.name : undefined;
                                const foundJob = match.jobId ? jobs.find(j => j.id === match.jobId)?.name : undefined;

                                setFormData(prev => ({
                                  ...prev,
                                  sector: foundSector || prev.sector,
                                  jobTitle: foundJob || prev.jobTitle
                                }));
                              }
                            }}
                            className={`${inputClass} pr-10 cursor-pointer`}
                            placeholder="Comece a digitar para buscar..."
                            // list="persons-list" // Removed to prevent native dropdown conflict
                            disabled={!isAdmin && !isEditingSelf}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Search className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Hidden native datalist REMOVED to solve "black select" issue */}
                        {/* Custom Dropdown Suggestion */}
                        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto hidden group-focus-within:block z-50 custom-scrollbar animate-slide-up">
                          {persons.filter(p => p.name.toLowerCase().includes((formData.name || '').toLowerCase()) && p.name !== formData.name).length > 0 ? (
                            persons.filter(p => p.name.toLowerCase().includes((formData.name || '').toLowerCase()) && p.name !== formData.name).map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  const foundSector = p.sectorId ? sectors.find(s => s.id === p.sectorId)?.name : undefined;
                                  const foundJob = p.jobId ? jobs.find(j => j.id === p.jobId)?.name : undefined;
                                  setFormData(prev => ({
                                    ...prev,
                                    name: p.name,
                                    sector: foundSector || prev.sector,
                                    jobTitle: foundJob || prev.jobTitle
                                  }));
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-slate-700 text-sm font-medium border-b border-slate-50 last:border-0 flex items-center justify-between group/item transition-colors"
                              >
                                <span className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                    {p.name.charAt(0)}
                                  </div>
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider opacity-0 group-hover/item:opacity-100 transition-opacity">Selecionar</span>
                              </button>
                            ))
                          ) : (
                            formData.name && persons.every(p => p.name !== formData.name) && (
                              <div className="p-4 text-center text-slate-400 text-sm italic">
                                Nenhuma pessoa encontrada.
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Ex: Nome do Colaborador" />
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Usuário de Acesso</label>
                    <input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className={inputClass} disabled={!isAdmin} placeholder="ex: nome.sobrenome" />
                  </div>

                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={inputClass}
                      placeholder="ex: usuario@exemplo.com"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>WhatsApp</label>
                    <input
                      type="text"
                      value={formData.whatsapp || ''}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        // Mask: +00 00 0 0000-0000 (13 digits)
                        // +CC DD D NNNN-NNNN (e.g. +55 31 9 8888-8888)

                        if (val.length > 13) val = val.slice(0, 13);

                        let formatted = '';
                        if (val.length > 0) formatted += '+' + val.slice(0, 2); // CC
                        if (val.length > 2) formatted += ' ' + val.slice(2, 4); // DDD
                        if (val.length > 4) formatted += ' ' + val.slice(4, 5); // 9
                        if (val.length > 5) formatted += ' ' + val.slice(5, 9); // First 4
                        if (val.length > 9) formatted += '-' + val.slice(9, 13); // Last 4

                        setFormData({ ...formData, whatsapp: formatted });
                      }}
                      className={inputClass}
                      placeholder="+55 00 0 0000-0000"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Segurança de Acesso</label>
                    {isEditingSelf || !editingUser ? (
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className={inputClass}
                          placeholder="Digite a senha"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 flex items-center gap-3 text-slate-400 italic text-xs">
                          <Lock className="w-4 h-4" /> Senha protegida (visível apenas ao usuário)
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={handleResetPassword}
                            className="w-full py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]"
                          >
                            <RotateCcw className="w-4 h-4" /> Resetar para Senha Temporária
                          </button>
                        )}

                        {formData.tempPassword && formData.tempPasswordExpiresAt && (
                          <div className="p-5 bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl text-white shadow-xl animate-slide-up border border-white/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                              <Key className="w-16 h-16" />
                            </div>

                            <div className="relative z-10 flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-200" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Nova Senha Gerada</span>
                                </div>
                                <button
                                  onClick={copyToClipboard}
                                  className="flex items-center gap-1.5 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-[9px] font-bold uppercase tracking-wider"
                                >
                                  {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                                  {copied ? 'Copiado!' : 'Copiar'}
                                </button>
                              </div>

                              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                                <span className="font-mono text-2xl font-black tracking-[0.2em]">{formData.tempPassword}</span>
                              </div>

                              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                <div className="flex items-center gap-2 text-amber-100">
                                  <Clock className="w-4 h-4" />
                                  <TempPasswordCountdown expiresAt={formData.tempPasswordExpiresAt} />
                                </div>
                                <span className="text-[9px] font-medium text-amber-200/60 italic">Troca obrigatória no login</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className={labelClass}>Cargo / Função</label>
                    <div className="relative group">
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                          className={`${inputClass} pr-10 cursor-pointer`}
                          placeholder="Selecione ou digite um cargo"
                          disabled={!isAdmin}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Briefcase className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Custom Dropdown for Jobs */}
                      <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto hidden group-focus-within:block z-50 custom-scrollbar animate-slide-up">
                        {jobs.filter(j => j.name.toLowerCase().includes((formData.jobTitle || '').toLowerCase()) && j.name !== formData.jobTitle).length > 0 ? (
                          jobs.filter(j => j.name.toLowerCase().includes((formData.jobTitle || '').toLowerCase()) && j.name !== formData.jobTitle)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(j => (
                              <button
                                key={j.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent blur
                                  setFormData(prev => ({ ...prev, jobTitle: j.name }));
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-slate-700 text-sm font-medium border-b border-slate-50 last:border-0 flex items-center justify-between group/item transition-colors"
                              >
                                <span className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                    <Briefcase className="w-3 h-3" />
                                  </div>
                                  {j.name}
                                </span>
                                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider opacity-0 group-hover/item:opacity-100 transition-opacity">Selecionar</span>
                              </button>
                            ))
                        ) : (
                          formData.jobTitle && jobs.every(j => j.name !== formData.jobTitle) && (
                            <div className="p-4 text-center text-slate-400 text-sm italic">
                              Nenhum cargo encontrado.
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Setor</label>
                    <div className="relative group">
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.sector}
                          onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                          className={`${inputClass} pr-10 cursor-pointer`}
                          placeholder="Selecione ou digite um setor"
                          disabled={!isAdmin}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Network className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Custom Dropdown for Sectors */}
                      <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto hidden group-focus-within:block z-50 custom-scrollbar animate-slide-up">
                        {sectors.filter(s => s.name.toLowerCase().includes((formData.sector || '').toLowerCase()) && s.name !== formData.sector).length > 0 ? (
                          sectors.filter(s => s.name.toLowerCase().includes((formData.sector || '').toLowerCase()) && s.name !== formData.sector)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(s => (
                              <button
                                key={s.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent blur
                                  setFormData(prev => ({ ...prev, sector: s.name }));
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-slate-700 text-sm font-medium border-b border-slate-50 last:border-0 flex items-center justify-between group/item transition-colors"
                              >
                                <span className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                                    <Network className="w-3 h-3" />
                                  </div>
                                  {s.name}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider opacity-0 group-hover/item:opacity-100 transition-opacity">Selecionar</span>
                              </button>
                            ))
                        ) : (
                          formData.sector && sectors.every(s => s.name !== formData.sector) && (
                            <div className="p-4 text-center text-slate-400 text-sm italic">
                              Nenhum setor encontrado.
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <label className={`${labelClass} mb-4 flex items-center gap-2 text-indigo-600`}><LayoutGrid className="w-4 h-4" /> Módulos Autorizados</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {permissionsList.map(perm => {
                      const isChecked = formData.permissions?.includes(perm.id);
                      const isPurchaseManagement = perm.id === 'parent_compras_pedidos';
                      const isAllowedForRole = isAdmin && (!isPurchaseManagement || (formData.role === 'admin' || formData.role === 'compras'));

                      return (
                        <label
                          key={perm.id}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all 
                                    ${!isAllowedForRole ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}
                                    ${isChecked ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}
                                  `}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!isAllowedForRole}
                            onChange={() => toggleAppPermission(perm.id)}
                            className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500"
                          />
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${isChecked ? 'text-indigo-900' : 'text-slate-700'}`}>{perm.label}</span>
                          </div>
                          {isChecked && <CheckCircle2 className="w-4 h-4 text-indigo-500 ml-auto" />}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <label className={`${labelClass} mb-4 flex items-center gap-2 text-indigo-600`}><PenTool className="w-4 h-4" /> Assinaturas Permitidas</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableSignatures.map(sig => {
                      const isChecked = formData.allowedSignatureIds?.includes(sig.id);
                      return (
                        <label key={sig.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${!isAdmin ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'cursor-pointer'} ${isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                          <input type="checkbox" checked={isChecked} disabled={!isAdmin} onChange={() => toggleSignaturePermission(sig.id)} className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                          <div>
                            <div className="font-bold text-xs text-slate-800">{sig.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-medium">{sig.role}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 shadow-xl flex items-center gap-2 transition-all"><Save className="w-5 h-5" /> {isAdmin ? 'Salvar Usuário' : 'Salvar Alterações'}</button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL DE CONFIRMAÇÃO PERSONALIZADO */}
        {confirmModal.isOpen && createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-white/20">
              <div className="p-8 text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${confirmModal.type === 'danger' ? 'bg-rose-50 text-rose-600 shadow-rose-500/10' :
                  confirmModal.type === 'warning' ? 'bg-amber-50 text-amber-600 shadow-amber-500/10' :
                    'bg-indigo-50 text-indigo-600 shadow-indigo-500/10'
                  }`}>
                  {confirmModal.type === 'danger' ? <Trash className="w-10 h-10" /> :
                    confirmModal.type === 'warning' ? <AlertTriangle className="w-10 h-10" /> :
                      <Info className="w-10 h-10" />}
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">{confirmModal.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">{confirmModal.message}</p>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                <button
                  onClick={confirmModal.onConfirm}
                  // Fix: Added missing quotes around the default branch of the ternary operator for button styles
                  className={`w-full py-4 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-[0.98] ${confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' :
                    confirmModal.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' :
                      'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    }`}
                >
                  Confirmar Ação
                </button>
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="w-full py-4 bg-white text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all"
                >
                  Voltar / Cancelar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* TOAST NOTIFICATION */}
        {toast.show && createPortal(
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-slide-up ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'
            }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};
