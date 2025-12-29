
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
    // 1. Try RPC first (Atomic)
    try {
        const { data, error } = await supabase.rpc('increment_sector_counter', {
            p_sector_id: sectorId,
            p_year: year
        });

        if (!error && data !== null) {
            return data as number;
        }

        console.warn('RPC failed or not found, falling back to direct table manipulation.', error);
    } catch (e) {
        console.error('Exception calling RPC, falling back:', e);
    }

    // 2. Fallback: Manual check-and-update (Client-side)
    // Note: This is not atomic under high concurrency but sufficient for manual office tasks.
    try {
        // Check if exists
        const { data: existing, error: fetchError } = await supabase
            .from('sector_counters')
            .select('*')
            .eq('sector_id', sectorId)
            .eq('year', year)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'Row not found'
            console.error('Error fetching sector counter:', fetchError);
            return null;
        }

        if (existing) {
            // Update
            const nextVal = (existing.count || 0) + 1;
            const { data: updated, error: updateError } = await supabase
                .from('sector_counters')
                .update({ count: nextVal })
                .eq('id', existing.id) // Assuming there's an ID, or we use composite key
                .select()
                .single();

            if (updateError) {
                // Fallback using composite key if ID not available or other error
                const { data: updatedComposite, error: updateCompositeError } = await supabase
                    .from('sector_counters')
                    .update({ count: nextVal })
                    .eq('sector_id', sectorId)
                    .eq('year', year)
                    .select()
                    .single();

                if (updateCompositeError) {
                    console.error('Error updating sector counter:', updateCompositeError);
                    return null;
                }
                return updatedComposite?.count ?? null;
            }
            return updated?.count ?? null;
        } else {
            // Insert
            const { data: inserted, error: insertError } = await supabase
                .from('sector_counters')
                .insert([{ sector_id: sectorId, year: year, count: 1 }])
                .select()
                .single();

            if (insertError) {
                console.error('Error inserting sector counter:', insertError);
                return null;
            }
            return inserted?.count ?? null;
        }

    } catch (e) {
        console.error('Exception in manual incrementSectorCount:', e);
        return null;
    }
};
