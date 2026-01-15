
import { supabase } from './supabaseClient';
import { Order } from '../types';
import { notificationService } from './notificationService';

import { handleSupabaseError } from '../utils/errorUtils';

export const getAllPurchaseOrders = async (lightweight = false, page = 0, limit = 50): Promise<Order[]> => {
    // Select specific columns to reduce payload
    // We join with profiles using user_id foreign key to get the sector name
    const columns = lightweight
        ? 'id, protocol, title, status, purchase_status, status_history, created_at, user_id, user_name, completion_forecast, budget_file_url, profiles:user_id(sector)'
        : '*, profiles:user_id(sector)';

    let query = supabase
        .from('purchase_orders')
        .select(columns)
        .order('created_at', { ascending: false });

    if (lightweight) {
        const from = page * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
        const appError = handleSupabaseError(error);
        console.error('[comprasService] Error:', appError.message);
        throw appError; // Throw so useQuery can handle isError
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
        documentSnapshot: item.document_snapshot, // Will be undefined if lightweight
        budgetFileUrl: item.budget_file_url,
        attachments: item.attachments,
        completionForecast: item.completion_forecast,
        // Map the joined sector. Supabase returns it as an object or array depending on relation.
        // Since user_id is FK to profiles.id (1:1 from order's perspective to user), it should be a single object.
        requestingSector: item.profiles?.sector
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

export const uploadPurchaseAttachment = async (blob: Blob, fileName: string): Promise<string> => {
    // 1. Upload file
    const { data, error } = await supabase.storage
        .from('chat-attachments') // Reusing existing bucket or create 'documents'
        .upload(`compras/${fileName}`, blob, {
            contentType: 'application/pdf',
            upsert: true
        });

    if (error) throw error;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(`compras/${fileName}`);

    return publicUrl;
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
