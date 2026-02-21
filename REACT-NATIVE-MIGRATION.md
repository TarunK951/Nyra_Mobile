# NyraAI Dashboard → React Native Migration Guide

This document describes how to rebuild the NyraAI Dashboard as a React Native app (iOS + Android) and how the backend and APIs work so everything keeps working in the app.

---

## 1. Project Overview

- **Current stack:** Next.js 16, React 19, Tailwind CSS, Framer Motion, React Query, Redux.
- **Backend:** External API at **https://server.nyraai.io** (override via `NEXT_PUBLIC_API_BASE_URL`).
- **App type:** Clinic/hospital management dashboard with role-based access (Super Admin, Hospital Admin, Branch Admin, Doctor, Receptionist, Manager).

---

## 2. Backend Configuration

### Base URL

- **Production:** `https://server.nyraai.io`
- **Override:** Set `NEXT_PUBLIC_API_BASE_URL` (or equivalent in RN, e.g. `API_BASE_URL`) for staging/dev.

### Authentication

- **Login:** `POST /api/auth/login`
    Body: `{ email, password }` or `{ username, password }` or `{ phone, password }` (optional `branch_id` for phone).
- **Token storage:** After login, store:
  - `accessToken` (or `token`) → use as `Authorization: Bearer <token>`
  - `refreshToken` (or `refresh_token`)
  - `user` object (id, role, hospitalId, branchId, etc.)
- **Refresh:** On 401, call `POST /api/auth/refresh` with `{ refreshToken }`. Response contains new `accessToken` and optionally new `refreshToken`. Update stored tokens and retry the failed request.
- **Logout:** `POST /api/auth/logout` (optional; clear tokens locally in any case).

### Request behavior (web vs app)

- **Web:** Browser calls Next.js same-origin routes; Next.js proxies to `server.nyraai.io` (e.g. `/api/proxy/...`) to avoid CORS.
- **React Native:** Call **https://server.nyraai.io** directly. No proxy needed; ensure backend allows your app (e.g. via CORS or native origin). Attach `Authorization: Bearer <token>` and `Content-Type: application/json` where applicable.

### Special routes that use Next.js (not backend)

- Forgot password: Next.js route that then calls backend (`/api/auth/forgot-password`, reset, etc.).
- In RN, call backend directly:
    `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, etc., as in `lib/backendApi.js`.

---

## 3. API Modules & Endpoints (from `lib/backendApi.js`)

All paths are relative to base URL `https://server.nyraai.io`. Use GET unless stated.

### Auth

