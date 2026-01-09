import React, { useState } from 'react';
import { Sprout, ArrowLeft, Construction, PlusCircle, CalendarDays, FileStack, LayoutDashboard, Database } from 'lucide-react';
import { NewSchedulingForm } from './NewSchedulingForm';
import { SchedulingView } from './SchedulingView';
import { RequestsList } from './RequestsList';
import { AgricultureStats } from './AgricultureStats';
import { AgricultureRegistrations } from './AgricultureRegistrations';

interface AgricultureModuleProps {
    onBack: () => void;
}

type AgricultureBlock = 'dashboard' | 'new_scheduling' | 'programming' | 'requests' | 'registrations' | null;

export const AgricultureModule: React.FC<AgricultureModuleProps> = ({ onBack }) => {
    const [activeBlock, setActiveBlock] = useState<AgricultureBlock>('new_scheduling');

    const menuItems = [
        { id: 'new_scheduling', label: 'Novo Agendamento', icon: PlusCircle, description: 'Solicitar serviço ou maquinário' },
        { id: 'programming', label: 'Programação', icon: CalendarDays, description: 'Visualizar agenda e serviços' },
        { id: 'requests', label: 'Solicitações', icon: FileStack, description: 'Gerenciar pedidos e ofícios' },
        { id: 'registrations', label: 'Cadastros', icon: Database, description: 'Produtores, maquinário e locais' },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Visão geral e indicadores' },
    ];

    const renderContent = () => {
        switch (activeBlock) {
            case 'dashboard':
                return <AgricultureStats />;
            case 'new_scheduling':
                return <NewSchedulingForm />;
            case 'programming':
                return <SchedulingView />;
            case 'requests':
                return <RequestsList />;
            case 'registrations':
                return <AgricultureRegistrations />;
            default:
                return <AgricultureStats />;
        }
    };

    return (
        <div className="flex h-full bg-slate-50 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20">
                <div className="p-8 border-b border-slate-100">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-bold transition-all w-fit mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs uppercase tracking-widest">Voltar</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                            <Sprout className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 leading-none">Agricultura</h1>
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mt-1">Gestão Rural</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-2">Menu Principal</p>
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveBlock(item.id as AgricultureBlock)}
                            className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 group text-left border ${activeBlock === item.id
                                ? 'bg-emerald-50 border-emerald-100 shadow-md shadow-emerald-900/5'
                                : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${activeBlock === item.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-emerald-500'
                                }`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className={`block font-bold text-sm mb-0.5 ${activeBlock === item.id ? 'text-emerald-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                    {item.label}
                                </span>
                                <span className={`text-[10px] font-medium leading-tight block ${activeBlock === item.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {item.description}
                                </span>
                            </div>
                        </button>
                    ))}
                </nav>


            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto custom-scrollbar p-4 md:p-6 relative">
                <div className="w-full h-full flex flex-col">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};
