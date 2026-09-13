-- ============================================================
-- Adds identity-verification (KYC) fields to Individual.
-- An individual submits an ID document + selfie and chooses a
-- route: 'Admin' (manual review) or 'FaceScan' (self-service).
-- On approval, the app sets Users.IsVerified = 1 (Stage 2 gate).
-- Depends on: 003_create_individual.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Individual') AND name = 'KycStatus'
)
BEGIN
    ALTER TABLE Individual ADD
        IdNumber         NVARCHAR(20)  NULL,
        IdDocumentUrl    NVARCHAR(500) NULL,
        SelfieUrl        NVARCHAR(500) NULL,
        KycStatus        NVARCHAR(20)  NOT NULL
                         CONSTRAINT DF_Individual_KycStatus DEFAULT 'NotSubmitted'
                         CONSTRAINT CHK_Individual_KycStatus
                         CHECK (KycStatus IN ('NotSubmitted', 'Pending', 'Approved', 'Rejected')),
        KycRoute         NVARCHAR(20)  NULL
                         CONSTRAINT CHK_Individual_KycRoute
                         CHECK (KycRoute IN ('Admin', 'FaceScan')),
        KycMatchScore    DECIMAL(5,4)  NULL,
        ReviewedByUserId INT           NULL
                         CONSTRAINT FK_Individual_KycReviewer
                         FOREIGN KEY REFERENCES Users(UserId),
        SubmittedDate    DATETIME      NULL,
        ReviewedDate     DATETIME      NULL;
    PRINT '029 | Individual — KYC columns added.';
END
ELSE
    PRINT '029 | Individual — KYC columns already exist, skipped.';
GO
