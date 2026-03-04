import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AbastecimentoService } from '../services/abastecimentoService';

const CACHE_KEY = 'cached_fuel_types_data';

export const fuelTypeKeys = {
    all: ['fuelTypes'] as const,
};

interface FuelType {
    key: string;
    label: string;
    price: number;
}

export const useCachedFuelTypes = (initialFuelTypes: FuelType[] = []) => {
    const queryClient = useQueryClient();

    // Set up Realtime Subscription for config changes
    useEffect(() => {
        const channel = supabase
            .channel('fuel_types_cache_sync')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'abastecimento_config' },
                (payload) => {
                    if (payload.new && (payload.new as any).key === 'fuel_prices') {
                        queryClient.invalidateQueries({ queryKey: fuelTypeKeys.all });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return useQuery({
        queryKey: fuelTypeKeys.all,
        queryFn: async () => {
            const types = await AbastecimentoService.getFuelTypes();

            if (types && types.length > 0) {
                localStorage.setItem(CACHE_KEY, JSON.stringify(types));
            }

            return types || [];
        },
        initialData: () => {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                } catch (e) {
                    console.error("Error parsing cached fuel types:", e);
                }
            }
            return initialFuelTypes.length > 0 ? initialFuelTypes : undefined;
        },
        staleTime: 1000 * 60 * 15, // 15 minutes (prices change rarely)
        retry: 3,
    });
};
