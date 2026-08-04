# Database Architecture — UbuntuConnect

Generated from: `database/000_run_all_migrations.sql`, `database/migrations/020_AlterUser_Table.sql`, `database/migrations/021_AlterTransactions_AddTopUpType.sql`, and `backend/UbuntuConnectAPI/Data/AppDbContext.cs`.

---

## 1. Overview

- **DBMS:** SQL Server
- **Database Name:** `UbuntuConnect_DB`
- **ORM:** Entity Framework Core (database-first scaffold via `AppDbContext`)
- **Migration Strategy:** Raw SQL scripts (idempotent `IF NOT EXISTS` pattern), NOT EF Core migrations
- **Total Tables:** 18 (+ Wallet defined in same master script)

---

## 2. Entity Catalogue

### Users

| Property | Type | Constraints |
|---|---|---|
| UserId | INT (PK, IDENTITY) | |
| UserEmail | NVARCHAR(255) | NOT NULL, UNIQUE |
| UserContact | NVARCHAR(20) | NULL |
| Location | NVARCHAR(255) | NULL |
| PasswordHash | NVARCHAR(255) | NOT NULL |
| UserType | NVARCHAR(20) | NOT NULL, CHECK IN ('Individual', 'NPO', 'Business', 'Admin') |
| IsVerified | BIT | NOT NULL, DEFAULT 0 |
| IsActive | BIT | NOT NULL, DEFAULT 1 (added by migration 020) |
| RegistrationDate | DATETIME | NOT NULL, DEFAULT GETDATE() |

**Relationships:** One-to-many with Individual, NPO, Business (via UserId FK). One-to-one with Profile, Wallet. One-to-many with Post, Follow, VolunteerApplication, Transaction (sender/receiver).
**Used by:** AuthController, AdminController, IndividualController, WalletController, PostController, FeedController, ReportController.

---

### Individual

| Property | Type | Constraints |
|---|---|---|
| IndividualId | INT (PK, IDENTITY) | |
| UserId | INT (FK → Users) | NOT NULL, ON DELETE CASCADE |
| FirstName | NVARCHAR(100) | NOT NULL |
| LastName | NVARCHAR(100) | NOT NULL |
| CauseOfCare | NVARCHAR(255) | NULL |

**Relationships:** Many-to-one with Users.
**Used by:** AuthController (register), IndividualController (me, update).

---

### NPO

| Property | Type | Constraints |
|---|---|---|
| NPO_Id | INT (PK, IDENTITY) | |
| UserId | INT (FK → Users) | NOT NULL, ON DELETE CASCADE |
| NPORegNum | NVARCHAR(50) | NOT NULL, UNIQUE |
| OrganizationName | NVARCHAR(255) | NOT NULL |
| NPOFocusArea | NVARCHAR(255) | NULL |
| NPOMission | NVARCHAR(1000) | NULL |

**Relationships:** Many-to-one with Users. One-to-many with Follow, FundingRequest, VolunteerOpportunity, Verification, ImpactTrack, Project, CampaignApplication.
**Used by:** AuthController, NPOController, IndividualController (discover, follow, donate), VolunteerOpportunityController, VolunteerApplicationController, CampaignApplicationController, FeedController, AdminController.

---

### Business

| Property | Type | Constraints |
|---|---|---|
| BusinessId | INT (PK, IDENTITY) | |
| UserId | INT (FK → Users) | NOT NULL, ON DELETE CASCADE |
| BusinessRegNum | NVARCHAR(50) | NOT NULL, UNIQUE |
| Industry | NVARCHAR(100) | NULL |
| ContactPersonName | NVARCHAR(150) | NULL |
| ContactPersonTitle | NVARCHAR(100) | NULL |
| BusinessEmail | NVARCHAR(255) | NULL |
| CSR_Goal | NVARCHAR(500) | NULL |

**Relationships:** Many-to-one with Users. One-to-many with PartnershipCampaign.
**Used by:** AuthController, CampaignController.

---

### Profile

| Property | Type | Constraints |
|---|---|---|
| ProfileId | INT (PK, IDENTITY) | |
| UserId | INT (FK → Users) | NOT NULL, UNIQUE, ON DELETE CASCADE |
| ProfileName | NVARCHAR(150) | NOT NULL |
| Bio | NVARCHAR(1000) | NULL |
| ProfileImage | NVARCHAR(500) | NULL |
| Following | INT | NOT NULL, DEFAULT 0 |
| Followers | INT | NOT NULL, DEFAULT 0 |

