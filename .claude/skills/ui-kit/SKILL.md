---
name: ui-kit
description: Owns the app's UI kit in app/src/ui (tokens, components, the /ui-kit page) and makes every UI change in app/ go through it. Use for any UI work in app/, such as "add a button", "new panel", "a field for X", "change the UI", "style …", "make it look like the mockup", "dark mode", a new screen or popover, or a change to a kit component. Builds from kit components and tokens only; a new pattern goes into the kit first, with its states on /ui-kit and a test where it has logic.
---

# /ui-kit: build UI from the kit

Every UI in `app/` is built from `app/src/ui`. When the app has an approved mockup, keep it in `docs/design/` and follow it. Paths are relative to the repo root.

## Rules

1. Import components from `app/src/ui` (its `index.ts`). In feature code, never write a `<button>`, `<input>`, `<select>` or `<textarea>`, and never a `className` with its own colours.
2. Use tokens only (`app/src/ui/tokens.css`): `var(--accent)`, `var(--space-3)`, `var(--text-sm)`, `var(--radius-md)`. Don't write raw hex or rgb colours. A domain colour gets a token in `app/src/appTokens.css`, with its dark-mode value; a state such as "changed" or "late" maps onto a kit tone (`Tone.Warning`, `Tone.Accent`).
3. Fonts: `--font-display` for display (page titles, names), `--font-body` for UI and labels, `--font-mono` only for tabular figures. They are system font stacks; for a web font, put its family first in `tokens.css` and load it in `index.html`, together.
4. Is the pattern missing? Add it to the kit first, in the same change: the component in `app/src/ui/`, its export in `index.ts`, its styles in `components.css` (`ui-` classes, tokens only), every state on `/ui-kit` (its section in `app/src/ui/kit-page/`), and a Vitest test (`app/src/ui/*.test.ts`) if it has logic (clamping, selection, parsing).
5. If you change a kit component's props, states or look, update `/ui-kit` in the same commit.
6. The kit holds no domain code: a domain field, component or token lives with its feature (`app/src/<feature>/`, `app/src/appTokens.css`). `src/ui/` and `src/lib/` import no feature code.

## What enforces it

`npm run check` from `app/`:

- ESLint refuses raw `<button>`, `<input>`, `<select>` and `<textarea>` outside `src/ui/`, deep kit imports (`../ui/Button` instead of `../ui`), and feature imports inside `src/ui/` and `src/lib/`.
- `check:colors` refuses a hex or `rgb()` colour outside `src/ui/` and `src/appTokens.css`.
- The tests run too.

## Before you finish

Run `npm run check`. Then open `http://localhost:5173/ui-kit` (`npm run dev`, signed in as an owner) and check the changed component, in light and dark.
