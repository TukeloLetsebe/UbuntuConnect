# Authentication Design Spec — UbuntuConnect

Scope: Login, Register, JWT session management, and route protection ONLY.

---

## 1. Backend Endpoints (already built, verified)

| Action | Endpoint | Request DTO | Key Response Fields |
|---|---|---|---|
| Register | `POST /api/Auth/register` | `RegisterRequest` | `{ userId, userType, message }` |
| Login | `POST /api/Auth/login` | `LoginRequest` | `{ token, userId, userType, email, isVerified }` |

Both are public (no auth header required). Registration is atomic (all-or-nothing). Login checks `IsActive` before issuing a token.

---

## 2. JWT Structure

Claims embedded in the token (set by backend):

| Claim | Value | Purpose |
|---|---|---|
| `ClaimTypes.NameIdentifier` | UserId (int) | Identifies the user for all authenticated requests |
| `ClaimTypes.Email` | UserEmail | Display/convenience |
| `ClaimTypes.Role` | UserType (`Individual`, `NPO`, `Business`, `Admin`) | Role-based route access |

Token lifetime: configured in `appsettings.json` → `Jwt:ExpiryMinutes`.

---

## 3. Frontend Architecture

### 3.1 API Client (minimal, Login-first)

Create `src/lib/api.ts`:

```
Purpose: Centralized axios instance with:
- baseURL from env var (VITE_API_URL)
- Request interceptor: attaches Authorization header from localStorage
- Response interceptor: on 401, clears stored auth and redirects to /login
```

**Dependencies to add:** `axios` (the only new dependency needed).

**Environment file:** Create `frontend/.env` with:
```
VITE_API_URL=https://localhost:7062/api
```

### 3.2 Auth Context

Create `src/context/AuthContext.tsx`:

```
Provides:
- user: { userId, userType, email, isVerified, token } | null
- login(email, password) → calls POST /api/Auth/login, stores result
- register(dto) → calls POST /api/Auth/register, does NOT auto-login (redirect to /login)
- logout() → clears localStorage + state, redirects to /
- isAuthenticated: boolean (derived)
- isLoading: boolean (initial hydration from localStorage)

Storage:
- localStorage key: "ubuntuconnect_auth"
- Stores: { token, userId, userType, email, isVerified }
- On mount: reads localStorage, validates token expiry (decode exp claim client-side), hydrates state
- On logout/401: removes key, resets state
```

**Documented security tradeoff:** localStorage is readable by any JS on the page (XSS surface). This is an accepted tradeoff for project speed and simplicity. In a production hardening phase, consider httpOnly cookie-based auth or a BFF pattern. This decision is explicit and documented, not silent.

### 3.3 Route Protection

Create `src/components/ProtectedRoute.tsx`:

```
Props:
- allowedRoles?: string[] (e.g., ["NPO", "Business"])
- redirectTo?: string (default: "/login")

Behavior:
- If not authenticated → redirect to /login
- If authenticated but role not in allowedRoles → redirect to /dashboard (which itself redirects)
- If authenticated and authorized → render children
```

### 3.4 Router Changes

Modify `src/app/routes.ts`:

| Route | Protection | Behavior |
|---|---|---|
| `/` | Public | Landing page |
| `/register` | Public (redirect away if already logged in) | Registration form |
| `/login` | Public (redirect away if already logged in) | Login form |
| `/dashboard` | Authenticated | **Not a page** — immediately redirects based on `userType`: Individual→`/individual-dashboard`, NPO→`/npo-dashboard`, Business→`/business-dashboard`, Admin→`/admin-dashboard` |
| `/individual-dashboard` | Authenticated + Role=Individual | Individual dashboard |
| `/npo-dashboard` | Authenticated + Role=NPO | NPO dashboard |
| `/business-dashboard` | Authenticated + Role=Business | Business dashboard |
| `/admin-dashboard` | Authenticated + Role=Admin | Admin dashboard |

---

## 4. Login Page Wiring

Current state: `Login.tsx` is mock (navigates by dropdown selection).

Target state:
1. Remove the UserType dropdown (backend determines type from credentials)
2. On submit: call `AuthContext.login(email, password)`
3. On success: redirect to `/dashboard` (which auto-redirects to role-specific page)
4. On error: display the error message from the API response (401 → "Invalid email or password" or "This account has been deactivated")
5. Add loading state to button during API call
6. Keep "Remember me" checkbox — when unchecked, use `sessionStorage` instead of `localStorage`

