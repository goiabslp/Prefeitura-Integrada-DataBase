
import { supabase } from './supabaseClient';
import { Person, Sector, Job, Vehicle, VehicleBrand, Signature } from '../types';

// Sectors
export const getSectors = async (): Promise<Sector[]> => {
    const { data, error } = await supabase.from('sectors').select('*').order('name');
    if (error) {
        console.error('Error fetching sectors:', error);
        return [];
    }
    return data || [];
};

export const createSector = async (sector: Sector): Promise<Sector | null> => {
    const { data, error } = await supabase
        .from('sectors')
        .insert([{ name: sector.name }])
        .select()
        .single();

    if (error) {
        console.error('Error creating sector:', error);
        return null;
    }
    return data;
};

export const updateSector = async (sector: Sector): Promise<Sector | null> => {
    const { data, error } = await supabase
        .from('sectors')
        .update({ name: sector.name })
        .eq('id', sector.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating sector:', error);
        return null;
    }
    return data;
};

export const deleteSector = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('sectors').delete().eq('id', id);
    if (error) {
        console.error('Error deleting sector:', error);
        return false;
    }
    return true;
};

// Jobs
export const getJobs = async (): Promise<Job[]> => {
    const { data, error } = await supabase.from('jobs').select('*').order('name');
    if (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }
    return data || [];
};

export const createJob = async (job: Job): Promise<Job | null> => {
    const { data, error } = await supabase
        .from('jobs')
        .insert([{ name: job.name }])
        .select()
        .single();

    if (error) {
        console.error('Error creating job:', error);
        return null;
    }
    return data;
};

export const updateJob = async (job: Job): Promise<Job | null> => {
    const { data, error } = await supabase
        .from('jobs')
        .update({ name: job.name })
        .eq('id', job.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating job:', error);
        return null;
    }
    return data;
};

export const deleteJob = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) {
        console.error('Error deleting job:', error);
        return false;
    }
    return true;
};

// Persons
export const getPersons = async (): Promise<Person[]> => {
    const { data, error } = await supabase.from('persons').select('*').order('name');
    if (error) {
        console.error('Error fetching persons:', error);
        return [];
    }
    return data?.map(p => ({
        id: p.id,
        name: p.name,
        sectorId: p.sector_id,
        jobId: p.job_id
    })) || [];
};

export const createPerson = async (person: Person): Promise<Person | null> => {
    const { data, error } = await supabase
        .from('persons')
        .insert([{
            name: person.name,
            sector_id: person.sectorId,
            job_id: person.jobId
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating person:', error);
        return null;
    }
    return {
        id: data.id,
        name: data.name,
        sectorId: data.sector_id,
        jobId: data.job_id
    };
};

export const updatePerson = async (person: Person): Promise<Person | null> => {
    const { data, error } = await supabase
        .from('persons')
        .update({
            name: person.name,
            sector_id: person.sectorId,
            job_id: person.jobId
        })
        .eq('id', person.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating person:', error);
        return null;
    }
    return {
        id: data.id,
        name: data.name,
        sectorId: data.sector_id,
        jobId: data.job_id
    };
};

export const deletePerson = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('persons').delete().eq('id', id);
    if (error) {
        console.error('Error deleting person:', error);
        return false;
    }
    return true;
};

// Vehicles
export const getVehicles = async (): Promise<Vehicle[]> => {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .limit(1000);

    if (error) {
        console.error('Error fetching vehicles:', error.message);
        return [];
    }
    return data?.map(v => ({
        id: v.id,
        type: v.type,
        model: v.model,
        plate: v.plate,
        brand: v.brand,
        year: v.year,
        color: v.color,
        renavam: v.renavam,
        chassis: v.chassis,
        sectorId: v.sector_id,
        responsiblePersonId: v.responsible_person_id,
        documentUrl: v.document_url,
        documentName: v.document_name,
        vehicleImageUrl: v.vehicle_image_url,
        status: v.status,
        maintenanceStatus: v.maintenance_status,
        fuelTypes: v.fuel_types,
        requestManagerIds: v.request_manager_ids || [],
        maxKml: v.max_kml,
        minKml: v.min_kml,
        currentKm: v.current_km,
        oilLastChange: v.oil_last_change,
        oilNextChange: v.oil_next_change,
        oilCalculationBase: v.oil_calculation_base
    })) || [];
};

export const getVehicleById = async (id: string): Promise<Vehicle | null> => {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching vehicle details:', error);
        return null;
    }

    return {
        id: data.id,
        type: data.type,
        model: data.model,
        plate: data.plate,
        brand: data.brand,
        year: data.year,
        color: data.color,
        renavam: data.renavam,
        chassis: data.chassis,
        sectorId: data.sector_id,
        responsiblePersonId: data.responsible_person_id,
        documentUrl: data.document_url,
        documentName: data.document_name,
        vehicleImageUrl: data.vehicle_image_url,
        status: data.status,
        maintenanceStatus: data.maintenance_status,
        fuelTypes: data.fuel_types,
        requestManagerIds: data.request_manager_ids || [],
        maxKml: data.max_kml,
        minKml: data.min_kml,
        currentKm: data.current_km,
        oilLastChange: data.oil_last_change,
        oilNextChange: data.oil_next_change,
        oilCalculationBase: data.oil_calculation_base
    };
};

