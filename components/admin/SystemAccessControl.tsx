import React, { useState, useMemo } from 'react';
import { Shield, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Search, Lock, ArrowLeft, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';
import { GlobalLoading } from '../common/GlobalLoading';

interface SystemAccessControlProps {
    onBack?: () => void;
}

export const SystemAccessControl: React.FC<SystemAccessControlProps> = ({ onBack }) => {
    const { settings = [], toggleModule, isLoading } = useSystemSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [processingKey, setProcessingKey] = useState<string | null>(null);

    // Grouping logic memoized for performance and safety
    const parentModules = useMemo(() => {
        return settings.filter(s => !s.parent_key);
    }, [settings]);

    const handleToggle = async (key: string, currentValue: boolean) => {
        setProcessingKey(key);
        try {
            await toggleModule(key, !currentValue);
        } finally {
            setProcessingKey(null);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm z-50">
                <GlobalLoading type="inline" message="Sincronizando permissões globais..." />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#FCFCFE] w-full overflow-hidden">
            {/* Header: Fixed, Modern, Compact */}
            <header className="shrink-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex items-center justify-between z-30 shadow-sm">
                <div className="flex items-center gap-6">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2.5 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-all active:scale-90 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">Controle de Acesso</h1>
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest">Global</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Gestão de Disponibilidade de Módulos</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-1 max-w-xl mx-8">
                    <div className="relative w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-red-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar módulo ou funcionalidade..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-100/50 pl-11 pr-4 py-2.5 rounded-2xl border border-transparent focus:bg-white focus:border-red-500/30 focus:ring-4 focus:ring-red-500/5 transition-all outline-none text-sm font-bold placeholder:text-slate-400 shadow-inner"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex flex-col items-end leading-none mr-2">
                        <span className="text-[10px] font-black text-slate-900">{settings.length} Itens</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Sincronizados</span>
                    </div>
                    <button className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Content Area: Full Width, Responsive Grid */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
                <div className="w-full max-w-[1920px] mx-auto">

                    {/* Compact Dashboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {parentModules.length > 0 ? (
                            parentModules.map((parent) => {
                                const children = settings.filter(s => s.parent_key === parent.module_key);
                                const isVisible = parent.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    parent.module_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    children.some(c => c.label.toLowerCase().includes(searchTerm.toLowerCase()));

                                if (!isVisible) return null;

                                return (
                                    <div
                                        key={parent.id}
                                        className={`group rounded-[2rem] border transition-all duration-300 flex flex-col bg-white overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 ${parent.is_enabled ? 'border-slate-100' : 'border-red-100 bg-red-50/5 opacity-90'
                                            }`}
                                    >
                                        {/* Module Header Container */}
                                        <div className="p-5 flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${parent.is_enabled ? 'bg-slate-100 text-slate-900 group-hover:bg-red-600 group-hover:text-white' : 'bg-red-50 text-red-500'
                                                    }`}>
                                                    <Shield className="w-6 h-6" />
                                                </div>

                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={parent.is_enabled}
                                                        onChange={() => handleToggle(parent.module_key, parent.is_enabled)}
                                                        disabled={processingKey === parent.module_key}
                                                    />
                                                    <div className={`w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${parent.is_enabled ? 'peer-checked:bg-green-500' : 'peer-checked:bg-slate-400'
                                                        }`}></div>
                                                </label>
                                            </div>

                                            <div>
                                                <h3 className={`font-black text-lg tracking-tight leading-none ${parent.is_enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                                                    {parent.label}
                                                </h3>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1 block">
                                                    {parent.module_key}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Children Actions: Vertical, Compact List */}
                                        {children.length > 0 && (
                                            <div className="mt-auto border-t border-slate-50 bg-slate-50/30 p-3 space-y-1.5">
                                                {children.map((child) => (
                                                    <div
                                                        key={child.id}
                                                        className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${child.is_enabled && parent.is_enabled ? 'bg-white border border-slate-100' : 'bg-transparent border border-transparent opacity-60'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${child.is_enabled && parent.is_enabled ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                            <span className={`text-[11px] font-bold tracking-tight ${child.is_enabled && parent.is_enabled ? 'text-slate-700' : 'text-slate-400'}`}>
                                                                {child.label}
                                                            </span>
                                                        </div>

                                                        <button
                                                            disabled={processingKey === child.module_key || !parent.is_enabled}
                                                            onClick={() => handleToggle(child.module_key, child.is_enabled)}
                                                            className={`p-1.5 rounded-lg transition-all ${!parent.is_enabled
                                                                    ? 'text-slate-200 pointer-events-none'
                                                                    : child.is_enabled
                                                                        ? 'text-green-600 bg-green-50 hover:bg-green-600 hover:text-white'
                                                                        : 'text-slate-400 bg-white border border-slate-100 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            {child.is_enabled ? <CheckCircle2 className="w-3 link:h-3" /> : <XCircle className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[4rem] border border-dashed border-slate-200">
                                <Shield className="w-20 h-20 mb-6 opacity-5" />
                                <h3 className="font-black text-xl text-slate-800">Nenhum módulo encontrado</h3>
                                <p className="text-sm font-medium mt-1">Verifique sua conexão ou as configurações do banco de dados.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Sticky Warning Footer */}
            <footer className="shrink-0 bg-red-600 text-white px-6 py-2.5 flex items-center justify-center gap-3 animate-slide-up z-30">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Ambiente de Configuração Crítica • Alterações Ativas</span>
            </footer>

            {/* Processing Overlay */}
            <GlobalLoading
                type="overlay"
                isOpen={!!processingKey}
                message="Sincronizando..."
                description="Atualizando chaves globais de acesso"
            />
        </div>
    );
};
