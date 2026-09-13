-- ============================================================
-- In-app notifications. A row is created by the app whenever a
-- user should be alerted (verification decision, volunteer
-- accept/reject, post moderation, etc.). RelatedEntityId is an
-- optional pointer to the subject (e.g. an ApplicationId).
-- Depends on: 002_create_users.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sysobjects WHERE name = 'Notifications' AND xtype = 'U'
)
BEGIN
    CREATE TABLE Notifications (
        NotificationId  INT IDENTITY(1,1) PRIMARY KEY,
        UserId          INT           NOT NULL
                        CONSTRAINT FK_Notification_Users
                        FOREIGN KEY REFERENCES Users(UserId)
                        ON DELETE CASCADE,
        Type            NVARCHAR(50)  NOT NULL,
        Message         NVARCHAR(500) NOT NULL,
        RelatedEntityId INT           NULL,
        IsRead          BIT           NOT NULL DEFAULT 0,
        CreatedAt       DATETIME      NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_Notifications_UserId_IsRead
        ON Notifications (UserId, IsRead);
    PRINT '026 | Notifications table created successfully.';
END
ELSE
    PRINT '026 | Notifications already exists skipped.';
GO
