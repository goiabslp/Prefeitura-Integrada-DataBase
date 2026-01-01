
import { supabase } from './supabaseClient';
import { Order } from '../types';

export const getAllLicitacaoProcesses = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('licitacao_processes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching licitacao processes:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        protocol: item.protocol,
        title: item.title,
        status: item.status,
        stage: item.stage, // Custom field for Licitacao
        requestingSector: item.requesting_sector, // Custom field for Licitacao
        createdAt: item.created_at,
        userId: item.user_id,
        userName: item.user_name,
        blockType: 'licitacao',
        documentSnapshot: item.document_snapshot,
        statusHistory: item.status_history || [] // Assuming we might want history later
    }));
};

export const saveLicitacaoProcess = async (order: Order): Promise<void> => {
    // Basic mapping, assuming extra fields are in documentSnapshot or we extract them
    const currentStageIndex = order.documentSnapshot?.content.currentStageIndex || 0;
    const STAGES = ['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'];
    const currentStageTitle = STAGES[currentStageIndex] || 'Início';
    const requesterSector = order.documentSnapshot?.content.requesterSector || '';

    // We might need to ensure 'licitacao_processes' has these columns.
    // If not, we rely on document_snapshot for detailed data, but 'stage' and 'requesting_sector' are good for columns.

    const dbOrder = {
        id: order.id,
        protocol: order.protocol,
        title: order.title,
        status: order.status,
        stage: currentStageTitle,
        requesting_sector: requesterSector,
        created_at: order.createdAt,
        user_id: order.userId,
        user_name: order.userName,
        document_snapshot: order.documentSnapshot
    };

    const { error } = await supabase.from('licitacao_processes').upsert(dbOrder);
    if (error) throw error;
};

export const deleteLicitacaoProcess = async (id: string): Promise<void> => {
    const { error } = await supabase.from('licitacao_processes').delete().eq('id', id);
    if (error) throw error;
};
