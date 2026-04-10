CREATE TABLE contact (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_contact_user_name ON contact (user_id, lower(name));

INSERT INTO contact (user_id, name)
SELECT src.user_id, src.name
FROM (
  SELECT DISTINCT user_id, btrim(counterparty) AS name
  FROM payable
  WHERE counterparty IS NOT NULL AND btrim(counterparty) <> ''
  UNION
  SELECT DISTINCT user_id, btrim(counterparty) AS name
  FROM receivable
  WHERE counterparty IS NOT NULL AND btrim(counterparty) <> ''
) AS src
ON CONFLICT DO NOTHING;

ALTER TABLE payable ADD COLUMN contact_id uuid REFERENCES contact(id) ON DELETE RESTRICT;
ALTER TABLE receivable ADD COLUMN contact_id uuid REFERENCES contact(id) ON DELETE RESTRICT;

UPDATE payable p
SET contact_id = c.id
FROM contact c
WHERE c.user_id = p.user_id
  AND p.counterparty IS NOT NULL
  AND btrim(p.counterparty) <> ''
  AND lower(c.name) = lower(btrim(p.counterparty));

UPDATE receivable r
SET contact_id = c.id
FROM contact c
WHERE c.user_id = r.user_id
  AND r.counterparty IS NOT NULL
  AND btrim(r.counterparty) <> ''
  AND lower(c.name) = lower(btrim(r.counterparty));

CREATE INDEX idx_payable_contact_id ON payable (contact_id);
CREATE INDEX idx_receivable_contact_id ON receivable (contact_id);