export const createVehicle = async (vehicle: Vehicle): Promise<Vehicle | null> => {
    const dbVehicle = {
        type: vehicle.type,
        model: vehicle.model,
        plate: vehicle.plate,
        brand: vehicle.brand,
        year: vehicle.year,
        color: vehicle.color,
        renavam: vehicle.renavam,
        chassis: vehicle.chassis,
        sector_id: vehicle.sectorId || null,
        responsible_person_id: vehicle.responsiblePersonId || null,
        document_url: vehicle.documentUrl,
        document_name: vehicle.documentName,
        vehicle_image_url: vehicle.vehicleImageUrl,
        status: vehicle.status,
        maintenance_status: vehicle.maintenanceStatus,
        fuel_types: vehicle.fuelTypes,
        request_manager_ids: vehicle.requestManagerIds || [],
        max_kml: vehicle.maxKml,
        min_kml: vehicle.minKml,
        current_km: vehicle.currentKm,
        oil_last_change: vehicle.oilLastChange,
        oil_next_change: vehicle.oilNextChange,
        oil_calculation_base: vehicle.oilCalculationBase
    };

    const { data, error } = await supabase
        .from('vehicles')
        .insert([dbVehicle])
        .select()
        .single();

    if (error) {
        console.error('Error creating vehicle:', error);
        return null;
    }

    return {
        id: data.id,
        type: data.type,
        model: data.model,
        plate: data.plate,
        brand: data.brand,
        year: data.year,
        color: data.color,
        renavam: data.renavam,
        chassis: data.chassis,
        sectorId: data.sector_id,
        responsiblePersonId: data.responsible_person_id,
        documentUrl: data.document_url,
        documentName: data.document_name,
        vehicleImageUrl: data.vehicle_image_url,
        status: data.status,
        maintenanceStatus: data.maintenance_status,
        fuelTypes: data.fuel_types,
        requestManagerIds: data.request_manager_ids || [],
        maxKml: data.max_kml,
        minKml: data.min_kml,
        currentKm: data.current_km,
        oilLastChange: data.oil_last_change,
        oilNextChange: data.oil_next_change,
        oilCalculationBase: data.oil_calculation_base
    };
};

