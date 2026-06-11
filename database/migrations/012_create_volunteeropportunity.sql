
-- ============================================================
-- An NPO posts volunteer roles here for Individuals to apply to.
-- Depends on: 004_create_npo.sql and 011_create_fundingrequest.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

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
    PRINT '012 | VolunteerOpportunity table created successfully.';
END
ELSE
    PRINT '012 | VolunteerOpportunity already exists — skipped.';

GO
