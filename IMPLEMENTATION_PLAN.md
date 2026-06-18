# Implementation Plan — Multi-Tenant API Migration

This plan maps the changes in **`API.md`** onto the current Vue 3 frontend
(`court-front`). The API moved from a single-tenant app (`admin` / `user`) to a
**multi-tenant** model: every account and all gameplay data belongs to an
**Organization (org)**, there are now **three roles** (`user`, `manager`,
`admin`), orgs carry **branding** (name + accent color) and a **status**
(`pending_payment` / `active` / `inactive`), and a large set of manager/admin
endpoints exist that the frontend does not yet call.

## Current state (baseline)

- `apiService.login(email, password)` — no `orgId`, no admin login.
- `authService` stores only `{ id, email, name, role }` in `localStorage` — no
  org context, no branding.
- `Signup.vue` posts `{ email, password, role: "user" }` — no `orgId`.
- `role === "admin"` is used as the privileged-operator flag (now `manager`)
  and only renders a badge (`Account.vue`, `ProfileDetails.vue`).
- No org picker, org creation, payment, status/read-only handling, theming, or
  manager/admin management screens.
- `apiService` is missing most write endpoints: game start/end/process,
  current-round, manager signup/leave, match requests, user management, all
  org/admin endpoints.
- `getGames` / `getLeaderboard` are public and pass **no** `orgId`.

---

## Phase 0 — Foundations

**Goal:** establish org/session state and branding so everything else can build
on it.

1. **Session/auth state (`authService.js`)**
   - Persist `org` (`{ id, name, accentColor, status }`) alongside the user.
   - Expose helpers: `getOrg()`, `getOrgStatus()`, `isReadOnly()` (true when
     `org.status === "inactive"`), `isManager()`, `isAdmin()`, `isUser()`.
   - `verifyAuthentication()` (`GET /api/auth/profile`) now returns `orgId`
     (and `orgId: null` + no `elo` for platform admins) — store accordingly.

2. **Branding / theming**
   - On login the API returns `org.accentColor` — apply it as a CSS custom
     property (e.g. `--accent`) at the app root so the theme reflects the org.
   - Add a small `useBranding` composable or do it in `App.vue` on auth change.
   - Reset/clear branding on logout.

3. **`apiService` plumbing**
   - Keep `credentials: "include"` everywhere (already done).
   - Add a single place to surface the **403 read-only** error
     (`"Organization is inactive (read-only)…"`) so the UI can show a banner.

---

## Phase 1 — Auth & org-aware login/signup

Endpoints: `POST /api/auth/login` (now needs `orgId`),
`POST /api/auth/admin/login`, `POST /api/auth/register` (now needs `orgId`),
`GET /api/orgs`, `GET /api/orgs/search`.

1. **`apiService`**
   - `login(orgId, email, password)` — add `orgId` to body.
   - `adminLogin(email, password)` → `POST /api/auth/admin/login`.
   - `registerUser({ orgId, email, password, username })` — add `orgId`.
   - `getOrgs()` → `GET /api/orgs`; `searchOrgs(q)` → `GET /api/orgs/search?q=`.

2. **`Login.vue`** — org-aware login
   - Add an **org picker** step: list/search loginable orgs (`active` +
     `inactive`) via `GET /api/orgs` / `search`. Badge `inactive` orgs as
     read-only.
   - Pass the chosen `orgId` into `authService.login`.
   - Handle new responses: **403** (admin used org login → point to admin
     login), **404** (org missing / `pending_payment`).
   - On success, apply branding and route by role.

3. **Admin login** — separate entry (route `/admin/login` or a toggle on
   `Login.vue`) calling `adminLogin`. Admins have no org and route to the admin
   console.

4. **`Signup.vue`** — require/carry `orgId`
   - User must pick their org (reuse the org picker) before registering.
   - Drop the hard-coded `role: "user"`; the API assigns it.
   - Handle **404** (org not `active`) and **409** (email/username taken in
     org).

5. **`authService.login`** — accept `orgId`, store returned `org` + branding.

---

## Phase 2 — Org status & read-only mode

Reference: "Org status & read-only mode" in `API.md`.

1. While `org.status === "inactive"`, show a persistent **read-only banner**
   ("This organization is read-only — a manager must reactivate it.").
