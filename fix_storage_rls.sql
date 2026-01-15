-- FIX: Allow uploads to 'compras' folder in 'chat-attachments' bucket
-- Run this script in your Supabase Dashboard > SQL Editor

-- 1. Ensure the bucket exists (Optional, if you are sure it exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow Authenticated INSERT Compras" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated UPDATE Compras" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated SELECT Compras" ON storage.objects;

-- 3. Create INSERT Policy (Uploads)
CREATE POLICY "Allow Authenticated INSERT Compras"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = 'compras');

-- 4. Create UPDATE Policy (Upserts/Overwrites)
CREATE POLICY "Allow Authenticated UPDATE Compras"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = 'compras')
WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = 'compras');

-- 5. Create SELECT Policy (Downloads/Viewing)
CREATE POLICY "Allow Authenticated SELECT Compras"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = 'compras');
