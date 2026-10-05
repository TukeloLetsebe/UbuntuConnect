-- =============================================================
-- UbuntuConnect — Fresh Randomized Seed (30 users)
-- Run against: UbuntuConnect_DB   (AFTER all migrations 002–031)
--
-- 10 Individuals (UserId 1–10)
-- 10 NPOs        (UserId 11–20)
-- 10 Businesses  (UserId 21–30)
--  1 Admin       (UserId 31)
--
-- Every account's email + plaintext password is listed in
--   SEED_CREDENTIALS.md  (sibling file at the repo root).
-- Passwords are stored as real per-user BCrypt hashes, so the
-- listed credentials log in against the live API.
--
-- All non-admin users have IsEmailVerified = 1 so they skip the
-- email-confirmation gate and are safe from the ghost-cleanup job.
-- Amounts across supporting tables are deliberately varied and in
-- several places left NULL / zero to exercise empty-state handling.
--
-- NOTE: This script does NOT wipe existing data, so re-running it on
-- a database that already holds this seed will fail on duplicate keys.
-- To reset to a clean slate first, run  delete_seed_data.sql  (which
-- clears all rows and resets identity counters), THEN run this script.
-- The explicit Id values below assume a freshly-reset database.
-- =============================================================

USE UbuntuConnect_DB;
GO

-- =============================================================
-- 1. USERS  (real BCrypt hashes — see SEED_CREDENTIALS.md)
-- =============================================================
SET IDENTITY_INSERT Users ON;

