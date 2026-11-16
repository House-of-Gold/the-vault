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
- ~~**Seller-applied discounts (future idea, 20 Aug)**~~ **Superseded 16 Nov 2026:** instead of a separate "Apply Discount" button, the seller enters the sold price when confirming a sale, and the database refuses a price below `price` minus a configurable maximum discount (see `app_settings` in §4 and §5.3). Per-item discount limits are not built; a single global percentage is used.

---

## 3. Users

**Two roles, confirmed with Arlind on 11 Aug:**

| Role                        | Can do                                                                | Cannot do                                       |
| --------------------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| **Admin** (Arlind)          | Everything — add, edit, delete, mark as sold, sees `cost` and `price` | —                                               |
| **Seller** (hired employee) | Mark items as sold, within the max discount limit | Add items, edit items, delete items, see `cost` |

Both are real Supabase Auth accounts, created manually by Ledjan — no self-service sign-up, no password reset flow, no in-app user management UI in v1. Enforced via row-level security (RLS) policies on the `items` table, not just hidden in the UI — a seller account must be unable to reach `cost` or perform admin actions even via direct API calls, not only through buttons that happen to be missing from their screen.

---

## 4. Data model

The schema is deliberately richer than the v1 UI. Adding columns to an empty table is free; adding them to 400 rows of real inventory is not.

### `items`

