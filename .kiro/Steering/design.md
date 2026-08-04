# Design Specification — Authentication Module

Scope: Login, Register, JWT session management, route protection, logout.
Does NOT cover: Individual/NPO/Business dashboard features, volunteering, donations, campaigns.

---

## 1. Backend Endpoints Used

| Action | Method | Endpoint | Auth | Response (success) |
|---|---|---|---|---|
| Register | POST | `/api/Auth/register` | None | `{ message, userId, userType }` |
| Login | POST | `/api/Auth/login` | None | `{ message, token, userId, userType, email, isVerified }` |

Full request/response shapes: see `07_API_CONTRACT.md` sections 2.

---

## 2. Frontend Architecture Decisions

### 2.1 API Client (minimal, per user instruction)

Create `frontend/src/lib/api.ts`:
- Axios instance with `baseURL` from environment variable `VITE_API_URL` (default: `http://localhost:5173` proxied or `https://localhost:7001` direct)
- Request interceptor: attaches `Authorization: Bearer {token}` from localStorage if present
- Response interceptor: on 401, clears stored auth and redirects to `/login`
- No comprehensive service layer — just the raw axios instance exported for now

### 2.2 Auth Context

Create `frontend/src/context/AuthContext.tsx`:
- React Context + Provider wrapping the app
- State: `{ token, userId, userType, email, isVerified, isAuthenticated }`
- Methods: `login(email, password)`, `register(dto)`, `logout()`
- On `login` success: store token + user data in localStorage, update context state
- On `logout`: clear localStorage, reset state, navigate to `/login`
- On app mount: hydrate state from localStorage (if token exists)

**Documented risk (per user instruction):** localStorage is readable by any JS on the page. This is an XSS surface — any injected script can steal the token. Accepted tradeoff for project speed. In production, consider httpOnly cookies with a BFF (Backend-For-Frontend) pattern. This is NOT a silent decision — it's a known, explicit compromise.

### 2.3 Route Protection

Modify `frontend/src/app/routes.ts`:
- `/dashboard` becomes a redirect component (never renders UI):
  - If not authenticated → redirect to `/login`
  - If authenticated → redirect to `/{userType}-dashboard` based on stored role
- Protected routes (`/npo-dashboard`, `/individual-dashboard`, `/business-dashboard`, `/admin-dashboard`) wrapped in a `<ProtectedRoute>` component that:
  - Checks `isAuthenticated` from AuthContext
  - If not authenticated → redirect to `/login`
  - If authenticated but wrong role → redirect to correct dashboard
- Public routes (`/`, `/register`, `/login`) remain accessible to all — even when the user is already authenticated. This allows switching accounts (login as a different user) or registering new accounts without logging out first. The `login()` method in AuthContext overwrites the previous session.

### 2.4 Login Page Wiring

Modify `frontend/src/app/components/Login.tsx`:
- Remove mock `handleSubmit` (currently just navigates by dropdown)
- Remove the `userType` dropdown (the backend determines role from credentials)
- Wire form to `AuthContext.login(email, password)`
- Add loading state while API call is in flight
- Add error state to display backend error messages (invalid credentials, deactivated)
- On success: AuthContext handles navigation to correct dashboard

### 2.5 Register Page Wiring

Modify `frontend/src/app/components/Register.tsx`:
- Remove mock `handleSubmit` (currently just navigates)
- Wire each form variant (Individual/NPO/Business/Admin) to `AuthContext.register(dto)`
- Map form fields to `RegisterRequest` DTO shape
- Add loading state, error state, validation feedback
- On success: either auto-login (call login immediately after) or redirect to `/login` with success message

### 2.6 Logout

- Call `AuthContext.logout()` from any dashboard's Logout button
- Clears token + user state, navigates to `/login`

---

## 3. File Plan

| File | Action | Purpose |
|---|---|---|
| `frontend/.env` | Create | `VITE_API_URL=https://localhost:7001` |
| `frontend/src/lib/api.ts` | Create | Axios instance with interceptors |
| `frontend/src/context/AuthContext.tsx` | Create | Auth state + login/register/logout methods |
| `frontend/src/app/components/ProtectedRoute.tsx` | Create | Route guard component |
| `frontend/src/app/routes.ts` | Modify | Wrap protected routes, add redirect logic |
| `frontend/src/app/components/Login.tsx` | Modify | Replace mock with real API integration |
| `frontend/src/app/components/Register.tsx` | Modify | Replace mock with real API integration |
| `frontend/src/app/components/Dashboard.tsx` | Modify | Role-based redirect, no rendered UI |
| `frontend/package.json` | Modify | Add `axios` dependency |

---

## 4. State Shape

```typescript
interface AuthState {
  token: string | null;
  userId: number | null;
  userType: "Individual" | "NPO" | "Business" | "Admin" | null;
  email: string | null;
  isVerified: boolean;
  isAuthenticated: boolean;
}
```

---

## 5. Error Handling

| Scenario | Backend Response | Frontend Behavior |
|---|---|---|
| Invalid credentials | 401 "Invalid email or password." | Show error below form |
| Deactivated account | 401 "This account has been deactivated." | Show error below form |
| Duplicate email (register) | 400 "An account with this email already exists." | Show error below form |
| Missing required fields | 400 with specific message | Show error below form |
| Network error | No response | Show "Unable to connect to server" |
| Server error | 500 | Show "Something went wrong. Please try again." |

---

## 6. Security Notes

- Token stored in localStorage (XSS risk documented above)
- Token attached via Authorization header (not cookies) — CSRF is not a concern
- CORS configured to allow only `http://localhost:5173` (already done in Program.cs)
- Password never stored on frontend beyond the form field lifetime
- Token expiry handled by backend (`Jwt:ExpiryMinutes`); frontend responds to 401 by logging out

---

## 7. Dependencies Added

| Package | Version | Purpose |
|---|---|---|
| `axios` | latest stable | HTTP client for API communication |

No other new dependencies. React Context is built-in. react-router already installed.

---

## 8. What This Spec Does NOT Cover

- Dashboard page content (data fetching, state for NPO lists, etc.)
- Profile management beyond login/register
- Token refresh (not implemented in backend — single expiry)
- "Forgot password" flow (no backend endpoint exists)
- Admin registration security (known gap, deferred per FRS)
