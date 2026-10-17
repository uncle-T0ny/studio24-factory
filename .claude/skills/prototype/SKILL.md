---
name: prototype
description: Builds a client's prototype: a clickable mockup first, then a dev app from the template, and records its links. Use after the estimate, on "/prototype <slug>", "/prototype <slug> --mockup-only", "make the mockup", "spin up the dev app".
---

# /prototype: the mockup, then the dev app

**Inputs.** The client's slug, and `--mockup-only` to stop after the mockup (the cut order's second step). Resolve the folder: `clients-private/<slug>/` first, then `clients/<slug>/`; read and write only there. Read `prd.md` and `analysis.md`.

**Steps.**

1. Mockup: `mockup.html`, one self-contained file (inline CSS, no external scripts, made-up sample data only) with a screen for each `must` FR and its ID on the screen. It must read on a phone.
2. Unless `--mockup-only`: create the dev app from the template in its own repo outside this one, build the `must` FRs on it, and deploy it to a dev environment.
3. Write `prototype.md`: `Mockup: [mockup.html](mockup.html)`, `Dev app: <URL>` (or `not built` with the reason), and what each covers, by FR ID.
4. Register each built item on the project, so the client's link opens it: from `app/`, `npx convex run prototypes:registerPrototype '{"slug":"<slug>","kind":"mockup","url":"<url>"}'`, then `"kind":"devApp"` with the dev app's URL. Add `--prod` for a real client on the live app, as for the stage.
5. From the repo root: `node --experimental-strip-types app/scripts/client-state.ts --slug <slug> --stage prototype`.

**Outputs.** `mockup.html`, `prototype.md`, the stage `prototype`.

**Done when** the mockup opens in a browser with every `must` FR on a screen, `prototype.md` links it and gives the dev app URL or why there is none, each built item is registered, and `state.json` says `prototype`.

## Test

From `app/`: `npm run skill-test -- prototype`. It runs `--mockup-only` headless on the made-up client in `../prd/fixture/` (the dev app takes minutes and a deploy) and checks the mockup, `prototype.md`, the printed registration command and the stage.
