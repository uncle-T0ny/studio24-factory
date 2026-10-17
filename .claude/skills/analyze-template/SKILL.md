---
name: analyze-template
description: Reads a template repo and gives a verdict for each of a client's requirements: in the template, an extension (+hours, +$/month), or not supported (with an alternative). Use after the PRD, on "/analyze-template <slug> <repo link or path>", "can this template do it", "analyse the template".
---

# /analyze-template: the template against the PRD

**Inputs.** The client's slug and a template: a GitHub link (`git clone --depth 1` into a temp folder) or a local path. Resolve the folder: `clients-private/<slug>/` first, then `clients/<slug>/`; read and write only there. Read its `prd.md`.

**Steps.**

1. Read the template's README, `package.json` files, deploy configs (`wrangler.*`, `convex.json`, Dockerfiles) and `.env.example`. Never read an `.env` file with values.
2. Write `analysis.md`: a `Template:` line with the link, then `## Manifest` with five bullets: what it is, what to configure, where it deploys, its limits, its monthly cost on the free plans.
3. Add `## Verdicts`, a table `ID | Verdict | Detail` with one row per FR and NFR of `prd.md`:
   - `in the template`: the file or feature that covers it;
   - `extension`: `+<n> h, +$<n>/month: <what to build>`;
   - `not supported`: why, and the alternative.
4. Leave the stage as it is: `/estimate` sets `analysis` once the client can see the price.

**Outputs.** `analysis.md`.

**Done when** the manifest has its five bullets, every PRD requirement has exactly one verdict row, and every extension has hours and $/month. Next: `/estimate`.

## Learnings

Read [learnings.md](learnings.md) before you run. A problem a run hits and solves is recorded there at the session's end by `/handoff`, which also proposes changes to this file from it (a new rule, or an obsolete one removed), applied only on the developer's yes.

## Test

From `app/`: `npm run skill-test -- analyze-template`. It runs this skill headless on the made-up client in `../prd/fixture/`, with this repo as the template, and checks `analysis.md` and that the stage did not move.
