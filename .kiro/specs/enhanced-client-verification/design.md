# Design Document

## Overview

The enhanced client verification system improves the session initiation flow between personal trainers (PTs) and clients. When a PT clicks the START button for a client, the system sends a verification email to the client via Supabase/Resend. The client must click the verification link to approve the session before it can begin. This design ensures that sessions only start with explicit client consent and provides a secure, auditable verification process.

The system builds upon the existing session management infrastructure, enhancing the verification flow with better error handling, real-time status updates, and improved user experience for both PTs and clients.

## Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   PT Dashboard  │────────▶│  API Routes      │────────▶│   Supabase DB   │
│  (Start Session)│         │  - initiate      │         │  - clients      │
└─────────────────┘         │  - verify        │         │  - trainers     │
                            └──────────────────┘         │  - session_     │
                                     │                    │    confirmations│
                                     │                    └─────────────────┘
                                     ▼
                            ┌──────────────────┐
                            │  Email Service   │
                            │  (Resend)        │
                            └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  Client Email    │
                            │  (Verification)  │
                            └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  Verify Page     │
                            │  (Client UI)     │
                            └──────────────────┘
```

### Component Interaction Flow

1. **PT Initiates Session**: PT clicks START button on client card
2. **API Creates Verification**: Backend generates token, creates DB record
3. **Email Sent**: System sends verification email via Resend
4. **PT Polls**: Frontend polls database for approval status
5. **Client Clicks Link**: Client receives email and clicks verification link
6. **Verification Page**: Client sees verification UI and confirms
7. **API Verifies**: Backend validates token and updates status
8. **PT Notified**: Polling detects approval, UI updates to in-progress

## Components and Interfaces

### 1. Frontend Components

#### StartSessionPage Component
- **Location**: `app/dashboard/start-session/page.tsx`
- **Responsibilities**:
  - Display client cards with session information
  - Handle START button clicks
  - Manage session state (not_started, pending_approval, in_progress, completed)
  - Poll for verification status
  - Display real-time status updates
- **State Management**:
  - `clients`: Array of ClientWithSession objects
  - `loading`: Boolean for initial data fetch
  - `searchTerm`: String for filtering clients
  - `currentUser`: AuthUser object

#### VerifySessionPage Component
- **Location**: `app/verify-session/page.tsx`
- **Responsibilities**:
  - Extract verification token from URL
  - Call verification API
  - Display verification status (loading, success, error, expired, already_approved)
  - Show client and trainer information
- **State Management**:
  - `status`: Verification status enum
  - `message`: User-facing message
  - `clientName`: Client's full name
  - `trainerName`: Trainer's full name

### 2. API Routes

#### POST /api/initiate-session-verification
- **Location**: `app/api/initiate-session-verification/route.ts`
- **Input**:
  ```typescript
  {
    clientId: string,
    trainerId: string
  }
  ```
- **Output**:
  ```typescript
  {
    success: boolean,
    message: string,
    verificationUrl: string,
    confirmationId: string,
    emailSent: boolean,
    emailError?: string,
    devMode: boolean
  }
  ```
- **Responsibilities**:
  - Validate client and trainer exist
  - Generate cryptographic verification token
  - Create session_confirmations record
  - Send verification email via Resend
  - Handle email delivery failures
  - Return verification details

#### POST /api/verify-session
- **Location**: `app/api/verify-session/route.ts`
- **Input**:
  ```typescript
  {
    token: string
  }
  ```
- **Output**:
  ```typescript
  {
    success: boolean,
    message: string,
    client?: { full_name: string, client_id: string },
    trainer?: { first_name: string, last_name: string },
    confirmationId?: string,
    error?: string,
    expired?: boolean,
    alreadyApproved?: boolean
  }
  ```
- **Responsibilities**:
  - Validate verification token
  - Check expiration status
  - Check if already approved
  - Update confirmation status to approved
  - Record verification timestamp
  - Return client and trainer details

### 3. Database Schema

#### session_confirmations Table
```sql
CREATE TABLE session_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  trainer_id UUID NOT NULL REFERENCES trainers(id),
  verification_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_confirmations_token ON session_confirmations(verification_token);
