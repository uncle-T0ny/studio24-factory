---
name: prd
description: Drafts a client's PRD from the interview transcripts in their folder, every requirement backed by a verbatim quote. Use after the interview, on "/prd <slug>", "draft the PRD for <slug>", "write the requirements".
---

# /prd: the PRD from the interview

**Inputs.** The client's slug. Resolve the folder: `clients-private/<slug>/` first, then `clients/<slug>/`; read and write only there. Read every `interview/transcript-*.md`.

**Steps.**

1. Draft `prd.md` with a link to the transcripts and to `decisions.md`, then four sections:
   - `## Functional requirements` and `## Non-functional requirements`: one table each, columns `ID | Requirement | Priority | Quote`. IDs `FR-1`, `FR-2`… and `NFR-1`…; priority `must`, `should` or `could`; the quote is the client's words, copied verbatim, in double quotes.
   - `## Out of scope`: what the client said to leave out, each with its quote.
   - `## Flagged`: every requirement whose quote is not found, or `None`.
2. Prove every quote: `grep -F "<quote>" interview/transcript-*.md`. A quote not found is fixed by copying the exact words, or its row's quote cell becomes `quote not found` and the row is listed under Flagged. Never invent or paraphrase a quote.
3. Append to `decisions.md` (create it with a `# Decisions: <slug>` title) one line per decision the client made: `- D-<n> (prd): <decision>. "<quote>"`.
4. Add the PRD and decisions links to the folder's `README.md` if missing.
5. From the repo root: `node --experimental-strip-types app/scripts/client-state.ts --slug <slug> --stage prd`.

**Outputs.** `prd.md`, `decisions.md`, `README.md` links, the stage `prd`.

**Done when** every requirement has an ID, a priority and a quote found verbatim in a transcript (or is flagged), the out-of-scope list exists, and `state.json` says `prd`.

## Test

From `app/`: `npm run skill-test -- prd`. It runs this skill headless on the made-up client in `fixture/` and checks the outputs above, every quote included.
