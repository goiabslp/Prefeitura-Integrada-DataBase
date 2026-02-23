import React, { useState } from 'react';
import { User, Sector, Projeto } from '../../types';
import { createProjeto } from '../../services/projetosService';
import { ArrowLeft, Send, Paperclip, AlertCircle, Calendar } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface ProjetoFormProps {
    userId: string;
    users: User[];
    sectors: Sector[];
    onSave: () => void;
    onCancel: () => void;
}

export const ProjetoForm: React.FC<ProjetoFormProps> = ({
    userId,
    users,
    sectors,
    onSave,
    onCancel
}) => {
    const { addNotification } = useNotification();
    const [isSaving, setIsSaving] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [responsibleId, setResponsibleId] = useState('');
    const [initialMessage, setInitialMessage] = useState('');

    const adminUser = users.find(u => u.role === 'admin');

    const handleSave = async () => {
        if (!name.trim()) {
            addNotification('O nome do projeto é obrigatório.', 'error');
            return;
        }

        if (!responsibleId) {
            addNotification('O responsável do projeto é obrigatório.', 'error');
            return;
        }

        if (!adminUser) {
            addNotification('Nenhum administrador encontrado no sistema para receber o projeto.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            // "O projeto obrigatoriamente passa primeiro pelo usuário administrador"
            // So we set the current_owner_id to the admin.
            const newProjetoData: Omit<Projeto, 'id' | 'created_at' | 'updated_at'> = {
                name: name.trim(),
                description: description.trim(),
                responsible_id: responsibleId,
                status: 'Aguardando Admin',
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                current_owner_id: adminUser.id,
                current_sector_id: adminUser.sectorId || undefined,
                created_by: userId
            };

            await createProjeto(newProjetoData, initialMessage);

            addNotification('Projeto criado e encaminhado ao Administrador com sucesso!', 'success');
            onSave();
        } catch (error) {
            console.error(error);
            addNotification('Erro ao criar o projeto. Tente novamente.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto animate-fade-in space-y-8 pb-32">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b-4 border-fuchsia-500 pb-1 inline-block">Novo Projeto</h1>
                    <p className="text-slate-500 mt-2 font-medium">Preencha os detalhes para iniciar um novo projeto.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">

                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                        <strong className="block mb-1">Atenção ao Fluxo do Projeto</strong>
                        <p>Ao criar este projeto, ele será <b>automaticamente encaminhado para o Administrador</b> para a primeira avaliação, conforme as regras do sistema.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Nome do Projeto *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Reforma da Praça Central"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Descrição (Opcional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalhes sobre os objetivos e escopo deste projeto..."
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all min-h-[120px] resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Responsável *</label>
                        <select
                            value={responsibleId}
                            onChange={(e) => setResponsibleId(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all appearance-none font-medium"
                        >
                            <option value="">Selecione um responsável...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.jobTitle || 'Sem cargo'})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Status Inicial</label>
                        <div className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-medium cursor-not-allowed flex items-center justify-between">
                            Aguardando Admin
                            <AlertCircle className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Data de Início (Prevista)</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all font-medium"
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Data de Término (Prevista)</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all font-medium"
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Primeira Mensagem para o Histórico</h3>
                    <p className="text-sm text-slate-500">Adicione uma mensagem ou observação inicial que será registrada no histórico corporativo do projeto.</p>

                    <textarea
                        value={initialMessage}
                        onChange={(e) => setInitialMessage(e.target.value)}
                        placeholder="Mensagem para o administrador avaliar o início do projeto..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all min-h-[100px] resize-none"
                    />

                    {/* Placeholder for attachments - complex implementation skipped for simplicity of this artifact, will be added in ProjetoDetails */}
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Paperclip className="w-4 h-4" />
                        <span>Anexos podem ser adicionados após a criação do projeto, diretamente na tela de detalhes.</span>
                    </div>
                </div>

            </div>

            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4 flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={onCancel}
                    className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    disabled={isSaving}
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>Criando...</>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Criar Projeto
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
