-- =============================================================
-- UbuntuConnect Dummy Data Seed Script
-- Run against: UbuntuConnect_DB
-- Order: Users → Wallets → Individuals/NPOs/Businesses →
--        Profiles → NPO sub-tables → Campaigns → Posts →
--        Interactions
-- Password for ALL users: Test@1234
-- BCrypt hash of "Test@1234":
--   $2a$11$KsQ1fQJVj3BpCBYVoW4nLuqIH2Eol1aFnOfwHwBxBnuvVsKKRJvDi
-- =============================================================

USE UbuntuConnect_DB;
GO

-- Disable FK checks during bulk insert
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
GO

-- =============================================================
-- 1. USERS
--    1–3   : Individual users
--    4–6   : NPO users
--    7–8   : Business users
--    9     : Admin user
-- =============================================================
SET IDENTITY_INSERT Users ON;

INSERT INTO Users (UserId, UserEmail, UserContact, Location, PasswordHash, UserType, IsVerified, RegistrationDate, IsActive)
VALUES
-- Individuals
(1,  'thabo.mokoena@gmail.com',    '0711234567', 'Soweto, Gauteng',         '$2a$11$KsQ1fQJVj3BpCBYVoW4nLuqIH2Eol1aFnOfwHwBxBnuvVsKKRJvDi', 'Individual', 0, '2025-01-10 08:00:00', 1),
(2,  'nomvula.dlamini@gmail.com',  '0829876543', 'Khayelitsha, Cape Town',  '$2a$11$KsQ1fQJVj3BpCBYVoW4nLuqIH2Eol1aFnOfwHwBxBnuvVsKKRJvDi', 'Individual', 0, '2025-02-14 09:30:00', 1),
(3,  'sipho.nkosi@outlook.com',    '0654321098', 'Durban North, KZN',       '$2a$11$KsQ1fQJVj3BpCBYVoW4nLuqIH2Eol1aFnOfwHwBxBnuvVsKKRJvDi', 'Individual', 0, '2025-03-05 11:00:00', 1),
-- NPOs
(4,  'admin@hopebright.org.za',    '0118765432', 'Alexandra, Gauteng',      '$2a$11$KsQ1fQJVj3BpCBYVoW4nLuqIH2Eol1aFnOfwHwBxBnuvVsKKRJvDi', 'NPO',        1, '2024-06-01 07:00:00', 1),
(5,  'info@greenfuturesa.org',     '0219876543', 'Bellville, Cape Town',    '$2a$11$KsQ1fQJVj3BpCBYVoW4nLuqIH2Eol1aFnOfwHwBxBnuvVsKKRJvDi', 'NPO',        1, '2024-07-15 08:30:00', 1),
(6,  'contact@youthrise.co.za',    '0317654321', 'Umlazi, KwaZulu-Natal',   '$2a$11$KsQ1fQJVj3BpCBYVoW4nLuqIH2Eol1aFnOfwHwBxBnuvVsKKRJvDi', 'NPO',        0, '2024-09-20 10:00:00', 1),
-- Businesses
(7,  'csr@ubuntucorp.co.za',       '0119998877', 'Sandton, Gauteng',        '$2a$11$KsQ1fQJVj3BpCBYVoW4nLuqIH2Eol1aFnOfwHwBxBnuvVsKKRJvDi', 'Business',   0, '2024-11-01 09:00:00', 1),
(8,  'partnerships@rainbowtech.io','0213334455', 'Century City, Cape Town', '$2a$11$KsQ1fQJVj3BpCBYVoW4nLuqIH2Eol1aFnOfwHwBxBnuvVsKKRJvDi', 'Business',   0, '2025-01-20 10:30:00', 1),
-- Admin
(9,  'admin@ubuntuconnect.co.za',  '0100001111', 'Johannesburg, Gauteng',   '$2a$11$KsQ1fQJVj3BpCBYVoW4nLuqIH2Eol1aFnOfwHwBxBnuvVsKKRJvDi', 'Admin',      1, '2024-01-01 06:00:00', 1);

