import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AbastecimentoService } from '../services/abastecimentoService';

const CACHE_KEY = 'cached_fuel_types_data';

interface FuelType {
    key: string;
    label: string;
    price: number;
}

export const useCachedFuelTypes = (initialFuelTypes: FuelType[] = []) => {
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {
                console.error("Error parsing cached fuel types:", e);
            }
        }
        return initialFuelTypes;
    });

    useEffect(() => {
        let mounted = true;

        const syncFuelTypes = async () => {
            try {
                // Wrapper around AbastecimentoService to get config
                const types = await AbastecimentoService.getFuelTypes();

                if (mounted && types.length > 0) {
                    setFuelTypes(types);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(types));
                }
            } catch (error) {
                console.error("Background fuel types sync error:", error);
            }
        };

        syncFuelTypes();

        // Subscribe to changes in 'abastecimento_config' table
        const subscription = supabase
            .channel('fuel_types_cache_sync')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'abastecimento_config' },
                (payload) => {
                    // Only update if key is 'fuel_prices'
                    if (payload.new && (payload.new as any).key === 'fuel_prices') {
                        syncFuelTypes();
                    }
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(subscription);
        };
    }, []);

    return fuelTypes;
};
