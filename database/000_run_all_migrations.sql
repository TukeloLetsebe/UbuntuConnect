-- ============================================================
--  UbuntuConnect | Collab4Change
--  DB Owner: Tukelo Letsebe
--  000 | MASTER MIGRATION SCRIPT (consolidated)
-- ============================================================
--  Builds the ENTIRE UbuntuConnect_DB schema in one run: creates
--  the database (if missing) and every table in dependency order,
--  with all later column/constraint alterations folded in.
--
--  Kept in sync with MASTER_SCRIPT.sql — both are canonical
--  fresh-run scripts and define the SAME schema. Idempotent:
--  every object is guarded, safe to re-run.
--
--  Does NOT insert data — run seed_data.sql afterwards.
--  Run:  sqlcmd -S localhost -E -C -i database\000_run_all_migrations.sql
-- ============================================================

-- ── Step 1: Create the database if it doesn't exist yet ──────
IF NOT EXISTS (
    SELECT * FROM sys.databases WHERE name = 'UbuntuConnect_DB'
)
BEGIN
    CREATE DATABASE UbuntuConnect_DB;
    PRINT '000 | UbuntuConnect_DB created.';
END
ELSE
    PRINT '000 | UbuntuConnect_DB already exists — skipped.';
GO

USE UbuntuConnect_DB;
GO

-- ============================================================
-- 001 | Users
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Users' AND xtype = 'U')
BEGIN
    CREATE TABLE Users (
        UserId           INT IDENTITY(1,1) PRIMARY KEY,
        UserEmail        NVARCHAR(255) NOT NULL UNIQUE,
        UserContact      NVARCHAR(20)  NULL,
        Location         NVARCHAR(255) NULL,
        PasswordHash     NVARCHAR(255) NOT NULL,
        UserType         NVARCHAR(20)  NOT NULL
                         CONSTRAINT CHK_Users_UserType
                         CHECK (UserType IN ('Individual', 'NPO', 'Business', 'Admin')),
        IsVerified       BIT           NOT NULL DEFAULT 0,
        RegistrationDate DATETIME      NOT NULL DEFAULT GETDATE()
    );
    PRINT '001 | Users — created.';
END
ELSE PRINT '001 | Users — already exists, skipped.';
GO

-- ============================================================
-- 002 | Individual
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Individual' AND xtype = 'U')
BEGIN
    CREATE TABLE Individual (
        IndividualId INT IDENTITY(1,1) PRIMARY KEY,
        UserId       INT           NOT NULL
                     CONSTRAINT FK_Individual_Users
                     FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
        FirstName    NVARCHAR(100) NOT NULL,
        LastName     NVARCHAR(100) NOT NULL,
        CauseOfCare  NVARCHAR(255) NULL
    );
    PRINT '002 | Individual — created.';
END
ELSE PRINT '002 | Individual — already exists, skipped.';
GO

-- ============================================================
-- 003 | NPO
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'NPO' AND xtype = 'U')
BEGIN
    CREATE TABLE NPO (
        NPO_Id           INT IDENTITY(1,1) PRIMARY KEY,
        UserId           INT            NOT NULL
                         CONSTRAINT FK_NPO_Users
                         FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
        NPORegNum        NVARCHAR(50)   NOT NULL UNIQUE,
        OrganizationName NVARCHAR(255)  NOT NULL,
        NPOFocusArea     NVARCHAR(255)  NULL,
        NPOMission       NVARCHAR(1000) NULL
    );
    PRINT '003 | NPO — created.';
END
ELSE PRINT '003 | NPO — already exists, skipped.';
GO

