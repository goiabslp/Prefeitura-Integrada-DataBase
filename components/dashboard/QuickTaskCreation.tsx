
import React, { useState, useEffect } from 'react';
import { X, Save, User as UserIcon, Lock, Globe, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { User, Order } from '../../types';
import { createTask } from '../../services/taskService';

interface QuickTaskCreationProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    currentUserName: string;
    users: User[];
    onTaskCreated: (newTask: Order) => void;
}

export const QuickTaskCreation: React.FC<QuickTaskCreationProps> = ({
    isOpen,
    onClose,
    currentUserId,
    currentUserName,
    users,
    onTaskCreated
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedUserId, setAssignedUserId] = useState(currentUserId);
    const [isPublic, setIsPublic] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when opened
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setAssignedUserId(currentUserId);
            setIsPublic(false);
        }
    }, [isOpen, currentUserId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            const newTask = await createTask({
                title,
                description,
                userId: currentUserId,
                userName: currentUserName,
                assigned_user_id: assignedUserId,
                is_public: isPublic,
                status: 'pending'
            });

            if (newTask) {
                onTaskCreated(newTask);
                onClose();
            }
        } catch (error) {
            console.error('Error creating task:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-100">

                {/* Header */}
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">Nova Tarefa</h2>
                            <p className="text-xs font-medium text-slate-500">Adicionar à lista de atividades</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título</label>
                        <input
                            autoFocus
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="O que precisa ser feito?"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700 placeholder:text-slate-400"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Detalhes (Opcional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Adicione mais contexto..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700 min-h-[100px] resize-none placeholder:text-slate-400"
                        />
                    </div>

                    {/* Meta Fields Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Assignee */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> Responsável
                            </label>
                            <select
                                value={assignedUserId}
                                onChange={(e) => setAssignedUserId(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-slate-700 appearance-none cursor-pointer"
                            >
                                <option value={currentUserId}>Mim ({currentUserName.split(' ')[0]})</option>
                                {users.filter(u => u.id !== currentUserId).map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Visibility */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                                {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />} Visibilidade
                            </label>
                            <div className="flex p-1 bg-slate-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setIsPublic(false)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!isPublic ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Privada
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPublic(true)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isPublic ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Pública
                                </button>
                            </div>
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title.trim()}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Criar Tarefa
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
