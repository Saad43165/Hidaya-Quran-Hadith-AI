# KitaabAI Backend (Phase 3 skeleton)

A minimal FastAPI backend that verifies Firebase ID tokens from the Expo
app, plus a real working `/profile/me` endpoint proving the auth flow is
correctly wired end-to-end. The `/assistant/chat` endpoint is scaffolded
with its final request/response contract but intentionally returns
`501 Not Implemented` until Phase 4, when it calls Groq/Llama.

## Why a backend at all?

The Groq API key must never live in the mobile app bundle — anyone can
extract strings from a compiled app. This backend exists specifically to
hold that key server-side and proxy requests, plus (later) to store
synced reading progress and bookmarks per user.

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

You need two things from your Firebase project:
1. **Project ID** — Firebase console → Project Settings → General
2. **Service account key** — Project Settings → Service Accounts →
   "Generate new private key" → save the downloaded JSON as
   `service-account.json` in this `backend/` folder (already gitignored —
   never commit this file)

Fill both into `.env`.

## Running locally

```bash
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive Swagger docs.

Test the protected route by getting an ID token from the Expo app
(`await getAuth().currentUser.getIdToken()`) and calling:

```bash
curl http://localhost:8000/profile/me \
  -H "Authorization: Bearer <the-id-token>"
```

## Connecting the Expo app to this backend

In the Expo app's `.env`, set:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```
(or your deployed URL, e.g. on Render/Railway/Fly.io, once you deploy it).

## What's here vs. what's next

- ✅ `/health` — liveness check
- ✅ `/profile/me` — real, working Firebase token verification
- 🔜 `/assistant/chat` — contract defined, Groq call added in Phase 4
- 🔜 A database (Postgres/Firestore) for synced bookmarks & reading
  progress — Phase 5
