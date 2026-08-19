# The Vault — v1 Requirements

**Client:** House of Gold (Arlind)
**Built by:** Ledjan Miçani
**Status:** Draft — pending Arlind's answers to the open questions at the end

---

## 1. Purpose

Track what jewelry came into the shop and what went out, with a photo of each piece, viewable on a phone while standing at the counter.

**The two things that justify this over a spreadsheet:**

1. A photo per item
2. Fast lookup on a phone, in the shop

If a feature doesn't serve one of those two things or the in/out ledger, it isn't v1.

---

## 2. Non-goals for v1

Explicitly **not** building these. They're deferred, not rejected — the schema leaves room for all of them.

- QR codes
- Reports, charts, best-sellers, margin analysis
- Sales history screens
- Customer records
- Multi-currency / EUR↔Lek conversion
- Reservations, repairs, returns
- Bulk import/export UI
- Offline mode

---

## 3. Users

**Two roles, confirmed with Arlind on 11 Aug:**

| Role                        | Can do                                                                | Cannot do                                       |
| --------------------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| **Admin** (Arlind)          | Everything — add, edit, delete, mark as sold, sees `cost` and `price` | —                                               |
| **Seller** (hired employee) | Mark items as sold                                                    | Add items, edit items, delete items, see `cost` |

Both are real Supabase Auth accounts, created manually by Ledjan — no self-service sign-up, no password reset flow, no in-app user management UI in v1. Enforced via row-level security (RLS) policies on the `items` table, not just hidden in the UI — a seller account must be unable to reach `cost` or perform admin actions even via direct API calls, not only through buttons that happen to be missing from their screen.

---

## 4. Data model

The schema is deliberately richer than the v1 UI. Adding columns to an empty table is free; adding them to 400 rows of real inventory is not.

### `items`

| Field         | Type          | Notes                                                                                    |
| ------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `id`          | uuid          | Primary key, auto-generated                                                              |
| `code`        | text          | Arlind's own shop code. Unique. Required.                                                |
| `name`        | text          | Required                                                                                 |
| `category`    | text          | Nullable in v1 — no UI for it yet, but the column exists                                 |
| `cost`        | numeric(12,2) | What Arlind paid. **Nullable**, and **admin-only** — hidden from seller accounts via RLS |
| `price`       | numeric(12,2) | Asking price. Required. Visible to both roles                                            |
| `currency`    | text          | Fixed to one value in v1 (see open questions)                                            |
| `status`      | enum          | `in_stock` \| `sold` \| `deleted`. Default `in_stock`                                    |
| `acquired_at` | date          | When it came in. Defaults to today                                                       |
| `sold_at`     | timestamptz   | Null until sold                                                                          |
| `photo_path`  | text          | Path in storage bucket. Nullable                                                         |
| `notes`       | text          | Free text. Nullable                                                                      |
| `created_at`  | timestamptz   | Auto                                                                                     |
| `updated_at`  | timestamptz   | Auto                                                                                     |

### `profiles` (new — needed to distinguish admin vs. seller)

| Field  | Type | Notes                             |
| ------ | ---- | --------------------------------- |
| `id`   | uuid | Matches the Supabase Auth user id |
| `role` | enum | `admin` \| `seller`               |

RLS policies on `items` reference this table to decide what a given logged-in user may read or write — e.g., a policy checks the caller's `role` before allowing a `cost` column to be returned, or before allowing an insert/delete at all.

**Rules:**

- **Money is `numeric`, never `float`.** Floats lose cents. This is not negotiable in an app about gold.
- **`status` is an enum, not a boolean.** `reserved`, `returned`, `repair` cost nothing to add later if the column is already an enum.
- **Nothing is ever hard-deleted.** "Delete" sets `status = 'deleted'` and the row stays. A deleted item disappears from the UI and nowhere else.
- `sold_at` is set when status becomes `sold`. Together with `acquired_at` and `cost`/`price`, this means every report you might ever want is already answerable from the data — even though v1 shows none of them.

### Storage

One bucket for item photos. One photo per item in v1 (the column is a single path; a future `item_photos` table can supersede it without touching this one).

---

## 5. Functional requirements

### 5.1 Login

- Email + password, two accounts (admin, seller)
- Stays logged in between sessions
- Logout available
- After login, UI adapts to role — a seller never sees Add/Edit/Delete controls or `cost` fields, not just has them disabled

### 5.2 Stock list — the main screen

- Shows all items where `status = 'in_stock'`
- Each row/card: photo thumbnail, name, code, price (both roles)
- **Search** by name or code (needed the moment there are more than ~30 items)
- Sorted newest-acquired first by default
- A visible count ("47 items in stock")
- Empty state when there's nothing to show

### 5.3 Item detail

- Full-size photo, name, code, price, acquired date, notes (both roles). `cost` shown to admin only
- Actions: **Mark as sold** (both roles), **Edit**, **Delete** (admin only)
- **Mark as sold** requires a confirmation step — it's a one-tap action with real consequences
- After marking sold, the item leaves the stock list

### 5.4 Add item — admin only

- Fields: photo, name, code, price, acquired date (defaults to today), notes
- Optional in the form if Arlind wants them: cost, category
- Photo taken directly from phone camera or chosen from gallery
- Validation: name, code and price required; code must be unique — with a clear error if it isn't
- Client-side image compression before upload (shop wifi is not a data center)

### 5.5 Edit item — admin only

- Same form as Add, pre-filled
- Can replace the photo

### 5.6 Sold items

