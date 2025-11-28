#!/usr/bin/env node
/**
 * Invoice Table Migration Helper
 * 
 * This script helps you apply the invoice table migration to Supabase.
 * It provides the SQL and guides you through the process.
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1]
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkMigrationStatus() {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id')
      .limit(1)

    if (error) {
      if (error.message.includes('does not exist')) {
        return 'NOT_APPLIED'
      }
      return 'ERROR'
    }
    return 'APPLIED'
  } catch (error) {
    return 'ERROR'
  }
}

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('  📊 INVOICE TABLE MIGRATION')
  console.log('='.repeat(70))
  
  const status = await checkMigrationStatus()
  
  if (status === 'APPLIED') {
    console.log('\n✅ Migration Status: ALREADY APPLIED')
    console.log('   The invoices table exists and is ready to use.\n')
    
    console.log('🔍 Running verification...\n')
    const { spawn } = require('child_process')
    const verify = spawn('node', ['scripts/run-invoice-migration.js'], {
      stdio: 'inherit'
    })
    
    verify.on('close', () => {
      console.log('\n✅ Migration is complete and verified!')
    })
    
    return
  }
  
  console.log('\n📋 Migration Status: NOT YET APPLIED')
  console.log('   The invoices table needs to be created.\n')
  
  console.log('='.repeat(70))
  console.log('  🎯 HOW TO APPLY THE MIGRATION')
  console.log('='.repeat(70))
  
  console.log('\n📌 STEP 1: Open Supabase SQL Editor')
  console.log('   Click this link or copy to browser:')
  console.log('   👉 https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n')
  
  console.log('📌 STEP 2: Copy the SQL below')
  console.log('   The migration SQL is displayed below.')
  console.log('   Select all and copy (Ctrl+A, Ctrl+C)\n')
  
  console.log('📌 STEP 3: Paste and Run')
  console.log('   Paste into the SQL editor and click "Run" (or Ctrl+Enter)\n')
  
  console.log('📌 STEP 4: Verify')
  console.log('   After running, execute: node scripts/migrate-invoices.js\n')
  
  console.log('='.repeat(70))
  console.log('  📄 MIGRATION SQL (Copy everything below)')
  console.log('='.repeat(70))
  console.log('')
  
  // Read and display the migration SQL
  const migrationPath = path.join(process.cwd(), 'migration-invoices.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
  
  console.log(migrationSQL)
  
  console.log('')
  console.log('='.repeat(70))
  console.log('  📄 END OF SQL (Copy everything above)')
  console.log('='.repeat(70))
  
  console.log('\n💡 What this migration creates:')
  console.log('   ✓ invoices table with 14 columns')
  console.log('   ✓ 3 indexes for performance')
  console.log('   ✓ 4 RLS policies (admin-only access)')
  console.log('   ✓ Automatic timestamp updates')
  console.log('   ✓ Foreign key to clients table')
  console.log('   ✓ Check constraints for data validation\n')
  
  console.log('📚 For more details, see: INVOICE_MIGRATION_GUIDE.md\n')
}

main().catch(console.error)
