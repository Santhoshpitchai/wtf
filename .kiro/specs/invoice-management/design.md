# Invoice Management System - Design Document

## Overview

The Invoice Management System enables administrators to generate professional, branded invoices for client payments and automatically deliver them via email. The system integrates with the existing Witness The Fitness application, leveraging Supabase for data persistence, the existing email infrastructure (Gmail SMTP/Resend), and Next.js for the frontend interface.

The system will generate PDF invoices containing payment details, client information, and branded letterhead, then send them as email attachments to clients' registered email addresses. Administrators will have access to an invoice history dashboard for tracking and management.

## Architecture

### Technology Stack

- Frontend: Next.js 14 with React, TypeScript, and Tailwind CSS
- Backend: Next.js API Routes
- Database: Supabase (PostgreSQL)
- Email: Existing email infrastructure (Gmail SMTP/Resend via lib/email.ts)
- PDF Generation: Puppeteer (already in dependencies)
- Authentication: Supabase Auth with existing ProtectedRoute component

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ Invoice Creation │         │ Invoice History  │         │
│  │      Form        │         │     List         │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                             │                    │
└───────────┼─────────────────────────────┼───────────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes Layer                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ /api/invoices    │  │ /api/invoices/   │                │
│  │ POST: Create     │  │ [id]/resend      │                │
│  │ GET: List        │  │ POST: Resend     │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
└───────────┼─────────────────────┼───────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                        │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Invoice          │  │ PDF Generator    │                │
│  │ Generator        │  │ (Puppeteer)      │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
└───────────┼─────────────────────┼───────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data & Services Layer                      │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Supabase DB      │  │ Email Service    │                │
│  │ (invoices table) │  │ (lib/email.ts)   │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Schema

#### Invoices Table

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
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

CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
```

### TypeScript Interfaces

```typescript
// types/index.ts additions

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  amount_paid: number
  amount_remaining: number
  total_amount: number
  payment_date: string
  subscription_months: number
  status: 'draft' | 'sent' | 'failed'
  email_sent_at?: string
  pdf_url?: string
  created_by?: string
  created_at: string
  updated_at: string
  client?: Client
}

export interface InvoiceFormData {
  client_id: string
  amount_paid: number
  amount_remaining: number
  payment_date: string
  subscription_months: number
}

export interface InvoiceEmailData {
  clientName: string
  clientEmail: string
  invoiceNumber: string
  amountPaid: number
  amountRemaining: number
  totalAmount: number
  paymentDate: string
  subscriptionMonths: number
}
```

### API Endpoints

#### POST /api/invoices

Creates a new invoice and sends it via email.

Request:
```typescript
{
  client_id: string
  amount_paid: number
  amount_remaining: number
  payment_date: string // ISO date format
  subscription_months: number
}
```

Response:
```typescript
{
  success: boolean
  invoice?: Invoice
  error?: string
}
```

#### GET /api/invoices

Retrieves invoice list with optional filtering.

Query Parameters:
- `client_id` (optional): Filter by client
- `status` (optional): Filter by status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

Response:
```typescript
{
  success: boolean
  invoices?: Invoice[]
  total?: number
  error?: string
}
```

#### POST /api/invoices/[id]/resend

Resends an existing invoice via email.

Response:
```typescript
{
  success: boolean
  error?: string
}
```

### Frontend Components

#### InvoicesPage Component
- Location: `app/dashboard/invoices/page.tsx`
- Displays invoice history table with search and filters
- Shows invoice statistics (total sent, pending, failed)
- Provides access to create new invoice modal

#### CreateInvoiceModal Component
- Modal form for creating new invoices
- Client selection dropdown (with search)
- Payment detail inputs with validation
- Real-time total calculation
- Submit and cancel actions

#### InvoiceDetailsModal Component
- Displays full invoice details
- Shows email delivery status
- Provides resend option
- Download PDF option (future enhancement)

### PDF Generation Service

#### Invoice Template

The PDF will be generated using Puppeteer with an HTML template:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Professional invoice styling */
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; }
    .letterhead { text-align: center; border-bottom: 3px solid #14b8a6; padding-bottom: 20px; }
    .logo { max-width: 200px; margin-bottom: 10px; }
    .company-name { font-size: 28px; font-weight: bold; color: #14b8a6; }
    .invoice-header { margin: 30px 0; }
    .invoice-number { font-size: 24px; font-weight: bold; }
    .details-section { margin: 20px 0; }
    .payment-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .payment-table th, .payment-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .total-row { font-weight: bold; font-size: 18px; background-color: #f0fdfa; }
  </style>
</head>
<body>
  <!-- Letterhead -->
  <div class="letterhead">
    <img src="[LOGO_URL]" alt="Witness The Fitness" class="logo" />
    <div class="company-name">WITNESS THE FITNESS</div>
  </div>
  
  <!-- Invoice Header -->
  <div class="invoice-header">
    <div class="invoice-number">Invoice #[INVOICE_NUMBER]</div>
    <div>Date: [PAYMENT_DATE]</div>
  </div>
  
  <!-- Client Details -->
  <div class="details-section">
    <h3>Bill To:</h3>
    <p><strong>[CLIENT_NAME]</strong></p>
    <p>[CLIENT_EMAIL]</p>
  </div>
  
  <!-- Payment Details -->
  <table class="payment-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Duration</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Training Session Package</td>
        <td>[SUBSCRIPTION_MONTHS] month(s)</td>
        <td>₹[TOTAL_AMOUNT]</td>
      </tr>
      <tr>
        <td colspan="2">Amount Paid</td>
        <td>₹[AMOUNT_PAID]</td>
      </tr>
      <tr>
        <td colspan="2">Amount Remaining</td>
        <td>₹[AMOUNT_REMAINING]</td>
      </tr>
      <tr class="total-row">
        <td colspan="2">Total Amount</td>
        <td>₹[TOTAL_AMOUNT]</td>
      </tr>
    </tbody>
  </table>
  
  <!-- Footer -->
  <div style="margin-top: 40px; text-align: center; color: #666;">
    <p>Thank you for your business!</p>
    <p>Witness The Fitness - Your Fitness Partner</p>
  </div>
</body>
</html>
```

