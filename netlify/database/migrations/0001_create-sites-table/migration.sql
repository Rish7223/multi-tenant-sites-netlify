CREATE TABLE sites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain    TEXT NOT NULL UNIQUE
               CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
  company_name TEXT NOT NULL,
  logo         TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  custom_js    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);