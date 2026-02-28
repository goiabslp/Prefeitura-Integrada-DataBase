import React from 'react';
import { User, Person, Sector, AppState } from '../../types';
import { MarketingDashboard } from './MarketingDashboard';
import { NovoConteudoStepper } from './NovoConteudoStepper';
import { MeusConteudosList } from './MeusConteudosList';

interface MarketingModuleProps {
    currentView: string;
    userId: string;
    userName: string;
    userRole: string;
    users: User[];
    persons: Person[];
    sectors: Sector[];
    appState: AppState;
    onLogout: () => void;
    onBack: () => void;
    subView?: string;
    selectedRequestId?: string;
    onNavigate: (view: string, id?: string) => void;
}

export const MarketingModule: React.FC<MarketingModuleProps> = ({
    userId,
    userName,
    userRole,
    users,
    persons,
    sectors,
    appState,
    onLogout,
    onBack,
    subView,
    selectedRequestId,
    onNavigate
}) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Conditional Rendering Based on subView */}
            {!subView && (
                <MarketingDashboard
                    onNavigate={onNavigate}
                    onBack={onBack}
                    userId={userId}
                />
            )}

            {subView === 'new' && (
                <NovoConteudoStepper
                    onNavigate={onNavigate}
                    onBack={() => onNavigate('')}
                    userId={userId}
                    userName={userName}
                    sectors={sectors}
                />
            )}

            {subView === 'details' && selectedRequestId && (
                <div className="p-8">
                    {/* Placeholder for Request Details */}
                    <h2>Details view for ID: {selectedRequestId}</h2>
                    <button onClick={() => onNavigate('')}>Voltar</button>
                </div>
            )}
        </div>
    );
};
