-- Leads table for contact form submissions
-- Part of Contact Form feature

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  school TEXT NOT NULL,
  undergraduate_year INTEGER NOT NULL,
  message TEXT,                         -- optional comments/questions
  status TEXT NOT NULL DEFAULT 'new',   -- new | contacted | resolved
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for admin queries (idempotent)
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make re-run safe
DROP POLICY IF EXISTS "Public can submit leads" ON leads;

-- Public can submit (INSERT only)
CREATE POLICY "Public can submit leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- No SELECT/UPDATE policy for anon = deny by default
-- Admin API uses service role key which bypasses RLS
