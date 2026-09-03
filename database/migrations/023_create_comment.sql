-- ============================================================
-- Comment table for post comments.
-- Users can comment on any active post.
-- Depends on: 009_create_post.sql, 002_create_users.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Comment' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Comment (
        CommentId   INT IDENTITY(1,1) PRIMARY KEY,
        PostId      INT           NOT NULL
                    CONSTRAINT FK_Comment_Post
                    FOREIGN KEY REFERENCES Post(PostId)
                    ON DELETE CASCADE,
        UserId      INT           NOT NULL
                    CONSTRAINT FK_Comment_Users
                    FOREIGN KEY REFERENCES Users(UserId),
        Content     NVARCHAR(2000) NOT NULL,
        Timestamp   DATETIME      NOT NULL DEFAULT GETDATE()
    );
    PRINT '023 | Comment table created successfully.';
END
ELSE
    PRINT '023 | Comment already exists skipped.';

GO
