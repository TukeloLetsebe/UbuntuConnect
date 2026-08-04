# Requirements Document — Individual Module

## Introduction

This spec covers all Individual user capabilities in UbuntuConnect: discovering NPOs, following organizations, volunteering, donating, wallet management, viewing personal impact, consuming community updates, and profile management. The frontend currently renders all these features with hardcoded mock data — this spec defines the real API integration requirements against the existing, tested backend endpoints (all marked [BUILT] in the FRS).

## Glossary

- **NPO**: Non-Profit Organisation registered on the platform
- **Wallet**: Internal balance system — every user has exactly one wallet, auto-created at registration with balance 0
- **Donation**: Wallet-to-wallet balance transfer from Individual to NPO (no external payment gateway)
- **Top Up**: Adding funds to the Individual's wallet (simulated — no real payment provider)
- **Volunteer Application**: An Individual's application to a specific Volunteer Opportunity posted by an NPO
- **Follow**: An Individual subscribing to an NPO's updates
- **Impact**: Aggregated stats combining donation totals, volunteer hours, and following count

---

## Requirements

### Requirement 1 — Route Protection

**User Story:** As a platform user, I want the Individual dashboard to be accessible only to authenticated Individual users, so that unauthorized users cannot access my data.

**Acceptance Criteria:**
1. WHEN an unauthenticated user visits `/individual-dashboard` THEN the system SHALL redirect to `/login`
2. WHEN an authenticated user with a non-Individual role visits `/individual-dashboard` THEN the system SHALL redirect to their correct dashboard
3. WHEN an authenticated Individual visits `/individual-dashboard` THEN the system SHALL render the dashboard

---

### Requirement 2 — View Own Profile

**User Story:** As an Individual, I want to see my profile information when I open Profile Settings, so that I can verify my details are correct.

**Acceptance Criteria:**
1. WHEN the Profile Settings tab is active THEN the system SHALL call `GET /api/individual/me` and populate the form fields with the response
2. THE form SHALL display: firstName, lastName, email (read-only from auth), contact, location, causeOfCare
3. WHILE the profile is loading THEN the system SHALL show skeleton placeholders
4. IF the request fails THEN the system SHALL display an error message with retry option

---

### Requirement 3 — Update Profile

**User Story:** As an Individual, I want to update my profile information, so that I can keep my details current.

**Acceptance Criteria:**
1. WHEN the user submits the profile form THEN the system SHALL call `PUT /api/individual/me` with `{ firstName, lastName, causeOfCare, userContact, location }`
2. WHILE the request is in flight THEN the submit button SHALL show a loading state and be disabled
3. WHEN the update succeeds THEN the system SHALL display a success toast
4. IF the update fails THEN the system SHALL display the error message from the backend

---

### Requirement 4 — Discover NPOs

**User Story:** As an Individual, I want to browse all NPOs on the platform, so that I can find organizations to support.

**Acceptance Criteria:**
1. WHEN the Discover NPOs tab is active THEN the system SHALL call `GET /api/individual/discover-NPOs` and display the results
2. EACH NPO card SHALL display: organizationName, focusArea, mission, location, isVerified
3. WHILE loading THEN the system SHALL show skeleton card placeholders
4. IF no NPOs are returned THEN the system SHALL show an empty state message
5. IF the request fails THEN the system SHALL show an error state with retry option
6. Client-side filtering/sorting of the fetched NPO list SHALL be supported (by name, location, focusArea, verification status)

---

### Requirement 5 — View NPO Detail

**User Story:** As an Individual, I want to view detailed information about a specific NPO, so that I can decide whether to follow or donate.

**Acceptance Criteria:**
1. WHEN the user clicks an NPO card THEN the system SHALL call `GET /api/individual/npo/{npoId}` and display extended details in a modal or expanded view
2. THE detail view SHALL include: organizationName, focusArea, mission, location, isVerified, followerCount
3. IF the NPO is not found THEN the system SHALL display a 404 message

---

