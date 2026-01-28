
import { supabase } from './supabaseClient';

export interface OilChangeRecord {
    id: string;
    vehicle_id: string;
    service_date: string;
    current_km: number;
    created_at: string;
    created_by?: string;
}

export const fleetService = {
    async addOilChangeRecord(vehicleId: string, currentKm: number, date: string = new Date().toISOString()) {
        const { data, error } = await supabase
            .from('vehicle_oil_changes')
            .insert([
                {
                    vehicle_id: vehicleId,
                    current_km: currentKm,
                    service_date: date,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding oil change record:', error);
            throw error;
        }

        return data;
    },

    async getOilChangeHistory(vehicleId: string): Promise<OilChangeRecord[]> {
        const { data, error } = await supabase
            .from('vehicle_oil_changes')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('service_date', { ascending: false });

        if (error) {
            console.error('Error fetching oil change history:', error);
            throw error;
        }

        return data || [];
    },

    async addTimingBeltRecord(vehicleId: string, currentKm: number, date: string = new Date().toISOString()) {
        const { data, error } = await supabase
            .from('vehicle_timing_belt_changes')
            .insert([
                {
                    vehicle_id: vehicleId,
                    current_km: currentKm,
                    service_date: date,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding timing belt record:', error);
            throw error;
        }

        return data;
    },

    async getTimingBeltHistory(vehicleId: string): Promise<OilChangeRecord[]> {
        const { data, error } = await supabase
            .from('vehicle_timing_belt_changes')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('service_date', { ascending: false });

        if (error) {
            console.error('Error fetching timing belt history:', error);
            throw error;
        }

        return data || [];
    }
};
