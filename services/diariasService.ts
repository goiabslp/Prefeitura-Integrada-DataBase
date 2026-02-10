
import { supabase } from './supabaseClient';
import { Order } from '../types';
import * as counterService from './counterService';

export const getAllServiceRequests = async (lightweight = false, page = 0, pageSize = 20): Promise<Order[]> => {
    let query = supabase
        .from('service_requests')
        .select(`
            id, protocol, title, status, status_history, created_at, user_id, user_name, payment_status, payment_date
            ${lightweight
                ? ', requester_name:document_snapshot->content->>requesterName, destination:document_snapshot->content->>destination, departure_date:document_snapshot->content->>departureDateTime, return_date:document_snapshot->content->>returnDateTime, requester_sector:document_snapshot->content->>requesterSector, sub_type:document_snapshot->content->>subType'
                : ', document_snapshot'}
        `)
        .order('created_at', { ascending: false });

    if (lightweight) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching service requests:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        protocol: item.protocol,
        title: item.title,
        status: item.status,
        paymentStatus: item.payment_status,
        paymentDate: item.payment_date,
        statusHistory: item.status_history,
        createdAt: item.created_at,
        userId: item.user_id,
        userName: item.user_name,
        blockType: 'diarias',
        documentSnapshot: lightweight ? {
            branding: {} as any,
            document: {} as any,
            ui: {} as any,
            content: {
                title: item.title,
                protocol: item.protocol, // CRITICAL: Include protocol in document content
                subType: item.sub_type,   // CRITICAL: Include subType in document content
                body: '',
                signatureName: '',
                signatureRole: '',
                signatureSector: '',
                leftBlockText: '',
                rightBlockText: '',
                requesterName: item.requester_name,
                destination: item.destination,
                departureDateTime: item.departure_date,
                returnDateTime: item.return_date,
                requesterSector: item.requester_sector
            }
        } : item.document_snapshot
    }));
};

export const getServiceRequestById = async (id: string): Promise<Order> => {
    const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;

    return {
        id: data.id,
        protocol: data.protocol,
        title: data.title,
        status: data.status,
        paymentStatus: data.payment_status,
        paymentDate: data.payment_date,
        statusHistory: data.status_history,
        createdAt: data.created_at,
        userId: data.user_id,
        userName: data.user_name,
        blockType: 'diarias',
        documentSnapshot: data.document_snapshot
    };
};

export const saveServiceRequest = async (order: Order): Promise<Order> => {
    let currentOrder = { ...order };
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        const dbOrder = {
            id: currentOrder.id,
            protocol: currentOrder.protocol,
            title: currentOrder.title,
            status: currentOrder.status,
            payment_status: currentOrder.paymentStatus,
            payment_date: currentOrder.paymentDate,
            status_history: currentOrder.statusHistory,
            created_at: currentOrder.createdAt,
            user_id: currentOrder.userId,
            user_name: currentOrder.userName,
            document_snapshot: currentOrder.documentSnapshot
        };

        const { error } = await supabase.from('service_requests').upsert(dbOrder);

        if (!error) {
            return currentOrder;
        }

        if (error.code === '23505') { // Unique violation
            console.warn(`Duplicate protocol ${currentOrder.protocol} detected. Retrying... (Attempt ${attempts + 1}/${maxAttempts})`);
            attempts++;

            const year = new Date().getFullYear();
            const newCount = await counterService.incrementDiariasProtocolCount(year);
            const formattedNum = (newCount || 1).toString().padStart(3, '0');
            const newProtocol = `DIA-${formattedNum}/${year}`;

            currentOrder.protocol = newProtocol;

            // Update documentSnapshot if it exists and has content
            if (currentOrder.documentSnapshot && currentOrder.documentSnapshot.content) {
                currentOrder.documentSnapshot = {
                    ...currentOrder.documentSnapshot,
                    content: {
                        ...currentOrder.documentSnapshot.content,
                        protocol: newProtocol,
                        leftBlockText: `Solicitação Nº: ${newProtocol}`
                    }
                };
            }
        } else {
            throw error;
        }
    }

    throw new Error(`Failed to save service request after ${maxAttempts} attempts due to protocol uniqueness violations.`);
};

export const deleteServiceRequest = async (id: string): Promise<void> => {
    const { error } = await supabase.from('service_requests').delete().eq('id', id);
    if (error) throw error;
};