SET IDENTITY_INSERT Users OFF;
GO

-- =============================================================
-- 2. WALLETS (one per user)
-- =============================================================
SET IDENTITY_INSERT Wallet ON;

INSERT INTO Wallet (WalletId, UserId, Balance)
VALUES
(1, 1, 1500.00),
(2, 2, 750.50),
(3, 3, 3200.00),
(4, 4, 45000.00),
(5, 5, 28000.00),
(6, 6, 5000.00),
(7, 7, 150000.00),
(8, 8, 95000.00),
(9, 9, 0.00);

SET IDENTITY_INSERT Wallet OFF;
GO

-- =============================================================
-- 3. INDIVIDUALS
-- =============================================================
SET IDENTITY_INSERT Individual ON;

INSERT INTO Individual (IndividualId, UserId, FirstName, LastName, CauseOfCare)
VALUES
(1, 1, 'Thabo',   'Mokoena', 'Education and youth development'),
(2, 2, 'Nomvula', 'Dlamini', 'Food security and hunger relief'),
(3, 3, 'Sipho',   'Nkosi',   'Environmental conservation');

SET IDENTITY_INSERT Individual OFF;
GO

-- =============================================================
-- 4. NPOs
-- =============================================================
SET IDENTITY_INSERT NPO ON;

INSERT INTO NPO (NPO_Id, UserId, NPORegNum, OrganizationName, NPOFocusArea, NPOMission)
VALUES
(1, 4, 'NPO-2018-004521', 'HopeBright Foundation',
    'Education',
    'Empowering children in township communities through quality education, mentorship, and after-school programmes that bridge the gap between potential and opportunity.'),
(2, 5, 'NPO-2019-007832', 'Green Future SA',
    'Environment',
    'Restoring South Africa''s ecosystems by running urban greening initiatives, waste management education, and clean-energy advocacy across underserved communities.'),
(3, 6, 'NPO-2021-011043', 'YouthRise Collective',
    'Youth Development',
    'Equipping unemployed youth with vocational skills, entrepreneurship training, and work-readiness programmes to break the cycle of poverty.');

SET IDENTITY_INSERT NPO OFF;
GO

-- =============================================================
-- 5. BUSINESSES
-- =============================================================
SET IDENTITY_INSERT Business ON;

INSERT INTO Business (BusinessId, UserId, BusinessRegNum, Industry, ContactPersonName, ContactPersonTitle, BusinessEmail, CSR_Goal)
VALUES
(1, 7, 'BUS-2015-789012', 'Financial Services', 'Zanele Motsepe', 'Head of CSR',
    'csr@ubuntucorp.co.za',
    'Invest R2 million annually in NPO partnerships that advance B-BBEE socio-economic development targets.'),
(2, 8, 'BUS-2017-345678', 'Technology',         'Ryan Adams',     'Partnerships Manager',
    'partnerships@rainbowtech.io',
    'Partner with 5 verified NPOs per year to provide digital-skills training and technology access in rural areas.');

SET IDENTITY_INSERT Business OFF;
GO

-- =============================================================
-- 6. PROFILES
-- =============================================================
SET IDENTITY_INSERT Profile ON;

INSERT INTO Profile (ProfileId, UserId, ProfileName, Bio, ProfileImage, Following, Followers)
VALUES
(1, 1, 'Thabo Mokoena',        'Passionate about education and giving back to my community in Soweto.', NULL, 2, 0),
(2, 2, 'Nomvula Dlamini',      'Community activist fighting food insecurity one meal at a time.', NULL, 1, 0),
(3, 3, 'Sipho Nkosi',          'Environmental advocate and weekend hiker based in Durban.', NULL, 1, 0),
(4, 4, 'HopeBright Foundation','We exist to ensure every child in South Africa has a fair shot at education.', NULL, 0, 2),
(5, 5, 'Green Future SA',      'Greening South Africa''s cities and restoring hope for future generations.', NULL, 0, 1),
(6, 6, 'YouthRise Collective', 'Skills, dignity, and opportunity for South Africa''s unemployed youth.', NULL, 0, 1),
(7, 7, 'UbuntuCorp',           'Corporate citizens committed to meaningful social impact investment.', NULL, 0, 0),
(8, 8, 'RainbowTech',          'Technology company bridging the digital divide across South Africa.', NULL, 0, 0),
(9, 9, 'UbuntuConnect Admin',  'Platform administrator.', NULL, 0, 0);

