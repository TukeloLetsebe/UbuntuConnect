USE UbuntuConnect_DB;
GO

-- Task 18: Timed fundraisers. Add StartDate + EndDate (both nullable) to Projects.
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Projects') AND name = 'StartDate')
BEGIN
    ALTER TABLE Projects ADD StartDate DATETIME2 NULL;
    PRINT '030 | Projects.StartDate added.'
END
ELSE
    PRINT '030 | Projects.StartDate already exists, skipped.'
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Projects') AND name = 'EndDate')
BEGIN
    ALTER TABLE Projects ADD EndDate DATETIME2 NULL;
    PRINT '030 | Projects.EndDate added.'
END
ELSE
    PRINT '030 | Projects.EndDate already exists, skipped.'
GO
