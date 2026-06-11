
-- ============================================================
-- RaisedAmount is updated on each successful donation transaction.
-- Depends on: 004_create_npo.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'FundingRequest' AND xtype = 'U'
)
BEGIN
    CREATE TABLE FundingRequest (
        RequestId       INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id          INT            NOT NULL
                        CONSTRAINT FK_FundingRequest_NPO
                        FOREIGN KEY REFERENCES NPO(NPO_Id)
                        ON DELETE CASCADE,
        Title           NVARCHAR(255)  NOT NULL,
        Purpose         NVARCHAR(1000) NOT NULL,
        TargetAmount    DECIMAL(12,2)  NOT NULL
                        CONSTRAINT CHK_FR_Target CHECK (TargetAmount > 0),
        RaisedAmount    DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
        BudgetBreakdown NVARCHAR(MAX)  NULL,
        Images          NVARCHAR(500)  NULL,
        StartDate       DATE           NOT NULL,
        EndDate         DATE           NULL
    );
    PRINT '011 | FundingRequest table created successfully.';
END
ELSE
    PRINT '011 | FundingRequest already exists skipped.';
GO
