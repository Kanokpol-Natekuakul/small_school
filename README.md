# Smart School Office V.2

React + TypeScript + Vite app for school office workflows, with either Supabase-backed data or a local mock mode for offline/demo use.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in your Supabase URL and anon key.
3. Pick a backend mode:
   - `VITE_BACKEND_MODE=auto` uses Supabase when the env vars are present, otherwise falls back to the local mock database.
   - `VITE_BACKEND_MODE=supabase` forces Supabase.
   - `VITE_BACKEND_MODE=mock` forces the local mock database.
4. Run `supabase/install.sql` in the Supabase SQL Editor to create the schema and seed the app tables.
5. If your Supabase project already exists and you only need to fix login, run `supabase/scratch/fix_supabase_profiles.sql` once in the SQL Editor.
6. Create users in Supabase Auth. The app will create the matching `public.profiles` row automatically on first login if it is missing.
7. If you want the bundled demo accounts with preset roles, provision them with `supabase/scratch/seed_demo_auth_users.mjs` from a trusted machine using your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Demo logins

Use `password123` for the bundled demo accounts:

- `admin@school.go.th`
- `director@school.go.th`
- `registrar@school.go.th`
- `teacher@school.go.th`
- `staff@school.go.th`

## Local Development

```bash
npm install
npm run dev
```

## Notes

- `supabase/seed.sql` and `supabase/install.sql` seed the public tables only; auth users are created in Supabase Auth, and missing profile rows are auto-created on first login.
- The Settings page shows which backend mode is currently active and whether Supabase env vars are present.