-- ============================================================
-- 004 | Business
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Business' AND xtype = 'U')
BEGIN
    CREATE TABLE Business (
        BusinessId         INT IDENTITY(1,1) PRIMARY KEY,
        UserId             INT           NOT NULL
                           CONSTRAINT FK_Business_Users
                           FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
        BusinessRegNum     NVARCHAR(50)  NOT NULL UNIQUE,
        Industry           NVARCHAR(100) NULL,
        ContactPersonName  NVARCHAR(150) NULL,
        ContactPersonTitle NVARCHAR(100) NULL,
        BusinessEmail      NVARCHAR(255) NULL,
        CSR_Goal           NVARCHAR(500) NULL
    );
    PRINT '004 | Business — created.';
END
ELSE PRINT '004 | Business — already exists, skipped.';
GO

-- ============================================================
-- 005 | Profile  (BackgroundImage inlined — see migration 033)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Profile' AND xtype = 'U')
BEGIN
    CREATE TABLE Profile (
        ProfileId       INT IDENTITY(1,1) PRIMARY KEY,
        UserId          INT            NOT NULL UNIQUE
                        CONSTRAINT FK_Profile_Users
                        FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
        ProfileName     NVARCHAR(150)  NOT NULL,
        Bio             NVARCHAR(1000) NULL,
        ProfileImage    NVARCHAR(500)  NULL,
        BackgroundImage NVARCHAR(500)  NULL,
        Following       INT            NOT NULL DEFAULT 0,
        Followers       INT            NOT NULL DEFAULT 0
    );
    PRINT '005 | Profile — created.';
END
ELSE PRINT '005 | Profile — already exists, skipped.';
GO

-- 005b | Backfill Profile.BackgroundImage on pre-existing databases (migration 033).
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Profile') AND name = 'BackgroundImage')
BEGIN
    ALTER TABLE Profile ADD BackgroundImage NVARCHAR(500) NULL;
    PRINT '005b | Profile.BackgroundImage added.';
END
ELSE PRINT '005b | Profile.BackgroundImage already exists, skipped.';
GO

-- ============================================================
-- 006 | Wallet
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Wallet' AND xtype = 'U')
BEGIN
    CREATE TABLE Wallet (
        WalletId INT IDENTITY(1,1) PRIMARY KEY,
        UserId   INT            NOT NULL UNIQUE
                 CONSTRAINT FK_Wallet_Users
                 FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
        Balance  DECIMAL(12,2)  NOT NULL DEFAULT 0.00
                 CONSTRAINT CHK_Wallet_Balance CHECK (Balance >= 0)
    );
    PRINT '006 | Wallet — created.';
END
ELSE PRINT '006 | Wallet — already exists, skipped.';
GO

-- ============================================================
-- 007 | Transactions  (TopUp type + Reason column inlined — migrations 021, 034)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Transactions' AND xtype = 'U')
BEGIN
    CREATE TABLE Transactions (
        TransactionId   INT IDENTITY(1,1) PRIMARY KEY,
        SenderUserId    INT            NULL
                        CONSTRAINT FK_Transactions_Sender
                        FOREIGN KEY REFERENCES Users(UserId),
        ReceiverUserId  INT            NULL
                        CONSTRAINT FK_Transactions_Receiver
                        FOREIGN KEY REFERENCES Users(UserId),
        Amount          DECIMAL(12,2)  NOT NULL
                        CONSTRAINT CHK_Transactions_Amount CHECK (Amount > 0),
        TransactionType NVARCHAR(30)   NOT NULL
                        CONSTRAINT CHK_Transactions_Type
                        CHECK (TransactionType IN ('Donation', 'Withdrawal', 'CampaignContribution', 'TopUp')),
        Status          NVARCHAR(20)   NOT NULL DEFAULT 'Pending'
                        CONSTRAINT CHK_Transactions_Status
                        CHECK (Status IN ('Pending', 'Completed', 'Failed', 'Reversed')),
        Timestamp       DATETIME       NOT NULL DEFAULT GETDATE(),
        -- Why the funds moved (used for Withdrawal audit). See migration 034.
        Reason          NVARCHAR(255)  NULL
    );
    PRINT '007 | Transactions — created.';
