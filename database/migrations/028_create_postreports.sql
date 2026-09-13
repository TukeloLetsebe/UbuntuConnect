-- ============================================================
-- Users report posts that violate community rules. Admins review
-- the queue and either dismiss the report or remove the post
-- (post soft-delete via Post.ActivityStatus = 'Deleted').
-- One report per user per post (unique constraint).
-- Depends on: 009_create_post.sql, 002_create_users.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'PostReports' AND xtype = 'U'
)
BEGIN
    CREATE TABLE PostReports (
        ReportId       INT IDENTITY(1,1) PRIMARY KEY,
        PostId         INT           NOT NULL
                       CONSTRAINT FK_PostReport_Post
                       FOREIGN KEY REFERENCES Post(PostId)
                       ON DELETE CASCADE,
        ReporterUserId INT           NOT NULL
                       CONSTRAINT FK_PostReport_Users
                       FOREIGN KEY REFERENCES Users(UserId),
        Reason         NVARCHAR(500) NOT NULL,
        Status         NVARCHAR(20)  NOT NULL DEFAULT 'Pending'
                       CONSTRAINT CHK_PostReport_Status
                       CHECK (Status IN ('Pending', 'Reviewed', 'Dismissed')),
        ReviewedByUserId INT         NULL
                       CONSTRAINT FK_PostReport_Admin
                       FOREIGN KEY REFERENCES Users(UserId),
        CreatedAt      DATETIME      NOT NULL DEFAULT GETDATE(),
        ReviewedAt     DATETIME      NULL,
        CONSTRAINT UQ_PostReport_PerUser UNIQUE (PostId, ReporterUserId)
    );
    PRINT '028 | PostReports table created successfully.';
END
ELSE
    PRINT '028 | PostReports already exists skipped.';
GO
