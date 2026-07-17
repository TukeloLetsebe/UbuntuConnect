-- ============================================================
--  UbuntuConnect | Collab4Change
--  DB Owner: Tukelo Letsebe
--  000 | MASTER MIGRATION SCRIPT
-- ============================================================
--  Runs all 18 table migrations in the correct order.
--  Open this file in SSMS and hit Execute — done.
--
--  NOTE: Creates the UbuntuConnect database if it
--  does not exist yet, then switches into it.
-- ============================================================

-- ── Step 1: Create the database if it doesn't exist yet ──────
IF NOT EXISTS (
    SELECT * FROM sys.databases WHERE name = 'UbuntuConnect_DB'
)
BEGIN
    CREATE DATABASE UbuntuConnect_DB;
    PRINT 'UbuntuConnect database created.';
END
ELSE
    PRINT 'UbuntuConnect database already exists — skipped.';
GO

USE UbuntuConnect_DB;
GO

-- ============================================================
-- 001 | Users
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Users' AND xtype = 'U'
)
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
ELSE
    PRINT '001 | Users — already exists, skipped.';
GO

-- ============================================================
-- 002 | Individual
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Individual' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Individual (
        IndividualId INT IDENTITY(1,1) PRIMARY KEY,
        UserId       INT           NOT NULL
                     CONSTRAINT FK_Individual_Users
                     FOREIGN KEY REFERENCES Users(UserId)
                     ON DELETE CASCADE,
        FirstName    NVARCHAR(100) NOT NULL,
        LastName     NVARCHAR(100) NOT NULL,
        CauseOfCare  NVARCHAR(255) NULL
    );
    PRINT '002 | Individual — created.';
END
ELSE
    PRINT '002 | Individual — already exists, skipped.';
GO

-- ============================================================
-- 003 | NPO
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'NPO' AND xtype = 'U'
)
BEGIN
    CREATE TABLE NPO (
        NPO_Id           INT IDENTITY(1,1) PRIMARY KEY,
        UserId           INT            NOT NULL
                         CONSTRAINT FK_NPO_Users
                         FOREIGN KEY REFERENCES Users(UserId)
                         ON DELETE CASCADE,
        NPORegNum        NVARCHAR(50)   NOT NULL UNIQUE,
        OrganizationName NVARCHAR(255)  NOT NULL,
        NPOFocusArea     NVARCHAR(255)  NULL,
        NPOMission       NVARCHAR(1000) NULL
    );
    PRINT '003 | NPO — created.';
END
ELSE
    PRINT '003 | NPO — already exists, skipped.';
GO

-- ============================================================
-- 004 | Business
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Business' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Business (
        BusinessId         INT IDENTITY(1,1) PRIMARY KEY,
        UserId             INT           NOT NULL
                           CONSTRAINT FK_Business_Users
                           FOREIGN KEY REFERENCES Users(UserId)
                           ON DELETE CASCADE,
        BusinessRegNum     NVARCHAR(50)  NOT NULL UNIQUE,
        Industry           NVARCHAR(100) NULL,
        ContactPersonName  NVARCHAR(150) NULL,
        ContactPersonTitle NVARCHAR(100) NULL,
        BusinessEmail      NVARCHAR(255) NULL,
        CSR_Goal           NVARCHAR(500) NULL
    );
    PRINT '004 | Business — created.';
END
ELSE
    PRINT '004 | Business — already exists, skipped.';
GO

-- ============================================================
-- 005 | Profile
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Profile' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Profile (
        ProfileId    INT IDENTITY(1,1) PRIMARY KEY,
        UserId       INT            NOT NULL UNIQUE
                     CONSTRAINT FK_Profile_Users
                     FOREIGN KEY REFERENCES Users(UserId)
                     ON DELETE CASCADE,
        ProfileName  NVARCHAR(150)  NOT NULL,
        Bio          NVARCHAR(1000) NULL,
        ProfileImage NVARCHAR(500)  NULL,
        Following    INT            NOT NULL DEFAULT 0,
        Followers    INT            NOT NULL DEFAULT 0
    );
    PRINT '005 | Profile — created.';
END
ELSE
    PRINT '005 | Profile — already exists, skipped.';
GO

-- ============================================================
-- 006 | Wallet
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Wallet' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Wallet (
        WalletId INT IDENTITY(1,1) PRIMARY KEY,
        UserId   INT            NOT NULL UNIQUE
                 CONSTRAINT FK_Wallet_Users
                 FOREIGN KEY REFERENCES Users(UserId)
                 ON DELETE CASCADE,
        Balance  DECIMAL(12,2)  NOT NULL DEFAULT 0.00
                 CONSTRAINT CHK_Wallet_Balance CHECK (Balance >= 0)
    );
    PRINT '006 | Wallet — created.';
