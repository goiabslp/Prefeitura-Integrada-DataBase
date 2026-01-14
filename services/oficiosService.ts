
import { supabase } from './supabaseClient';
import { Order } from '../types';

export const getAllOficios = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('oficios')
        .select(`
            id, protocol, title, status, status_history, created_at, user_id, user_name, document_snapshot, description
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching oficios:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        protocol: item.protocol,
        title: item.title,
        status: item.status,
        statusHistory: item.status_history,
        createdAt: item.created_at,
        userId: item.user_id,
        userName: item.user_name,
        blockType: 'oficio', // Explicitly set block type
        documentSnapshot: item.document_snapshot,
        description: item.description
    }));
};

export const getOficioById = async (id: string): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('oficios')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching oficio details:', error);
        return null;
    }

    return {
        id: data.id,
        protocol: data.protocol,
        title: data.title,
        status: data.status,
        statusHistory: data.status_history,
        createdAt: data.created_at,
        userId: data.user_id,
        userName: data.user_name,
        blockType: 'oficio',
        documentSnapshot: data.document_snapshot,
        description: data.description
    };
};

export const saveOficio = async (order: Order): Promise<void> => {
    const dbOrder = {
        id: order.id,
        protocol: order.protocol,
        title: order.title,
        status: order.status,
        status_history: order.statusHistory,
        created_at: order.createdAt,
        user_id: order.userId,
        user_name: order.userName,
        document_snapshot: order.documentSnapshot,
        description: order.description
    };

    const { error } = await supabase.from('oficios').upsert(dbOrder);
    if (error) throw error;
};

export const updateOficioDescription = async (id: string, description: string): Promise<void> => {
    const { error } = await supabase.from('oficios').update({ description }).eq('id', id);
    if (error) throw error;
};

export const deleteOficio = async (id: string): Promise<void> => {
    const { error } = await supabase.from('oficios').delete().eq('id', id);
    if (error) throw error;
};
