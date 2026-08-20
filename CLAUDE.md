# The Vault — Context for Claude Code

Inventory management app for House of Gold (a jewelry shop). Built by Ledjan Miçani, a junior developer who is actively learning — this file exists to keep you aligned with how he works, not just what the app does.

## The one rule that matters most

**Ledjan must be able to explain every line you write, before it's accepted.**
Only write patterns he has already built by hand elsewhere in this codebase or explicitly approved. If a task requires a genuinely new pattern he hasn't used before (a new React hook behavior, a new library, a new architectural shape), **stop and flag it** rather than writing it — he wants to learn it deliberately, not receive it as a fait accompli. Prefer explaining an approach in plain language first, and only writing code once he confirms he understands the shape.

Do not:

- Refactor working code "for cleanliness" unless asked
- Introduce new dependencies without flagging it first
- Silently fix things adjacent to the actual task
- Write more than what was asked for a given step

## Tech stack

- React (JavaScript, not TypeScript — TS is deliberately deferred to a later phase)
- Vite
- Tailwind CSS v4 (`@theme` tokens in `App.css`, composed variant objects in `src/styles/themes.js`)
- React Router (`react-router`, not `react-router-dom`)
- Supabase (Postgres, Auth, Storage) via `@supabase/supabase-js`
- `browser-image-compression` for client-side photo compression

## Architecture facts — do not violate these

- **Reads go through `items_view`, never `items` directly.** The view masks `cost` to `NULL` for non-admin sessions via RLS-aware logic. Querying `items` directly for display would leak `cost` to sellers.
- **Writes (insert/update/delete) go to `items` directly.** RLS policies on `items` already restrict writes to admin-role sessions.
- **RLS is the real security boundary, not the UI.** Hiding a button is a UX nicety; the database policy is what actually enforces admin-vs-seller. Never assume UI-only restriction is sufficient.
- **`profiles` table holds `id` (matches `auth.users.id`) and `role` (`admin` | `seller`).** Nothing else. Don't add fields to it without discussion.
- **Money fields are `numeric`, never treated as floats.**
- **Nothing is hard-deleted.** "Delete" sets `items.status = 'deleted'`.
- **`session` state lives in `App.jsx`**, populated via `supabase.auth.onAuthStateChange`. Don't build a separate/parallel auth-state mechanism.
- **The Supabase client is a single exported instance** from `src/lib/supabaseClient.js`. Never call `createClient()` anywhere else.

## Folder structure

```
src/
  components/   reusable pieces (Button, Card, Screen)
  screens/      full pages (StockScreen, ItemDetail, AddItem, Login)
  hooks/        useItems, etc.
  lib/          supabaseClient.js
  styles/       themes.js (Tailwind variant composition)
```

## Reference docs in this repo

- `documentation/vault-v1-requirements.md` — the actual spec, including the component plan (per-component responsibility/state/renders breakdown) as a section within the same file, not a separate document. Defer to this over assumptions; follow the component plan section, and flag if a task doesn't fit it cleanly rather than improvising structure.

## Current known gaps (do not "helpfully" solve these unprompted)

- `Edit.jsx` vs. `AddItem.jsx` reuse — undecided, ask before building.
- `ItemDetail`'s admin-check currently infers role from whether `cost` is present in the data. This is a known, deliberate shortcut — do not silently replace it with a "cleaner" role check without flagging it first.
- Routing is not yet wired in this project.
