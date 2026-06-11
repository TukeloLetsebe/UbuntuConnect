
-- ============================================================
-- Every user type can have a wallet (UNIQUE on UserId).
-- Depends on: 002_create_users.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Wallet' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Wallet (
        WalletId INT IDENTITY(1,1) PRIMARY KEY,
        UserId   INT            NOT NULL UNIQUE
                 CONSTRAINT FK_Wallet_Users
                 FOREIGN KEY REFERENCES Users(UserId)
                 ON DELETE CASCADE,
        Balance  DECIMAL(12,2)  NOT NULL DEFAULT 0.00
                 CONSTRAINT CHK_Wallet_Balance CHECK (Balance >= 0)
    );
    PRINT '007 | Wallet table created successfully.';
END
ELSE
    PRINT '007 | Wallet already exists — skipped.';
GO
