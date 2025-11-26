# Implementation Plan

- [x] 1. Review and enhance database schema
  - Review existing session_confirmations table structure
  - Add any missing indexes for performance optimization
  - Ensure RLS policies are properly configured
  - _Requirements: 5.3_

- [x] 2. Enhance token generation and validation
- [x] 2.1 Implement cryptographically secure token generation
  - Update token generation to use crypto.randomBytes(32)
  - Ensure tokens are converted to 64-character hex strings
  - _Requirements: 1.4, 5.1, 5.2_

- [ ]* 2.2 Write property test for token uniqueness
  - **Property 1: Token Uniqueness**
  - **Validates: Requirements 5.1, 5.2**

- [x] 2.3 Implement expiration time calculation
  - Ensure expiration is set to exactly 30 minutes from creation
  - Use consistent timezone handling (UTC)
  - _Requirements: 1.5_

- [ ]* 2.4 Write property test for token expiration enforcement
  - **Property 2: Token Expiration Enforcement**
  - **Validates: Requirements 5.4, 5.5**

- [x] 3. Enhance email service integration
- [x] 3.1 Improve email template with all required information
  - Include client full name in email body
  - Include trainer full name in email body
  - Include clickable verification link
  - Display 30-minute expiration notice
  - Ensure HTML email is properly formatted
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3.2 Implement robust error handling for email delivery
  - Handle Resend API failures gracefully
  - Log error details for debugging
  - Return appropriate error responses
  - Maintain session state on failure
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 3.3 Write property test for email delivery idempotency
  - **Property 4: Email Delivery Idempotency**
  - **Validates: Requirements 6.2, 6.3, 8.1**

- [x] 3.4 Implement development mode logging
  - Log verification URL to console when RESEND_API_KEY is not configured
  - Provide clear instructions for email setup
  - _Requirements: 6.4_

- [ ]* 3.5 Write unit tests for email template generation
  - Test email contains client name
  - Test email contains trainer name
  - Test email contains verification link
  - Test email contains expiration notice
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Enhance verification API endpoint
- [x] 4.1 Implement comprehensive token validation
  - Validate token format and existence
  - Check token expiration status
  - Check if token already used
  - Update status to expired when appropriate
  - _Requirements: 3.1, 3.2, 3.3, 5.4, 5.5_

- [ ]* 4.2 Write property test for single approval per token
  - **Property 3: Single Approval Per Token**
  - **Validates: Requirements 3.3**

- [x] 4.3 Implement verification success handling
  - Update confirmation status to approved
  - Record verification timestamp
  - Return client and trainer details
  - _Requirements: 3.4, 3.5_

- [x] 4.4 Implement specific error responses
  - Return expired flag for expired tokens
  - Return alreadyApproved flag for used tokens
  - Return appropriate error messages
  - _Requirements: 3.2, 3.3, 7.5_

- [ ]* 4.5 Write unit tests for verification API
  - Test valid token verification
  - Test expired token handling
  - Test already-approved token handling
  - Test invalid token handling
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Enhance session initiation API endpoint
- [x] 5.1 Implement token invalidation for retries
  - Query existing pending verifications for client-trainer pair
  - Mark old pending verifications as expired
  - Ensure only most recent token is valid
  - _Requirements: 8.3, 8.4_

- [ ]* 5.2 Write property test for verification token invalidation
  - **Property 5: Verification Token Invalidation**
  - **Validates: Requirements 8.3, 8.4**

- [x] 5.3 Implement retry capability
  - Allow START button to be clicked after failures
  - Generate new token on each retry
  - Create new verification record
  - _Requirements: 8.1, 8.2, 8.5_

- [ ]* 5.4 Write unit tests for session initiation API
  - Test successful verification creation
  - Test client not found error
  - Test trainer not found error
  - Test email sending success
  - Test email sending failure
  - _Requirements: 1.1, 1.3, 6.2, 6.3_

- [x] 6. Enhance frontend session management
- [x] 6.1 Implement session status state machine
  - Define valid status transitions
  - Implement not_started → pending_approval transition
  - Implement pending_approval → in_progress transition
  - Implement in_progress → completed transition
  - Implement completed → not_started transition (retry)
  - _Requirements: 1.2, 4.1_

- [ ]* 6.2 Write property test for status transition validity
  - **Property 7: Status Transition Validity**
  - **Validates: Requirements 1.2, 4.1**

- [x] 6.2 Implement polling mechanism with timeout
  - Poll database every 5 seconds for approval status
  - Implement 60-attempt maximum (5 minutes)
  - Reset to not_started on timeout
  - Display timeout message to PT
  - _Requirements: 4.2, 4.3_

- [ ]* 6.3 Write property test for polling timeout consistency
  - **Property 6: Polling Timeout Consistency**
  - **Validates: Requirements 4.3**

- [x] 6.4 Implement UI status indicators
  - Display pending approval status with loading indicator
  - Display in-progress status with active styling
  - Display completed status with success styling
  - Display error messages appropriately
  - _Requirements: 1.2, 4.5_

- [x] 6.5 Implement START button error handling
  - Display error messages from API
  - Reset session state on error
  - Allow retry after error
  - _Requirements: 1.3, 6.2, 8.1_

- [ ]* 6.6 Write unit tests for session management component
  - Test START button click handler
  - Test status state transitions
  - Test polling logic with mocked timers
  - Test error handling
  - Test timeout behavior
  - _Requirements: 1.1, 1.2, 1.3, 4.2, 4.3_

- [x] 7. Enhance verification page UI
- [x] 7.1 Implement comprehensive verification page
  - Extract token from URL query parameters
  - Display loading state during verification
  - Display client name after successful verification
  - Display trainer name after successful verification
  - Display success message with clear feedback
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 7.2 Implement error state handling
  - Display expired link error with explanation
  - Display already-approved message
  - Display invalid token error
  - Display network error messages
  - Provide guidance on next steps for each error
  - _Requirements: 3.2, 3.3, 7.5_

- [ ]* 7.3 Write property test for verification URL correctness
  - **Property 8: Verification URL Correctness**
  - **Validates: Requirements 2.3**

- [ ]* 7.4 Write unit tests for verification page component
  - Test token extraction from URL
  - Test loading state display
  - Test success state display
  - Test expired state display
  - Test already-approved state display
  - Test error state display
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Add database indexes and cleanup
- [x] 8.1 Create performance indexes
  - Add index on verification_token for fast lookups
  - Add index on status for filtering
  - Add composite index on (client_id, trainer_id) for invalidation queries
  - _Requirements: 5.3_

- [x] 8.2 Implement expired record cleanup
  - Create database function to delete expired confirmations older than 24 hours
  - Schedule cleanup job (or document manual cleanup process)
  - _Requirements: 4.4_

- [ ]* 8.3 Write unit tests for database operations
  - Test token lookup performance
  - Test status filtering
  - Test client-trainer pair queries
  - _Requirements: 5.3_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update environment configuration
- [x] 10.1 Document required environment variables
  - Document RESEND_API_KEY requirement
  - Document NEXT_PUBLIC_APP_URL requirement
  - Update .env.example file
  - _Requirements: 6.4, 6.5_

- [x] 10.2 Update email sender configuration
  - Update from address to use verified domain
  - Test email delivery in staging environment
  - _Requirements: 2.5_

- [x] 11. Integration testing and validation
- [ ]* 11.1 Write integration tests for complete flow
  - Test PT initiates session → email sent → client verifies → PT notified
  - Test retry after email failure
  - Test expired link scenario
  - Test already-approved scenario
  - Test concurrent verification attempts
  - _Requirements: All_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
