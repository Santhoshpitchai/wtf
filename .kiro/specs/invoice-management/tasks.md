# Implementation Plan

- [x] 1. Set up database schema and types
  - [x] 1.1 Create invoices table migration
    - Write SQL migration file for invoices table with all fields and constraints
    - Add indexes for client_id, invoice_number, and created_at
    - Add RLS policies for admin-only access
    - _Requirements: 1.5, 6.1, 6.2_

  - [x] 1.2 Add Invoice TypeScript interfaces
    - Add Invoice, InvoiceFormData, and InvoiceEmailData interfaces to types/index.ts
    - Ensure type safety for all invoice operations
    - _Requirements: 1.1, 1.5_

- [x] 2. Implement invoice number generation utility
  - [x] 2.1 Create invoice number generator function
    - Write function to generate unique invoice numbers in format INV-YYYYMMDD-XXXX
    - Implement sequential numbering logic with database query
    - Handle date rollover and sequence reset
    - _Requirements: 6.1, 6.2_

  - [ ]* 2.2 Write property test for invoice number generation
    - **Property 14: Invoice number format and uniqueness**
    - **Validates: Requirements 6.1, 6.2**

- [x] 3. Create PDF generation service
  - [x] 3.1 Implement PDF generator with Puppeteer
    - Create lib/pdf-generator.ts with invoice PDF generation function
    - Design HTML template with letterhead, client details, and payment table
    - Implement currency formatting with ₹ symbol and 2 decimal places
    - Implement date formatting as DD/MM/YYYY
    - Handle logo loading and embedding
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.3, 7.4_

  - [ ]* 3.2 Write property test for PDF content completeness
    - **Property 5: Invoice PDF contains complete letterhead**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 3.3 Write property test for payment details in PDF
    - **Property 6: Invoice PDF contains all required payment details**
    - **Validates: Requirements 3.1, 3.2, 3.4, 7.4**

  - [ ]* 3.4 Write property test for date formatting
    - **Property 7: Payment date formatting consistency**
    - **Validates: Requirements 3.3**

  - [ ]* 3.5 Write property test for total calculation
    - **Property 8: Total amount calculation correctness**
    - **Validates: Requirements 3.5**

  - [ ]* 3.6 Write property test for currency formatting
    - **Property 17: Currency formatting consistency**
    - **Validates: Requirements 7.3**

  - [ ]* 3.7 Write property test for PDF structure
    - **Property 16: Invoice PDF structure completeness**
    - **Validates: Requirements 7.1**

- [x] 4. Implement invoice creation API endpoint
  - [x] 4.1 Create POST /api/invoices route
    - Implement API route handler in app/api/invoices/route.ts
    - Add request validation for all required fields
    - Implement invoice number generation
    - Create database record with invoice data
    - Generate PDF using pdf-generator service
    - Send email with PDF attachment using lib/email.ts
    - Handle errors and set appropriate invoice status
    - Return success/error response
    - _Requirements: 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 8.1, 8.2_

  - [ ]* 4.2 Write property test for invoice creation
    - **Property 4: Invoice submission creates database record**
    - **Validates: Requirements 1.5**

  - [ ]* 4.3 Write property test for email delivery
    - **Property 9: Invoice email delivery with PDF attachment**
    - **Validates: Requirements 4.1**

  - [ ]* 4.4 Write property test for email format
    - **Property 10: Invoice email format completeness**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 4.5 Write property test for validation
    - **Property 18: Required field validation**
    - **Validates: Requirements 8.1**

- [x] 5. Implement invoice list API endpoint
  - [x] 5.1 Create GET /api/invoices route
    - Implement API route handler for fetching invoices
    - Add support for filtering by client_id and status
    - Implement pagination with limit and offset
    - Join with clients table to include client details
    - Sort by created_at descending
    - Return invoices array with total count
    - _Requirements: 5.1, 5.2_

  - [ ]* 5.2 Write property test for invoice sorting
    - **Property 11: Invoice history sorting order**
    - **Validates: Requirements 5.1**

  - [ ]* 5.3 Write property test for invoice list fields
    - **Property 12: Invoice history displays required fields**
    - **Validates: Requirements 5.2**

