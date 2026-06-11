
-- ============================================================
-- NPOs and Businesses create posts on the community feed.
-- LikeCount is a counter updated by app logic on like/unlike.
-- Depends on: 002_create_users.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Post' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Post (
        PostId         INT IDENTITY(1,1) PRIMARY KEY,
        UserId         INT            NOT NULL
                       CONSTRAINT FK_Post_Users
                       FOREIGN KEY REFERENCES Users(UserId)
                       ON DELETE CASCADE,
        PostTitle      NVARCHAR(255)  NOT NULL,
        Content        NVARCHAR(MAX)  NULL,
        MediaURL       NVARCHAR(500)  NULL,
        LikeCount      INT            NOT NULL DEFAULT 0,
        ActivityStatus NVARCHAR(20)   NOT NULL DEFAULT 'Active'
                       CONSTRAINT CHK_Post_Status
                       CHECK (ActivityStatus IN ('Active', 'Archived', 'Deleted')),
        Timestamp      DATETIME       NOT NULL DEFAULT GETDATE()
    );
    PRINT '009 | Post table created successfully.';
END
ELSE
    PRINT '009 | Post already exists skipped.';

GO