**Relationships:** One-to-one with Users.
**Used by:** AuthController (auto-created at registration). No dedicated Profile controller exists.

---

### Wallet

| Property | Type | Constraints |
|---|---|---|
| WalletId | INT (PK, IDENTITY) | |
| UserId | INT (FK → Users) | NOT NULL, UNIQUE, ON DELETE CASCADE |
| Balance | DECIMAL(12,2) | NOT NULL, DEFAULT 0.00, CHECK >= 0 |

**Relationships:** One-to-one with Users.
**Used by:** AuthController (auto-created), WalletController, IndividualController (donate, topup), TransactionController (withdraw).

---

### Transactions

| Property | Type | Constraints |
|---|---|---|
| TransactionId | INT (PK, IDENTITY) | |
| SenderUserId | INT (FK → Users) | NULL (null = external source, e.g., TopUp) |
| ReceiverUserId | INT (FK → Users) | NULL (null = external destination, e.g., Withdrawal) |
| Amount | DECIMAL(12,2) | NOT NULL, CHECK > 0 |
| TransactionType | NVARCHAR(30) | NOT NULL, CHECK IN ('Donation', 'Withdrawal', 'CampaignContribution', 'TopUp') |
| Status | NVARCHAR(20) | NOT NULL, DEFAULT 'Pending', CHECK IN ('Pending', 'Completed', 'Failed', 'Reversed') |
| Timestamp | DATETIME | NOT NULL, DEFAULT GETDATE() |

**Relationships:** Many-to-one with Users (sender), Many-to-one with Users (receiver).
**Used by:** IndividualController (donate, topup, my-donations), TransactionController (withdraw, get), AdminController (transactions), ReportController.

---

### Post

| Property | Type | Constraints |
|---|---|---|
| PostId | INT (PK, IDENTITY) | |
| UserId | INT (FK → Users) | NOT NULL, ON DELETE CASCADE |
| PostTitle | NVARCHAR(255) | NOT NULL |
| Content | NVARCHAR(MAX) | NULL |
| MediaURL | NVARCHAR(500) | NULL |
| LikeCount | INT | NOT NULL, DEFAULT 0 |
| ActivityStatus | NVARCHAR(20) | NOT NULL, DEFAULT 'Active', CHECK IN ('Active', 'Archived', 'Deleted') |
| Timestamp | DATETIME | NOT NULL, DEFAULT GETDATE() |

**Relationships:** Many-to-one with Users.
**Used by:** PostController, IndividualController (community-updates), FeedController.

---

### Follow

| Property | Type | Constraints |
|---|---|---|
| FollowId | INT (PK, IDENTITY) | |
| UserId | INT (FK → Users) | NOT NULL |
| NPO_Id | INT (FK → NPO) | NOT NULL |
| FollowDate | DATETIME | NOT NULL, DEFAULT GETDATE() |

**Constraints:** UNIQUE (UserId, NPO_Id) — prevents duplicate follows.
**Relationships:** Many-to-one with Users, Many-to-one with NPO.
**Used by:** IndividualController (follow/unfollow, my-impact), FeedController.

---

### FundingRequest

| Property | Type | Constraints |
|---|---|---|
| RequestId | INT (PK, IDENTITY) | |
| NPO_Id | INT (FK → NPO) | NOT NULL, ON DELETE CASCADE |
| Title | NVARCHAR(255) | NOT NULL |
| Purpose | NVARCHAR(1000) | NOT NULL |
| TargetAmount | DECIMAL(12,2) | NOT NULL, CHECK > 0 |
| RaisedAmount | DECIMAL(12,2) | NOT NULL, DEFAULT 0.00 |
| BudgetBreakdown | NVARCHAR(MAX) | NULL |
| Images | NVARCHAR(500) | NULL |
| StartDate | DATE | NOT NULL |
| EndDate | DATE | NULL |

**Relationships:** Many-to-one with NPO. One-to-many with VolunteerOpportunity (optional FK).
**Used by:** No controller (deferred — entity exists, no endpoints).

---

### VolunteerOpportunity

