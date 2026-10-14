# UbuntuConnect — Database Schema (Figma / FigJam Friendly)

> Documentation only. No application code was changed to produce this file.
>
> **Sources of truth (in order of authority):**
> 1. `backend/UbuntuConnectAPI/Data/AppDbContext.cs` (EF Core model)
> 2. `backend/UbuntuConnectAPI/Models/*.cs` (entity classes, nullability)
> 3. `MASTER_SCRIPT.sql` (raw SQL — authoritative for SQL names, types, NULL/NOT NULL, DEFAULT, CHECK, ON DELETE)
>
> Where the EF model and SQL disagree, **SQL names/types win** and the discrepancy is called out in section F.

**Totals:** 23 tables · 37 foreign-key constraints (see sections C & E). Three of those FKs (`FK_PostReport_Users`, `FK_PostReport_Admin`, `FK_Individual_KycReviewer`) exist in SQL only and are not mapped in the EF model — see section F.

---

## A) Legend — Crow's-Foot Multiplicity Notation

Each relationship connector has a symbol at the **parent** end and a symbol at the **child** end.

| Notation | Meaning |
|----------|---------|
| `(1)` exactly one | mandatory single — the FK column is **NOT NULL** |
| `(0..1)` zero or one | optional single — FK column is **NULL**able, or the "one" side of a 1:1 |
| `(1..1)` one and only one | identifying mandatory parent |
| `(0..*)` zero or many | the "many" child side (default collection) |
| `(1..*)` one or many | many child side where at least one is required (rare here) |

**Crow's-foot glyphs used in the relationship lines (section C):**

```
──||     exactly one          (bar bar)
──o|     zero or one          (circle bar)
>──      many (crow's foot)
o<       zero or many         (circle + crow's foot)
|<       one or many          (bar + crow's foot)
```

**Mermaid cardinality (section D):**

| Mermaid | Reads as |
|---------|----------|
| `\|\|--o{` | one → zero-or-many |
| `\|\|--\|{` | one → one-or-many |
| `\|o--o{` | zero-or-one → zero-or-many |
| `\|\|--o\|` | one → zero-or-one (1:1 optional) |
| `\|\|--\|\|` | one → one (1:1 mandatory) |

**Column tags (section B):**
`PK` primary key · `FK` foreign key · `UQ` unique · `NN` not null · `NULL` nullable · `DEF` default · `CHK` check-constraint allowed values.

---

## B) Entity List (one card = one Figma frame / sticky)

Each block is self-contained. Format: `column : SQL type (tags)`.
EF entity name is shown when it differs from the SQL table name.

---

### 👤 **Users**
*EF entity: `User`*
```
UserId           : INT IDENTITY         (PK, NN)
UserEmail        : NVARCHAR(255)         (UQ, NN)
UserContact      : NVARCHAR(20)          (NULL)
Location         : NVARCHAR(255)         (NULL)
PasswordHash     : NVARCHAR(255)         (NN)
UserType         : NVARCHAR(20)          (NN, CHK: Individual|NPO|Business|Admin)
IsVerified       : BIT                   (NN, DEF 0)
RegistrationDate : DATETIME              (NN, DEF getdate())
IsActive         : BIT                   (NN, DEF 1)
IsEmailVerified  : BIT                   (NN, DEF 0)
```
PK: `UserId` · Unique: `UserEmail`

---

### 🧍 **Individual**
```
IndividualId     : INT IDENTITY         (PK, NN)
UserId           : INT                   (FK → Users.UserId, NN)
FirstName        : NVARCHAR(100)         (NN)
LastName         : NVARCHAR(100)         (NN)
CauseOfCare      : NVARCHAR(255)         (NULL)
IdNumber         : NVARCHAR(20)          (NULL)
IdDocumentUrl    : NVARCHAR(500)         (NULL)
SelfieUrl        : NVARCHAR(500)         (NULL)
KycStatus        : NVARCHAR(20)          (NN, DEF 'NotSubmitted', CHK: NotSubmitted|Pending|Approved|Rejected)
KycRoute         : NVARCHAR(20)          (NULL, CHK: Admin|FaceScan)
KycMatchScore    : DECIMAL(5,4)          (NULL)
ReviewedByUserId : INT                   (FK → Users.UserId, NULL)   ⚠ FK in SQL only (see F)
SubmittedDate    : DATETIME              (NULL)
ReviewedDate     : DATETIME              (NULL)
```
PK: `IndividualId` · FK: `FK_Individual_Users` (ON DELETE CASCADE), `FK_Individual_KycReviewer`

---