- Not a full "sales history" screen — just a way to see what's been sold, in case something was marked sold by mistake
- Ability to move an item back to `in_stock` (undo a mistaken sale) — both roles, since either could misfire "mark as sold"

---

## 6. Non-functional requirements

- **Mobile-first.** Designed for a phone held in one hand at the counter; desktop is the secondary case, not the primary.
- **Language:** whatever Arlind actually uses (see open questions). One language only in v1 — no i18n machinery.
- **Photos:** compressed client-side, max ~1200px on the long edge. Storage costs and shop wifi both matter.
- **Auth:** Supabase Auth. Row-level security enabled from day one, even with one user — turning it on later, after real data exists, is how leaks happen.
- **Backups:** Ledjan must know how to export the whole table to CSV on demand, and must test that export once before Arlind puts real inventory in. A backup that has never been restored is not a backup.
- **Deployment:** Vercel, same as Uarda.

---

## 7. Definition of done for v1

**Arlind (admin)** can, on his phone, without asking Ledjan for help:

1. Log in
2. Add a new piece with a photo in under a minute
3. Find any piece by name or code
4. See `cost` alongside `price`
5. Edit or delete a piece
6. Mark a piece as sold, and undo it if tapped by mistake

**The seller** can, on their phone:

1. Log in
2. Find any piece by name or code
3. See `price` only — no `cost`, no Add/Edit/Delete controls anywhere in the UI
4. Mark a piece as sold, and undo it if tapped by mistake

And a seller account **cannot** perform an admin action or read `cost`, even by calling the API directly — not just because the button is hidden.

And Ledjan can export everything to CSV at any time.

---

## 8. Open questions for Arlind

Ask these before writing any code. Each one changes the build.

1. **What do you use today** — spreadsheet, notebook, nothing? What's the single most annoying part of it?
2. **Do you already have item codes?** What do they look like? Are they unique?
3. **Language** — Albanian or English?
4. **Currency** — Lek only, or do you price some pieces in euro?
5. **Do you want to record what you paid** (cost), or only the selling price? _(This is a sensitive question — ask it plainly and accept "no" without pushing. It only affects whether one field appears in the form.)_
6. **How many items are in the shop right now?** This determines whether initial data entry is an afternoon or a two-week slog — and whether a CSV import is needed before launch.
7. **~~One phone or several?~~** Resolved — two accounts confirmed (admin + seller), each presumably on their own phone.
8. **What happens when something sells** — do you need to know the date, or just that it's gone?

---

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

**Responsibility:** Own the session, decide Login vs. the logged-in app.
**State:** `session` (via `onAuthStateChange` subscription).
**Renders:** `<Login />` if `session` is `null`. Otherwise, the routed app (Screen-wrapped screens via React Router).

---

### Screen.jsx

**Responsibility:** Shared shell for every logged-in page — logo, title, navigation, logout button. Absorbs the job originally proposed for a separate `AppScreen` — one component, not two.
**Receives (props):** `title`, `children`.
**Renders:** logo, header, nav, logout button, then `{children}`.

---

### SearchBar.jsx — built (course project)

**Responsibility:** Capture search text and report it upward.
**Receives (props):** `onSearch` (callback).
**State:** `searchValue`.
**Renders:** label, text input.

---

### StockScreen.jsx

**Responsibility:** Show the filtered stock list.
**Calls directly:** `useItems()` — not received as props; the hook call lives here.
**State:** `filter` (local, shared with `SearchBar` via `onSearch` callback — no relation to `App.jsx`).
**Renders:** `<Screen>` wrapping `<SearchBar>` + a grid of item cards (via `<ItemCard>` or similar), count, empty state, loading state, error state + retry button (`refetch` from `useItems`).

---

### ItemDetail.jsx

**Responsibility:** Show full detail for one item.
**Gets which item:** `useParams()` reading `:id` from the route — same mechanism as the course project.
**Gets item data:** `useItems()` (or the item list already fetched), finds the match via `.find()`.
**Role handling:** none needed. `items_view` already returns `cost` as real value or `null` depending on who's logged in — `ItemDetail` just renders whatever arrives. No role check in this component.
**Renders:** `<Screen>` wrapping photo, name, code, price, `cost` (if present), acquired date, notes. **Mark as Sold** button (both roles, with confirmation step). **Edit** / **Delete** buttons — rendered only if `cost` is present in the data (a proxy for "I'm admin," since only admin's session gets real cost — worth deciding if this is the intended signal or if a cleaner role check is wanted later).

---

### AddItem.jsx

**Responsibility:** Form to create a new item.
**State:** `values` (one key per column: name, code, price, cost, category, acquired_at, notes, expositor), `errors`, `photoFile` (from file input), `success`.
**On submit:** validate (name/code/price required, code uniqueness checked against current data or left to the database's own unique constraint + friendly error), compress photo (`browser-image-compression`), upload to `item-photos` bucket, insert row into `items` (not `items_view` — writes go to the real table) with the resulting `photo_path`.
**Renders:** one input per field, file input for photo, Save button, Discard button, validation errors inline.

---

### Open questions to resolve before/while building

- **Edit.jsx** — same form as AddItem, pre-filled? Or does AddItem.jsx take an optional "editing existing item" mode? Decide before building either.
- **SoldItems.jsx** — not yet planned. Needs: fetch items where `status = 'sold'`, undo button (sets status back to `in_stock`).
- **Routing** — `/`, `/item/:id`, `/add`, maybe `/sold`, `*` for 404. Not yet wired in this new project.
- **Mark as Sold confirmation** — a modal, or a simple two-step button? Not yet designed.
