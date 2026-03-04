import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Vehicle } from '../types';

const CACHE_KEY = 'cached_vehicles_data';

export const vehicleKeys = {
    all: ['vehicles'] as const,
};

export const useCachedVehicles = (initialVehicles: Vehicle[] = []) => {
    const queryClient = useQueryClient();

    // Set up Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('vehicles_cache_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
                queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return useQuery({
        queryKey: vehicleKeys.all,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .order('plate', { ascending: true });

            if (error) throw error;

            // Optional: Backup to LocalStorage if needed for offline-first boots
            if (data) {
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            }

            return data || [];
        },
        initialData: () => {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                } catch (e) {
                    console.error("Error parsing cached vehicles:", e);
                }
            }
            return initialVehicles.length > 0 ? initialVehicles : undefined;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000),
    });
};