SET IDENTITY_INSERT Profile OFF;
GO

-- =============================================================
-- 7. VERIFICATIONS
-- =============================================================
SET IDENTITY_INSERT Verification ON;

INSERT INTO Verification (VerificationId, NPO_Id, ReviewedByUserId, NPOCertificate, NPOTaxCertificate, Status, SubmittedDate, ReviewedDate)
VALUES
(1, 1, 9, 'docs/hopebright_npo_cert.pdf',   'docs/hopebright_tax_cert.pdf',   'Approved', '2024-06-05 09:00:00', '2024-06-10 11:00:00'),
(2, 2, 9, 'docs/greenfuture_npo_cert.pdf',  'docs/greenfuture_tax_cert.pdf',  'Approved', '2024-07-18 10:00:00', '2024-07-22 14:00:00'),
(3, 3, NULL, NULL, NULL, 'Pending', '2024-09-21 08:00:00', NULL);

SET IDENTITY_INSERT Verification OFF;
GO

-- =============================================================
-- 8. PROJECTS
-- =============================================================
SET IDENTITY_INSERT Projects ON;

INSERT INTO Projects (ProjectId, NPO_Id, ProjectName, ProjectDesc, ProjectStatus, ProjectProgress, TargetAmount, RaisedAmount, Images)
VALUES
-- HopeBright projects
(1, 1, 'Alexandra After-School Programme',
    'Providing daily tutoring, stationery, and meals to 200 learners in Grades 4–7 in Alexandra township.',
    'Active', 65.00, 120000.00, 78000.00, NULL),
(2, 1, 'Digital Classroom Initiative',
    'Setting up 3 computer labs with internet access in under-resourced primary schools.',
    'Planning', 10.00, 250000.00, 25000.00, NULL),
-- Green Future projects
(3, 2, 'Cape Flats Greening Drive',
    'Planting 5 000 indigenous trees across 10 communities in the Cape Flats.',
    'Active', 45.00, 80000.00, 36000.00, NULL),
(4, 2, 'Waste Warriors Schools Programme',
    'Running recycling and waste-awareness workshops in 20 Cape Town schools.',
    'Completed', 100.00, 35000.00, 35000.00, NULL),
-- YouthRise projects
(5, 3, 'Umlazi Skills Academy - Cohort 3',
    'Six-month vocational training in welding, plumbing, and electrical work for 50 youth.',
    'Active', 30.00, 180000.00, 54000.00, NULL);

SET IDENTITY_INSERT Projects OFF;
GO

-- =============================================================
-- 9. FUNDING REQUESTS
-- =============================================================
SET IDENTITY_INSERT FundingRequest ON;

INSERT INTO FundingRequest (RequestId, NPO_Id, Title, Purpose, TargetAmount, RaisedAmount, BudgetBreakdown, Images, StartDate, EndDate)
VALUES
(1, 1, 'School Stationery Drive 2026',
    'Purchase stationery packs for 500 learners who cannot afford school supplies.',
    50000.00, 18500.00,
    'Pens/pencils: R10 000 | Notebooks: R15 000 | Backpacks: R15 000 | Admin: R10 000',
    NULL, '2026-01-15', '2026-03-31'),
(2, 2, 'Tree Planting Equipment',
    'Purchase spades, seedlings, and irrigation equipment for the Cape Flats Greening Drive.',
    25000.00, 12000.00,
    'Seedlings: R10 000 | Tools: R8 000 | Transport: R4 000 | Admin: R3 000',
    NULL, '2026-02-01', '2026-05-30'),