| Property | Type | Constraints |
|---|---|---|
| OpportunityId | INT (PK, IDENTITY) | |
| NPO_Id | INT (FK → NPO) | NOT NULL, ON DELETE CASCADE |
| FundingRequestId | INT (FK → FundingRequest) | NULL |
| RoleTitle | NVARCHAR(150) | NOT NULL |
| Category | NVARCHAR(100) | NULL |
| NumOfPositions | INT | NOT NULL, DEFAULT 1 |
| Description | NVARCHAR(1000) | NULL |
| SkillsRequired | NVARCHAR(500) | NULL |
| TimeCommitment | NVARCHAR(100) | NULL |
| Duration | NVARCHAR(100) | NULL |
| MediaURL | NVARCHAR(500) | NULL |

**Relationships:** Many-to-one with NPO. Optional many-to-one with FundingRequest. One-to-many with VolunteerApplication.
**Used by:** VolunteerOpportunityController, IndividualController (apply).

---

### VolunteerApplication

| Property | Type | Constraints |
|---|---|---|
| ApplicationId | INT (PK, IDENTITY) | |
| UserId | INT (FK → Users) | NOT NULL |
| OpportunityId | INT (FK → VolunteerOpportunity) | NOT NULL, ON DELETE CASCADE |
| FirstName | NVARCHAR(100) | NOT NULL |
| LastName | NVARCHAR(100) | NOT NULL |
| Email | NVARCHAR(255) | NOT NULL |
| PhoneNum | NVARCHAR(20) | NULL |
| Skills | NVARCHAR(500) | NULL |
| Availability | NVARCHAR(255) | NULL |
| WhyVolunteer | NVARCHAR(1000) | NULL |
| Address | NVARCHAR(255) | NULL |
| IDNumber | NVARCHAR(20) | NULL |
| IDCardImage | NVARCHAR(500) | NULL |
| FaceImage | NVARCHAR(500) | NULL |
| Status | NVARCHAR(20) | NOT NULL, DEFAULT 'Pending', CHECK IN ('Pending', 'Accepted', 'Rejected', 'Cancelled') |
| ApplicationDate | DATETIME | NOT NULL, DEFAULT GETDATE() |

**Relationships:** Many-to-one with Users. Many-to-one with VolunteerOpportunity. One-to-many with VolunteerLog.
**Used by:** IndividualController (apply, view, cancel), VolunteerApplicationController (accept/reject/pending/log-hours).

---

### VolunteerLog

| Property | Type | Constraints |
|---|---|---|
| LogId | INT (PK, IDENTITY) | |
| ApplicationId | INT (FK → VolunteerApplication) | NOT NULL, ON DELETE CASCADE |
| LogHours | DECIMAL(5,2) | NOT NULL, CHECK > 0 |
| LogDate | DATE | NOT NULL |
| Notes | NVARCHAR(500) | NULL |

**Relationships:** Many-to-one with VolunteerApplication.
**Used by:** VolunteerApplicationController (log-hours), IndividualController (my-volunteering, my-impact).

---

### PartnershipCampaign

| Property | Type | Constraints |
|---|---|---|
| CampaignId | INT (PK, IDENTITY) | |
| BusinessId | INT (FK → Business) | NOT NULL, ON DELETE CASCADE |
| Title | NVARCHAR(255) | NOT NULL |
| Category | NVARCHAR(100) | NULL |
| BudgetPerPartner | DECIMAL(12,2) | NULL |
| NumOfPartners | INT | NULL |
| Requirements | NVARCHAR(1000) | NULL |
| Description | NVARCHAR(2000) | NULL |
| StartDate | DATE | NOT NULL |
| EndDate | DATE | NULL |

**Relationships:** Many-to-one with Business. One-to-many with CampaignApplication.
**Used by:** CampaignController.

---

### CampaignApplication

| Property | Type | Constraints |
|---|---|---|
| ApplicationId | INT (PK, IDENTITY) | |
| CampaignId | INT (FK → PartnershipCampaign) | NOT NULL, ON DELETE CASCADE |
| NPO_Id | INT (FK → NPO) | NOT NULL |
| ApplicationDate | DATETIME | NOT NULL, DEFAULT GETDATE() |
| Status | NVARCHAR(20) | NOT NULL, DEFAULT 'Pending', CHECK IN ('Pending', 'Accepted', 'Rejected') |
| Motivation | NVARCHAR(1000) | NULL |

**Constraints:** UNIQUE (CampaignId, NPO_Id) — one application per NPO per campaign.
**Relationships:** Many-to-one with PartnershipCampaign. Many-to-one with NPO.
**Used by:** CampaignApplicationController.

---

### Verification

