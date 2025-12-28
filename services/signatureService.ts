
import { supabase } from './supabaseClient';

export interface SignatureLog {
    id: string;
    user_id: string;
    ip_address: string;
    document_title?: string;
    created_at: string;
}

export const createSignatureLog = async (userId: string, ipAddress: string, documentTitle?: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('signature_logs')
        .insert({
            user_id: userId,
            ip_address: ipAddress,
            document_title: documentTitle
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating signature log:', error);
        return null;
    }

    return data?.id || null;
};