(3, 3, 'Youth Skills Training Materials',
    'Welding rods, protective gear, and workshop consumables for Cohort 3.',
    40000.00, 5000.00,
    'Consumables: R20 000 | Safety gear: R12 000 | Certification fees: R8 000',
    NULL, '2026-03-01', '2026-08-31');

SET IDENTITY_INSERT FundingRequest OFF;
GO

-- =============================================================
-- 10. VOLUNTEER OPPORTUNITIES
-- =============================================================
SET IDENTITY_INSERT VolunteerOpportunity ON;

INSERT INTO VolunteerOpportunity (OpportunityId, NPO_Id, FundingRequestId, RoleTitle, Category, NumOfPositions, Description, SkillsRequired, TimeCommitment, Duration, MediaURL)
VALUES
(1, 1, NULL, 'After-School Tutor', 'Education', 10,
    'Provide tutoring to primary school learners in Maths and English every weekday afternoon in Alexandra.',
    'Teaching or tutoring experience, patience, Grade 12 minimum',
    'Weekday afternoons 14:00–17:00',
    '6 months', NULL),
(2, 1, NULL, 'Admin & Fundraising Volunteer', 'Administration', 3,
    'Assist HopeBright with donor communication, social media content, and grant application support.',
    'Good writing skills, Microsoft Office, social media savvy',
    '2 days per week (flexible)',
    '3 months', NULL),
(3, 2, 2, 'Tree Planting Crew Member', 'Environment', 20,
    'Join weekend tree-planting drives across Cape Flats communities. No experience needed — just energy and commitment.',
    'No specific skills required. Physical fitness helpful.',
    'Saturdays 07:00–13:00',
    'Ongoing', NULL),
(4, 3, 3, 'Vocational Skills Mentor', 'Youth Development', 5,
    'Mentor youth trainees in the Umlazi Skills Academy. Share industry knowledge and provide career guidance.',
    'Qualified tradesperson or artisan (plumbing, electrical, welding)',
    'Weekends and one weekday per week',
    '6 months', NULL);

SET IDENTITY_INSERT VolunteerOpportunity OFF;
GO

-- =============================================================
-- 11. IMPACT TRACKS
-- =============================================================
SET IDENTITY_INSERT ImpactTrack ON;

INSERT INTO ImpactTrack (ImpactId, NPO_Id, ImpactMetric, Value, Period, Description)
VALUES
(1, 1, 'Learners Supported',       200.00, '2025',       'Number of learners who attended after-school tutoring sessions in 2025.'),
(2, 1, 'Meals Provided',          18000.00, '2025',       'Total meals served to learners during after-school programme in 2025.'),
(3, 1, 'Pass Rate Improvement',      18.00, 'Q3 2025',    'Percentage increase in learner pass rates compared to prior year.'),
(4, 2, 'Trees Planted',            3200.00, '2025',       'Indigenous trees successfully planted in Cape Flats communities.'),
(5, 2, 'Schools Reached',            20.00, '2025',       'Number of schools that completed the Waste Warriors programme.'),
(6, 2, 'Tonnes of Waste Diverted',   12.50, 'Q4 2025',    'Waste successfully diverted from landfill through recycling drives.'),
(7, 3, 'Youth Trained',              95.00, '2024–2025',  'Total youth who completed vocational training across Cohorts 1 and 2.'),
(8, 3, 'Employment Rate',            62.00, '2025',       'Percentage of graduates who secured employment or started a business within 6 months.');

SET IDENTITY_INSERT ImpactTrack OFF;
GO

-- =============================================================
-- 12. PARTNERSHIP CAMPAIGNS
-- =============================================================
SET IDENTITY_INSERT PartnershipCampaign ON;

