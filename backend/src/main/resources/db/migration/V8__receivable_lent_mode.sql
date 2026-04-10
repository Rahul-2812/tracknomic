ALTER TABLE receivable
  ADD COLUMN lent_mode_id uuid REFERENCES payment_mode(id) ON DELETE SET NULL;
