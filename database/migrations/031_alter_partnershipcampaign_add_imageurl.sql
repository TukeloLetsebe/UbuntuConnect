USE UbuntuConnect_DB;
GO

-- QA-022: Businesses can attach an image to a partnership campaign.
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'PartnershipCampaign') AND name = 'ImageUrl')
BEGIN
    ALTER TABLE PartnershipCampaign ADD ImageUrl NVARCHAR(500) NULL;
    PRINT '031 | PartnershipCampaign.ImageUrl added.'
END
ELSE
    PRINT '031 | PartnershipCampaign.ImageUrl already exists, skipped.'
GO
