-- Add stripe_subscription_id column to donations table for recurring donations
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Add index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_donations_stripe_subscription_id 
ON donations(stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN donations.stripe_subscription_id IS 'Stripe subscription ID for recurring donations';