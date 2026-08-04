-- ============================================================
-- 022 | Create PostLike table for post likes
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PostLike')
BEGIN
    CREATE TABLE PostLike (
        LikeId INT IDENTITY(1,1) PRIMARY KEY,
        PostId INT NOT NULL,
        UserId INT NOT NULL,
        LikedDate DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_PostLike_Post FOREIGN KEY (PostId) REFERENCES Post(PostId) ON DELETE CASCADE,
        CONSTRAINT FK_PostLike_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE NO ACTION,
        CONSTRAINT UQ_PostLike UNIQUE (PostId, UserId)
    );
    PRINT '022 | PostLike table created.';
END
GO
