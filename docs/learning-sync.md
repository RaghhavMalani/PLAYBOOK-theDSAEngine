# Learning-state backup and sync

The app always reads and writes learning data in browser `localStorage` first. Cloud sync is
optional: signing out, losing the network, or not configuring a backend does not disable any
drill or erase local progress.

## Portable JSON

The Mistake log view can download and restore the complete schema-versioned learning state.
Version 2 includes mistakes, Leitner boxes, mastery/Arena/grounded-interview attempts,
confidence, target companies, interview dates, the current daily plan, whiteboard outcomes and
recovery queues. Version 1 exports remain importable and are migrated on read. Import validates
every category before writing any of them.

## Enable authenticated sync

1. Create a Supabase project and run [`supabase-learning-sync.sql`](./supabase-learning-sync.sql)
   in its SQL editor.
2. In Authentication settings, enable email/password sign-in. Decide whether new users must
   confirm email before their first sign-in.
3. Copy `.env.example` to `.env.local` and set the project URL and public anonymous key. On
   Vercel, add the same two build-time environment variables.
4. Rebuild/redeploy. The Mistake log view will show create-account, sign-in and sync controls.

The anonymous key is intentionally public; Supabase Row Level Security is the authorization
boundary. Every select/insert/update policy requires `auth.uid() = user_id`, so one signed-in
account cannot read another account's row. Do not put the service-role key in a `VITE_` variable.

Each category has its own last-modified timestamp. Sync pulls the newer category from either
device, applies the merged snapshot locally, then uploads it. Writes made while offline remain
local and automatically sync after the browser reconnects. This is authenticated cloud storage,
not end-to-end encryption; use JSON-only mode if the backend should never receive the data.

## Offline installation

Production builds generate a service worker whose precache list comes from Vite's actual output,
including lazy chunks such as Replay lab. The manifest exposes shortcuts for Today, Drill,
Patterns and Replay lab. Navigation uses network-first fallback; versioned assets use
stale-while-revalidate. API and authentication requests are never cached.

The authored drills, primers, patterns and replay traces work offline after the service worker
installs. Arbitrary Python execution also works offline after the local Pyodide bundle has been
added under `public/pyodide` and loaded once; the CDN fallback cannot work without a network.