END
ELSE
    PRINT '006 | Wallet — already exists, skipped.';
GO

-- ============================================================
-- 007 | Transactions
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Transactions' AND xtype = 'U'
)
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
                        CHECK (TransactionType IN ('Donation', 'Withdrawal', 'CampaignContribution')),
        Status          NVARCHAR(20)   NOT NULL DEFAULT 'Pending'
                        CONSTRAINT CHK_Transactions_Status
                        CHECK (Status IN ('Pending', 'Completed', 'Failed', 'Reversed')),
        Timestamp       DATETIME       NOT NULL DEFAULT GETDATE()
    );
    PRINT '007 | Transactions — created.';
END
ELSE
    PRINT '007 | Transactions — already exists, skipped.';
GO

-- ============================================================
-- 008 | Post
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Post' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Post (
        PostId         INT IDENTITY(1,1) PRIMARY KEY,
        UserId         INT            NOT NULL
                       CONSTRAINT FK_Post_Users
                       FOREIGN KEY REFERENCES Users(UserId)
                       ON DELETE CASCADE,
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
ELSE
    PRINT '008 | Post — already exists, skipped.';
GO

-- ============================================================
-- 009 | Follow
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Follow' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Follow (
        FollowId   INT IDENTITY(1,1) PRIMARY KEY,
        UserId     INT      NOT NULL
                   CONSTRAINT FK_Follow_Users
                   FOREIGN KEY REFERENCES Users(UserId),
        NPO_Id     INT      NOT NULL
                   CONSTRAINT FK_Follow_NPO
                   FOREIGN KEY REFERENCES NPO(NPO_Id),
        FollowDate DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_Follow UNIQUE (UserId, NPO_Id)
    );
    PRINT '009 | Follow — created.';
END
ELSE
    PRINT '009 | Follow — already exists, skipped.';
GO

-- ============================================================
-- 010 | FundingRequest
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'FundingRequest' AND xtype = 'U'
)
BEGIN
    CREATE TABLE FundingRequest (
        RequestId       INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id          INT            NOT NULL
                        CONSTRAINT FK_FundingRequest_NPO
                        FOREIGN KEY REFERENCES NPO(NPO_Id)
                        ON DELETE CASCADE,
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
ELSE
    PRINT '010 | FundingRequest — already exists, skipped.';
GO

-- ============================================================
-- 011 | VolunteerOpportunity
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'VolunteerOpportunity' AND xtype = 'U'
)
BEGIN
    CREATE TABLE VolunteerOpportunity (
        OpportunityId    INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id           INT            NOT NULL
                         CONSTRAINT FK_VolOpp_NPO
                         FOREIGN KEY REFERENCES NPO(NPO_Id)
                         ON DELETE CASCADE,
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
ELSE
    PRINT '011 | VolunteerOpportunity — already exists, skipped.';
GO

-- ============================================================
-- 012 | VolunteerApplication
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'VolunteerApplication' AND xtype = 'U'
)
BEGIN
    CREATE TABLE VolunteerApplication (
        ApplicationId   INT IDENTITY(1,1) PRIMARY KEY,
        UserId          INT            NOT NULL
                        CONSTRAINT FK_VolApp_Users
                        FOREIGN KEY REFERENCES Users(UserId),
        OpportunityId   INT            NOT NULL
                        CONSTRAINT FK_VolApp_Opportunity
                        FOREIGN KEY REFERENCES VolunteerOpportunity(OpportunityId)
                        ON DELETE CASCADE,
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
    PRINT '012 | VolunteerApplication — created.';
END
ELSE
    PRINT '012 | VolunteerApplication — already exists, skipped.';
GO

-- ============================================================
-- 013 | VolunteerLog
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'VolunteerLog' AND xtype = 'U'
)
BEGIN
    CREATE TABLE VolunteerLog (
        LogId         INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId INT           NOT NULL
                      CONSTRAINT FK_VolLog_Application
                      FOREIGN KEY REFERENCES VolunteerApplication(ApplicationId)
                      ON DELETE CASCADE,
        LogHours      DECIMAL(5,2)  NOT NULL
                      CONSTRAINT CHK_VolLog_Hours CHECK (LogHours > 0),
        LogDate       DATE          NOT NULL,
        Notes         NVARCHAR(500) NULL
    );
    PRINT '013 | VolunteerLog — created.';
END
ELSE
    PRINT '013 | VolunteerLog — already exists, skipped.';
GO

