-- Fix for RLS Policy Error When Adding Clients
-- Run this in your Supabase SQL Editor

-- First, let's update the INSERT policy for clients table
-- This allows authenticated users to insert clients

-- Drop existing insert policy
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;

-- Create new insert policy that's more permissive
CREATE POLICY "Authenticated users can insert clients" ON public.clients
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated'
  );

-- Also ensure the UPDATE policy is correct
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;

CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