END
ELSE PRINT '007 | Transactions — already exists, skipped.';
GO

-- 007b | Backfill Transactions.Reason on pre-existing databases (migration 034).
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Transactions') AND name = 'Reason')
BEGIN
    ALTER TABLE Transactions ADD Reason NVARCHAR(255) NULL;
    PRINT '007b | Transactions.Reason column added.';
END
ELSE PRINT '007b | Transactions.Reason already exists, skipped.';
GO

-- 007c | Backfill 'TopUp' into CHK_Transactions_Type on pre-existing databases (migration 021).
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CHK_Transactions_Type'
      AND OBJECT_NAME(parent_object_id) = 'Transactions'
      AND definition NOT LIKE '%TopUp%'
)
BEGIN
    ALTER TABLE Transactions DROP CONSTRAINT CHK_Transactions_Type;
    ALTER TABLE Transactions ADD CONSTRAINT CHK_Transactions_Type
        CHECK (TransactionType IN ('Donation', 'Withdrawal', 'CampaignContribution', 'TopUp'));
    PRINT '007c | Transactions.TransactionType CHECK updated to include TopUp.';
END
ELSE PRINT '007c | Transactions.TransactionType already allows TopUp, skipped.';
GO

-- ============================================================
-- 008 | Post
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Post' AND xtype = 'U')
BEGIN
    CREATE TABLE Post (
        PostId         INT IDENTITY(1,1) PRIMARY KEY,
        UserId         INT            NOT NULL
                       CONSTRAINT FK_Post_Users
                       FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
        PostTitle      NVARCHAR(255)  NOT NULL,
        Content        NVARCHAR(MAX)  NULL,
        MediaURL       NVARCHAR(500)  NULL,
        LikeCount      INT            NOT NULL DEFAULT 0,
        ActivityStatus NVARCHAR(20)   NOT NULL DEFAULT 'Active'
                       CONSTRAINT CHK_Post_Status
                       CHECK (ActivityStatus IN ('Active', 'Archived', 'Deleted')),
        Timestamp      DATETIME       NOT NULL DEFAULT GETDATE()
    );
    PRINT '008 | Post — created.';
END
ELSE PRINT '008 | Post — already exists, skipped.';
GO

-- ============================================================
-- 009 | Follow
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Follow' AND xtype = 'U')
BEGIN
    CREATE TABLE Follow (
        FollowId   INT IDENTITY(1,1) PRIMARY KEY,
        UserId     INT      NOT NULL
                   CONSTRAINT FK_Follow_Users FOREIGN KEY REFERENCES Users(UserId),
        NPO_Id     INT      NOT NULL
                   CONSTRAINT FK_Follow_NPO FOREIGN KEY REFERENCES NPO(NPO_Id),
        FollowDate DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_Follow UNIQUE (UserId, NPO_Id)
    );
    PRINT '009 | Follow — created.';
END
ELSE PRINT '009 | Follow — already exists, skipped.';
GO

-- ============================================================
-- 010 | FundingRequest
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'FundingRequest' AND xtype = 'U')
BEGIN
    CREATE TABLE FundingRequest (
        RequestId       INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id          INT            NOT NULL
                        CONSTRAINT FK_FundingRequest_NPO
                        FOREIGN KEY REFERENCES NPO(NPO_Id) ON DELETE CASCADE,
        Title           NVARCHAR(255)  NOT NULL,
        Purpose         NVARCHAR(1000) NOT NULL,
        TargetAmount    DECIMAL(12,2)  NOT NULL
                        CONSTRAINT CHK_FR_Target CHECK (TargetAmount > 0),
        RaisedAmount    DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
        BudgetBreakdown NVARCHAR(MAX)  NULL,
        Images          NVARCHAR(500)  NULL,
        StartDate       DATE           NOT NULL,
        EndDate         DATE           NULL
    );
    PRINT '010 | FundingRequest — created.';
END
ELSE PRINT '010 | FundingRequest — already exists, skipped.';
GO