### Requirement 6 — Follow NPO

**User Story:** As an Individual, I want to follow an NPO, so that I can stay updated on their activities.

**Acceptance Criteria:**
1. WHEN the user clicks "Follow" on an NPO THEN the system SHALL call `POST /api/individual/follow/{npoId}`
2. WHEN the follow succeeds THEN the button SHALL immediately change to "Following" state (optimistic UI)
3. IF the user already follows that NPO THEN the system SHALL handle the 400 gracefully (revert button state)
4. IF the NPO doesn't exist THEN the system SHALL display an error toast (404)

---

### Requirement 7 — Unfollow NPO

**User Story:** As an Individual, I want to unfollow an NPO, so that I can curate which organizations I track.

**Acceptance Criteria:**
1. WHEN the user clicks "Unfollow" on a followed NPO THEN the system SHALL call `DELETE /api/individual/unfollow/{npoId}`
2. WHEN the unfollow succeeds THEN the button SHALL revert to "Follow" state (optimistic UI)
3. IF the user is not following that NPO THEN the system SHALL handle the 400 gracefully

---

### Requirement 8 — Browse Volunteer Opportunities

**User Story:** As an Individual, I want to see available volunteer opportunities, so that I can find roles matching my skills.

**Acceptance Criteria:**
1. WHEN the Volunteer Opportunities tab is active THEN the system SHALL call `GET /api/VolunteerOpportunity` and display the results
2. EACH opportunity card SHALL display: roleTitle, category, numOfPositions, description, skillsRequired, timeCommitment, duration
3. WHILE loading THEN the system SHALL show skeleton placeholders
4. IF no opportunities exist THEN the system SHALL show an empty state with guidance
5. IF the request fails THEN the system SHALL show an error state with retry option

---

### Requirement 9 — Apply to Volunteer

**User Story:** As an Individual, I want to apply to a volunteer opportunity, so that I can contribute my time.

**Acceptance Criteria:**
1. WHEN the user clicks "Apply" on an opportunity THEN the system SHALL open a modal with the application form
2. THE form SHALL collect: firstName, lastName, email, phoneNum, skills, availability, whyVolunteer
3. WHEN the user submits THEN the system SHALL call `POST /api/individual/volunteer/apply/{opportunityId}` with the form data
4. WHILE the request is in flight THEN the submit button SHALL show a loading state
5. WHEN the application succeeds THEN the system SHALL display a success toast and the opportunity SHALL show "Applied" state
6. IF the user has already applied THEN the system SHALL display "You have already applied to this opportunity" (400)
7. IF the opportunity doesn't exist THEN the system SHALL display an error (404)

---

### Requirement 10 — View My Volunteer Applications

**User Story:** As an Individual, I want to see my volunteer applications and their status, so that I can track my progress.

**Acceptance Criteria:**
1. WHEN the My Volunteering tab is active THEN the system SHALL call `GET /api/individual/my-volunteering` and display the results
2. EACH application SHALL display: roleTitle, npoName, status (Pending/Accepted/Rejected/Cancelled), applicationDate, totalHoursLogged
3. THE system SHALL visually distinguish application statuses using badge colors (Pending=amber, Accepted=green, Rejected=red, Cancelled=gray)
4. WHILE loading THEN the system SHALL show skeleton rows
5. IF no applications exist THEN the system SHALL show an empty state

---

### Requirement 11 — Cancel Volunteer Application

**User Story:** As an Individual, I want to cancel a pending volunteer application, so that I can withdraw if my circumstances change.

**Acceptance Criteria:**
1. WHEN the user clicks "Withdraw" on a Pending application THEN the system SHALL show a confirmation dialog
2. WHEN confirmed THEN the system SHALL call `DELETE /api/individual/volunteer/application/{applicationId}`
3. WHEN cancellation succeeds THEN the application SHALL be removed from the list and a success toast shown
4. IF the application is already Accepted THEN the system SHALL display "Cannot cancel an accepted application" (400)
5. IF the user doesn't own the application THEN the system SHALL display an error (403)

