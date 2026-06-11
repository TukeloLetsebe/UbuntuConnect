
-- ============================================================
-- Every user type has exactly one profile.
-- Following/Followers are counters updated by app logic.
-- Depends on: 002_create_users.sql
-- ============================================================

USE UbuntuConnect_DB;
GO

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
    PRINT '006 | Profile table created successfully.';
END
ELSE
    PRINT '006 | Profile already exists — skipped.';
GO
