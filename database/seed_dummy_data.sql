-- ============================================================
-- SEED SCRIPT: Dummy NPO Data
-- Run AFTER all migrations. Creates realistic posts, projects,
-- and volunteer opportunities for existing NPOs.
--
-- NOTE: This script assumes NPOs already exist in the database.
-- If you have no NPOs yet, register a few via the app first,
-- then run this script to populate their content.
--
-- It uses the first 3 NPO UserIds found in the database.
-- ============================================================
USE UbuntuConnect_DB;
GO

-- Get the first 3 NPO user IDs dynamically
DECLARE @npo1UserId INT, @npo2UserId INT, @npo3UserId INT;
DECLARE @npo1Id INT, @npo2Id INT, @npo3Id INT;

SELECT TOP 1 @npo1UserId = UserId, @npo1Id = NPO_Id FROM NPO ORDER BY NPO_Id;
SELECT TOP 1 @npo2UserId = UserId, @npo2Id = NPO_Id FROM NPO WHERE NPO_Id > ISNULL(@npo1Id, 0) ORDER BY NPO_Id;
SELECT TOP 1 @npo3UserId = UserId, @npo3Id = NPO_Id FROM NPO WHERE NPO_Id > ISNULL(@npo2Id, 0) ORDER BY NPO_Id;

-- Update NPO details to look realistic
IF @npo1Id IS NOT NULL
BEGIN
    UPDATE NPO SET 
        OrganizationName = 'Ubuntu Hope Foundation',
        NPOFocusArea = 'Education & Youth Development',
        NPOMission = 'Empowering South African youth through quality education, mentorship programs, and after-school support. We believe every child deserves access to learning resources that unlock their full potential.'
    WHERE NPO_Id = @npo1Id;
END

IF @npo2Id IS NOT NULL
BEGIN
    UPDATE NPO SET 
        OrganizationName = 'Green Earth Initiative SA',
        NPOFocusArea = 'Environmental Conservation',
        NPOMission = 'Leading community-driven environmental conservation across South Africa. From tree planting to ocean cleanup, we mobilize volunteers to protect our natural heritage for future generations.'
    WHERE NPO_Id = @npo2Id;
END

IF @npo3Id IS NOT NULL
BEGIN
    UPDATE NPO SET 
        OrganizationName = 'Thanda Health Collective',
        NPOFocusArea = 'Healthcare & Wellness',
        NPOMission = 'Providing accessible healthcare services to underserved communities through mobile clinics, health education workshops, and mental wellness programs. Healthcare is a human right.'
    WHERE NPO_Id = @npo3Id;
END

-- ============================================================
-- POSTS with realistic Unsplash images
-- ============================================================

-- Posts for NPO 1 (Education)
IF @npo1UserId IS NOT NULL
BEGIN
    INSERT INTO Post (UserId, PostTitle, Content, MediaURL, LikeCount, ActivityStatus, Timestamp) VALUES
    (@npo1UserId, 'Community Library Grand Opening!', 
     'We are thrilled to announce that our community library officially opened its doors last Saturday! Over 200 community members attended the ribbon-cutting ceremony. The library houses 3,000+ books, 15 computer stations, and a dedicated children''s reading corner. Special thanks to all donors who made this dream a reality. Together, we''re building a brighter future for Soweto''s youth.',
     'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80', 45, 'Active', DATEADD(DAY, -2, GETDATE())),
    
    (@npo1UserId, 'Youth Mentorship Program Reaches 100 Students!',
     'Incredible milestone! Our youth mentorship program has officially enrolled its 100th student this semester. Each student is paired with a dedicated mentor who provides academic support, career guidance, and personal development coaching. We''ve seen a 35% improvement in grades among participants. The transformation we''re witnessing in these young lives is truly remarkable.',
     'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80', 67, 'Active', DATEADD(DAY, -5, GETDATE())),
    
    (@npo1UserId, 'After-School STEM Workshop Success',
     'Our weekend STEM workshops have been an absolute hit! Last Saturday, 40 students built their first robots using recycled materials. The excitement in their eyes was priceless. We''re proving that science education doesn''t need expensive equipment - just creativity, dedication, and passionate teachers. Next month: coding bootcamp for beginners!',
     'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', 32, 'Active', DATEADD(DAY, -8, GETDATE())),
    
    (@npo1UserId, 'Scholarship Fund Update - R50,000 Raised!',
     'Thanks to the generosity of our community, we''ve raised R50,000 for our 2026 scholarship fund! This will provide full tuition support for 5 deserving students from disadvantaged backgrounds. Applications are now open for Grade 12 learners with strong academic records and financial need. Education changes everything.',
     'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&q=80', 89, 'Active', DATEADD(DAY, -12, GETDATE()));