### 🏢 **NPO**
*EF entity: `Npo` · PK column SQL name is `NPO_Id`*
```
NPO_Id           : INT IDENTITY         (PK, NN)      [EF: NpoId]
UserId           : INT                   (FK → Users.UserId, NN)
NPORegNum        : NVARCHAR(50)          (UQ, NN)     [EF: NporegNum]
OrganizationName : NVARCHAR(255)         (NN)
NPOFocusArea     : NVARCHAR(255)         (NULL)       [EF: NpofocusArea]
NPOMission       : NVARCHAR(1000)        (NULL)       [EF: Npomission]
```
PK: `NPO_Id` · Unique: `NPORegNum` · FK: `FK_NPO_Users` (ON DELETE CASCADE)

---

### 🏬 **Business**
```
BusinessId         : INT IDENTITY       (PK, NN)
UserId             : INT                 (FK → Users.UserId, NN)
BusinessRegNum     : NVARCHAR(50)        (UQ, NN)
Industry           : NVARCHAR(100)       (NULL)
ContactPersonName  : NVARCHAR(150)       (NULL)
ContactPersonTitle : NVARCHAR(100)       (NULL)
BusinessEmail      : NVARCHAR(255)       (NULL)
CSR_Goal           : NVARCHAR(500)       (NULL)       [EF: CsrGoal]
```
PK: `BusinessId` · Unique: `BusinessRegNum` · FK: `FK_Business_Users` (ON DELETE CASCADE)

---

### 🪪 **Profile**
```
ProfileId       : INT IDENTITY          (PK, NN)
UserId          : INT                    (FK → Users.UserId, UQ, NN)
ProfileName     : NVARCHAR(150)          (NN)
Bio             : NVARCHAR(1000)         (NULL)
ProfileImage    : NVARCHAR(500)          (NULL)
BackgroundImage : NVARCHAR(500)          (NULL)
Following       : INT                    (NN, DEF 0)
Followers       : INT                    (NN, DEF 0)
```
PK: `ProfileId` · Unique: `UserId` (enforces 1:1 with Users) · FK: `FK_Profile_Users` (ON DELETE CASCADE)

---

### 👛 **Wallet**
```
WalletId : INT IDENTITY                 (PK, NN)
UserId   : INT                           (FK → Users.UserId, UQ, NN)
Balance  : DECIMAL(12,2)                 (NN, DEF 0.00, CHK: Balance >= 0)
```
PK: `WalletId` · Unique: `UserId` (enforces 1:1 with Users) · FK: `FK_Wallet_Users` (ON DELETE CASCADE)

---

### 💸 **Transactions**
*EF entity: `Transaction`*
```
TransactionId   : INT IDENTITY          (PK, NN)
SenderUserId    : INT                    (FK → Users.UserId, NULL)
ReceiverUserId  : INT                    (FK → Users.UserId, NULL)
Amount          : DECIMAL(12,2)          (NN, CHK: Amount > 0)
TransactionType : NVARCHAR(30)           (NN, CHK: Donation|Withdrawal|CampaignContribution|TopUp)
Status          : NVARCHAR(20)           (NN, DEF 'Pending', CHK: Pending|Completed|Failed|Reversed)
Timestamp       : DATETIME               (NN, DEF getdate())
```
PK: `TransactionId` · FK: `FK_Transactions_Sender` (no cascade), `FK_Transactions_Receiver` (no cascade)
Dual-FK to Users — see notes (section E).

---

### 📝 **Post**
```
PostId         : INT IDENTITY           (PK, NN)
UserId         : INT                     (FK → Users.UserId, NN)
PostTitle      : NVARCHAR(255)           (NN)
Content        : NVARCHAR(MAX)           (NULL)
MediaURL       : NVARCHAR(500)           (NULL)      [EF: MediaUrl]
LikeCount      : INT                     (NN, DEF 0)
ActivityStatus : NVARCHAR(20)            (NN, DEF 'Active', CHK: Active|Archived|Deleted)
Timestamp      : DATETIME                (NN, DEF getdate())
```
PK: `PostId` · FK: `FK_Post_Users` (ON DELETE CASCADE)

---

### ❤️ **PostLike**
```
LikeId    : INT IDENTITY                (PK, NN)
PostId    : INT                          (FK → Post.PostId, NN)
UserId    : INT                          (FK → Users.UserId, NN)
LikedDate : DATETIME                     (NN, DEF getdate())
```
PK: `LikeId` · Unique: `(PostId, UserId)` (UQ_PostLike) · FK: `FK_PostLike_Post` (ON DELETE CASCADE), `FK_PostLike_Users` (ON DELETE NO ACTION)

---

