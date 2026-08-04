# Business Domain — UbuntuConnect

## 1. Purpose

This document defines the business domain of UbuntuConnect — the real-world concepts, actors, relationships, and business rules that govern the platform. It is the single source of truth for architectural, frontend, and backend decisions. If uncertainty exists, this document takes precedence over assumptions.

## 2. Vision

To become the leading digital ecosystem that empowers communities by connecting people, organisations, and businesses through meaningful collaboration and sustainable social development.

## 3. Mission

UbuntuConnect enables Individuals, NPOs, and Businesses to discover opportunities to create positive social impact through technology — simplifying communication, fundraising, volunteering, and collaboration through one centralized platform.

## 4. Business Problem

NPOs struggle to gain exposure, recruit volunteers, receive donations, communicate their needs, and establish partnerships. Individuals and Businesses struggle to discover trustworthy organisations, find volunteering opportunities, donate effectively, and participate in community development. UbuntuConnect exists to remove this disconnect.

## 5. Core Philosophy

UbuntuConnect follows the African philosophy of Ubuntu — "I am because we are." Technology exists to strengthen communities rather than replace them. Success is measured through meaningful community engagement, not user activity alone.

## 6. Primary Actors

### Individual
A person using the platform.
**Goals:** Discover organisations, follow organisations, volunteer, donate, engage with posts, share campaigns, build community.

### Non-Profit Organisation (NPO)
An organisation operating for community benefit.
**Goals:** Build credibility, recruit volunteers, raise funds, publish campaigns, share updates, manage projects, build partnerships.

### Business
A commercial organisation interested in social impact.
**Goals:** Sponsor campaigns, donate resources, build partnerships, participate in CSR initiatives, support local communities.

### Administrator
Platform-level oversight role.
**Goals:** Manage users, verify NPOs, monitor transactions, moderate content.

## 7. Domain Concepts

**User** — A registered account that can authenticate. Belongs to exactly one role: Individual, Business, NPO, or Admin. [BUILT]

**Profile** — Public representation of a User (name, images, bio, contact, location, follower/following counts). One Profile row is created automatically for every User at registration. [BUILT — creation only; dedicated view/edit endpoints not yet confirmed]

**Wallet** — Every User has exactly one Wallet, auto-created at registration, starting at balance 0. [BUILT]

**Post** — A communication published by an NPO or Business. May contain text, images (media URL). Only NPO/Business UserTypes may create posts (enforced in code, not by foreign key). [BUILT]

**Donation** — A monetary contribution from an Individual's wallet to an NPO's wallet. [BUILT — wallet-to-wallet balance transfer with atomic transaction logging; no external payment gateway involved]

**Withdrawal** — A User (typically NPO) moving funds out of their platform wallet. [BUILT — same atomic-transaction pattern as Donation]

**Volunteer Opportunity** — A request for community participation posted by an NPO: role, category, positions, skills, time commitment, duration. [BUILT]

**Volunteer Application** — An Individual's application to a Volunteer Opportunity: personal details, skills, availability, status (Pending/Accepted/Rejected/Cancelled). [BUILT]

**Partnership Campaign** — A structured initiative created by a Business, which NPOs can apply to partner on: title, description, category, requirements, budget per partner. [BUILT-UNTESTED]

**Campaign Application** — An NPO's application to partner on a Business's Campaign, with a status (Pending/Approved/Rejected). [BUILT-UNTESTED]

**Verification** — An NPO's application for platform verification, reviewed and approved/rejected by an Admin; approval sets the NPO's linked User `IsVerified = true`. [BUILT-UNTESTED]

**Follow** — An Individual following an NPO. [BUILT]

## 8. Target Users & What They Can Do Today

### Individual [BUILT]
Register, log in, discover NPOs, view NPO profiles, follow/unfollow, apply to volunteer opportunities, view/cancel own applications, donate to NPOs, view own donations/volunteering/impact stats, view community posts, manage own profile, change password, deactivate account.

### NPO [BUILT / BUILT-UNTESTED — see functional-requirements.md for per-endpoint status]
Register, log in, view/update own NPO profile, create/manage volunteer opportunities, accept/reject/reset volunteer applications, create/edit/soft-delete posts, view own wallet balance, withdraw funds, apply to Business campaigns.

### Business [BUILT-UNTESTED]
Register, log in, create/edit/delete partnership campaigns, review/approve/reject NPO applications to their campaigns.

### Administrator [BUILT-UNTESTED, security gap noted]
View/activate/deactivate any user, review/approve/reject NPO verifications, view platform-wide transactions.
**Known issue:** Admin accounts are currently self-registerable through the public registration endpoint — this must be fixed before production, currently deferred. See functional-requirements.md.

## 9. Business Relationships

```
Individual → Follows → NPO
NPO → Posts → Post
Individual → Applies To → VolunteerOpportunity (owned by NPO)
Individual → Donates → NPO (wallet-to-wallet transfer)
Business → Creates → PartnershipCampaign
NPO → Applies To → PartnershipCampaign (owned by Business)
NPO → Submits → Verification (reviewed by Admin)
User → Owns → Wallet (auto-created at registration)
```

## 10. Business Rules

- Every user must authenticate via JWT.
- Every subtype (Individual/NPO/Business) links back to exactly one User via `UserId`. Admin has no subtype table.
- Only authenticated users may perform protected actions ([Authorize]).
- Only NPO or Business accounts may create Posts (enforced in controller, not by FK).
- Only NPO accounts may create/manage Volunteer Opportunities and accept/reject Applications for their own opportunities (ownership checked against the caller's own NPO record derived from the JWT — never trusted from the request body).
- Only Business accounts may create/manage Partnership Campaigns for their own campaigns (same ownership pattern).
- A donation or withdrawal is rejected if the sender's wallet balance is insufficient; the failed attempt is still logged with `Status = "Failed"` for audit purposes (mirrors real banking practice).
- Account deactivation is always a soft delete (`IsActive = false`), never a hard delete — preserves transaction/volunteer history.
- Business rules take precedence over technical implementation.

## 11. Out of Scope (Current Phase)

Real-time Chat, Video Calling, actual Payment Gateway Integration (Donate/Withdraw use internal wallet balances only), Machine Learning/AI Recommendations, Native Mobile Apps, Blockchain/Crypto, Like/Comment on Posts, Notifications, Search/Filtering, Content Moderation tooling.

## 12. Success Criteria

- Frontend accurately reflects the approved Figma design.
- All frontend functionality integrates with the **existing, real** backend APIs — never invented ones.
- Authentication and authorization function correctly end-to-end.
- Application is responsive (desktop, tablet, mobile).
- API communication is centralized.
- Error handling is robust (loading/empty/error/success states).

## 13. Engineering Principle

Database models, REST APIs, frontend components, and business logic must reflect this business domain document. Technology exists to support the business domain — not define it.