INSERT INTO Users (UserId, UserEmail, UserContact, Location, PasswordHash, UserType, IsVerified, IsEmailVerified, RegistrationDate, IsActive)
VALUES
-- Individuals
(1,  'thabo.mokoena@gmail.com',    '0711000001', 'Soweto, Gauteng',          '$2a$11$RKh11iFPSb56H9IIno3fdePTWiWVm7wURZZ12vAi.kfVyEteH.DeW', 'Individual', 1, 1, '2025-01-10 08:00:00', 1),
(2,  'nomvula.dlamini@gmail.com',  '0711000002', 'Khayelitsha, Cape Town',   '$2a$11$3HRiVgAOD.IhU8IHP32JZ./5AE3rqPYFzptD7mVqR5mD8Pk0/6OX2', 'Individual', 0, 1, '2025-02-14 09:30:00', 1),
(3,  'sipho.nkosi@outlook.com',    '0711000003', 'Durban North, KZN',        '$2a$11$Zx5YHyJxF5FI47mf7KOoTeyIbt2JCPc4cB2mlyoLUAvVw1MU4CbYa', 'Individual', 0, 1, '2025-03-05 11:00:00', 1),
(4,  'lerato.molefe@gmail.com',    '0711000004', 'Mamelodi, Pretoria',       '$2a$11$qiA4nBAwc/8BpnBBNPeqCen69jq5eah7yf44ezjRsfQHcCJ.vTt2G', 'Individual', 1, 1, '2025-03-22 07:45:00', 1),
(5,  'ayanda.khumalo@yahoo.com',   '0711000005', 'Pietermaritzburg, KZN',    '$2a$11$T5Ao/ZtQH1X/IVY8yRWfj.EjLeyZBmNzS0mSFp/qIytmZ6jUCFg5i', 'Individual', 0, 1, '2025-04-02 13:15:00', 1),
(6,  'kagiso.ndlovu@gmail.com',    '0711000006', 'Polokwane, Limpopo',       '$2a$11$/jgsbi9oEPnIwrDVLbuaTOijlITJ7sEp1srDrE9ynEdIJ9Myyrjwq', 'Individual', 0, 1, '2025-04-18 10:05:00', 1),
(7,  'zinhle.maseko@outlook.com',  '0711000007', 'Tembisa, Gauteng',         '$2a$11$hy./Di39KFpD74U00v6kAudXEboPMuxJY7bNMfs0mq8YEdqAFfYa.', 'Individual', 0, 1, '2025-05-09 16:20:00', 1),
(8,  'tshepo.radebe@gmail.com',    '0711000008', 'Bloemfontein, Free State', '$2a$11$2QEMUCUDQVtf.EK2jZvswubJ.Tp5bE4s5SM1nnKpG6R.k6jo3YSZS', 'Individual', 0, 1, '2025-05-27 08:40:00', 1),
(9,  'fatima.patel@gmail.com',     '0711000009', 'Lenasia, Gauteng',         '$2a$11$VVhvlAJK3i.RWW2Bq05d0e/QrlWPl3KFUNf0vGLRD6BjFpg4vZp.m', 'Individual', 0, 1, '2025-06-11 12:00:00', 1),
(10, 'jordan.williams@gmail.com',  '0711000010', 'Port Elizabeth, EC',       '$2a$11$MKdol.h6yHgzuq.kwEyTIerIf5leR9KDzBuxISoqunyYp2zrD6kie', 'Individual', 0, 1, '2025-06-30 09:10:00', 1),
-- NPOs
(11, 'admin@hopebright.org.za',    '0118000011', 'Alexandra, Gauteng',       '$2a$11$cWVFxabBagdjR8rOpBFtWuHrJaGtexf8HdA2RusWrQu2zrvffsKwu', 'NPO', 1, 1, '2024-06-01 07:00:00', 1),
(12, 'info@greenfuturesa.org',     '0218000012', 'Bellville, Cape Town',     '$2a$11$F/gUgdrdhnhYNCzvNYcouuUqJ8oqJrRRsJBFI5Br4lc80kTGknfWq', 'NPO', 1, 1, '2024-07-15 08:30:00', 1),
(13, 'contact@youthrise.co.za',    '0318000013', 'Umlazi, KwaZulu-Natal',    '$2a$11$viCRTLDMzmkArgsyBpOzJedFvxQMkTaZTvaK/2pFRZAaraEusEPeW', 'NPO', 0, 1, '2024-09-20 10:00:00', 1),
(14, 'hello@thandahealth.org.za',  '0118000014', 'Diepsloot, Gauteng',       '$2a$11$81o4QdDRHWNnAtHavfQcDeIxU/A.YXSDb1rz5uCzTar/MfZ.Babvi', 'NPO', 1, 1, '2024-10-11 09:15:00', 1),
(15, 'team@sheleads.org.za',       '0218000015', 'Mitchells Plain, CT',      '$2a$11$4izjFeAjMF6qa9zOt5zJke8RVT.sYv5RDeMTYKuNGX6F6oY48i89W', 'NPO', 0, 1, '2024-11-05 11:30:00', 1),
(16, 'info@feedthenation.org.za',  '0518000016', 'Soshanguve, Pretoria',     '$2a$11$7lVwcTEaN/RC3SnYxjZdHOR4vEEPJIH14d9RsitpGSoZ.sq3oC3hS', 'NPO', 1, 1, '2024-12-01 06:45:00', 1),
(17, 'admin@brightpaws.org.za',    '0318000017', 'Pinetown, KZN',            '$2a$11$cIJG.Udl0IZYCkVsfr5t8e318wcXgNiULFTLXCk2tkL0mXuNpQ5dG', 'NPO', 0, 1, '2025-01-14 08:00:00', 1),
(18, 'contact@codingkids.org.za',  '0118000018', 'Centurion, Gauteng',       '$2a$11$HpXwMF6yRpmgFnjmtFVNIeW15r3lFc4KobX3.wuIUsh9C4xhbLl2O', 'NPO', 1, 1, '2025-02-20 10:20:00', 1),
(19, 'info@safewaters.org.za',     '0418000019', 'Gqeberha, Eastern Cape',   '$2a$11$AR/zD4LY5ih8aRlT7ZEPQ.gwskuv0mB/j67YSO.qjxtxE3nVgm6Xi', 'NPO', 0, 1, '2025-03-18 09:00:00', 1),
(20, 'hello@elderscare.org.za',    '0518000020', 'Nelspruit, Mpumalanga',    '$2a$11$lbTRWLHilWDBoRFe9qjZb.bAWm4PsJC4r5C3CSIvdAwDQmaJgNQue', 'NPO', 1, 1, '2025-04-07 07:30:00', 1),
-- Businesses
(21, 'csr@ubuntucorp.co.za',       '0119000021', 'Sandton, Gauteng',         '$2a$11$JTqYIeHWtOg0rmSDoNM8texQ4FSJZ3OZ22MR9UrgmNpsKFzmLNUmG', 'Business', 0, 1, '2024-11-01 09:00:00', 1),
(22, 'partnerships@rainbowtech.io','0219000022', 'Century City, Cape Town',  '$2a$11$dTBfQ68wmv7aHK5EO.1em.S7rsloqOXrEtw6kUKoMt5YdxkLsz2Nu', 'Business', 0, 1, '2025-01-20 10:30:00', 1),
(23, 'impact@kalaharibank.co.za',  '0119000023', 'Rosebank, Gauteng',        '$2a$11$jSJ76fYFfOv2RuLcCSUzEuuBGPjo0kcEXMmV7Z9kENrU9/QRbwoHi', 'Business', 0, 1, '2025-02-02 08:15:00', 1),
(24, 'giving@capefresh.co.za',     '0219000024', 'Paarl, Western Cape',      '$2a$11$IwpuVmEFusqiOg6XUIYu9uYExcUL8Es9w2R/xPSNZ/i7MB6o0Tu6W', 'Business', 0, 1, '2025-02-19 11:00:00', 1),
(25, 'csr@summitmining.co.za',     '0139000025', 'Rustenburg, North West',   '$2a$11$IHrQh3mntGDaM4mGfFONZ..F0mA24nB4ceWPXD.MPWyoabVm/mame', 'Business', 0, 1, '2025-03-08 09:45:00', 1),
(26, 'social@brightretail.co.za',  '0319000026', 'Ballito, KZN',             '$2a$11$A/XpThE2v62JXv41LViAsO.EF9z.WewKgiU5gUSUKef27Uo6wui4i', 'Business', 0, 1, '2025-03-25 14:30:00', 1),
(27, 'foundation@novapharma.co.za','0119000027', 'Midrand, Gauteng',         '$2a$11$HA9CpojT9rfJqWPUf1jK2.8lK/voE4BqqeNYjKotrBlJjp08C2zH2', 'Business', 0, 1, '2025-04-12 10:10:00', 1),
(28, 'csr@azanialogistics.co.za',  '0419000028', 'East London, EC',          '$2a$11$A6EnDAOqShTTpMdaSaheb.6sw3CivSuY4.dEnFOyaGDp3R/ZCahTq', 'Business', 0, 1, '2025-05-01 08:00:00', 1),
(29, 'impact@solarafrica.co.za',   '0219000029', 'Stellenbosch, WC',         '$2a$11$tERyAH4WXLsI3.gLszD2Ku1Ah8UNi5HqN425JNc2Oo4dwSu7p.T7a', 'Business', 0, 1, '2025-05-20 09:20:00', 1),
(30, 'giving@tabletopfoods.co.za', '0519000030', 'Mbombela, Mpumalanga',     '$2a$11$Hsgde0x5dKZI82ge2IFo4uhROXRlxpzlxlXJmdpgYrq4nuLXRYoyK', 'Business', 0, 1, '2025-06-05 07:50:00', 1),
-- Admin
(31, 'admin@ubuntuconnect.co.za',  '0100001111', 'Johannesburg, Gauteng',    '$2a$11$cWVFxabBagdjR8rOpBFtWuHrJaGtexf8HdA2RusWrQu2zrvffsKwu', 'Admin', 1, 1, '2024-01-01 06:00:00', 1);

