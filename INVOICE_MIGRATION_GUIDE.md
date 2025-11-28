# Invoice Table Migration Guide

This guide explains how to apply the invoice management system database migration to your Supabase database.

## Migration Overview

The migration creates:
- **invoices table** with all required fields and constraints
- **3 indexes** for performance optimization
- **4 RLS policies** for admin-only access
- **Trigger** for automatic timestamp updates

## Option 1: Supabase Dashboard (Recommended - Easiest)

1. **Open the Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/prwvplpsdiuyslnojnei/sql/new

2. **Copy the migration SQL**
   - Open the file: `migration-invoices.sql`
   - Copy all contents (Ctrl+A, Ctrl+C)

3. **Paste and execute**
   - Paste into the SQL editor
   - Click the "Run" button (or press Ctrl+Enter)

4. **Verify success**
   - You should see "Success. No rows returned" message
   - Run verification: `node scripts/run-invoice-migration.js`

## Option 2: Supabase CLI

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project**
   ```bash
   supabase link --project-ref prwvplpsdiuyslnojnei
   ```

4. **Apply the migration**
   ```bash
   supabase db push --include-all
   ```
   
   Or manually:
   ```bash
   supabase db execute -f migration-invoices.sql
   ```

## Option 3: Direct PostgreSQL Connection

If you have the database password, you can connect directly:

```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@db.prwvplpsdiuyslnojnei.supabase.co:5432/postgres" -f migration-invoices.sql
```

## Verification

After applying the migration, verify it was successful:

```bash
node scripts/run-invoice-migration.js
```

This will check:
- ✅ Table exists and is accessible
- ✅ Indexes are created
- ✅ RLS policies are active
- ✅ Constraints are working

## Expected Output

When successful, you should see:

```
✅ Status: Migration ALREADY applied
   The invoices table exists and is accessible.

🔍 Verifying Migration
============================================================

1️⃣  Table Structure
   ✅ Table exists and is queryable

2️⃣  Indexes
   ✅ Indexes should be created by migration

3️⃣  Row Level Security (RLS)
   ✅ RLS is active (requires admin role)

4️⃣  Constraints
   ✅ All constraints active

============================================================
✅ Migration verification complete!
```

## Troubleshooting

### Error: "relation already exists"
- This is normal if the migration was already applied
- The migration uses `IF NOT EXISTS` clauses for idempotency
- You can safely re-run it

### Error: "permission denied"
- Make sure you're using an admin account in Supabase Dashboard
- Or use the service role key for CLI operations

### Error: "foreign key constraint"
- Ensure the `clients` table exists
- The invoices table references `public.clients(id)`

## What Gets Created

### Table: invoices
- `id` - UUID primary key
- `invoice_number` - Unique invoice identifier (INV-YYYYMMDD-XXXX)
- `client_id` - Foreign key to clients table
- `amount_paid` - Decimal(10,2) with CHECK >= 0
- `amount_remaining` - Decimal(10,2) with CHECK >= 0
- `total_amount` - Computed column (paid + remaining)
- `payment_date` - Date of payment
- `subscription_months` - Integer with CHECK > 0
- `status` - Enum: draft, sent, failed
- `email_sent_at` - Timestamp of email delivery
- `pdf_url` - URL to stored PDF (future use)
- `created_by` - User who created the invoice
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp (auto-updated)

### Indexes
1. `idx_invoices_client_id` - Fast lookups by client
2. `idx_invoices_invoice_number` - Fast lookups by invoice number
3. `idx_invoices_created_at` - Fast sorting by date (descending)

### RLS Policies
1. Admin users can SELECT all invoices
2. Admin users can INSERT invoices
3. Admin users can UPDATE invoices
4. Admin users can DELETE invoices

All policies check: `users.role = 'admin'`

## Next Steps

After successful migration:

1. ✅ Continue with invoice management implementation
2. ✅ Test invoice creation in the UI
3. ✅ Verify email delivery works
4. ✅ Test PDF generation

## Support

If you encounter issues:
1. Check the Supabase Dashboard logs
2. Verify your database connection
3. Ensure the `clients` table exists
4. Check that you have admin privileges