CREATE INDEX idx_session_confirmations_status ON session_confirmations(status);
CREATE INDEX idx_session_confirmations_client_trainer ON session_confirmations(client_id, trainer_id);
```

### 4. Email Service Integration

#### Resend Email Service
- **Configuration**: Requires `RESEND_API_KEY` environment variable
- **From Address**: `WTF Fitness <onboarding@resend.dev>` (should be updated to verified domain)
- **Email Template**: HTML email with:
  - Client name
  - Trainer name
  - Verification button/link
  - Expiration notice (30 minutes)
  - Fallback plain text link

## Data Models

### ClientWithSession Interface
```typescript
interface ClientWithSession extends Client {
  total_duration: number           // Total session duration in days
  remaining_days: number            // Days remaining in session
  session_status: 'not_started' | 'in_progress' | 'completed' | 'pending_approval'
  session_start_time?: string       // ISO timestamp
  confirmation_id?: string          // UUID of session_confirmations record
  verification_url?: string         // Full verification URL
}
```

### SessionConfirmation Interface
```typescript
interface SessionConfirmation {
  id: string                        // UUID
  client_id: string                 // UUID reference to clients
  trainer_id: string                // UUID reference to trainers
  verification_token: string        // 64-character hex string
  status: 'pending' | 'approved' | 'expired'
  expires_at: string                // ISO timestamp
  verified_at?: string              // ISO timestamp
  created_at: string                // ISO timestamp
  updated_at: string                // ISO timestamp
}
```

### VerificationEmail Interface
```typescript
interface VerificationEmail {
  from: string                      // Sender email address
  to: string[]                      // Recipient email addresses
  subject: string                   // Email subject line
  html: string                      // HTML email body
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Token Uniqueness
*For any* two verification tokens generated by the system, the tokens should be different with overwhelming probability (collision probability < 2^-128)
**Validates: Requirements 5.1, 5.2**

### Property 2: Token Expiration Enforcement
*For any* verification token, if the current time is greater than the expires_at timestamp, then verification attempts should fail with an expired status
**Validates: Requirements 5.4, 5.5**

### Property 3: Single Approval Per Token
*For any* verification token, once it has been used to approve a session (status = 'approved'), subsequent verification attempts with the same token should return an already-approved status without modifying the database
**Validates: Requirements 3.3**

### Property 4: Email Delivery Idempotency
*For any* session initiation request, if email delivery fails, the system state should remain unchanged (session stays in not_started state) and the PT should be able to retry
**Validates: Requirements 6.2, 6.3, 8.1**

### Property 5: Verification Token Invalidation
*For any* client-trainer pair, when a new verification request is created, all previous pending verification tokens for that pair should become invalid (only the most recent token should work)
**Validates: Requirements 8.3, 8.4**

### Property 6: Polling Timeout Consistency
*For any* pending verification, if no approval is received within 5 minutes (60 polling attempts at 5-second intervals), the session status should automatically reset to not_started
**Validates: Requirements 4.3**

### Property 7: Status Transition Validity
*For any* session, the status transitions should follow the valid state machine: not_started → pending_approval → in_progress → completed, with the ability to reset from completed back to not_started
**Validates: Requirements 1.2, 4.1**

### Property 8: Verification URL Correctness
*For any* generated verification URL, the URL should contain the base application URL, the path '/verify-session', and a query parameter 'token' with the generated verification token
**Validates: Requirements 2.3**

## Error Handling

### Error Categories

#### 1. Email Delivery Errors
- **Scenario**: Resend API fails or is not configured
- **Handling**:
  - Log error details to console
  - Return error response to frontend
  - Display user-friendly message to PT
  - Keep session in not_started state
  - Allow PT to retry
- **Development Mode**: Log verification URL to console instead of failing

#### 2. Token Validation Errors
- **Scenario**: Invalid, expired, or already-used token
- **Handling**:
  - Return specific error type (invalid, expired, already_approved)
  - Display appropriate message to client
  - Update token status in database if expired
  - Provide guidance on next steps

#### 3. Database Errors
- **Scenario**: Database query fails or record not found
- **Handling**:
  - Log error with full context
  - Return 500 Internal Server Error
  - Display generic error message to user
  - Maintain data consistency (no partial updates)

#### 4. Polling Timeout
- **Scenario**: Client doesn't approve within 5 minutes
- **Handling**:
  - Stop polling after 60 attempts
  - Reset session to not_started
  - Display timeout message to PT
  - Allow PT to resend verification

#### 5. Network Errors
- **Scenario**: API request fails due to network issues
- **Handling**:
  - Retry polling on transient failures
  - Display connection error to user
  - Maintain current state until resolved

### Error Response Format

```typescript
interface ErrorResponse {
  error: string                     // User-facing error message
  code?: string                     // Machine-readable error code
  expired?: boolean                 // Token expiration flag
  alreadyApproved?: boolean         // Already approved flag
  details?: any                     // Additional error context (dev only)
}
```

## Testing Strategy

### Unit Testing

The system will use **Jest** and **React Testing Library** for unit testing.

#### Frontend Unit Tests
- Test START button click handler
- Test session status state transitions
- Test polling logic with mocked timers
- Test error message display
- Test verification page token extraction
- Test verification status rendering

#### Backend Unit Tests
- Test token generation produces 64-character hex strings
- Test expiration time calculation (30 minutes from now)
- Test email template generation with client/trainer names
- Test token validation logic
- Test status update logic

### Property-Based Testing

The system will use **fast-check** for property-based testing in TypeScript.

Each property-based test should run a minimum of 100 iterations to ensure comprehensive coverage.

#### Property Test 1: Token Uniqueness
```typescript
// Feature: enhanced-client-verification, Property 1: Token Uniqueness
// Generate 1000 tokens and verify no collisions
```

#### Property Test 2: Token Expiration Enforcement
```typescript
// Feature: enhanced-client-verification, Property 2: Token Expiration Enforcement
// Generate random timestamps and verify expiration logic
```

#### Property Test 3: Single Approval Per Token
```typescript
// Feature: enhanced-client-verification, Property 3: Single Approval Per Token
// Attempt multiple verifications with same token
```

#### Property Test 4: Email Delivery Idempotency
```typescript
// Feature: enhanced-client-verification, Property 4: Email Delivery Idempotency
// Simulate email failures and verify state consistency
```

#### Property Test 5: Verification Token Invalidation
```typescript
// Feature: enhanced-client-verification, Property 5: Verification Token Invalidation
// Create multiple tokens for same client-trainer pair
```

#### Property Test 6: Polling Timeout Consistency
```typescript
// Feature: enhanced-client-verification, Property 6: Polling Timeout Consistency
// Simulate polling with various timeout scenarios
```

#### Property Test 7: Status Transition Validity
```typescript
// Feature: enhanced-client-verification, Property 7: Status Transition Validity
// Generate random status transition sequences
```

#### Property Test 8: Verification URL Correctness
```typescript
// Feature: enhanced-client-verification, Property 8: Verification URL Correctness
// Generate random tokens and verify URL format
```

### Integration Testing

- Test complete flow from START button to session approval
- Test email delivery with Resend test mode
- Test database record creation and updates
- Test concurrent verification attempts
- Test retry scenarios after failures

### Manual Testing Checklist

- Verify email appearance in different email clients
- Test verification link on mobile devices
- Test expired link behavior
- Test already-approved link behavior
- Test PT dashboard updates in real-time
- Test multiple PTs with same client
- Test network disconnection scenarios

## Security Considerations

### Token Security
- Use `crypto.randomBytes(32)` for cryptographic randomness
- Store tokens as hex strings (64 characters)
- Implement single-use token policy
- Enforce 30-minute expiration
- Use HTTPS for all verification URLs

### Database Security
- Use parameterized queries to prevent SQL injection
- Implement Row Level Security (RLS) policies
- Index verification_token for fast lookups
- Limit token query attempts to prevent brute force

### Email Security
- Validate email addresses before sending
- Use verified sender domain in production
- Include unsubscribe mechanism if required
- Sanitize all user data in email templates

### API Security
- Validate all input parameters
- Implement rate limiting on verification endpoints
- Use CORS policies to restrict API access
- Log all verification attempts for audit trail

## Performance Considerations

### Polling Optimization
- 5-second polling interval balances responsiveness and server load
- 5-minute timeout prevents indefinite polling
- Consider WebSocket upgrade for real-time updates in future

### Database Optimization
- Index on verification_token for O(1) lookups
- Index on (client_id, trainer_id) for invalidation queries
- Implement cleanup job for expired confirmations
- Use database connection pooling

### Email Delivery
- Async email sending to avoid blocking API response
- Queue system for high-volume scenarios
- Retry logic for transient failures
- Monitor delivery rates and bounce rates

## Deployment Considerations

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
NEXT_PUBLIC_APP_URL=<application-base-url>
RESEND_API_KEY=<resend-api-key>
```

### Database Migrations
- Create session_confirmations table
- Add indexes for performance
- Set up RLS policies
- Create cleanup function for expired records

### Email Configuration
- Verify sender domain in Resend
- Update from address in code
- Test email delivery in staging
- Monitor email delivery metrics

### Monitoring
- Log all verification attempts
- Track email delivery success rate
- Monitor polling performance
- Alert on high error rates
- Track average time to approval