SET IDENTITY_INSERT Users OFF;
GO

-- =============================================================
-- 2. WALLETS (one per user; a few left at 0 for empty-state)
-- =============================================================
INSERT INTO Wallet (UserId, Balance)
VALUES
(1, 1850.00), (2, 0.00), (3, 4200.00), (4, 320.50), (5, 90.00),
(6, 0.00), (7, 275.75), (8, 1500.00), (9, 60.00), (10, 0.00),
(11, 52000.00), (12, 31000.00), (13, 0.00), (14, 18750.25), (15, 4300.00),
(16, 67000.00), (17, 150.00), (18, 22000.00), (19, 0.00), (20, 9100.50),
(21, 180000.00), (22, 95000.00), (23, 240000.00), (24, 12000.00), (25, 310000.00),
(26, 0.00), (27, 76000.00), (28, 5400.00), (29, 128000.00), (30, 0.00),
(31, 0.00);
GO

-- =============================================================
-- 3. INDIVIDUALS (UserId 1–10)
--    KYC states deliberately mixed: Approved / Pending / Rejected
--    / NotSubmitted. Some fields left NULL.
-- =============================================================
INSERT INTO Individual (UserId, FirstName, LastName, CauseOfCare, IdNumber, IdDocumentUrl, SelfieUrl, KycStatus, KycRoute, KycMatchScore, ReviewedByUserId, SubmittedDate, ReviewedDate)
VALUES
(1,  'Thabo',   'Mokoena',  'Education and youth development', '9201105800081', 'uploads/kyc/thabo_id.jpg',  'uploads/kyc/thabo_selfie.jpg',  'Approved',     'Admin',    NULL,   31, '2025-01-12 09:00:00', '2025-01-14 10:00:00'),
(2,  'Nomvula', 'Dlamini',  'Food security and hunger relief', NULL, NULL, NULL, 'NotSubmitted', NULL, NULL, NULL, NULL, NULL),
(3,  'Sipho',   'Nkosi',    'Environmental conservation', '8806155123082', 'uploads/kyc/sipho_id.jpg', 'uploads/kyc/sipho_selfie.jpg', 'Pending', 'Admin', NULL, NULL, '2025-03-07 11:30:00', NULL),
(4,  'Lerato',  'Molefe',   'Women empowerment', '9507220456083', 'uploads/kyc/lerato_id.jpg', 'uploads/kyc/lerato_selfie.jpg', 'Approved', 'FaceScan', 0.9412, NULL, '2025-03-23 08:00:00', '2025-03-23 08:02:00'),
(5,  'Ayanda',  'Khumalo',  'Animal welfare', NULL, NULL, NULL, 'NotSubmitted', NULL, NULL, NULL, NULL, NULL),
(6,  'Kagiso',  'Ndlovu',   'Sports development', NULL, NULL, NULL, 'NotSubmitted', NULL, NULL, NULL, NULL, NULL),
(7,  'Zinhle',  'Maseko',   'Mental health awareness', '9911030789084', 'uploads/kyc/zinhle_id.jpg', NULL, 'Rejected', 'Admin', NULL, 31, '2025-05-10 16:30:00', '2025-05-12 09:00:00'),
(8,  'Tshepo',  'Radebe',   'Disability inclusion', NULL, NULL, NULL, 'NotSubmitted', NULL, NULL, NULL, NULL, NULL),
(9,  'Fatima',  'Patel',    'Refugee support', NULL, NULL, NULL, 'NotSubmitted', NULL, NULL, NULL, NULL, NULL),
(10, 'Jordan',  'Williams', 'Arts and culture', NULL, NULL, NULL, 'NotSubmitted', NULL, NULL, NULL, NULL, NULL);
GO

-- =============================================================
-- 4. NPOs (UserId 11–20)
-- =============================================================
INSERT INTO NPO (UserId, NPORegNum, OrganizationName, NPOFocusArea, NPOMission)
VALUES
(11, 'NPO-2018-004521', 'HopeBright Foundation',   'Education',          'Empowering township children through quality education, mentorship, and after-school programmes.'),
(12, 'NPO-2019-007832', 'Green Future SA',         'Environment',        'Restoring South Africa''s ecosystems through urban greening, waste education, and clean-energy advocacy.'),
(13, 'NPO-2021-011043', 'YouthRise Collective',    'Youth Development',  'Equipping unemployed youth with vocational skills, entrepreneurship training, and work-readiness programmes.'),
(14, 'NPO-2020-008890', 'Thanda Health Collective','Healthcare',         'Delivering accessible healthcare to underserved communities via mobile clinics and wellness workshops.'),
(15, 'NPO-2022-013377', 'SheLeads SA',             'Women Empowerment',  'Advancing women and girls through leadership training, bursaries, and small-business incubation.'),
(16, 'NPO-2017-003214', 'Feed The Nation',         'Food Security',      'Running soup kitchens and food gardens to fight hunger across Gauteng townships.'),
(17, 'NPO-2023-015588', 'Bright Paws Rescue',      'Animal Welfare',     'Rescuing, rehabilitating, and rehoming abandoned animals while running community sterilisation drives.'),
(18, 'NPO-2021-010902', 'Coding Kids SA',          'Digital Skills',     'Teaching coding and digital literacy to primary-school learners in under-resourced schools.'),
(19, 'NPO-2019-006745', 'Safe Waters Trust',       'Environment',        'Protecting coastal ecosystems through beach clean-ups, marine education, and plastic-reduction campaigns.'),
(20, 'NPO-2016-002108', 'Elders Care Network',     'Social Services',    'Supporting the dignity and wellbeing of senior citizens through day-care centres and home visits.');
GO

