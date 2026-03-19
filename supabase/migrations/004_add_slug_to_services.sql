-- The slug column was added directly to the live DB earlier.
-- This migration is idempotent for fresh environments.
ALTER TABLE services ADD COLUMN IF NOT EXISTS slug text;

UPDATE services
SET slug = lower(regexp_replace(title, '[^a-z0-9]+', '-', 'gi'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE services ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS services_slug_key ON services(slug);
