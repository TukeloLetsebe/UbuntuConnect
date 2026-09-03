# FUNCTIONAL_REQUIREMENTS.md

# UbuntuConnect Functional Requirements Specification (FRS)

Version: 1.0

---

> **Note on authority:** This document describes original design intent for UbuntuConnect. For actual implementation status of any requirement, verify against `api-contract.md` and `database.md` (generated from the real backend) — where this document and the code disagree, the code is the source of truth.

## Implementation Status Legend

- [BUILT] — endpoint exists, has been manually tested end-to-end, working as documented
- [BUILT-UNTESTED] — endpoint exists in code, has NOT been run/verified yet — treat with caution, verify behavior before building frontend against it
- [NEEDS-FIX] — known issue exists, do not copy this pattern elsewhere until fixed
- [PLANNED] — no backend code exists — do not invent

This project is NOT feature-complete. Significant portions of the backend
(Campaigns, Reports, Admin, Feed) have not been tested. Do not assume
"exists in code" means "verified correct." When in doubt, ask before
building frontend against an untested endpoint, or flag it for testing first.

---

# 1. Purpose

This document defines every functional capability that UbuntuConnect must provide.

A functional requirement describes **what the system must do**.

Every frontend component, backend API, database entity and business process must satisfy one or more functional requirements defined in this document.

If a feature cannot be traced back to a functional requirement, it should not be implemented without approval.

---

# 2. Scope

The functional requirements cover the complete UbuntuConnect platform, including:

- Authentication
- User Management
- Profile Management
- Campaign Management
- Posts
- Community Engagement
- Volunteering
- Donations
- Partnerships
- Notifications
- Search
- Administration

---

# 3. Functional Requirement Format

Each requirement contains:

• Requirement ID

• Description

• Primary Actor

• Preconditions

• Main Flow

• Alternative Flow

• Postconditions

• Acceptance Criteria

---

# 4. Authentication Module

## FR-001 User Registration

Primary Actor

Individual

Business

NPO

Description

The system shall allow new users to register an account.

Preconditions

User is not authenticated.

Main Flow

1. User opens registration page.

2. User completes registration form.

3. Frontend validates input.

4. Registration request sent to API.

5. API validates data.

6. User account created.

7. Success response returned.

8. User redirected appropriately.

Acceptance Criteria

✓ Required fields validated

✓ Duplicate accounts prevented

✓ Success message displayed

✓ Validation errors shown clearly

---

## FR-002 User Login

Description

The system shall authenticate registered users.

Acceptance Criteria

✓ JWT returned

✓ JWT securely stored

✓ User redirected

✓ Invalid credentials handled

✓ Account state validated

---

## FR-003 Logout

The system shall allow authenticated users to terminate their session.

Acceptance Criteria

✓ JWT removed

✓ Context cleared

✓ Protected routes blocked

✓ User redirected

---

# 5. Profile Management

## FR-004 View Profile

Users shall view profile information.

Acceptance Criteria

✓ Profile loads correctly

✓ Loading state shown

✓ Empty state handled

---

## FR-005 Edit Profile

Users shall update profile information.

Acceptance Criteria

✓ Validation

✓ Image upload (if supported)

✓ Success notification

✓ Updated data displayed

---

# 6. Campaign Management

## FR-006 View Campaigns

Users shall browse campaigns.

Acceptance Criteria

✓ Pagination

✓ Filtering

✓ Search

✓ Loading state

---

## FR-007 Campaign Details

Users shall view campaign details.

Acceptance Criteria

✓ Full information

✓ Creator information

✓ Donation progress

✓ Volunteer information

---

## FR-008 Create Campaign

Primary Actor

NPO

Description

Organizations shall create campaigns.

Acceptance Criteria

✓ Validation

✓ Authorization

✓ Successful creation

✓ Redirect to campaign page

---

## FR-009 Edit Campaign

Only campaign owners shall edit campaigns.

---

## FR-010 Delete Campaign

Only authorized users may delete campaigns.

---

# 7. Posts

## FR-011 View Posts

Users shall browse posts.

---

## FR-012 Create Post

Authenticated users may create posts.

---

## FR-013 Edit Post

Only post owners may edit.

---

## FR-014 Delete Post

Only post owners or administrators may delete.

---

## FR-015 Like Post

Users may like posts.

Acceptance Criteria

✓ Prevent duplicate likes

✓ Like count updated

---

## FR-016 Comment on Post

Users may comment on posts.

Acceptance Criteria

✓ Validation

✓ Comment immediately visible

---

# 8. Volunteering

## FR-017 Browse Volunteer Opportunities

Users shall browse volunteer opportunities.

---

## FR-018 Volunteer Application

Users shall apply.

---

## FR-019 Manage Volunteers

Organizations shall manage volunteer requests.

---

# 9. Donations

## FR-020 Donate

Users shall donate to an NPO by transferring funds from their own platform wallet to the NPO's platform wallet.

This is implemented as an internal wallet-to-wallet balance transfer, processed as an atomic database transaction (all-or-nothing). It does not depend on, or integrate with, any external payment gateway. Insufficient balance is rejected, and the failed attempt is still logged for audit purposes, consistent with real-world financial record-keeping practice.

---

## FR-021 Donation History

Users shall view previous donations.

---

# 10. Partnerships

## FR-022 Partnership Requests

Businesses and organizations shall request partnerships.

---

## FR-023 Partnership Management

Organizations shall accept or reject requests.

---

# 11. Notifications

## FR-024 View Notifications

Authenticated users shall receive notifications.

---

## FR-025 Mark Notifications as Read

Users shall mark notifications as read.

---

# 12. Search

## FR-026 Search

Users shall search for:

• Organizations

• Campaigns

• Posts

---

## FR-027 Filtering

Users shall filter results.

---

# 13. Administration

## FR-028 Manage Users

Administrators shall manage users.

---

## FR-029 Moderate Content

Administrators shall moderate platform content.

---

# 15. Traceability

Every implemented feature must be traceable to one or more Functional Requirement IDs.

Example:

A100

↓

Register Page

↓

POST /register

↓

Register DTO

↓

User Entity

↓

Database


Success Response

---

# 16. AI Responsibilities

Before implementing any feature, the AI must:

1. Identify the Functional Requirement ID.

2. Locate the corresponding backend API.

3. Identify required DTOs.

4. Verify business rules.

5. Confirm authorization.

6. Map frontend components.

7. Produce an implementation plan.

Only after this analysis may implementation begin.
