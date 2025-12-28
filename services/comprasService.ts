
import { supabase } from './supabaseClient';
import { Order } from '../types';

export const getAllPurchaseOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

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
        documentSnapshot: item.document_snapshot,
        budgetFileUrl: item.budget_file_url,
        attachments: item.attachments,
        completionForecast: item.completion_forecast
    }));
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
