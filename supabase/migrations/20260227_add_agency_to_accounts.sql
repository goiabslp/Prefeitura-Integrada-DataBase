-- Add agency column to purchase_accounts
ALTER TABLE public.purchase_accounts ADD COLUMN IF NOT EXISTS agency TEXT DEFAULT '' NOT NULL;

-- Backfill existing records with a placeholder agency to satisfy any future constraints if needed
UPDATE public.purchase_accounts 
SET agency = '0000' 
WHERE agency = '' OR agency IS NULL;

-- Add a CHECK constraint to ensure all mandatory fields have length > 0
ALTER TABLE public.purchase_accounts 
ADD CONSTRAINT purchase_accounts_mandatory_fields_check 
CHECK (
  LENGTH(TRIM(agency)) > 0 AND 
  LENGTH(TRIM(account_number)) > 0 AND 
  LENGTH(TRIM(description)) > 0 AND 
  LENGTH(TRIM(sector)) > 0
);
