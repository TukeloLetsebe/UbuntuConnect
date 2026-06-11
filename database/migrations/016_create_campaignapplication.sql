
-- ============================================================
-- An NPO applies to a Business PartnershipCampaign.
-- UNIQUE constraint on (CampaignId, NPO_Id) prevents an NPO
-- from applying to the same campaign more than once.
-- Status flow: Pending -> Accepted | Rejected
-- Depends on: 015_create_partnershipcampaign.sql,
-- and 004_create_npo.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

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
    PRINT '016 | CampaignApplication table created successfully.';
END
ELSE
    PRINT '016 | CampaignApplication already exists — skipped.';

GO
