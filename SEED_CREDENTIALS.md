# UbuntuConnect — Seed Account Credentials

These are the login credentials for every account created by `seed_data.sql`.
Passwords are stored in the database as per-user **BCrypt** hashes, so these
plaintext values log in against the live API.

> ⚠️ Test/demo data only. Do not reuse these credentials or this file in production.

Run order:

1. Apply all migrations (`database/000_run_all_migrations.sql` or 002–031 in order).
2. Run `seed_data.sql` against `UbuntuConnect_DB` (it first wipes existing rows, then inserts this slate).

All non-admin accounts have `IsEmailVerified = 1` (no email-confirmation gate)
and are therefore exempt from the ghost-account cleanup job.

## Individuals

| # | Email | Password | Notes |
|---|-------|----------|-------|
| 1 | thabo.mokoena@gmail.com | `Thabo!2026a` | KYC Approved (Admin route), fully verified |
| 2 | nomvula.dlamini@gmail.com | `Nomvula!2026b` | KYC NotSubmitted, wallet R0 |
| 3 | sipho.nkosi@outlook.com | `Sipho!2026c` | KYC Pending |
| 4 | lerato.molefe@gmail.com | `Lerato!2026d` | KYC Approved (FaceScan route) |
| 5 | ayanda.khumalo@yahoo.com | `Ayanda!2026e` | KYC NotSubmitted |
| 6 | kagiso.ndlovu@gmail.com | `Kagiso!2026f` | KYC NotSubmitted, wallet R0 |
| 7 | zinhle.maseko@outlook.com | `Zinhle!2026g` | KYC Rejected |
| 8 | tshepo.radebe@gmail.com | `Tshepo!2026h` | KYC NotSubmitted |
| 9 | fatima.patel@gmail.com | `Fatima!2026i` | KYC NotSubmitted |
| 10 | jordan.williams@gmail.com | `Jordan!2026j` | KYC NotSubmitted, wallet R0 |

## NPOs

| # | Email | Password | Notes |
|---|-------|----------|-------|
| 11 | admin@hopebright.org.za | `Hope!Bright26` | Verification Approved |
| 12 | info@greenfuturesa.org | `Green!Future26` | Verification Approved |
| 13 | contact@youthrise.co.za | `Youth!Rise26` | Verification Pending, wallet R0 |
| 14 | hello@thandahealth.org.za | `Thanda!Health26` | Verification Approved |
| 15 | team@sheleads.org.za | `SheLeads!26` | Verification Pending |
| 16 | info@feedthenation.org.za | `FeedNation!26` | Verification Approved |
| 17 | admin@brightpaws.org.za | `BrightPaws!26` | Verification Rejected |
| 18 | contact@codingkids.org.za | `CodingKids!26` | Verification Approved |
| 19 | info@safewaters.org.za | `SafeWaters!26` | Verification Pending, wallet R0 |
| 20 | hello@elderscare.org.za | `EldersCare!26` | Verification Approved |

## Businesses

| # | Email | Password | Notes |
|---|-------|----------|-------|
| 21 | csr@ubuntucorp.co.za | `Ubuntu!Corp26` | Has active campaign + funding sent |
| 22 | partnerships@rainbowtech.io | `Rainbow!Tech26` | Has active campaign + funding sent |
| 23 | impact@kalaharibank.co.za | `Kalahari!26` | Campaign with no per-partner budget |
| 24 | giving@capefresh.co.za | `CapeFresh!26` | Food-security campaign |
| 25 | csr@summitmining.co.za | `Summit!Mining26` | Large wallet balance |
| 26 | social@brightretail.co.za | `BrightRetail!26` | Wallet R0 |
| 27 | foundation@novapharma.co.za | `NovaPharma!26` | Health campaign + funding sent |
| 28 | csr@azanialogistics.co.za | `Azania!Log26` | — |
| 29 | impact@solarafrica.co.za | `Solar!Africa26` | — |
| 30 | giving@tabletopfoods.co.za | `TableTop!26` | Wallet R0 |

## Admin

| # | Email | Password | Notes |
|---|-------|----------|-------|
| 31 | admin@ubuntuconnect.co.za | `Hope!Bright26` | Platform admin (shares hash with #11 for convenience) |
