---
name: estimate
description: Turns a client's template analysis into an estimate: build hours plus infrastructure $/month, and the usage at which each free tier breaks. Use after /analyze-template, on "/estimate <slug>", "how much will it cost", "estimate the build".
---

# /estimate: hours and $/month

**Inputs.** The client's slug. Resolve the folder: `clients-private/<slug>/` first, then `clients/<slug>/`; read and write only there. Read `prd.md` and `analysis.md`.

**Steps.**

1. Hours: one row per requirement from the verdicts (`in the template` costs setup time only; an `extension` its hours), plus setup, deploy and handover. Sum them.
2. Infrastructure: one row per service in the manifest, with its plan and $/month at the usage the PRD implies.
3. Free tiers: for each service on a free plan, the limit that breaks it, the client's usage that reaches it, and the $/month after. Take each limit from the provider's pricing page and name the page; a limit you can't verify is marked `unverified`, never guessed.
4. Write `estimate.md`: `## Hours` (table and total), `## Infrastructure` (table and total $/month), `## Free tier breaks`, and one `**Total:**` line: hours, and $/month now and past the free tiers.
5. From the repo root: `node --experimental-strip-types app/scripts/client-state.ts --slug <slug> --stage analysis`, so the client's link opens the analysis and the estimate.

**Outputs.** `estimate.md`, the stage `analysis`.

**Done when** every requirement is counted in the hours, every service has its $/month, every free tier has its breaking point (or `unverified`), the total line is there, and `state.json` says `analysis`.

## Learnings

Read [learnings.md](learnings.md) before you run. A problem a run hits and solves is recorded there at the session's end by `/wrap-up`, which also proposes changes to this file from it (a new rule, or an obsolete one removed), applied only on the developer's yes.

## Test

From `app/`: `npm run skill-test -- estimate`. It runs this skill headless on the made-up client in `../prd/fixture/` and checks `estimate.md` and the stage.
