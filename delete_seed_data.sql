-- =============================================================
-- UbuntuConnect — DELETE ALL SEED / APP DATA
-- Run against: UbuntuConnect_DB
--
-- Wipes every data row (child → parent order) and resets the
-- identity counters back to 0 so that a subsequent run of
-- seed_data.sql re-creates rows starting at Id = 1 (which the
-- hardcoded foreign-key references in seed_data.sql rely on).
--
-- Run this ONLY when you want a clean slate. seed_data.sql no
-- longer wipes on its own, so you can re-run the seed without
-- destroying data unless you deliberately run this first.
--
-- WARNING: this removes ALL rows in these tables, including any
-- real accounts registered through the app. Use on dev/demo DBs.
-- =============================================================

USE UbuntuConnect_DB;
GO

-- Disable FK checks so deletes aren't blocked by ordering.
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
GO

DELETE FROM VolunteerLog;
DELETE FROM VolunteerApplication;
DELETE FROM VolunteerOpportunity;
DELETE FROM CampaignApplication;
DELETE FROM PartnershipCampaign;
DELETE FROM ImpactTrack;
DELETE FROM FundingRequest;
DELETE FROM Projects;
DELETE FROM Comment;
DELETE FROM PostLike;
DELETE FROM Post;
DELETE FROM Follow;
DELETE FROM Transactions;
DELETE FROM Verification;
DELETE FROM Profile;
DELETE FROM Business;
DELETE FROM NPO;
DELETE FROM Individual;
DELETE FROM Wallet;
DELETE FROM Notifications;
DELETE FROM PostReports;
DELETE FROM EmailVerificationTokens;
DELETE FROM Users;
GO

-- Reset identity counters to 0 (next insert starts at 1).
DBCC CHECKIDENT ('Users',                RESEED, 0);
DBCC CHECKIDENT ('Wallet',               RESEED, 0);
DBCC CHECKIDENT ('Individual',           RESEED, 0);
DBCC CHECKIDENT ('NPO',                  RESEED, 0);
DBCC CHECKIDENT ('Business',             RESEED, 0);
DBCC CHECKIDENT ('Profile',              RESEED, 0);
DBCC CHECKIDENT ('Verification',         RESEED, 0);
DBCC CHECKIDENT ('Projects',             RESEED, 0);
DBCC CHECKIDENT ('FundingRequest',       RESEED, 0);
DBCC CHECKIDENT ('VolunteerOpportunity', RESEED, 0);
DBCC CHECKIDENT ('ImpactTrack',          RESEED, 0);
DBCC CHECKIDENT ('PartnershipCampaign',  RESEED, 0);
DBCC CHECKIDENT ('CampaignApplication',  RESEED, 0);
DBCC CHECKIDENT ('Post',                 RESEED, 0);
DBCC CHECKIDENT ('Comment',              RESEED, 0);
DBCC CHECKIDENT ('PostLike',             RESEED, 0);
DBCC CHECKIDENT ('Follow',               RESEED, 0);
DBCC CHECKIDENT ('VolunteerApplication', RESEED, 0);
DBCC CHECKIDENT ('VolunteerLog',         RESEED, 0);
DBCC CHECKIDENT ('Transactions',         RESEED, 0);
GO

-- Re-enable FK constraints.
EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
GO

PRINT 'All seed/app data deleted and identity counters reset.';
GO
