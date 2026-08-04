# API Contract — UbuntuConnect

Generated from the real backend controllers in `backend/UbuntuConnectAPI/Controllers/`.

---

## 1. Overview

- **Base URL:** `https://localhost:7001` (Development, HTTPS)
- **Auth scheme:** Bearer JWT (token from `/api/Auth/login`)
- **Content-Type:** `application/json` for all request/response bodies
- **CORS:** Allows `http://localhost:5173` only

---

## 2. Authentication Module (`AuthController`)

Route prefix: `/api/Auth`

### POST /api/Auth/register

**Auth:** None

**Request Body (`RegisterDto`):**
```json
{
  "userEmail": "string (required)",
  "password": "string (required)",
  "userType": "Individual | NPO | Business | Admin (required)",
  "userContact": "string | null",
  "location": "string | null",
  "firstName": "string | null (required if Individual)",
  "lastName": "string | null (required if Individual)",
  "causeOfCare": "string | null",
  "npoRegNum": "string | null (required if NPO)",
  "organizationName": "string | null (required if NPO)",
  "npoFocusArea": "string | null",
  "npoMission": "string | null",
  "businessRegNum": "string | null (required if Business)",
  "industry": "string | null",
  "contactPersonName": "string | null",
  "contactPersonTitle": "string | null",
  "businessEmail": "string | null",
  "csrGoal": "string | null"
}
```

**Response 200:**
```json
{ "message": "Registration successful.", "userId": 1, "userType": "Individual" }
```

**Error responses:** 400 (duplicate email, missing required fields, invalid UserType)

---

### POST /api/Auth/login

**Auth:** None

**Request Body (`LoginDto`):**
```json
{ "userEmail": "string", "password": "string" }
```

**Response 200:**
```json
{
  "message": "Login successful.",
  "token": "eyJhbG...",
  "userId": 1,
  "userType": "Individual",
  "email": "user@example.com",
  "isVerified": false
}
```

**Error responses:** 401 ("Invalid email or password." or "This account has been deactivated.")

---

## 3. Individual Module (`IndividualController`)

Route prefix: `/api/individual`

### GET /api/individual/discover-NPOs

**Auth:** None  
**Response 200:** Array of:
```json
{ "npoId": 1, "organizationName": "...", "focusArea": "...", "mission": "...", "location": "...", "isVerified": true }
```

---

### GET /api/individual/npo/{npoId}

**Auth:** None  
**Response 200:**
```json
{ "npoId": 1, "organizationName": "...", "focusArea": "...", "mission": "...", "location": "...", "isVerified": true, "followerCount": 42 }
```
**Error:** 404 if NPO not found

---

### POST /api/individual/follow/{npoId}

**Auth:** [Authorize]  
**Response 200:** `{ "message": "You are now following this NPO." }`  
**Errors:** 404 (NPO not found), 400 (already following)

---

### DELETE /api/individual/unfollow/{npoId}

**Auth:** [Authorize]  
**Response 200:** `{ "message": "You have unfollowed this NPO." }`  
**Errors:** 400 (not following)

---

### GET /api/individual/me

**Auth:** [Authorize]  
**Response 200:**
```json
{ "userId": 1, "firstName": "...", "lastName": "...", "causeOfCare": "...", "email": "...", "contact": "...", "location": "..." }
```
**Error:** 404 (profile not found — user is not Individual type)

---

### PUT /api/individual/me

**Auth:** [Authorize]  
**Request Body (`UpdateProfileDto`):**
```json
{ "firstName": "string | null", "lastName": "string | null", "causeOfCare": "string | null", "userContact": "string | null", "location": "string | null" }
```
**Response 200:** `{ "message": "Profile updated successfully." }`  
**Error:** 404 (profile not found)

---

### POST /api/individual/volunteer/apply/{opportunityId}