-- ============================================================
-- 011 | VolunteerOpportunity
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'VolunteerOpportunity' AND xtype = 'U')
BEGIN
    CREATE TABLE VolunteerOpportunity (
        OpportunityId    INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id           INT            NOT NULL
                         CONSTRAINT FK_VolOpp_NPO
                         FOREIGN KEY REFERENCES NPO(NPO_Id) ON DELETE CASCADE,
        FundingRequestId INT            NULL
                         CONSTRAINT FK_VolOpp_FundingRequest
                         FOREIGN KEY REFERENCES FundingRequest(RequestId),
        RoleTitle        NVARCHAR(150)  NOT NULL,
        Category         NVARCHAR(100)  NULL,
        NumOfPositions   INT            NOT NULL DEFAULT 1,
        Description      NVARCHAR(1000) NULL,
        SkillsRequired   NVARCHAR(500)  NULL,
        TimeCommitment   NVARCHAR(100)  NULL,
        Duration         NVARCHAR(100)  NULL,
        MediaURL         NVARCHAR(500)  NULL
    );
    PRINT '011 | VolunteerOpportunity — created.';
END
ELSE PRINT '011 | VolunteerOpportunity — already exists, skipped.';
GO

-- ============================================================
-- 012 | VolunteerApplication  (Completed status inlined — migration 032)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'VolunteerApplication' AND xtype = 'U')
BEGIN
    CREATE TABLE VolunteerApplication (
        ApplicationId   INT IDENTITY(1,1) PRIMARY KEY,
        UserId          INT            NOT NULL
                        CONSTRAINT FK_VolApp_Users FOREIGN KEY REFERENCES Users(UserId),
        OpportunityId   INT            NOT NULL
                        CONSTRAINT FK_VolApp_Opportunity
                        FOREIGN KEY REFERENCES VolunteerOpportunity(OpportunityId) ON DELETE CASCADE,
        FirstName       NVARCHAR(100)  NOT NULL,
        LastName        NVARCHAR(100)  NOT NULL,
        Email           NVARCHAR(255)  NOT NULL,
        PhoneNum        NVARCHAR(20)   NULL,
        Skills          NVARCHAR(500)  NULL,
        Availability    NVARCHAR(255)  NULL,
        WhyVolunteer    NVARCHAR(1000) NULL,
        Address         NVARCHAR(255)  NULL,
        IDNumber        NVARCHAR(20)   NULL,
        IDCardImage     NVARCHAR(500)  NULL,
        FaceImage       NVARCHAR(500)  NULL,
        Status          NVARCHAR(20)   NOT NULL DEFAULT 'Pending'
                        CONSTRAINT CHK_VolApp_Status
                        CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed')),
        ApplicationDate DATETIME       NOT NULL DEFAULT GETDATE()
    );
    PRINT '012 | VolunteerApplication — created.';
END
ELSE PRINT '012 | VolunteerApplication — already exists, skipped.';
GO

-- 012b | Backfill 'Completed' into CHK_VolApp_Status on pre-existing databases (migration 032).
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CHK_VolApp_Status'
      AND OBJECT_NAME(parent_object_id) = 'VolunteerApplication'
      AND definition NOT LIKE '%Completed%'
)
BEGIN
    ALTER TABLE VolunteerApplication DROP CONSTRAINT CHK_VolApp_Status;
    ALTER TABLE VolunteerApplication ADD CONSTRAINT CHK_VolApp_Status
        CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'));
    PRINT '012b | VolunteerApplication.Status CHECK updated to include Completed.';
END
ELSE PRINT '012b | VolunteerApplication.Status already allows Completed, skipped.';
GO

