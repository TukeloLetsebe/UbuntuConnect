# API Contract

## Objective

Reverse engineer the REST API from the existing backend.

The implementation is the source of truth.

Do not make assumptions.

## Inspect

- Controllers
- Endpoints
- Swagger
- DTOs
- Validation
- Authorization
- Response Models

## Analyse

Discover:

- API modules
- Endpoint groups
- Request/Response models
- Authentication flow
- Authorization rules
- Validation rules
- HTTP status codes
- Endpoint dependencies

## Generate

- API Overview
- Module Breakdown
- Endpoint Catalogue
- Request/Response Catalogue
- Authentication Documentation
- Endpoint Dependency Map

## Rules

- Do not invent endpoints.
- Do not invent DTOs.
- Do not invent modules.
- Group endpoints according to the implemented architecture.
- If inconsistencies are found, report them.

---

# Improvements Addendum (Tasks 1–26)

This addendum documents the endpoints, config sections, and migrations added by the
26-task improvements plan (`.kiro/spec/improvement/improvements.md`). The implementation
remains the source of truth; this catalogue is a convenience index.

## New / Changed Endpoints

### Uploads — `UploadController` (`api/upload`) — [Authorize]
- `POST api/upload/image` — multipart `file`; re-encodes to JPEG, returns `{ url, fileName, sizeBytes, contentType }`.
- `POST api/upload/document` — multipart `file`; validates PDF by `%PDF-` signature; same response shape.

### Notifications — `NotificationController` (`api/notification`) — [Authorize]
- `GET api/notification[?unreadOnly=true]` — caller's notifications.
- `GET api/notification/unread-count` — `{ count }`.
- `PUT api/notification/{id}/read` — mark one read (ownership-checked).
- `PUT api/notification/read-all` — mark all read.

### Auth — `AuthController` (`api/Auth`)
- `POST api/Auth/verify-email` `{ token }` — public; consumes token, sets `IsEmailVerified`.
- `POST api/Auth/resend-verification` `{ userEmail }` — public; always 200; reissues if unverified.
- `POST api/Auth/register` — now rejects `Admin` type (400); enforces email/password strength + phone/CIPC/NPO-reg formats. Login + register responses include `isEmailVerified`.

### Admin — `AdminController` (`api/admin`) — [Authorize Roles=Admin]
- `GET api/admin/ghost-cleanup/preview` — dry-run of the ghost-account cleanup.
- `POST api/admin/ghost-cleanup/run` — executes cleanup.

### Admin KYC — `AdminKycController` (`api/admin/kyc`) — [Authorize Roles=Admin]
- `GET api/admin/kyc[?status=Pending|All]` — Individual KYC submissions.
- `PUT api/admin/kyc/{individualId}/approve` — approves, sets `User.IsVerified=true`, notifies + emails.
- `PUT api/admin/kyc/{individualId}/reject` `{ reason? }` — rejects, notifies + emails.

### Post moderation — `PostReportController` (`api/postreport`)
- `POST api/postreport/post/{postId}` `{ reason }` — [Authorize]; blocks empty reason, self-report, duplicate, deleted post.
- `GET api/postreport[?status=Pending|All]` — [Admin].
- `PUT api/postreport/{id}/dismiss` — [Admin].
- `PUT api/postreport/{id}/remove-post` — [Admin]; soft-deletes the post, notifies author.

### Individual KYC — `IndividualController` (`api/individual`) — [Authorize Roles=Individual]
- `POST api/individual/verify-identity` `{ idNumber, idDocumentUrl, selfieUrl, route }` — route `Admin` or `FaceScan`; FaceScan auto-approves when the face engine matches at ≥ 0.62.
- `GET api/individual/verify-identity/status` — returns KYC status + `faceEngineEnabled`.
- `POST api/individual/topup` — now enforces wallet top-up limits + optional simulated card validation.

### Fundraisers / Projects — `ProjectController` (`api/project`) + `NPOController`
- `api/project` Create/Update now accept `startDate`/`endDate`/`durationDays`; all reads return `startDate`/`endDate`.
- `POST api/npo/project/{projectId}/donate` `{ amount }` — [Authorize]; verification-gated; atomic donor→NPO wallet transfer + `RaisedAmount` increment + progress recompute; inline auto-close + NPO notification when the target is met.
- `GET api/npo/{id}/public` — public FB-style profile aggregate; contact (email/phone) shown only to the owner or a fully-verified caller.

### Wallet / Transactions — `TransactionController` (`api/transaction`) — [Authorize]
- `POST api/transaction/withdraw` — enforces per-transaction min/max + a rolling-24h withdrawal cap.
- `GET api/transaction/wallet-limits` — returns the configured wallet limits.

### Verification docs — `VerificationController` (`api/verification`)
- `GET api/verification/npo/{npoId}` — [Business,Admin]; returns an NPO's latest submitted verification documents.

### Partnerships — `CampaignApplicationController` (`api/campaignapplications`)
- `POST api/campaignapplications/apply/{campaignId}` `{ motivation }` — [NPO]; `motivation` (reason) is now required.

### Reports — `ReportController` (`api/reports`)
- `GET api/reports/npo-summary` — [NPO]; totals, monthly received, fundraiser performance, volunteer-application counts.
- `GET api/reports/business-summary` — [Business]; totals, monthly contributions, campaign-application counts, NPOs supported.
- `GET api/reports/admin-summary` — [Admin]; platform totals, users-by-type, monthly donations.
- `GET api/reports/my-donations/csv` — caller's donations CSV. `GET api/reports/donations/csv[?npoId=]` — NPO/Admin CSV (platform-wide when `npoId` omitted, Admin only).

## Configuration Sections (`appsettings.json`)
`Email`, `FileStorage`, `AdminSeed`, `GhostCleanup`, `FaceVerification`, `FundraiserAutoClose`, `WalletLimits`.
Background services (AdminSeeder, GhostCleanup, FundraiserAutoClose) are config-gated; face verification and admin seeding default OFF.

## Database Migrations
- `025_create_emailverificationtokens.sql`
- `026_create_notifications.sql`
- `027_alter_users_add_isemailverified.sql`
- `028_create_postreports.sql`
- `029_alter_individual_add_kyc.sql`
- `030_alter_projects_add_dates.sql`
