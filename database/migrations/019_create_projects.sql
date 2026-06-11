
-- ============================================================
-- Progress is tracked as a percentage (0.00 to 100.00).
-- Projects build an NPO's credibility and track record.
-- Depends on: 004_create_npo.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Projects' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Projects (
        ProjectId       INT IDENTITY(1,1) PRIMARY KEY,
        NPO_Id          INT            NOT NULL
                        CONSTRAINT FK_Projects_NPO
                        FOREIGN KEY REFERENCES NPO(NPO_Id)
                        ON DELETE CASCADE,
        ProjectName     NVARCHAR(255)  NOT NULL,
        ProjectDesc     NVARCHAR(2000) NULL,
        ProjectStatus   NVARCHAR(20)   NOT NULL DEFAULT 'Planning'
                        CONSTRAINT CHK_Projects_Status
                        CHECK (ProjectStatus IN ('Planning', 'Active', 'Completed', 'Suspended')),
        ProjectProgress DECIMAL(5,2)   NOT NULL DEFAULT 0.00
                        CONSTRAINT CHK_Projects_Progress
                        CHECK (ProjectProgress BETWEEN 0 AND 100)
    );
    PRINT '019 | Projects table created successfully.';
END
ELSE
    PRINT '019 | Projects already exists skipped.';

GO
