
-- ============================================================
-- NPO submits documents here for Admin review.
-- ReviewedByUserId is NULLABLE until an Admin acts on it.
-- Once Status = 'Approved', set Users.IsVerified = 1
-- for that NPO's UserId at the application layer.
-- Depends on: 004_create_npo.sql and 002_create_users.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Verification' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Verification (
        VerificationId    INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id            INT           NOT NULL
                          CONSTRAINT FK_Verification_NPO
                          FOREIGN KEY REFERENCES NPO(NPO_Id)
                          ON DELETE CASCADE,
        ReviewedByUserId  INT           NULL
                          CONSTRAINT FK_Verification_Admin
                          FOREIGN KEY REFERENCES Users(UserId),
        NPOCertificate    NVARCHAR(500) NULL,
        NPOTaxCertificate NVARCHAR(500) NULL,
        Status            NVARCHAR(20)  NOT NULL DEFAULT 'Pending'
                          CONSTRAINT CHK_Verification_Status
                          CHECK (Status IN ('Pending', 'Approved', 'Rejected')),
        SubmittedDate     DATETIME      NOT NULL DEFAULT GETDATE(),
        ReviewedDate      DATETIME      NULL
    );
    PRINT '017 | Verification table created successfully.';
END
ELSE
    PRINT '017 | Verification already exists skipped.';

GO
