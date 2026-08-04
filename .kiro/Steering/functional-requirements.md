# FUNCTIONAL_REQUIREMENTS.md

# UbuntuConnect Functional Requirements Specification (FRS)

Version: 1.1

---

> **Note on authority:** This document describes intended functionality for UbuntuConnect. For actual implementation status, verify against `api-contract.md` and `database.md` (generated directly from the real backend code) — where this document and the code disagree, the code is the source of truth.

---

## Implementation Status Legend

- **[BUILT]** — endpoint exists, has been manually tested end-to-end, working as documented
- **[BUILT-UNTESTED]** — endpoint exists in code, has NOT been run/verified yet — treat with caution, verify behavior before building frontend against it
- **[NEEDS-FIX]** — known issue exists, do not copy this pattern elsewhere until fixed
- **[PLANNED]** — no backend code exists — do not invent

**This project is NOT feature-complete.** Significant portions of the backend (Campaigns, Reports, Admin, Feed) have not been manually tested end-to-end. Do not assume "exists in code" means "verified correct." When in doubt, ask before building frontend against an untested endpoint, or flag it for testing first. New features get added to this document as they're built — this is a living log, not a fixed ceiling on scope.

---

# 1. Purpose

This document defines every functional capability that UbuntuConnect provides or intends to provide.

Every frontend component, backend API, database entity and business process should be traceable to one or more functional requirements defined here.

---

# 2. Authentication Module

## FR-001 User Registration [BUILT]
`POST /api/Auth/register` — handles Individual, NPO, Business, and Admin via `UserType` field. Auto-creates a Wallet (balance 0) and a Profile row for every user regardless of type.

**Known issue [NEEDS-FIX]:** Admin accounts are currently self-registerable through this public endpoint with no restriction — anyone can register `"userType": "Admin"` and gain full AdminController access. Deferred to production hardening; do not treat Admin registration as safe.

## FR-002 User Login [BUILT]
`POST /api/Auth/login` — returns JWT (claims: NameIdentifier=UserId, Email, Role=UserType). Checks `IsActive`; deactivated accounts rejected with 401.

## FR-003 Logout [PARTIAL]
No backend session to invalidate (JWT is stateless) — logout is a frontend-only concern: discard stored token, clear auth state.

## FR-004 Change Password [BUILT]
`PUT /api/individual/change-password` — requires current password verification.

## FR-005 Deactivate Account [BUILT]
`PUT /api/individual/deactivate` — soft delete (`IsActive = false`), requires password confirmation.

---

# 3. Individual Module — all [BUILT]

- `GET /api/individual/discover-npos` — public
- `GET /api/individual/npo/{npoId}` — public, includes live follower count
- `POST/DELETE /api/individual/follow|unfollow/{npoId}` — [Authorize]; duplicate follow rejected 400
- `GET/PUT /api/individual/me` — view/update own profile
- `POST /api/individual/volunteer/apply/{opportunityId}` — duplicate application rejected 400
- `GET/DELETE /api/individual/volunteer/application/{applicationId}` — ownership-checked; cancel blocked if already Accepted
- `POST /api/individual/donate/{npoId}` — see FR-010
- `GET /api/individual/my-donations|my-volunteering|my-impact`
- `GET /api/individual/community-updates` — public; returns ALL posts from ALL NPOs/Businesses (deliberately NOT filtered to followed-only — see note under Feed Module about a naming collision)

---

# 4. NPO Module

## FR-006 View / Update NPO Profile [BUILT]
`GET /api/npo` · `GET /api/npo/{id}` · `GET /api/npo/user/{userId}` (all public) · `PUT /api/npo/{id}` ([Authorize(Roles="NPO")], ownership-checked)