-- ============================================================
-- 013 | VolunteerLog
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'VolunteerLog' AND xtype = 'U')
BEGIN
    CREATE TABLE VolunteerLog (
        LogId         INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId INT           NOT NULL
                      CONSTRAINT FK_VolLog_Application
                      FOREIGN KEY REFERENCES VolunteerApplication(ApplicationId) ON DELETE CASCADE,
        LogHours      DECIMAL(5,2)  NOT NULL
                      CONSTRAINT CHK_VolLog_Hours CHECK (LogHours > 0),
        LogDate       DATE          NOT NULL,
        Notes         NVARCHAR(500) NULL
    );
    PRINT '013 | VolunteerLog — created.';
END
ELSE PRINT '013 | VolunteerLog — already exists, skipped.';
GO

-- ============================================================
-- 014 | PartnershipCampaign  (ImageUrl inlined — migration 031)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'PartnershipCampaign' AND xtype = 'U')
BEGIN
    CREATE TABLE PartnershipCampaign (
        CampaignId       INT IDENTITY(1,1) PRIMARY KEY,
        BusinessId       INT            NOT NULL
                         CONSTRAINT FK_Campaign_Business
                         FOREIGN KEY REFERENCES Business(BusinessId) ON DELETE CASCADE,
        Title            NVARCHAR(255)  NOT NULL,
        Category         NVARCHAR(100)  NULL,
        BudgetPerPartner DECIMAL(12,2)  NULL,
        NumOfPartners    INT            NULL,
        Requirements     NVARCHAR(1000) NULL,
        Description      NVARCHAR(2000) NULL,
        StartDate        DATE           NOT NULL,
        EndDate          DATE           NULL,
        ImageUrl         NVARCHAR(500)  NULL
    );
    PRINT '014 | PartnershipCampaign — created.';
END
ELSE PRINT '014 | PartnershipCampaign — already exists, skipped.';
GO

-- 014b | Backfill PartnershipCampaign.ImageUrl on pre-existing databases (migration 031).
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PartnershipCampaign') AND name = 'ImageUrl')
BEGIN
    ALTER TABLE PartnershipCampaign ADD ImageUrl NVARCHAR(500) NULL;
    PRINT '014b | PartnershipCampaign.ImageUrl added.';
END
ELSE PRINT '014b | PartnershipCampaign.ImageUrl already exists, skipped.';
GO

-- ============================================================
-- 015 | CampaignApplication
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'CampaignApplication' AND xtype = 'U')
BEGIN
    CREATE TABLE CampaignApplication (
        ApplicationId   INT IDENTITY(1,1) PRIMARY KEY,
        CampaignId      INT            NOT NULL
                        CONSTRAINT FK_CampApp_Campaign
                        FOREIGN KEY REFERENCES PartnershipCampaign(CampaignId) ON DELETE CASCADE,
        NPO_Id          INT            NOT NULL
                        CONSTRAINT FK_CampApp_NPO FOREIGN KEY REFERENCES NPO(NPO_Id),
        ApplicationDate DATETIME       NOT NULL DEFAULT GETDATE(),
        Status          NVARCHAR(20)   NOT NULL DEFAULT 'Pending'
                        CONSTRAINT CHK_CampApp_Status
                        CHECK (Status IN ('Pending', 'Accepted', 'Rejected')),
        Motivation      NVARCHAR(1000) NULL,
        CONSTRAINT UQ_CampaignApplication UNIQUE (CampaignId, NPO_Id)
    );
    PRINT '015 | CampaignApplication — created.';
END
ELSE PRINT '015 | CampaignApplication — already exists, skipped.';
GO

