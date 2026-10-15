# UbuntuConnect

> A social impact platform connecting individuals, NPOs, businesses, and communities to create measurable positive change.

[![.NET 9](https://img.shields.io/badge/.NET-9.0-purple)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-cyan)](https://tailwindcss.com/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-red)](https://www.microsoft.com/en-us/sql-server)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Vision & Mission](#vision--mission)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [User Roles & Use Cases](#user-roles--use-cases)
- [API Architecture](#api-architecture)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [Frontend Architecture](#frontend-architecture)
- [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## Overview

UbuntuConnect is a community-driven collaboration platform that enables:

- **NPOs** to manage their presence, create posts (with images), run **timed fundraisers** (with auto-close), manage volunteers, upload verification documents (PDF), and expose a **Facebook-style public profile**
- **Individuals** to discover NPOs, complete **KYC identity verification** (admin review or self-service face scan), donate, volunteer, follow organizations, and track their social impact
- **Businesses** to create CSR partnership campaigns, view NPO documents, donate via a **simulated card gateway**, and generate reports with charts
- **Admins** to manage users, review NPO & individual KYC verifications, moderate reported posts, run account cleanup, and monitor platform-wide transactions with reports

> **Status:** The 26-task improvements plan (`.kiro/spec/improvement/improvements.md`) is complete — backend build clean, **149 xUnit tests passing**, frontend build clean. See the addenda in `docs/07_API_CONTRACT.md` and `docs/03_FUNCTIONAL_REQUIREMENTS.md`.

---

## Vision & Mission

**Vision:** To become the leading digital ecosystem that empowers communities by connecting people, organizations, and businesses through meaningful collaboration and sustainable social development.

**Mission:** UbuntuConnect enables individuals, NPOs, and businesses to discover opportunities to create positive social impact through technology. The platform simplifies communication, fundraising, volunteering, and collaboration by providing a centralized platform where every participant contributes toward improving communities.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + TypeScript | 18.3 |
| **UI Framework** | Tailwind CSS + shadcn/ui | 4.1 |
| **Build Tool** | Vite | 6.3 |
| **Animations** | Motion (Framer Motion) | 12.x |
| **Backend** | ASP.NET Core Web API | .NET 9 |
| **ORM** | Entity Framework Core | 9.x |
| **Database** | Microsoft SQL Server | 2022 |
| **Authentication** | JWT (JSON Web Tokens) | — |
| **API Docs** | Swagger / OpenAPI | — |
| **Routing** | React Router v7 | 7.13 |
| **Charts** | Recharts | 2.15 |
| **Image processing** | SixLabors.ImageSharp | 3.1.12 |
| **Face matching** | FaceONNX (local, config-gated) | 4.1 |
| **Backend tests** | xUnit + EF Core InMemory | — |

---

## Project Structure

```
UbuntuConnect/
├── backend/                           # .NET 9 Web API
│   └── UbuntuConnectAPI/
│       ├── Controllers/               # 19 API Controllers
│       │   ├── AuthController.cs      # Register + Login + email verification (JWT)
│       │   ├── NPOController.cs       # NPO profile, follow, donors, fundraiser donations, public profile
│       │   ├── IndividualController.cs # Discover, follow, donate, volunteer, impact, KYC
│       │   ├── BusinessController.cs   # Profile, follow, donate, campaigns, impact
│       │   ├── AdminController.cs      # User mgmt, verifications, stats, ghost cleanup
│       │   ├── AdminKycController.cs   # Individual KYC review (approve/reject)
│       │   ├── CampaignController.cs   # CRUD for partnership campaigns
│       │   ├── CampaignApplicationController.cs # NPO applies (reason required), Business approves/rejects
│       │   ├── PostController.cs       # CRUD posts + likes
│       │   ├── PostReportController.cs # Report posts + admin moderation
│       │   ├── CommentController.cs    # Comments on posts
│       │   ├── ProjectController.cs    # Fundraiser/project CRUD (with timing)
│       │   ├── UploadController.cs     # Image + PDF document uploads
│       │   ├── NotificationController.cs # In-app notifications
│       │   ├── VolunteerOpportunityController.cs # NPO creates opportunities
│       │   ├── VolunteerApplicationController.cs # Apply, accept/reject (+email), log hours
│       │   ├── VerificationController.cs # NPO submits + business/admin views docs
│       │   ├── WalletController.cs     # View balance
│       │   ├── TransactionController.cs # History + withdrawals (limits) + wallet-limits
│       │   ├── ReportController.cs     # NPO/Business/Admin summaries + CSV export
│       │   └── FeedController.cs       # Community feed
│       ├── Services/                   # Config-swappable seams
│       │   ├── Email/                 # Mock email + verification tokens
│       │   ├── Storage/               # Local file storage (image/PDF)
│       │   ├── Notifications/         # In-app notification service
│       │   ├── Verification/          # Transaction verification gate
│       │   ├── FaceVerification/      # FaceONNX engine + NoOp fallback
│       │   ├── Payments/              # Simulated card gateway + wallet limits
│       │   ├── Cleanup/               # Ghost-account cleanup job
│       │   ├── Fundraisers/           # Fundraiser auto-close job
│       │   └── Admin/                 # Secure admin seeding
│       ├── Validation/                # Shared validators + attributes
│       ├── Data/AppDbContext.cs        # EF Core DbContext
│       ├── DTOs/Requests/             # Request DTOs
│       ├── Models/                    # Entity Models
│       ├── Filters/                   # Swagger auth filter
│       ├── Program.cs                 # App entry (JWT, CORS, Swagger, DI, background services)
│       ├── appsettings.json           # Config template
│       └── appsettings.Development.json # Local dev config
├── backend/UbuntuConnectAPI.Tests/    # xUnit test suite (149 tests, EF Core InMemory)
├── frontend/                           # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── NPODashboard.tsx           # Full NPO dashboard
│   │   │   │   ├── IndividualDashboard.tsx    # Full Individual dashboard
│   │   │   │   ├── BusinessDashboard.tsx      # Full Business dashboard
│   │   │   │   ├── AdminDashboard.tsx         # Full Admin dashboard
│   │   │   │   ├── Fundraisers.tsx            # Browse & donate to projects (with deadlines)
│   │   │   │   ├── NpoProfile.tsx             # Facebook-style public NPO profile
│   │   │   │   ├── DiscoverNpos.tsx           # Browse/search NPOs
│   │   │   │   ├── VerifyEmail.tsx / VerifyIdentity.tsx # KYC + email verification
│   │   │   │   ├── WebcamCapture.tsx          # Selfie capture for face-scan KYC
│   │   │   │   ├── ImageUploadField.tsx / DocumentUploadField.tsx # Uploads
│   │   │   │   ├── CardPaymentFields.tsx      # Simulated card entry (Luhn/expiry)
│   │   │   │   ├── NotificationBell.tsx       # In-app notifications
│   │   │   │   ├── ReportPostButton.tsx       # Report a post
│   │   │   │   ├── reports/                   # NPO/Business/Admin report panels (recharts)
│   │   │   │   ├── registration/              # Structured registration inputs
│   │   │   │   ├── Landing.tsx                # Public landing page
│   │   │   │   ├── Login.tsx / Register.tsx   # Auth pages
│   │   │   │   ├── ProtectedRoute.tsx         # Role-based route guard
│   │   │   │   └── ui/                        # shadcn/ui components (40+)
│   │   │   └── routes.tsx                     # All routes with role protection
│   │   ├── context/AuthContext.tsx             # JWT auth state management
│   │   ├── services/                           # Thin axios wrappers per domain
│   │   │   ├── npoService.ts / individualService.ts / businessService.ts / adminService.ts
│   │   │   ├── authService.ts / kycService.ts / uploadService.ts
│   │   │   ├── notificationService.ts / moderationService.ts
│   │   │   ├── npoProfileService.ts / reportService.ts
│   │   ├── lib/api.ts                         # Axios client + interceptors + resolveMediaUrl
│   │   ├── lib/validators.ts                  # Client validation (mirrors backend)
│   │   └── styles/                            # Tailwind + theme
│   ├── package.json
│   └── vite.config.ts
├── database/                           # SQL Server migrations
│   ├── migrations/                    # Sequential migrations (002–035)
│   └── 000_run_all_migrations.sql     # Consolidated runner (kept in sync with MASTER_SCRIPT.sql)
├── MASTER_SCRIPT.sql                   # One-shot: builds the entire DB schema (all tables, idempotent)
├── seed_withpictures.sql               # Consistent demo seed WITH images (31 users) — recommended
├── seed_data.sql                       # Same consistent demo seed, images NULL (clean slate)
├── delete_seed_data.sql                # Wipes all data + resets identity counters (run before re-seeding)
├── SEED_CREDENTIALS.md                 # Email + password + verification state for every seeded account
├── backend/UbuntuConnectAPI/uploads/   # Committed demo images (served at /uploads/...)
├── docs/                               # Full project documentation
│   ├── 00_PROJECT_CHARTER.md
│   ├── 01_PROJECT_OVERVIEW.md
│   ├── 01_BUSINESS_DOMAIN.md
│   ├── 02_SYSTEM_CONTEXT.md
│   ├── 03_FUNCTIONAL_REQUIREMENTS.md
│   ├── 04_NON_FUNCTIONAL_REQUIREMENTS.md
│   ├── 05_PROJECT_ARCHITECTURE.md
│   ├── 06_DATABASE_ARCHITECTURE.md
│   ├── 07_API_CONTRACT.md
│   ├── 08_BACKEND_ARCHITECTURE.md
│   ├── 09_FRONTEND_ARCHITECTURE.md
│   ├── 10_UI_UX_SPECIFICATION.md
│   └── 11_TESTING_STRATEGY.md
└── .gitignore
```

---

## Getting Started

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0) — ships with Visual Studio 2022 (17.12+). Visual Studio 2026 is **not** required.
- [Node.js 18+](https://nodejs.org/) (uses `npm` — no extra package manager needed)
- [SQL Server 2022](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (LocalDB or full)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/TukeloLetsebe/UbuntuConnect.git
cd UbuntuConnect
git checkout v6
```

### 2. Database Setup

```bash
# 1. Build the full schema in one shot (creates UbuntuConnect_DB + every table).
#    Idempotent — safe to re-run; existing objects are skipped.
sqlcmd -S localhost -E -C -i MASTER_SCRIPT.sql

# 2. Load the demo seed data (31 users + supporting rows).
#    Choose ONE of the two seed files:
#
#    a) WITH demo pictures (recommended) — profile/banner/post/fundraiser images
#       that reference the committed files under
#       backend/UbuntuConnectAPI/uploads/images/. Use this to see a populated,
#       image-rich demo on a fresh clone:
sqlcmd -S localhost -E -C -i seed_withpictures.sql

#    b) Clean, image-free slate (fallback if images ever misbehave):
# sqlcmd -S localhost -E -C -i seed_data.sql

# To RESET demo data later, wipe first, then re-seed with whichever file:
# sqlcmd -S localhost -E -C -i delete_seed_data.sql
# sqlcmd -S localhost -E -C -i seed_withpictures.sql
```

> **Two seed files, same consistent data:**
> - `seed_withpictures.sql` — identical data **plus** real demo images wired in.
> - `seed_data.sql` — the same data with all images left `NULL` (clean slate).
>
> Both are **internally consistent**: only verified users hold a wallet balance or
> have transactions/applications, and every wallet balance reconciles to its
> completed transactions (see `SEED_CREDENTIALS.md` for the full account list and
> verification states).
>
> Neither seed wipes on its own — run `delete_seed_data.sql` first for a clean
> slate. `MASTER_SCRIPT.sql` is the canonical schema; `database/000_run_all_migrations.sql`
> is an equivalent consolidated runner, and `database/migrations/` holds the
> incremental history.
>
> **Images:** the demo image files live in `backend/UbuntuConnectAPI/uploads/` and
> are committed to the repo, so they travel with a clone/zip. For images to appear
> you must run `seed_withpictures.sql` (which points the records at those files).

### 3. Backend Setup

```bash
cd backend/UbuntuConnectAPI
dotnet restore
dotnet run
```

The API will be available at **http://localhost:5275** with Swagger UI at `/swagger`.

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**.

### 5. Default Test Accounts (after seeding)

The full list of every seeded account (email + password + verification state) is in
**[`SEED_CREDENTIALS.md`](SEED_CREDENTIALS.md)**. A few to get started:

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@ubuntuconnect.co.za | `Hope!Bright26` | Platform admin |
| Individual (verified) | thabo.mokoena@gmail.com | `Thabo!2026a` | KYC approved — can donate/volunteer |
| NPO (verified) | admin@hopebright.org.za | `Hope!Bright26` | Verified — fundraisers, has images |
| Business (verified) | csr@ubuntucorp.co.za | `Ubuntu!Corp26` | Verified — runs campaigns |

> Unverified demo accounts (e.g. individuals 5–10, NPOs 17–20, businesses 26–30)
> intentionally cannot transact and have a R0 wallet — this demonstrates the
> verification gate. See `SEED_CREDENTIALS.md` for which accounts are verified.

---

## User Roles & Use Cases

### 🟠 NPO (B-codes)

| Code | Use Case | Description |
|------|----------|-------------|
| B200 | Create Post | Share updates with community |
| B300 | Update Post | Edit existing posts |
| B1100 | Delete Post | Remove posts |
| B1200 | Manage Post | Full post lifecycle management |
| B400 | View Wallet Balance | Check current balance |
| B500 | View Transaction History | See all transactions |
| B1000 | Withdraw Funds | Withdraw from wallet |
| B600 | Manage Volunteer Opportunity | Create/edit/delete opportunities |
| B700 | View Volunteer Application | See who applied |
| B800 | Accept Volunteer Application | Accept a volunteer |
| B900 | Reject Volunteer Application | Reject a volunteer |
| B1900 | Delete Volunteer Application | Remove application |
| B1400 | Manage Volunteer Applications | Full application management |
| B2000 | Verify Profile | Submit verification documents |

**Additional Features:**
- Create/manage fundraiser projects
- View supporters (followers + donors)
- Discover and follow other NPOs
- Browse and apply to Business partnership campaigns
- View community feed

---

### 🔵 Individual (A-codes)

| Code | Use Case | Description |
|------|----------|-------------|
| A100 | Create Profile | Register as Individual |
| A200 | Update User | Edit profile info |
| A300 | Search NPO | Discover and browse NPOs |
| A500 | Like Post | Like community posts |
| A600 | Donate to NPO | Direct donation to NPOs |
| A700 | View Donation History | Track past donations |
| A800 | Follow NPO | Follow organizations |
| A900 | Apply to be Volunteer | Apply to opportunities |
| A1000 | View Volunteer Application | Check application status |
| A1300 | Manage Volunteer Application | View/cancel applications |
| A1100 | Cancel Volunteer Application | Withdraw application |
| A1900 | View Post | Read community posts |
| A2000 | View Profile | See own profile |
| A2100 | Manage Profile | Update profile + password |
| A2200 | Delete Profile | Deactivate account |

**Additional Features:**
- Top-up wallet
- Donate to NPO fundraiser projects
- View personal social impact stats
- Community updates feed

---

### 🟢 Business (C-codes)

| Code | Use Case | Description |
|------|----------|-------------|
| C100 | Create Campaign | Create partnership campaign for NPOs |
| C200 | Track Donations | View donation history |
| C700 | Generate Report | Export donation CSV report |
| C800 | Manage Campaign | Edit/delete campaigns |
| C1100 | Update Campaign | Modify campaign details |
| C1300 | Manage Campaign Application | Approve/reject NPO applications |
| C1800 | View Community Updates | Browse NPO posts + like |

**Additional Features:**
- Discover and follow NPOs
- Donate to NPOs directly
- Donate to fundraiser projects
- Wallet management (top-up)
- CSR impact tracking

---

### 🟣 Admin (D-codes)

| Code | Use Case | Description |
|------|----------|-------------|
| D100 | Manage Users | List, search, activate/deactivate users |
| D200 | View Transactions | Platform-wide transaction monitoring |
| D400 | Manage Verifications | Approve/reject NPO verification requests |
| D500 | Manage Profiles | User management (activate/deactivate) |

**Additional Features:**
- Platform statistics dashboard (users, donations, campaigns)
- Filter users by type (Individual/NPO/Business/Admin)
- Filter verifications by status (Pending/Approved/Rejected)

---

## API Architecture

### Base URL
```
http://localhost:5275/api
```

### Authentication
All protected endpoints require a Bearer token:
```
Authorization: Bearer <jwt_token>
```

### Key Endpoints

| Controller | Route | Methods |
|-----------|-------|---------|
| Auth | `/api/Auth` | POST register, POST login, POST verify-email, POST resend-verification |
| NPO | `/api/npo` | GET, GET/{id}, GET/{id}/public, PUT, POST follow/unfollow/donate |
| Individual | `/api/individual` | GET me, PUT me, POST follow/donate/volunteer/topup, POST/GET verify-identity |
| Business | `/api/business` | GET me, POST follow/donate/topup, GET my-campaigns/impact |
| Admin | `/api/admin` | GET stats/users/verifications/transactions, PUT activate/deactivate/approve/reject, ghost-cleanup preview/run |
| Admin KYC | `/api/admin/kyc` | GET, PUT {id}/approve, PUT {id}/reject |
| Campaigns | `/api/campaigns` | GET, GET/{id}, POST, PUT/{id}, DELETE/{id} |
| Campaign Apps | `/api/campaignapplications` | POST apply (reason required), GET campaign/{id}, PUT approve/reject |
| Posts | `/api/post` | GET, POST, PUT, DELETE, POST like, DELETE unlike |
| Post Reports | `/api/postreport` | POST post/{id}, GET, PUT dismiss/remove-post |
| Comments | `/api/comment` | GET post/{id}, POST, DELETE |
| Projects | `/api/project` | GET, GET/{id}, POST, PUT, DELETE (with startDate/endDate/durationDays) |
| Uploads | `/api/upload` | POST image, POST document |
| Notifications | `/api/notification` | GET, GET unread-count, PUT {id}/read, PUT read-all |
| Volunteer Opp | `/api/VolunteerOpportunity` | GET, POST, PUT, DELETE |
| Volunteer App | `/api/VolunteerApplication` | GET, PUT accept/reject (+email), DELETE, POST log-hours |
| Verification | `/api/verification` | POST submit, GET my-status, GET npo/{npoId} |
| Wallet | `/api/wallet` | GET user/{id}/balance |
| Transactions | `/api/transaction` | GET user/{id}, POST withdraw (limits), GET wallet-limits |
| Reports | `/api/reports` | GET donations, GET donations/csv, GET my-donations/csv, GET npo/business/admin-summary |

### Swagger UI
Available at `http://localhost:5275/swagger` in development mode.

---

## Database Schema

**Core tables** plus improvement tables (migrations 025–030):

| Table | Purpose |
|-------|---------|
| Users | All user accounts (email, type, status) |
| Individual | Individual-specific fields (name, cause) |
| NPO | NPO-specific fields (reg number, focus area, mission) |
| Business | Business-specific fields (industry, CSR goal) |
| Profile | User display profile (name, bio, avatar) |
| Wallet | User wallet (balance) |
| Transactions | All financial transactions |
| Post | Community posts |
| PostLike | Post likes (unique per user) |
| Comment | Comments on posts |
| Follow | User follows NPO |
| Project | NPO fundraiser projects |
| VolunteerOpportunity | NPO volunteer opportunities |
| VolunteerApplication | Volunteer applications |
| VolunteerLog | Logged volunteer hours |
| PartnershipCampaign | Business CSR campaigns |
| CampaignApplication | NPO applies to campaign |
| Verification | NPO verification documents |
| FundingRequest | Legacy funding requests |
| ImpactTrack | Impact metrics |
| EmailVerificationTokens | Email verification / password-reset tokens (migration 025) |
| Notifications | In-app notifications (migration 026) |
| PostReports | Reported posts for moderation (migration 028) |

**Improvement schema changes:**
- `Users.IsEmailVerified` — Stage-1 email verification flag (migration 027)
- `Individual` KYC columns — `IdNumber`, `IdDocumentUrl`, `SelfieUrl`, `KycStatus`, `KycRoute`, `KycMatchScore`, review fields (migration 029)
- `Projects.StartDate` / `Projects.EndDate` — timed fundraisers (migration 030)

---

## Authentication & Authorization

- **JWT tokens** issued on login (expires in 24h by default)
- **Role-based access control** via `[Authorize(Roles = "...")]`
- **Frontend route guards** via `ProtectedRoute` component
- **Automatic logout** on 401 response (token expired)
- **Password hashing** via BCrypt

### Roles
| Role | Access Level |
|------|-------------|
| Individual | Own profile, discover NPOs, donate, volunteer (after email + KYC verification) |
| NPO | Own dashboard, posts, projects, volunteers, public profile |
| Business | Own dashboard, campaigns, donations, NPO docs, community |
| Admin | Full platform management + KYC + moderation |

### Two-stage verification
- **Stage 1 — email** (`User.IsEmailVerified`): confirmed via `POST api/Auth/verify-email`.
- **Stage 2 — identity/KYC** (`User.IsVerified`): individuals submit ID + selfie (admin review or self-service face scan); NPOs submit documents for admin approval.
- The **verification gate** blocks money-out / volunteer actions until both stages pass; contact details on public profiles are hidden from unverified viewers.

---

## Configuration

Feature seams are configured via `appsettings.json` and are **config-swappable / config-gated** (most default OFF for a light local run):

| Section | Purpose | Default |
|---------|---------|---------|
| `Email` | Email provider (Mock in dev; SMTP-ready) + frontend base URL | Mock |
| `FileStorage` | Local upload storage (images re-encoded, PDFs validated) | Local |
| `AdminSeed` | Secure startup admin seeding (creds via env/user-secrets) | Disabled |
| `GhostCleanup` | Periodic cleanup of never-verified accounts | Disabled + DryRun |
| `FaceVerification` | Local FaceONNX face-match engine (else admin fallback) | Disabled |
| `FundraiserAutoClose` | Background job closing expired/funded fundraisers | Enabled (hourly) |
| `WalletLimits` | Top-up / withdrawal min-max + rolling-24h withdrawal cap | On |

---

## Frontend Architecture

- **Single Page Application** with React Router v7
- **Role-based routing** — login redirects to correct dashboard
- **Service layer pattern** — each role has its own API service module
- **Optimistic UI updates** — likes, follows update instantly
- **JWT interceptor** — auto-attaches token to all API calls
- **Toast notifications** — success/error feedback via Sonner
- **Responsive design** — sidebar + main content layout
- **shadcn/ui components** — consistent design system (40+ components)

---

## Testing

### Build Verification
```bash
cd frontend
npm install
npm run build    # Must pass with zero errors
```

### Backend Verification
```bash
cd backend/UbuntuConnectAPI
dotnet build  # Must compile without errors
dotnet run    # Then test via Swagger UI
```

### Backend Unit Tests (xUnit + EF Core InMemory)
```bash
cd backend/UbuntuConnectAPI.Tests
dotnet test   # 149 tests — must be green
```

Covers validation, email verification, admin seeding, ghost cleanup, post reporting,
verification gate, KYC submission + admin review, FaceONNX engine load, project donations,
fundraiser auto-close, payment simulation + wallet limits, volunteer accept/reject,
public NPO profile contact-gating, partnership apply, and report summaries.

### Manual Testing Flow
1. Register accounts for each role → verify email (link is logged by the mock email service)
2. Individual: submit KYC (admin review or face scan); once verified, donate / volunteer / top up
3. NPO: create posts (with images), timed fundraisers, volunteer opportunities; upload verification PDFs; view public profile
4. Individual/Business: discover NPOs, follow, donate to fundraisers (watch auto-close on target), report a post
5. Business: create campaigns, view NPO documents, top up via simulated card, generate report charts/CSV
6. Admin: view stats + reports, manage users, approve/reject NPO & individual KYC, moderate reported posts, run ghost cleanup

---

## Documentation

Full project documentation is available in the `/docs` folder:

| Document | Description |
|----------|-------------|
| `00_PROJECT_CHARTER.md` | Engineering principles & standards |
| `01_PROJECT_OVERVIEW.md` | Vision, mission, objectives |
| `01_BUSINESS_DOMAIN.md` | Business domain analysis |
| `02_SYSTEM_CONTEXT.md` | System context diagram |
| `03_FUNCTIONAL_REQUIREMENTS.md` | All functional requirements + delivered improvements (Tasks 1–26) |
| `04_NON_FUNCTIONAL_REQUIREMENTS.md` | Performance, security, scalability |
| `05_PROJECT_ARCHITECTURE.md` | System architecture design |
| `06_DATABASE_ARCHITECTURE.md` | Database design & ERD |
| `07_API_CONTRACT.md` | Full API specification + improvements addendum (new endpoints) |
| `08_BACKEND_ARCHITECTURE.md` | Backend patterns & structure |
| `09_FRONTEND_ARCHITECTURE.md` | Frontend patterns & structure |
| `10_UI_UX_SPECIFICATION.md` | UI/UX design specification |
| `11_TESTING_STRATEGY.md` | Testing approach |

---

## Contributing

1. Create a feature branch from `v6`
2. Follow existing code patterns (service layer, controller structure)
3. Ensure `npm run build` passes before pushing
4. Create a pull request with clear description

### Branch Naming
```
feature/<description>
fix/<description>
```

---

## License

This project is developed for academic purposes as part of a university assignment.

---

*Built with Ubuntu spirit — "I am because we are."*
