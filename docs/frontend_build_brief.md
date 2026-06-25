# Relay Frontend — Build Brief for Claude Code

> Drop this in the repo (e.g. `context/frontend_build_brief.md`) and point Claude Code at it.
> It complements `CLAUDE.md` (process) and `context/frontend_spec.md` (the original admin-only design).
> **Read those plus the serializers and `apps/flows/validation.py` before writing code.**

---

## 0. What we're building

A **website** (browser SPA — nothing installed, you visit a URL) that is the admin console for Relay, the multi-tenant WhatsApp/Instagram chatbot platform. It lives in a new **`frontend/`** folder beside the existing Django project and talks to the DRF API over HTTP. The Django backend already exists and works — we are only building the frontend and wiring it to the live API.

The design is already validated (see `Frontend Handoff - Relay Admin Panel.html` and `design_screenshots/`). This brief is the spec for the production React version, including a role layer the original admin-only design didn't have.

---

## 1. Stack (latest stable)

- **React 19** + **Vite** + **TypeScript**
- **React Router v7** in *library mode* (SPA — no SSR/framework mode)
- **TanStack Query v5** for all server state
- **React Hook Form + Zod** for forms and validation
- **Plain CSS + design tokens** — NO Tailwind (matches the existing design system)
- No global state library; React Context for auth/role only

`frontend/.env`: `VITE_API_BASE_URL=http://localhost:8000`
CORS is already configured on the backend for `http://localhost:5173`, so the Vite dev server works out of the box.

---

## 2. The backend API (this is what you integrate against)

All endpoints except `/webhook/` require `Authorization: Bearer <access>`. Default permission is `IsAuthenticated`. List endpoints are paginated as `{count, next, previous, results}`, 50/page, up to 200 via `?page_size=`.

### Auth
| Action | Endpoint | Returns |
|---|---|---|
| Log in | `POST /api/auth/token/` | `{access, refresh}` (throttled 5/min) |
| Refresh | `POST /api/auth/token/refresh/` | `{access}` |
| Current user | `GET /api/me/` | `{id, username, email}` — **no role/tenant yet** (see §6) |

### Resources
| Resource | Endpoint | Notes |
|---|---|---|
| Tenants | `GET/POST/PATCH/DELETE /api/tenants/` | see fields below |
| Validate flow | `GET /api/tenants/{id}/validate/` | returns `validate_flow()` result — read `apps/flows/validation.py` for exact shape |
| Activate | `POST /api/tenants/{id}/activate/` | **returns 400 + validation payload if invalid** — surface those errors |
| Deactivate | `POST /api/tenants/{id}/deactivate/` | always allowed |
| Set tokens | `POST /api/tenants/{id}/set-tokens/` | body `{wa_access_token?, ig_access_token?}` — **write-only**, never returned |
| Flow steps | `GET/POST/PATCH/DELETE /api/flow-steps/?tenant={id}` | options embedded on each step |
| Flow options | `GET/POST/PATCH/DELETE /api/flow-options/?step={id}` | |
| Sessions | `GET /api/sessions/?tenant={id}` | read-only |
| Messages | `GET /api/messages/?session={id}` | read-only |
| Audit logs | `GET /api/audit-logs/` | read-only |

### Exact field shapes (from the serializers — use these for TS types)
```
Tenant:   id, name, wa_phone_number, wa_phone_number_id, ig_account_id,
          greeting_message, closing_message, handoff_enabled, handoff_email,
          is_active, created_at
          (access tokens are NEVER returned; write via set-tokens)

FlowStep: id, tenant, label, message_text, is_start, is_terminal, created_at, options[]
FlowOption: id, step, button_label (max 20 chars), next_step (FlowStep id | null)

Session:  id, tenant, channel ("whatsapp"|"instagram"), customer_identifier,
          current_step, status, started_at, updated_at
Message:  id, session, direction ("inbound"|"outbound"), content, channel,
          provider_message_id, sent_at
```

### Critical integration notes
- **`?tenant=` is a client-supplied filter, not enforcement.** Any authenticated user can pass any tenant id today. The frontend role-gating in this brief is **UX only** — real access control waits on the backend work in §6. Do not treat hidden buttons as security.
- The server is the **source of truth for flow validity.** A client-side validation mirror is fine for instant feedback, but bind "Activate" to the `activate` endpoint and show its response.
- On any `401`, call the refresh endpoint once and retry; if that fails, log out.

---

## 3. Roles (frontend contract)

Three roles. Until the backend returns role (§6), resolve the current role from a single swappable module (`src/auth/role.ts`) — stub it from an env var or a dev switcher now, swap to `/api/me/` later.

| Capability | Platform Admin | Support | Client |
|---|:---:|:---:|:---:|
| Dashboard + clients list | ✅ | ✅ | ❌ (lands in own account) |
| Create / delete client | ✅ | ❌ | ❌ |
| Edit settings (greeting/closing/handoff) | ✅ | ✅ | ✅ own |
| Manage channel tokens | ✅ | ✅ | ✅ own |
| Edit flow (steps/options) | ✅ | ✅ | ✅ own |
| Activate / deactivate bot | ✅ | ❌ | ❌ |
| View conversations | ✅ all | ✅ all | ✅ own |
| Audit log | ✅ | ❌ | ❌ |

