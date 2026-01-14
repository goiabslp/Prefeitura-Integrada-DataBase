import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Vehicle } from '../types';

const CACHE_KEY = 'cached_vehicles_data';

export const useCachedVehicles = (initialVehicles: Vehicle[] = []) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
        // 1. Try LocalStorage first for immediate display
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {
                console.error("Error parsing cached vehicles:", e);
            }
        }
        // 2. If no cache, use initial props (which might be empty initially)
        return initialVehicles;
    });

    useEffect(() => {
        let mounted = true;

        const syncVehicles = async () => {
            try {
                // Fetch latest data
                const { data, error } = await supabase
                    .from('vehicles')
                    .select('*')
                    .order('plate', { ascending: true }); // Ordered by Plate for faster lookup/display

                if (error) throw error;

                if (mounted && data) {
                    setVehicles(data);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                }
            } catch (error) {
                console.error("Background vehicle sync error:", error);
            }
        };

        // Run sync immediately
        syncVehicles();

        // Optional: Real-time subscription to keep it fresh
        const subscription = supabase
            .channel('vehicles_cache_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
                syncVehicles();
            })
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(subscription);
        };
    }, []);

    // Update state if initialVehicles prop changes and we have nothing else (rare case where prop loads later than cache logic?)
    // Actually, we prefer the internal fetch/cache. 
    // But if parent provides updated list, we might want to respect it?
    // Usually local fetch is more reliable for this component's specific needs (independent speed).
    // We'll stick to the internal logic as primary source after mount.

    return vehicles;
};
