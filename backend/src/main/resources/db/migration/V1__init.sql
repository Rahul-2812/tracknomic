CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE app_user (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE category (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('INCOME','EXPENSE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, type)
);

CREATE TABLE transaction_entry (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  category_id uuid REFERENCES category(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('INCOME','EXPENSE')),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  occurred_on date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transaction_user_date ON transaction_entry(user_id, occurred_on DESC);