2. Disable/hide all write affordances for users **and** managers (game signup,
   leave, match requests, profile edits, game management, branding edits). The
   only allowed manager write is reactivation.
3. Treat a **403** with the read-only message as a global, non-fatal error →
   show the banner rather than logging the user out.
4. `GET` requests stay fully functional in read-only mode.

---

## Phase 3 — Org creation & payment (public onboarding)

Endpoints: `POST /api/orgs`, `POST /api/orgs/:id/payment/simulate`.

1. **`apiService`:** `createOrg({ name, accentColor, managerEmail,
   managerPassword })`, `simulatePayment(orgId, sessionId)`.
2. **New page `CreateOrg.vue`** (public, e.g. `/create-org`):
   - Form: org name, accent color (hex, with a color picker + validation),
     first manager email/password.
   - On **201**, capture the simulated `payment.sessionId` and the org `id`.
3. **Payment simulation step** — call `simulatePayment` to flip the org to
   `active`, then direct the new manager to log in. Handle **409** (already
   paid/active) and **400** (invalid hex color).

---

## Phase 4 — Role rename: `admin` → `manager` (org operator)

The old single-tenant `admin` is now **`manager`**. Platform `admin` is a new,
separate world.

1. Replace `role === "admin"` privileged checks with `role === "manager"`:
   - `Account.vue:116` (`isAdmin` → `isManager`), delete-guard messaging
     (`account.adminCannotDelete` → manager self-delete guard).
   - `ProfileDetails.vue` role badge logic.
   - `apiService.createGame` JSDoc `@requires Admin` → manager.
2. Keep `"admin"` strictly for the **platform admin** console (Phase 6).
3. Add role-based nav (`Nav.vue`): managers see management entries; admins see
   the admin console; users see player views.

---

## Phase 5 — Manager features (org operator console)

These were absent from the frontend. Add `apiService` methods + UI.

1. **Game lifecycle** (manager): `PUT /api/games/:id/start`,
   `PUT /api/games/:id/end`, `PUT /api/games/:id/process` (winner + scores →
   ELO changes). Add a manager control panel on `GameDetails.vue` driving the
   `planned → started → ended → processed` state machine.
2. **Current round:** `GET /api/games/:id/current-round` (view, any member) and
   `PUT /api/games/:id/current-round` (manager set). Show current round during
   play.
3. **Manager participant control:** `POST /api/games/:id/signup/:userId`
   (force-add, `addedByManager`), `POST /api/games/:id/leave/:userId` (remove
   with optional reason; user cannot rejoin). Reflect "added by manager →
   cannot leave" in the participant UI.
4. **Create game:** already exists (`createGame`) — confirm no `orgId` is sent
   (server scopes to session) and gate behind `manager`.
5. **User management** (`GET/PUT/DELETE /api/users`, manager-scoped):
   - `getUsers()` → list org members.
   - `updateUser(id, { email, username, role, elo })` — managers can set
     `role` (`user`/`manager`, not own role, never `admin`) and `elo`.
   - `deleteUser(id)` — managers cannot delete themselves.
   - New **`ManageUsers.vue`** page (manager-only).
6. **Org branding self-service:** `GET /api/orgs/me`, `PUT /api/orgs/me`
   (name + accent color), `POST /api/orgs/me/reactivate` (simulated payment to
   lift read-only). New **`OrgSettings.vue`** (manager-only); reactivate is the
   one write allowed while inactive.

---

## Phase 6 — Match request system (any authenticated member)

Endpoints: `POST /api/games/:id/match-request`,
`GET /api/games/match-requests/incoming` (filter by `status`),
`PUT /api/games/match-requests/:requestId/respond`.

1. **`apiService`:** `sendMatchRequest(gameId, { requestedForUserId, message })`,
   `getIncomingMatchRequests(status?)`, `respondMatchRequest(requestId, status)`.
2. **UI:**
   - "Invite to match" action on player/profile views (`ProfileDetails.vue`,
     `PlayerList.vue`).
   - An **incoming requests** inbox (badge in `Nav.vue` for pending count);
     accept (auto-signs up) / reject.
   - Statuses: `pending` / `accepted` / `rejected` / `cancelled`.

---

