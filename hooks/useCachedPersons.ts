import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Person } from '../types';

const CACHE_KEY = 'cached_persons_data';

export const useCachedPersons = (initialPersons: Person[] = []) => {
    const [persons, setPersons] = useState<Person[]>(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {
                console.error("Error parsing cached persons:", e);
            }
        }
        return initialPersons;
    });

    useEffect(() => {
        let mounted = true;

        const syncPersons = async () => {
            try {
                const { data, error } = await supabase
                    .from('persons')
                    .select('*')
                    .order('name');

                if (error) throw error;

                if (mounted && data) {
                    // Map snake_case to camelCase
                    const mappedData = data.map(p => ({
                        id: p.id,
                        name: p.name,
                        sectorId: p.sector_id,
                        jobId: p.job_id
                    }));
                    setPersons(mappedData);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(mappedData));
                }
            } catch (error) {
                console.error("Background persons sync error:", error);
            }
        };

        syncPersons();

        const subscription = supabase
            .channel('persons_cache_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'persons' }, () => {
                syncPersons();
            })
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(subscription);
        };
    }, []);

    return persons;
};
