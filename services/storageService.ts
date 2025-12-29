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

            // Auto-create bucket if it doesn't exist
            if (error.message.includes('Bucket not found') || error.message.includes('The resource was not found') || (error as any).error === 'Bucket not found' || (error as any).statusCode === '404') {
                console.log(`Bucket '${bucket}' not found. Attempting to create it...`);
                const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(bucket, {
                    public: true,
                    fileSizeLimit: 10485760, // 10MB
                    allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf']
                });

                if (bucketError) {
                    console.error('Failed to create bucket:', bucketError);
                    alert('Erro: O bucket de armazenamento não existe e não pôde ser criado automaticamente. Contate o administrador.');
                    return null;
                }

                // Retry upload
                const { data: retryData, error: retryError } = await supabase.storage
                    .from(bucket)
                    .upload(finalPath, file, { cacheControl: '3600', upsert: false });

                if (retryError) {
                    console.error('Retry upload failed:', retryError);
                    return null;
                }

                if (retryData) {
                    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(finalPath);
                    return publicUrlData.publicUrl;
                }
            }
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