-- =============================================================
-- 5. BUSINESSES (UserId 21–30)
-- =============================================================
INSERT INTO Business (UserId, BusinessRegNum, Industry, ContactPersonName, ContactPersonTitle, BusinessEmail, CSR_Goal)
VALUES
(21, 'BUS-2015-789012', 'Financial Services', 'Zanele Motsepe',  'Head of CSR',           'csr@ubuntucorp.co.za',        'Invest R2m annually in NPO partnerships advancing B-BBEE socio-economic development.'),
(22, 'BUS-2017-345678', 'Technology',         'Ryan Adams',      'Partnerships Manager',  'partnerships@rainbowtech.io', 'Partner with 5 verified NPOs per year to provide digital-skills training in rural areas.'),
(23, 'BUS-2012-112233', 'Banking',            'Lebo Sithole',    'CSI Director',          'impact@kalaharibank.co.za',   'Fund financial-literacy programmes reaching 10 000 learners annually.'),
(24, 'BUS-2018-556677', 'Agriculture',        'Pieter van Wyk',  'Sustainability Lead',   'giving@capefresh.co.za',      'Donate surplus produce and fund food-security NPOs across the Western Cape.'),
(25, 'BUS-2010-998877', 'Mining',             'Thandeka Zulu',   'Community Relations',   'csr@summitmining.co.za',      'Invest in skills development and healthcare in host mining communities.'),
(26, 'BUS-2019-443322', 'Retail',             'Grace Naidoo',    'ESG Manager',           'social@brightretail.co.za',   'Support youth employment through retail learnerships and NPO co-funding.'),
(27, 'BUS-2016-667788', 'Pharmaceuticals',    'Dr Ahmed Khan',   'Foundation Director',   'foundation@novapharma.co.za', 'Fund community health clinics and chronic-medication access programmes.'),
(28, 'BUS-2014-221144', 'Logistics',          'Sibusiso Dube',   'CSR Coordinator',       'csr@azanialogistics.co.za',   'Provide free transport and distribution support to food and disaster-relief NPOs.'),
(29, 'BUS-2020-889900', 'Renewable Energy',   'Chloe Fourie',    'Impact Lead',           'impact@solarafrica.co.za',    'Install solar systems at NPO facilities and schools in off-grid communities.'),
(30, 'BUS-2013-334455', 'Food & Beverage',    'Mandla Khoza',    'Head of Giving',        'giving@tabletopfoods.co.za',  'Fund nutrition programmes and community kitchens nationwide.');
GO

-- =============================================================
-- 6. PROFILES (one per user)
-- =============================================================
INSERT INTO Profile (UserId, ProfileName, Bio, ProfileImage, Following, Followers)
VALUES
(1,  'Thabo Mokoena',           'Passionate about education and giving back to Soweto.', NULL, 3, 0),
(2,  'Nomvula Dlamini',         'Community activist fighting food insecurity.', NULL, 1, 0),
(3,  'Sipho Nkosi',             'Environmental advocate and weekend hiker.', NULL, 2, 0),
(4,  'Lerato Molefe',           'Championing women in leadership.', NULL, 1, 0),
(5,  'Ayanda Khumalo',          'Animal lover and volunteer.', NULL, 0, 0),
(6,  'Kagiso Ndlovu',           'Grassroots sports coach.', NULL, 1, 0),
(7,  'Zinhle Maseko',           'Mental-health peer supporter.', NULL, 0, 0),
(8,  'Tshepo Radebe',           'Disability-rights advocate.', NULL, 1, 0),
(9,  'Fatima Patel',            'Volunteer and donor.', NULL, 0, 0),
(10, 'Jordan Williams',         'Supporting the arts in PE.', NULL, 1, 0),
(11, 'HopeBright Foundation',   'Every child deserves a fair shot at education.', NULL, 0, 4),
(12, 'Green Future SA',         'Greening South Africa''s cities.', NULL, 0, 2),
(13, 'YouthRise Collective',    'Skills and dignity for unemployed youth.', NULL, 0, 2),
(14, 'Thanda Health Collective','Healthcare is a human right.', NULL, 0, 1),
(15, 'SheLeads SA',             'Lifting women and girls to lead.', NULL, 0, 1),
(16, 'Feed The Nation',         'No one should go to bed hungry.', NULL, 0, 1),
(17, 'Bright Paws Rescue',      'Second chances for every animal.', NULL, 0, 1),
(18, 'Coding Kids SA',          'Future coders start here.', NULL, 0, 1),
(19, 'Safe Waters Trust',       'Clean oceans, healthy coasts.', NULL, 0, 0),
(20, 'Elders Care Network',     'Dignity for our seniors.', NULL, 0, 0),
(21, 'UbuntuCorp',              'Corporate citizens for social impact.', NULL, 0, 0),
(22, 'RainbowTech',             'Bridging the digital divide.', NULL, 0, 0),
(23, 'Kalahari Bank',           'Banking on communities.', NULL, 0, 0),
(24, 'CapeFresh',               'Fresh produce, full plates.', NULL, 0, 0),
(25, 'Summit Mining',           'Investing in host communities.', NULL, 0, 0),
(26, 'BrightRetail',            'Retail with a conscience.', NULL, 0, 0),
(27, 'NovaPharma Foundation',   'Health access for all.', NULL, 0, 0),
(28, 'Azania Logistics',        'Moving goods, moving good.', NULL, 0, 0),
(29, 'SolarAfrica',             'Powering communities sustainably.', NULL, 0, 0),
(30, 'TableTop Foods',          'Feeding the nation together.', NULL, 0, 0),
(31, 'UbuntuConnect Admin',     'Platform administrator.', NULL, 0, 0);
GO