### 💬 **Comment**
```
CommentId : INT IDENTITY                (PK, NN)
PostId    : INT                          (FK → Post.PostId, NN)
UserId    : INT                          (FK → Users.UserId, NN)
Content   : NVARCHAR(2000)               (NN)
Timestamp : DATETIME                     (NN, DEF getdate())
```
PK: `CommentId` · FK: `FK_Comment_Post` (ON DELETE CASCADE), `FK_Comment_Users` (no cascade)

---

### 🔔 **Notifications**
*EF entity: `Notification`*
```
NotificationId  : INT IDENTITY          (PK, NN)
UserId          : INT                    (FK → Users.UserId, NN)
Type            : NVARCHAR(50)           (NN)
Message         : NVARCHAR(500)          (NN)
RelatedEntityId : INT                    (NULL)
IsRead          : BIT                    (NN, DEF 0)
CreatedAt       : DATETIME               (NN, DEF getdate())
```
PK: `NotificationId` · Index: `IX_Notifications_UserId_IsRead (UserId, IsRead)` · FK: `FK_Notification_Users` (ON DELETE CASCADE)

---

### 📧 **EmailVerificationTokens**
*EF entity: `EmailVerificationToken`*
```
TokenId    : INT IDENTITY               (PK, NN)
UserId     : INT                         (FK → Users.UserId, NN)
Token      : NVARCHAR(128)               (UQ, NN)
Purpose    : NVARCHAR(50)                (NN, DEF 'EmailVerification', CHK: EmailVerification|PasswordReset)
ExpiresAt  : DATETIME                    (NN)
ConsumedAt : DATETIME                    (NULL)
CreatedAt  : DATETIME                    (NN, DEF getdate())
```
PK: `TokenId` · Unique: `Token` · FK: `FK_EmailToken_Users` (ON DELETE CASCADE)

---

### 🚩 **PostReports**
*EF entity: `PostReport`*
```
ReportId         : INT IDENTITY         (PK, NN)
PostId           : INT                   (FK → Post.PostId, NN)
ReporterUserId   : INT                   (FK → Users.UserId, NN)    ⚠ FK in SQL only (see F)
Reason           : NVARCHAR(500)         (NN)
Status           : NVARCHAR(20)          (NN, DEF 'Pending', CHK: Pending|Reviewed|Dismissed)
ReviewedByUserId : INT                   (FK → Users.UserId, NULL)  ⚠ FK in SQL only (see F)
CreatedAt        : DATETIME              (NN, DEF getdate())
ReviewedAt       : DATETIME              (NULL)
```
PK: `ReportId` · Unique: `(PostId, ReporterUserId)` (UQ_PostReport_PerUser) · FK: `FK_PostReport_Post` (ON DELETE CASCADE), `FK_PostReport_Users`, `FK_PostReport_Admin`

---

### ✅ **Verification**
```
VerificationId    : INT IDENTITY        (PK, NN)
NPO_Id            : INT                  (FK → NPO.NPO_Id, NULL)       [EF: NpoId]
BusinessId        : INT                  (FK → Business.BusinessId, NULL)
ReviewedByUserId  : INT                  (FK → Users.UserId, NULL)
NPOCertificate    : NVARCHAR(500)        (NULL)       [EF: Npocertificate]
NPOTaxCertificate : NVARCHAR(500)        (NULL)       [EF: NpotaxCertificate]
Status            : NVARCHAR(20)         (NN, DEF 'Pending', CHK: Pending|Approved|Rejected)
SubmittedDate     : DATETIME             (NN, DEF getdate())
ReviewedDate      : DATETIME             (NULL)
```
PK: `VerificationId` · FK: `FK_Verification_NPO` (no cascade), `FK_Verification_Business` (no cascade), `FK_Verification_Admin` (no cascade)
**Dual optional parent:** a row references *either* an NPO *or* a Business — see notes (section E).

---

### 🎯 **FundingRequest**
```
RequestId       : INT IDENTITY          (PK, NN)
NPO_Id          : INT                    (FK → NPO.NPO_Id, NN)        [EF: NpoId]
Title           : NVARCHAR(255)          (NN)
Purpose         : NVARCHAR(1000)         (NN)
TargetAmount    : DECIMAL(12,2)          (NN, CHK: TargetAmount > 0)
RaisedAmount    : DECIMAL(12,2)          (NN, DEF 0.00)
BudgetBreakdown : NVARCHAR(MAX)          (NULL)
Images          : NVARCHAR(500)          (NULL)
StartDate       : DATE                   (NN)
EndDate         : DATE                   (NULL)
```
PK: `RequestId` · FK: `FK_FundingRequest_NPO` (ON DELETE CASCADE)

