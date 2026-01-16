
import { supabase } from './supabaseClient';

export const LICITACAO_GLOBAL_ID = '11111111-1111-1111-1111-111111111111';

export const getNextSectorCount = async (sectorId: string, year: number): Promise<number | null> => {
    // 1. Try RPC first
    try {
        const { data, error } = await supabase.rpc('peek_sector_counter', {
            p_sector_id: sectorId,
            p_year: year
        });

        if (!error && data !== null) {
            return data as number;
        }
    } catch (e) {
        console.error('Exception in getNextSectorCount RPC:', e);
    }

    // 2. Fallback: Manual select
    try {
        const { data: existing, error } = await supabase
            .from('sector_counters')
            .select('last_count')
            .eq('sector_id', sectorId)
            .eq('year', year)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching sector counter fallback:', error);
            return null;
        }

        // Return next number (current + 1), or 1 if no record exists
        return (existing?.last_count || 0) + 1;
    } catch (e) {
        console.error('Exception in getNextSectorCount fallback:', e);
        return null;
    }
};

export const incrementSectorCount = async (sectorId: string, year: number): Promise<number | null> => {
    // ATOMIC INCREMENT via RPC
    try {
        const { data, error } = await supabase.rpc('next_sector_counter', {
            p_sector_id: sectorId,
            p_year: year
        });

        if (error) {
            console.error('RPC next_sector_counter failed:', error);
            throw error;
        }

        return data as number;
    } catch (e) {
        console.error('Exception calling increment RPC:', e);
        return null;
    }
};

export const getLicitacaoProtocolCount = async (year: number): Promise<number | null> => {
    return getNextSectorCount(LICITACAO_GLOBAL_ID, year);
};

export const incrementLicitacaoProtocolCount = async (year: number): Promise<number | null> => {
    return incrementSectorCount(LICITACAO_GLOBAL_ID, year);
};

export const DIARIAS_GLOBAL_ID = '22222222-2222-2222-2222-222222222222';

export const getDiariasProtocolCount = async (year: number): Promise<number | null> => {
    return getNextSectorCount(DIARIAS_GLOBAL_ID, year);
};

export const incrementDiariasProtocolCount = async (year: number): Promise<number | null> => {
    return incrementSectorCount(DIARIAS_GLOBAL_ID, year);
};
