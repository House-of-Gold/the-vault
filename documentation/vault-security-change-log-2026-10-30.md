# The Vault — Security change log: hiding `cost` from sellers

**Date:** 30 October 2026
**Applies to:** the live Supabase project "The Vault", table `public.items`
**Status:** applied and verified (see §5)

---

## ⚠️ READ THIS FIRST — when you add a column to `items`

The `authenticated` role (every logged-in user, admin and seller) no longer has permission to read the whole `items` table. It can read **only the columns that are listed in a grant**. This is on purpose, so `cost` stays unreadable.

The consequence: **a new column you add to `items` is NOT readable directly by users until you grant it.** And it is not protected from sellers either, until you add it to the trigger guard.

Do this every time you run `ALTER TABLE public.items ADD COLUMN ...`:

1. **Grant read access** (only if the app or a policy needs to read it directly from `items`):
   ```sql
   grant select (new_column) on public.items to authenticated;
   ```
   **Never** add `cost` to a grant. If the new column is sensitive too, skip this step on purpose.
2. **Add it to the seller guard** in the `set_updated_at()` trigger (§3.1), unless sellers are allowed to change it. Add one line, `or new.new_column is distinct from old.new_column`. If you forget this, a seller can change that column while marking an item as sold, because INSERT and UPDATE permissions are still table-wide.
3. **If the app should show it,** add it to `items_view`. A view only grows at the end. Changing a column's type means dropping and recreating the view, and then the grant on the view must be run again.
4. **Test both accounts.** Admin: edit and save. Seller: mark as sold, then undo. Then run the read-only checks in §6.

**How the failure shows up:** `permission denied for table items` (error code `42501`). It appears when something reads the new column directly from the `items` table, for example `.from("items").select(...)`, or `.insert(...).select()` / `.update(...).select()`. Reads through `items_view` keep working, because the view runs with its owner's permissions.

**Good news:** forgetting step 1 fails safe. The data stays hidden. It never leaks.

---

## 1. The problem

Sellers must not be able to see `cost`. The first design only hid it in the view `items_view`, which returns `cost` as `NULL` unless the caller is an admin. But the app reads through the view, and the API does not force anyone to.

On 29–30 Oct, a read-only test as the seller account showed:

- The read policy on `items` is `USING (true)` for all logged-in users.
- The `authenticated` role had `SELECT` on the whole table, including `cost`.
- So a seller querying `items` directly (same URL and public key as the browser bundle) saw all 80 rows **with `cost`**.

The requirements doc says a seller must not read `cost` "even by calling the API directly." This was a violation.

## 2. Why the obvious fix failed

First attempt: revoke `SELECT` on the `cost` column only. Two things went wrong:

1. The role had table-wide `SELECT`, and a column-level revoke does nothing when the table-level grant exists. The table-wide grant has to be revoked and the allowed columns granted back.
2. After doing that, **every update failed for both roles** with `permission denied for table items`. The two seller policies contained subqueries such as `select i.cost from items i where i.id = items.id`. Postgres checks read permission for every table reference in every policy before an update runs, even policies that don't apply to that user. Once the seller lost read access to `cost`, those subqueries made the check fail for everyone.

The failing statement was visible in the Postgres logs (Supabase → Logs → Postgres), which is where to look for this kind of error.

The first attempt was undone with `grant select on public.items to authenticated;`.

## 3. What was changed (all in one transaction)

### 3.1 Trigger `set_updated_at()` — now also guards sellers

The "all other columns must stay unchanged" rule moved out of the policies and into the existing trigger. A trigger compares the old and new row without needing read permission.

- If the user is a seller and any protected column changed, the update is refused with `Sellers cannot change item details` (`42501`).
- Protected columns: `id, code, name, category, cost, price, currency, acquired_at, photo_path, notes, expositor, created_at`.
- Not protected on purpose: `status`, `sold_at`, `sold_price`, `sold_by`, `updated_at`. `sold_price` is allowed because sellers enter the sale price. `sold_at` and `sold_by` are set by the trigger itself (`sold_by = auth.uid()` on a sale, `null` on an undo), so the seller can't forge them.
- The two existing sale rules are unchanged (set `sold_at`, `sold_by`, default `sold_price` on sale; clear `sold_by` on undo).
- Dashboard edits are not blocked: there `auth.uid()` is empty, so the user is not a seller.

### 3.2 Seller policies — simplified

Both policies now only check `status` and the caller's role. They no longer read the `items` table.

| Policy | USING (old row) | WITH CHECK (new row) |
|---|---|---|
| Seller can mark item as sold | `status = 'in_stock'` and caller is `seller` | `status = 'sold'` and caller is `seller` |
| Seller can undo a sale | `status = 'sold'` and caller is `seller` | `status = 'in_stock'` and caller is `seller` |

The admin policies (INSERT, UPDATE, DELETE) and the read policy were not touched.

### 3.3 Column permissions

```sql
revoke select on public.items from authenticated;
grant select (
  id, code, name, category, price, currency, status,
  acquired_at, sold_at, photo_path, notes,
  created_at, updated_at, expositor, sold_by, sold_price
) on public.items to authenticated;
```

`cost` is the only column left out. `sold_by` stays readable on purpose: it only matters that sellers can't change it, and the trigger guarantees that. INSERT and UPDATE permissions were not changed.

## 4. How the pieces fit now

- **App reads** go through `items_view`. The view runs with its owner's permissions, so it can read `cost` itself, and it returns `cost` only to admins (and `sold_by` as a display name only to admins).
- **App writes** go to `items`. RLS decides who may write, and the trigger guards the columns sellers may not change.
- **Direct API reads** of `items` by any logged-in user can no longer return `cost`.

## 5. Verification done on 30 Oct 2026

| Test | Result |
|---|---|
| Admin edits an item and saves in the app | works |
| Seller marks an item as sold, then undoes it in the app | works |
| Seller reads `cost` directly from `items` (read-only simulation) | `permission denied for table items` (before the fix: 80 of 80 costs visible) |
| Seller reads `items_view` | 80 rows, `cost` empty on all |
| Admin reads `items_view` | 80 rows, 80 costs visible |

**Not tested yet:** the trigger guard itself (a seller trying to change a protected column through the API). The seller UI has no way to do this.

## 6. How to re-check later (all read-only)

Column permissions for the `authenticated` role:
```sql
select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'items' and grantee = 'authenticated'
order by column_name;
```
`cost` should have no `SELECT` row.

All policies:
```sql
select tablename, policyname, cmd, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, cmd;
```

Seller simulation (does not change anything; the transaction is rolled back):
```sql
begin read only;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"<SELLER USER UUID>","role":"authenticated"}', true);
select count(cost) from public.items;   -- expect: permission denied
rollback;
```

## 7. Undo (only if something breaks)

```sql
grant select on public.items to authenticated;
```
This restores direct reads, including `cost`. The old policy definitions were the "mark as sold" and "undo a sale" policies with subqueries on `items`.

## 8. Other things noticed, not changed

- **Route guards:** `/add` and `/edit/:id` have no role check in `App.jsx`. A seller who types the URL sees the form, but the database refuses the save.
- **`anon` permissions:** the `anon` role holds `TRUNCATE`, `TRIGGER` and `REFERENCES` on `items`. It has no read or write access, and the API does not expose `TRUNCATE`, so this is low risk, but it is worth cleaning up before real data goes in.
- **Schema not in the repo:** these policies, grants, the trigger and the view live only in Supabase. This file is the record.
