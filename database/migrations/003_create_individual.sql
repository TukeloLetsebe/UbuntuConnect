
-- ============================================================
-- Extends Users for the Individual user type.
-- Holds Individual-specific fields only.
-- Depends on: 002_create_users.sql FK of user
-- ============================================================

USE UbuntuConnect_DB;
GO

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
    PRINT '003 | Individual table created successfully.';
END
ELSE
    PRINT '003 | Individual already exists — skipped.';
GO
