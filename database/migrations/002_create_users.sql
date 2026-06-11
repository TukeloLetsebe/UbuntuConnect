
-- ============================================================
-- Root table. Every actor on the platform lives here.
-- Authentication always hits this table first.
-- Depends on: none. 
-- ============================================================

USE UbuntuConnect_DB;
GO

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
    PRINT '002 | Users table created successfully.';
END
ELSE
    PRINT '002 | Users already exists — skipped.';
GO
