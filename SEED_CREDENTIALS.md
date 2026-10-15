# UbuntuConnect — Seed Account Credentials

These are the login credentials for every account created by `seed_data.sql`.
Passwords are stored in the database as per-user **BCrypt** hashes, so these
plaintext values log in against the live API.

> ⚠️ Test/demo data only. Do not reuse these credentials or this file in production.

Run order:

1. Apply the schema (`MASTER_SCRIPT.sql`, or `database/000_run_all_migrations.sql`).
2. (Optional, to reset) run `delete_seed_data.sql` for a clean slate.
3. Run `seed_data.sql` against `UbuntuConnect_DB`.

All non-admin accounts have `IsEmailVerified = 1` (no email-confirmation gate)
and are therefore exempt from the ghost-account cleanup job.

## Consistency rules this seed obeys

The app's verification gate blocks donate / top-up / withdraw / volunteer-apply /
campaign-apply unless a user is **active + email-verified + identity/org-verified**
(`IsVerified = 1`). The seed is built so there are **no contradictions**:

- A user has a **wallet balance > R0 only if verified**. Every unverified user is R0.00.
- Every transaction (top-up, donation, campaign contribution, withdrawal) involves
  **only verified users**, and each verified wallet balance **exactly equals** its
  completed money-in minus money-out.
- **Volunteer applications** come only from verified individuals, to opportunities
  owned by verified NPOs. Logged hours exist only against accepted/completed apps.
- **Fundraisers, funding requests, volunteer opportunities, campaigns, and impact
  tracks** belong only to verified NPOs/Businesses.
- **Campaign applications** come only from verified NPOs to verified Businesses'
  campaigns; accepted ones with a budget have a matching contribution transaction.

## Individuals

Verified = KYC Approved (`IsVerified = 1`, can transact). Unverified = cannot
donate/top-up/volunteer and has a R0 wallet.

| # | Email | Password | Verified | KYC status | Wallet | Notes |
|---|-------|----------|----------|------------|--------|-------|
| 1 | thabo.mokoena@gmail.com | `Thabo!2026a` | ✅ Yes | Approved (Admin) | R1,400.00 | Topped up R2,000; donated R300+R300. Accepted volunteer (tutor) with logged hours. |
| 2 | nomvula.dlamini@gmail.com | `Nomvula!2026b` | ✅ Yes | Approved (Admin) | R500.00 | Topped up R500. Completed volunteer (admin/fundraising) with logged hours. |
| 3 | sipho.nkosi@outlook.com | `Sipho!2026c` | ✅ Yes | Approved (FaceScan) | R4,300.00 | Topped up R5,000; donated R200+R500. Accepted volunteer (tree planting). |
| 4 | lerato.molefe@gmail.com | `Lerato!2026d` | ✅ Yes | Approved (FaceScan) | R1,200.00 | Topped up R1,200; one **failed** donation (no funds moved). Pending volunteer app. |
| 5 | ayanda.khumalo@yahoo.com | `Ayanda!2026e` | ❌ No | NotSubmitted | R0.00 | Cannot transact until verified. |
| 6 | kagiso.ndlovu@gmail.com | `Kagiso!2026f` | ❌ No | Pending | R0.00 | KYC submitted, awaiting review. |
| 7 | zinhle.maseko@outlook.com | `Zinhle!2026g` | ❌ No | Rejected | R0.00 | KYC rejected. |
| 8 | tshepo.radebe@gmail.com | `Tshepo!2026h` | ❌ No | NotSubmitted | R0.00 | — |
| 9 | fatima.patel@gmail.com | `Fatima!2026i` | ❌ No | NotSubmitted | R0.00 | — |
| 10 | jordan.williams@gmail.com | `Jordan!2026j` | ❌ No | NotSubmitted | R0.00 | — |

## NPOs

Verified = Verification Approved (`IsVerified = 1`). Only verified NPOs have
fundraisers / opportunities / impact tracks and can receive funds + withdraw.

