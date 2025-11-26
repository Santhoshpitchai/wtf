-- Session Confirmations Table
-- This table tracks session verification requests sent to clients

CREATE TABLE IF NOT EXISTS public.session_confirmations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  verification_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_session_confirmations_client_id ON public.session_confirmations(client_id);
CREATE INDEX idx_session_confirmations_trainer_id ON public.session_confirmations(trainer_id);
CREATE INDEX idx_session_confirmations_token ON public.session_confirmations(verification_token);
CREATE INDEX idx_session_confirmations_status ON public.session_confirmations(status);

-- Enable RLS
ALTER TABLE public.session_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view session confirmations" ON public.session_confirmations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert session confirmations" ON public.session_confirmations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update session confirmations" ON public.session_confirmations
  FOR UPDATE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_session_confirmations_updated_at 
  BEFORE UPDATE ON public.session_confirmations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
