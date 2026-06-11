
-- ============================================================
-- A Business creates a partnership campaign for NPOs to apply to.
-- Accepted NPOs receive funding or resources from the Business.
-- Depends on: 005_create_business.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

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
    PRINT '015 | PartnershipCampaign table created successfully.';
END
ELSE
    PRINT '015 | PartnershipCampaign already exists skipped.';

GO