## FR-007 Manage Volunteer Opportunities [BUILT]
`GET/POST/PUT/DELETE /api/VolunteerOpportunity` — Create/Update/Delete restricted to `[Authorize(Roles = "NPO")]` + ownership check (NPO's own `UserId` derived from JWT, never trusted from request body).

## FR-008 Manage Volunteer Applications [BUILT]
`GET /api/VolunteerApplication/opportunity/{opportunityId}` · `PUT /api/VolunteerApplication/{id}/accept|reject|pending` — all `[Authorize(Roles = "NPO")]` + ownership-checked.

## FR-009 Create / Manage Posts [BUILT]
`GET/POST/PUT/DELETE /api/post` — Create restricted to NPO/Business UserType (checked in code, not by FK). Delete is soft (`ActivityStatus = "Deleted"`).

## FR-010 Donate [BUILT — NOT a payment gateway]
`POST /api/individual/donate/{npoId}` — internal wallet-to-wallet balance transfer, processed as an atomic database transaction (all-or-nothing). Does not integrate with any external payment provider. Insufficient balance is rejected AND the failed attempt is still logged (`Status = "Failed"`), consistent with real-world financial audit practice.

## FR-011 Withdraw Funds [BUILT]
`POST /api/transaction/withdraw` — same atomic-transaction + failed-attempt-logging pattern as Donate.

## FR-012 Wallet Balance [BUILT]
`GET /api/wallet/user/{userId}/balance` — [Authorize], self-only.

## FR-013 View Transactions [BUILT]
`GET /api/transaction/user/{userId}` · `GET /api/transaction/{id}` — [Authorize], self-only (sender or receiver).

---

# 5. Business Module — all [BUILT-UNTESTED]

Never manually tested against a live Business token — verify behavior before building frontend against these.

## FR-014 Manage Partnership Campaigns
`GET/POST/PUT/DELETE /api/campaigns` — Create/Update/Delete restricted to `[Authorize(Roles = "Business")]` + ownership check.

## FR-015 Manage Campaign Applications
`POST /api/campaignapplications/apply/{campaignId}` — NPO applies to a Business's campaign; duplicate application rejected. `GET .../campaign/{campaignId}` · `PUT .../{id}/approve|reject` — Business reviews applications to their own campaign, ownership-checked.

---

# 6. Feed Module [BUILT-UNTESTED] — ⚠️ NAMING COLLISION, NEEDS TEAM DECISION

`GET /api/feed/community-updates` — [Authorize]; posts from NPOs the caller follows only.

**This overlaps with, and behaves differently from,** `GET /api/individual/community-updates`, which is public and deliberately shows ALL posts regardless of follow status. Two endpoints with the same conceptual name now exist with different behavior. Do not assume either one is "the" canonical community feed until the team decides which is correct — flag this before building a frontend page against either.

---

# 7. Report Module [NEEDS-FIX]

`GET /api/reports/donations` and `GET /api/reports/donations/csv` — donation summary/CSV export.

**Known issue:** when `npoId` is NOT specified in the query, there is no role check at all — any authenticated user (not just Admin) can view platform-wide donation data (all senders, receivers, amounts). Do not expose this endpoint in any frontend until fixed. Fix: require `User.IsInRole("Admin")` when `npoId` is omitted.

---

# 8. Admin Module [BUILT-UNTESTED, security gap noted]

`GET /api/admin/users` · `GET /api/admin/users/{id}` · `PUT /api/admin/users/{id}/activate|deactivate` · `GET /api/admin/verifications` · `PUT /api/admin/verifications/{id}/approve|reject` · `GET /api/admin/transactions`

All correctly restricted to `[Authorize(Roles = "Admin")]`. Functionally reasonable once a legitimate Admin token exists — but see FR-001's noted issue: the account creation path itself (self-registration as Admin) is insecure. Do not treat "has an Admin token" as proof the system is secure end-to-end.

---

# 9. Not Yet Implemented — [PLANNED], do not invent

- Like / Comment on Posts (`Post.LikeCount` column exists but unused — no PostLike table or endpoint)
- Notifications
- Search / Filtering
- Content Moderation (beyond Admin activate/deactivate)
- Real payment gateway integration

---

# 10. AI Responsibilities

Before implementing any frontend feature:
1. Check this document's status tag for the relevant requirement. If `[PLANNED]`, stop and ask rather than inventing an endpoint.
2. Cross-reference the exact request/response shape against `api-contract.md`.
3. If `[BUILT-UNTESTED]` or `[NEEDS-FIX]`, flag this to the user before treating the endpoint as reliable.
4. Never assume a field name — verify against the actual DTO in the real codebase.
