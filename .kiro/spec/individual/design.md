# Design Specification — Individual Module

Scope: All Individual user features — Discover NPOs, Follow/Unfollow, Volunteer, Donate, Wallet, Impact, Community Updates, Profile Management.
Does NOT cover: NPO dashboard, Business dashboard, Admin features, backend changes.

---

## 1. Architecture Decisions

### 1.1 Keep Single-File Dashboard

The existing `IndividualDashboard.tsx` remains as the single orchestrator component with tab-based navigation. This preserves the current UI structure, avoids routing complexity, and matches the Figma-exported design.

**Trade-off accepted:** A ~1700-line file is large but manageable. The tab content is logically separated by `{activeTab === "..." && (...)}` blocks. If the file grows beyond ~2500 lines in the future, extracting tab panels into sibling components becomes the natural next step.

### 1.2 Service Layer (New)

Create `frontend/src/services/individualService.ts` — a centralized module containing all API calls for the Individual module. This separates data-fetching logic from rendering logic.

**Rationale:**
- Easier to debug (API errors isolated from render errors)
- Reusable across components if dashboard is ever refactored
- Single place to update if endpoint shapes change
- Keeps the dashboard component focused on UI and state
- Follows the project architecture principle: "API communication shall be centralized"

### 1.3 State Management

Use React `useState` + `useEffect` for data fetching. No global state library needed — all Individual data is local to the dashboard (not shared with other pages).

**State pattern per tab:**
```typescript
const [data, setData] = useState<T | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

Mutations (follow, donate, apply) use inline async handlers with optimistic UI updates where appropriate.

### 1.4 Toast Notifications

Use `sonner` (already available as `frontend/src/app/components/ui/sonner.tsx`) for success/error feedback on mutations. Add the `<Toaster />` component in `Root.tsx` if not already present.

### 1.5 Route Protection

Wrap `/individual-dashboard` with `<ProtectedRoute allowedRoles={["Individual"]}>` in `routes.ts`.

### 1.6 Lazy Tab Loading

Each tab fetches its own data on activation (not all at mount). This reduces initial load time and avoids unnecessary API calls for tabs the user may never visit.

---

## 2. File Plan

| File | Action | Purpose |
|---|---|---|
| `frontend/src/services/individualService.ts` | Create | All Individual API calls + TypeScript types |
| `frontend/src/app/components/IndividualDashboard.tsx` | Modify | Replace mock data with real API integration |
| `frontend/src/app/routes.ts` | Modify | Wrap Individual route with ProtectedRoute |
| `frontend/src/app/components/Root.tsx` | Modify | Add `<Toaster />` from sonner if not present |

---

## 3. Service Layer Design

```typescript
// frontend/src/services/individualService.ts
import api from "../lib/api";

// --- Types (matching backend DTOs from API Contract) ---

export interface NPOSummary {
  npoId: number;
  organizationName: string;
  focusArea: string | null;
  mission: string | null;
  location: string | null;
  isVerified: boolean;
}

export interface NPODetail extends NPOSummary {
  followerCount: number;
}

export interface IndividualProfile {
  userId: number;
  firstName: string;
  lastName: string;
  causeOfCare: string | null;
  email: string;
  contact: string | null;
  location: string | null;
}

export interface UpdateProfileDto {
  firstName?: string | null;
  lastName?: string | null;
  causeOfCare?: string | null;
  userContact?: string | null;
  location?: string | null;
}

export interface VolunteerOpportunity {
  opportunityId: number;
  npo_Id: number;
  roleTitle: string;
  category: string | null;
  numOfPositions: number;
  description: string | null;
  skillsRequired: string | null;
  timeCommitment: string | null;
  duration: string | null;
  mediaURL: string | null;
}

export interface VolunteerApplicationDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNum?: string | null;
  skills?: string | null;
  availability?: string | null;
  whyVolunteer?: string | null;
  address?: string | null;
  idnumber?: string | null;
}

export interface MyVolunteeringItem {
  applicationId: number;
  roleTitle: string;
  npoName: string;
  status: string;
  applicationDate: string;
  totalHoursLogged: number;
}

export interface MyDonationsResponse {
  totalDonated: number;
  count: number;
  donations: Array<{
    transactionId: number;
    amount: number;
    status: string;
    timestamp: string;
    receiverUserId: number;
  }>;
}

export interface MyImpact {
  totalDonated: number;
  totalHoursVolunteered: number;
  npoFollowing: number;
  volunteerRolesCompleted: number;
}

