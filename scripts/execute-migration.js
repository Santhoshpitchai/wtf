#!/usr/bin/env node
/**
 * Direct SQL Migration Executor
 * 
 * This script executes SQL migrations directly using Supabase's REST API
 */

const https = require('https')
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

// Read migration file
const migrationPath = path.join(process.cwd(), 'migration-invoices.sql')
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1]

console.log('🚀 Executing SQL migration directly...\n')

// Use Supabase Management API to execute SQL
const options = {
  hostname: `${projectRef}.supabase.co`,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`
  }
}

const postData = JSON.stringify({
  query: migrationSQL
})

const req = https.request(options, (res) => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration executed successfully!')
      console.log('\nRunning verification...')
      
      // Run verification script
      const { spawn } = require('child_process')
      const verify = spawn('node', ['scripts/run-invoice-migration.js'])
      
      verify.stdout.on('data', (data) => {
        process.stdout.write(data)
      })
      
      verify.stderr.on('data', (data) => {
        process.stderr.write(data)
      })
      
    } else {
      console.error('❌ Migration failed')
      console.error('Status:', res.statusCode)
      console.error('Response:', data)
      
      console.log('\n📋 Please run the migration manually:')
      console.log('   1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
      console.log('   2. Copy contents of migration-invoices.sql')
      console.log('   3. Paste and run in SQL editor')
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message)
  console.log('\n📋 Please run the migration manually using Supabase Dashboard')
})

req.write(postData)
req.end()
