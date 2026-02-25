
import { supabase } from './supabaseClient';
import { Order, InventoryItem, InventoryCategory } from '../types';
import { notificationService } from './notificationService';

import { handleSupabaseError } from '../utils/errorUtils';

export const getAllPurchaseOrders = async (lightweight = true, page = 0, limit = 1000): Promise<Order[]> => {
    // Select specific columns to reduce payload
    // We join with profiles using user_id foreign key to get the sector name
    const columns = lightweight
        ? `id, protocol, title, status, purchase_status, status_history, created_at, user_id, user_name, completion_forecast, budget_file_url,
           requester_name:document_snapshot->content->>requesterName,
           requester_sector:document_snapshot->content->>requesterSector,
           priority:document_snapshot->content->>priority,
           profiles:user_id(sector)`
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
        throw appError;
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
        documentSnapshot: lightweight ? {
            branding: {
                logoUrl: null,
                primaryColor: '#4f46e5',
                secondaryColor: '#0f172a',
                fontFamily: 'font-sans' as any,
                logoWidth: 76,
                logoAlignment: 'left' as any,
                watermark: {
                    enabled: false,
                    imageUrl: null,
                    opacity: 20,
                    size: 55,
                    grayscale: true
                }
            },
            document: {
                headerText: '',
                footerText: '',
                city: '',
                showDate: true,
                showPageNumbers: true,
                showSignature: false,
                showLeftBlock: true,
                showRightBlock: true,
                titleStyle: { size: 12, color: '#000000', alignment: 'left' as any },
                leftBlockStyle: { size: 10, color: '#000000' },
                rightBlockStyle: { size: 10, color: '#000000' }
            },
            ui: {
                loginLogoUrl: null,
                loginLogoHeight: 80,
                headerLogoUrl: null,
                headerLogoHeight: 40,
                homeLogoPosition: 'left' as any
            },
            content: {
                requesterName: item.requester_name,
                requesterSector: item.requester_sector || item.profiles?.sector,
                priority: item.priority
            }
        } as any : item.document_snapshot,
        budgetFileUrl: item.budget_file_url,
        attachments: item.attachments,
        completionForecast: item.completion_forecast,
        requestingSector: item.requester_sector || item.profiles?.sector
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

    // Backend Validation
    if (order.id) {
        const { data: current } = await supabase.from('purchase_orders').select('status').eq('id', order.id).single();
        if (current?.status === 'rejected' && order.status !== 'rejected') {
            throw new Error("Validação de Segurança: Pedido de compra rejeitado não pode ser editado nem modificado.");
        }
    }

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
    // Backend Validation
    const { data: current, error: fetchError } = await supabase.from('purchase_orders').select('status').eq('id', id).single();
    if (fetchError) throw fetchError;
    if (current?.status === 'rejected') {
        throw new Error("Validação de Segurança: Ação bloqueada em pedido rejeitado.");
    }

    const { error } = await supabase
        .from('purchase_orders')
        .update({ attachments: attachments })
        .eq('id', id);
    if (error) throw error;
};

export const updatePurchaseStatus = async (id: string, status: string, historyEntry: any | null, budgetFileUrl?: string): Promise<void> => {
    // 1. Fetch current history to ensure we append to the latest version + Backend Validation
    const { data: current, error: fetchError } = await supabase
        .from('purchase_orders')
        .select('status_history, status')
        .eq('id', id)
        .single();

    if (fetchError) throw fetchError;
    if (current?.status === 'rejected') {
        throw new Error("Validação de Segurança: Não é possível avançar etapas nem interagir com um pedido já rejeitado.");
    }

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

export const getInventoryItems = async (isTendered?: boolean, category?: string): Promise<InventoryItem[]> => {
    let query = supabase
        .from('procurement_inventory')
        .select('*')
        .order('created_at', { ascending: false });

    if (isTendered !== undefined) {
        query = query.eq('is_tendered', isTendered);
    }

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
        throw error;
    }
    return data as InventoryItem[];
};

export const addToInventory = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> => {
    const { data, error } = await supabase
        .from('procurement_inventory')
        .insert(item)
        .select()
        .single();

    if (error) throw error;
    return data as InventoryItem;
};

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
    const { data, error } = await supabase
        .from('procurement_inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as InventoryItem;
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('procurement_inventory')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

export const restoreItemToTendered = async (inventoryItemId: string): Promise<void> => {
    // 1. Get Inventory Item
    const { data: inventoryItem, error: invError } = await supabase
        .from('procurement_inventory')
        .select('*')
        .eq('id', inventoryItemId)
        .single();

    if (invError) throw invError;

    // 2. Update Inventory Status
    const { error: updateError } = await supabase
        .from('procurement_inventory')
        .update({ is_tendered: true })
        .eq('id', inventoryItemId);

    if (updateError) throw updateError;

    // 3. If linked to an order, restore it there too
    if (inventoryItem.original_order_protocol && inventoryItem.original_item_id) {
        // Fetch order
        const { data: order, error: orderError } = await supabase
            .from('purchase_orders')
            .select('*')
            .eq('protocol', inventoryItem.original_order_protocol)
            .single();

        if (order && !orderError && order.document_snapshot?.content?.purchaseItems) {
            const content = order.document_snapshot.content;
            const updatedItems = content.purchaseItems.map((item: any) => {
                if (item.id === inventoryItem.original_item_id) {
                    // Remove isTendered flag or set to true (removing false)
                    // We remove the flag so it returns to "default" state
                    const { isTendered, category, ...rest } = item;
                    return rest;
                }
                return item;
            });

            // Save updated order
            const updatedSnapshot = {
                ...order.document_snapshot,
                content: {
                    ...content,
                    purchaseItems: updatedItems
                }
            };

            const { error: saveError } = await supabase
                .from('purchase_orders')
                .update({ document_snapshot: updatedSnapshot })
                .eq('id', order.id);

            if (saveError) {
                console.error("Error updating original order on restore:", saveError);
                // We don't throw here to avoid rolling back the inventory change, 
                // but ideally we should confirm both. For now, best effort sync.
            }
        }
    }
};