| Method | Endpoint | Notes |
|--------|----------|--------|
| POST | `/api/auth/register` | Body: userData |
| POST | `/api/auth/login` | email/username/phone + password |
| POST | `/api/auth/refresh` | Body: { refreshToken } |
| POST | `/api/auth/refresh-token` | Alternative refresh (same idea) |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/change-password` | currentPassword, newPassword, confirmPassword |
| PUT | `/api/auth/profile/professional` | Professional details |
| GET | `/api/auth/preferences` | |
| PUT | `/api/auth/preferences` | |
| GET | `/api/auth/sessions` | |
| DELETE | `/api/auth/sessions/:sessionId` | |
| DELETE | `/api/auth/sessions/other` | |
| PUT | `/api/auth/profile/notifications` | |
| POST | `/api/auth/forgot-password` | Body: { email } |
| POST | `/api/auth/forgot-password/send-otp` | email or phone |
| POST | `/api/auth/forgot-password/verify-otp` | otp, newPassword |
| POST | `/api/auth/reset-password` | token, newPassword, confirmPassword |
| POST | `/api/auth/logout` | |

### Health

| Method | Endpoint |
|--------|----------|
| GET | `/api/health` |

### Hospitals

| Method | Endpoint |
|--------|----------|
| GET | `/api/hospitals` |
| GET | `/api/hospitals/by-phone?phone=` |
| GET | `/api/hospitals/validate-token?token=` |
| GET | `/api/hospitals/:id` |
| GET | `/api/hospitals/:id/stats` |
| GET | `/api/hospitals/:id/branches` |
| GET/PUT | `/api/hospitals/:id/settings` |
| GET | `/api/hospitals/:id/users` |
| GET | `/api/hospitals/:id/analytics` |
| POST | `/api/hospitals` |
| PUT | `/api/hospitals/:id` |
| DELETE | `/api/hospitals/:id` |
| POST | `/api/hospitals/generate-token` |
| POST | `/api/hospitals/revoke-token` |

### Branches

| Method | Endpoint |
|--------|----------|
| GET | `/api/branches` (query params) |
| GET | `/api/branches/:id` |
| POST | `/api/branches` |
| PUT | `/api/branches/:id` |
| GET/PUT | `/api/branches/:id/settings` |
| GET | `/api/branches/:id/users` |
| GET | `/api/branches/:id/stats` |
| GET/PUT | `/api/branches/:id/operating-hours` |

### Users

| Method | Endpoint |
|--------|----------|
| GET | `/api/users` (query params) |
| GET | `/api/users/:id` |
| GET | `/api/users/by-phone/:phone` |
| GET | `/api/users/hospital-admin` |
| GET | `/api/users/branch-admin` |
| GET | `/api/users/staff` |
| POST | `/api/users` |
| POST | `/api/users/patient` |
| POST | `/api/users/staff` |
| PUT | `/api/users/:id` |
| DELETE | `/api/users/:id` |
| GET/PUT | `/api/users/:id/permissions` |
| GET | `/api/users/by-role/:role` |
| GET | `/api/users/by-hospital/:hospitalId` |
| GET | `/api/users/by-branch/:branchId` |

### Patients

| Method | Endpoint |
|--------|----------|
| GET | `/api/patients` (query params) |
| GET | `/api/patients/:id` |
| GET | `/api/patients/by-phone/:phone` |
| GET | `/api/patients/:id/summary` |
| GET | `/api/patients/:id/call-preferences` |
| PATCH | `/api/patients/:id/call-preferences` |
| GET | `/api/patients/search` (query) |
| POST | `/api/patients` (create/upsert) |
| PUT | `/api/patients/:id` |
| PATCH | `/api/patients/field` |
| DELETE | `/api/patients/:id` |
| POST | `/api/patients/:id/generate-uhid` |
| GET/POST | `/api/patients/:id/attendants` |
| GET/POST | `/api/patients/:id/identities` |
| POST | `/api/patients/:id/identities/:identityId/verify` |
| GET | `/api/patients/:id/consents` |
| GET | `/api/patients/:id/medication-history` |
| GET | `/api/patients/:id/history` |
| GET | `/api/patient-history/:id` |

### Audit logs

| Method | Endpoint |
|--------|----------|
| GET | `/api/audit-logs` (query) |
| GET | `/api/audit-logs/:id` |

### Appointment queue

| Method | Endpoint |
|--------|----------|
| GET | `/api/appointment-queue` |
| POST | `/api/appointment-queue` |
| GET | `/api/appointment-queue/doctor/:doctorId` |
| POST | `/api/appointment-queue/call-next/:doctorId` |
| POST | `/api/appointment-queue/:queueId/start-consultation` |
| POST | `/api/appointment-queue/:queueId/complete-consultation` |
| POST | `/api/appointment-queue/:queueId/mark-no-show` |
| GET/PATCH | `/api/appointment-queue/:queueId/status` |
| GET | `/api/appointment-queue/waiting-room` (query) |
| DELETE | `/api/appointment-queue/:queueId` |

### Appointments

| Method | Endpoint |
|--------|----------|
| GET | `/api/appointments` (query) |
| GET | `/api/appointments/calendar` (query) |
| GET | `/api/appointments/by-user/:userId` (query) |
| GET | `/api/appointments/:id` |
| GET | `/api/appointments/:id/status` |
| PATCH | `/api/appointments/:id/status` |
| PUT | `/api/appointments/:id` |
| PATCH | `/api/appointments/field` |
| POST | `/api/appointments/:id/reschedule` |
| GET | `/api/appointments/:id/reschedule-history` |
| POST | `/api/appointments/:id/confirm` |
| POST | `/api/appointments/:id/cancel` |
| GET | `/api/appointments/:id/reminder-details` |

### Calls

| Method | Endpoint |
|--------|----------|
| POST | `/api/call/start` |
| POST | `/api/call/outbound` |
| POST | `/api/call/end` |
| POST | `/api/call/bulk` |
| GET | `/api/call/recording/:recordingId` |
| GET | `/api/calls/live` |
| GET | `/api/calls/:callId/audio` |

### Doctors

| Method | Endpoint |
|--------|----------|
| GET | `/api/doctors` (query) |
| GET | `/api/doctors/:id` |
| GET | `/api/doctors/slots` |
| GET | `/api/doctors/slots/branch?branch_id=` |
| GET | `/api/doctors/:id/available-slots` (query) |
| GET/PUT | `/api/doctors/:id/availability` |
| GET | `/api/doctors/:id/queue` |
| GET | `/api/doctors/:id/dashboard` |
| GET | `/api/doctors/:id/appointments` |
| GET | `/api/doctors/:id/patients/:patientId/history` |
| GET | `/api/doctors/:id/leaves` (query) |
| GET/PUT | `/api/doctors/:id/schedule-template` |
| GET | `/api/doctors/:id/stats` |
| GET | `/api/doctors/:id/financials` |

### Sessions & conversations

| Method | Endpoint |
|--------|----------|
| GET | `/api/sessions/:id` |
| GET | `/api/conversations?status=live` |
| GET | `/api/conversations/user/:userId` |
| GET | `/api/conversations/:sessionId/transcript` |
| GET | `/api/conversations/appointment/:appointmentId` |
| GET | `/api/conversations/:id` |
| GET | `/api/conversations/:id/audio` |
| GET | `/api/transcripts/:sessionId` |

### Feedback, missed calls, SIP, notifications

| Method | Endpoint |
|--------|----------|
| GET | `/api/feedback/:id` |
| GET | `/api/feedback/by-appointment/:appointmentId` |
| GET | `/api/missed-calls` |
| GET | `/api/sip-trunks` |
| GET/POST/PUT/DELETE | `/api/sip-trunks/:id` |
| GET | `/api/notifications` (query) |
| PUT | `/api/notifications/:id/read` |
| PUT | `/api/notifications/read-all` |
| DELETE | `/api/notifications/:id` |
| POST | `/api/notifications` |
| GET | `/api/notifications/unread-count` |

### Super Admin

| Method | Endpoint |
|--------|----------|
| GET | `/api/super-admin/services` |
| POST | `/api/super-admin/services` |
| PATCH | `/api/super-admin/services/:id/status` |
| GET | `/api/super-admin/statistics` |
| GET | `/api/super-admin/stats` |
| GET | `/api/super-admin/analytics` (query) |
| GET | `/api/super-admin/appointments` (query) |
| GET | `/api/super-admin/calls` (query) |
| GET | `/api/super-admin/revenue` (query) |

### Virtual numbers

| Method | Endpoint |
|--------|----------|
| GET | `/api/virtual-numbers` (query) |
| GET | `/api/virtual-numbers/:id` |
| POST | `/api/virtual-numbers` |
| PUT | `/api/virtual-numbers/:id` |
| DELETE | `/api/virtual-numbers/:id` |

### Medicines & treatments (medications catalog)

| Method | Endpoint |
|--------|----------|
| GET | `/api/medicines` (query) |
| GET | `/api/medicines/:id` |
| POST | `/api/medicines` |
| PUT | `/api/medicines/:id` |
| DELETE | `/api/medicines/:id` |
| GET | `/api/treatments` (query) |
| GET | `/api/treatments/:id` |
| POST | `/api/treatments` |
| PUT | `/api/treatments/:id` |
| DELETE | `/api/treatments/:id` |
| GET | `/api/treatments/:id/history` |

### Upload & search

| Method | Endpoint |
|--------|----------|
| POST | `/api/upload` | FormData or JSON (base64) |
| GET | `/api/search` (query: q, type) |

### Medical sheets

| Method | Endpoint |
|--------|----------|
| GET | `/api/medical-sheets/:id` |
| GET | `/api/patients/:patientId/medical-sheets` |
| GET | `/api/medical-sheets/appointment/:appointmentId` |
| GET | `/api/medical-sheets/:id/pdf` |
| GET | `/api/medical-sheets/:id/versions` |
| GET | `/api/medical-sheets/:id/versions/:version` |
| (POST/PUT/DELETE as in backend) | |

### Invoices

| Method | Endpoint |
|--------|----------|
| GET | `/api/invoices` (query) |
| GET | `/api/invoices/:id` |
| GET | `/api/invoices/:id/pdf` |
| GET | `/api/invoices/:id/versions` |
| GET | `/api/invoices/:id/versions/:version` |
| GET | `/api/invoices/:id/clinical-data` |
| (POST/PUT as in backend) | |

### Analytics & settings

| Method | Endpoint |
|--------|----------|
| GET | `/api/analytics/allowed` |
| GET | `/api/settings` |
| GET/PUT | `/api/settings/clinic` |
| GET/PUT | `/api/settings/revenue` |
| GET/PUT | `/api/settings/notifications` |
| GET/PUT | `/api/settings/general` |
| GET/PUT | `/api/settings/dashboard` |

### Reminders & support

| Method | Endpoint |
|--------|----------|
| GET | `/api/reminder-calls/:id` |
| GET | `/api/reminder-calls/queue` |
| GET | `/api/support/:id` |
| GET | `/api/support/tickets/:id` |
| (POST as in backend) | |

### Charges & audit

| Method | Endpoint |
|--------|----------|
| GET | `/api/charges/:id` |
| GET | `/api/audit-logs/:id` |

---

## 4. Environment Variables (for React Native)

- `API_BASE_URL` – Backend base URL (default `https://server.nyraai.io`).
- Optional: separate keys for feature flags or analytics; the web app uses `NEXT_PUBLIC_*` for anything client-side.