-- ============================================================
-- 016 | Verification  (Business subject support inlined — migration 035)
--      A row references EITHER an NPO or a Business (both nullable).
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Verification' AND xtype = 'U')
BEGIN
    CREATE TABLE Verification (
        VerificationId    INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id            INT           NULL
                          CONSTRAINT FK_Verification_NPO
                          FOREIGN KEY REFERENCES NPO(NPO_Id),
        BusinessId        INT           NULL
                          CONSTRAINT FK_Verification_Business
                          FOREIGN KEY REFERENCES Business(BusinessId),
        ReviewedByUserId  INT           NULL
                          CONSTRAINT FK_Verification_Admin
                          FOREIGN KEY REFERENCES Users(UserId),
        NPOCertificate    NVARCHAR(500) NULL,
        NPOTaxCertificate NVARCHAR(500) NULL,
        Status            NVARCHAR(20)  NOT NULL DEFAULT 'Pending'
                          CONSTRAINT CHK_Verification_Status
                          CHECK (Status IN ('Pending', 'Approved', 'Rejected')),
        SubmittedDate     DATETIME      NOT NULL DEFAULT GETDATE(),
        ReviewedDate      DATETIME      NULL
    );
    PRINT '016 | Verification — created.';
END
ELSE PRINT '016 | Verification — already exists, skipped.';
GO

-- 016b | Backfill Business subject support on pre-existing databases (migration 035).
--        Relax NPO_Id to NULL (re-create FK non-cascading) + add BusinessId.
IF COL_LENGTH('Verification', 'NPO_Id') IS NOT NULL
   AND COLUMNPROPERTY(OBJECT_ID('Verification'), 'NPO_Id', 'AllowsNull') = 0
BEGIN
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Verification_NPO')
        ALTER TABLE Verification DROP CONSTRAINT FK_Verification_NPO;
    ALTER TABLE Verification ALTER COLUMN NPO_Id INT NULL;
    ALTER TABLE Verification ADD CONSTRAINT FK_Verification_NPO
        FOREIGN KEY (NPO_Id) REFERENCES NPO(NPO_Id);
    PRINT '016b | Verification.NPO_Id relaxed to NULL (FK re-created non-cascading).';
END
ELSE PRINT '016b | Verification.NPO_Id already nullable, skipped.';
GO

IF COL_LENGTH('Verification', 'BusinessId') IS NULL
BEGIN
    ALTER TABLE Verification ADD BusinessId INT NULL
        CONSTRAINT FK_Verification_Business FOREIGN KEY REFERENCES Business(BusinessId);
    PRINT '016b | Verification.BusinessId added.';
END
ELSE PRINT '016b | Verification.BusinessId already exists, skipped.';
GO

-- ============================================================
-- 017 | ImpactTrack
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'ImpactTrack' AND xtype = 'U')
BEGIN
    CREATE TABLE ImpactTrack (
        ImpactId     INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id       INT            NOT NULL
                     CONSTRAINT FK_ImpactTrack_NPO
                     FOREIGN KEY REFERENCES NPO(NPO_Id) ON DELETE CASCADE,
        ImpactMetric NVARCHAR(255)  NOT NULL,
        Value        DECIMAL(12,2)  NOT NULL,
        Period       NVARCHAR(50)   NOT NULL,
        Description  NVARCHAR(1000) NULL
    );
    PRINT '017 | ImpactTrack — created.';
END
ELSE PRINT '017 | ImpactTrack — already exists, skipped.';
GO

-- ============================================================
-- 018 | Projects  (fundraiser cols 024 + date cols 030 inlined)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Projects' AND xtype = 'U')
BEGIN
    CREATE TABLE Projects (
        ProjectId       INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id          INT            NOT NULL
                        CONSTRAINT FK_Projects_NPO
                        FOREIGN KEY REFERENCES NPO(NPO_Id) ON DELETE CASCADE,
        ProjectName     NVARCHAR(255)  NOT NULL,
        ProjectDesc     NVARCHAR(2000) NULL,
        ProjectStatus   NVARCHAR(20)   NOT NULL DEFAULT 'Planning'
                        CONSTRAINT CHK_Projects_Status
                        CHECK (ProjectStatus IN ('Planning', 'Active', 'Completed', 'Suspended')),
        ProjectProgress DECIMAL(5,2)   NOT NULL DEFAULT 0.00
                        CONSTRAINT CHK_Projects_Progress CHECK (ProjectProgress BETWEEN 0 AND 100),
        TargetAmount    DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
        RaisedAmount    DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
        Images          NVARCHAR(2000) NULL,
        StartDate       DATETIME2      NULL,
        EndDate         DATETIME2      NULL
    );
    PRINT '018 | Projects — created (incl. fundraiser + date columns).';
