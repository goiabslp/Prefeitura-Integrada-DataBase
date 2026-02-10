-- Fix duplicate protocols by appending a unique suffix to duplicates
-- Keeps the oldest record (based on created_at) intact and renames newer duplicates

UPDATE service_requests
SET protocol = protocol || '-DUP-' || substr(md5(random()::text), 1, 4)
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY protocol ORDER BY created_at ASC) as rnum
    FROM service_requests
  ) t
  WHERE t.rnum > 1
);