---

### 🤝 **VolunteerOpportunity**
```
OpportunityId    : INT IDENTITY         (PK, NN)
NPO_Id           : INT                   (FK → NPO.NPO_Id, NN)        [EF: NpoId]
FundingRequestId : INT                   (FK → FundingRequest.RequestId, NULL)
RoleTitle        : NVARCHAR(150)         (NN)
Category         : NVARCHAR(100)         (NULL)
NumOfPositions   : INT                   (NN, DEF 1)
Description      : NVARCHAR(1000)        (NULL)
SkillsRequired   : NVARCHAR(500)         (NULL)
TimeCommitment   : NVARCHAR(100)         (NULL)
Duration         : NVARCHAR(100)         (NULL)
MediaURL         : NVARCHAR(500)         (NULL)      [EF: MediaUrl]
```
PK: `OpportunityId` · FK: `FK_VolOpp_NPO` (ON DELETE CASCADE), `FK_VolOpp_FundingRequest` (no cascade)

---

### 📋 **VolunteerApplication**
```
ApplicationId   : INT IDENTITY          (PK, NN)
UserId          : INT                    (FK → Users.UserId, NN)
OpportunityId   : INT                    (FK → VolunteerOpportunity.OpportunityId, NN)
FirstName       : NVARCHAR(100)          (NN)
LastName        : NVARCHAR(100)          (NN)
Email           : NVARCHAR(255)          (NN)
PhoneNum        : NVARCHAR(20)           (NULL)
Skills          : NVARCHAR(500)          (NULL)
Availability    : NVARCHAR(255)          (NULL)
WhyVolunteer    : NVARCHAR(1000)         (NULL)
Address         : NVARCHAR(255)          (NULL)
IDNumber        : NVARCHAR(20)           (NULL)      [EF: Idnumber]
IDCardImage     : NVARCHAR(500)          (NULL)      [EF: IdcardImage]
FaceImage       : NVARCHAR(500)          (NULL)
Status          : NVARCHAR(20)           (NN, DEF 'Pending', CHK: Pending|Accepted|Rejected|Cancelled)
ApplicationDate : DATETIME               (NN, DEF getdate())
```
PK: `ApplicationId` · FK: `FK_VolApp_Users` (no cascade), `FK_VolApp_Opportunity` (ON DELETE CASCADE)

---

### ⏱️ **VolunteerLog**
```
LogId         : INT IDENTITY            (PK, NN)
ApplicationId : INT                      (FK → VolunteerApplication.ApplicationId, NN)
LogHours      : DECIMAL(5,2)             (NN, CHK: LogHours > 0)
LogDate       : DATE                     (NN)
Notes         : NVARCHAR(500)            (NULL)
```
PK: `LogId` · FK: `FK_VolLog_Application` (ON DELETE CASCADE)

---

### 📣 **PartnershipCampaign**
```
CampaignId       : INT IDENTITY         (PK, NN)
BusinessId       : INT                   (FK → Business.BusinessId, NN)
Title            : NVARCHAR(255)         (NN)
Category         : NVARCHAR(100)         (NULL)
BudgetPerPartner : DECIMAL(12,2)         (NULL)
NumOfPartners    : INT                   (NULL)
Requirements     : NVARCHAR(1000)        (NULL)
Description      : NVARCHAR(2000)        (NULL)
StartDate        : DATE                  (NN)
EndDate          : DATE                  (NULL)
ImageUrl         : NVARCHAR(500)         (NULL)
```
PK: `CampaignId` · FK: `FK_Campaign_Business` (ON DELETE CASCADE)

---

### 📑 **CampaignApplication**
```
ApplicationId   : INT IDENTITY          (PK, NN)
CampaignId      : INT                    (FK → PartnershipCampaign.CampaignId, NN)
NPO_Id          : INT                    (FK → NPO.NPO_Id, NN)        [EF: NpoId]
ApplicationDate : DATETIME               (NN, DEF getdate())
Status          : NVARCHAR(20)           (NN, DEF 'Pending', CHK: Pending|Accepted|Rejected)
Motivation      : NVARCHAR(1000)         (NULL)
```
PK: `ApplicationId` · Unique: `(CampaignId, NPO_Id)` (UQ_CampaignApplication) · FK: `FK_CampApp_Campaign` (ON DELETE CASCADE), `FK_CampApp_NPO` (no cascade)

---