END
ELSE PRINT '018 | Projects — already exists, skipped.';
GO

-- ============================================================
-- 019 | PostLike  (migration 022)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PostLike')
BEGIN
    CREATE TABLE PostLike (
        LikeId    INT IDENTITY(1,1) PRIMARY KEY,
        PostId    INT NOT NULL,
        UserId    INT NOT NULL,
        LikedDate DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_PostLike_Post  FOREIGN KEY (PostId) REFERENCES Post(PostId) ON DELETE CASCADE,
        CONSTRAINT FK_PostLike_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE NO ACTION,
        CONSTRAINT UQ_PostLike UNIQUE (PostId, UserId)
    );
    PRINT '019 | PostLike — created.';
END
ELSE PRINT '019 | PostLike — already exists, skipped.';
GO

-- ============================================================
-- 020 | Comment  (migration 023)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Comment' AND xtype = 'U')
BEGIN
    CREATE TABLE Comment (
        CommentId INT IDENTITY(1,1) PRIMARY KEY,
        PostId    INT            NOT NULL
                  CONSTRAINT FK_Comment_Post FOREIGN KEY REFERENCES Post(PostId) ON DELETE CASCADE,
        UserId    INT            NOT NULL
                  CONSTRAINT FK_Comment_Users FOREIGN KEY REFERENCES Users(UserId),
        Content   NVARCHAR(2000) NOT NULL,
        Timestamp DATETIME       NOT NULL DEFAULT GETDATE()
    );
    PRINT '020 | Comment — created.';
END
ELSE PRINT '020 | Comment — already exists, skipped.';
GO

-- ============================================================
-- 021 | EmailVerificationTokens  (migration 025)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'EmailVerificationTokens' AND xtype = 'U')
BEGIN
    CREATE TABLE EmailVerificationTokens (
        TokenId    INT IDENTITY(1,1) PRIMARY KEY,
        UserId     INT           NOT NULL
                   CONSTRAINT FK_EmailToken_Users
                   FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
        Token      NVARCHAR(128) NOT NULL,
        Purpose    NVARCHAR(50)  NOT NULL DEFAULT 'EmailVerification'
                   CONSTRAINT CHK_EmailToken_Purpose
                   CHECK (Purpose IN ('EmailVerification', 'PasswordReset')),
        ExpiresAt  DATETIME      NOT NULL,
        ConsumedAt DATETIME      NULL,
        CreatedAt  DATETIME      NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_EmailToken_Token UNIQUE (Token)
    );
    PRINT '021 | EmailVerificationTokens — created.';
END
ELSE PRINT '021 | EmailVerificationTokens — already exists, skipped.';
GO

