# React Native App Build Prompt – NyraAI Dashboard

Use this as the single prompt/spec for building a React Native (iOS + Android) app that matches the NyraAI Dashboard site and uses the same backend.

---

## Product identity

- **Name:** NYRAAI (or NyraAI).
- **Full title:** NYRAAI Dashboard - Clinic Management System.
- **Short tagline:** Professional clinic management system with role-based access control.
- **Keywords:** clinic, management, hospital, appointments, NYRAAI.

---

## Logo & favicon

- **Logo URL (current web):**
    `https://nyraai-main-website.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.c1949d52.png&w=64&q=75`
- Use this for app icon and in-app logo; for production, prefer a bundled asset or a stable CDN URL from the main site.
- **Favicon:** Same image, 64x64 PNG, used on web; use equivalent for splash/loading in the app.

---

## Look & feel (match the site)

- **Theme:** Hospital/clinical: clean, trustworthy, calm. Light and dark modes.
- **Primary color (teal):** HSL `198 55% 42%` (use for buttons, links, sidebar accent, key actions).
- **Light mode:**
    - Background: near white (`0 0% 100%`).
    - Foreground/text: dark slate (`210 25% 12%`).
    - Cards: very light grey (`0 0% 99%`), subtle borders.
- **Dark mode:**
    - Background: very dark (`0 0% 3%`).
    - Foreground: light (`210 12% 95%`).
    - Cards: dark grey (`0 0% 6%`).
- **Sidebar (when applicable):** Same primary teal for active/primary items; light/dark variants as above.
- **Font:** Prefer **Inter** (sans-serif). Fallback: system sans (e.g. -apple-system, Roboto).
- **Radius:** Slightly rounded (e.g. `0.625rem` / 10px) for cards and buttons.
- **Motion:** Subtle, professional (e.g. spring animations for modals/sheets). Avoid playful or distracting motion.
- **Extra (optional):** The web app uses a “glass” style (blur, light borders). In RN you can approximate with blur views and semi-transparent surfaces.

---

## Copy & UI text

- **Login:** Email or phone + password; “Forgot password?”; errors: “Invalid credentials”, “Session expired”, etc.
- **App title (in app bar/shell):** “NYRAAI Dashboard” or “NyraAI”.
- **Role-based sections (from Sidebar):**
    - Super Admin: Dashboard, Hospitals, Admins, Services, Virtual Numbers.
    - Main: Dashboard, Patients, Doctors, My Schedule (Doctor), History (Doctor), Appointments, Revenue.
    - NyraAI: Live Calls, Follow Up, Conversations, Reminders, Reminder Calls, Feedback, AI Usage.
    - Hospital: My Branch (Branch Admin), Users, Medications, Medical Sheets, Invoices, Analytics.
    - Config: Profile, Support, Contact Us.
- Use the same labels as in the web app for navigation and main actions so behavior is recognizable.

---

## Backend & endpoints

- **Base URL:** `https://server.nyraai.io` (configurable via env, e.g. `API_BASE_URL`).
- **Auth:**
    - Login: `POST /api/auth/login` (body: email/username/phone + password; optional branch_id for phone).
    - Response: `accessToken` (or `token`), `refreshToken`, `user`.
    - Use header: `Authorization: Bearer <accessToken>`.
    - Refresh: `POST /api/auth/refresh` with `{ refreshToken }` on 401; then retry request.
- **Full endpoint list:** See `REACT-NATIVE-MIGRATION.md` in this repo for every API group (auth, health, hospitals, branches, users, patients, appointments, queue, doctors, calls, conversations, notifications, super-admin, medications/treatments, medical sheets, invoices, analytics, settings, etc.). Implement an API client that:
  - Uses the base URL above.
  - Sends `Authorization: Bearer <token>` and `Content-Type: application/json` where needed.
  - Refreshes token on 401 and retries once.
  - Handles errors and timeouts (e.g. 30s) like the web app.

---

## Technical requirements for the app

- **Platforms:** iOS and Android.
- **Auth:** Secure storage for access + refresh token and user object; logout clears tokens.
- **Navigation:** Role-based: show only menu items allowed for the current user role (Super Admin, Hospital Admin, Branch Admin, Doctor, Receptionist, Manager).
- **Screens:** Cover at least: Login, Dashboard (stats + quick actions), Patients, Doctors, Appointments, Revenue, Live Calls, Follow Up, Conversations, Reminder Calls, Feedback, Users, Medications, Medical Sheets, Invoices, Analytics, Profile, Support, Contact; for Super Admin add: Hospitals, Admins, Services, Virtual Numbers. Detail/edit screens as needed (patient by id, appointment by id, etc.).
- **Data:** All from REST API; no local-only data for core entities. Use the same query params and request bodies as documented in `REACT-NATIVE-MIGRATION.md`.

---

## Summary checklist for the build

- [ ] App name: NYRAAI / NyraAI; title “NYRAAI Dashboard - Clinic Management System”.
- [ ] Logo/icon from given URL or bundled asset.
- [ ] Theme: primary teal HSL(198, 55%, 42%), light/dark, Inter (or system sans).
- [ ] Login with email or phone + password; forgot/reset via backend.
- [ ] API base: https://server.nyraai.io; all endpoints as in REACT-NATIVE-MIGRATION.md.
- [ ] Token auth + refresh on 401; secure token storage.
- [ ] Role-based navigation and screens matching the sidebar structure above.
- [ ] Same copy and section names as the web dashboard.