Behaviour: Admin/Support are cross-tenant. **Client is single-tenant** — no clients list, no dashboard; route them straight to their own account detail. Gated actions render disabled with a short toast explaining why ("Activating the bot isn't available for your role").

---

## 4. Design system

Keep Relay's identity (blue, Plus Jakarta Sans), elevated as in the approved prototype.

```
--accent   admin #3a5fd9 · support #0c8577 · client #7c3aed   (accent shifts with role)
--bg #f4f5f7  --surface #ffffff  --border #e7e9ef
--ink #161a21  --ink2 #52596a  --ink3 #8b93a1
--ok #16835a  --warn #a8650f  --danger #c0392b
--side #12151c (dark sidebar)
radius 8 / 12 / 18
Fonts: Plus Jakarta Sans (UI), JetBrains Mono (step IDs, phone numbers)
```
Sidebar is dark; main content light for data density. Motion fast and purposeful; respect `prefers-reduced-motion`.

---

## 5. Screens (each wired to its endpoint)

1. **Login** — email/password → `POST /api/auth/token/`, then `GET /api/me/`. Split layout: dark brand panel + form.
2. **Dashboard** (Admin/Support) — stats derived from `GET /api/tenants/` (live/total, etc.) + client cards. Client role never sees this.
3. **Clients list** (Admin/Support) — table from `GET /api/tenants/`. "New client" → `POST /api/tenants/` (Admin only). Search/filter client-side is fine for v1 (1–10 tenants).
4. **Client detail** — header + tabs:
   - **Settings** → `PATCH /api/tenants/{id}/` for greeting_message, closing_message, handoff_enabled, handoff_email. Channels via `set-tokens` (write-only). Activate/Deactivate buttons (Admin only).
   - **Flow builder** (the centerpiece) → `GET /api/flow-steps/?tenant={id}`; create/update steps and options. Validation banner ← `GET /api/tenants/{id}/validate/`. Activate ← `POST .../activate/`. **Live phone preview** on the right that runs the flow from the loaded steps (tap a `button_label` → advance to `next_step`; `null` next_step = end). WhatsApp + Instagram skins.
   - **Conversations** → `GET /api/sessions/?tenant={id}` list + `GET /api/messages/?session={id}` thread, read-only.
5. **Audit log** (Admin) → `GET /api/audit-logs/`.

---

## 6. Two backend additions the frontend needs (flag, don't block on)

Build the whole UI now against the existing API; these two small backend changes unlock full fidelity and can land in parallel:

1. **Role + tenant on the user.** Add a `Profile` (OneToOne to `User`) with `role` (`admin|support|client`) and nullable `tenant` FK; return `role` and `tenant_id` from `GET /api/me/`; enforce role + tenant scoping in every viewset's permission + `get_queryset`. **This is what turns §3 from UX into real access control.** Until it ships, `src/auth/role.ts` stubs the role.
2. **Channel-connected booleans (optional).** `TenantSerializer` exposes no way to know if tokens are set (they're write-only). Add read-only `wa_connected` / `ig_connected` booleans so Settings can show a "connected" status instead of guessing.

---

## 7. Suggested structure
```
frontend/
  .env                      # VITE_API_BASE_URL
  src/
    lib/api.ts              # fetch client: base URL, bearer, refresh-on-401
    auth/                   # AuthContext, role.ts (swap point), <RequireAuth>, <RequireRole>
    queries/                # TanStack Query hooks: useTenants, useFlowSteps, useSessions, ...
    routes/                 # Router v7 route tree + guards
    screens/                # Login, Dashboard, Clients, ClientDetail (Settings/Flow/Conversations), Audit
    components/             # Card, Badge, Button, Toast, PhonePreview, StatCard, ...
    styles/tokens.css
```

## 8. Build order
1. Scaffold Vite+React+TS; add Router v7, TanStack Query v5, RHF+Zod; tokens.css; app shell + dark sidebar.
2. `lib/api.ts` + auth context + login + route guards. Milestone: log in with a Django superuser, stay logged in across refresh.
3. Tenants: dashboard + clients list + create + client settings (wired, with loading/error/empty states).
4. Flow builder + live phone preview.
5. Conversations + audit.
6. Role layer via `role.ts` (stubbed), then swap to `/api/me/` once §6.1 lands.
7. Responsive + a11y + reduced-motion pass.

## 9. Quality floor (non-negotiable)
Loading / error / empty states on every data view. Responsive to mobile. Visible keyboard focus. `prefers-reduced-motion` respected. Copy: sentence case, active-voice buttons ("Save changes", "Activate flow"), and the action keeps its name through to the toast ("Flow activated"). Errors say what happened and how to fix it.

## 10. Running both locally
```
# backend (repo root)
python manage.py migrate && python manage.py runserver   # :8000
python manage.py qcluster                                # worker, separate terminal
python manage.py createsuperuser                         # your login

# frontend
cd frontend && npm install && npm run dev                # :5173
```
