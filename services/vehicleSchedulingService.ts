import { supabase } from './supabaseClient';
import { VehicleSchedule, ScheduleStatus } from '../types';

export const getSchedules = async (): Promise<VehicleSchedule[]> => {
    const { data, error } = await supabase
        .from('vehicle_schedules')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching schedules:', error);
        return [];
    }

    return data.map((s: any) => ({
        id: s.id,
        protocol: s.protocol,
        vehicleId: s.vehicle_id,
        driverId: s.driver_id,
        requesterPersonId: s.requester_person_id,
        requesterId: s.requester_id,
        destination: s.destination,
        serviceSectorId: s.service_sector_id,
        purpose: s.purpose,
        departureDateTime: s.departure_date_time,
        returnDateTime: s.return_date_time,
        vehicleLocation: s.vehicle_location,
        status: s.status as ScheduleStatus,
        createdAt: s.created_at,
        authorizedByName: s.authorized_by_name
    }));
};

const generateProtocol = async (): Promise<string> => {
    const year = new Date().getFullYear();
    // Use a generic ID for vehicle scheduling counter
    const counterId = 'vehicle_scheduling_protocol';

    try {
        // Try to get next count from counterService (if it existed) or manual logic
        // For simplicity and since counterService is available, let's try to use RPC if possible or simple timestamp/random as fallback
        const { data, error } = await supabase.rpc('increment_sector_counter', {
            p_sector_id: counterId,
            p_year: year
        });

        if (!error && data !== null) {
            return `OS-${year}${String(data).padStart(5, '0')}`;
        }

        // Fallback if RPC fails: Date based unique ID
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `OS-${year}${timestamp}${random}`;
    } catch (e) {
        console.error('Error generating protocol:', e);
        return `OS-${year}${Date.now()}`;
    }
};

export const createSchedule = async (schedule: Omit<VehicleSchedule, 'id' | 'createdAt' | 'protocol'>): Promise<VehicleSchedule | null> => {
    const protocol = await generateProtocol();

    const dbSchedule = {
        protocol,
        vehicle_id: schedule.vehicleId,
        driver_id: schedule.driverId,
        requester_person_id: schedule.requesterPersonId,
        requester_id: schedule.requesterId,
        destination: schedule.destination,
        service_sector_id: schedule.serviceSectorId,
        purpose: schedule.purpose,
        departure_date_time: schedule.departureDateTime,
        return_date_time: schedule.returnDateTime,
        vehicle_location: schedule.vehicleLocation,
        status: schedule.status,
        authorized_by_name: schedule.authorizedByName
    };

    const { data, error } = await supabase
        .from('vehicle_schedules')
        .insert([dbSchedule])
        .select()
        .single();

    if (error) {
        console.error('Error creating schedule:', error);
        return null;
    }

    return {
        id: data.id,
        protocol: data.protocol,
        vehicleId: data.vehicle_id,
        driverId: data.driver_id,
        requesterPersonId: data.requester_person_id,
        requesterId: data.requester_id,
        destination: data.destination,
        serviceSectorId: data.service_sector_id,
        purpose: data.purpose,
        departureDateTime: data.departure_date_time,
        returnDateTime: data.return_date_time,
        vehicleLocation: data.vehicle_location,
        status: data.status,
        createdAt: data.created_at,
        authorizedByName: data.authorized_by_name
    };
};

export const updateSchedule = async (schedule: VehicleSchedule): Promise<VehicleSchedule | null> => {
    const dbSchedule = {
        vehicle_id: schedule.vehicleId,
        driver_id: schedule.driverId,
        requester_person_id: schedule.requesterPersonId,
        requester_id: schedule.requesterId,
        destination: schedule.destination,
        service_sector_id: schedule.serviceSectorId,
        purpose: schedule.purpose,
        departure_date_time: schedule.departureDateTime,
        return_date_time: schedule.returnDateTime,
        vehicle_location: schedule.vehicleLocation,
        status: schedule.status,
        authorized_by_name: schedule.authorizedByName
    };

    const { data, error } = await supabase
        .from('vehicle_schedules')
        .update(dbSchedule)
        .eq('id', schedule.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating schedule:', error);
        return null;
    }

    return {
        id: data.id,
        protocol: data.protocol,
        vehicleId: data.vehicle_id,
        driverId: data.driver_id,
        requesterPersonId: data.requester_person_id,
        requesterId: data.requester_id,
        destination: data.destination,
        serviceSectorId: data.service_sector_id,
        purpose: data.purpose,
        departureDateTime: data.departure_date_time,
        returnDateTime: data.return_date_time,
        vehicleLocation: data.vehicle_location,
        status: data.status,
        createdAt: data.created_at,
        authorizedByName: data.authorized_by_name
    };
};


export const updateScheduleStatus = async (id: string, status: ScheduleStatus): Promise<boolean> => {
    const { error } = await supabase
        .from('vehicle_schedules')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Error updating schedule status:', error);
        return false;
    }
    return true;
};

export const deleteSchedule = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('vehicle_schedules')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting schedule:', error);
        return false;
    }
    return true;
};

// Check availability (Supabase version)
export const checkAvailability = async (vehicleId: string, start: string, end: string, excludeScheduleId?: string): Promise<boolean> => {
    // We want to find if there are ANY schedules that overlap.
    // Overlap condition: (StartA < EndB) and (EndA > StartB)

    let query = supabase
        .from('vehicle_schedules')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .in('status', ['confirmado', 'em_curso']) // Only count confirmed/active trips
        .lt('departure_date_time', end)
        .gt('return_date_time', start);

    if (excludeScheduleId) {
        query = query.neq('id', excludeScheduleId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error checking availability:', error);
        return false; // Assume available on error? Or unavailable? Let's say available but log error.
    }

    return data.length === 0;
};
