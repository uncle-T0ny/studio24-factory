---
name: handover
description: Hands the final app to the client: checks it sits behind a login and writes the checklist that moves every account to the client. Use at the end, on "/handover <slug> <final app URL>", "hand over the app", "transfer to the client".
---

# /handover: the final app and the transfer checklist

**Inputs.** The client's slug and the final app's URL. Resolve the folder: `clients-private/<slug>/` first, then `clients/<slug>/`; read and write only there. Read `analysis.md` and `estimate.md`.

**Steps.**

1. Login: open the URL signed out; it must show the sign-in, never client data. Record what you saw, or `not verified` and why.
2. Write `handover.md`: `Final app: <URL>`, the login result, then `## Transfer checklist`, one `- [ ]` item per account the app runs on, from the manifest and the estimate: the code repo, the backend, the hosting, the domain, each paid API. Each item says what moves, from whom to the client, and what the client does (accept the transfer, add billing, set the env var named, never its value).
3. End the list with `- [ ] Rotate every key the developer held` and `- [ ] Remove the developer's access`.
4. From the repo root: `node --experimental-strip-types app/scripts/client-state.ts --slug <slug> --stage final`, so the client's link opens the final app.

**Outputs.** `handover.md`, the stage `final`.

**Done when** the login result is recorded, every account in the manifest has its checklist item, and `state.json` says `final`. Ticking the items is the client's and the developer's work, by hand.

## Learnings

Read [learnings.md](learnings.md) before you run. A problem a run hits and solves is recorded there at the session's end by `/wrap-up`, which also proposes changes to this file from it (a new rule, or an obsolete one removed), applied only on the developer's yes.

## Test

From `app/`: `npm run skill-test -- handover`. It runs this skill headless on the made-up client in `../prd/fixture/` with a placeholder URL and checks `handover.md` and the stage.