export const updateVehicle = async (vehicle: Vehicle): Promise<Vehicle | null> => {
    const dbVehicle = {
        type: vehicle.type,
        model: vehicle.model,
        plate: vehicle.plate,
        brand: vehicle.brand,
        year: vehicle.year,
        color: vehicle.color,
        renavam: vehicle.renavam,
        chassis: vehicle.chassis,
        sector_id: vehicle.sectorId || null,
        responsible_person_id: vehicle.responsiblePersonId || null,
        document_url: vehicle.documentUrl,
        document_name: vehicle.documentName,
        vehicle_image_url: vehicle.vehicleImageUrl,
        status: vehicle.status,
        maintenance_status: vehicle.maintenanceStatus,
        fuel_types: vehicle.fuelTypes,
        request_manager_ids: vehicle.requestManagerIds || [],
        max_kml: vehicle.maxKml,
        min_kml: vehicle.minKml,
        current_km: vehicle.currentKm,
        oil_last_change: vehicle.oilLastChange,
        oil_next_change: vehicle.oilNextChange,
        oil_calculation_base: vehicle.oilCalculationBase
    };

    const { data, error } = await supabase
        .from('vehicles')
        .update(dbVehicle)
        .eq('id', vehicle.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating vehicle:', error);
        return null;
    }

    return {
        id: data.id,
        type: data.type,
        model: data.model,
        plate: data.plate,
        brand: data.brand,
        year: data.year,
        color: data.color,
        renavam: data.renavam,
        chassis: data.chassis,
        sectorId: data.sector_id,
        responsiblePersonId: data.responsible_person_id,
        documentUrl: data.document_url,
        documentName: data.document_name,
        vehicleImageUrl: data.vehicle_image_url,
        status: data.status,
        maintenanceStatus: data.maintenance_status,
        fuelTypes: data.fuel_types,
        requestManagerIds: data.request_manager_ids || [],
        maxKml: data.max_kml,
        minKml: data.min_kml,
        currentKm: data.current_km,
        oilLastChange: data.oil_last_change,
        oilNextChange: data.oil_next_change,
        oilCalculationBase: data.oil_calculation_base
    };
};

export const deleteVehicle = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) {
        console.error('Error deleting vehicle:', error);
        return false;
    }
    return true;
};

// Brands
export const getBrands = async (): Promise<VehicleBrand[]> => {
    const { data, error } = await supabase.from('vehicle_brands').select('*').order('name');
    if (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
    return data || [];
};

export const createBrand = async (brand: VehicleBrand): Promise<VehicleBrand | null> => {
    const { data, error } = await supabase
        .from('vehicle_brands')
        .insert([{ name: brand.name, category: brand.category }])
        .select()
        .single();

    if (error) {
        console.error('Error creating brand:', error);
        return null;
    }
    return data;
};

export const deleteBrand = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('vehicle_brands').delete().eq('id', id);
    if (error) {
        console.error('Error deleting brand:', error);
        return false;
    }
    return true;
};

// Signatures
export const getSignatures = async (): Promise<Signature[]> => {
    const { data, error } = await supabase.from('signatures').select('*').order('name');
    if (error) {
        console.error('Error fetching signatures:', error);
        return [];
    }
    return data || [];
};

export const createSignature = async (signature: Signature): Promise<Signature | null> => {
    const { data, error } = await supabase
        .from('signatures')
        .insert([{
            name: signature.name,
            role: signature.role,
            sector: signature.sector
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating signature:', error);
        return null;
    }
    return data;
};

export const updateSignature = async (signature: Signature): Promise<Signature | null> => {
    const { data, error } = await supabase
        .from('signatures')
        .update({
            name: signature.name,
            role: signature.role,
            sector: signature.sector
        })
        .eq('id', signature.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating signature:', error);
        return null;
    }
    return data;
};

export const deleteSignature = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('signatures').delete().eq('id', id);
    if (error) {
        console.error('Error deleting signature:', error);
        return false;
    }
    return true;
};

// Users
export const getUsers = async (): Promise<any[]> => {
    const { data, error } = await supabase.from('profiles').select('*').order('name');
    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }
    return data || [];
};

