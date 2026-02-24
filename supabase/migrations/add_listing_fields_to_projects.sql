-- Extend projects table to also store scraped listings
-- This unifies "projects" and "listings" into a single concept: "habitats"

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price TEXT,
  ADD COLUMN IF NOT EXISTS price_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS listing_type TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS contact TEXT,
  ADD COLUMN IF NOT EXISTS evaluation JSONB,
  ADD COLUMN IF NOT EXISTS tags JSONB;

-- Allow scraped listings without a user_id (no creator account)
ALTER TABLE projects ALTER COLUMN user_id DROP NOT NULL;

-- Index for filtering by source type
CREATE INDEX IF NOT EXISTS idx_projects_source_type ON projects(source_type);

-- Index for geographic queries
CREATE INDEX IF NOT EXISTS idx_projects_country ON projects(country);
