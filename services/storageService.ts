import { supabase } from './supabaseClient';

export const uploadFile = async (file: File, bucket: string = 'attachments', path?: string): Promise<string | null> => {
    try {
        // Generate a unique path if not provided
        const finalPath = path || `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(finalPath, file, {
                cacheControl: '3600',
                upsert: false // Prevent overwriting unless intended, usually safe to generate unique names
            });

        if (error) {
            console.error('Error uploading file:', error);
            // Fallback: If bucket doesn't exist? We assume it exists as per manual prerequisites.
            // If it returns "Bucket not found", we can't do much from client side without creating it via SQL or Dashboard.
            return null;
        }

        if (data) {
            const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(finalPath);

            return publicUrlData.publicUrl;
        }

        return null;
    } catch (e) {
        console.error('Exception in uploadFile:', e);
        return null;
    }
};
