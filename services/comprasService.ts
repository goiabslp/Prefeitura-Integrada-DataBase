
import { supabase } from './supabaseClient';
import { Order } from '../types';
import { notificationService } from './notificationService';

export const getAllPurchaseOrders = async (lightweight = false): Promise<Order[]> => {
    let query = supabase
        .from('purchase_orders')
        .select(`
            id, protocol, title, status, status_history, created_at, user_id, user_name, purchase_status, budget_file_url, completion_forecast, attachments, document_snapshot
        `)
        .order('created_at', { ascending: false });

    // Optional: pagination limits for lightweight fetches could be added here
    if (lightweight) {
        query = query.limit(50); // Safe limit for initial load
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching purchase orders:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        protocol: item.protocol,
        title: item.title,
        status: item.status,
        purchaseStatus: item.purchase_status,
        statusHistory: item.status_history,
        createdAt: item.created_at,
        userId: item.user_id,
        userName: item.user_name,
        blockType: 'compras',
        documentSnapshot: item.document_snapshot, // Undefined if lightweight is true
        budgetFileUrl: item.budget_file_url,
        attachments: item.attachments,
        completionForecast: item.completion_forecast
    }));
};

export const getPurchaseOrderById = async (id: string): Promise<Order> => {
    const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;

    return {
        id: data.id,
        protocol: data.protocol,
        title: data.title,
        status: data.status,
        purchaseStatus: data.purchase_status,
        statusHistory: data.status_history,
        createdAt: data.created_at,
        userId: data.user_id,
        userName: data.user_name,
        blockType: 'compras',
        documentSnapshot: data.document_snapshot,
        budgetFileUrl: data.budget_file_url,
        attachments: data.attachments,
        completionForecast: data.completion_forecast
    };
};

export const savePurchaseOrder = async (order: Order): Promise<void> => {
    const dbOrder = {
        id: order.id,
        protocol: order.protocol,
        title: order.title,
        status: order.status,
        purchase_status: order.purchaseStatus,
        status_history: order.statusHistory,
        created_at: order.createdAt,
        user_id: order.userId,
        user_name: order.userName,
        document_snapshot: order.documentSnapshot,
        budget_file_url: order.budgetFileUrl,
        attachments: order.attachments,
        completion_forecast: order.completionForecast
    };

    const { error } = await supabase.from('purchase_orders').upsert(dbOrder);
    if (error) throw error;
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (error) throw error;
};

export const updateAttachments = async (id: string, attachments: any[]): Promise<void> => {
    const { error } = await supabase
        .from('purchase_orders')
        .update({ attachments: attachments })
        .eq('id', id);
    if (error) throw error;
};

export const updatePurchaseStatus = async (id: string, status: string, historyEntry: any | null, budgetFileUrl?: string): Promise<void> => {
    // 1. Fetch current history to ensure we append to the latest version (Atomicity improvement)
    const { data: current, error: fetchError } = await supabase
        .from('purchase_orders')
        .select('status_history')
        .eq('id', id)
        .single();

    if (fetchError) throw fetchError;

    const currentHistory = current?.status_history || [];
    const newHistory = historyEntry ? [...currentHistory, historyEntry] : currentHistory;

    const updatePayload: any = {
        purchase_status: status,
        status_history: newHistory
    };

    if (budgetFileUrl) {
        updatePayload.budget_file_url = budgetFileUrl;
    }

    const { error } = await supabase
        .from('purchase_orders')
        .update(updatePayload)
        .eq('id', id);

    if (error) throw error;

    // Notification Trigger
    // Fetch order to get user_id notification target
    const { data: order } = await supabase.from('purchase_orders').select('user_id, protocol, title').eq('id', id).single();

    if (order && order.user_id) {

        let type = 'info';
        if (status === 'concluido' || status === 'realizado') type = 'success';
        if (status === 'cancelado') type = 'error';

        await notificationService.createNotification({
            user_id: order.user_id,
            title: 'Atualização de Pedido de Compra',
            message: `O pedido ${order.protocol} (${order.title}) mudou para: ${status}`,
            type: type as any,
            link: '/Compras' // or specific link
        });
    }
};
