
import { supabase } from './supabaseClient';
import { Order } from '../types';

export const getAllLicitacaoProcesses = async (lightweight = true, page = 0, limit = 50): Promise<Order[]> => {
    const columns = lightweight
        ? 'id, protocol, title, status, stage, requesting_sector, created_at, user_id, user_name'
        : '*';

    let query = supabase
        .from('licitacao_processes')
        .select(columns)
        .order('created_at', { ascending: false });

    if (lightweight) {
        const from = page * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching licitacao processes:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        protocol: item.protocol,
        title: item.title,
        status: item.status,
        stage: item.stage,
        requestingSector: item.requesting_sector,
        createdAt: item.created_at,
        userId: item.user_id,
        userName: item.user_name,
        blockType: 'licitacao',
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
                requesterSector: item.requesting_sector
            }
        } as any : item.document_snapshot,
        statusHistory: item.status_history || []
    }));
};

export const getLicitacaoProcessById = async (id: string): Promise<Order> => {
    const { data, error } = await supabase
        .from('licitacao_processes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;

    return {
        id: data.id,
        protocol: data.protocol,
        title: data.title,
        status: data.status,
        stage: data.stage,
        requestingSector: data.requesting_sector,
        createdAt: data.created_at,
        userId: data.user_id,
        userName: data.user_name,
        blockType: 'licitacao',
        documentSnapshot: data.document_snapshot,
        statusHistory: data.status_history || []
    };
};

export const saveLicitacaoProcess = async (order: Order): Promise<void> => {
    // Basic mapping, assuming extra fields are in documentSnapshot or we extract them
    const currentStageIndex = order.documentSnapshot?.content.currentStageIndex || 0;
    const STAGES = ['Início', 'Etapa 01', 'Etapa 02', 'Etapa 03', 'Etapa 04', 'Etapa 05', 'Etapa 06'];

    // Logic: If we are at index 1 (meaning Início finished) but status is NOT approved,
    // we should still display 'Início' in the list.
    let currentStageTitle = STAGES[currentStageIndex] || 'Início';

    if (currentStageIndex === 1 && order.status !== 'approved' && order.status !== 'completed') {
        currentStageTitle = 'Início';
    }
    const requesterSector = order.documentSnapshot?.content.requesterSector || '';

    // We might need to ensure 'licitacao_processes' has these columns.
    // If not, we rely on document_snapshot for detailed data, but 'stage' and 'requesting_sector' are good for columns.

    const dbOrder = {
        id: order.id,
        protocol: order.documentSnapshot?.content.protocolId || order.protocol,
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
