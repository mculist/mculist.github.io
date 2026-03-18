# MCUlist (Cloud Sync + Modern UI)

This version includes:
- Cloud storage (shared across devices)
- Modern UI refresh
- Auto light/dark based on browser/OS mode
- No manual theme button

## Files
- `index.html`
- `styles.css`
- `app.js`
- `config.js`

## Supabase setup (5 min)
1. Create a project at <https://supabase.com>
2. Open SQL Editor and run:

```sql
create table if not exists public.mculist_state (
  family_id text primary key,
  pin_hash text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.mculist_state enable row level security;

-- Simple open policy for family usage (easy mode)
create policy if not exists "anon_read" on public.mculist_state
for select to anon using (true);

create policy if not exists "anon_write" on public.mculist_state
for insert to anon with check (true);

create policy if not exists "anon_update" on public.mculist_state
for update to anon using (true) with check (true);
```

3. In Supabase project settings, copy:
   - Project URL
   - anon public key
4. Paste them in `config.js`
5. Commit files to your GitHub Pages repo

## Notes
- If `config.js` still has placeholders, app falls back to local storage.
- PIN is hashed for basic protection, but this is not military security.
