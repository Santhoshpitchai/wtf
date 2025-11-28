-- ============================================================================
-- Invoice Management System - Database Migration
-- ============================================================================
-- This migration creates the invoices table for tracking client payment invoices
-- with support for PDF generation and email delivery tracking.
-- ============================================================================

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
  amount_remaining DECIMAL(10, 2) NOT NULL CHECK (amount_remaining >= 0),
  total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (amount_paid + amount_remaining) STORED,
  payment_date DATE NOT NULL,
  subscription_months INTEGER NOT NULL CHECK (subscription_months > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'failed')),
  email_sent_at TIMESTAMP,
  pdf_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admin users can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admin users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admin users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admin users can delete invoices" ON public.invoices;

-- RLS Policy: Admin users can view all invoices
CREATE POLICY "Admin users can view all invoices"
  ON public.invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Admin users can insert invoices
CREATE POLICY "Admin users can insert invoices"
  ON public.invoices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Admin users can update invoices
CREATE POLICY "Admin users can update invoices"
  ON public.invoices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Admin users can delete invoices
CREATE POLICY "Admin users can delete invoices"
  ON public.invoices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- End of Migration
-- ============================================================================