| # | Email | Password | Verified | Verification | Wallet | Notes |
|---|-------|----------|----------|--------------|--------|-------|
| 11 | admin@hopebright.org.za | `Hope!Bright26` | ✅ Yes | Approved | R79,600.00 | Fundraisers + opportunities. Received donations + R80k campaign; withdrew R1,200. |
| 12 | info@greenfuturesa.org | `Green!Future26` | ✅ Yes | Approved | R500.00 | Fundraisers + opportunities. Received R300+R200 donations. |
| 13 | contact@youthrise.co.za | `Youth!Rise26` | ✅ Yes | Approved | R0.00 | Fundraiser + opportunity; no funds received yet. |
| 14 | hello@thandahealth.org.za | `Thanda!Health26` | ✅ Yes | Approved | R120,000.00 | Received R120k campaign contribution (Summit Mining). |
| 15 | team@sheleads.org.za | `SheLeads!26` | ✅ Yes | Approved | R0.00 | Fundraiser + opportunity; no funds received yet. |
| 16 | info@feedthenation.org.za | `FeedNation!26` | ✅ Yes | Approved | R45,000.00 | Received R45k campaign contribution (CapeFresh). |
| 17 | admin@brightpaws.org.za | `BrightPaws!26` | ❌ No | Pending | R0.00 | Awaiting document review; cannot create fundraisers yet. |
| 18 | contact@codingkids.org.za | `CodingKids!26` | ❌ No | Pending | R0.00 | Awaiting document review. |
| 19 | info@safewaters.org.za | `SafeWaters!26` | ❌ No | Rejected | R0.00 | Verification rejected. |
| 20 | hello@elderscare.org.za | `EldersCare!26` | ❌ No | Pending | R0.00 | Documents not yet submitted / under review. |

## Businesses

Verified = Verification Approved (`IsVerified = 1`). Only verified businesses
have campaigns and can top up / fund partners.

| # | Email | Password | Verified | Wallet | Notes |
|---|-------|----------|----------|--------|-------|
| 21 | csr@ubuntucorp.co.za | `Ubuntu!Corp26` | ✅ Yes | R100,000.00 | Topped up R180k; paid R80k to HopeBright (accepted campaign). |
| 22 | partnerships@rainbowtech.io | `Rainbow!Tech26` | ✅ Yes | R95,000.00 | Topped up R95k; campaign live, application still pending. |
| 23 | impact@kalaharibank.co.za | `Kalahari!26` | ✅ Yes | R240,000.00 | Topped up R240k; campaign with no per-partner budget. |
| 24 | giving@capefresh.co.za | `CapeFresh!26` | ✅ Yes | R55,000.00 | Topped up R100k; paid R45k to Feed The Nation (accepted campaign). |
| 25 | csr@summitmining.co.za | `Summit!Mining26` | ✅ Yes | R190,000.00 | Topped up R310k; paid R120k to Thanda Health (accepted campaign). |
| 26 | social@brightretail.co.za | `BrightRetail!26` | ❌ No | R0.00 | Not verified; no campaigns, cannot fund. |
| 27 | foundation@novapharma.co.za | `NovaPharma!26` | ❌ No | R0.00 | Not verified. |
| 28 | csr@azanialogistics.co.za | `Azania!Log26` | ❌ No | R0.00 | Not verified. |
| 29 | impact@solarafrica.co.za | `Solar!Africa26` | ❌ No | R0.00 | Not verified. |
| 30 | giving@tabletopfoods.co.za | `TableTop!26` | ❌ No | R0.00 | Not verified. |

## Admin

| # | Email | Password | Notes |
|---|-------|----------|-------|
| 31 | admin@ubuntuconnect.co.za | `Hope!Bright26` | Platform admin (shares hash with #11 for convenience). Reviewed the approved verifications/KYC above. |
