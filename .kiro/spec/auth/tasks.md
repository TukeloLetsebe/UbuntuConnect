# Implementation Tasks — Authentication Module

Spec: `12_AUTH_DESIGN.md`
Requirements: `authentication-requirements.md`

---

## Backend Prerequisites

- [x] POST /api/Auth/register endpoint exists and is tested (FR-001 [BUILT])
- [x] POST /api/Auth/login endpoint exists and is tested (FR-002 [BUILT])
- [x] JWT claims include NameIdentifier, Email, Role (verified in AuthController)
- [x] Login checks IsActive before issuing token (deactivated = 401)
- [x] Register auto-creates Wallet + Profile for all user types
- [x] PUT /api/individual/change-password exists (FR-004 [BUILT])
- [x] PUT /api/individual/deactivate exists (FR-005 [BUILT])
- [x] CORS policy configured for http://localhost:5173 (Task #4 completed)

---

## Frontend Implementation Tasks

### Phase 1: Infrastructure

- [x] 1.1 Install axios dependency in frontend/package.json
- [x] 1.2 Create `frontend/.env` with VITE_API_URL
- [x] 1.3 Create `frontend/src/lib/api.ts` — Axios instance with baseURL, auth header interceptor, 401 response interceptor

### Phase 2: Auth Context

- [x] 2.1 Create `frontend/src/context/AuthContext.tsx` with AuthProvider
- [x] 2.2 Implement login(email, password) → POST /api/Auth/login, store token + user data in localStorage
- [x] 2.3 Implement register(dto) → POST /api/Auth/register, auto-login after success
- [x] 2.4 Implement logout() → clear localStorage, reset state, navigate to /login
- [x] 2.5 Implement hydration on mount — read localStorage, restore auth state
- [ ] 2.6 Document localStorage XSS risk as code comment in AuthContext

### Phase 3: Route Protection

- [x] 3.1 Create `frontend/src/components/ProtectedRoute.tsx` (checks auth + role)
- [ ] 3.2 Modify `frontend/src/app/routes.ts` — wrap dashboard routes in ProtectedRoute
- [x] 3.3 Modify `frontend/src/app/components/Dashboard.tsx` — role-based redirect only, no rendered UI
- [x] 3.4 Modify `frontend/src/app/components/Root.tsx` — wrap Outlet in AuthProvider

### Phase 4: Login Page

- [x] 4.1 Remove the UserType dropdown from Login.tsx (backend determines type)
- [x] 4.2 Wire form submit to AuthContext.login(email, password)
- [x] 4.3 Add loading state (disable button, show spinner)
- [x] 4.4 Add error display (invalid credentials, deactivated account, network error)
- [x] 4.5 On success → redirect to /dashboard (which auto-redirects to correct role page)

### Phase 5: Register Page

- [x] 5.1 Remove mock handleSubmit from Register.tsx
- [x] 5.2 Map Individual form fields → RegisterRequest DTO
- [x] 5.3 Map NPO form fields → RegisterRequest DTO
- [x] 5.4 Map Business form fields → RegisterRequest DTO
- [ ] 5.5 Remove Admin registration option from the UI (backend gap, FRS [NEEDS-FIX])
- [x] 5.6 Wire form submit to AuthContext.register(dto) or direct API call
- [x] 5.7 Add loading state to submit button
- [x] 5.8 Add error display (duplicate email, validation errors)
- [x] 5.9 On success → auto-login and redirect to correct dashboard

### Phase 6: Logout

- [ ] 6.1 Wire Logout button in all dashboard headers to AuthContext.logout()

### Phase 7: End-to-End Verification

- [ ] 7.1 Register an Individual → verify user + wallet + profile created in DB
- [ ] 7.2 Register an NPO → verify subtype row created
- [ ] 7.3 Login with valid credentials → token stored, correct dashboard loaded
- [ ] 7.4 Login with invalid credentials → error message displayed, no redirect
- [ ] 7.5 Login with deactivated account → specific deactivation message shown
- [ ] 7.6 Visit /individual-dashboard without auth → redirected to /login
- [ ] 7.7 Visit /npo-dashboard as Individual → redirected to /individual-dashboard
- [ ] 7.8 Logout → localStorage cleared, protected routes blocked
- [ ] 7.9 Page refresh while logged in → state hydrated, remains on page
- [ ] 7.10 Build succeeds with no errors (npm run build)

---

## Acceptance Criteria Summary (from design spec section 9)

- [ ] Register Individual → DB correct
- [ ] Register NPO → DB correct
- [ ] Login valid → JWT stored, correct redirect
- [ ] Login invalid → error shown
- [ ] Login deactivated → deactivated message shown
- [ ] Unauthenticated → /login redirect
- [ ] Wrong role → correct dashboard redirect
- [ ] Logout → clean state + redirect
- [ ] Refresh → session persists
- [ ] Token expiry → auto-logout on 401

---

## Remaining Work (4 tasks)

1. **2.6** — Add XSS risk comment in AuthContext
2. **3.2** — Wrap dashboard routes in ProtectedRoute in routes.ts
3. **5.5** — Remove Admin registration option from UI
4. **6.1** — Wire all dashboard Logout buttons to AuthContext.logout()

After these 4 items, Phase 7 (E2E verification) can be run.

---

## Out of Scope

- Forgot password
- Email verification
- Token refresh
- Admin registration restriction (tracked in FRS)
- Dashboard content/data fetching