---

### Requirement 12 — View Wallet Balance

**User Story:** As an Individual, I want to see my wallet balance, so that I know how much I can donate.

**Acceptance Criteria:**
1. WHEN the dashboard mounts THEN the system SHALL call `GET /api/wallet/user/{userId}/balance` and store the balance
2. THE balance SHALL be displayed in the donation modal header and the My Donations tab summary
3. THE balance SHALL update after any successful donate or top-up action
4. IF the wallet is not found THEN the system SHALL display an error

---

### Requirement 13 — Top Up Wallet

**User Story:** As an Individual, I want to add funds to my wallet, so that I have balance available for donations.

**Acceptance Criteria:**
1. WHEN the user submits a top-up amount THEN the system SHALL call `POST /api/individual/topup` with `{ amount }`
2. WHEN the top-up succeeds THEN the displayed balance SHALL update to `newBalance` from the response
3. IF amount is <= 0 THEN the system SHALL prevent submission via client-side validation
4. WHILE the request is in flight THEN the button SHALL show a loading state
5. IF the request fails THEN the system SHALL display the backend error message in a toast

---

### Requirement 14 — Donate to NPO

**User Story:** As an Individual, I want to donate to an NPO from my wallet balance, so that I can support their mission.

**Acceptance Criteria:**
1. WHEN the user clicks "Donate" on an NPO THEN the system SHALL open a donation modal showing the current wallet balance
2. WHEN the user submits an amount THEN the system SHALL call `POST /api/individual/donate/{npoId}` with `{ amount }`
3. WHEN the donation succeeds THEN the system SHALL display a success toast with the new balance and close the modal
4. IF the balance is insufficient THEN the system SHALL display "Insufficient balance" and offer a top-up option within the modal
5. IF amount is <= 0 THEN the system SHALL prevent submission via client-side validation
6. IF the NPO doesn't exist THEN the system SHALL display an error (404)

---

### Requirement 15 — View Donation History

**User Story:** As an Individual, I want to see my donation history, so that I can track my contributions.

**Acceptance Criteria:**
1. WHEN the My Donations tab is active THEN the system SHALL call `GET /api/individual/my-donations` and display the results
2. THE response SHALL show: totalDonated, count, and a list of individual donations (transactionId, amount, status, timestamp, receiverUserId)
3. WHILE loading THEN the system SHALL show skeleton placeholders
4. IF no donations exist THEN the system SHALL show an empty state encouraging the user to make their first donation

---

### Requirement 16 — View My Impact

**User Story:** As an Individual, I want to see my aggregated impact, so that I can feel good about my contributions.

**Acceptance Criteria:**
1. WHEN the My Impact tab is active THEN the system SHALL call `GET /api/individual/my-impact` and display the results
2. THE response SHALL show: totalDonated, totalHoursVolunteered, npoFollowing, volunteerRolesCompleted
3. THE UI SHALL present these as prominent stat cards
4. WHILE loading THEN the system SHALL show skeleton stat cards
5. IF the request fails THEN the system SHALL show an error with retry

---

### Requirement 17 — View Community Updates

**User Story:** As an Individual, I want to see posts from all NPOs on the platform, so that I can stay informed about community activities.

**Acceptance Criteria:**
1. WHEN the Community Updates tab is active THEN the system SHALL call `GET /api/individual/community-updates` (public, returns ALL posts)
2. EACH post SHALL display: authorName, postTitle, content, mediaUrl (if present), likeCount, timestamp
3. WHILE loading THEN the system SHALL show skeleton post cards
4. IF no posts exist THEN the system SHALL show an empty state
5. Client-side search/filtering by title, author name, or content SHALL be supported

---

### Requirement 18 — Change Password

**User Story:** As an Individual, I want to change my password from the Profile Settings tab.

