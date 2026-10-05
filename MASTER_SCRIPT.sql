-- =============================================================
-- UbuntuConnect — MASTER SCHEMA SCRIPT
-- =============================================================
-- Builds the ENTIRE UbuntuConnect_DB schema in one run:
-- creates the database (if missing) and every table in
-- dependency order, then applies all later column/constraint
-- alterations (migrations 002–031 consolidated).
--
-- Idempotent: every object is guarded with IF NOT EXISTS, so it
-- is safe to run repeatedly. It does NOT insert any data — run
-- seed_data.sql afterwards for demo rows (and delete_seed_data.sql
-- first if you want a clean slate).
--
-- Run:  sqlcmd -S localhost -E -C -i MASTER_SCRIPT.sql
-- =============================================================

-- -------------------------------------------------------------
-- 0. DATABASE
-- -------------------------------------------------------------
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'UbuntuConnect_DB')
BEGIN
    CREATE DATABASE UbuntuConnect_DB;
    PRINT '000 | UbuntuConnect_DB created.';
END
ELSE
    PRINT '000 | UbuntuConnect_DB already exists, skipped.';
GO

USE UbuntuConnect_DB;
GO

-- =============================================================
-- 002 | USERS  (root table)
-- =============================================================
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
    PRINT '002 | Users table created.';
END
ELSE PRINT '002 | Users already exists, skipped.';
GO

-- =============================================================
-- 003 | INDIVIDUAL
-- =============================================================
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
    PRINT '003 | Individual table created.';
END
ELSE PRINT '003 | Individual already exists, skipped.';
GO

-- =============================================================
-- 004 | NPO
-- =============================================================
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
    PRINT '004 | NPO table created.';
END
ELSE PRINT '004 | NPO already exists, skipped.';
GO

-- =============================================================
-- 005 | BUSINESS
-- =============================================================
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
    PRINT '005 | Business table created.';
END
ELSE PRINT '005 | Business already exists, skipped.';
GO

-- =============================================================
-- 006 | PROFILE
-- =============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Profile' AND xtype = 'U')
BEGIN
    CREATE TABLE Profile (
        ProfileId    INT IDENTITY(1,1) PRIMARY KEY,
        UserId       INT            NOT NULL UNIQUE
                     CONSTRAINT FK_Profile_Users
                     FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
        ProfileName  NVARCHAR(150)  NOT NULL,
        Bio          NVARCHAR(1000) NULL,
        ProfileImage NVARCHAR(500)  NULL,
        Following    INT            NOT NULL DEFAULT 0,
        Followers    INT            NOT NULL DEFAULT 0
    );
    PRINT '006 | Profile table created.';
END
ELSE PRINT '006 | Profile already exists, skipped.';
GO

-- =============================================================
-- 007 | WALLET
-- =============================================================
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
    PRINT '007 | Wallet table created.';
END
ELSE PRINT '007 | Wallet already exists, skipped.';
GO

-- =============================================================
-- 008 | TRANSACTIONS   (TopUp type added in 021 below)
-- =============================================================
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
        Timestamp       DATETIME       NOT NULL DEFAULT GETDATE()
    );
    PRINT '008 | Transactions table created.';
END
ELSE PRINT '008 | Transactions already exists, skipped.';
GO

-- =============================================================
-- 009 | POST
-- =============================================================
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
    PRINT '009 | Post table created.';
END
ELSE PRINT '009 | Post already exists, skipped.';
GO

-- =============================================================
-- 010 | FOLLOW
-- =============================================================
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
    PRINT '010 | Follow table created.';
END
ELSE PRINT '010 | Follow already exists, skipped.';
GO

-- =============================================================
-- 011 | FUNDINGREQUEST
-- =============================================================
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
    PRINT '011 | FundingRequest table created.';
END
ELSE PRINT '011 | FundingRequest already exists, skipped.';
GO

-- =============================================================
-- 012 | VOLUNTEEROPPORTUNITY
-- =============================================================
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
    PRINT '012 | VolunteerOpportunity table created.';
END
ELSE PRINT '012 | VolunteerOpportunity already exists, skipped.';
GO

-- =============================================================
-- 013 | VOLUNTEERAPPLICATION
-- =============================================================
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
                        CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled')),
        ApplicationDate DATETIME       NOT NULL DEFAULT GETDATE()
    );
    PRINT '013 | VolunteerApplication table created.';
END
ELSE PRINT '013 | VolunteerApplication already exists, skipped.';
GO

