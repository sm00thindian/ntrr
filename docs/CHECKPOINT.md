# NTRR — Resume checkpoint

**Saved:** July 7, 2026  
**Status:** Paused — Google integration testing blocked on OAuth test users

---

## What's done

| Area | Status |
|------|--------|
| M0 Foundation | Complete |
| M1 Family (invites, roles) | Complete |
| M2 Tasks (board, recurring, realtime) | Complete |
| M3 Google sync (code) | Complete — OAuth connect, calendar/tasks sync, outbox, conflicts UI |
| Household create/read bug | Fixed (table grants + UI refresh) |
| UI branding | `ntrr●` logo, `[N]` favicon, green accents, dark sidebar |
| Fonts | Courier Prime — logos/headers; Verdana — body |
| Service worker / hard refresh | Fixed — no longer caches `/_next/` chunks |

---

## Where you left off

**Goal:** Test Google Calendar + Tasks sync (Settings → Connect Google)

**Blocked at:** Google OAuth consent — `Error 403: access_denied`  
*"ntrr has not completed the Google verification process"*

**Likely fix when you return:**
1. Google Cloud → OAuth consent screen → **Audience** → **Test users**
2. Add the **exact** Gmail shown on Google's error screen (not just your Cloud Console login)
3. Retry in incognito with only that Gmail signed in

**Redirect URI (must match exactly):**
```
http://localhost:3000/api/integrations/google/callback
```

**APIs enabled:** Google Calendar API, Google Tasks API

---

## `.env.local` — what you need

Already set:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Add for Google sync (if not already):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `INTEGRATION_ENCRYPTION_KEY` (optional, recommended)

Restart `npm run dev` after any `.env.local` change.

---

## Resume commands

```bash
cd /Users/kilynn/Projects/ntrr
npm run db:start    # if Docker/Supabase not running
npm run dev
```

- App: http://localhost:3000
- Mailpit (magic links): http://127.0.0.1:54324
- Supabase Studio: http://127.0.0.1:54323

---

## Next steps (in order)

1. Fix Google OAuth test user → connect in **Settings**
2. **Sync now** → verify tasks/events pull in
3. Create a task in NTRR → confirm it pushes to Google Tasks
4. **M4** — Apple CalDAV + Zapier + unified dashboard

---

## Not set up yet (optional)

- Google **login** on sign-in page (separate from integration OAuth; magic link works fine)
- `SYNC_CRON_SECRET` / automated cron sync (manual "Sync now" is enough for now)