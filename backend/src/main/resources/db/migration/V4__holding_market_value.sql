-- Add optional market value field for holdings (manual for now)
ALTER TABLE holding
  ADD COLUMN market_value_cents bigint NULL;

