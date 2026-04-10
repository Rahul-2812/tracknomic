-- User settings for the wealth tracker dashboard.

CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,

  summary_recipient_email text NOT NULL,

  assets_categories_enabled boolean NOT NULL DEFAULT true,
  payables_categories_enabled boolean NOT NULL DEFAULT true,
  receivables_categories_enabled boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now()
);

