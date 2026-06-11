
-- ============================================================
-- Junction table a User follows an NPO.
-- UNIQUE constraint on (UserId, NPO_Id) prevents a user
-- from following the same NPO more than once.
-- Depends on: 002_create_users.sql and 004_create_npo.sql
-- ============================================================

USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Follow' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Follow (
        FollowId   INT IDENTITY(1,1) PRIMARY KEY,
        UserId     INT      NOT NULL
                   CONSTRAINT FK_Follow_Users
                   FOREIGN KEY REFERENCES Users(UserId),
        NPO_Id     INT      NOT NULL
                   CONSTRAINT FK_Follow_NPO
                   FOREIGN KEY REFERENCES NPO(NPO_Id),
        FollowDate DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_Follow UNIQUE (UserId, NPO_Id)
    );
    PRINT '010 | Follow table created successfully.';
END
ELSE
    PRINT '010 | Follow already exists skipped.';

GO