-- =============================================================
-- 7. VERIFICATIONS (NPO document review — mixed states)
--    NPO_Id values follow NPO insert order: 1..10 map to UserId 11..20.
-- =============================================================
INSERT INTO Verification (NPO_Id, ReviewedByUserId, NPOCertificate, NPOTaxCertificate, Status, SubmittedDate, ReviewedDate)
VALUES
(1,  31,   'docs/hopebright_npo.pdf',   'docs/hopebright_tax.pdf',   'Approved', '2024-06-05 09:00:00', '2024-06-10 11:00:00'),
(2,  31,   'docs/greenfuture_npo.pdf',  'docs/greenfuture_tax.pdf',  'Approved', '2024-07-18 10:00:00', '2024-07-22 14:00:00'),
(3,  NULL, 'docs/youthrise_npo.pdf',    NULL,                         'Pending',  '2024-09-21 08:00:00', NULL),
(4,  31,   'docs/thanda_npo.pdf',       'docs/thanda_tax.pdf',       'Approved', '2024-10-12 09:30:00', '2024-10-16 10:15:00'),
(5,  NULL, 'docs/sheleads_npo.pdf',     'docs/sheleads_tax.pdf',     'Pending',  '2024-11-06 11:45:00', NULL),
(6,  31,   'docs/feednation_npo.pdf',   'docs/feednation_tax.pdf',   'Approved', '2024-12-02 07:00:00', '2024-12-05 09:00:00'),
(7,  31,   'docs/brightpaws_npo.pdf',   NULL,                         'Rejected', '2025-01-15 08:30:00', '2025-01-18 13:00:00'),
(8,  31,   'docs/codingkids_npo.pdf',   'docs/codingkids_tax.pdf',   'Approved', '2025-02-21 10:30:00', '2025-02-25 12:00:00'),
(9,  NULL, NULL,                         NULL,                         'Pending',  '2025-03-19 09:15:00', NULL),
(10, 31,   'docs/elderscare_npo.pdf',   'docs/elderscare_tax.pdf',   'Approved', '2025-04-08 07:45:00', '2025-04-11 10:00:00');
GO

-- =============================================================
-- 8. PROJECTS (randomized progress/amounts; a couple with 0 raised)
-- =============================================================
INSERT INTO Projects (NPO_Id, ProjectName, ProjectDesc, ProjectStatus, ProjectProgress, TargetAmount, RaisedAmount, Images, StartDate, EndDate)
VALUES
(1, 'Alexandra After-School Programme', 'Daily tutoring, stationery, and meals for 200 learners.', 'Active', 65.00, 120000.00, 78000.00, NULL, '2026-01-01', '2026-06-30'),
(1, 'Digital Classroom Initiative',     'Three computer labs in under-resourced primary schools.', 'Planning', 10.00, 250000.00, 25000.00, NULL, NULL, NULL),
(2, 'Cape Flats Greening Drive',        'Planting 5 000 indigenous trees across 10 communities.', 'Active', 45.00, 80000.00, 36000.00, NULL, '2026-02-01', '2026-11-30'),
(2, 'Waste Warriors Schools Programme', 'Recycling workshops in 20 Cape Town schools.', 'Completed', 100.00, 35000.00, 35000.00, NULL, NULL, NULL),
(3, 'Umlazi Skills Academy Cohort 3',   'Six-month vocational training for 50 youth.', 'Active', 30.00, 180000.00, 54000.00, NULL, '2026-03-01', '2026-08-31'),
(4, 'Mobile Clinic Expansion',          'Second mobile clinic van for rural KZN.', 'Active', 22.00, 350000.00, 77000.00, NULL, '2026-01-15', '2026-12-15'),
(5, 'Women in Tech Bursary Fund',       'Full bursaries for 15 women in STEM.', 'Active', 55.00, 300000.00, 165000.00, NULL, NULL, NULL),
(6, 'Township Food Gardens',            'Establish 30 community food gardens.', 'Planning', 5.00, 90000.00, 0.00, NULL, NULL, NULL),
(7, 'Spay & Neuter Blitz',              'Sterilise 1 000 township pets in 2026.', 'Active', 40.00, 60000.00, 24000.00, NULL, '2026-02-10', '2026-10-31'),
(8, 'Code Clubs in 10 Schools',         'Weekly coding clubs reaching 500 learners.', 'Active', 70.00, 110000.00, 77000.00, NULL, NULL, NULL),
(9, 'False Bay Clean Coast',            'Monthly beach clean-ups and marine education.', 'Active', 33.00, 70000.00, 0.00, NULL, '2026-01-05', NULL),
(10,'Senior Day-Care Upgrade',          'Refurbish three day-care centres for the elderly.', 'Planning', 15.00, 140000.00, 21000.00, NULL, NULL, NULL);
GO

