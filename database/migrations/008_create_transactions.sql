
-- ============================================================
-- Records every financial event on the platform, gateway bwtn Wallet n user.
-- SenderUserId and ReceiverUserId are NULLABLE to handle
-- Depends on: 002_create_users.sql and 007_create_wallet.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Transactions' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Transactions (
        TransactionId   INT IDENTITY(1,1) PRIMARY KEY,
        SenderUserId    INT            NULL
                        CONSTRAINT FK_Transactions_Sender
                        FOREIGN KEY REFERENCES Users(UserId),
        ReceiverUserId  INT            NULL
                        CONSTRAINT FK_Transactions_Receiver
                        FOREIGN KEY REFERENCES Users(UserId),
        Amount          DECIMAL(12,2)  NOT NULL
                        CONSTRAINT CHK_Transactions_Amount CHECK (Amount > 0),
        TransactionType NVARCHAR(30)   NOT NULL
                        CONSTRAINT CHK_Transactions_Type
                        CHECK (TransactionType IN ('Donation', 'Withdrawal', 'CampaignContribution')),
        Status          NVARCHAR(20)   NOT NULL DEFAULT 'Pending'
                        CONSTRAINT CHK_Transactions_Status
                        CHECK (Status IN ('Pending', 'Completed', 'Failed', 'Reversed')),
        Timestamp       DATETIME       NOT NULL DEFAULT GETDATE()
    );
    PRINT '008 | Transactions table created successfully.';
END
ELSE
    PRINT '008 | Transactions already exists skipped.';
GO