export interface WalletBalance {
  walletId: number;
  userId: number;
  balance: number;
}

export interface CommunityPost {
  postId: number;
  authorName: string;
  postTitle: string;
  content: string | null;
  mediaUrl: string | null;
  likeCount: number;
  timestamp: string;
}

// --- Error Utility ---

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as {
      response?: { data?: { message?: string } | string; status?: number };
    };
    if (axiosError.response?.data) {
      if (typeof axiosError.response.data === "string") return axiosError.response.data;
      if (axiosError.response.data.message) return axiosError.response.data.message;
    }
    if (axiosError.response?.status === 404) return "Resource not found.";
    if (axiosError.response?.status === 403) return "You don't have permission for this action.";
    if (axiosError.response?.status === 400) return "Invalid request. Please check your input.";
    if (!axiosError.response) return "Unable to connect to server. Please check your connection.";
    return "Something went wrong. Please try again.";
  }
  return "An unexpected error occurred.";
}

// --- API Functions ---

export const individualService = {
  // Profile
  getProfile: () => api.get<IndividualProfile>("/api/individual/me"),
  updateProfile: (dto: UpdateProfileDto) => api.put("/api/individual/me", dto),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put("/api/individual/change-password", { currentPassword, newPassword }),
  deactivateAccount: (password: string) =>
    api.put("/api/individual/deactivate", { password }),

  // Discover & Follow
  discoverNPOs: () => api.get<NPOSummary[]>("/api/individual/discover-NPOs"),
  getNPODetail: (npoId: number) => api.get<NPODetail>(`/api/individual/npo/${npoId}`),
  followNPO: (npoId: number) => api.post(`/api/individual/follow/${npoId}`),
  unfollowNPO: (npoId: number) => api.delete(`/api/individual/unfollow/${npoId}`),

  // Volunteering
  getOpportunities: () => api.get<VolunteerOpportunity[]>("/api/VolunteerOpportunity"),
  applyVolunteer: (opportunityId: number, dto: VolunteerApplicationDto) =>
    api.post(`/api/individual/volunteer/apply/${opportunityId}`, dto),
  getApplication: (applicationId: number) =>
    api.get(`/api/individual/volunteer/application/${applicationId}`),
  cancelApplication: (applicationId: number) =>
    api.delete(`/api/individual/volunteer/application/${applicationId}`),
  getMyVolunteering: () => api.get<MyVolunteeringItem[]>("/api/individual/my-volunteering"),

  // Wallet & Donations
  getWalletBalance: (userId: number) =>
    api.get<WalletBalance>(`/api/wallet/user/${userId}/balance`),
  topUp: (amount: number) => api.post("/api/individual/topup", { amount }),
  donate: (npoId: number, amount: number) =>
    api.post(`/api/individual/donate/${npoId}`, { amount }),
  getMyDonations: () => api.get<MyDonationsResponse>("/api/individual/my-donations"),

  // Impact & Feed
  getMyImpact: () => api.get<MyImpact>("/api/individual/my-impact"),
  getCommunityUpdates: () => api.get<CommunityPost[]>("/api/individual/community-updates"),
};
```

---

## 4. State Architecture

### 4.1 Shared State (fetched once on mount)

```typescript
// Wallet balance — needed by Donate modal and Donations tab
const [walletBalance, setWalletBalance] = useState<number>(0);

// Followed NPO IDs — needed by Discover (button state) and Following tab
// Derived from the NPO list: NPOs where the follow relationship exists
// NOTE: The backend doesn't provide a "get my follows" endpoint directly.
// Strategy: track follows locally after follow/unfollow actions.
// Initial state: empty (no way to know existing follows without a dedicated endpoint)
const [followedNpoIds, setFollowedNpoIds] = useState<Set<number>>(new Set());
```

**Follow state limitation:** The backend has no `GET /api/individual/my-follows` endpoint. The follow/unfollow state is tracked locally in the session. When the user follows/unfollows, we update the local set. On page refresh, the follow state resets. This is a known limitation — the "Following" tab will show NPOs followed during the current session only.

**Workaround for Following tab:** Use `GET /api/individual/my-impact` which returns `npoFollowing` (count only, not IDs). The Following tab can show a message like "You follow X organizations" but cannot list them individually without a backend endpoint. Alternatively, flag this as a gap to discuss.

### 4.2 Per-Tab State (fetched on tab activation)

```typescript
// Pattern for each data-fetching tab
useEffect(() => {
  if (activeTab === "discover") {
    loadDiscoverNPOs();
  }
}, [activeTab]);

