#!/usr/bin/env node
/**
 * Apply Invoice Migration
 * 
 * This script applies the invoice table migration by executing SQL statements
 * using the Supabase service role connection.
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Applying Invoice Table Migration\n')
  console.log('='.repeat(60))
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migration-invoices.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration file loaded')
    console.log('🔗 Target database:', supabaseUrl)
    console.log('='.repeat(60))
    
    // Use Supabase's RPC to execute raw SQL
    console.log('\n⚙️  Executing migration via Supabase RPC...')
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      // RPC might not exist, try alternative method
      console.log('⚠️  Direct RPC not available:', error.message)
      console.log('\n📋 Manual migration required:')
      console.log('   1. Open Supabase Dashboard SQL Editor')
      console.log('   2. Go to: https://supabase.com/dashboard/project/prwvplpsdiuyslnojnei/sql/new')
      console.log('   3. Copy and paste the contents of migration-invoices.sql')
      console.log('   4. Click "Run" to execute')
      console.log('\n   OR use the Supabase CLI:')
      console.log('   $ supabase db push\n')
      
      return false
    }
    
    console.log('✅ Migration executed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    return false
  }
}

async function main() {
  const success = await applyMigration()
  
  if (success) {
    console.log('\n🔍 Running verification...\n')
    const { spawn } = require('child_process')
    const verify = spawn('node', ['scripts/run-invoice-migration.js'], {
      stdio: 'inherit'
    })
    
    verify.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Migration complete and verified!')
      }
    })
  } else {
    console.log('\n⏭️  Please apply the migration manually and then run:')
    console.log('   $ node scripts/run-invoice-migration.js')
    console.log('\n   to verify the migration.\n')
  }
}

main().catch(console.error)
