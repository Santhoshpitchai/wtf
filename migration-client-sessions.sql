-- Migration: Add client_sessions table for session status tracking
-- This table tracks the session status for each client

-- Create client_sessions table
CREATE TABLE IF NOT EXISTS public.client_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'booked', 'confirmed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_sessions_client_id ON public.client_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_status ON public.client_sessions(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all client sessions
CREATE POLICY "Allow authenticated users to read client sessions"
  ON public.client_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert client sessions
CREATE POLICY "Allow authenticated users to insert client sessions"
  ON public.client_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update client sessions
CREATE POLICY "Allow authenticated users to update client sessions"
  ON public.client_sessions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_sessions_updated_at
  BEFORE UPDATE ON public.client_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_client_sessions_updated_at();

-- Insert initial records for existing clients
INSERT INTO public.client_sessions (client_id, status)
SELECT id, 'pending'
FROM public.clients
WHERE id NOT IN (SELECT client_id FROM public.client_sessions)
ON CONFLICT (client_id) DO NOTHING;

COMMENT ON TABLE public.client_sessions IS 'Tracks session status for each client';
COMMENT ON COLUMN public.client_sessions.status IS 'Session status: pending (not yet scheduled), booked (scheduled but not confirmed), confirmed (confirmed and ready)';
