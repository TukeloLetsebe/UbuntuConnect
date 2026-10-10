-- ============================================================
-- 033 | Add Profile.BackgroundImage
-- ------------------------------------------------------------
-- NPOs and Businesses (and any user) can set a wide banner/cover
-- image on their profile, alongside the existing ProfileImage.
-- Nullable URL string (served via the uploads folder), mirroring
-- how ProfileImage is stored. Additive + idempotent — safe to
-- re-run and cannot affect existing rows.
-- Depends on: 006_create_profile.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('Profile') AND name = 'BackgroundImage'
)
BEGIN
    ALTER TABLE Profile ADD BackgroundImage NVARCHAR(500) NULL;
    PRINT '033 | Profile.BackgroundImage column added.';
END
ELSE
    PRINT '033 | Profile.BackgroundImage already exists, skipped.';
GO
