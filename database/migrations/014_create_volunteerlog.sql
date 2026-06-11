
-- ============================================================
-- Tracks actual hours logged by an accepted volunteer.
-- Only accepted VolunteerApplications should have log entries
-- Depends on: 013_create_volunteerapplication.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'VolunteerLog' AND xtype = 'U'
)
BEGIN
    CREATE TABLE VolunteerLog (
        LogId         INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId INT           NOT NULL
                      CONSTRAINT FK_VolLog_Application
                      FOREIGN KEY REFERENCES VolunteerApplication(ApplicationId)
                      ON DELETE CASCADE,
        LogHours      DECIMAL(5,2)  NOT NULL
                      CONSTRAINT CHK_VolLog_Hours CHECK (LogHours > 0),
        LogDate       DATE          NOT NULL,
        Notes         NVARCHAR(500) NULL
    );
    PRINT '014 | VolunteerLog table created successfully.';
END
ELSE
    PRINT '014 | VolunteerLog already exists — skipped.';
GO