-- =============================================================
-- 014 | VOLUNTEERLOG
-- =============================================================
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
    PRINT '014 | VolunteerLog table created.';
END
ELSE PRINT '014 | VolunteerLog already exists, skipped.';
GO

-- =============================================================
-- 015 | PARTNERSHIPCAMPAIGN   (ImageUrl added in 031 below)
-- =============================================================
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
        EndDate          DATE           NULL
    );
    PRINT '015 | PartnershipCampaign table created.';
END
ELSE PRINT '015 | PartnershipCampaign already exists, skipped.';
GO

-- =============================================================
-- 016 | CAMPAIGNAPPLICATION
-- =============================================================
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
    PRINT '016 | CampaignApplication table created.';
END
ELSE PRINT '016 | CampaignApplication already exists, skipped.';
GO

-- =============================================================
-- 017 | VERIFICATION
-- =============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Verification' AND xtype = 'U')
BEGIN
    CREATE TABLE Verification (
        VerificationId    INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id            INT           NOT NULL
                          CONSTRAINT FK_Verification_NPO
                          FOREIGN KEY REFERENCES NPO(NPO_Id) ON DELETE CASCADE,
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
    PRINT '017 | Verification table created.';
END
ELSE PRINT '017 | Verification already exists, skipped.';
GO

-- =============================================================
-- 018 | IMPACTTRACK
-- =============================================================
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
    PRINT '018 | ImpactTrack table created.';
END
ELSE PRINT '018 | ImpactTrack already exists, skipped.';
GO

-- =============================================================
-- 019 | PROJECTS   (fundraiser cols 024 + date cols 030 inlined)
-- =============================================================
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
    PRINT '019 | Projects table created (incl. fundraiser + date columns).';
END
ELSE PRINT '019 | Projects already exists, skipped.';
GO

-- =============================================================
-- 022 | POSTLIKE
-- =============================================================
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
    PRINT '022 | PostLike table created.';
END
ELSE PRINT '022 | PostLike already exists, skipped.';
GO

-- =============================================================
-- 023 | COMMENT
-- =============================================================
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
    PRINT '023 | Comment table created.';
END
ELSE PRINT '023 | Comment already exists, skipped.';
GO

-- =============================================================
-- 025 | EMAILVERIFICATIONTOKENS
-- =============================================================
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
    PRINT '025 | EmailVerificationTokens table created.';
END
ELSE PRINT '025 | EmailVerificationTokens already exists, skipped.';
GO

-- =============================================================
-- 026 | NOTIFICATIONS
-- =============================================================
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
    PRINT '026 | Notifications table created.';
END
ELSE PRINT '026 | Notifications already exists, skipped.';
GO

-- =============================================================
-- 028 | POSTREPORTS
-- =============================================================
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
    PRINT '028 | PostReports table created.';
END
ELSE PRINT '028 | PostReports already exists, skipped.';
GO

-- =============================================================
-- ALTERATIONS (guarded so they are safe to re-run)
-- =============================================================

-- 020 | Users.IsActive
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsActive')
BEGIN
    ALTER TABLE Users ADD IsActive BIT NOT NULL DEFAULT 1;
    PRINT '020 | Users.IsActive added.';
END
ELSE PRINT '020 | Users.IsActive already exists, skipped.';
GO

-- 027 | Users.IsEmailVerified
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsEmailVerified')
BEGIN
    ALTER TABLE Users ADD IsEmailVerified BIT NOT NULL DEFAULT 0;
    PRINT '027 | Users.IsEmailVerified added.';
END
ELSE PRINT '027 | Users.IsEmailVerified already exists, skipped.';
GO

-- 029 | Individual KYC columns
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
    PRINT '029 | Individual KYC columns added.';
END
ELSE PRINT '029 | Individual KYC columns already exist, skipped.';
GO

-- 031 | PartnershipCampaign.ImageUrl
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PartnershipCampaign') AND name = 'ImageUrl')
BEGIN
    ALTER TABLE PartnershipCampaign ADD ImageUrl NVARCHAR(500) NULL;
    PRINT '031 | PartnershipCampaign.ImageUrl added.';
END
ELSE PRINT '031 | PartnershipCampaign.ImageUrl already exists, skipped.';
GO

PRINT '=============================================================';
PRINT 'MASTER_SCRIPT complete — full UbuntuConnect_DB schema is ready.';
PRINT 'Next: run seed_data.sql for demo data (delete_seed_data.sql first to reset).';
PRINT '=============================================================';
GO