## Phase 7 — Platform admin console (`/api/admin/*`)

Brand-new surface for `role === "admin"`. All require admin login.

1. **`apiService` (admin):**
   - Orgs: `getAdminOrgs()`, `getAdminOrg(id)`, `updateAdminOrg(id, body)`,
     `deactivateOrg(id)`, `reactivateOrg(id)` (no payment), `deleteOrg(id)`.
   - Managers: `getOrgManagers(id)`, `createOrgManager(id, body)`,
     `updateOrgManager(id, managerId, body)`, `deleteOrgManager(id, managerId)`.
   - Admins: `getAdmins()`, `createAdmin(body)`, `deleteAdmin(id)` (cannot
     delete self).
2. **UI (admin-only routes under `/admin`):**
   - **Orgs list** (`GET /api/admin/orgs`, every status) with badges and
     deactivate/reactivate/edit/delete actions.
   - **Org detail** — edit branding, manage manager accounts (CRUD).
   - **Admins** — list/create/delete platform admins (self-delete guarded).
3. Admins have **no** access to gameplay data — keep that surface hidden for
   them.

---

## Phase 8 — Org-scoped public reads

`GET /api/games` and `GET /api/player/leaderboard` are public and need `orgId`
when unauthenticated; logged-in callers use their session org.

1. **`apiService`:** `getGames(orgId?)`, `getLeaderboard(orgId?)` — append
   `?orgId=` only when provided / unauthenticated.
2. **`Home.vue` / `Leaderboard.vue`:** when not logged in, require an org
   (reuse org picker) before listing games / leaderboard; when logged in, omit
   `orgId`.

---

## Phase 9 — Routing & guards

`router/index.js` currently only checks `requiresAuth` via `localStorage`.

1. Add `meta.roles` (e.g. `["manager"]`, `["admin"]`) and enforce in
   `beforeEach` using `authService` role helpers.
2. New routes: `/create-org`, `/admin/login`, `/admin/*` (console),
   `/manage/users`, `/org/settings`, match-requests inbox.
3. Redirect by role after login: admin → `/admin`, manager → manager home,
   user → `/`.
4. Keep redirect-to-login behavior; add redirect-to-admin-login for admin
   routes.

---

## Phase 10 — i18n & polish

1. Add `en.js` / `nl.js` strings for: org picker, org creation, payment,
   read-only banner, manager console, match requests, admin console, new error
   messages (403 read-only, 403 admin-on-org-login, 404 org states).
2. Map new status codes to friendly messages (`409`, `422`, `403`, `404`).
3. Confirm `apiService` 401→refresh flow still works with the admin session.

---

## Endpoint → frontend coverage checklist

| Area | Endpoints | Status |
| ---- | --------- | ------ |
| Auth | login (+orgId), admin/login, register (+orgId), refresh, logout, profile | login/register/refresh/logout/profile exist; **add orgId + admin login** |
| Orgs (public) | `GET /orgs`, `GET /orgs/search`, `POST /orgs`, `POST /orgs/:id/payment/simulate` | **new** |
| Orgs (member) | `GET /orgs/me`, `PUT /orgs/me`, `POST /orgs/me/reactivate` | **new** |
| Admin orgs | list/get/update/deactivate/reactivate/delete | **new** |
| Admin managers | list/create/update/delete | **new** |
| Admin admins | list/create/delete | **new** |
| Users | list/get/update/delete (manager-scoped) | get/update/delete exist; **add list + role/elo** |
| Players | search, profile, leaderboard (+orgId) | exist; **add orgId to leaderboard** |
| Games (read) | list (+orgId), get, schedule, current-round | list/get/schedule exist; **add orgId + current-round** |
| Games (manager) | create, start, end, process, current-round set, signup/leave by userId | create exists; **add the rest** |
| Match requests | send, incoming, respond | **new** |
| History | games, game by id, elo, elo by user | all exist |

---

## Suggested ordering

Phases 0 → 1 → 2 are prerequisites for everything (session/org/branding,
org-aware auth, read-only). Phase 4 (role rename) is low-risk and unblocks
manager UI. Phases 3, 5, 6, 7, 8 are independent feature tracks and can be
parallelized. Phase 9 (guards) and Phase 10 (i18n) are finished alongside each
feature and verified at the end.
