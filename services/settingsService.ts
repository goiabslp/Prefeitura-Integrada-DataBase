import { supabase } from './supabaseClient';
import { AppState } from '../types';

export const getGlobalSettings = async (): Promise<AppState | null> => {
    const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('id', 'global_config')
        .single();

    if (error) {
        console.error('Error fetching global settings from Supabase:', error);
        return null;
    }

    if (!data) return null;

    // Merge the JSONB columns back into the AppState structure
    // Note: 'content' usually isn't global setting, but we might want to preserve defaults if stored.
    // The implementations plan focused on branding and docConfig.
    // We'll reconstruct the AppState, spreading defaults if needed.

    return {
        branding: data.branding,
        document: data.document_config,
        ui: data.ui_config || {},
        content: {} as any // Content is usually per-session or cleared, so empty object or specific defaults
    } as AppState;
};

export const saveGlobalSettings = async (settings: AppState): Promise<boolean> => {
    const { error } = await supabase
        .from('organization_settings')
        .upsert({
            id: 'global_config',
            branding: settings.branding,
            document_config: settings.document,
            ui_config: settings.ui,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error saving global settings to Supabase:', error);
        return false;
    }
    return true;
};

export const uploadAsset = async (file: File, folder: 'logos' | 'watermarks' = 'logos'): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('document-assets')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Error uploading asset:', uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from('document-assets')
            .getPublicUrl(fileName);

        return data.publicUrl;
    } catch (err) {
        console.error('Unexpected error uploading asset:', err);
        return null;
    }
};