INSERT INTO PartnershipCampaign (CampaignId, BusinessId, Title, Category, BudgetPerPartner, NumOfPartners, Requirements, Description, StartDate, EndDate)
VALUES
(1, 1, 'Education Impact Partnership 2026',
    'Education',
    80000.00, 3,
    'NPO must be verified. Must serve at least 100 beneficiaries. Must provide quarterly impact reports.',
    'UbuntuCorp is seeking 3 verified education-focused NPOs to partner with for structured B-BBEE CSR investment. Partners will receive R80 000 each with quarterly disbursements tied to impact milestones.',
    '2026-03-01', '2026-12-31'),
(2, 2, 'Digital Skills for Townships',
    'Technology',
    60000.00, 2,
    'NPO must run training programmes for youth aged 18–35. Must have adequate training facilities.',
    'RainbowTech wants to co-fund digital literacy and coding bootcamps in partnership with 2 NPOs. Funding covers trainer costs, devices, and connectivity.',
    '2026-04-01', '2026-09-30');

SET IDENTITY_INSERT PartnershipCampaign OFF;
GO

-- =============================================================
-- 13. CAMPAIGN APPLICATIONS
-- =============================================================
SET IDENTITY_INSERT CampaignApplication ON;

INSERT INTO CampaignApplication (ApplicationId, CampaignId, NPO_Id, ApplicationDate, Status, Motivation)
VALUES
(1, 1, 1, '2026-03-05 10:00:00', 'Approved',
    'HopeBright has been delivering education programmes in Gauteng townships since 2018. This partnership will allow us to scale the Digital Classroom Initiative and reach 600 more learners.'),
(2, 1, 3, '2026-03-08 14:00:00', 'Pending',
    'While YouthRise focuses on youth development, we have an active digital-literacy component within our Skills Academy that would benefit directly from this campaign.'),
(3, 2, 3, '2026-04-03 09:00:00', 'Approved',
    'YouthRise already runs basic computer training. RainbowTech''s funding will let us upgrade our curriculum to include full-stack web development and data entry certification.');

SET IDENTITY_INSERT CampaignApplication OFF;
GO

-- =============================================================
-- 14. POSTS (NPO community updates)
-- =============================================================
SET IDENTITY_INSERT Post ON;

INSERT INTO Post (PostId, UserId, PostTitle, Content, MediaURL, LikeCount, ActivityStatus, Timestamp)
VALUES
(1, 4, '200 Learners Completed Term 1 Programme 🎉',
    'We are so proud to announce that all 200 learners enrolled in our Alexandra After-School Programme have completed Term 1! Maths pass rates have improved by 18% compared to last year. Thank you to our volunteers and donors — you make this possible. #HopeBright #Education #Ubuntu',
    NULL, 12, 'Active', '2026-04-05 10:30:00'),
(2, 4, 'New Computer Lab Opens in Alexandra Primary',
    'Today we switched on 25 computers in the first lab of our Digital Classroom Initiative at Alexandra Combined Primary. Learners were overjoyed to use a computer for the very first time. This would not have been possible without UbuntuCorp''s support. 💻',
    NULL, 28, 'Active', '2026-05-12 08:00:00'),
(3, 5, '3 200 Trees Planted — and Counting! 🌳',
    'Our amazing volunteer crews have now planted 3 200 indigenous trees across the Cape Flats. We are 64% of the way to our 5 000-tree goal. Join us next Saturday — link in bio!',
    NULL, 19, 'Active', '2026-04-20 11:00:00'),
(4, 5, 'Waste Warriors Graduates 20 Schools',
    'We are thrilled to celebrate the completion of the Waste Warriors Schools Programme! 20 schools. 6 400 learners. 12.5 tonnes of waste diverted from landfill. The future belongs to these young eco-champions 🌍♻️',
    NULL, 35, 'Active', '2026-03-30 09:00:00'),
(5, 6, 'Cohort 3 Applications Now Open!',
    'Are you a young person in Umlazi between the ages of 18 and 35 and looking for a trade skill? Applications for Cohort 3 of the YouthRise Skills Academy are NOW OPEN. We are offering free training in welding, plumbing, and electrical work. DM us or visit our website to apply. Deadline: 28 February 2026.',
    NULL, 8,  'Active', '2026-02-01 07:00:00'),