-- =============================================================
-- 9. FUNDING REQUESTS (some RaisedAmount at 0; dates vary)
-- =============================================================
INSERT INTO FundingRequest (NPO_Id, Title, Purpose, TargetAmount, RaisedAmount, BudgetBreakdown, Images, StartDate, EndDate)
VALUES
(1, 'School Stationery Drive 2026', 'Stationery packs for 500 learners.', 50000.00, 18500.00, 'Pens: R10k | Books: R15k | Bags: R15k | Admin: R10k', NULL, '2026-01-15', '2026-03-31'),
(2, 'Tree Planting Equipment',      'Spades, seedlings, irrigation.', 25000.00, 12000.00, 'Seedlings: R10k | Tools: R8k | Transport: R4k | Admin: R3k', NULL, '2026-02-01', '2026-05-30'),
(3, 'Youth Skills Materials',       'Welding rods, protective gear.', 40000.00, 0.00, 'Consumables: R20k | Safety gear: R12k | Certs: R8k', NULL, '2026-03-01', '2026-08-31'),
(4, 'Clinic Fuel & Supplies',       'Fuel and medical supplies for mobile clinic.', 60000.00, 23000.00, 'Fuel: R20k | Meds: R30k | Admin: R10k', NULL, '2026-01-20', '2026-07-20'),
(5, 'Leadership Camp Sponsorship',  'Residential leadership camp for 40 girls.', 35000.00, 9000.00, 'Venue: R15k | Transport: R10k | Meals: R10k', NULL, '2026-04-01', '2026-06-30'),
(6, 'Soup Kitchen Winter Fund',     'Daily meals through winter for 300 people.', 45000.00, 0.00, 'Food: R35k | Gas: R5k | Admin: R5k', NULL, '2026-05-01', '2026-08-31');
GO

-- =============================================================
-- 10. VOLUNTEER OPPORTUNITIES (some linked to funding requests)
-- =============================================================
INSERT INTO VolunteerOpportunity (NPO_Id, FundingRequestId, RoleTitle, Category, NumOfPositions, Description, SkillsRequired, TimeCommitment, Duration, MediaURL)
VALUES
(1, NULL, 'After-School Tutor', 'Education', 10, 'Tutor primary learners in Maths and English in Alexandra.', 'Tutoring experience, Grade 12 minimum', 'Weekday afternoons', '6 months', NULL),
(1, NULL, 'Admin & Fundraising Volunteer', 'Administration', 3, 'Assist with donor comms, social media, and grant applications.', 'Writing, MS Office', '2 days/week', '3 months', NULL),
(2, 2,    'Tree Planting Crew', 'Environment', 20, 'Join weekend tree-planting drives across the Cape Flats.', 'None — physical fitness helpful', 'Saturdays 07:00–13:00', 'Ongoing', NULL),
(3, 3,    'Vocational Skills Mentor', 'Youth Development', 5, 'Mentor trainees at the Umlazi Skills Academy.', 'Qualified artisan', 'Weekends + one weekday', '6 months', NULL),
(4, NULL, 'Mobile Clinic Assistant', 'Healthcare', 4, 'Support nurses during mobile clinic visits.', 'First-aid certificate preferred', '2 days/week', '4 months', NULL),
(5, 5,    'Girls'' Mentorship Coach', 'Women Empowerment', 8, 'Coach high-school girls in leadership and confidence.', 'Mentoring, patience', 'Saturdays', '6 months', NULL),
(7, NULL, 'Animal Care Volunteer', 'Animal Welfare', 12, 'Walk, feed, and socialise rescue animals at the shelter.', 'Comfortable with animals', 'Flexible', 'Ongoing', NULL),
(8, NULL, 'Code Club Facilitator', 'Digital Skills', 6, 'Run weekly coding sessions for primary learners.', 'Basic programming, teaching', '3 hours/week', '3 months', NULL);
GO

-- =============================================================
-- 11. IMPACT TRACKS (NPO reported metrics)
-- =============================================================
INSERT INTO ImpactTrack (NPO_Id, ImpactMetric, Value, Period, Description)
VALUES
(1, 'Learners Supported',   200.00, '2025',    'Learners attending after-school tutoring.'),
(1, 'Meals Provided',     18000.00, '2025',    'Total meals served to learners.'),
(2, 'Trees Planted',       3200.00, '2025',    'Indigenous trees planted in Cape Flats.'),
(2, 'Schools Reached',       20.00, '2025',    'Schools completing the Waste Warriors programme.'),
(3, 'Youth Trained',         95.00, '2024–2025','Youth completing vocational training.'),
(4, 'Patients Seen',       5400.00, '2025',    'Patients treated by the mobile clinic.'),
(5, 'Bursaries Awarded',     15.00, '2025',    'Women awarded STEM bursaries.'),
(6, 'Food Gardens Built',    12.00, '2025',    'Community food gardens established.'),
(8, 'Learners Coding',      480.00, '2025',    'Learners enrolled in code clubs.');
GO

-- =============================================================
-- 12. PARTNERSHIP CAMPAIGNS (Business → NPO; includes ImageUrl)
--     BusinessId 1..10 map to UserId 21..30.
-- =============================================================
INSERT INTO PartnershipCampaign (BusinessId, Title, Category, BudgetPerPartner, NumOfPartners, Requirements, Description, ImageUrl, StartDate, EndDate)
VALUES
(1, 'Education Impact Partnership 2026', 'Education', 80000.00, 3, 'Verified NPO, 100+ beneficiaries, quarterly reports.', 'UbuntuCorp seeks 3 verified education NPOs for structured CSR investment.', NULL, '2026-03-01', '2026-12-31'),
(2, 'Digital Skills for Townships', 'Technology', 60000.00, 2, 'Youth training programmes, adequate facilities.', 'RainbowTech co-funds digital-literacy and coding bootcamps with 2 NPOs.', NULL, '2026-04-01', '2026-09-30'),
(3, 'Financial Literacy Drive', 'Education', NULL, 4, 'Reach learners aged 12–18.', 'Kalahari Bank funds financial-literacy programmes nationwide.', NULL, '2026-02-15', '2026-11-30'),
(4, 'Food Security Co-Fund', 'Food Security', 45000.00, 3, 'Active feeding scheme required.', 'CapeFresh partners with food-security NPOs across the Western Cape.', NULL, '2026-05-01', '2026-10-31'),
(7, 'Community Health Access', 'Healthcare', 100000.00, 2, 'Operate clinics or health programmes.', 'NovaPharma Foundation funds clinic access and chronic-medication programmes.', NULL, '2026-03-15', NULL);
GO