### 📈 **ImpactTrack**
```
ImpactId     : INT IDENTITY             (PK, NN)
NPO_Id       : INT                       (FK → NPO.NPO_Id, NN)        [EF: NpoId]
ImpactMetric : NVARCHAR(255)             (NN)
Value        : DECIMAL(12,2)             (NN)
Period       : NVARCHAR(50)              (NN)
Description  : NVARCHAR(1000)            (NULL)
```
PK: `ImpactId` · FK: `FK_ImpactTrack_NPO` (ON DELETE CASCADE)

---

### 🏗️ **Projects**
*EF entity: `Project`*
```
ProjectId       : INT IDENTITY          (PK, NN)
NPO_Id          : INT                    (FK → NPO.NPO_Id, NN)        [EF: NpoId]
ProjectName     : NVARCHAR(255)          (NN)
ProjectDesc     : NVARCHAR(2000)         (NULL)
ProjectStatus   : NVARCHAR(20)           (NN, DEF 'Planning', CHK: Planning|Active|Completed|Suspended)
ProjectProgress : DECIMAL(5,2)           (NN, DEF 0.00, CHK: 0–100)
TargetAmount    : DECIMAL(12,2)          (NN, DEF 0.00)
RaisedAmount    : DECIMAL(12,2)          (NN, DEF 0.00)
Images          : NVARCHAR(2000)         (NULL)
StartDate       : DATETIME2              (NULL)
EndDate         : DATETIME2              (NULL)
```
PK: `ProjectId` · FK: `FK_Projects_NPO` (ON DELETE CASCADE)

---

### 🔗 **Follow**
```
FollowId   : INT IDENTITY               (PK, NN)
UserId     : INT                         (FK → Users.UserId, NN)
NPO_Id     : INT                         (FK → NPO.NPO_Id, NN)        [EF: NpoId]
FollowDate : DATETIME                    (NN, DEF getdate())
```
PK: `FollowId` · Unique: `(UserId, NPO_Id)` (UQ_Follow) · FK: `FK_Follow_Users` (no cascade), `FK_Follow_NPO` (no cascade)
Junction table linking Users ↔ NPO (a user follows many NPOs; an NPO is followed by many users).

---

## C) Relationships — one line = one Figma connector

Format: `Parent (mult) ──< Child (mult)  [via FK column, on delete X]`

```
Users (1)                 ──o<  Individual (0..*)            [FK UserId, ON DELETE CASCADE]
Users (1)                 ──o<  NPO (0..*)                   [FK UserId, ON DELETE CASCADE]
Users (1)                 ──o<  Business (0..*)              [FK UserId, ON DELETE CASCADE]
Users (1)                 ──o|  Profile (0..1)               [FK UserId UNIQUE, ON DELETE CASCADE]  (1:1 optional)
Users (1)                 ──o|  Wallet (0..1)                [FK UserId UNIQUE, ON DELETE CASCADE]  (1:1 optional)
Users (1)                 ──o<  Post (0..*)                  [FK UserId, ON DELETE CASCADE]
Users (1)                 ──o<  PostLike (0..*)              [FK UserId, ON DELETE NO ACTION]
Users (1)                 ──o<  Comment (0..*)               [FK UserId, no cascade]
Users (1)                 ──o<  Notifications (0..*)         [FK UserId, ON DELETE CASCADE]
Users (1)                 ──o<  EmailVerificationTokens (0..*) [FK UserId, ON DELETE CASCADE]
Users (1)                 ──o<  Follow (0..*)                [FK UserId, no cascade]
Users (1)                 ──o<  VolunteerApplication (0..*)  [FK UserId, no cascade]
Users (0..1 sender)       ──o<  Transactions (0..*)          [FK SenderUserId NULL, no cascade]
Users (0..1 receiver)     ──o<  Transactions (0..*)          [FK ReceiverUserId NULL, no cascade]
Users (0..1 reviewer)     ──o<  Verification (0..*)          [FK ReviewedByUserId NULL, no cascade]
Users (0..1 reviewer)     ──o<  PostReports (0..*)           [FK ReviewedByUserId NULL]        (SQL-only FK)
Users (1 reporter)        ──o<  PostReports (0..*)           [FK ReporterUserId, no cascade]   (SQL-only FK)
Users (0..1 reviewer)     ──o<  Individual (0..*)            [FK ReviewedByUserId NULL]        (SQL-only FK)

NPO (1)                   ──o<  FundingRequest (0..*)        [FK NPO_Id, ON DELETE CASCADE]
NPO (1)                   ──o<  VolunteerOpportunity (0..*)  [FK NPO_Id, ON DELETE CASCADE]
NPO (1)                   ──o<  ImpactTrack (0..*)           [FK NPO_Id, ON DELETE CASCADE]
NPO (1)                   ──o<  Projects (0..*)              [FK NPO_Id, ON DELETE CASCADE]
NPO (1)                   ──o<  CampaignApplication (0..*)   [FK NPO_Id, no cascade]
NPO (1)                   ──o<  Follow (0..*)                [FK NPO_Id, no cascade]
NPO (0..1)                ──o<  Verification (0..*)          [FK NPO_Id NULL, no cascade]

Business (1)              ──o<  PartnershipCampaign (0..*)   [FK BusinessId, ON DELETE CASCADE]
Business (0..1)           ──o<  Verification (0..*)          [FK BusinessId NULL, no cascade]

Post (1)                  ──o<  PostLike (0..*)              [FK PostId, ON DELETE CASCADE]
Post (1)                  ──o<  Comment (0..*)               [FK PostId, ON DELETE CASCADE]
Post (1)                  ──o<  PostReports (0..*)           [FK PostId, ON DELETE CASCADE]

FundingRequest (0..1)     ──o<  VolunteerOpportunity (0..*)  [FK FundingRequestId NULL, no cascade]
VolunteerOpportunity (1)  ──o<  VolunteerApplication (0..*)  [FK OpportunityId, ON DELETE CASCADE]
VolunteerApplication (1)  ──o<  VolunteerLog (0..*)          [FK ApplicationId, ON DELETE CASCADE]

PartnershipCampaign (1)   ──o<  CampaignApplication (0..*)   [FK CampaignId, ON DELETE CASCADE]
```

