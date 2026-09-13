-- ============================================================
-- Stores email verification / password-reset style tokens.
-- A row is created when a token is issued and marked consumed
-- when the user clicks the link or enters the code.
-- Purpose distinguishes token kinds (e.g. 'EmailVerification').
-- Depends on: 002_create_users.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'EmailVerificationTokens' AND xtype = 'U'
)
BEGIN
    CREATE TABLE EmailVerificationTokens (
        TokenId      INT IDENTITY(1,1) PRIMARY KEY,
        UserId       INT           NOT NULL
                     CONSTRAINT FK_EmailToken_Users
                     FOREIGN KEY REFERENCES Users(UserId)
                     ON DELETE CASCADE,
        Token        NVARCHAR(128) NOT NULL,
        Purpose      NVARCHAR(50)  NOT NULL DEFAULT 'EmailVerification'
                     CONSTRAINT CHK_EmailToken_Purpose
                     CHECK (Purpose IN ('EmailVerification', 'PasswordReset')),
        ExpiresAt    DATETIME      NOT NULL,
        ConsumedAt   DATETIME      NULL,
        CreatedAt    DATETIME      NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_EmailToken_Token UNIQUE (Token)
    );
    PRINT '025 | EmailVerificationTokens table created successfully.';
END
ELSE
    PRINT '025 | EmailVerificationTokens already exists skipped.';
GO
