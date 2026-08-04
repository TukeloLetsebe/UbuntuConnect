# Requirements Document — Authentication

## Introduction

This spec covers the full authentication flow for UbuntuConnect: registration (Individual, NPO, Business — Admin is excluded from self-registration), login, session persistence, role-based dashboard routing, password change, and account deactivation. The frontend currently has mocked Login/Register pages with no real API calls — this spec replaces that mock behavior with real integration against the existing, tested backend (`AuthController`, `IndividualController`).

## Glossary

- **JWT**: JSON Web Token returned on successful login, containing UserId (NameIdentifier claim), Email, and Role (UserType) claims
- **UserType**: One of `Individual`, `NPO`, `Business`, `Admin` — determines dashboard routing and available features
- **Auth state**: Frontend-side record of login status, token, and UserType, accessible across the app
- **Soft delete**: Deactivation via `IsActive = false`, not row removal — deactivated accounts are rejected at login with a specific message

## Requirements

### Requirement 1 — Registration

**User Story:** As a new user, I want to register an account as an Individual, NPO, or Business, so that I can start using the platform.

**Acceptance Criteria:**
1. WHEN the user submits the registration form THEN the system SHALL send a POST request to `/api/Auth/register` with the fields matching their selected UserType
2. WHEN UserType is Individual THEN the request SHALL include firstName, lastName, causeOfCare (optional)
3. WHEN UserType is NPO THEN the request SHALL include npoRegNum, organizationName, npoFocusArea (optional), npoMission (optional)
4. WHEN UserType is Business THEN the request SHALL include businessRegNum, industry (optional), contactPersonName (optional), contactPersonTitle (optional), businessEmail (optional), csrGoal (optional)
5. IF the email already exists THEN the system SHALL display "An account with this email already exists" without navigating away
6. WHEN registration succeeds THEN the system SHALL redirect the user to the Login page with a success message
7. THE registration form SHALL NOT expose an "Admin" option — Admin accounts are not self-registerable through this flow

### Requirement 2 — Login

**User Story:** As a registered user, I want to log in with my email and password, so that I can access my account.

**Acceptance Criteria:**
1. WHEN the user submits the login form THEN the system SHALL send a POST request to `/api/Auth/login` with `{ userEmail, password }`
2. WHEN the API returns 200 THEN the system SHALL store the returned JWT token and userType
3. IF the API returns 401 with an invalid-credentials message THEN the system SHALL display "Invalid email or password"
4. IF the API returns 401 with a deactivated-account message THEN the system SHALL display that specific message, not the generic one
5. THE login form SHALL NOT ask the user to select their own UserType — this SHALL come only from the API response

### Requirement 3 — Role-based routing

**User Story:** As a logged-in user, I want to land on the dashboard matching my actual account type, so that I see the right features immediately.

**Acceptance Criteria:**
1. WHEN login succeeds AND userType is `Individual` THEN the system SHALL navigate to `/individual-dashboard`
2. WHEN login succeeds AND userType is `NPO` THEN the system SHALL navigate to `/npo-dashboard`
3. WHEN login succeeds AND userType is `Business` THEN the system SHALL navigate to `/business-dashboard`
4. WHEN login succeeds AND userType is `Admin` THEN the system SHALL navigate to `/admin-dashboard`

### Requirement 4 — Session persistence

**User Story:** As a logged-in user, I don't want to be logged out just because I refreshed the page.

**Acceptance Criteria:**
1. WHEN login succeeds THEN the system SHALL persist the token in localStorage
2. WHEN the app loads THEN the system SHALL check for an existing token and restore auth state before rendering protected routes
3. IF no valid token exists THEN protected routes SHALL redirect to `/login`
4. WHEN the user logs out THEN the system SHALL clear the stored token and auth state, then redirect to `/login`

### Requirement 5 — Change password

**User Story:** As a logged-in user, I want to change my password, so that I can keep my account secure.

**Acceptance Criteria:**
1. WHEN the user submits current + new password THEN the system SHALL send a PUT request to `/api/individual/change-password` with the JWT attached
2. IF the current password is incorrect THEN the system SHALL display "Current password is incorrect"
3. WHEN the change succeeds THEN the system SHALL display a success message

### Requirement 6 — Deactivate account

**User Story:** As a logged-in user, I want to deactivate my account, so that I can stop using the platform without losing my data permanently.

**Acceptance Criteria:**
1. WHEN the user confirms deactivation with their password THEN the system SHALL send a PUT request to `/api/individual/deactivate`
2. IF the password is incorrect THEN the system SHALL display "Incorrect password. Account not deactivated."
3. WHEN deactivation succeeds THEN the system SHALL clear auth state and redirect to the Landing page

### Requirement 7 — Loading and error states

**User Story:** As a user, I want clear feedback during any auth action, so I know the app is working.

**Acceptance Criteria:**
1. WHILE any auth request is in flight THEN the relevant submit button SHALL show a loading state and be disabled
2. IF a request fails for any reason (network, 401, 500) THEN the system SHALL show a specific, human-readable error message
3. WHEN the user corrects an error and resubmits THEN the previous error SHALL clear

## Known Gaps (do not build frontend against these without backend first)

- Business registration has never been manually tested end-to-end (see functional-requirements.md, FR-001)
- No dedicated Business-role dashboard endpoints exist yet beyond registration/login
- Admin accounts are currently self-registerable at the API level despite Requirement 1.7 excluding this from the FRONTEND form — the backend gap itself is tracked separately in functional-requirements.md as [NEEDS-FIX] and is out of scope for this spec
