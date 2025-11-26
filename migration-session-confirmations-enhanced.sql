-- Enhanced Session Confirmations Schema
-- This migration enhances the session_confirmations table with additional indexes,
-- improved RLS policies, and cleanup functionality

-- ============================================================================
-- TABLE STRUCTURE (if not already created)
-- ============================================================================

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

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Index for fast token lookups (O(1) performance)
CREATE INDEX IF NOT EXISTS idx_session_confirmations_token 
  ON public.session_confirmations(verification_token);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_session_confirmations_status 
  ON public.session_confirmations(status);

-- Composite index for client-trainer pair queries (used for token invalidation)
-- This is critical for the requirement that only the most recent token should be valid
CREATE INDEX IF NOT EXISTS idx_session_confirmations_client_trainer 
  ON public.session_confirmations(client_id, trainer_id);

-- Individual indexes for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_session_confirmations_client_id 
  ON public.session_confirmations(client_id);

CREATE INDEX IF NOT EXISTS idx_session_confirmations_trainer_id 
  ON public.session_confirmations(trainer_id);

-- Index for cleanup queries (finding expired records)
CREATE INDEX IF NOT EXISTS idx_session_confirmations_expires_at 
  ON public.session_confirmations(expires_at) 
  WHERE status = 'pending';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE public.session_confirmations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow recreation with better security)
DROP POLICY IF EXISTS "Anyone can view session confirmations" ON public.session_confirmations;
DROP POLICY IF EXISTS "Authenticated users can insert session confirmations" ON public.session_confirmations;
DROP POLICY IF EXISTS "Anyone can update session confirmations" ON public.session_confirmations;

-- SELECT Policy: Authenticated users can view session confirmations
-- This allows both PTs and clients to check verification status
CREATE POLICY "Authenticated users can view session confirmations" 
  ON public.session_confirmations
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- INSERT Policy: Only authenticated users can create session confirmations
-- This ensures only logged-in PTs can initiate verification requests
CREATE POLICY "Authenticated users can insert session confirmations" 
  ON public.session_confirmations
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE Policy: Allow updates for verification and expiration
-- This is needed for both the verification endpoint (client approval) 
-- and the token invalidation process (marking old tokens as expired)
CREATE POLICY "Allow updates for verification" 
  ON public.session_confirmations
  FOR UPDATE 
  USING (
    -- Allow authenticated users to update
    auth.role() = 'authenticated'
  );

-- DELETE Policy: Only allow cleanup of old expired records
-- This is for the automated cleanup process
CREATE POLICY "Allow cleanup of expired records" 
  ON public.session_confirmations
  FOR DELETE 
  USING (
    status = 'expired' AND 
    expires_at < NOW() - INTERVAL '24 hours'
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Ensure updated_at timestamp is automatically updated
CREATE TRIGGER update_session_confirmations_updated_at 
  BEFORE UPDATE ON public.session_confirmations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================

-- Function to clean up expired session confirmations older than 24 hours
-- This helps maintain database performance by removing stale records
CREATE OR REPLACE FUNCTION cleanup_expired_session_confirmations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired confirmations that are more than 24 hours old
  DELETE FROM public.session_confirmations
  WHERE status = 'expired' 
    AND expires_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  RAISE NOTICE 'Cleaned up % expired session confirmations', deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_expired_session_confirmations() TO authenticated;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to invalidate previous pending tokens for a client-trainer pair
-- This ensures only the most recent verification token is valid
CREATE OR REPLACE FUNCTION invalidate_previous_verification_tokens(
  p_client_id UUID,
  p_trainer_id UUID,
  p_current_token TEXT
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark all previous pending tokens as expired
  UPDATE public.session_confirmations
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    client_id = p_client_id
    AND trainer_id = p_trainer_id
    AND status = 'pending'
    AND verification_token != p_current_token;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION invalidate_previous_verification_tokens(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.session_confirmations IS 
  'Tracks session verification requests sent to clients. Each record represents a verification email sent to a client for session approval.';

COMMENT ON COLUMN public.session_confirmations.verification_token IS 
  'Cryptographically secure 64-character hex token generated using crypto.randomBytes(32)';

COMMENT ON COLUMN public.session_confirmations.status IS 
  'Current status: pending (awaiting approval), approved (client verified), expired (token expired or invalidated)';

COMMENT ON COLUMN public.session_confirmations.expires_at IS 
  'Token expiration timestamp, set to 30 minutes from creation';

COMMENT ON COLUMN public.session_confirmations.verified_at IS 
  'Timestamp when client clicked verification link and approved the session';

COMMENT ON INDEX idx_session_confirmations_client_trainer IS 
  'Composite index for efficient token invalidation queries when new verification is requested';

COMMENT ON FUNCTION cleanup_expired_session_confirmations() IS 
  'Removes expired session confirmations older than 24 hours to maintain database performance';

COMMENT ON FUNCTION invalidate_previous_verification_tokens(UUID, UUID, TEXT) IS 
  'Marks previous pending tokens as expired when a new verification is requested for the same client-trainer pair';

