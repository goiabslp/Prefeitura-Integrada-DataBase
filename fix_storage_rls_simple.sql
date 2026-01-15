-- SIMPLIFIED SCRIPT: Fix RLS Policies Only
-- Try running this if the full script times out.

-- 1. Create INSERT Policy (Allow Uploads)
-- Drop first to be safe
DROP POLICY IF EXISTS "Allow Authenticated INSERT Compras" ON storage.objects;

CREATE POLICY "Allow Authenticated INSERT Compras"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = 'compras');

-- 2. Create SELECT Policy (Allow Viewing)
DROP POLICY IF EXISTS "Allow Authenticated SELECT Compras" ON storage.objects;

CREATE POLICY "Allow Authenticated SELECT Compras"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = 'compras');

-- 3. Create UPDATE Policy (Allow Edits)
DROP POLICY IF EXISTS "Allow Authenticated UPDATE Compras" ON storage.objects;

CREATE POLICY "Allow Authenticated UPDATE Compras"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = 'compras')
WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = 'compras');
