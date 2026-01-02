import React from 'react';
import { FilePlus, Package, History, FileText, ArrowRight, ArrowLeft, ShoppingCart, Gavel, Wallet, Inbox, CalendarRange, FileSearch } from 'lucide-react';
import { UserRole, UIConfig, AppPermission, BlockType } from '../types';
import { FleetShortcutCard } from './FleetShortcutCard';

interface HomeScreenProps {
    onNewOrder: (block?: BlockType) => void;
    onTrackOrder: () => void;
    onManagePurchaseOrders?: () => void;
    onManageLicitacaoScreening?: () => void;
    onViewAllLicitacao?: () => void;
    onVehicleScheduling?: () => void;
    onLogout: () => void;
    onOpenAdmin: (tab?: string | null) => void;
    userRole: UserRole;
    userName: string;
    userJobTitle?: string;
    uiConfig?: UIConfig;
    permissions: AppPermission[];
    activeBlock: BlockType | null;
    setActiveBlock: (block: BlockType | null) => void;
    stats: {
        totalGenerated: number;
        historyCount: number;
        activeUsers: number;
    };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
    onNewOrder,
    onTrackOrder,
    onManagePurchaseOrders,
    onVehicleScheduling,
    onOpenAdmin,
    userRole,
    userName,
    permissions = [],
    activeBlock,
    setActiveBlock,
    stats,
    onManageLicitacaoScreening,
    onViewAllLicitacao
}) => {
    const canAccessOficio = permissions.includes('parent_criar_oficio');
    const canAccessCompras = permissions.includes('parent_compras');
    const canAccessLicitacao = permissions.includes('parent_licitacao');
    const canAccessDiarias = permissions.includes('parent_diarias');
    const canManagePurchaseOrders = permissions.includes('parent_compras_pedidos');
    const canAccessScheduling = permissions.includes('parent_agendamento_veiculo');
    const canAccessFleet = permissions.includes('parent_frotas');
    const canAccessLicitacaoTriagem = permissions.includes('parent_licitacao_triagem');
    const canAccessLicitacaoProcessos = permissions.includes('parent_licitacao_processos');

    const hasAnyPermission = canAccessOficio || canAccessCompras || canAccessLicitacao || canAccessDiarias || canAccessScheduling || canAccessFleet;

    const visibleModulesCount = [
        canAccessOficio,
        canAccessCompras,
        canAccessLicitacao,
        canAccessDiarias,
        canAccessScheduling,
        canAccessFleet
    ].filter(Boolean).length;

    const getContainerClass = () => {
        return 'flex flex-row flex-wrap items-center justify-center gap-3 md:gap-4 lg:gap-6 w-full max-w-full px-4 overflow-hidden';
    };

    const getCardClass = (color: string) => {
        const base = "group relative rounded-[2.5rem] border transition-all duration-500 text-center flex flex-col items-center justify-center overflow-hidden bg-white border-slate-200 hover:scale-[1.05] shrink-0";
        const hoverShadow = `hover:border-${color}-400`;

        // More aggressive dynamic sizing to ensure single-row display
        let sizeClass = "w-32 md:w-48 lg:w-56 h-44 md:h-64 lg:h-72 p-4 md:p-6";

        if (visibleModulesCount === 1) sizeClass = "w-64 md:w-80 h-80 md:h-[400px] p-10 scale-110";
        else if (visibleModulesCount === 2) sizeClass = "w-48 md:w-64 lg:w-72 h-64 md:h-80 lg:h-96 p-8";
        else if (visibleModulesCount === 3) sizeClass = "w-40 md:w-56 lg:w-64 h-56 md:h-72 lg:h-80 p-6";
        else if (visibleModulesCount >= 6) sizeClass = "w-28 md:w-40 lg:w-44 h-40 md:h-56 lg:h-60 p-2 md:p-4";

        return `${base} ${hoverShadow} ${sizeClass}`;
    };

    const firstName = userName.split(' ')[0];

    const getBlockName = () => {
        switch (activeBlock) {
            case 'oficio': return "Módulo de Ofícios";
            case 'compras': return "Módulo de Compras";
            case 'licitacao': return "Módulo de Licitação";
            case 'diarias': return "Diárias e Custeio";
            case 'agendamento': return "Agendamento de Veículos";
            default: return "";
        }
    };

    const getNewActionLabel = () => {
        switch (activeBlock) {
            case 'compras': return 'Novo Pedido';
            case 'oficio': return 'Novo Ofício';
            case 'diarias': return 'Nova Solicitação';
            case 'licitacao': return 'Novo Processo';
            case 'agendamento': return 'Novo Agendamento';
            default: return 'Novo Documento';
        }
    };

    return (
        <div className="flex-1 bg-slate-50 font-sans flex flex-col overflow-hidden h-screen max-h-screen">
            <main className={`flex-1 flex flex-col items-center px-6 bg-gradient-to-b from-white to-slate-50 relative ${activeBlock ? 'pt-8 overflow-y-auto custom-scrollbar' : 'justify-center pb-12 overflow-hidden'}`}>

                {!activeBlock && (
                    <div className="w-full max-w-full animate-fade-in flex flex-col items-center justify-center flex-1 h-full min-h-0 overflow-hidden">
                        <div className="text-center mb-12">
                            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tighter mb-2">
                                Bem-vindo, <span className="text-indigo-600">{firstName}</span>
                            </h1>
                            <p className="text-slate-500 text-base font-medium">
                                {hasAnyPermission ? 'Selecione um módulo operacional para trabalhar:' : 'Aguarde a liberação de permissões pelo administrador.'}
                            </p>
                        </div>

                        <div className={getContainerClass()}>
                            {canAccessOficio && (
                                <button onClick={() => setActiveBlock('oficio')} className={getCardClass('indigo')}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-[1.2rem] flex items-center justify-center mb-2 md:mb-3 transition-all duration-500 bg-gradient-to-br from-indigo-600 to-indigo-700"><FileText className="w-5 h-5 md:w-8 md:h-8 text-white" /></div>
                                        <h2 className="text-lg md:text-2xl font-black text-slate-900 mb-0.5 md:mb-1 tracking-tight whitespace-nowrap">Ofícios</h2>
                                        <p className="text-slate-500 text-[10px] md:text-xs font-medium opacity-0 md:opacity-100 h-0 md:h-auto overflow-hidden">Geração e histórico.</p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">Acessar <ArrowRight className="w-4 h-4" /></div>
                                </button>
                            )}

                            {canAccessCompras && (
                                <button onClick={() => setActiveBlock('compras')} className={getCardClass('emerald')}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-[1.2rem] flex items-center justify-center mb-2 md:mb-3 transition-all duration-500 bg-gradient-to-br from-emerald-600 to-emerald-700"><ShoppingCart className="w-5 h-5 md:w-8 md:h-8 text-white" /></div>
                                        <h2 className="text-lg md:text-2xl font-black text-slate-900 mb-0.5 md:mb-1 tracking-tight whitespace-nowrap">Compras</h2>
                                        <p className="text-slate-500 text-[10px] md:text-xs font-medium opacity-0 md:opacity-100 h-0 md:h-auto overflow-hidden">Pedidos e requisições.</p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">Acessar <ArrowRight className="w-4 h-4" /></div>
                                </button>
                            )}

                            {canAccessLicitacao && (
                                <button onClick={() => setActiveBlock('licitacao')} className={getCardClass('blue')}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-[1.2rem] flex items-center justify-center mb-2 md:mb-3 transition-all duration-500 bg-gradient-to-br from-blue-600 to-blue-700"><Gavel className="w-5 h-5 md:w-8 md:h-8 text-white" /></div>
                                        <h2 className="text-lg md:text-2xl font-black text-slate-900 mb-0.5 md:mb-1 tracking-tight whitespace-nowrap">Licitação</h2>
                                        <p className="text-slate-500 text-[10px] md:text-xs font-medium opacity-0 md:opacity-100 h-0 md:h-auto overflow-hidden">Processos e termos.</p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">Acessar <ArrowRight className="w-4 h-4" /></div>
                                </button>
                            )}

                            {canAccessDiarias && (
                                <button onClick={() => setActiveBlock('diarias')} className={getCardClass('amber')}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-[1.2rem] flex items-center justify-center mb-2 md:mb-3 transition-all duration-500 bg-gradient-to-br from-amber-600 to-amber-700"><Wallet className="w-5 h-5 md:w-8 md:h-8 text-white" /></div>
                                        <h2 className="text-lg md:text-2xl font-black text-slate-900 mb-0.5 md:mb-1 tracking-tight whitespace-nowrap">Diárias</h2>
                                        <p className="text-slate-500 text-[10px] md:text-xs font-medium opacity-0 md:opacity-100 h-0 md:h-auto overflow-hidden">Gestão de despesas.</p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">Acessar <ArrowRight className="w-4 h-4" /></div>
                                </button>
                            )}

                            {canAccessScheduling && (
                                <button onClick={() => { setActiveBlock('agendamento'); onVehicleScheduling?.(); }} className={getCardClass('indigo')}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                                    <div className="relative z-10 flex flex-col items-center w-full">
                                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-[1.2rem] flex items-center justify-center mb-2 md:mb-3 transition-all duration-500 bg-gradient-to-br from-indigo-50 to-violet-600"><CalendarRange className="w-5 h-5 md:w-8 md:h-8 text-white" /></div>
                                        <h2 className="text-[10px] md:text-xl lg:text-2xl font-black text-slate-900 mb-0.5 md:mb-1 tracking-tight leading-tight px-1">Agendamento de veiculos</h2>
                                        <p className="text-slate-500 text-[10px] md:text-xs font-medium opacity-0 md:opacity-100 h-0 md:h-auto overflow-hidden px-1">Controle de frotas.</p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">Acessar <ArrowRight className="w-4 h-4" /></div>
                                </button>
                            )}

                            {canAccessFleet && <FleetShortcutCard onClick={() => onOpenAdmin('fleet')} className={getCardClass('cyan')} />}
                        </div>
                    </div>
                )}

                {activeBlock && activeBlock !== 'agendamento' && (
                    <div className="w-full max-w-6xl animate-fade-in flex flex-col items-center">
                        <div className="space-y-6 w-full max-w-5xl">
                            <button onClick={() => setActiveBlock(null)} className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold mb-4 transition-all w-fit">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-xs uppercase tracking-widest">Voltar</span>
                            </button>
                            <div className="text-center space-y-1">
                                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center">{getBlockName()}</h2>
                                <p className="text-slate-500 text-xs font-medium">Gestão Integrada Municipal</p>
                            </div>

                            <div className="flex flex-row flex-wrap items-stretch justify-center gap-4 md:gap-6 lg:gap-8 pt-4 w-full max-w-full overflow-hidden">
                                <button onClick={() => onNewOrder(activeBlock || 'oficio')} className={`group p-4 md:p-6 bg-white border border-slate-200 rounded-[2rem] hover:border-indigo-300 transition-all flex flex-col items-center text-center justify-center ${activeBlock === 'licitacao' ? 'w-36 sm:w-44 md:w-52 lg:w-56 h-36 md:h-48 lg:h-52' : 'w-48 md:w-64 h-48 md:h-56'} shrink-0 overflow-hidden`}>
                                    <div className="w-8 h-8 md:w-14 md:h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-2 md:mb-4 group-hover:scale-110 transition-transform"><FilePlus className="w-4 h-4 md:w-7 md:h-7 text-white" /></div>
                                    <h3 className="text-[10px] sm:text-xs md:text-base lg:text-lg font-black text-slate-900 mb-0.5 md:mb-1 whitespace-nowrap px-1">{getNewActionLabel()}</h3>
                                    <p className="text-slate-500 text-[8px] sm:text-[10px] md:text-xs font-medium px-1">Criar novo registro.</p>
                                </button>

                                <button onClick={onTrackOrder} className={`group p-4 md:p-6 bg-white border border-slate-200 rounded-[2rem] hover:border-purple-300 transition-all flex flex-col items-center text-center justify-center ${activeBlock === 'licitacao' ? 'w-36 sm:w-44 md:w-52 lg:w-56 h-36 md:h-48 lg:h-52' : 'w-48 md:w-64 h-48 md:h-56'} shrink-0 overflow-hidden`}>
                                    <div className="w-8 h-8 md:w-14 md:h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-2 md:mb-4 group-hover:scale-110 transition-transform"><History className="w-4 h-4 md:w-7 md:h-7 text-white" /></div>
                                    <h3 className="text-[10px] sm:text-xs md:text-base lg:text-lg font-black text-slate-900 mb-0.5 md:mb-1 whitespace-nowrap px-1">{
                                        activeBlock === 'oficio' ? 'Histórico de Ofícios' :
                                            activeBlock === 'compras' ? 'Histórico de Compras' :
                                                activeBlock === 'diarias' ? 'Histórico de Solicitações' :
                                                    activeBlock === 'licitacao' ? 'Meus Processos' :
                                                        'Histórico'
                                    }</h3>
                                    <p className="text-slate-500 text-[8px] sm:text-[10px] md:text-xs font-medium px-1">Consulte registros de {activeBlock?.toUpperCase()}.</p>
                                </button>

                                {activeBlock === 'compras' && canManagePurchaseOrders && (
                                    <button onClick={onManagePurchaseOrders} className={`group p-4 md:p-6 bg-white border border-slate-200 rounded-[2rem] hover:border-emerald-300 transition-all flex flex-col items-center text-center justify-center ${activeBlock === 'licitacao' ? 'w-36 sm:w-44 md:w-52 lg:w-56 h-36 md:h-48 lg:h-52' : 'w-48 md:w-64 h-48 md:h-56'} shrink-0 overflow-hidden`}>
                                        <div className="w-8 h-8 md:w-14 md:h-14 bg-emerald-600 rounded-xl flex items-center justify-center mb-2 md:mb-4 group-hover:scale-110 transition-transform"><Inbox className="w-4 h-4 md:w-7 md:h-7 text-white" /></div>
                                        <h3 className="text-[10px] sm:text-xs md:text-lg lg:text-xl font-black text-slate-900 mb-0.5 md:mb-1 whitespace-nowrap px-1">Pedidos</h3>
                                        <p className="text-slate-500 text-[8px] sm:text-[10px] md:text-xs font-medium px-1">Gestão Administrativa (Admin)</p>
                                    </button>
                                )}

                                {activeBlock === 'licitacao' && canAccessLicitacaoTriagem && (
                                    <button onClick={onManageLicitacaoScreening} className="group p-4 md:p-6 bg-white border border-slate-200 rounded-[2rem] hover:border-amber-300 transition-all flex flex-col items-center text-center justify-center w-36 sm:w-44 md:w-52 lg:w-56 h-36 md:h-48 lg:h-52 shrink-0 overflow-hidden">
                                        <div className="w-8 h-8 md:w-14 md:h-14 bg-amber-600 rounded-xl flex items-center justify-center mb-2 md:mb-4 group-hover:scale-110 transition-transform"><Inbox className="w-4 h-4 md:w-7 md:h-7 text-white" /></div>
                                        <h3 className="text-[10px] sm:text-xs md:text-base lg:text-lg font-black text-slate-900 mb-0.5 md:mb-1 whitespace-nowrap px-1">Triagem</h3>
                                        <p className="text-slate-500 text-[8px] sm:text-[10px] md:text-xs font-medium px-1">Triagem de Processos</p>
                                    </button>

                                )}

                                {activeBlock === 'licitacao' && canAccessLicitacaoProcessos && (
                                    <button onClick={onViewAllLicitacao} className="group p-4 md:p-6 bg-white border border-slate-200 rounded-[2rem] hover:border-sky-300 transition-all flex flex-col items-center text-center justify-center w-36 sm:w-44 md:w-52 lg:w-56 h-36 md:h-48 lg:h-52 shrink-0 overflow-hidden">
                                        <div className="w-8 h-8 md:w-14 md:h-14 bg-sky-600 rounded-xl flex items-center justify-center mb-2 md:mb-4 group-hover:scale-110 transition-transform"><FileSearch className="w-4 h-4 md:w-7 md:h-7 text-white" /></div>
                                        <h3 className="text-[10px] sm:text-xs md:text-base lg:text-lg font-black text-slate-900 mb-0.5 md:mb-1 whitespace-nowrap px-1">Processos</h3>
                                        <p className="text-slate-500 text-[8px] sm:text-[10px] md:text-xs font-medium px-1">Todos os Processos</p>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-auto py-8 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] shrink-0">
                    <Package className="w-4 h-4" /><span>Plataforma de Gestão Integrada v1.2.0</span>
                </div>
            </main>
        </div>
    );
};