(6, 6, 'Cohort 2 Graduation Day 🎓',
    'Yesterday we celebrated 47 graduates from Cohort 2 of the YouthRise Skills Academy. 62% of our alumni from Cohorts 1 and 2 are already employed or running their own businesses. We are changing the story — one young person at a time.',
    NULL, 22, 'Active', '2026-01-15 12:00:00');

SET IDENTITY_INSERT Post OFF;
GO

-- =============================================================
-- 15. COMMENTS
-- =============================================================
SET IDENTITY_INSERT Comment ON;

INSERT INTO Comment (CommentId, PostId, UserId, Content, Timestamp)
VALUES
(1, 1, 1, 'This is incredible work! Keep it up HopeBright 🙌', '2026-04-05 11:00:00'),
(2, 1, 2, 'So inspiring. I would love to volunteer as a tutor.', '2026-04-05 12:30:00'),
(3, 2, 3, 'Amazing to see the kids'' faces light up. Tech access matters!', '2026-05-12 09:00:00'),
(4, 3, 1, 'I joined last Saturday and it was the best morning of my month!', '2026-04-20 13:00:00'),
(5, 4, 2, 'Congratulations Green Future! 12.5 tonnes is no joke 💪', '2026-03-30 10:00:00'),
(6, 6, 3, 'Congrats to all the graduates. You are an inspiration to Durban youth!', '2026-01-15 14:00:00');

SET IDENTITY_INSERT Comment OFF;
GO

-- =============================================================
-- 16. POST LIKES
-- =============================================================
SET IDENTITY_INSERT PostLike ON;

INSERT INTO PostLike (LikeId, PostId, UserId, LikedDate)
VALUES
(1,  1, 1, '2026-04-05 11:05:00'),
(2,  1, 2, '2026-04-05 12:35:00'),
(3,  2, 1, '2026-05-12 09:10:00'),
(4,  2, 3, '2026-05-12 09:20:00'),
(5,  3, 1, '2026-04-20 13:05:00'),
(6,  3, 2, '2026-04-20 14:00:00'),
(7,  4, 2, '2026-03-30 10:10:00'),
(8,  4, 3, '2026-03-30 11:00:00'),
(9,  5, 1, '2026-02-01 08:00:00'),
(10, 6, 3, '2026-01-15 14:30:00');

SET IDENTITY_INSERT PostLike OFF;
GO

-- =============================================================
-- 17. FOLLOWS (Individuals following NPOs)
-- =============================================================
SET IDENTITY_INSERT Follow ON;

INSERT INTO Follow (FollowId, UserId, NPO_Id, FollowDate)
VALUES
(1, 1, 1, '2026-01-20 09:00:00'),  -- Thabo follows HopeBright
(2, 1, 2, '2026-02-10 10:00:00'),  -- Thabo follows Green Future
(3, 2, 1, '2026-02-15 11:00:00'),  -- Nomvula follows HopeBright
(4, 3, 3, '2026-03-01 08:00:00');  -- Sipho follows YouthRise

SET IDENTITY_INSERT Follow OFF;
GO

-- =============================================================
-- 18. VOLUNTEER APPLICATIONS
-- =============================================================
SET IDENTITY_INSERT VolunteerApplication ON;

INSERT INTO VolunteerApplication
    (ApplicationId, UserId, OpportunityId, FirstName, LastName, Email, PhoneNum, Skills, Availability, WhyVolunteer, Address, IDNumber, IDCardImage, FaceImage, Status, ApplicationDate)
VALUES
(1, 1, 1, 'Thabo',   'Mokoena', 'thabo.mokoena@gmail.com',   '0711234567',
    'Mathematics tutoring, mentorship, community engagement',
    'Weekday afternoons',
    'I grew up in Alexandra and want to give back to learners who share my background. Education changed my life.',
    '12 Vilakazi Street, Soweto', NULL, NULL, NULL, 'Accepted',  '2026-01-25 10:00:00'),
