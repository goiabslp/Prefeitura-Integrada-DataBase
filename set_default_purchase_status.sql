-- Update purchase_orders table to have 'awaiting_approval' as the default status
ALTER TABLE purchase_orders 
ALTER COLUMN status SET DEFAULT 'awaiting_approval';

-- Also ensure existing records that might be null (though unlikely) are consistent if needed
-- UPDATE purchase_orders SET status = 'awaiting_approval' WHERE status IS NULL;
