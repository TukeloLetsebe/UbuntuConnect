
-- ============================================================
-- NPOs report measurable outcomes here per period.
-- Used to generate B-BBEE and CSR compliance reports.
-- Multiple records can exist per NPO per period.
-- Depends on: 004_create_npo.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'ImpactTrack' AND xtype = 'U'
)
BEGIN
    CREATE TABLE ImpactTrack (
        ImpactId     INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id       INT            NOT NULL
                     CONSTRAINT FK_ImpactTrack_NPO
                     FOREIGN KEY REFERENCES NPO(NPO_Id)
                     ON DELETE CASCADE,
        ImpactMetric NVARCHAR(255)  NOT NULL,
        Value        DECIMAL(12,2)  NOT NULL,
        Period       NVARCHAR(50)   NOT NULL,
        Description  NVARCHAR(1000) NULL
    );
    PRINT '018 | ImpactTrack table created successfully.';
END
ELSE
    PRINT '018 | ImpactTrack already exists skipped.';
GO
