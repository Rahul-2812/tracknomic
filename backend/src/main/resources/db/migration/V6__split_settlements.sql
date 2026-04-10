CREATE TABLE payment_mode (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_payment_mode_user_name ON payment_mode (user_id, lower(name));

INSERT INTO payment_mode (user_id, name)
SELECT u.id, defaults.name
FROM app_user u
CROSS JOIN (
  VALUES ('Cash'), ('UPI'), ('Bank Transfer'), ('Card'), ('Cheque')
) AS defaults(name)
ON CONFLICT DO NOTHING;

CREATE TABLE payable_payment (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payable_id uuid NOT NULL REFERENCES payable(id) ON DELETE CASCADE,
  payment_mode_id uuid NOT NULL REFERENCES payment_mode(id) ON DELETE RESTRICT,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  payment_date date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payable_payment_payable_date ON payable_payment (payable_id, payment_date ASC, created_at ASC);

CREATE TABLE receivable_payment (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  receivable_id uuid NOT NULL REFERENCES receivable(id) ON DELETE CASCADE,
  payment_mode_id uuid NOT NULL REFERENCES payment_mode(id) ON DELETE RESTRICT,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  payment_date date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_receivable_payment_receivable_date ON receivable_payment (receivable_id, payment_date ASC, created_at ASC);

ALTER TABLE payable DROP CONSTRAINT IF EXISTS payable_status_check;
ALTER TABLE payable
  ADD CONSTRAINT payable_status_check
  CHECK (status IN ('PENDING', 'PARTIAL', 'PAID'));

ALTER TABLE receivable DROP CONSTRAINT IF EXISTS receivable_status_check;
UPDATE receivable SET status = 'PAID' WHERE status = 'RECEIVED';
ALTER TABLE receivable
  ADD CONSTRAINT receivable_status_check
  CHECK (status IN ('PENDING', 'PARTIAL', 'PAID'));
