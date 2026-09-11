# The Vault — Component Plan (v1)

Ledjan's map for building v1, component by component. Update this as decisions change.

---

### Login.jsx — built

**Responsibility:** Authenticate a user via Supabase Auth.
**Imports:** `supabase` (from `lib/supabaseClient.js`) — not a prop, a direct import.
**State:** `email`, `password`, `localError`.
**Renders:** email input, password input, submit button, error message on failure.

---

### App.jsx

**Responsibility:** Own the session and role, decide Login vs. the logged-in app.
**State:** `session` (via `onAuthStateChange` subscription, own `useEffect`), `role` (derived — second `useEffect`, dependency `[session]`, queries `profiles` for the current user's role via `.eq("id", session.user.id).single()`; `null` when logged out or on error, fail-safe not fail-open).
**Renders:** `<Login />` if `session` is `null`. Otherwise, the routed app — `role` passed to each route's element as a prop (e.g. `<Route path="/item/:id" element={<ItemDetail role={role} />} />`), since routed pages aren't direct children of `App.jsx` and can't receive props any other way.

---

### Screen.jsx

**Responsibility:** Shared shell for every logged-in page — logo, title, navigation, logout button. Absorbs the job originally proposed for a separate `AppScreen` — one component, not two.
**Receives (props):** `title`, `children`.
**Renders:** logo, header, nav with two real links — **"Stock"** (`<Link to="/">`) and **"Sold"** (`<Link to="/sold">`) — logout button, then `{children}`. Depends on React Router being wired into the project (see Routing in Open Questions below).

---

### SearchBar.jsx — built (course project)

**Responsibility:** Capture search text and report it upward.
**Receives (props):** `onSearch` (callback).
**State:** `searchValue`.
**Renders:** label, text input.

---

### StockScreen.jsx — built, understood

**Status:** Complete. Filters by `status = 'in_stock'`, search via SearchBar, sorted newest-acquired first (`.sort()` with Date subtraction), loading/error/empty states, renders `<ItemCard>` grid.

### ItemCard.jsx — built, understood (Claude Code assisted, explained back)

**Status:** Complete. Presentational only, no fetching except synchronous `getPublicUrl`. Deliberately omits `cost` even for admin — cost only shown on ItemDetail.

---

### ItemDetail.jsx — built, fully understood (Claude Code assisted, explained back line by line)

**Status:** Core complete and verified understood — fetch, photo URL construction (and its two distinct failure modes), Mark as Sold + confirmation with stale-UI timing handled, Undo Sale, role-gated UI (`role === "admin"` for Edit/Delete visibility).
**Still to build:**

- Admin-specific `sold_price` input in the Mark as Sold confirmation step (pre-filled with `price`, editable) — seller's version stays exactly as-is, unchanged
- Edit and Delete buttons exist but have no handlers yet

---

### SoldScreen.jsx — built, understood

**Status:** Complete. Mirror of StockScreen — filters `status === "sold"` instead of `"in_stock"`, sorts by `sold_at` instead of `acquired_at`, own SearchBar/filter instance, same loading/error/empty pattern. No Sold/Undo button here — those actions live exclusively on `ItemDetail`, reached by clicking a card, for consistency across both list screens.

---

### ItemForm.jsx — built, understood (formerly AddItem.jsx, generalized 21 Aug)

**Status:** Add-only version complete and tested end-to-end (validation, warnings, photo compression + upload + insert with proper error handling by Postgres error code, auto-navigate to Stock on success). **Being extended to handle Edit too, rather than a separate EditItem.jsx** — avoids duplicating validation/upload logic that would drift out of sync.

**Shared add/edit design:**

- Receives optional `item` prop (passed directly from `ItemDetail`'s Edit button — legitimate here since Edit is only ever reached via a click from a page that already has the item loaded, unlike `ItemDetail` itself which must handle cold/bookmarked visits)
- Every field's `useState` uses `item?.field || default` instead of a bare empty string, so the form is blank when adding, pre-filled when editing
- Photo validation becomes conditional: required only if neither a new `photoFile` nor an existing `item.photo_path` exists — editing doesn't force a re-upload
- `handleSubmit` branches on `item?.id`: truthy → `.update()` against that id; falsy → `.insert()` (the original add behavior)

**Still to build:** the actual branching logic in `handleSubmit`, the "Edit" button wiring in `ItemDetail` to navigate here with the item, and a route for it (`/item/:id/edit` or similar).

---

### Open questions to resolve before/while building

- **Routing** — `/`, `/sold`, `/item/:id` are wired. Still missing: `/add`, `/item/:id/edit` (both waiting on ItemForm.jsx's branching logic), `*` for 404.
- **Mark as Sold confirmation** — built for the seller flow (two-step button). Admin flow still needs the `sold_price` input added to its confirmation step.
- **Delete** — button exists on `ItemDetail`, no handler yet. Given the soft-delete design (`status = 'deleted'`, never a real row removal), this should be a small, focused addition once `ItemForm.jsx`'s edit branch is done.
