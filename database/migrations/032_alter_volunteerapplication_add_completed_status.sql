-- ============================================================
-- 032 | Add 'Completed' to VolunteerApplication.Status
-- ------------------------------------------------------------
-- An NPO can mark an Accepted volunteer as "Completed" once the
-- engagement is finished. This is a soft status change, not a
-- delete — logged hours and the volunteer's impact figures are
-- preserved (per the soft-delete rule in business-domain.md).
--
-- Status flow:
--   Pending -> Accepted  -> Completed
--           \-> Rejected
--           \-> Cancelled (by the applicant)
--
-- Idempotent: only rebuilds the constraint if 'Completed' is not
-- already part of the allowed set.
-- Depends on: 013_create_volunteerapplication.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CHK_VolApp_Status'
      AND OBJECT_NAME(parent_object_id) = 'VolunteerApplication'
      AND definition NOT LIKE '%Completed%'
)
BEGIN
    ALTER TABLE VolunteerApplication DROP CONSTRAINT CHK_VolApp_Status;

    ALTER TABLE VolunteerApplication ADD CONSTRAINT CHK_VolApp_Status
        CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'));

    PRINT '032 | VolunteerApplication.Status CHECK updated to include Completed.';
END
ELSE
    PRINT '032 | VolunteerApplication.Status already allows Completed (or constraint missing), skipped.';
GO
