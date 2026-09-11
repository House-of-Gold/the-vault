# Claude Code Prompt — Apply Claude Design handoff, styling only

## Context

A design has been created in Claude Design and approved by the client (Arlind). It includes some future-feature screens/elements not in this app's v1 scope. See `documentation/vault-v1-requirements.md` and `documentation/vault-component-plan.md` for what v1 actually is.

## The rule for this task — read before touching anything

**This is a styling pass, not a feature-building pass.** Every screen and component already exists and is functionally complete and tested: `Login`, `StockScreen`, `SoldScreen`, `ItemDetail`, `ItemForm` (handles both Add and Edit), `Screen`, `SearchBar`, `ItemCard`.

- **Do not add new features, buttons, fields, or screens** that exist in the design but have no corresponding working code today.
- **Do not change component logic, state, handlers, or data flow.** If applying the design seems to require a structural change (not just classNames/JSX layout), stop and flag it back to Ledjan rather than making the call yourself.
- **Do not touch the database, Supabase queries, or RLS.** Nothing about this task should require a backend change. If it seems to, that's a sign the design element belongs to a future feature — flag it, don't build it.
- If the design shows a screen or element with no existing counterpart in the codebase (a future feature), skip it entirely and note it in your summary rather than building a placeholder for it.

## What "apply the design" actually means here

For each existing screen/component, translate the Claude Design visuals into Tailwind classes — layout (flex/grid), spacing, typography, color (via the existing `@theme` tokens in `App.css` and the composed variants in `src/styles/themes.js` — extend these rather than hardcoding new one-off colors), and any hover/focus states shown in the design.

Reuse the existing theme system. If the design calls for colors not yet in `@theme`, add them there following the existing `--color-*` naming convention — don't hardcode raw hex values inline in components.

## The teaching requirement — this is not optional

Ledjan is using this task specifically to learn how a real design gets translated into Tailwind, not just to get styled output. For each screen you restyle:

1. Before writing classes, briefly state the layout approach in plain language (e.g. "this card list becomes a CSS grid, 1 column on mobile via the existing `grid-cols-1 md:grid-cols-3` pattern already used in ProductList").
2. When you introduce any Tailwind utility or pattern Ledjan hasn't used before in this codebase, explain what it does in one or two sentences before using it.
3. Keep changes to one screen/component at a time, in separate commits, so Ledjan can review and understand each one before moving to the next — don't restyle the whole app in one pass.

## Order of work

Go screen by screen, simplest first, so the teaching payoff compounds: `Screen.jsx` (the shell, affects everything) → `ItemCard.jsx` → `StockScreen.jsx` → `SoldScreen.jsx` → `ItemDetail.jsx` → `ItemForm.jsx` → `Login.jsx`.

## What Ledjan will do after each screen

Review the diff, ask questions about anything unclear, test in the browser (including on an actual phone, per the project's mobile-first requirement) before approving and moving to the next screen.
