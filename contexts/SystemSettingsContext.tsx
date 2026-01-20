import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface ModuleSetting {
    id: string;
    module_key: string;
    label: string;
    is_enabled: boolean;
}

interface SystemSettingsContextType {
    moduleStatus: Record<string, boolean>; // key: module_key, value: is_enabled
    isLoading: boolean;
    toggleModule: (key: string, enabled: boolean) => Promise<boolean>;
    settings: ModuleSetting[];
}

const SystemSettingsContext = createContext<SystemSettingsContextType>({
    moduleStatus: {},
    isLoading: true,
    toggleModule: async () => false,
    settings: []
});

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<ModuleSetting[]>([]);
    const [moduleStatus, setModuleStatus] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch
    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('global_module_settings')
                .select('*')
                .order('label');

            if (error) {
                console.error('Error fetching global settings:', error);
                // Fail open if table doesn't exist yet (migration pending)
                setIsLoading(false);
                return;
            }

            if (data) {
                setSettings(data);
                const statusMap: Record<string, boolean> = {};
                data.forEach(s => {
                    statusMap[s.module_key] = s.is_enabled;
                });
                setModuleStatus(statusMap);
            }
        } catch (err) {
            console.error('Unexpected error fetching settings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();

        // Realtime Subscription
        const subscription = supabase
            .channel('global_settings_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'global_module_settings' }, (payload) => {
                // Simple strategy: refetch all to ensure consistency
                fetchSettings();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const toggleModule = async (key: string, enabled: boolean) => {
        try {
            const { error } = await supabase
                .from('global_module_settings')
                .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
                .eq('module_key', key);

            if (error) throw error;

            // Optimistic update
            setModuleStatus(prev => ({ ...prev, [key]: enabled }));
            setSettings(prev => prev.map(s => s.module_key === key ? { ...s, is_enabled: enabled } : s));

            return true;
        } catch (error) {
            console.error('Error toggling module:', error);
            alert('Erro ao atualizar status do módulo.');
            return false;
        }
    };

    return (
        <SystemSettingsContext.Provider value={{ moduleStatus, isLoading, toggleModule, settings }}>
            {children}
        </SystemSettingsContext.Provider>
    );
};

export const useSystemSettings = () => useContext(SystemSettingsContext);