---

## 5. What to Rebuild in React Native

1. **API client**
     Port the logic from `lib/backendApi.js`: one `apiRequest()` that adds `Authorization: Bearer <token>`, handles 401 with refresh, then retries. Call `BASE_URL + endpoint` directly (no Next.js proxy).
2. **Auth**
     Login (email/phone + password), store tokens (e.g. secure store), refresh on 401, logout (clear tokens + optional `POST /api/auth/logout`).
3. **Navigation**
     Mirror `components/Sidebar.jsx` menu structure: role-based tabs/screens (Super Admin vs Main vs NyraAi Management vs Hospital Management vs Configuration).
4. **Screens**
     One screen (or stack) per dashboard route: Dashboard, Patients, Doctors, Appointments, Revenue, Live Calls, Follow Up, Conversations, Reminder Calls, Feedback, AI Usage, Users, Medications, Medical Sheets, Invoices, Analytics, Profile, Support, Contact, and Super Admin screens (Dashboard, Hospitals, Admins, Services, Virtual Numbers).
5. **State**
     Replace Next.js + React Query + Redux with RN state (e.g. React Query + Context or Redux) using the same API calls as above.
6. **Next.js-specific**
     Replace Next.js API routes (e.g. forgot/reset password, proxy) with direct backend calls; replace any server-only logic with backend endpoints or a small BFF if you keep one.

---

## 6. Files to Use as Reference

- **API & auth:** `lib/backendApi.js` (all modules and `apiRequest`), `lib/api/utils.js` (buildQueryString, createEndpoint).
- **Auth flow & UI:** `app/login/page.jsx`, `components/AuthContext.jsx`.
- **Navigation & roles:** `components/Sidebar.jsx` (menuItems by role).
- **Layout & theme:** `app/layout.jsx`, `app/globals.css`, `tailwind.config.js`.
