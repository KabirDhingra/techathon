# SurakshaSetu

A complete, user-focused safety and opportunity platform for waste workers and their families. The app combines verified digital identity, emergency response, AI assistance in Hindi/English/Hinglish, hazard detection guidance, work records, welfare information and municipal analytics — with offline fallbacks so every demo flow works without API keys.

## Run it

No `npm install`, build step or external service is required. You only need Node.js 18+.

```bash
cd surakshasetu
node server.js
```

Open <http://localhost:4173>.

Set `PORT` to use another port, and `SS_DATA_DIR` to move the JSON data files:

```bash
PORT=8080 SS_DATA_DIR=/tmp/surakshasetu-data node server.js
```

### Optional AI providers

The app works without any AI key. To enable a real chatbot, set one or more of:

- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `HF_API_TOKEN` or `HUGGINGFACE_API_TOKEN`

If all providers fail, the built-in safety assistant still answers.

### Optional free SMS (Firebase Phone Authentication)

Phone verification uses a local OTP by default. For real SMS delivery on the free Spark tier, set:

- `FIREBASE_API_KEY` (a Firebase web API key)
- `FIREBASE_PROJECT_ID` (optional, derived from the key's project)
- `FIREBASE_AUTH_DOMAIN` (optional, defaults to `<project>.firebaseapp.com`)

Add your deployment domain to the Firebase project's authorised domains. When these variables are not set, the app falls back to the demo OTP flow.

### Offline support

The app caches the last dashboard and recent GET responses in IndexedDB and queues POST actions while offline, syncing them automatically when connectivity returns (including via the service worker background sync).

### Vercel deployment

1. Create a Postgres database (Neon or Supabase).
2. Set `POSTGRES_URL`, `SS_SECRET`, and any optional AI keys in Vercel.
3. (Optional) Set the Firebase variables above for real SMS.
4. Deploy with `vercel deploy`. Vercel builds the React frontend from `client/`
   (`buildCommand` / `outputDirectory` are set in `vercel.json`) and routes
   `/api/*` to the serverless backend in `api/index.js`.

### Local development

Backend (port 4173):
\`\`\`bash
PORT=4173 SS_DATA_DIR=/tmp/ss-data node server.js
\`\`\`

Frontend (port 5173, proxies `/api` to the backend):
\`\`\`bash
cd client && npm install && npm run dev
\`\`\`

Build the frontend for production:
\`\`\`bash
cd client && npm run build
\`\`\`

Run tests:
\`\`\`bash
npm test                          # backend API tests
cd client && npm test             # frontend lib tests (Vitest)
\`\`\`

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Worker | `worker@demo.in` | `Demo@123` |
| Admin (MCD) | `admin@surakshasetu.in` | `Admin@123` |

New accounts use a demo OTP/code shown directly on screen. All codes are also written to the server console. Set `SS_DEMO_MODE=false` to hide the on-screen code (production-style); the code still appears in server logs.

## What is included

### For workers and families
- **Authentication** — signup, sign-in, 6-digit OTP verification, forgot/reset password, onboarding, session persistence.
- **Dashboard** — shift summary, collected weight, reports, points, quick actions, language and theme controls.
- **AI Saathi** — deterministic Hindi/English/Hinglish assistant with speech input/output, suggested questions, and safe local fallback answers when offline.
- **Safety centre** — daily PPE checklist, training lessons, waste-segregation guide, incident reporting, and emergency number directory.
- **Hazard scanner** — camera/upload scan with a deterministic local image analyser, risk triage,hands-on guidance, manual category selection, and a handoff to AI Saathi.
- **SOS** — hold-to-send emergency action, GPS capture when available, WhatsApp/SMS share links, direct 112 call, offline queueing, and offline awareness.
- **Digital ID** — verified worker card with QR code, printable view, WhatsApp sharing, WID lookup and public verification with privacy controls.
- **Work & rewards** — collection logging with GPS, nearby recycling centres (offline verified list plus optional live OpenStreetMap lookup), work history with CSV export, points, levels and achievements.
- **Opportunities** — eligibility hints for five welfare schemes, free health camp registration/cancellation, community stats and safety tips.
- **Account & privacy** — profile editing, phone OTP verification, photo upload, five sharing toggles, theme/contrast/speech preferences, and personal data export.
- **Offline support** — service-worker app-shell cache, queued actions, AI/checklist/guidance fallbacks, and a dedicated sync screen.
- **Help centre** — FAQ, emergency numbers and guidance.

### For municipal admins
- **MCD command centre** — worker/incident/SOS/scan/check totals, incident trend, hazard mix, material recovery, zone risk snapshot, incident status updates and a worker directory.

## Architecture

- **Backend**: zero-dependency Node.js HTTP server (`src/http.js`, `src/router.js`), signed HMAC session tokens (`src/crypto.js`), file-backed JSON database (`src/db.js`) and modular routes/services under `src/routes` and `src/services`.
- **Frontend**: dependency-free vanilla JS SPA (`public/app.js`, `public/js/core.js`, `public/js/pages/*`), hash routing, responsive original UI in `public/styles.css`, service worker in `public/sw.js`, and a small local QR library in `public/vendor/qrcode.min.js`.
- **Feature content** (schemes, lessons, camps, hazards, tips and emergency numbers) lives in `src/content.js`.
- **Persistence**: data and sessions are written to `data/` inside the app directory by default. Delete that directory to reset to seed data.

All external references (official scheme sites, Google Maps directions, live centre lookup) are optional. The app remains fully functional with no network beyond the local server.

## Verification

Run the API suite with the portable or system Node.js binary:

```bash
node --test tests/api.test.js
```

All frontend JavaScript can be syntax-checked with:

```bash
node --check public/app.js
```

## Notes

- The public worker verification page intentionally shows only name, worker ID, work category, area and issue date. Phone sharing is off by default and controlled in Privacy.
- The schematic centre map is informational; use the directions link for navigation.
- Live OpenStreetMap centre lookup is best-effort and falls back to curated verified Delhi centres.
- The hazard scanner uses deterministic local image heuristics, not a cloud vision model. It is designed to give conservative first-aid guidance, not a medical or legal determination.
- This is a demo/prototype implementation with local JSON persistence and signed sessions; configure HTTPS, a managed database, rate limiting and proper OTP/SMS delivery before production deployment.