**Acceptance Criteria:**
1. WHEN the user submits current + new password THEN the system SHALL call `PUT /api/individual/change-password` with `{ currentPassword, newPassword }`
2. THE new password field SHALL enforce minimum 8 characters (client-side validation)
3. A "Confirm New Password" field SHALL verify the new password matches before submission
4. IF the current password is incorrect THEN the system SHALL display the backend error message
5. WHEN the change succeeds THEN the system SHALL display a success toast and clear the form fields
6. WHILE the request is in flight THEN the button SHALL show a loading state

---

### Requirement 19 — Deactivate Account

**User Story:** As an Individual, I want to deactivate my account from the Profile Settings tab.

**Acceptance Criteria:**
1. WHEN the user clicks "Deactivate Account" THEN the system SHALL show a confirmation dialog requiring password entry
2. THE dialog SHALL clearly warn that this action will disable the account
3. WHEN confirmed THEN the system SHALL call `PUT /api/individual/deactivate` with `{ password }`
4. IF the password is incorrect THEN the system SHALL display the backend error in the dialog
5. WHEN deactivation succeeds THEN the system SHALL call `logout()` from AuthContext and redirect to landing page

---

### Requirement 20 — Loading, Error, and Empty States

**User Story:** As an Individual, I want clear feedback during all operations, so I know the system is working.

**Acceptance Criteria:**
1. WHILE any data-fetch request is in flight THEN the relevant section SHALL show skeleton loading indicators
2. WHILE any mutation request is in flight THEN the action button SHALL show a spinner and be disabled
3. IF a data-fetch request fails THEN the section SHALL show an error card with a descriptive message and retry button
4. IF a data-fetch returns an empty list THEN the section SHALL show a helpful empty state with guidance (e.g., "No donations yet — discover NPOs to support")
5. WHEN a mutation (follow, donate, apply, etc.) succeeds THEN the system SHALL show a success toast
6. WHEN a mutation fails THEN the system SHALL show an error toast with the backend message

---

## Known Constraints

- Donate/TopUp are internal wallet operations — no real payment gateway exists
- `GET /api/individual/community-updates` returns ALL posts (not filtered to followed NPOs) — this is the deliberate public endpoint
- The `GET /api/feed/community-updates` (followed-only feed) is [BUILT-UNTESTED] — do NOT use it until verified
- Like/Comment on posts is [PLANNED] — do not implement; render likeCount as read-only
- Search/Filtering backend endpoints don't exist — all filtering is client-side against the fetched list
- The "Following" tab's posts section should use the same data from `community-updates` filtered client-side to followed NPO IDs (since `/api/feed/community-updates` is untested)
- NPO images are not provided by the backend — the UI must gracefully handle missing images
- Post `mediaUrl` may be null — conditionally render media only when present

---

## API Endpoints Used (all [BUILT])

| Use Case | Method | Endpoint |
|---|---|---|
| View profile | GET | /api/individual/me |
| Update profile | PUT | /api/individual/me |
| Discover NPOs | GET | /api/individual/discover-NPOs |
| NPO Detail | GET | /api/individual/npo/{npoId} |
| Follow | POST | /api/individual/follow/{npoId} |
| Unfollow | DELETE | /api/individual/unfollow/{npoId} |
| Browse opportunities | GET | /api/VolunteerOpportunity |
| Apply volunteer | POST | /api/individual/volunteer/apply/{opportunityId} |
| View application | GET | /api/individual/volunteer/application/{applicationId} |
| Cancel application | DELETE | /api/individual/volunteer/application/{applicationId} |
| Wallet balance | GET | /api/wallet/user/{userId}/balance |
| Top up | POST | /api/individual/topup |
| Donate | POST | /api/individual/donate/{npoId} |
| My donations | GET | /api/individual/my-donations |
| My volunteering | GET | /api/individual/my-volunteering |
| My impact | GET | /api/individual/my-impact |
| Community updates | GET | /api/individual/community-updates |
| Change password | PUT | /api/individual/change-password |
| Deactivate | PUT | /api/individual/deactivate |
