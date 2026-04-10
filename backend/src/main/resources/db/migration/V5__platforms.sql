-- Configurable platforms per user
CREATE TABLE platform (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure platform name uniqueness per user (case-insensitive)
CREATE UNIQUE INDEX ux_platform_user_name_ci ON platform (user_id, lower(name));