| Property | Type | Constraints |
|---|---|---|
| VerificationId | INT (PK, IDENTITY) | |
| NPO_Id | INT (FK → NPO) | NOT NULL, ON DELETE CASCADE |
| ReviewedByUserId | INT (FK → Users) | NULL |
| NPOCertificate | NVARCHAR(500) | NULL |
| NPOTaxCertificate | NVARCHAR(500) | NULL |
| Status | NVARCHAR(20) | NOT NULL, DEFAULT 'Pending', CHECK IN ('Pending', 'Approved', 'Rejected') |
| SubmittedDate | DATETIME | NOT NULL, DEFAULT GETDATE() |
| ReviewedDate | DATETIME | NULL |

**Relationships:** Many-to-one with NPO. Many-to-one with Users (reviewer/admin).
**Used by:** AdminController (verifications, approve, reject).

---

### ImpactTrack

| Property | Type | Constraints |
|---|---|---|
| ImpactId | INT (PK, IDENTITY) | |
| NPO_Id | INT (FK → NPO) | NOT NULL, ON DELETE CASCADE |
| ImpactMetric | NVARCHAR(255) | NOT NULL |
| Value | DECIMAL(12,2) | NOT NULL |
| Period | NVARCHAR(50) | NOT NULL |
| Description | NVARCHAR(1000) | NULL |

**Relationships:** Many-to-one with NPO.
**Used by:** No controller (deferred).

---

### Projects

| Property | Type | Constraints |
|---|---|---|
| ProjectId | INT (PK, IDENTITY) | |
| NPO_Id | INT (FK → NPO) | NOT NULL, ON DELETE CASCADE |
| ProjectName | NVARCHAR(255) | NOT NULL |
| ProjectDesc | NVARCHAR(2000) | NULL |
| ProjectStatus | NVARCHAR(20) | NOT NULL, DEFAULT 'Planning', CHECK IN ('Planning', 'Active', 'Completed', 'Suspended') |
| ProjectProgress | DECIMAL(5,2) | NOT NULL, DEFAULT 0.00, CHECK BETWEEN 0 AND 100 |

**Relationships:** Many-to-one with NPO.
**Used by:** No controller (deferred).

---

## 3. Relationship Diagram (text)

```
Users (1) ──── (1) Profile
Users (1) ──── (1) Wallet
Users (1) ──── (0..*) Individual
Users (1) ──── (0..*) NPO
Users (1) ──── (0..*) Business
Users (1) ──── (0..*) Post
Users (1) ──── (0..*) Follow
Users (1) ──── (0..*) VolunteerApplication
Users (1) ──── (0..*) Transaction [as Sender]
Users (1) ──── (0..*) Transaction [as Receiver]
Users (1) ──── (0..*) Verification [as Reviewer]

NPO (1) ──── (0..*) Follow
NPO (1) ──── (0..*) FundingRequest
NPO (1) ──── (0..*) VolunteerOpportunity
NPO (1) ──── (0..*) Verification
NPO (1) ──── (0..*) ImpactTrack
NPO (1) ──── (0..*) Project
NPO (1) ──── (0..*) CampaignApplication

Business (1) ──── (0..*) PartnershipCampaign

PartnershipCampaign (1) ──── (0..*) CampaignApplication

FundingRequest (1) ──── (0..*) VolunteerOpportunity [optional FK]

VolunteerOpportunity (1) ──── (0..*) VolunteerApplication

VolunteerApplication (1) ──── (0..*) VolunteerLog
```

---

## 4. Migration Scripts

| File | Purpose |
|---|---|
| `000_run_all_migrations.sql` | Master script — creates DB + all 18 tables in order |
| `migrations/020_AlterUser_Table.sql` | Adds `IsActive BIT NOT NULL DEFAULT 1` to Users |
| `migrations/021_AlterTransactions_AddTopUpType.sql` | Adds 'TopUp' to `CHK_Transactions_Type` constraint |

---

## 5. Notes

- No EF Core migrations exist. The project uses a database-first approach — the SQL scripts are the source of truth, and `AppDbContext` was scaffolded from the live database.
- The `AppDbContext.OnModelCreating` Fluent API configuration matches the SQL constraints exactly (verified during this audit).
- Entities `FundingRequest`, `ImpactTrack`, and `Projects` exist in the DB and EF model but have no controllers/endpoints — they are deferred features.
- The `Profile.Following` and `Profile.Followers` columns are never updated by any controller — they're static counters that would need trigger-based or application-level maintenance if used.
