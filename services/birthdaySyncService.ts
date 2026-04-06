import { supabase } from './supabaseClient';
import { Person } from '../types';

/**
 * Service to handle synchronization between Persons and Calendar Birthday Events.
 */
export const birthdaySyncService = {
    /**
     * Synchronizes a single person's birthday to the calendar.
     */
    syncPersonBirthday: async (person: Person) => {
        try {
            if (!person.birth_date) {
                // If person has no birth date, ensure no birthday event exists
                await supabase
                    .from('calendar_events')
                    .delete()
                    .eq('professional_id', person.id)
                    .eq('type', 'Aniversário');
                return;
            }

            // Check for existing event
            const { data: existing } = await supabase
                .from('calendar_events')
                .select('id')
                .eq('professional_id', person.id)
                .eq('type', 'Aniversário')
                .maybeSingle();

            const eventData = {
                title: `Aniversário: ${person.name}`,
                type: 'Aniversário',
                start_date: person.birth_date,
                end_date: person.birth_date,
                is_all_day: true,
                is_recurring: true,
                professional_id: person.id,
                description: `Comemoração do aniversário de ${person.name}.`
            };

            if (existing) {
                // Update
                await supabase
                    .from('calendar_events')
                    .update(eventData)
                    .eq('id', existing.id);
            } else {
                // Insert
                await supabase
                    .from('calendar_events')
                    .insert([eventData]);
            }
        } catch (error) {
            console.error(`[BirthdaySync] Error syncing person ${person.id}:`, error);
        }
    },

    /**
     * Performs a bulk sync for all persons in the system.
     */
    bulkSyncBirthdays: async () => {
        try {
            console.log('[BirthdaySync] Starting bulk sync...');
            
            // 1. Fetch all persons with birth dates
            const { data: persons, error: pError } = await supabase
                .from('persons')
                .select('id, name, birth_date')
                .not('birth_date', 'is', null);

            if (pError) throw pError;
            if (!persons) return;

            // 2. Fetch all existing birthday events to map them
            const { data: events, error: eError } = await supabase
                .from('calendar_events')
                .select('id, professional_id')
                .eq('type', 'Aniversário');

            if (eError) throw eError;

            const existingEventsMap = new Map(
                (events || []).map(e => [e.professional_id, e.id])
            );

            // 3. Prepare batches
            const toInsert = [];
            const toUpdate = [];

            for (const person of persons) {
                const eventId = existingEventsMap.get(person.id);
                const eventData = {
                    title: `Aniversário: ${person.name}`,
                    type: 'Aniversário',
                    start_date: person.birth_date,
                    end_date: person.birth_date,
                    is_all_day: true,
                    is_recurring: true,
                    professional_id: person.id,
                    description: `Comemoração do aniversário de ${person.name}.`
                };

                if (eventId) {
                    toUpdate.push({ id: eventId, ...eventData });
                } else {
                    toInsert.push(eventData);
                }
            }

            // 4. Execute inserts (in chunks if many)
            if (toInsert.length > 0) {
                await supabase.from('calendar_events').insert(toInsert);
            }

            // 5. Execute updates (Supabase doesn't support bulk update with different values easily in a single call without RPC)
            // But for ~200 items, sequential updates are fine if we use Promise.all in small batches
            for (const item of toUpdate) {
                const { id, ...data } = item;
                await supabase.from('calendar_events').update(data).eq('id', id);
            }

            console.log(`[BirthdaySync] Bulk sync complete. Added: ${toInsert.length}, Updated: ${toUpdate.length}`);
        } catch (error) {
            console.error('[BirthdaySync] Critical bulk sync error:', error);
        }
    },

    /**
     * Deletes a person's birthday event.
     */
    deletePersonBirthday: async (personId: string) => {
        try {
            await supabase
                .from('calendar_events')
                .delete()
                .eq('professional_id', personId)
                .eq('type', 'Aniversário');
        } catch (error) {
            console.error(`[BirthdaySync] Error deleting event for person ${personId}:`, error);
        }
    }
};
