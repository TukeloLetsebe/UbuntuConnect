
-- ============================================================
-- Extends Users for the Business user type.
-- BusinessId is referenced by PartnershipCampaign.
-- BusinessRegNum is the CIPC registration num.
-- Depends on: 002_create_users.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

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
    PRINT '005 | Business table created successfully.';
END
ELSE
    PRINT '005 | Business already exists — skipped.';
GO