| Field         | Type          | Notes                                                                                                                                                                                                                                                               |
| ------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | uuid          | Primary key, auto-generated                                                                                                                                                                                                                                         |
| `code`        | text          | Arlind's own shop code. Unique. Required.                                                                                                                                                                                                                           |
| `name`        | text          | Required                                                                                                                                                                                                                                                            |
| `category`    | text          | Nullable. Plain text, not an enum — Arlind's categories (Rings, Necklaces, Earrings, Bracelets, Brooches, Coins) may change over time; enforced as a guided `<select>` in the UI rather than free typing, so consistency doesn't require a rigid database structure |
| `cost`        | numeric(12,2) | What Arlind paid. **Nullable**, and **admin-only** — hidden from seller accounts via RLS                                                                                                                                                                            |
| `price`       | numeric(12,2) | Asking price. Required. Visible to both roles. **Never changes on a status update** — locked by RLS (see seller policies below)                                                                                                                                     |
| `currency`    | text          | Fixed to one value in v1 (see open questions)                                                                                                                                                                                                                       |
| `status`      | enum          | `in_stock` \| `sold` \| `deleted`. Default `in_stock`                                                                                                                                                                                                               |
| `acquired_at` | date          | When it came in. Defaults to today                                                                                                                                                                                                                                  |
| `sold_at`     | timestamptz   | Null until sold. Auto-set by trigger on the `in_stock → sold` transition                                                                                                                                                                                            |
| `sold_by`     | uuid          | References `auth.users(id)`. Nullable. Auto-set by trigger to `auth.uid()` on sale, cleared to `null` on undo                                                                                                                                                       |
| `sold_price`  | numeric       | Nullable. Defaults to `price` via trigger when empty. The app always sends the typed value (validated: required, greater than 0, digits with an optional comma or dot decimal of at most 2 digits, no thousands separators). Admin: any value. Seller: not lower than `price` minus the max discount, enforced by the trigger (see `app_settings`) |
| `photo_path`  | text          | Path in storage bucket. Nullable                                                                                                                                                                                                                                    |
| `notes`       | text          | Free text. Nullable                                                                                                                                                                                                                                                 |
| `expositor`   | smallint      | Required (`NOT NULL`). Which physical display case the item lives in — 1 to 9, enforced by a `CHECK` constraint. Permanent per item (doesn't change once assigned, since expositors group by category, e.g. rubies vs. diamonds)                                    |
| `created_at`  | timestamptz   | **Required**, defaults to `now()` at the database level — never relies on application code to set it                                                                                                                                                                |
| `updated_at`  | timestamptz   | **Required**, defaults to `now()` on insert, and auto-refreshed on every update via a database trigger — guaranteed correct regardless of which code path performs the write (app, dashboard, script)                                                               |

### `profiles` (new — needed to distinguish admin vs. seller)

| Field          | Type | Notes                                      |
| -------------- | ---- | ------------------------------------------- |
| `id`           | uuid | Matches the Supabase Auth user id           |
| `role`         | enum | `admin` \| `seller`                         |
| `display_name` | text | Nullable. Used for the name shown in the nav bar |

RLS policies on `items` reference this table to decide what a given logged-in user may read or write — e.g., a policy checks the caller's `role` before allowing a `cost` column to be returned, or before allowing an insert/delete at all.

### `app_settings` (added 16 Nov 2026)

Small key/value table for shop-wide settings that Arlind may want to change without a code change.

| Field   | Type    | Notes                                              |
| ------- | ------- | -------------------------------------------------- |
| `key`   | text    | Primary key                                        |
| `value` | numeric | Required. For the discount key, `CHECK` keeps it between 0 and 100 |

**Current rows:** `seller_max_discount_percent = 10` (the biggest discount a seller may give on an item's listed `price`).

- **Who can do what:** any logged-in user can read (the screen needs the number); only the admin can update, and only the `value` column; no INSERT or DELETE through the API; `anon` has no access.
- **How to change it:** Supabase dashboard → Table Editor → `app_settings` → edit `value`. It applies to new sales immediately; past sales are never re-checked.
- **Enforcement lives in the database** (trigger `set_updated_at`), not in the app. The screen only reads the number to show the lowest allowed price and to give a friendly message.
- Full details, error codes and test results: `vault-security-change-log-2026-10-30.md`, section 9.

**Rules:**

- **Money is `numeric`, never `float`.** Floats lose cents. This is not negotiable in an app about gold.
- **`status` is an enum, not a boolean.** `reserved`, `returned`, `repair` cost nothing to add later if the column is already an enum.
- **Nothing is ever hard-deleted.** "Delete" sets `status = 'deleted'` and the row stays. A deleted item disappears from the UI and nowhere else.
- `sold_at`/`sold_by`/`sold_price` are all set when status becomes `sold`. Together with `acquired_at` and `cost`/`price`, this means every report you might ever want is already answerable from the data — even though v1 shows none of them.

**RLS policies on `items` (built and tested 14–20 Aug):**

- **SELECT** — any authenticated user (admin or seller)
- **INSERT / UPDATE / DELETE** — admin only (full access to every column)
- **Seller: Mark as Sold** — the policy only allows the `in_stock → sold` transition for a seller (it checks the row's status and the caller's role). Which columns a seller may change is guarded by the `set_updated_at` trigger, not by the policy (moved there on 30 Oct 2026, when `cost` became unreadable from `items`). The trigger's protected-column guard has not been re-tested through the API since that move.
- **Seller: Undo Sale** — mirror policy, `sold → in_stock`.
- **`app_settings`** — SELECT for any authenticated user; UPDATE for admin only (`value` column only); no INSERT/DELETE through the API.
- **Column grants on `items`** — `authenticated` can read every column except `cost`; the app reads through `items_view` (see `vault-security-change-log-2026-10-30.md`).
- **`profiles`** — SELECT restricted to the caller's own row (`id = auth.uid()`) — a seller cannot enumerate other accounts.
- **`items_view`** (see below) — `cost` masked to `NULL` for non-admin sessions, real value for admin. Verified both directions via faked sessions.

**Database trigger (`set_updated_at`, on every `items` UPDATE):**

- Always refreshes `updated_at`
- On a genuine `in_stock → sold` transition: sets `sold_at`, `sold_by` (via `auth.uid()`), and `sold_price` (defaults to `price` unless already provided in the same request — this is how an admin's discount override works)
- On `sold → in_stock`: clears `sold_by`
- **For sellers only:** refuses any change to a protected column (`id, code, name, category, cost, price, currency, acquired_at, photo_path, notes, expositor, created_at`) with `Sellers cannot change item details` (`42501`)
- **For sellers only, on `in_stock → sold`:** refuses a sold price below `round(price × (1 − seller_max_discount_percent / 100), 2)` with `Sold price is below the maximum discount allowed` (code `VD001`). If the setting row is missing, every seller sale is refused (`VD002`, fails closed). The admin is never limited.

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
- Actions: **Mark as sold** (both roles, different UI per role — see below), **Undo Sale** (both roles), **Edit**, **Delete** (admin only)
- **Mark as sold — both roles:** the confirmation step shows a `sold_price` field, pre-filled with the listed `price`, editable. Validation: required; greater than 0; digits with an optional comma or dot decimal of at most 2 digits; no thousands separators (so `1.500` is refused instead of being read as 1.5). The value is sent to the database as a number. Built 16 Nov 2026.
- **Admin:** no limit. If the sold price is below `cost`, the screen asks for a second confirmation ("Sold price is below cost") before saving. Built 16 Nov 2026. Sellers never see this warning because `cost` is not sent to them.
- **Seller:** the sold price cannot be lower than the listed price minus the max discount (`app_settings.seller_max_discount_percent`, currently 10%). The database enforces it (live since 16 Nov 2026). **In progress:** show "Max discount: X% · Lowest price: Y" to sellers on the item detail (new `useDiscount` hook) and turn the database refusal `VD001` into "You can't go below the maximum discount allowed, contact Admin".
- After marking sold, the item leaves the stock list

### 5.4 Add item — admin only

- Fields: photo, name, code, price, acquired date (defaults to today), notes, expositor (1-9, required, `<select>`)
- Optional in the form if Arlind wants them: cost, category (category is a guided `<select>` from his real category list, not free text)
- Photo taken directly from phone camera or chosen from gallery
- Validation: name, code, price, and expositor required; code must be unique — with a clear error if it isn't
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

## 9. Skills needed before starting

| Requirement                               | Status        |
| ----------------------------------------- | ------------- |
| Components, props, lists                  | ✅ Done       |
| Forms & controlled inputs                 | Week 2, Day 3 |
| Fetching / async / loading & error states | Week 3        |
| Routing (list → detail → edit)            | To learn      |
| Supabase: table, auth, storage, RLS       | ~2-3 weeks    |
| File upload & image compression           | To learn      |

Realistic estimate: **6-8 weeks** from today to something that can hold real inventory.
