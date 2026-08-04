# Implementation Tasks — Individual Module

Spec: `design.md`
Requirements: `requirements.md`

---

## Backend Prerequisites (all verified [BUILT])

- [x] GET /api/individual/me
- [x] PUT /api/individual/me
- [x] GET /api/individual/discover-NPOs
- [x] GET /api/individual/npo/{npoId}
- [x] POST /api/individual/follow/{npoId}
- [x] DELETE /api/individual/unfollow/{npoId}
- [x] GET /api/VolunteerOpportunity
- [x] POST /api/individual/volunteer/apply/{opportunityId}
- [x] GET /api/individual/volunteer/application/{applicationId}
- [x] DELETE /api/individual/volunteer/application/{applicationId}
- [x] GET /api/wallet/user/{userId}/balance
- [x] POST /api/individual/topup
- [x] POST /api/individual/donate/{npoId}
- [x] GET /api/individual/my-donations
- [x] GET /api/individual/my-volunteering
- [x] GET /api/individual/my-impact
- [x] GET /api/individual/community-updates
- [x] PUT /api/individual/change-password
- [x] PUT /api/individual/deactivate

---

## Frontend Implementation Tasks

### Phase 1: Infrastructure & Route Protection

**Requirements covered:** R1, R20

- [x] 1.1 Create `frontend/src/services/individualService.ts` — all typed API functions, DTOs, and `getErrorMessage` utility
- [x] 1.2 Modify `frontend/src/app/routes.ts` — wrap `/individual-dashboard` with `<ProtectedRoute allowedRoles={["Individual"]}>`
- [x] 1.3 Add `<Toaster />` from sonner to `Root.tsx` (verify if already present first)
- [x] 1.4 Wire Logout button in IndividualDashboard header to `AuthContext.logout()` (replace `window.location.href = "/"`)
- [x] 1.5 Replace hardcoded "Sarah Mthembu" in header with user email from AuthContext (or profile name once loaded)
- [x] 1.6 Verify build passes after infrastructure changes (`npm run build`)

**Demo:** Individual dashboard only accessible when logged in as Individual. Wrong-role redirects work. Logout clears session. Toast infrastructure ready.

---

### Phase 2: Profile Management

**Requirements covered:** R2, R3, R18, R19

- [x] 2.1 On Profile tab activation, call `individualService.getProfile()` and populate form fields with response data
- [x] 2.2 Add loading skeleton for profile form while fetching
- [x] 2.3 Add error state with retry if profile fetch fails
- [x] 2.4 Wire "Update Profile" form submission to `individualService.updateProfile(dto)` with loading state on button
- [x] 2.5 Show success toast on profile update; show error toast on failure
- [x] 2.6 Wire "Change Password" form to `individualService.changePassword()` with validation (min 8 chars, confirm match)
- [x] 2.7 Show success toast + clear form on password change; show backend error on failure
- [x] 2.8 Replace "Delete Account" with "Deactivate Account" — wire to confirmation dialog requiring password
- [x] 2.9 On deactivation success, call `AuthContext.logout()` to clear session and redirect to landing
- [x] 2.10 Verify all profile operations work end-to-end

**Demo:** Profile tab loads real data from API. Can update profile, change password, deactivate account — all with proper loading/error/success feedback.

---

### Phase 3: Discover NPOs + Follow/Unfollow

**Requirements covered:** R4, R5, R6, R7

- [x] 3.1 On Discover tab activation, call `individualService.discoverNPOs()` and render NPO cards from response
- [x] 3.2 Add skeleton loading cards while fetching
- [x] 3.3 Add error state with retry button if fetch fails
- [x] 3.4 Add empty state if no NPOs returned
- [x] 3.5 Implement client-side filtering: search by name/location/focusArea, filter by verification status
- [x] 3.6 Remove mock data fields not available from API (images, province, campaigns, follower count on list)
- [x] 3.7 Adapt NPO card layout to use available fields: organizationName, focusArea, mission, location, isVerified
- [x] 3.8 Wire "Follow" button to `individualService.followNPO(npoId)` with optimistic UI toggle
- [x] 3.9 Wire "Unfollow" button to `individualService.unfollowNPO(npoId)` with optimistic UI toggle
- [x] 3.10 Handle follow/unfollow errors (400 already following, 404 not found) — revert optimistic state, show toast
- [x] 3.11 Implement NPO detail modal/view: on card click, call `individualService.getNPODetail(npoId)` and display followerCount
- [x] 3.12 Update "Following" tab to show NPOs followed during current session (with known limitation note)
- [x] 3.13 Remove "Active Campaigns" and "Recommended for You" sections (data not available from API)
- [x] 3.14 Verify discover + follow/unfollow works end-to-end

