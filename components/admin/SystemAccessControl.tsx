import React, { useState } from 'react';
import { Shield, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Search } from 'lucide-react';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';
import { GlobalLoading } from '../common/GlobalLoading';

export const SystemAccessControl: React.FC = () => {
    const { settings, toggleModule, isLoading } = useSystemSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [processingKey, setProcessingKey] = useState<string | null>(null);

    const filteredSettings = settings.filter(s =>
        s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.module_key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggle = async (key: string, currentValue: boolean) => {
        setProcessingKey(key);
        await toggleModule(key, !currentValue);
        setProcessingKey(null);
    };

    if (isLoading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <GlobalLoading type="inline" message="Carregando configurações..." />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Shield className="w-32 h-32 text-red-600" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Controle de Acesso Global</h2>
                            <p className="text-slate-500 font-medium">Ativar ou desativar módulos para toda a organização</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-amber-800 font-bold text-sm uppercase tracking-wide mb-1">Atenção Crítica</h3>
                    <p className="text-amber-700 text-sm">
                        Desativar um módulo bloqueará o acesso <strong>imediatamente</strong> para TODOS os usuários (incluindo administradores).
                        Os menus serão ocultados e as APIs protegidas.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar módulo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none text-slate-700 font-medium"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSettings.map((setting) => (
                    <div
                        key={setting.id}
                        className={`p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group ${setting.is_enabled
                            ? 'bg-white border-slate-100 hover:border-slate-200'
                            : 'bg-slate-50 border-slate-200 opacity-90'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${setting.is_enabled
                                ? 'bg-green-100 text-green-600'
                                : 'bg-slate-200 text-slate-500'
                                }`}>
                                {setting.is_enabled ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${setting.is_enabled ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {setting.label}
                                </h3>
                                <p className="text-xs text-slate-400 font-mono tracking-wide">{setting.module_key}</p>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={setting.is_enabled}
                                onChange={() => handleToggle(setting.module_key, setting.is_enabled)}
                                disabled={processingKey === setting.module_key}
                            />
                            <div className={`w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${setting.is_enabled ? 'peer-checked:bg-green-500' : 'peer-checked:bg-slate-400'
                                }`}></div>
                        </label>
                    </div>
                ))}
            </div>

            {/* Processing Overlay */}
            <GlobalLoading
                type="overlay"
                isOpen={!!processingKey}
                message="Atualizando permissões..."
                description="Aplicando bloqueio global"
            />
        </div>
    );
};
