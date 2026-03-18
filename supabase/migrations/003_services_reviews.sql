-- ──────────────────────────────────────────────────────────────────────────────
-- 003_services_reviews.sql
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  icon         text        NOT NULL,
  title        text        NOT NULL,
  description  text        NOT NULL,
  highlight    bool        NOT NULL DEFAULT false,
  display_order int        NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id            uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_name text      NOT NULL,
  quote         text      NOT NULL,
  source        text      NOT NULL,
  rating        smallint  NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews  ENABLE ROW LEVEL SECURITY;

-- Public SELECT
CREATE POLICY "Public read services"
  ON services FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read reviews"
  ON reviews FOR SELECT TO anon, authenticated USING (true);

-- Authenticated write
CREATE POLICY "Auth insert services"
  ON services FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update services"
  ON services FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth delete services"
  ON services FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert reviews"
  ON reviews FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update reviews"
  ON reviews FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth delete reviews"
  ON reviews FOR DELETE TO authenticated USING (true);

-- ── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
