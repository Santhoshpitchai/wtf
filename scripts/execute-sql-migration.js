#!/usr/bin/env node
/**
 * Execute SQL Migration via PostgreSQL Connection
 * 
 * This script connects directly to the Supabase PostgreSQL database
 * and executes the invoice table migration.
 */

const { Client } = require('pg')
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

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1]

console.log('🚀 Executing Invoice Table Migration\n')
console.log('='.repeat(60))
console.log('📄 Migration: migration-invoices.sql')
console.log('🔗 Database: db.' + projectRef + '.supabase.co')
console.log('='.repeat(60))

// Note: We need the database password to connect directly
// Supabase doesn't expose this in environment variables for security
console.log('\n⚠️  Direct PostgreSQL connection requires database password')
console.log('   This is not available in environment variables for security.\n')

console.log('📋 Recommended Approach: Use Supabase Dashboard')
console.log('   1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
console.log('   2. Copy contents of migration-invoices.sql')
console.log('   3. Paste and click "Run"\n')

console.log('📋 Alternative: Use Supabase CLI')
console.log('   $ npm install -g supabase')
console.log('   $ supabase login')
console.log('   $ supabase link --project-ref ' + projectRef)
console.log('   $ supabase db push\n')

console.log('💡 The migration SQL is ready in: migration-invoices.sql')
console.log('   It includes:')
console.log('   - CREATE TABLE invoices with all fields')
console.log('   - 3 performance indexes')
console.log('   - 4 RLS policies (admin-only access)')
console.log('   - Automatic timestamp trigger\n')

console.log('✅ After running the migration, verify with:')
console.log('   $ node scripts/run-invoice-migration.js\n')

// Provide the SQL content for easy copying
console.log('='.repeat(60))
console.log('📋 MIGRATION SQL (copy this to Supabase Dashboard):')
console.log('='.repeat(60))

const migrationPath = path.join(process.cwd(), 'migration-invoices.sql')
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

console.log('\n' + migrationSQL)
console.log('\n' + '='.repeat(60))
console.log('📋 END OF MIGRATION SQL')
console.log('='.repeat(60))