-- ============================================================
-- 014 | PartnershipCampaign
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'PartnershipCampaign' AND xtype = 'U'
)
BEGIN
    CREATE TABLE PartnershipCampaign (
        CampaignId       INT IDENTITY(1,1) PRIMARY KEY,
        BusinessId       INT            NOT NULL
                         CONSTRAINT FK_Campaign_Business
                         FOREIGN KEY REFERENCES Business(BusinessId)
                         ON DELETE CASCADE,
        Title            NVARCHAR(255)  NOT NULL,
        Category         NVARCHAR(100)  NULL,
        BudgetPerPartner DECIMAL(12,2)  NULL,
        NumOfPartners    INT            NULL,
        Requirements     NVARCHAR(1000) NULL,
        Description      NVARCHAR(2000) NULL,
        StartDate        DATE           NOT NULL,
        EndDate          DATE           NULL
    );
    PRINT '014 | PartnershipCampaign — created.';
END
ELSE
    PRINT '014 | PartnershipCampaign — already exists, skipped.';
GO

-- ============================================================
-- 015 | CampaignApplication
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'CampaignApplication' AND xtype = 'U'
)
BEGIN
    CREATE TABLE CampaignApplication (
        ApplicationId   INT IDENTITY(1,1) PRIMARY KEY,
        CampaignId      INT            NOT NULL
                        CONSTRAINT FK_CampApp_Campaign
                        FOREIGN KEY REFERENCES PartnershipCampaign(CampaignId)
                        ON DELETE CASCADE,
        NPO_Id          INT            NOT NULL
                        CONSTRAINT FK_CampApp_NPO
                        FOREIGN KEY REFERENCES NPO(NPO_Id),
        ApplicationDate DATETIME       NOT NULL DEFAULT GETDATE(),
        Status          NVARCHAR(20)   NOT NULL DEFAULT 'Pending'
                        CONSTRAINT CHK_CampApp_Status
                        CHECK (Status IN ('Pending', 'Accepted', 'Rejected')),
        Motivation      NVARCHAR(1000) NULL,
        CONSTRAINT UQ_CampaignApplication UNIQUE (CampaignId, NPO_Id)
    );
    PRINT '015 | CampaignApplication — created.';
END
ELSE
    PRINT '015 | CampaignApplication — already exists, skipped.';
GO

-- ============================================================
-- 016 | Verification
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Verification' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Verification (
        VerificationId    INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id            INT           NOT NULL
                          CONSTRAINT FK_Verification_NPO
                          FOREIGN KEY REFERENCES NPO(NPO_Id)
                          ON DELETE CASCADE,
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
ELSE
    PRINT '016 | Verification — already exists, skipped.';
GO

-- ============================================================
-- 017 | ImpactTrack
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'ImpactTrack' AND xtype = 'U'
)
BEGIN
    CREATE TABLE ImpactTrack (
        ImpactId     INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id       INT            NOT NULL
                     CONSTRAINT FK_ImpactTrack_NPO
                     FOREIGN KEY REFERENCES NPO(NPO_Id)
                     ON DELETE CASCADE,
        ImpactMetric NVARCHAR(255)  NOT NULL,
        Value        DECIMAL(12,2)  NOT NULL,
        Period       NVARCHAR(50)   NOT NULL,
        Description  NVARCHAR(1000) NULL
    );
    PRINT '017 | ImpactTrack — created.';
END
ELSE
    PRINT '017 | ImpactTrack — already exists, skipped.';
GO

-- ============================================================
-- 018 | Projects
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Projects' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Projects (
        ProjectId       INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id          INT            NOT NULL
                        CONSTRAINT FK_Projects_NPO
                        FOREIGN KEY REFERENCES NPO(NPO_Id)
                        ON DELETE CASCADE,
        ProjectName     NVARCHAR(255)  NOT NULL,
        ProjectDesc     NVARCHAR(2000) NULL,
        ProjectStatus   NVARCHAR(20)   NOT NULL DEFAULT 'Planning'
                        CONSTRAINT CHK_Projects_Status
                        CHECK (ProjectStatus IN ('Planning', 'Active', 'Completed', 'Suspended')),
        ProjectProgress DECIMAL(5,2)   NOT NULL DEFAULT 0.00
                        CONSTRAINT CHK_Projects_Progress
                        CHECK (ProjectProgress BETWEEN 0 AND 100)
    );
    PRINT '018 | Projects — created.';
END
ELSE
    PRINT '018 | Projects — already exists, skipped.';
GO

-- ============================================================
-- DONE — verify all 18 tables landed correctly
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
    'ImpactTrack','Projects'
)
ORDER BY t.create_date;
GO