---

## D) Mermaid `erDiagram` (paste into a Mermaid → Figma / FigJam plugin)

```mermaid
erDiagram
    Users ||--o{ Individual : "has"
    Users ||--o{ NPO : "has"
    Users ||--o{ Business : "has"
    Users ||--o| Profile : "has"
    Users ||--o| Wallet : "has"
    Users ||--o{ Post : "authors"
    Users ||--o{ PostLike : "makes"
    Users ||--o{ Comment : "writes"
    Users ||--o{ Notifications : "receives"
    Users ||--o{ EmailVerificationTokens : "owns"
    Users ||--o{ Follow : "follows"
    Users ||--o{ VolunteerApplication : "submits"
    Users |o--o{ Transactions : "sends"
    Users |o--o{ Transactions : "receives"
    Users |o--o{ Verification : "reviews"
    Users |o--o{ PostReports : "reviews"
    Users ||--o{ PostReports : "reports"
    Users |o--o{ Individual : "reviews_kyc"

    NPO ||--o{ FundingRequest : "raises"
    NPO ||--o{ VolunteerOpportunity : "offers"
    NPO ||--o{ ImpactTrack : "tracks"
    NPO ||--o{ Projects : "runs"
    NPO ||--o{ CampaignApplication : "applies"
    NPO ||--o{ Follow : "followed_by"
    NPO |o--o{ Verification : "verified_by"

    Business ||--o{ PartnershipCampaign : "creates"
    Business |o--o{ Verification : "verified_by"

    Post ||--o{ PostLike : "liked_by"
    Post ||--o{ Comment : "commented_on"
    Post ||--o{ PostReports : "reported_in"

    FundingRequest |o--o{ VolunteerOpportunity : "linked_to"
    VolunteerOpportunity ||--o{ VolunteerApplication : "receives"
    VolunteerApplication ||--o{ VolunteerLog : "logs"

    PartnershipCampaign ||--o{ CampaignApplication : "receives"

    Users {
        int UserId PK
        string UserEmail UQ
        string UserContact
        string Location
        string PasswordHash
        string UserType "Individual|NPO|Business|Admin"
        bool IsVerified
        datetime RegistrationDate
        bool IsActive
        bool IsEmailVerified
    }
    Individual {
        int IndividualId PK
        int UserId FK
        string FirstName
        string LastName
        string CauseOfCare
        string IdNumber
        string IdDocumentUrl
        string SelfieUrl
        string KycStatus "NotSubmitted|Pending|Approved|Rejected"
        string KycRoute "Admin|FaceScan"
        decimal KycMatchScore
        int ReviewedByUserId FK
        datetime SubmittedDate
        datetime ReviewedDate
    }
    NPO {
        int NPO_Id PK
        int UserId FK
        string NPORegNum UQ
        string OrganizationName
        string NPOFocusArea
        string NPOMission
    }
    Business {
        int BusinessId PK
        int UserId FK
        string BusinessRegNum UQ
        string Industry
        string ContactPersonName
        string ContactPersonTitle
        string BusinessEmail
        string CSR_Goal
    }
    Profile {
        int ProfileId PK
        int UserId FK,UQ
        string ProfileName
        string Bio
        string ProfileImage
        string BackgroundImage
        int Following
        int Followers
    }
    Wallet {
        int WalletId PK
        int UserId FK,UQ
        decimal Balance "CHK >= 0"
    }
    Transactions {
        int TransactionId PK
        int SenderUserId FK
        int ReceiverUserId FK
        decimal Amount "CHK > 0"
        string TransactionType "Donation|Withdrawal|CampaignContribution|TopUp"
        string Status "Pending|Completed|Failed|Reversed"
        datetime Timestamp
    }
    Post {
        int PostId PK
        int UserId FK
        string PostTitle
        string Content
        string MediaURL
        int LikeCount
        string ActivityStatus "Active|Archived|Deleted"
        datetime Timestamp
    }
    PostLike {
        int LikeId PK
        int PostId FK
        int UserId FK
        datetime LikedDate
    }
    Comment {
        int CommentId PK
        int PostId FK
        int UserId FK
        string Content
        datetime Timestamp
    }
    Notifications {
        int NotificationId PK
        int UserId FK
        string Type
        string Message
        int RelatedEntityId
        bool IsRead
        datetime CreatedAt
    }
    EmailVerificationTokens {
        int TokenId PK
        int UserId FK
        string Token UQ
        string Purpose "EmailVerification|PasswordReset"
        datetime ExpiresAt
        datetime ConsumedAt
        datetime CreatedAt
    }
    PostReports {
        int ReportId PK
        int PostId FK
        int ReporterUserId FK
        string Reason
        string Status "Pending|Reviewed|Dismissed"
        int ReviewedByUserId FK
        datetime CreatedAt
        datetime ReviewedAt
    }
    Verification {
        int VerificationId PK
        int NPO_Id FK
        int BusinessId FK
        int ReviewedByUserId FK
        string NPOCertificate
        string NPOTaxCertificate
        string Status "Pending|Approved|Rejected"
        datetime SubmittedDate
        datetime ReviewedDate
    }
    FundingRequest {
        int RequestId PK
        int NPO_Id FK
        string Title
        string Purpose
        decimal TargetAmount "CHK > 0"
        decimal RaisedAmount
        string BudgetBreakdown
        string Images
        date StartDate
        date EndDate
    }
    VolunteerOpportunity {
        int OpportunityId PK
        int NPO_Id FK
        int FundingRequestId FK
        string RoleTitle
        string Category
        int NumOfPositions
        string Description
        string SkillsRequired
        string TimeCommitment
        string Duration
        string MediaURL
    }
    VolunteerApplication {
        int ApplicationId PK
        int UserId FK
        int OpportunityId FK
        string FirstName
        string LastName
        string Email
        string PhoneNum
        string Skills
        string Availability
        string WhyVolunteer
        string Address
        string IDNumber
        string IDCardImage
        string FaceImage
        string Status "Pending|Accepted|Rejected|Cancelled"
        datetime ApplicationDate
    }
    VolunteerLog {
        int LogId PK
        int ApplicationId FK
        decimal LogHours "CHK > 0"
        date LogDate
        string Notes
    }
    PartnershipCampaign {
        int CampaignId PK
        int BusinessId FK
        string Title
        string Category
        decimal BudgetPerPartner
        int NumOfPartners
        string Requirements
        string Description
        date StartDate
        date EndDate
        string ImageUrl
    }
    CampaignApplication {
        int ApplicationId PK
        int CampaignId FK
        int NPO_Id FK
        datetime ApplicationDate
        string Status "Pending|Accepted|Rejected"
        string Motivation
    }
    ImpactTrack {
        int ImpactId PK
        int NPO_Id FK
        string ImpactMetric
        decimal Value
        string Period
        string Description
    }
    Projects {
        int ProjectId PK
        int NPO_Id FK
        string ProjectName
        string ProjectDesc
        string ProjectStatus "Planning|Active|Completed|Suspended"
        decimal ProjectProgress "CHK 0-100"
        decimal TargetAmount
        decimal RaisedAmount
        string Images
        datetime2 StartDate
        datetime2 EndDate
    }
    Follow {
        int FollowId PK
        int UserId FK
        int NPO_Id FK
        datetime FollowDate
    }
```

