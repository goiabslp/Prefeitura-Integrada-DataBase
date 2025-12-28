
import { supabase } from './supabaseClient';

export const getNextSectorCount = async (sectorId: string, year: number): Promise<number | null> => {
    // This is 'peek', just getting the suggestion
    try {
        const { data, error } = await supabase.rpc('peek_sector_counter', {
            p_sector_id: sectorId,
            p_year: year
        });

        if (error) {
            console.error('Error peeking sector counter:', error);
            return null;
        }
        return data as number;
    } catch (e) {
        console.error('Exception in getNextSectorCount:', e);
        return null;
    }
};

export const incrementSectorCount = async (sectorId: string, year: number): Promise<number | null> => {
    // This is the real increment, used on Save
    try {
        const { data, error } = await supabase.rpc('increment_sector_counter', {
            p_sector_id: sectorId,
            p_year: year
        });

        if (error) {
            console.error('Error incrementing sector counter:', error);
            return null;
        }
        return data as number;
    } catch (e) {
        console.error('Exception in incrementSectorCount:', e);
        return null;
    }
};
