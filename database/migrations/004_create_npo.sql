
-- ============================================================
-- Extends Users for the NPO user type.
-- NPO_Id is referenced by many tables — FundingRequest,
-- VolunteerOpportunity, CampaignApplication, Verification,
-- ImpactTrack, Projects, and Follow.
-- NPORegNum is the SA government registration number.
-- Depends on: 002_create_users.sql
-- ============================================================

USE UbuntuConnect_DB;
GO
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
    PRINT '004 | NPO table created successfully.';
END
ELSE
    PRINT '004 | NPO already exists skipped.';
GO