## Data Models

### Invoice Number Generation

Format: `INV-YYYYMMDD-XXXX`
- `YYYY`: Year
- `MM`: Month
- `DD`: Day
- `XXXX`: Sequential 4-digit number for that day (0001, 0002, etc.)

Algorithm:
1. Get current date in YYYYMMDD format
2. Query database for highest invoice number with that date prefix
3. Extract sequence number and increment by 1
4. Pad to 4 digits with leading zeros
5. Combine: `INV-${dateStr}-${sequenceStr}`

### Invoice Status Flow

```
draft → sent → (resend) → sent
  ↓
failed → (resend) → sent
```

- `draft`: Invoice created but email not sent (error occurred)
- `sent`: Email successfully delivered
- `failed`: Email delivery failed

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Client selection auto-populates contact information
*For any* client selected in the invoice form, the system should automatically populate that client's registered email address and name in the form fields.
**Validates: Requirements 1.2**

### Property 2: Amount paid validation rejects non-positive values
*For any* amount paid input, the system should reject values that are less than or equal to zero and accept only positive numbers.
**Validates: Requirements 1.3**

### Property 3: Amount remaining validation accepts non-negative values
*For any* amount remaining input, the system should reject negative values and accept zero or positive numbers.
**Validates: Requirements 1.4**

### Property 4: Invoice submission creates database record
*For any* valid invoice form submission, the system should create a corresponding invoice record in the database with all submitted details.
**Validates: Requirements 1.5**

### Property 5: Invoice PDF contains complete letterhead
*For any* generated invoice PDF, the document should contain the Witness The Fitness logo, company name, and consistent letterhead formatting.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 6: Invoice PDF contains all required payment details
*For any* generated invoice PDF, the document should include amount paid, amount remaining, subscription duration in months, and client name and email in the header.
**Validates: Requirements 3.1, 3.2, 3.4, 7.4**

### Property 7: Payment date formatting consistency
*For any* invoice with a payment date, the date should be formatted as DD/MM/YYYY in the generated PDF.
**Validates: Requirements 3.3**

### Property 8: Total amount calculation correctness
*For any* invoice, the displayed total amount should equal the sum of amount paid and amount remaining.
**Validates: Requirements 3.5**

### Property 9: Invoice email delivery with PDF attachment
*For any* submitted invoice, the system should send an email to the client's registered email address with the invoice PDF as an attachment.
**Validates: Requirements 4.1**

### Property 10: Invoice email format completeness
*For any* invoice email sent, the email should include a subject line containing the invoice number and date, and a message body thanking the client for their payment.
**Validates: Requirements 4.2, 4.3**

### Property 11: Invoice history sorting order
*For any* invoice history page load, the displayed invoices should be sorted by creation date in descending order (newest first).
**Validates: Requirements 5.1**

