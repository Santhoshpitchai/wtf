-- Migration: Add first_payment, payment_mode, balance, and session_type to clients table
-- Run this if you already have the clients table created

-- Add new columns
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS first_payment DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer', 'other')),
ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_type TEXT CHECK (session_type IN ('1 month', '3 months', '6 months', '12 months'));

-- Update existing rows to have default values
UPDATE public.clients 
SET first_payment = 0 
WHERE first_payment IS NULL;

UPDATE public.clients 
SET balance = 0 
WHERE balance IS NULL;
