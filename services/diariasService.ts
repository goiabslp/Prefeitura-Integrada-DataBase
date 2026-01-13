
import { supabase } from './supabaseClient';
import { Order } from '../types';

export const getAllServiceRequests = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('service_requests')
        .select(`
            id, protocol, title, status, status_history, created_at, user_id, user_name
        `)
        .order('created_at', { ascending: false });

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
        documentSnapshot: item.document_snapshot
    }));
};

export const saveServiceRequest = async (order: Order): Promise<void> => {
    const dbOrder = {
        id: order.id,
        protocol: order.protocol,
        title: order.title,
        status: order.status,
        payment_status: order.paymentStatus,
        payment_date: order.paymentDate,
        status_history: order.statusHistory,
        created_at: order.createdAt,
        user_id: order.userId,
        user_name: order.userName,
        document_snapshot: order.documentSnapshot
    };

    const { error } = await supabase.from('service_requests').upsert(dbOrder);
    if (error) throw error;
};

export const deleteServiceRequest = async (id: string): Promise<void> => {
    const { error } = await supabase.from('service_requests').delete().eq('id', id);
    if (error) throw error;
};