---

## E) Notes on the tricky multiplicities

**1. Verification — dual *optional* parent (NPO **or** Business).**
`Verification.NPO_Id` and `Verification.BusinessId` are **both nullable**. A single row attaches to exactly one subject: an NPO verification sets `NPO_Id`, a Business verification sets `BusinessId`. There is no DB-level CHECK forcing "exactly one"; it is enforced in application logic. In crow's-foot terms:
- `NPO (0..1) ──o< Verification (0..*)`
- `Business (0..1) ──o< Verification (0..*)`

A given Verification therefore has an *optional* NPO parent and an *optional* Business parent. Migration 033 relaxed the original `NPO_Id` from NOT NULL (cascade) to NULL and re-created the FK **non-cascading**, then added the nullable `BusinessId` FK.

**2. Transactions — dual self-reference into Users.**
Both `SenderUserId` and `ReceiverUserId` are nullable FKs to `Users.UserId`. This is a two-leg self-relationship on the Users table (money moving user→user). Either end can be NULL (e.g. a system TopUp has no sender, a withdrawal has no in-platform receiver). Neither FK cascades, so deleting a user does not delete their transactions.
- `Users (0..1 as sender) ──o< Transactions (0..*)`
- `Users (0..1 as receiver) ──o< Transactions (0..*)`