**Demo:** Discover tab loads real NPOs from API. Can search/filter client-side. Follow/Unfollow buttons call real API with immediate UI feedback. NPO detail shows follower count.

---

### Phase 4: Wallet + Donate + Top Up

**Requirements covered:** R12, R13, R14

- [x] 4.1 On dashboard mount, fetch wallet balance via `individualService.getWalletBalance(userId)` — store in shared state
- [x] 4.2 Display wallet balance in the donation modal header
- [x] 4.3 Wire donate modal form submission to `individualService.donate(npoId, amount)` with amount validation
- [x] 4.4 On donate success: update local wallet balance, show success toast, close modal
- [x] 4.5 On donate failure (insufficient balance): show error message + offer top-up option within modal
- [x] 4.6 Add top-up form/section (can be in donation modal or My Donations tab)
- [x] 4.7 Wire top-up submission to `individualService.topUp(amount)` with loading state
- [x] 4.8 On top-up success: update local wallet balance, show success toast
- [x] 4.9 Client-side validation: amount must be > 0 for both donate and top-up
- [x] 4.10 Verify wallet/donate/topup flow end-to-end

**Demo:** Wallet balance fetched and displayed. Can donate to an NPO (balance deducted). Can top up wallet (balance increases). Insufficient balance handled gracefully with top-up option.

---

### Phase 5: Volunteer (Browse + Apply + View + Cancel)

**Requirements covered:** R8, R9, R10, R11

- [x] 5.1 On Volunteer Opportunities tab activation, call `individualService.getOpportunities()` and render cards
- [x] 5.2 Add skeleton loading for opportunities
- [x] 5.3 Add error/empty states
- [x] 5.4 Adapt opportunity card to available fields (remove applicant count, schedule — not in API response)
- [x] 5.5 Wire "Apply" button to open volunteer application modal
- [x] 5.6 Wire modal form submission to `individualService.applyVolunteer(opportunityId, dto)` with loading state
- [x] 5.7 On apply success: show success toast, mark opportunity as "Applied" in local state
- [x] 5.8 Handle already-applied error (400) — show specific message
- [x] 5.9 On My Volunteering tab activation, call `individualService.getMyVolunteering()` and render applications
- [x] 5.10 Display application status badges with color coding (Pending=amber, Accepted=green, Rejected=red, Cancelled=gray)
- [x] 5.11 Wire "Withdraw" button to confirmation dialog → `individualService.cancelApplication(applicationId)`
- [x] 5.12 Handle cancel errors (400 already accepted, 403 not owner) — show toast
- [x] 5.13 On cancel success: remove from list, show success toast
- [x] 5.14 Verify volunteer flow end-to-end

**Demo:** Volunteer tab loads real opportunities. Can apply (modal form → API call). My Volunteering shows real applications with status. Can cancel pending applications.

---

### Phase 6: My Donations + My Volunteering + My Impact

**Requirements covered:** R15, R10, R16

- [x] 6.1 On My Donations tab activation, call `individualService.getMyDonations()` and render donation history
- [x] 6.2 Display summary stats: totalDonated, count
- [x] 6.3 Display wallet balance in donations tab header
- [x] 6.4 Add skeleton loading and error/empty states for donations
- [x] 6.5 On My Impact tab activation, call `individualService.getMyImpact()` and render stat cards
- [x] 6.6 Display: totalDonated, totalHoursVolunteered, npoFollowing, volunteerRolesCompleted
- [x] 6.7 Add skeleton loading and error states for impact
- [x] 6.8 Remove hardcoded "Combined Impact" bullet points (no backend data for those)
- [x] 6.9 Verify all history/impact tabs render correct real data

**Demo:** My Donations shows real transaction history with totals. My Impact shows aggregated stats from the API. Empty states shown when user has no history yet.

---

### Phase 7: Community Updates

**Requirements covered:** R17

- [x] 7.1 On Community Updates tab activation, call `individualService.getCommunityUpdates()` and render post cards
- [x] 7.2 Display each post: authorName, postTitle, content, mediaUrl (conditional), likeCount, timestamp
- [x] 7.3 Remove comments count display (no backend support)
- [x] 7.4 Implement client-side search/filter by title, author name, content
- [x] 7.5 Add skeleton loading, error, and empty states
- [x] 7.6 Handle mediaUrl gracefully (show only when non-null, use placeholder when missing)
- [x] 7.7 Verify community updates tab renders real posts

**Demo:** Community Updates tab loads real posts from all NPOs. Search/filter works client-side. Posts with media show images, posts without media show text-only layout.

---