-- =============================================================
-- 13. CAMPAIGN APPLICATIONS (NPO applies to Business campaigns)
-- =============================================================
INSERT INTO CampaignApplication (CampaignId, NPO_Id, ApplicationDate, Status, Motivation)
VALUES
(1, 1, '2026-03-05 10:00:00', 'Accepted', 'HopeBright has delivered education programmes since 2018 and will scale its Digital Classroom Initiative.'),
(1, 8, '2026-03-08 14:00:00', 'Pending',  'Coding Kids SA brings a strong digital-literacy track that complements this campaign.'),
(2, 8, '2026-04-03 09:00:00', 'Accepted', 'Coding Kids SA already runs code clubs and will upgrade to full-stack training.'),
(3, 1, '2026-02-20 11:00:00', 'Pending',  'HopeBright can embed financial literacy into its after-school programme.'),
(4, 6, '2026-05-05 08:30:00', 'Accepted', 'Feed The Nation runs daily soup kitchens that match this food-security campaign.');
GO

-- =============================================================
-- 14. POSTS (NPO community updates; some without media)
-- =============================================================
INSERT INTO Post (UserId, PostTitle, Content, MediaURL, LikeCount, ActivityStatus, Timestamp)
VALUES
(11, '200 Learners Completed Term 1', 'All 200 learners in our Alexandra programme completed Term 1 with an 18% improvement in Maths pass rates. Thank you volunteers and donors!', NULL, 12, 'Active', '2026-04-05 10:30:00'),
(11, 'New Computer Lab Opens', 'We switched on 25 computers in our first Digital Classroom lab today. Thank you UbuntuCorp!', NULL, 28, 'Active', '2026-05-12 08:00:00'),
(12, '3 200 Trees and Counting', 'Our crews have planted 3 200 indigenous trees across the Cape Flats — 64% toward our goal.', NULL, 19, 'Active', '2026-04-20 11:00:00'),
(12, 'Waste Warriors Graduates 20 Schools', '20 schools, 6 400 learners, 12.5 tonnes of waste diverted from landfill.', NULL, 35, 'Active', '2026-03-30 09:00:00'),
(13, 'Cohort 3 Applications Open', 'Free training in welding, plumbing, and electrical work for Umlazi youth aged 18–35. Apply now!', NULL, 8, 'Active', '2026-02-01 07:00:00'),
(14, 'Mobile Clinic Serves 500 Patients', 'Our mobile clinic treated over 500 patients in rural KZN this month.', NULL, 22, 'Active', '2026-04-18 09:00:00'),
(16, 'Winter Soup Kitchen Launch', 'Our winter soup kitchen is now serving 300 hot meals daily. Volunteers welcome.', NULL, 15, 'Active', '2026-05-02 06:30:00'),
(18, 'Code Clubs Reach 480 Learners', '480 learners are now building their first websites across 10 schools.', NULL, 17, 'Active', '2026-04-28 12:00:00');
GO

-- =============================================================
-- 15. COMMENTS
-- =============================================================
INSERT INTO Comment (PostId, UserId, Content, Timestamp)
VALUES
(1, 1, 'Incredible work! Keep it up HopeBright.', '2026-04-05 11:00:00'),
(1, 2, 'So inspiring — I would love to volunteer as a tutor.', '2026-04-05 12:30:00'),
(2, 3, 'Amazing to see tech access reaching these kids.', '2026-05-12 09:00:00'),
(3, 1, 'Joined last Saturday — best morning of my month!', '2026-04-20 13:00:00'),
(4, 2, 'Congratulations Green Future, 12.5 tonnes is huge!', '2026-03-30 10:00:00'),
(6, 4, 'This mobile clinic is a lifeline for rural families.', '2026-04-18 10:00:00'),
(7, 9, 'Happy to help at the soup kitchen this winter.', '2026-05-02 08:00:00');
GO

-- =============================================================
-- 16. POST LIKES
-- =============================================================
INSERT INTO PostLike (PostId, UserId, LikedDate)
VALUES
(1, 1, '2026-04-05 11:05:00'), (1, 2, '2026-04-05 12:35:00'),
(2, 1, '2026-05-12 09:10:00'), (2, 3, '2026-05-12 09:20:00'),
(3, 1, '2026-04-20 13:05:00'), (3, 4, '2026-04-20 14:00:00'),
(4, 2, '2026-03-30 10:10:00'), (4, 3, '2026-03-30 11:00:00'),
(5, 6, '2026-02-01 08:00:00'), (6, 4, '2026-04-18 10:30:00'),
(7, 9, '2026-05-02 08:05:00'), (8, 10, '2026-04-28 12:30:00');
GO