### Property 12: Invoice history displays required fields
*For any* invoice in the history list, the display should show invoice number, client name, amount paid, payment date, and status.
**Validates: Requirements 5.2**

### Property 13: Invoice details accessibility
*For any* invoice clicked in the history, the system should display the complete invoice details including all payment information.
**Validates: Requirements 5.3**

### Property 14: Invoice number format and uniqueness
*For any* newly created invoice, the system should generate a unique invoice number in the format INV-YYYYMMDD-XXXX where XXXX is a sequential 4-digit number, and no duplicate invoice numbers should exist in the database.
**Validates: Requirements 6.1, 6.2**

### Property 15: Invoice number visibility
*For any* displayed invoice (in list or detail view), the invoice number should be prominently visible.
**Validates: Requirements 6.3**

### Property 16: Invoice PDF structure completeness
*For any* generated invoice PDF, the document should contain clearly defined sections for client details, payment details, and company information.
**Validates: Requirements 7.1**

### Property 17: Currency formatting consistency
*For any* amount displayed in an invoice, the value should be formatted with exactly two decimal places and the ₹ currency symbol.
**Validates: Requirements 7.3**

### Property 18: Required field validation
*For any* invoice form submission attempt with empty required fields, the system should prevent submission and display validation errors for the missing fields.
**Validates: Requirements 8.1**

### Property 19: Validation error field highlighting
*For any* validation error, the system should visually highlight the specific fields that require correction.
**Validates: Requirements 8.4**

## Error Handling

### Validation Errors

1. **Client Selection**
   - Error: No client selected
   - Response: Display "Please select a client" error message
   - Action: Prevent form submission

2. **Amount Validation**
   - Error: Amount paid ≤ 0
   - Response: Display "Amount paid must be greater than zero"
   - Action: Prevent form submission
   
   - Error: Amount remaining < 0
   - Response: Display "Amount remaining cannot be negative"
   - Action: Prevent form submission

3. **Date Validation**
   - Error: No payment date selected
   - Response: Display "Payment date is required"
   - Action: Prevent form submission
   
   - Warning: Payment date in future
   - Response: Display warning "Payment date is in the future. Continue?"
   - Action: Allow submission with confirmation

4. **Subscription Duration**
   - Error: Duration ≤ 0 or not a number
   - Response: Display "Subscription duration must be a positive number"
   - Action: Prevent form submission

5. **Client Email Missing**
   - Error: Selected client has no email address
   - Response: Display "Selected client does not have a registered email address"
   - Action: Prevent form submission

### Email Delivery Errors

1. **Email Service Unavailable**
   - Error: Email service returns error
   - Response: Save invoice with status 'failed', display error to admin
   - Action: Provide retry/resend option
   - Logging: Log full error details for debugging

2. **Invalid Email Address**
   - Error: Client email format invalid
   - Response: Display "Client email address is invalid"
   - Action: Prevent submission, suggest updating client record

3. **Email Timeout**
   - Error: Email service timeout
   - Response: Save invoice with status 'draft', notify admin
   - Action: Provide manual resend option

### PDF Generation Errors

1. **Puppeteer Initialization Failure**
   - Error: Cannot initialize Puppeteer
   - Response: Display "PDF generation service unavailable"
   - Action: Log error, notify admin, prevent invoice creation
   - Fallback: Queue for retry

2. **Template Rendering Error**
   - Error: HTML template fails to render
   - Response: Display "Invoice generation failed"
   - Action: Log error with invoice data, prevent submission

3. **Logo Loading Failure**
   - Error: Cannot load logo image
   - Response: Generate PDF without logo, log warning
   - Action: Continue with invoice creation, flag for review

### Database Errors

1. **Connection Failure**
   - Error: Cannot connect to Supabase
   - Response: Display "Database connection error. Please try again."
   - Action: Prevent submission, suggest retry

2. **Duplicate Invoice Number**
   - Error: Generated invoice number already exists
   - Response: Regenerate invoice number automatically
   - Action: Retry with new number (max 3 attempts)

3. **Foreign Key Violation**
   - Error: Client ID doesn't exist
   - Response: Display "Selected client no longer exists"
   - Action: Refresh client list, prevent submission

### Authorization Errors

1. **Unauthorized Access**
   - Error: Non-admin user attempts to access invoice features
   - Response: Redirect to dashboard with "Access denied" message
   - Action: Log unauthorized access attempt