**Auth:** [Authorize]  
**Request Body (`VolunteerApplicationDto`):**
```json
{
  "firstName": "string", "lastName": "string", "email": "string",
  "phoneNum": "string | null", "skills": "string | null",
  "availability": "string | null", "whyVolunteer": "string | null",
  "address": "string | null", "idnumber": "string | null"
}
```
**Response 200:** `{ "message": "Application submitted successfully.", "applicationId": 1 }`  
**Errors:** 404 (opportunity not found), 400 (already applied)

---

### GET /api/individual/volunteer/application/{applicationId}

**Auth:** [Authorize] (ownership-checked)  
**Response 200:**
```json
{
  "applicationId": 1, "roleTitle": "...", "npoName": "...", "description": "...",
  "status": "Pending", "applicationDate": "...", "skills": "...", "availability": "...",
  "whyVolunteer": "...", "totalHoursLogged": 12.5,
  "logs": [{ "logId": 1, "hours": 4.0, "date": "2026-04-01", "notes": "..." }]
}
```
**Errors:** 404, 403 (not owner)

---

### DELETE /api/individual/volunteer/application/{applicationId}

**Auth:** [Authorize] (ownership-checked)  
**Response 200:** `{ "message": "Application cancelled." }`  
**Errors:** 404, 403 (not owner), 400 (already Accepted — can't cancel)

---

### POST /api/individual/donate/{npoId}

**Auth:** [Authorize]  
**Request Body (`DonateDto`):**
```json
{ "amount": 100.00 }
```
**Response 200:** `{ "message": "Donation successful.", "transactionId": 1, "newBalance": 900.00 }`  
**Errors:** 400 (amount <= 0, insufficient balance, no wallet), 404 (NPO not found)

---

### POST /api/individual/topup

**Auth:** [Authorize]  
**Request Body (`TopUpRequest`):**
```json
{ "amount": 500.00 }
```
**Response 200:** `{ "message": "Wallet topped up successfully.", "transactionId": 1, "newBalance": 500.00 }`  
**Errors:** 400 (amount <= 0, no wallet), 500 (server error)

---

### GET /api/individual/my-donations

**Auth:** [Authorize]  
**Response 200:**
```json
{ "totalDonated": 750.00, "count": 3, "donations": [{ "transactionId": 1, "amount": 500, "status": "Completed", "timestamp": "...", "receiverUserId": 5 }] }
```

---

### GET /api/individual/my-volunteering

**Auth:** [Authorize]  
**Response 200:** Array of:
```json
{ "applicationId": 1, "roleTitle": "...", "npoName": "...", "status": "Accepted", "applicationDate": "...", "totalHoursLogged": 16.0 }
```

---

### GET /api/individual/my-impact

**Auth:** [Authorize]  
**Response 200:**
```json
{ "totalDonated": 750.00, "totalHoursVolunteered": 28.5, "npoFollowing": 3, "volunteerRolesCompleted": 2 }
```

---

### GET /api/individual/community-updates

**Auth:** None (public)  
**Response 200:** Array of:
```json
{ "postId": 1, "authorName": "Hope Foundation", "postTitle": "...", "content": "...", "mediaUrl": "...", "likeCount": 0, "timestamp": "..." }
```

---

### PUT /api/individual/change-password

**Auth:** [Authorize]  
**Request Body (`ChangePasswordDto`):**
```json
{ "currentPassword": "string", "newPassword": "string (min 8 chars)" }
```
**Response 200:** `{ "message": "Password changed successfully." }`  
**Errors:** 400 (incorrect current password, new password too short)

---

### PUT /api/individual/deactivate

**Auth:** [Authorize]  
**Request Body (`DeactivateAccountDto`):**
```json
{ "password": "string" }
```
**Response 200:** `{ "message": "Your account has been deactivated." }`  
**Errors:** 400 (incorrect password)

---

## 4. NPO Module (`NPOController`)

Route prefix: `/api/npo`

### GET /api/npo

**Auth:** None  
**Response 200:** Array of all NPOs (same shape as discover-NPOs but from the NPO controller).

---

### GET /api/npo/{id}

**Auth:** None  
**Response 200:** Single NPO object.

---

### GET /api/npo/user/{userId}

**Auth:** None  
**Response 200:** NPO object for the given user.

---

### PUT /api/npo/{id}

**Auth:** [Authorize(Roles = "NPO")] + ownership check  
**Request Body (`UpdateNPORequest`):**
```json
{ "organizationName": "string | null", "nPOFocusArea": "string | null", "nPOMission": "string | null" }
```
**Response 204:** No content (success)  
**Errors:** 404, 403 (not owner)

---

## 5. Post Module (`PostController`)

Route prefix: `/api/post`

### GET /api/post

**Auth:** None  
**Response 200:** Array of active posts (ActivityStatus = "Active").

---

### GET /api/post/{id}

**Auth:** None  
**Response 200:** Single post object.

---

### GET /api/post/user/{userId}

**Auth:** None  
**Response 200:** All posts by a given user (including deleted/archived — no status filter).

---

### POST /api/post

**Auth:** [Authorize] + UserType must be "NPO" or "Business"  
**Request Body (`CreatePostRequest`):**
```json
{ "postTitle": "string (required)", "content": "string | null", "mediaUrl": "string | null" }
```
**Response 201:** Created post object.  
**Errors:** 403 (not NPO/Business)

---

### PUT /api/post/{id}

**Auth:** [Authorize] + ownership check  
**Request Body (`UpdatePostRequest`):**
```json
{ "postTitle": "string (required)", "content": "string | null", "activityStatus": "Active | Deleted | null" }
```
**Response 204:** No content.  
**Errors:** 404, 403, 400 (invalid status)

---

### DELETE /api/post/{id}

**Auth:** [Authorize] + ownership check  
**Response 204:** Soft-deletes (sets ActivityStatus = "Deleted").  
**Errors:** 404, 403

---

## 6. Volunteer Opportunity Module (`VolunteerOpportunityController`)

Route prefix: `/api/VolunteerOpportunity`

### GET /api/VolunteerOpportunity

**Auth:** None  
**Response 200:** Array of all opportunities.

---

### GET /api/VolunteerOpportunity/{id}

**Auth:** None  
**Response 200:** Single opportunity.

---

### GET /api/VolunteerOpportunity/npo/{npoId}

**Auth:** None  
**Response 200:** Opportunities for a specific NPO.

---

### POST /api/VolunteerOpportunity

**Auth:** [Authorize(Roles = "NPO")]  
**Request Body (`CreateVolunteerOpportunityRequest`):**
```json
{
  "fundingRequestId": "int | null",
  "roleTitle": "string (required)",
  "category": "string | null",
  "numOfPositions": 1,
  "description": "string | null",
  "skillsRequired": "string | null",
  "timeCommitment": "string | null",
  "duration": "string | null",
  "mediaURL": "string | null"
}
```
**Response 201:** Created opportunity object.

---

### PUT /api/VolunteerOpportunity/{id}

**Auth:** [Authorize(Roles = "NPO")] + ownership check  
**Request Body (`UpdateVolunteerOpportunityRequest`):** Same fields as Create, all nullable (partial update).  
**Response 204:** No content.  
**Errors:** 404, 403

---

### DELETE /api/VolunteerOpportunity/{id}

**Auth:** [Authorize(Roles = "NPO")] + ownership check  
**Response 204:** Hard delete.  
**Errors:** 404, 403

---

## 7. Volunteer Application Module (`VolunteerApplicationController`)

Route prefix: `/api/VolunteerApplication`

### GET /api/VolunteerApplication

**Auth:** [Authorize(Roles = "NPO")]  
**Response 200:** All applications (platform-wide — known issue, should filter to caller's NPO only).

---

### GET /api/VolunteerApplication/opportunity/{opportunityId}

**Auth:** [Authorize(Roles = "NPO")] + ownership check  
**Response 200:** Applications for that opportunity.

---

### GET /api/VolunteerApplication/user/{userId}

**Auth:** [Authorize] + self-only check  
**Response 200:** Caller's own applications.

---

### PUT /api/VolunteerApplication/{id}/accept

**Auth:** [Authorize(Roles = "NPO")] + ownership check  
**Response 204:** Sets status to "Accepted".

---

### PUT /api/VolunteerApplication/{id}/reject

**Auth:** [Authorize(Roles = "NPO")] + ownership check  
**Response 204:** Sets status to "Rejected".

---

### PUT /api/VolunteerApplication/{id}/pending

**Auth:** [Authorize(Roles = "NPO")] + ownership check  
**Response 204:** Resets status to "Pending".

---

### POST /api/VolunteerApplication/{id}/log-hours

**Auth:** [Authorize(Roles = "NPO")] + ownership check  
**Precondition:** Application status must be "Accepted"  
**Request Body (`LogHoursRequest`):**
```json
{ "hours": 4.5, "date": "2026-04-15 (optional, defaults to today)", "notes": "string | null" }
```
**Response 200:**
```json
{ "logId": 1, "applicationId": 1, "hours": 4.5, "date": "2026-04-15", "notes": "..." }
```
**Errors:** 404, 403, 400 (not Accepted, hours <= 0)

---

## 8. Transaction Module (`TransactionController`)

Route prefix: `/api/transaction`

### GET /api/transaction/user/{userId}

**Auth:** [Authorize] + self-only check  
**Response 200:** Array of transactions where caller is sender or receiver.

---

### GET /api/transaction/{id}

**Auth:** [Authorize] + self-only check (sender or receiver)  
**Response 200:** Single transaction.

---

### POST /api/transaction/withdraw

**Auth:** [Authorize]  
**Request Body (`WithdrawFundsRequest`):**
```json
{ "amount": 100.00 }
```
**Response 201:** Transaction object (status "Completed").  
**Errors:** 400 (amount <= 0, insufficient balance), 404 (no wallet), 500 (server error)

---

## 9. Wallet Module (`WalletController`)

Route prefix: `/api/wallet`

### GET /api/wallet/user/{userId}/balance

**Auth:** [Authorize] + self-only check  
**Response 200:**
```json
{ "walletId": 1, "userId": 1, "balance": 500.00 }
```
**Errors:** 404 (wallet not found), 403 (not self)

---

## 10. Campaign Module (`CampaignController`) [BUILT-UNTESTED]

Route prefix: `/api/campaigns`

### GET /api/campaigns

**Auth:** None  
**Response 200:** Array of campaigns.

---

### GET /api/campaigns/{id}

**Auth:** None  
**Response 200:** Single campaign (includes requirements).

---

### POST /api/campaigns

**Auth:** [Authorize(Roles = "Business")]  
**Request Body (`CreateCampaignRequest`):**
```json
{
  "title": "string (required)",
  "description": "string | null",
  "category": "string | null",
  "requirements": "string | null",
  "budgetPerPartner": "decimal | null",
  "startDate": "2026-06-01 (required, DateOnly)",
  "endDate": "2026-12-31 | null (DateOnly)"
}
```
**Response 201:** `{ "campaignId": 1, "businessId": 1, "title": "..." }`

---

### PUT /api/campaigns/{id}

**Auth:** [Authorize(Roles = "Business")] + ownership check  
**Request Body (`UpdateCampaignRequest`):** Partial update (all nullable).  
**Response 204:** No content.

---

### DELETE /api/campaigns/{id}

**Auth:** [Authorize(Roles = "Business")] + ownership check  
**Response 204:** Hard delete.

---

## 11. Campaign Application Module (`CampaignApplicationController`) [BUILT-UNTESTED]

Route prefix: `/api/campaignapplications`

### POST /api/campaignapplications/apply/{campaignId}

**Auth:** [Authorize(Roles = "NPO")]  
**Request Body (`CampaignApplicationDto`):**
```json
{ "motivation": "string | null" }
```
**Response 200:** `{ "message": "...", "applicationId": 1 }`  
**Errors:** 400 (already applied, no NPO profile), 404 (campaign not found)

---

### GET /api/campaignapplications/campaign/{campaignId}

**Auth:** [Authorize(Roles = "Business")] + ownership check  
**Response 200:** Array of applications to that campaign.

---

### PUT /api/campaignapplications/{id}/approve

**Auth:** [Authorize(Roles = "Business")] + ownership check  
**Response 204:** Sets status to "Accepted" (matches DB constraint).

---

### PUT /api/campaignapplications/{id}/reject

**Auth:** [Authorize(Roles = "Business")] + ownership check  
**Response 204:** Sets status to "Rejected".

---

## 12. Feed Module (`FeedController`) [BUILT-UNTESTED]

Route prefix: `/api/feed`

### GET /api/feed/community-updates

**Auth:** [Authorize]  
**Response 200:** Posts from NPOs the caller follows (Active posts only).

**Note:** This overlaps with `/api/individual/community-updates` which is public and returns ALL posts. See FRS for naming collision discussion.

---

## 13. Admin Module (`AdminController`) [BUILT-UNTESTED]

Route prefix: `/api/admin`  
**All endpoints:** [Authorize(Roles = "Admin")]

### GET /api/admin/users

**Response 200:** Array of `{ userId, email, userType, isActive, isVerified }`.

---

### GET /api/admin/users/{id}

**Response 200:** `{ userId, email, contact, location, userType, isActive, isVerified }`

---

### PUT /api/admin/users/{id}/activate

**Response 204:** Sets IsActive = true.

---

### PUT /api/admin/users/{id}/deactivate

**Response 204:** Sets IsActive = false.

---

### GET /api/admin/verifications

**Query params:** `?status=Pending|Approved|Rejected` (optional filter)  
**Response 200:** Array of verification records.

---

### PUT /api/admin/verifications/{id}/approve

**Response 204:** Sets verification status to "Approved", marks NPO user as IsVerified = true.

---

### PUT /api/admin/verifications/{id}/reject

**Response 204:** Sets verification status to "Rejected".

---

### GET /api/admin/transactions

**Query params:** `?userId=1` (optional filter by sender or receiver)  
**Response 200:** Array of all transactions.

---

## 14. Report Module (`ReportController`) [NEEDS-FIX]

Route prefix: `/api/reports`  
**All endpoints:** [Authorize]

### GET /api/reports/donations

**Query params:** `?start=2026-01-01&end=2026-12-31&npoId=1` (all optional)  
**Response 200:** `{ totalDonated, count, transactions: [...] }`  
**Auth note:** When `npoId` is specified, checks admin or NPO owner. When omitted: **NO ROLE CHECK** — any authenticated user sees all data. Known bug, do not expose in frontend.

---

### GET /api/reports/donations/csv

Same params and auth issue as above. Returns CSV file download.

---

## 15. JWT Claims Structure

| Claim | Value |
|---|---|
| `ClaimTypes.NameIdentifier` | UserId (int as string) |
| `ClaimTypes.Email` | UserEmail |
| `ClaimTypes.Role` | UserType ("Individual", "NPO", "Business", "Admin") |

Token expiry configured via `appsettings.json` → `Jwt:ExpiryMinutes`.

---

## 16. Common Patterns

- **Ownership check:** Controller extracts UserId from JWT claims, queries the entity's owner chain, returns 403 Forbid if mismatch.
- **Atomic transactions:** Donate, Withdraw, TopUp all use `Database.BeginTransactionAsync()` with try/catch/rollback.
- **Failed attempt logging:** Donate and Withdraw log a Transaction with Status="Failed" before returning the error — audit trail pattern.
- **Soft delete:** Users (IsActive=false), Posts (ActivityStatus="Deleted"). VolunteerApplications use status change to "Cancelled" rather than deletion.