END

-- Posts for NPO 2 (Environment)
IF @npo2UserId IS NOT NULL
BEGIN
    INSERT INTO Post (UserId, PostTitle, Content, MediaURL, LikeCount, ActivityStatus, Timestamp) VALUES
    (@npo2UserId, '1,000 Trees Planted in Table Mountain Reserve!',
     'What an incredible day! 150 volunteers came together to plant 1,000 indigenous trees in the Table Mountain buffer zone. Species planted include Yellowwoods, Milkwoods, and Wild Olives - all native to the Western Cape. This brings our total to 5,000 trees planted this year. Every tree is a step toward reversing climate change.',
     'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80', 52, 'Active', DATEADD(DAY, -3, GETDATE())),
    
    (@npo2UserId, 'Beach Cleanup: 500kg of Plastic Removed from Muizenberg',
     'Our monthly beach cleanup at Muizenberg collected over 500kg of plastic waste! 80 volunteers spent their Saturday morning making a real difference. The most common items? Plastic bottles, straws, and food packaging. We''re partnering with local restaurants to reduce single-use plastics. Small changes, big impact.',
     'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&q=80', 78, 'Active', DATEADD(DAY, -7, GETDATE())),
    
    (@npo2UserId, 'Solar Panel Installation at Community Centre',
     'Exciting news! We''ve completed the installation of 20 solar panels at the Khayelitsha Community Centre. This will reduce their electricity costs by 60% and prevent 12 tons of CO2 emissions annually. Green energy for the community, by the community. This is what sustainable development looks like.',
     'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 41, 'Active', DATEADD(DAY, -10, GETDATE())),
    
    (@npo2UserId, 'Urban Garden Project Feeds 50 Families',
     'Our rooftop garden initiative in Woodstock is now producing enough fresh vegetables to feed 50 families weekly! Tomatoes, spinach, carrots, and herbs - all grown organically right in the heart of Cape Town. Community members are learning sustainable farming while eating healthier. Food security starts at home.',
     'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80', 63, 'Active', DATEADD(DAY, -15, GETDATE()));
END

-- Posts for NPO 3 (Healthcare)
IF @npo3UserId IS NOT NULL
BEGIN
    INSERT INTO Post (UserId, PostTitle, Content, MediaURL, LikeCount, ActivityStatus, Timestamp) VALUES
    (@npo3UserId, 'Mobile Clinic Serves 500 Patients This Month',
     'Our mobile health clinic has provided free healthcare to over 500 patients in rural KwaZulu-Natal this month alone. Services include basic check-ups, blood pressure monitoring, diabetes screening, and HIV testing. Many of these patients would otherwise have to travel 50+ km to reach a clinic. Healthcare should come to the people.',
     'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&q=80', 91, 'Active', DATEADD(DAY, -1, GETDATE())),
    
    (@npo3UserId, 'Mental Health Awareness Workshop Success',
     'Breaking the stigma! 200 community members attended our mental health awareness workshop in Umlazi. Topics covered included depression, anxiety, substance abuse, and where to find help. The bravery of those who shared their stories was inspiring. Remember: it''s okay to not be okay. Asking for help is strength, not weakness.',
     'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80', 55, 'Active', DATEADD(DAY, -4, GETDATE())),
    
    (@npo3UserId, 'First Aid Training for 100 Community Health Workers',
     'We''ve trained 100 community health workers in advanced first aid! These individuals will serve as the first point of contact for medical emergencies in their neighborhoods. Skills covered: CPR, wound care, choking response, and emergency triage. Every trained person is a potential life-saver.',
     'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80', 37, 'Active', DATEADD(DAY, -9, GETDATE())),
    
    (@npo3UserId, 'Maternal Health Program Launch',
     'Proud to announce the launch of our maternal health program! We''re providing free prenatal care, nutrition guidance, and birthing support to expectant mothers in underserved areas. Every mother deserves a safe pregnancy and healthy baby. Our team of midwives and nurses will support 200 mothers in the first year.',
     'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80', 44, 'Active', DATEADD(DAY, -14, GETDATE()));
END

-- ============================================================
-- FUNDRAISER PROJECTS with images
-- ============================================================

IF @npo1Id IS NOT NULL
BEGIN
    INSERT INTO Projects (NPO_Id, ProjectName, ProjectDesc, ProjectStatus, ProjectProgress, TargetAmount, RaisedAmount, Images) VALUES
    (@npo1Id, 'Build a Computer Lab for Township Schools',
     'We''re raising funds to build a fully-equipped computer lab serving 3 township schools in Soweto. The lab will have 30 computers, high-speed internet, and a full-time instructor. Digital literacy is essential for our youth to compete in the modern job market.',
     'Active', 45.00, 150000, 67500,
     'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80,https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80,https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80'),
    
    (@npo1Id, 'School Uniform & Supply Drive 2026',
     'Help us provide school uniforms, stationery, and backpacks to 500 learners from low-income families. No child should miss school because they can''t afford a uniform. Every R300 fully equips one child for the school year.',
     'Active', 72.00, 75000, 54000,
     'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80,https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80');
END

IF @npo2Id IS NOT NULL
BEGIN
    INSERT INTO Projects (NPO_Id, ProjectName, ProjectDesc, ProjectStatus, ProjectProgress, TargetAmount, RaisedAmount, Images) VALUES
    (@npo2Id, 'Ocean Cleanup Boat Project',
     'We''re crowdfunding to purchase a dedicated ocean cleanup vessel for False Bay. The boat will be equipped with nets and collection systems to remove floating plastic waste. Our goal: remove 10 tons of ocean plastic in the first year of operation.',
     'Active', 28.00, 250000, 70000,
     'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=800&q=80,https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80,https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800&q=80'),
    
    (@npo2Id, 'Community Recycling Hub',
     'Building a state-of-the-art recycling center in Philippi that will process 50 tons of recyclable waste monthly and create 20 permanent jobs. The hub will include sorting facilities, a buy-back center, and environmental education space.',
     'Active', 55.00, 180000, 99000,
     'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80,https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80');
END

IF @npo3Id IS NOT NULL
BEGIN
    INSERT INTO Projects (NPO_Id, ProjectName, ProjectDesc, ProjectStatus, ProjectProgress, TargetAmount, RaisedAmount, Images) VALUES
    (@npo3Id, 'Mobile Clinic Vehicle Upgrade',
     'Our current mobile clinic van has served us well for 5 years, but it needs replacing. We''re fundraising for a larger vehicle that can carry more medical equipment, serve more patients per day, and reach more remote areas in KZN.',
     'Active', 35.00, 350000, 122500,
     'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80,https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&q=80,https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80'),
    
    (@npo3Id, 'Community Wellness Centre Construction',
     'We''re building a permanent wellness centre in Umlazi that will offer counseling, physiotherapy, maternal care, and chronic disease management. The centre will serve 10,000+ patients annually and employ 15 healthcare professionals.',
     'Active', 18.00, 500000, 90000,
     'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80,https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80');
END

-- ============================================================
-- VOLUNTEER OPPORTUNITIES
-- ============================================================

IF @npo1Id IS NOT NULL
BEGIN
    INSERT INTO VolunteerOpportunity (NPO_Id, RoleTitle, Category, NumOfPositions, Description, SkillsRequired, TimeCommitment, Duration, MediaURL) VALUES
    (@npo1Id, 'Youth Mentor', 'Education', 10, 'Guide and support a high school student through academic challenges, career exploration, and personal growth. Meet weekly for one-on-one mentoring sessions.', 'Teaching, patience, empathy, matric certificate minimum', '4 hours/week', '6 months', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80'),
    (@npo1Id, 'After-School Care Assistant', 'Youth Development', 5, 'Help supervise and engage children aged 6-12 in our after-school program. Activities include homework help, arts & crafts, sports, and reading time.', 'Childcare experience, First Aid certificate preferred', 'Weekday afternoons (2-5pm)', 'Ongoing', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80'),
    (@npo1Id, 'Computer Lab Instructor', 'Digital Skills', 3, 'Teach basic computer literacy and coding to township youth. Classes run on Saturdays for beginners and weekday evenings for intermediate learners.', 'Computer proficiency, basic programming knowledge, teaching experience', '6 hours/week', '3 months', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80');
END

IF @npo2Id IS NOT NULL
BEGIN
    INSERT INTO VolunteerOpportunity (NPO_Id, RoleTitle, Category, NumOfPositions, Description, SkillsRequired, TimeCommitment, Duration, MediaURL) VALUES
    (@npo2Id, 'Tree Planting Coordinator', 'Conservation', 4, 'Lead weekend tree planting drives in various locations across the Western Cape. Coordinate volunteer groups, manage saplings, and ensure proper planting techniques.', 'Environmental knowledge, leadership skills, physically fit', 'Weekends (8am-1pm)', 'Ongoing', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'),
    (@npo2Id, 'Beach Cleanup Captain', 'Ocean Conservation', 8, 'Lead a team of volunteers during monthly beach cleanups. Responsibilities include zone assignment, waste sorting, data collection, and volunteer safety.', 'Organizational skills, environmental awareness', '1 Saturday/month (3 hours)', 'Ongoing', 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&q=80'),
    (@npo2Id, 'Urban Garden Volunteer', 'Sustainable Agriculture', 6, 'Help maintain our community gardens - planting, watering, harvesting, and distributing fresh produce to local families. No experience needed, we''ll teach you!', 'None - training provided', 'Flexible (minimum 3 hours/week)', '3 months', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80');
END

IF @npo3Id IS NOT NULL
BEGIN
    INSERT INTO VolunteerOpportunity (NPO_Id, RoleTitle, Category, NumOfPositions, Description, SkillsRequired, TimeCommitment, Duration, MediaURL) VALUES
    (@npo3Id, 'Community Health Educator', 'Health Education', 6, 'Conduct health awareness workshops in communities on topics like nutrition, hygiene, disease prevention, and mental wellness. Training provided.', 'Communication skills, compassion, basic health knowledge preferred', '8 hours/week', '6 months', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80'),
    (@npo3Id, 'Mobile Clinic Driver', 'Healthcare Logistics', 2, 'Drive our mobile clinic to rural communities across KZN. Must have valid Code 10 license and be comfortable with long-distance travel.', 'Code 10 license, clean driving record, reliable', 'Full days (3 days/week)', 'Ongoing', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80'),
    (@npo3Id, 'Mental Health Support Volunteer', 'Counseling', 4, 'Provide peer support and facilitate group therapy sessions for community members dealing with depression, anxiety, and trauma. Full training provided.', 'Empathy, active listening, confidentiality, psychology background preferred', '6 hours/week', '12 months', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80');
END

PRINT 'Seed data inserted successfully!';
PRINT 'Posts, Projects/Fundraisers, and Volunteer Opportunities created for up to 3 NPOs.';
GO


-- ============================================================
-- VERIFICATION RECORDS (for Admin to review — D400)
-- Creates Pending, Approved, and Rejected verification requests
-- so the Admin dashboard verification flow can be tested end-to-end.
-- ============================================================
USE UbuntuConnect_DB;
GO

DECLARE @vNpo1 INT, @vNpo2 INT, @vNpo3 INT;
DECLARE @adminUserId INT;

SELECT TOP 1 @vNpo1 = NPO_Id FROM NPO ORDER BY NPO_Id;
SELECT TOP 1 @vNpo2 = NPO_Id FROM NPO WHERE NPO_Id > ISNULL(@vNpo1, 0) ORDER BY NPO_Id;
SELECT TOP 1 @vNpo3 = NPO_Id FROM NPO WHERE NPO_Id > ISNULL(@vNpo2, 0) ORDER BY NPO_Id;

-- Grab an Admin user to attribute reviewed records to (nullable if none exists)
SELECT TOP 1 @adminUserId = UserId FROM Users WHERE UserType = 'Admin' ORDER BY UserId;

-- NPO 1 — PENDING (awaiting admin review)
IF @vNpo1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Verification WHERE NPO_Id = @vNpo1)
BEGIN
    INSERT INTO Verification (NPO_Id, NPOCertificate, NPOTaxCertificate, Status, SubmittedDate)
    VALUES (@vNpo1,
        'https://example.com/docs/ubuntu-hope-npo-certificate.pdf',
        'https://example.com/docs/ubuntu-hope-tax-clearance.pdf',
        'Pending', DATEADD(DAY, -3, GETDATE()));
END

-- NPO 2 — APPROVED (already reviewed) + mark its user verified
IF @vNpo2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Verification WHERE NPO_Id = @vNpo2)
BEGIN
    INSERT INTO Verification (NPO_Id, ReviewedByUserId, NPOCertificate, NPOTaxCertificate, Status, SubmittedDate, ReviewedDate)
    VALUES (@vNpo2, @adminUserId,
        'https://example.com/docs/green-earth-npo-certificate.pdf',
        'https://example.com/docs/green-earth-tax-clearance.pdf',
        'Approved', DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -7, GETDATE()));

    UPDATE Users SET IsVerified = 1
    WHERE UserId = (SELECT UserId FROM NPO WHERE NPO_Id = @vNpo2);
END

-- NPO 3 — REJECTED (reviewed, not approved)
IF @vNpo3 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Verification WHERE NPO_Id = @vNpo3)
BEGIN
    INSERT INTO Verification (NPO_Id, ReviewedByUserId, NPOCertificate, NPOTaxCertificate, Status, SubmittedDate, ReviewedDate)
    VALUES (@vNpo3, @adminUserId,
        'https://example.com/docs/thanda-health-npo-certificate.pdf',
        NULL,
        'Rejected', DATEADD(DAY, -14, GETDATE()), DATEADD(DAY, -11, GETDATE()));
END

PRINT 'Verification seed data inserted (Pending / Approved / Rejected).';
GO

-- ============================================================
-- DONATION & TRANSACTION RECORDS (for Admin CSV report — D200 / C700 / A700)
-- Simulates Individuals and Businesses donating to NPOs so that:
--   • Admin "View Transactions" has data
--   • Admin/Business donation CSV reports have rows to export
--   • NPO "Supporters > Donors" shows donors
-- Donations: SenderUserId = donor, ReceiverUserId = NPO's UserId
-- ============================================================
USE UbuntuConnect_DB;
GO

DECLARE @npoUser1 INT, @npoUser2 INT, @npoUser3 INT;
SELECT TOP 1 @npoUser1 = UserId FROM NPO ORDER BY NPO_Id;
SELECT TOP 1 @npoUser2 = UserId FROM NPO WHERE NPO_Id > (SELECT MIN(NPO_Id) FROM NPO) ORDER BY NPO_Id;
SELECT @npoUser3 = UserId FROM NPO WHERE NPO_Id = (SELECT MAX(NPO_Id) FROM NPO);

-- Collect a few donor user IDs (Individuals + Businesses)
DECLARE @donors TABLE (rn INT IDENTITY(1,1), UserId INT);
INSERT INTO @donors (UserId)
SELECT TOP 5 UserId FROM Users
WHERE UserType IN ('Individual', 'Business') AND IsActive = 1
ORDER BY UserId;

DECLARE @d1 INT, @d2 INT, @d3 INT, @d4 INT, @d5 INT;
SELECT @d1 = UserId FROM @donors WHERE rn = 1;
SELECT @d2 = UserId FROM @donors WHERE rn = 2;
SELECT @d3 = UserId FROM @donors WHERE rn = 3;
SELECT @d4 = UserId FROM @donors WHERE rn = 4;
SELECT @d5 = UserId FROM @donors WHERE rn = 5;

-- Only seed donations if we have at least one donor and one NPO, and none exist yet
IF @d1 IS NOT NULL AND @npoUser1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Transactions WHERE TransactionType = 'Donation')
BEGIN
    INSERT INTO Transactions (SenderUserId, ReceiverUserId, Amount, TransactionType, Status, Timestamp) VALUES
    (@d1, @npoUser1, 500.00,  'Donation', 'Completed', DATEADD(DAY, -1,  GETDATE())),
    (@d1, @npoUser2, 250.00,  'Donation', 'Completed', DATEADD(DAY, -3,  GETDATE())),
    (@d2, @npoUser1, 1000.00, 'Donation', 'Completed', DATEADD(DAY, -5,  GETDATE())),
    (@d2, @npoUser3, 750.00,  'Donation', 'Completed', DATEADD(DAY, -6,  GETDATE())),
    (@d3, @npoUser2, 2000.00, 'Donation', 'Completed', DATEADD(DAY, -8,  GETDATE())),
    (@d3, @npoUser1, 300.00,  'Donation', 'Completed', DATEADD(DAY, -9,  GETDATE())),
    (@d4, @npoUser3, 5000.00, 'Donation', 'Completed', DATEADD(DAY, -11, GETDATE())),
    (@d4, @npoUser2, 1500.00, 'Donation', 'Completed', DATEADD(DAY, -13, GETDATE())),
    (@d5, @npoUser1, 100.00,  'Donation', 'Completed', DATEADD(DAY, -15, GETDATE())),
    (@d5, @npoUser3, 800.00,  'Donation', 'Completed', DATEADD(DAY, -18, GETDATE()));

    -- A couple of TopUps (Individual/Business funding their wallets)
    INSERT INTO Transactions (SenderUserId, ReceiverUserId, Amount, TransactionType, Status, Timestamp) VALUES
    (NULL, @d1, 2000.00, 'TopUp', 'Completed', DATEADD(DAY, -2,  GETDATE())),
    (NULL, @d3, 5000.00, 'TopUp', 'Completed', DATEADD(DAY, -7,  GETDATE()));

    -- One failed donation (insufficient funds scenario) for realistic reporting
    INSERT INTO Transactions (SenderUserId, ReceiverUserId, Amount, TransactionType, Status, Timestamp) VALUES
    (@d5, @npoUser2, 10000.00, 'Donation', 'Failed', DATEADD(DAY, -4, GETDATE()));

    -- Campaign contributions (Business funding accepted NPO partners)
    -- These credit the NPO wallet and are withdrawable, just like donations.
    INSERT INTO Transactions (SenderUserId, ReceiverUserId, Amount, TransactionType, Status, Timestamp) VALUES
    (@d3, @npoUser1, 8000.00, 'CampaignContribution', 'Completed', DATEADD(DAY, -6, GETDATE())),
    (@d4, @npoUser2, 12000.00, 'CampaignContribution', 'Completed', DATEADD(DAY, -12, GETDATE()));

    -- An NPO withdrawal (funds paid out)
    INSERT INTO Transactions (SenderUserId, ReceiverUserId, Amount, TransactionType, Status, Timestamp) VALUES
    (@npoUser1, NULL, 1200.00, 'Withdrawal', 'Completed', DATEADD(DAY, -1, GETDATE()));
END

PRINT 'Donation / transaction seed data inserted (Donations, TopUps, Withdrawal, one Failed).';
GO