---

## 5. Register Page Wiring

Current state: `Register.tsx` is mock (navigates on submit without API call).

Target state:
1. Collect form data per user type (existing form fields already match `RegisterRequest` DTO)
2. On submit: call `POST /api/Auth/register` via the API client
3. On success: redirect to `/login` with a success toast/message
4. On error: display validation errors inline (400 responses contain the error message)
5. Add loading state to submit button
6. Admin registration: keep the form but note in UI that this is a development-only feature (per FRS known issue)

### Field Mapping (Frontend Form → DTO)

| UserType | Frontend Fields | DTO Fields |
|---|---|---|
| Individual | first-name, last-name, email, location, interests, password | firstName, lastName, userEmail, location, causeOfCare, password, userType="Individual" |
| NPO | org-name, registration-number, email, phone, location, focus-area, mission, password | organizationName, npoRegNum, userEmail, userContact, location, npoFocusArea, npoMission, password, userType="NPO" |
| Business | company-name, registration-number, industry, contact-name, job-title, email, phone, csr-goals, password | businessRegNum (from registration-number), industry, contactPersonName, contactPersonTitle, userEmail, userContact, csrGoal, password, userType="Business" |
| Admin | first-name, last-name, email, phone, password | userEmail, userContact, password, userType="Admin", firstName, lastName |

---

## 6. Implementation Order

1. Install axios, create `.env`
2. Create `src/lib/api.ts` (base instance + interceptors)
3. Create `src/context/AuthContext.tsx`
4. Create `src/components/ProtectedRoute.tsx`
5. Wire `Login.tsx` to real API (remove mock logic)
6. Wire `Register.tsx` to real API (remove mock logic)
7. Update `routes.ts` with protection and `/dashboard` redirect logic
8. Update `Root.tsx` to wrap children in `AuthProvider`
9. Verify end-to-end: register → login → correct dashboard → logout → protected route blocks access

---

## 7. Files to Create

| File | Purpose |
|---|---|
| `frontend/.env` | `VITE_API_URL=https://localhost:7062/api` |
| `frontend/src/lib/api.ts` | Axios instance + interceptors |
| `frontend/src/context/AuthContext.tsx` | Auth state, login/register/logout functions |
| `frontend/src/components/ProtectedRoute.tsx` | Route guard component |

---

## 8. Files to Modify

| File | Change |
|---|---|
| `frontend/package.json` | Add `axios` dependency |
| `frontend/src/app/routes.ts` | Wrap dashboard routes in ProtectedRoute, add redirect logic for /dashboard |
| `frontend/src/app/components/Root.tsx` | Wrap `<Outlet />` in `<AuthProvider>` |
| `frontend/src/app/components/Login.tsx` | Replace mock logic with AuthContext.login call |
| `frontend/src/app/components/Register.tsx` | Replace mock logic with API call |
| `frontend/src/app/components/Dashboard.tsx` | Replace placeholder with role-based redirect |

---

## 9. Acceptance Criteria

- [x] Register an Individual → User appears in DB with correct subtype, Wallet, Profile
- [x] Register an NPO → Same verification
- [x] Login with valid credentials → JWT returned, stored in localStorage, user redirected to correct dashboard
- [x] Login with invalid credentials → Error message displayed, no redirect
- [x] Login with deactivated account → "deactivated" error message
- [x] Visiting `/individual-dashboard` without auth → redirected to `/login`
- [x] Visiting `/npo-dashboard` as an Individual → redirected to `/dashboard` → `/individual-dashboard`
- [x] Logout → localStorage cleared, redirected to `/`, protected routes inaccessible
- [x] Page refresh while logged in → auth state hydrated from localStorage, stays on current page
- [x] Token expiry → next API call returns 401 → auto-logout + redirect

---

## 10. Out of Scope (this spec)

- Forgot password / password reset
- Email verification
- Token refresh / sliding sessions
- Remember me with persistent sessions beyond localStorage
- Admin registration restriction (noted as deferred in FRS)
- Any dashboard functionality beyond "you land on the correct one" 