- [x] 6. Implement invoice resend API endpoint
  - [x] 6.1 Create POST /api/invoices/[id]/resend route
    - Implement API route handler in app/api/invoices/[id]/resend/route.ts
    - Fetch existing invoice from database
    - Regenerate PDF if needed
    - Resend email with PDF attachment
    - Update invoice status and email_sent_at timestamp
    - Return success/error response
    - _Requirements: 5.4_

- [-] 7. Create invoice management page UI
  - [x] 7.1 Create invoices dashboard page
    - Create app/dashboard/invoices/page.tsx
    - Implement ProtectedRoute wrapper with admin-only access
    - Add statistics cards showing total invoices, sent, failed
    - Create invoice history table with columns: invoice number, client name, amount paid, payment date, status
    - Implement search functionality by client name and invoice number
    - Add status filter dropdown (all, sent, failed, draft)
    - Implement pagination controls
    - Add "Create Invoice" button to open modal
    - Style with Tailwind CSS matching existing dashboard design
    - _Requirements: 5.1, 5.2, 5.3, 6.3_

  - [ ]* 7.2 Write property test for invoice number visibility
    - **Property 15: Invoice number visibility**
    - **Validates: Requirements 6.3**

- [x] 8. Create invoice creation modal component
  - [x] 8.1 Implement CreateInvoiceModal component
    - Create modal component with form fields
    - Add client selection dropdown with search functionality
    - Implement auto-population of client email and name on selection
    - Add amount paid input with validation (must be positive)
    - Add amount remaining input with validation (must be non-negative)
    - Add payment date picker
    - Add subscription months input
    - Display calculated total amount (paid + remaining)
    - Implement real-time validation with error messages
    - Highlight invalid fields with red border
    - Add submit and cancel buttons
    - Show loading state during submission
    - Display success/error messages
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 8.2 Write property test for client auto-population
    - **Property 1: Client selection auto-populates contact information**
    - **Validates: Requirements 1.2**

  - [ ]* 8.3 Write property test for amount paid validation
    - **Property 2: Amount paid validation rejects non-positive values**
    - **Validates: Requirements 1.3**

  - [ ]* 8.4 Write property test for amount remaining validation
    - **Property 3: Amount remaining validation accepts non-negative values**
    - **Validates: Requirements 1.4**

  - [ ]* 8.5 Write property test for validation error highlighting
    - **Property 19: Validation error field highlighting**
    - **Validates: Requirements 8.4**

- [x] 9. Create invoice details modal component
  - [x] 9.1 Implement InvoiceDetailsModal component
    - Create modal component to display full invoice details
    - Show all invoice fields: invoice number, client info, amounts, dates, status
    - Display email delivery status and timestamp
    - Add "Resend Email" button
    - Add "Close" button
    - Handle resend action with loading state
    - Display success/error messages for resend
    - _Requirements: 5.3, 5.4_

  - [ ]* 9.2 Write property test for invoice details display
    - **Property 13: Invoice details accessibility**
    - **Validates: Requirements 5.3**

- [ ] 10. Add navigation link to invoices page
  - [x] 10.1 Update Sidebar component
    - Add "Invoices" navigation item to components/Sidebar.tsx
    - Add appropriate icon (FileText or Receipt from lucide-react)
    - Ensure link is only visible to admin users
    - Position after "Payments" in navigation menu
    - _Requirements: 5.1_

- [x] 11. Run database migration
  - [x] 11.1 Execute invoices table migration
    - Run the SQL migration against Supabase database
    - Verify table creation and indexes
    - Test RLS policies
    - _Requirements: 1.5_

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. End-to-end testing and refinement
  - [x] 13.1 Test complete invoice creation flow
    - Test creating invoice with valid data
    - Verify database record creation
    - Verify email delivery
    - Verify PDF generation and content
    - _Requirements: All_

  - [x] 13.2 Test error handling scenarios
    - Test validation errors for invalid inputs
    - Test email failure handling
    - Test missing client email scenario
    - Test future date warning
    - _Requirements: 8.1, 8.2, 8.3, 4.4_

  - [x] 13.3 Test invoice history and resend
    - Test invoice list display and sorting
    - Test search and filtering
    - Test invoice details modal
    - Test resend functionality
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
