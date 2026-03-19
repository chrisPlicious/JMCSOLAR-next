CREATE TABLE IF NOT EXISTS service_details (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id   uuid NOT NULL UNIQUE REFERENCES services(id) ON DELETE CASCADE,
  tagline      text NOT NULL DEFAULT '',
  overview     text NOT NULL DEFAULT '',
  what_is_it   text NOT NULL DEFAULT '',
  how_it_works jsonb NOT NULL DEFAULT '[]',
  benefits     jsonb NOT NULL DEFAULT '[]',
  use_cases    jsonb NOT NULL DEFAULT '[]',
  specs        jsonb NOT NULL DEFAULT '[]',
  sources      jsonb NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE service_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read service_details"
  ON service_details FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Auth insert service_details"
  ON service_details FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update service_details"
  ON service_details FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth delete service_details"
  ON service_details FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_service_details_updated_at ON service_details;
CREATE TRIGGER update_service_details_updated_at
  BEFORE UPDATE ON service_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