**3. Optional admin reviewer FKs.**
Three tables carry a nullable `ReviewedByUserId` pointing back to an admin in `Users`:
- `Verification.ReviewedByUserId` → `FK_Verification_Admin` (mapped in EF)
- `PostReports.ReviewedByUserId` → `FK_PostReport_Admin` (SQL only — see F)
- `Individual.ReviewedByUserId` → `FK_Individual_KycReviewer` (SQL only — see F)

Each is `(0..1)` on the parent side: a record may be unreviewed (NULL) or reviewed by one admin.

**4. Follow — junction table (Users ↔ NPO many-to-many).**
`Follow` resolves a many-to-many: a user follows many NPOs, an NPO is followed by many users. Both FK columns are NOT NULL with a composite unique key `(UserId, NPO_Id)` preventing duplicate follows. Conceptually: `Users (0..*) ──<>── NPO (0..*)` realised through `Follow`.

**5. One-to-one optionals (Profile, Wallet).**
`Profile.UserId` and `Wallet.UserId` are each NOT NULL **and UNIQUE**, so from the Users side the relationship is `(1) ── (0..1)`: a user may have at most one profile / one wallet, and each profile / wallet belongs to exactly one user. EF models these with `WithOne` / `HasForeignKey<T>`.

---

## F) Schema discrepancies (EF model vs MASTER_SCRIPT.sql)

SQL is treated as authoritative for names/types. These are differences worth noting:

1. **`PostReports` reporter & admin FKs — SQL only.** `MASTER_SCRIPT.sql` defines `FK_PostReport_Users` (ReporterUserId → Users) and `FK_PostReport_Admin` (ReviewedByUserId → Users). `AppDbContext.cs` only configures `FK_PostReport_Post`; the `PostReport` entity has **no navigation properties** for reporter or reviewer. The columns exist in both, but EF is unaware of the two user FKs. Documented above using the SQL definitions.

2. **`Individual` KYC reviewer FK — SQL only.** `MASTER_SCRIPT.sql` (migration 029) adds `ReviewedByUserId` with `FK_Individual_KycReviewer` → Users. The `Individual` model has the `ReviewedByUserId` property, but `AppDbContext.cs` does **not** configure this relationship (no navigation property). Documented using the SQL FK.

3. **`ON DELETE` behavior differs on several FKs.** The SQL script declares plain FKs (no cascade) for `Follow`, `CampaignApplication.NPO_Id`, `VolunteerApplication.UserId`, `Comment.UserId`, `Verification.*`, while the EF model marks the same relationships `OnDelete(DeleteBehavior.ClientSetNull)`. `ClientSetNull` is EF's default for required relationships and does not emit a cascade — functionally aligned with the SQL "no cascade," but the two are configured differently. The SQL `ON DELETE` column in sections B/C reflects the database truth.

4. **`VolunteerOpportunity.NPO_Id` cascade.** SQL declares `FK_VolOpp_NPO ... ON DELETE CASCADE`; EF configures the same relationship with no explicit delete behavior (defaults apply). SQL value (CASCADE) is documented.

5. **Casing / name mapping.** Many EF property names differ in casing from SQL columns (e.g. EF `NporegNum` ↔ SQL `NPORegNum`, EF `CsrGoal` ↔ SQL `CSR_Goal`, EF `MediaUrl` ↔ SQL `MediaURL`, EF `NpoId` ↔ SQL `NPO_Id`, EF `Idnumber` ↔ SQL `IDNumber`). These are handled by `HasColumnName` in `AppDbContext.cs` and are not true discrepancies — the `[EF: ...]` annotations in section B map each one.

6. **`PostLike` / `Comment` user-delete rule.** SQL sets `FK_PostLike_Users` to `ON DELETE NO ACTION`; EF uses `ClientSetNull`. Both avoid a cascade; documented as NO ACTION per SQL.
