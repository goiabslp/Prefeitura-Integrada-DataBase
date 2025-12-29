import { supabase } from './supabaseClient';

export const uploadFile = async (file: File, bucket: string = 'attachments', path?: string): Promise<string | null> => {
    try {
        // Generate a unique path if not provided
        const finalPath = path || `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(finalPath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Error uploading file:', error);

            // Check if bucket missing
            if (error.message.includes('Bucket not found') || error.message.includes('The resource was not found') || (error as any).error === 'Bucket not found' || (error as any).statusCode === '404') {

                // Try to create it
                const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(bucket, {
                    public: true,
                    fileSizeLimit: 10485760, // 10MB
                    allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf']
                });

                if (bucketError) {
                    console.error('Failed to create bucket:', bucketError);
                    alert(`Falha no Upload: O bucket '${bucket}' não existe e sua conta não tem permissão para criá-lo automaticamente via sistema.\n\nSolução: Acesse o painel do Supabase -> Storage -> Create New Bucket -> Name: '${bucket}' -> Public Bucket: ON.`);
                    return null;
                }

                // Retry upload
                const { data: retryData, error: retryError } = await supabase.storage
                    .from(bucket)
                    .upload(finalPath, file);

                if (retryError) {
                    alert(`Erro ao enviar arquivo (tentativa 2): ${retryError.message}`);
                    return null;
                }

                if (retryData) {
                    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(finalPath);
                    return publicUrlData.publicUrl;
                }
            } else {
                // Other error (Permission denied, etc.)
                alert(`Erro no Upload: ${error.message}`);
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
    } catch (e: any) {
        console.error('Exception in uploadFile:', e);
        alert(`Erro inesperado: ${e.message || 'Falha ao processar upload.'}`);
        return null;
    }
};