-- =============================================================
-- 17. FOLLOWS (Individuals following NPOs; NPO_Id 1..10)
-- =============================================================
INSERT INTO Follow (UserId, NPO_Id, FollowDate)
VALUES
(1, 1, '2026-01-20 09:00:00'),
(1, 2, '2026-02-10 10:00:00'),
(1, 4, '2026-02-18 10:00:00'),
(2, 1, '2026-02-15 11:00:00'),
(3, 2, '2026-03-01 08:00:00'),
(3, 9, '2026-03-04 08:00:00'),
(4, 5, '2026-03-25 09:00:00'),
(6, 3, '2026-04-19 10:00:00'),
(8, 7, '2026-05-28 11:00:00'),
(10, 8, '2026-07-01 12:00:00');
GO

-- =============================================================
-- 18. VOLUNTEER APPLICATIONS (OpportunityId 1..8 in insert order)
-- =============================================================
INSERT INTO VolunteerApplication
    (UserId, OpportunityId, FirstName, LastName, Email, PhoneNum, Skills, Availability, WhyVolunteer, Address, IDNumber, IDCardImage, FaceImage, Status, ApplicationDate)
VALUES
(1, 1, 'Thabo',   'Mokoena', 'thabo.mokoena@gmail.com',   '0711000001', 'Maths tutoring, mentorship', 'Weekday afternoons', 'I grew up in Alexandra and want to give back.', '12 Vilakazi St, Soweto', NULL, NULL, NULL, 'Accepted', '2026-01-25 10:00:00'),
(3, 3, 'Sipho',   'Nkosi',   'sipho.nkosi@outlook.com',   '0711000003', 'Gardening, community mobilisation', 'Saturday mornings', 'I want a greener Cape Town for the next generation.', '45 Mew Way, Khayelitsha', NULL, NULL, NULL, 'Accepted', '2026-02-20 09:30:00'),
(6, 4, 'Kagiso',  'Ndlovu',  'kagiso.ndlovu@gmail.com',   '0711000006', 'Qualified electrician, 8 yrs', 'Weekends', 'I want to pass on my trade skills to Umlazi youth.', '7 Mangosuthu Hwy, Umlazi', NULL, NULL, NULL, 'Pending', '2026-03-10 14:00:00'),
(8, 7, 'Tshepo',  'Radebe',  'tshepo.radebe@gmail.com',   '0711000008', 'Animal handling', 'Flexible', 'I love animals and want to help rescues.', '9 Loop St, Pinetown', NULL, NULL, NULL, 'Accepted', '2026-05-30 11:00:00'),
(9, 2, 'Fatima',  'Patel',   'fatima.patel@gmail.com',    '0711000009', 'Writing, social media', '2 days/week', 'I want to support fundraising and comms.', '3 Rose Ave, Lenasia', NULL, NULL, NULL, 'Pending', '2026-03-02 09:00:00');
GO

-- =============================================================
-- 19. VOLUNTEER LOGS (hours against accepted applications)
--     ApplicationId 1..5 in insert order; log only against accepted.
-- =============================================================
INSERT INTO VolunteerLog (ApplicationId, LogHours, LogDate, Notes)
VALUES
(1, 3.00, '2026-02-03', 'Tutored Grade 6 Maths — fractions.'),
(1, 3.00, '2026-02-10', 'Tutored Grade 5 English — comprehension.'),
(1, 3.00, '2026-02-17', 'Mixed group test prep.'),
(2, 6.00, '2026-02-22', 'Planted 80 trees at Langa Wetlands.'),
(2, 6.00, '2026-03-01', 'Planted 95 trees at Gugulethu Park.'),
(4, 4.00, '2026-06-05', 'Walked and fed 20 shelter dogs.');
GO

-- =============================================================
-- 20. TRANSACTIONS (TopUps, Donations, Funding, Withdrawals; mixed status)
-- =============================================================
INSERT INTO Transactions (SenderUserId, ReceiverUserId, Amount, TransactionType, Status, Timestamp)
VALUES
-- Top-ups (external payment, no sender)
(NULL, 1, 2000.00, 'TopUp', 'Completed', '2026-01-15 09:00:00'),
(NULL, 3, 5000.00, 'TopUp', 'Completed', '2026-03-01 08:00:00'),
(NULL, 8, 1500.00, 'TopUp', 'Completed', '2026-05-27 09:00:00'),
(NULL, 21, 180000.00, 'TopUp', 'Completed', '2026-02-01 09:00:00'),
(NULL, 25, 310000.00, 'TopUp', 'Completed', '2026-03-10 09:00:00'),
-- Donations (Individual → NPO user)
(1, 11, 300.00, 'Donation', 'Completed', '2026-02-05 11:00:00'),
(1, 12, 200.00, 'Donation', 'Completed', '2026-02-12 14:00:00'),
(3, 12, 150.00, 'Donation', 'Completed', '2026-03-10 09:30:00'),
(3, 19, 500.00, 'Donation', 'Completed', '2026-03-20 16:00:00'),
(8, 17, 120.00, 'Donation', 'Completed', '2026-06-01 08:30:00'),
(9, 16, 10000.00, 'Donation', 'Failed', '2026-05-03 10:00:00'),
-- Campaign contributions (Business → NPO user)
(21, 11, 80000.00, 'CampaignContribution', 'Completed', '2026-04-01 09:00:00'),
(22, 18, 60000.00, 'CampaignContribution', 'Completed', '2026-05-01 10:00:00'),
(27, 14, 100000.00, 'CampaignContribution', 'Completed', '2026-04-15 11:00:00'),
-- Withdrawal (NPO paying out)
(11, NULL, 1200.00, 'Withdrawal', 'Completed', '2026-04-10 09:00:00');
GO

-- =============================================================
-- Re-enable FK constraints
-- =============================================================
EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
GO

PRINT 'Fresh randomized seed inserted: 30 users (10 Individual / 10 NPO / 10 Business) + 1 Admin.';
GO
