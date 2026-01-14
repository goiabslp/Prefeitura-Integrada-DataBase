import React from 'react';
import { useIsMutating, useIsFetching } from '@tanstack/react-query';
import { Cloud, CheckCircle2, RefreshCw } from 'lucide-react';

interface SyncIndicatorProps {
    className?: string;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ className = '' }) => {
    const isMutating = useIsMutating();
    const isFetching = useIsFetching();

    // We only care about background sync/mutations for the "Syncing" state
    // Fetching might just be reading, but often implies revalidating after mutation.
    const isSyncing = isMutating > 0 || isFetching > 0;

    return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all duration-500 ${className}`}>
            {isSyncing ? (
                <>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-indigo-500" />
                    <span className="text-indigo-500">Sync...</span>
                </>
            ) : (
                <>
                    <Cloud className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-emerald-500">Online</span>
                </>
            )}
        </div>
    );
};
