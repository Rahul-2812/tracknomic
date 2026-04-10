-- Wealth tracker schema (assets, payables, receivables, and valuation snapshots)

-- Allow wealth category kinds alongside the existing transaction types.
ALTER TABLE category DROP CONSTRAINT IF EXISTS category_type_check;
ALTER TABLE category
  ADD CONSTRAINT category_type_check
  CHECK (type IN ('INCOME', 'EXPENSE', 'ASSET', 'PAYABLE', 'RECEIVABLE'));

CREATE TABLE holding (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
  name text NOT NULL,
  platform text,
  note text,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_holding_user_category ON holding(user_id, category_id);

CREATE TABLE payable (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
  counterparty text,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  due_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING', 'PAID')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payable_user_status_due ON payable(user_id, status, due_date DESC);

CREATE TABLE receivable (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
  counterparty text,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  expected_on date NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING', 'RECEIVED')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_receivable_user_status_expected ON receivable(user_id, status, expected_on DESC);

-- Portfolio valuation snapshot.
-- When holding_id is NULL, total portfolio values are expected to be populated.
-- When holding_id is NOT NULL, value_cents is expected to be populated.
CREATE TABLE valuation_snapshot (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  holding_id uuid NULL REFERENCES holding(id) ON DELETE SET NULL,

  assets_cents bigint NULL,
  pending_payables_cents bigint NULL,
  pending_receivables_cents bigint NULL,
  net_worth_cents bigint NULL,
  total_portfolio_value_cents bigint NULL,

  value_cents bigint NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, snapshot_date, holding_id)
);

CREATE INDEX idx_valuation_snapshot_user_date ON valuation_snapshot(user_id, snapshot_date DESC);

