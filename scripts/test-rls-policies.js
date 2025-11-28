#!/usr/bin/env node
/**
 * Test RLS Policies for Invoices Table
 * 
 * This script tests that RLS policies are properly configured
 * to restrict access to admin users only.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n🔐 Testing Invoice Table RLS Policies\n')
console.log('='.repeat(60))

async function testAnonAccess() {
  console.log('\n1️⃣  Testing Anonymous Access (should be BLOCKED)')
  
  const anonClient = createClient(supabaseUrl, supabaseAnonKey)
  
  // Test SELECT
  const { data: selectData, error: selectError } = await anonClient
    .from('invoices')
    .select('*')
    .limit(1)
  
  if (selectError) {
    console.log('   ✅ SELECT blocked:', selectError.message)
  } else {
    console.log('   ⚠️  SELECT allowed (returned', selectData?.length || 0, 'rows)')
  }
  
  // Test INSERT
  const { error: insertError } = await anonClient
    .from('invoices')
    .insert({
      invoice_number: 'TEST-ANON-' + Date.now(),
      client_id: '00000000-0000-0000-0000-000000000000',
      amount_paid: 100,
      amount_remaining: 0,
      payment_date: new Date().toISOString().split('T')[0],
      subscription_months: 1
    })
  
  if (insertError) {
    console.log('   ✅ INSERT blocked:', insertError.message)
  } else {
    console.log('   ⚠️  INSERT allowed (this should not happen!)')
  }
}

async function testServiceRoleAccess() {
  console.log('\n2️⃣  Testing Service Role Access (should be ALLOWED)')
  
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  
  // Test SELECT
  const { data: selectData, error: selectError } = await serviceClient
    .from('invoices')
    .select('*')
    .limit(1)
  
  if (selectError) {
    console.log('   ❌ SELECT failed:', selectError.message)
  } else {
    console.log('   ✅ SELECT allowed (service role bypasses RLS)')
  }
}

async function checkRLSStatus() {
  console.log('\n3️⃣  Checking RLS Configuration')
  
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  
  // Query pg_tables to check if RLS is enabled
  const { data, error } = await serviceClient
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .eq('schemaname', 'public')
    .eq('tablename', 'invoices')
  
  if (error) {
    console.log('   ⚠️  Cannot query pg_tables:', error.message)
  } else if (data && data.length > 0) {
    const rlsEnabled = data[0].rowsecurity
    if (rlsEnabled) {
      console.log('   ✅ RLS is ENABLED on invoices table')
    } else {
      console.log('   ❌ RLS is DISABLED on invoices table')
    }
  }
}

async function main() {
  await testAnonAccess()
  await testServiceRoleAccess()
  await checkRLSStatus()
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 RLS Test Summary')
  console.log('='.repeat(60))
  console.log('\nExpected behavior:')
  console.log('  ✓ Anonymous users: BLOCKED from all operations')
  console.log('  ✓ Service role: ALLOWED (bypasses RLS)')
  console.log('  ✓ Admin users: ALLOWED (via RLS policies)')
  console.log('  ✓ Regular users: BLOCKED (not admin)\n')
  
  console.log('Note: Service role key always bypasses RLS.')
  console.log('RLS policies only apply to anon and authenticated users.\n')
}

main().catch(console.error)