-- ============================================================
-- 022 | Notifications  (migration 026)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Notifications' AND xtype = 'U')
BEGIN
    CREATE TABLE Notifications (
        NotificationId  INT IDENTITY(1,1) PRIMARY KEY,
        UserId          INT           NOT NULL
                        CONSTRAINT FK_Notification_Users
                        FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
        Type            NVARCHAR(50)  NOT NULL,
        Message         NVARCHAR(500) NOT NULL,
        RelatedEntityId INT           NULL,
        IsRead          BIT           NOT NULL DEFAULT 0,
        CreatedAt       DATETIME      NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications (UserId, IsRead);
    PRINT '022 | Notifications — created.';
END
ELSE PRINT '022 | Notifications — already exists, skipped.';
GO

-- ============================================================
-- 023 | PostReports  (migration 028)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'PostReports' AND xtype = 'U')
BEGIN
    CREATE TABLE PostReports (
        ReportId         INT IDENTITY(1,1) PRIMARY KEY,
        PostId           INT           NOT NULL
                         CONSTRAINT FK_PostReport_Post
                         FOREIGN KEY REFERENCES Post(PostId) ON DELETE CASCADE,
        ReporterUserId   INT           NOT NULL
                         CONSTRAINT FK_PostReport_Users FOREIGN KEY REFERENCES Users(UserId),
        Reason           NVARCHAR(500) NOT NULL,
        Status           NVARCHAR(20)  NOT NULL DEFAULT 'Pending'
                         CONSTRAINT CHK_PostReport_Status
                         CHECK (Status IN ('Pending', 'Reviewed', 'Dismissed')),
        ReviewedByUserId INT           NULL
                         CONSTRAINT FK_PostReport_Admin FOREIGN KEY REFERENCES Users(UserId),
        CreatedAt        DATETIME      NOT NULL DEFAULT GETDATE(),
        ReviewedAt       DATETIME      NULL,
        CONSTRAINT UQ_PostReport_PerUser UNIQUE (PostId, ReporterUserId)
    );
    PRINT '023 | PostReports — created.';
END
ELSE PRINT '023 | PostReports — already exists, skipped.';
GO

-- ============================================================
-- 024 | Users.IsActive  (migration 020)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsActive')
BEGIN
    ALTER TABLE Users ADD IsActive BIT NOT NULL DEFAULT 1;
    PRINT '024 | Users.IsActive added.';
END
ELSE PRINT '024 | Users.IsActive already exists, skipped.';
GO

-- ============================================================
-- 025 | Users.IsEmailVerified  (migration 027)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsEmailVerified')
BEGIN
    ALTER TABLE Users ADD IsEmailVerified BIT NOT NULL DEFAULT 0;
    PRINT '025 | Users.IsEmailVerified added.';
END
ELSE PRINT '025 | Users.IsEmailVerified already exists, skipped.';
GO

-- ============================================================
-- 026 | Individual KYC columns  (migration 029)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Individual') AND name = 'KycStatus')
BEGIN
    ALTER TABLE Individual ADD
        IdNumber         NVARCHAR(20)  NULL,
        IdDocumentUrl    NVARCHAR(500) NULL,
        SelfieUrl        NVARCHAR(500) NULL,
        KycStatus        NVARCHAR(20)  NOT NULL
                         CONSTRAINT DF_Individual_KycStatus DEFAULT 'NotSubmitted'
                         CONSTRAINT CHK_Individual_KycStatus
                         CHECK (KycStatus IN ('NotSubmitted', 'Pending', 'Approved', 'Rejected')),
        KycRoute         NVARCHAR(20)  NULL
                         CONSTRAINT CHK_Individual_KycRoute
                         CHECK (KycRoute IN ('Admin', 'FaceScan')),
        KycMatchScore    DECIMAL(5,4)  NULL,
        ReviewedByUserId INT           NULL
                         CONSTRAINT FK_Individual_KycReviewer
                         FOREIGN KEY REFERENCES Users(UserId),
        SubmittedDate    DATETIME      NULL,
        ReviewedDate     DATETIME      NULL;
    PRINT '026 | Individual KYC columns added.';
END
ELSE PRINT '026 | Individual KYC columns already exist, skipped.';
GO

-- ============================================================
-- DONE — verify tables landed correctly
-- ============================================================
SELECT
    t.name        AS TableName,
    t.create_date AS CreatedAt
FROM sys.tables t
WHERE t.name IN (
    'Users','Individual','NPO','Business','Profile',
    'Wallet','Transactions','Post','Follow','FundingRequest',
    'VolunteerOpportunity','VolunteerApplication','VolunteerLog',
    'PartnershipCampaign','CampaignApplication','Verification',
    'ImpactTrack','Projects','PostLike','Comment',
    'EmailVerificationTokens','Notifications','PostReports'
)
ORDER BY t.create_date;
GO
