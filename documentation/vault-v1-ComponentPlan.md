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

### AddItem.jsx

**Responsibility:** Form to create a new item.
**State:** `values` (one key per column: name, code, price, cost, category, acquired_at, notes, expositor), `errors`, `photoFile` (from file input), `success`.
**On submit:** validate (name/code/price required, code uniqueness checked against current data or left to the database's own unique constraint + friendly error), compress photo (`browser-image-compression`), upload to `item-photos` bucket, insert row into `items` (not `items_view` — writes go to the real table) with the resulting `photo_path`.
**Renders:** one input per field, file input for photo, Save button, Discard button, validation errors inline.

---

### Open questions to resolve before/while building

- **Edit.jsx** — same form as AddItem, pre-filled? Or does AddItem.jsx take an optional "editing existing item" mode? Decide before building either.
- **Routing** — `/` (StockScreen) and `/sold` (SoldScreen) and `/item/:id` (ItemDetail) are wired in `App.jsx`. Still missing: `/add` (once AddItem exists), `/item/:id/edit` (once Edit is decided), `*` for 404.
- **Mark as Sold confirmation** — built for the seller flow (two-step button). Admin flow still needs the `sold_price` input added to its confirmation step.
