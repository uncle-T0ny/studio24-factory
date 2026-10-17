---
name: prd
description: Drafts a client's PRD from the interview transcripts in their folder, every requirement backed by a verbatim quote. Use after the interview, on "/prd <slug>", "draft the PRD for <slug>", "write the requirements".
---

# /prd: the PRD from the interview

**Inputs.** The client's slug. Resolve the folder: `clients-private/<slug>/` first, then `clients/<slug>/`; read and write only there. Read every file in `interview/`.

**Steps.**

1. Write `prd.md`: a `# PRD: <client>` title, a line linking the transcripts and `decisions.md`, then four sections:
   - `## Functional requirements` and `## Non-functional requirements`: one table each, columns `ID | Requirement | Priority | Quote`. IDs `FR-1`, `FR-2`… and `NFR-1`…; priority `must`, `should` or `could`; the quote is the client's words, copied verbatim, in double quotes.
   - `## Out of scope`: what the client said to leave out, each with its quote.
   - `## Flagged`: every requirement whose quote is not found, or `None`.
2. Prove every quote: `grep -F "<quote>" interview/*.md`. A quote not found is fixed by copying the exact words, or its quote cell becomes `quote not found` and the row is listed under Flagged. Never invent or paraphrase a quote.
3. Append to `decisions.md`, an append-only log, one line per decision the client made: `- D-<n> (prd, <yyyy-mm-dd>): <decision>. "<quote>"`.
4. From the repo root: `node --experimental-strip-types app/scripts/client-state.ts --slug <slug> --stage prd`, so the client's link opens the PRD.

**Outputs.** `prd.md`, the new lines in `decisions.md`, the stage `prd`.

**Done when** every requirement has an ID, a priority and a quote found verbatim in a transcript (or is flagged), the out-of-scope list exists, and `state.json` says `prd`.

## Learnings

Read [learnings.md](learnings.md) before you run. A problem a run hits and solves is recorded there at the session's end by `/handoff`, which also proposes changes to this file from it (a new rule, or an obsolete one removed), applied only on the developer's yes.

## Test

From `app/`: `npm run skill-test -- prd`. It runs this skill headless on the made-up client in `fixture/` and checks the outputs above, every quote included.