2. **Session Expired**
   - Error: User session expired during invoice creation
   - Response: Display "Session expired. Please log in again."
   - Action: Redirect to login, preserve form data if possible

## Testing Strategy

### Unit Testing

The invoice management system will use unit tests to verify specific functionality and edge cases:

1. **Invoice Number Generation**
   - Test sequential numbering within same day
   - Test date rollover to new day
   - Test handling of gaps in sequence
   - Test maximum sequence number (9999)

2. **Validation Functions**
   - Test amount validation with boundary values (0, negative, positive)
   - Test date validation with past, present, and future dates
   - Test email format validation
   - Test required field checks

3. **PDF Template Rendering**
   - Test template with all fields populated
   - Test template with missing optional fields
   - Test currency formatting
   - Test date formatting

4. **Email Service Integration**
   - Test email sending with valid data
   - Test email failure handling
   - Test attachment inclusion
   - Test subject line and body formatting

### Property-Based Testing

The system will use property-based testing to verify universal properties across all inputs. We will use **fast-check** as the property-based testing library for TypeScript/JavaScript.

Each property-based test will:
- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with a comment referencing the specific correctness property from this design document
- Use the format: `**Feature: invoice-management, Property {number}: {property_text}**`

Property-based tests will cover:

1. **Data Integrity Properties**
   - Total amount always equals paid + remaining
   - Invoice numbers are always unique
   - All required fields are present in generated PDFs
   - Currency values always have exactly 2 decimal places

2. **Validation Properties**
   - Invalid inputs are always rejected
   - Valid inputs are always accepted
   - Error messages are always displayed for invalid inputs

3. **Business Logic Properties**
   - Invoice creation always results in database record
   - Email sending always updates invoice status
   - Date formatting is always consistent

4. **UI Behavior Properties**
   - Client selection always populates contact fields
   - Validation errors always highlight affected fields
   - Invoice list is always sorted by date descending

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Complete Invoice Creation Flow**
   - Admin logs in → navigates to invoices → creates invoice → verifies email sent → checks database

2. **Invoice History and Resend Flow**
   - Admin views invoice history → clicks invoice → views details → resends email

3. **Error Recovery Flow**
   - Email fails → invoice saved as failed → admin resends → status updates to sent

### Test Data Generation

For property-based testing, we will generate:
- Random client data (names, emails, IDs)
- Random payment amounts (within realistic ranges)
- Random dates (past, present, future)
- Random subscription durations (1-12 months)
- Edge cases (zero amounts, boundary dates, special characters)

## Security Considerations

1. **Authorization**
   - Only admin users can create and manage invoices
   - Use ProtectedRoute component with `allowedRoles={['admin']}`
   - Verify user role on all API endpoints

2. **Data Validation**
   - Sanitize all user inputs before database insertion
   - Validate client_id exists before creating invoice
   - Prevent SQL injection through parameterized queries (Supabase handles this)

3. **Email Security**
   - Validate email addresses before sending
   - Use existing email service configuration (Gmail SMTP/Resend)
   - Don't expose email service credentials in client-side code

4. **PDF Security**
   - Sanitize data before inserting into PDF template
   - Prevent XSS attacks in PDF generation
   - Store PDFs securely (future enhancement)

## Performance Considerations

1. **PDF Generation**
   - Puppeteer can be resource-intensive
   - Consider implementing queue for bulk invoice generation
   - Cache logo and template assets
   - Set reasonable timeout (30 seconds)

2. **Database Queries**
   - Use indexes on frequently queried fields (client_id, invoice_number, created_at)
   - Implement pagination for invoice history (50 items per page)
   - Use database-level sorting instead of client-side

3. **Email Delivery**
   - Implement async email sending to avoid blocking
   - Consider retry mechanism for failed emails
   - Log email delivery status for monitoring

## Future Enhancements

1. **PDF Storage**
   - Store generated PDFs in Supabase Storage
   - Provide download links in invoice history
   - Enable PDF preview without regeneration

2. **Bulk Invoice Generation**
   - Create multiple invoices at once
   - Import invoice data from CSV
   - Schedule recurring invoices

3. **Invoice Templates**
   - Multiple template designs
   - Customizable branding
   - Multi-language support

4. **Payment Integration**
   - Link invoices to payment records
   - Automatic invoice generation on payment
   - Payment reminder emails

5. **Reporting**
   - Invoice analytics dashboard
   - Revenue reports by period
   - Client payment history reports

6. **Invoice Editing**
   - Edit draft invoices before sending
   - Void/cancel sent invoices
   - Create credit notes