### Phase 8: Polish & UX Consistency

**Requirements covered:** R20

- [x] 8.1 Audit all tabs for consistent loading skeleton patterns
- [x] 8.2 Audit all tabs for consistent error state patterns (card + message + retry)
- [x] 8.3 Audit all tabs for consistent empty state patterns (icon + message + CTA)
- [x] 8.4 Ensure all mutation buttons have loading spinners when in flight
- [x] 8.5 Ensure all toasts use consistent styling (success = default, error = destructive)
- [x] 8.6 Test responsive layout across desktop/tablet/mobile breakpoints
- [x] 8.7 Remove all remaining mock/hardcoded data from the component
- [x] 8.8 Verify no console errors or warnings in development
- [x] 8.9 Run `npm run build` — ensure production build succeeds with no errors

**Demo:** Consistent UX across all tabs. No mock data remains. Build succeeds. Responsive on all screen sizes.

---

### Phase 9: End-to-End Verification

- [~] 9.1 Unauthenticated user visits /individual-dashboard → redirected to /login
- [~] 9.2 NPO user visits /individual-dashboard → redirected to /npo-dashboard
- [~] 9.3 Individual logs in → lands on /individual-dashboard
- [~] 9.4 Profile tab loads real profile data from API
- [~] 9.5 Update profile → success toast, data persists on tab switch
- [~] 9.6 Change password → success toast, form clears
- [~] 9.7 Discover tab loads real NPOs from API
- [~] 9.8 Follow an NPO → API call succeeds, button state changes
- [~] 9.9 Unfollow an NPO → API call succeeds, button reverts
- [~] 9.10 Donate to NPO → wallet deducted, success message
- [~] 9.11 Top up wallet → balance increases
- [~] 9.12 Apply to volunteer opportunity → success message, marked as applied
- [~] 9.13 View My Volunteering → shows real applications
- [~] 9.14 Cancel pending application → removed from list
- [~] 9.15 My Donations tab → shows real donation history
- [~] 9.16 My Impact tab → shows real aggregated stats
- [~] 9.17 Community Updates → shows real posts
- [~] 9.18 Logout → clears session, redirects to /login
- [~] 9.19 Deactivate account → logged out, redirected to landing
- [~] 9.20 Page refresh while logged in → session persists, dashboard accessible
- [~] 9.21 Build succeeds with no errors (`npm run build`)

---

## Potential Future Work (Out of current scope)

These are enhancements that could be built once the core integration is complete:

- [~] **Dedicated "My Follows" endpoint** — Request backend team to add `GET /api/individual/my-follows` returning list of followed NPO IDs/summaries (enables persistent Following tab across sessions)
- [~] **NPO profile images** — Once image upload is implemented, add image display to NPO cards
- [~] **Post media gallery** — Full-screen image viewer for post mediaUrl content
- [~] **Pagination** — Once backend adds pagination support, implement infinite scroll or page controls
- [~] **Followed-only feed** — Once `GET /api/feed/community-updates` is verified working, add a "My Feed" sub-tab showing posts only from followed NPOs
- [~] **Like posts** — Once the PostLike table and endpoints are built ([PLANNED]), add like button functionality
- [~] **Comment on posts** — Once comment endpoints exist ([PLANNED]), add comment sections
- [~] **Real-time notifications** — Push notifications for follow activity, donation receipts, application status changes
- [~] **Volunteer hour logging** — Display logged hours detail view (GET application/{id} includes logs)
- [~] **NPO detail page** — Dedicated route `/npo/{id}` with full profile, opportunities, and posts
- [~] **Donation receipts** — Downloadable/printable donation confirmation
- [~] **Search endpoint** — Once backend search is implemented, replace client-side filtering
- [~] **Token refresh** — Once backend supports refresh tokens, implement silent refresh

---

## Summary

| Phase | Tasks | Requirements | Demoable Outcome |
|---|---|---|---|
| 1 | 6 | R1, R20 | Protected route, logout, toast ready |
| 2 | 10 | R2, R3, R18, R19 | Profile CRUD + password + deactivate |
| 3 | 14 | R4, R5, R6, R7 | Discover + follow/unfollow real NPOs |
| 4 | 10 | R12, R13, R14 | Wallet + donate + top up |
| 5 | 14 | R8, R9, R10, R11 | Volunteer browse + apply + cancel |
| 6 | 9 | R10, R15, R16 | Donation history + impact stats |
| 7 | 7 | R17 | Community posts from API |
| 8 | 9 | R20 | Polish + consistency + build |
| 9 | 21 | All | Full E2E verification |
| **Total** | **100** | **20 requirements** | **Fully integrated Individual dashboard** |