(2, 2, 3, 'Nomvula', 'Dlamini', 'nomvula.dlamini@gmail.com', '0829876543',
    'Gardening, environmental awareness, community mobilisation',
    'Saturday mornings',
    'I care deeply about our environment and want to leave Cape Town greener for the next generation.',
    '45 Mew Way, Khayelitsha', NULL, NULL, NULL, 'Accepted',  '2026-02-20 09:30:00'),
(3, 3, 4, 'Sipho',   'Nkosi',   'sipho.nkosi@outlook.com',   '0654321098',
    'Qualified electrician, 8 years experience, SANS 10142 certified',
    'Weekends and Wednesdays',
    'I want to pass on my trade skills to unemployed youth in Umlazi and help them build sustainable careers.',
    '7 Mangosuthu Highway, Umlazi', NULL, NULL, NULL, 'Pending',   '2026-03-10 14:00:00');

SET IDENTITY_INSERT VolunteerApplication OFF;
GO

-- =============================================================
-- 19. VOLUNTEER LOGS (hours logged against accepted applications)
-- =============================================================
SET IDENTITY_INSERT VolunteerLog ON;

INSERT INTO VolunteerLog (LogId, ApplicationId, LogHours, LogDate, Notes)
VALUES
(1, 1, 3.00, '2026-02-03', 'Tutored Grade 6 Maths — fractions and decimals.'),
(2, 1, 3.00, '2026-02-10', 'Tutored Grade 5 English — comprehension.'),
(3, 1, 3.00, '2026-02-17', 'Tutored mixed group, prepared them for upcoming test.'),
(4, 1, 3.00, '2026-02-24', 'Post-test review session. Most learners showed improvement.'),
(5, 2, 6.00, '2026-02-22', 'Planted 80 trees at Langa Wetlands with crew of 15.'),
(6, 2, 6.00, '2026-03-01', 'Planted 95 trees at Gugulethu Community Park.'),
(7, 2, 6.00, '2026-03-08', 'Planted 110 trees at Mitchells Plain Greenbelt.');

SET IDENTITY_INSERT VolunteerLog OFF;
GO

-- =============================================================
-- 20. TRANSACTIONS
-- =============================================================
SET IDENTITY_INSERT Transactions ON;

INSERT INTO Transactions (TransactionId, SenderUserId, ReceiverUserId, Amount, TransactionType, Status, Timestamp)
VALUES
-- Top-ups (no sender = external payment)
(1,  NULL, 1, 2000.00, 'TopUp',    'Completed', '2026-01-15 09:00:00'),
(2,  NULL, 2, 1000.00, 'TopUp',    'Completed', '2026-02-01 10:00:00'),
(3,  NULL, 3, 5000.00, 'TopUp',    'Completed', '2026-03-01 08:00:00'),
-- Donations from individuals to NPOs
(4,  1, 4,  300.00, 'Donation', 'Completed', '2026-02-05 11:00:00'),  -- Thabo → HopeBright
(5,  1, 5,  200.00, 'Donation', 'Completed', '2026-02-12 14:00:00'),  -- Thabo → Green Future
(6,  2, 4,  150.00, 'Donation', 'Completed', '2026-03-10 09:30:00'),  -- Nomvula → HopeBright
(7,  3, 6,  500.00, 'Donation', 'Completed', '2026-03-20 16:00:00'),  -- Sipho → YouthRise
(8,  3, 4,  300.00, 'Donation', 'Completed', '2026-04-01 08:30:00'),  -- Sipho → HopeBright
-- Business funding transfers
(9,  7, 4, 80000.00, 'Funding',  'Completed', '2026-04-01 09:00:00'),  -- UbuntuCorp → HopeBright (campaign)
(10, 8, 6, 60000.00, 'Funding',  'Completed', '2026-05-01 10:00:00');  -- RainbowTech → YouthRise (campaign)

SET IDENTITY_INSERT Transactions OFF;
GO

-- =============================================================
-- Re-enable FK constraints
-- =============================================================
EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
GO

PRINT 'Seed data inserted successfully.';
GO
