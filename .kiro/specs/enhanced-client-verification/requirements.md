# Requirements Document

## Introduction

This document outlines the requirements for enhancing the client session verification system in the WTF Fitness application. The system currently allows personal trainers (PTs) to initiate sessions with clients, but the verification flow needs improvement to ensure clients receive proper email notifications via Supabase and that sessions only start after client approval.

## Glossary

- **PT (Personal Trainer)**: A user with the role 'pt' who manages and trains clients
- **Client**: A person registered in the system who receives training from a PT
- **Session**: A training period between a PT and client
- **Verification Email**: An email sent to the client containing a verification link
- **Verification Token**: A unique, cryptographically secure token used to verify client identity
- **Session Confirmation**: A database record tracking the verification status of a session start request
- **Supabase**: The backend platform providing authentication and database services
- **START Button**: The UI button that PTs click to initiate a session with a client

## Requirements

### Requirement 1

**User Story:** As a PT, I want to initiate a session with a client by clicking the START button, so that the client receives a verification email and can approve the session start.

#### Acceptance Criteria

1. WHEN a PT clicks the START button for a client THEN the System SHALL send a verification email to the client's registered email address
2. WHEN the verification email is sent THEN the System SHALL display a pending approval status to the PT
3. WHEN the email sending fails THEN the System SHALL display an error message to the PT and maintain the session in not-started state
4. WHEN a verification request is created THEN the System SHALL generate a unique verification token with 32 bytes of cryptographic randomness
5. WHEN a verification request is created THEN the System SHALL set an expiration time of 30 minutes from creation

### Requirement 2

**User Story:** As a client, I want to receive a verification email when my PT initiates a session, so that I can approve the session start securely.

#### Acceptance Criteria

1. WHEN the System sends a verification email THEN the email SHALL contain the client's full name
2. WHEN the System sends a verification email THEN the email SHALL contain the PT's full name
3. WHEN the System sends a verification email THEN the email SHALL contain a clickable verification link
4. WHEN the System sends a verification email THEN the email SHALL display the expiration time of 30 minutes
5. WHEN the System sends a verification email THEN the email SHALL use the Supabase email service for delivery

### Requirement 3

**User Story:** As a client, I want to click the verification link in my email, so that I can approve the session and allow my PT to start training.

#### Acceptance Criteria

1. WHEN a client clicks a valid verification link THEN the System SHALL verify the token against the database
2. WHEN a client clicks an expired verification link THEN the System SHALL display an error message indicating expiration
3. WHEN a client clicks an already-used verification link THEN the System SHALL display a message indicating the session was already approved
4. WHEN a client successfully verifies THEN the System SHALL update the session confirmation status to approved
5. WHEN a client successfully verifies THEN the System SHALL record the verification timestamp

### Requirement 4

**User Story:** As a PT, I want to see real-time updates when my client approves the session, so that I know when to begin training.

#### Acceptance Criteria

1. WHEN a client approves a session THEN the System SHALL update the PT's UI to show session in-progress status
2. WHEN the System polls for approval status THEN the System SHALL check the database every 5 seconds
3. WHEN 5 minutes pass without client approval THEN the System SHALL timeout and reset the session to not-started state
4. WHEN a verification link expires THEN the System SHALL update the session confirmation status to expired
5. WHEN the PT's UI shows pending approval THEN the System SHALL display a visual indicator that the system is waiting for client response

### Requirement 5

**User Story:** As a system administrator, I want all verification tokens to be cryptographically secure and time-limited, so that the system maintains security standards.

#### Acceptance Criteria

1. WHEN the System generates a verification token THEN the token SHALL be created using cryptographic random number generation
2. WHEN the System generates a verification token THEN the token SHALL be at least 32 bytes in length
3. WHEN the System stores a verification token THEN the token SHALL be stored in the session_confirmations table
4. WHEN the System checks token expiration THEN the System SHALL compare current time against the expires_at timestamp
5. WHEN a token expires THEN the System SHALL reject any verification attempts using that token

### Requirement 6

**User Story:** As a PT, I want the system to handle email delivery failures gracefully, so that I understand when clients haven't received verification emails.

#### Acceptance Criteria

1. WHEN email delivery fails THEN the System SHALL log the error details
2. WHEN email delivery fails THEN the System SHALL display a user-friendly error message to the PT
3. WHEN email delivery fails THEN the System SHALL maintain the session in not-started state
4. WHEN running in development mode without email configuration THEN the System SHALL log the verification URL to the console
5. WHEN the System successfully sends an email THEN the System SHALL return a success confirmation to the PT

### Requirement 7

**User Story:** As a client, I want the verification page to be user-friendly and informative, so that I understand what I'm approving.

#### Acceptance Criteria

1. WHEN a client visits the verification page THEN the System SHALL display the PT's name
2. WHEN a client visits the verification page THEN the System SHALL display the client's name
3. WHEN a client visits the verification page THEN the System SHALL display a clear approve button
4. WHEN a client successfully approves THEN the System SHALL display a success message
5. WHEN an error occurs during verification THEN the System SHALL display a specific error message explaining the issue

### Requirement 8

**User Story:** As a PT, I want to be able to retry sending verification emails if the first attempt fails, so that I can ensure my clients receive the notification.

#### Acceptance Criteria

1. WHEN a verification email fails to send THEN the System SHALL allow the PT to click START again
2. WHEN a PT clicks START for a client with a pending verification THEN the System SHALL create a new verification request
3. WHEN a new verification request is created for the same client THEN the System SHALL invalidate any previous pending requests
4. WHEN multiple verification requests exist for the same client-trainer pair THEN the System SHALL only honor the most recent token
5. WHEN a PT retries after failure THEN the System SHALL generate a new verification token
