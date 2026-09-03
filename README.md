# UbuntuConnect

> A social impact platform connecting individuals, NPOs, businesses, and communities to create measurable positive change.

[![.NET 10](https://img.shields.io/badge/.NET-10.0-purple)](https://dotnet.microsoft.com/)
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

- **NPOs** to manage their presence, create posts, run fundraisers, manage volunteers, and get verified
- **Individuals** to discover NPOs, donate, volunteer, follow organizations, and track their social impact
- **Businesses** to create CSR partnership campaigns, track donations, and generate impact reports
- **Admins** to manage users, verify NPOs, and monitor platform-wide transactions

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
| **Backend** | ASP.NET Core Web API | .NET 10 |
| **ORM** | Entity Framework Core | 10.x |
| **Database** | Microsoft SQL Server | 2022 |
| **Authentication** | JWT (JSON Web Tokens) | — |
| **API Docs** | Swagger / OpenAPI | — |
| **Routing** | React Router v7 | 7.13 |

---

## Project Structure

```
UbuntuConnect/
├── backend/                           # .NET 10 Web API
│   └── UbuntuConnectAPI/
│       ├── Controllers/               # 17 API Controllers
│       │   ├── AuthController.cs      # Register + Login (JWT)
│       │   ├── NPOController.cs       # NPO profile, follow, donors, fundraiser donations
│       │   ├── IndividualController.cs # Discover, follow, donate, volunteer, impact
│       │   ├── BusinessController.cs   # Profile, follow, donate, campaigns, impact
│       │   ├── AdminController.cs      # User mgmt, verifications, stats, transactions
│       │   ├── CampaignController.cs   # CRUD for partnership campaigns
│       │   ├── CampaignApplicationController.cs # NPO applies, Business approves/rejects
│       │   ├── PostController.cs       # CRUD posts + likes
│       │   ├── CommentController.cs    # Comments on posts
│       │   ├── ProjectController.cs    # Fundraiser/project CRUD
│       │   ├── VolunteerOpportunityController.cs # NPO creates opportunities
│       │   ├── VolunteerApplicationController.cs # Apply, accept, reject, log hours
│       │   ├── VerificationController.cs # NPO submits verification docs
│       │   ├── WalletController.cs     # View balance
│       │   ├── TransactionController.cs # Transaction history + withdrawals
│       │   ├── ReportController.cs     # Donation reports + CSV export
│       │   └── FeedController.cs       # Community feed
│       ├── Data/AppDbContext.cs        # EF Core DbContext (20 entities)
│       ├── DTOs/Requests/             # 18 Request DTOs
│       ├── Models/                    # 20 Entity Models
│       ├── Filters/                   # Swagger auth filter
│       ├── Program.cs                 # App entry (JWT, CORS, Swagger)
│       ├── appsettings.json           # Config template
│       └── appsettings.Development.json # Local dev config
├── frontend/                           # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── NPODashboard.tsx           # Full NPO dashboard
│   │   │   │   ├── IndividualDashboard.tsx    # Full Individual dashboard
│   │   │   │   ├── BusinessDashboard.tsx      # Full Business dashboard
│   │   │   │   ├── AdminDashboard.tsx         # Full Admin dashboard
│   │   │   │   ├── Fundraisers.tsx            # Browse & donate to projects
│   │   │   │   ├── Landing.tsx                # Public landing page
│   │   │   │   ├── Login.tsx / Register.tsx   # Auth pages
│   │   │   │   ├── ProtectedRoute.tsx         # Role-based route guard
│   │   │   │   └── ui/                        # shadcn/ui components (40+)
│   │   │   └── routes.tsx                     # All routes with role protection
│   │   ├── context/AuthContext.tsx             # JWT auth state management
│   │   ├── services/
│   │   │   ├── npoService.ts                  # NPO API service
│   │   │   ├── individualService.ts           # Individual API service
│   │   │   ├── businessService.ts             # Business API service
│   │   │   └── adminService.ts                # Admin API service
│   │   ├── lib/api.ts                         # Axios client + interceptors
│   │   └── styles/                            # Tailwind + theme
│   ├── package.json
│   └── vite.config.ts
├── database/                           # SQL Server migrations
│   ├── migrations/                    # 24 sequential migrations (002–024)
│   ├── 000_run_all_migrations.sql     # Master migration runner
│   └── seed_dummy_data.sql            # Realistic seed data
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

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 18+](https://nodejs.org/) with pnpm (`npm install -g pnpm`)
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
# Connect to SQL Server (SSMS or sqlcmd) and run:
database/000_run_all_migrations.sql

# Optionally load seed data:
database/seed_dummy_data.sql
```

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
pnpm install
pnpm dev
```

The app will be available at **http://localhost:5173**.

### 5. Default Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ubuntuconnect.co.za | Admin@123 |
| NPO | greenearth@npo.org | Npo@12345 |
| Individual | thabo@gmail.com | User@12345 |
| Business | csr@techcorp.co.za | Biz@12345 |

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
| Auth | `/api/Auth` | POST register, POST login |
| NPO | `/api/npo` | GET, GET/{id}, PUT, POST topup/follow/unfollow/donate |
| Individual | `/api/individual` | GET me, PUT me, POST follow/donate/volunteer/topup |
| Business | `/api/business` | GET me, POST follow/donate/topup, GET my-campaigns/impact |
| Admin | `/api/admin` | GET stats/users/verifications/transactions, PUT activate/deactivate/approve/reject |
| Campaigns | `/api/campaigns` | GET, GET/{id}, POST, PUT/{id}, DELETE/{id} |
| Campaign Apps | `/api/campaignapplications` | POST apply, GET campaign/{id}, PUT approve/reject |
| Posts | `/api/post` | GET, POST, PUT, DELETE, POST like, DELETE unlike |
| Comments | `/api/comment` | GET post/{id}, POST, DELETE |
| Projects | `/api/project` | GET, GET/{id}, POST, PUT, DELETE |
| Volunteer Opp | `/api/VolunteerOpportunity` | GET, POST, PUT, DELETE |
| Volunteer App | `/api/VolunteerApplication` | GET, PUT accept/reject, DELETE, POST log-hours |
| Verification | `/api/verification` | POST submit, GET my-status |
| Wallet | `/api/wallet` | GET user/{id}/balance |
| Transactions | `/api/transaction` | GET user/{id}, POST withdraw |
| Reports | `/api/reports` | GET donations, GET donations/csv, GET my-donations/csv |

### Swagger UI
Available at `http://localhost:5275/swagger` in development mode.

---

## Database Schema

**20 Tables** across 24 migrations:

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
| Individual | Own profile, discover NPOs, donate, volunteer |
| NPO | Own dashboard, posts, projects, volunteers |
| Business | Own dashboard, campaigns, donations, community |
| Admin | Full platform management |

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
pnpm install
pnpm build    # Must pass with zero errors
```

### Backend Verification
```bash
cd backend/UbuntuConnectAPI
dotnet build  # Must compile without errors
dotnet run    # Then test via Swagger UI
```

### Manual Testing Flow
1. Register accounts for each role
2. NPO: Create posts, fundraisers, volunteer opportunities
3. Individual: Discover NPOs, follow, donate, apply to volunteer, donate to fundraisers
4. Business: Create campaigns, view NPO applications, donate, generate report
5. Admin: View stats, manage users, approve NPO verifications

---

## Documentation

Full project documentation is available in the `/docs` folder:

| Document | Description |
|----------|-------------|
| `00_PROJECT_CHARTER.md` | Engineering principles & standards |
| `01_PROJECT_OVERVIEW.md` | Vision, mission, objectives |
| `01_BUSINESS_DOMAIN.md` | Business domain analysis |
| `02_SYSTEM_CONTEXT.md` | System context diagram |
| `03_FUNCTIONAL_REQUIREMENTS.md` | All functional requirements |
| `04_NON_FUNCTIONAL_REQUIREMENTS.md` | Performance, security, scalability |
| `05_PROJECT_ARCHITECTURE.md` | System architecture design |
| `06_DATABASE_ARCHITECTURE.md` | Database design & ERD |
| `07_API_CONTRACT.md` | Full API specification |
| `08_BACKEND_ARCHITECTURE.md` | Backend patterns & structure |
| `09_FRONTEND_ARCHITECTURE.md` | Frontend patterns & structure |
| `10_UI_UX_SPECIFICATION.md` | UI/UX design specification |
| `11_TESTING_STRATEGY.md` | Testing approach |

---

## Contributing

1. Create a feature branch from `v6`
2. Follow existing code patterns (service layer, controller structure)
3. Ensure `pnpm build` passes before pushing
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