async function loadDiscoverNPOs() {
  setDiscoverLoading(true);
  setDiscoverError(null);
  try {
    const response = await individualService.discoverNPOs();
    setNpos(response.data);
  } catch (err) {
    setDiscoverError(getErrorMessage(err));
  } finally {
    setDiscoverLoading(false);
  }
}
```

---

## 5. Loading/Error/Empty State Strategy

| State | Component Used | Behavior |
|---|---|---|
| Loading (data) | Skeleton (from shadcn) | Show while fetching list data |
| Loading (action) | Button with spinner + disabled | Show during mutations |
| Error (data fetch) | Card with error message + retry Button | Show when fetch fails |
| Error (mutation) | Toast (destructive variant via sonner) | Show when action fails |
| Empty (list) | Card with icon + message + CTA Button | Show when list is empty |
| Success (mutation) | Toast (success variant via sonner) | Show after action completes |

---

## 6. UI Changes from Mock to Real

| Feature | Mock Behavior | Real Behavior |
|---|---|---|
| NPO list | Hardcoded 10 objects with images/campaigns | Fetched from API; no images or campaign data available |
| Follow state | Local array toggle | API call + optimistic UI + local set update |
| NPO detail | Extra fields (image, province, campaign) | Only: organizationName, focusArea, mission, location, isVerified, followerCount |
| Volunteer opportunities | Hardcoded 3 with applicant counts | Fetched from /api/VolunteerOpportunity; no applicant count in response |
| Donate | Modal with no effect | API call with wallet balance validation |
| User name in header | Hardcoded "Sarah Mthembu" | From `GET /api/individual/me` profile or AuthContext email |
| Wallet balance | Not shown | Fetched on mount, displayed in donation UI |
| Donation history | Hardcoded 2 items | Fetched from API with real transaction data |
| Impact stats | Computed from mock arrays | Fetched from /api/individual/my-impact |
| Community posts | Hardcoded 4 posts with comments | Fetched from API; no comment count (render likeCount only) |
| Profile form | Hardcoded default values | Pre-filled from GET /api/individual/me |
| Logout button | `window.location.href = "/"` | `AuthContext.logout()` |

**Fields removed (not available from API):**
- NPO images (no image field in discover-NPOs response)
- NPO province (only `location` is returned)
- NPO campaign data (campaignGoal, campaignRaised, campaignDeadline) — campaigns are a Business feature
- Post comments count (no comment system exists)
- Volunteer opportunity applicant count (not in response)

**Fields preserved with adaptation:**
- NPO `focusArea` maps to the old `category` display
- NPO `mission` maps to the old `description` display
- Post `mediaUrl` replaces the old hardcoded `image` field

---

## 7. Error Handling Strategy

All API errors pass through the `getErrorMessage()` utility in the service file. This extracts human-readable messages from the backend response or provides sensible defaults based on HTTP status codes.

**Error display locations:**
- Data fetch errors → inline error card within the tab content area
- Mutation errors → destructive toast notification (temporary, auto-dismisses)
- Form validation errors → inline below the specific field
- Network errors → generic "Unable to connect" message

---

## 8. Dependencies

| Package | Status | Purpose |
|---|---|---|
| axios | Already installed | HTTP client |
| sonner | Already installed (shadcn/ui) | Toast notifications |
| motion/react | Already installed | Animations (existing tab transitions) |
| lucide-react | Already installed | Icons (existing) |

**No new dependencies required.**

---

## 9. Identified Gaps & Decisions

| Gap | Decision |
|---|---|
| No `GET /my-follows` endpoint | Track follows locally in session; Following tab shows NPOs followed this session + impact count |
| No NPO images from API | Remove image sections from NPO cards; use icon/initial placeholders |
| No post comment count | Remove comments display; show likeCount as read-only |
| No volunteer applicant count | Remove "X applicants" from opportunity cards |
| No campaign data on NPO list | Remove "Active Campaigns" section from Discover tab |
| `GET /api/feed/community-updates` is [BUILT-UNTESTED] | Do NOT use; use public `/api/individual/community-updates` for all post display |

---

## 10. What This Spec Does NOT Cover

- NPO/Business/Admin dashboard integration
- Real payment gateway (TopUp/Donate are internal wallet ops)
- Like/Comment on posts (PLANNED, not built)
- Image upload for profiles
- Real-time notifications
- Pagination (not implemented in backend for any of these endpoints)
- Token refresh (single expiry, handled by 401 interceptor)
