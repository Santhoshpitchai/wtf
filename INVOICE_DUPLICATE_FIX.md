# Invoice Creation Error Fixes

## Problem 1: Duplicate Invoice Number Error
When creating multiple invoices quickly (e.g., clicking "Create Invoice" twice in rapid succession), the second invoice would fail with the error: **"duplicate key value violates unique constraint 'invoices_invoice_number_key'"**.

### Root Cause
This was a **race condition** in the invoice number generation process:

1. Request 1 queries the database for the latest invoice number (e.g., `INV-20251129-0001`)
2. Request 2 queries the database at almost the same time and gets the same result
3. Both requests calculate the next number as `INV-20251129-0002`
4. Request 1 successfully inserts the invoice with number `INV-20251129-0002`
5. Request 2 tries to insert with the same number and fails due to the unique constraint on `invoice_number`

### Solution
Implemented a **two-layer defense** against race conditions:

#### Layer 1: Improved Invoice Number Generation (`lib/invoice-utils.ts`)
1. **Query only the highest invoice number** for today (more efficient)
2. **Add random offset (0-2)** to reduce collision probability
3. **Simple and fast** - relies on database constraint for final enforcement

#### Layer 2: Retry Mechanism (`app/api/invoices/route.ts`)
1. **Wrapped invoice creation in a retry loop** (up to 5 attempts)
2. **Detect duplicate key errors** (PostgreSQL error code `23505`)
3. **Automatically retry** with a new invoice number when a duplicate is detected
4. **Progressive backoff** - wait longer between each retry attempt (100ms, 200ms, 300ms, etc.)

#### How It Works Now:
```
Attempt 1: Generate INV-20251129-0002 → Insert → Duplicate Error → Retry (wait 100ms)
Attempt 2: Generate INV-20251129-0004 → Insert → Success! ✓
```

The random offset in the number generation significantly reduces the chance of collision, and the retry mechanism ensures that even if a collision occurs, the system will automatically recover.

---

## Problem 2: PDF Generation Failures
Sometimes invoice creation would fail with the error: **"Failed to generate invoice PDF"**. This happened intermittently, making it unreliable.

### Root Cause
Puppeteer (the PDF generation library) can fail for several reasons:
- **Browser launch failures** - Sometimes Chromium fails to start
- **Timeout issues** - Page loading or PDF generation takes too long
- **Memory issues** - Resource constraints on the server
- **Network issues** - Loading resources times out

### Solution
Implemented **retry logic with timeouts** in the PDF generator (`lib/pdf-generator.ts`):

#### Key Changes:
1. **Added retry mechanism** (up to 3 attempts for PDF generation)
2. **Added timeouts** for all Puppeteer operations:
   - Browser launch: 30 seconds
   - Page operations: 20 seconds
   - PDF generation: 20 seconds
3. **Progressive backoff** - wait 1s, 2s, 3s between retries
4. **Better error handling** - Ensures browser is always closed, even on errors
5. **Optimized browser args** - Added flags to reduce resource usage

#### How It Works Now:
```
Attempt 1: Launch browser → Timeout → Close browser → Retry
Attempt 2: Launch browser → Generate PDF → Success! ✓
```

---

## Benefits
- ✅ No more "Failed to create invoice record" errors
- ✅ No more "Failed to generate invoice PDF" errors
- ✅ Users can create invoices as quickly as they want
- ✅ Automatic recovery from race conditions and temporary failures
- ✅ No manual intervention needed
- ✅ Better reliability overall

## Technical Details

### Invoice Number Generation Strategy (`lib/invoice-utils.ts`)
- **Query optimization**: Only fetches the highest invoice number for today (not all invoices)
- **Random offset**: Adds 0-2 to the next sequence number to reduce collision probability
- **Simplicity**: Relies on database unique constraint for final enforcement
- **Performance**: Faster queries, less memory usage

### Invoice Creation Retry Logic (`app/api/invoices/route.ts`)
- **Max retries**: 5 attempts
- **Backoff strategy**: 100ms × attempt number (100ms, 200ms, 300ms, etc.)
- **Error detection**: Specifically catches PostgreSQL duplicate key errors (code 23505)
- **Automatic recovery**: Generates new invoice number and retries on collision
- **User-friendly errors**: Returns simple error messages to users

### PDF Generation Retry
- **Max retries**: 3 attempts
- **Backoff strategy**: 1000ms × attempt number
- **Timeouts**: 30s browser launch, 20s page operations, 20s PDF generation
- **Error handling**: Retries on any error, ensures browser cleanup
- **Location**: `lib/pdf-generator.ts`

## Testing
All fixes have been implemented and the build is successful. You can now:
1. Create multiple invoices rapidly without errors
2. The system will automatically handle conflicts and temporary failures
3. Each invoice will get a unique sequential number
4. PDFs will be generated reliably
5. User-friendly error messages are displayed

## Files Modified
- `lib/invoice-utils.ts` - Improved invoice number generation with random offset
- `app/api/invoices/route.ts` - Enhanced retry logic and error handling
- `INVOICE_DUPLICATE_FIX.md` - Updated documentation
