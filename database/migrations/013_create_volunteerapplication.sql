
-- ============================================================
-- An Individual applies for a VolunteerOpportunity.
-- Status flow: Pending -> Accepted | Rejected | Cancelled
-- Depends on: 002_create_users.sql and 012_create_volunteeropportunity.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'VolunteerApplication' AND xtype = 'U'
)
BEGIN
    CREATE TABLE VolunteerApplication (
        ApplicationId   INT IDENTITY(1,1) PRIMARY KEY,
        UserId          INT            NOT NULL
                        CONSTRAINT FK_VolApp_Users
                        FOREIGN KEY REFERENCES Users(UserId),
        OpportunityId   INT            NOT NULL
                        CONSTRAINT FK_VolApp_Opportunity
                        FOREIGN KEY REFERENCES VolunteerOpportunity(OpportunityId)
                        ON DELETE CASCADE,
        FirstName       NVARCHAR(100)  NOT NULL,
        LastName        NVARCHAR(100)  NOT NULL,
        Email           NVARCHAR(255)  NOT NULL,
        PhoneNum        NVARCHAR(20)   NULL,
        Skills          NVARCHAR(500)  NULL,
        Availability    NVARCHAR(255)  NULL,
        WhyVolunteer    NVARCHAR(1000) NULL,
        Address         NVARCHAR(255)  NULL,
        IDNumber        NVARCHAR(20)   NULL,
        IDCardImage     NVARCHAR(500)  NULL,
        FaceImage       NVARCHAR(500)  NULL,
        Status          NVARCHAR(20)   NOT NULL DEFAULT 'Pending'
                        CONSTRAINT CHK_VolApp_Status
                        CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled')),
        ApplicationDate DATETIME       NOT NULL DEFAULT GETDATE()
    );
    PRINT '013 | VolunteerApplication table created successfully.';
END
ELSE
    PRINT '013 | VolunteerApplication already exists skipped.';

GO
