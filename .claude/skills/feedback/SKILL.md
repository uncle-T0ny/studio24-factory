---
name: feedback
description: Opens the client's feedback stage, then files their feedback on the prototype, split into what works and what doesn't, each point quoted. Use on "/feedback <slug>" to open it, "/feedback <slug> <file>" to file it, "the client sent feedback".
---

# /feedback: what works and what doesn't

**Inputs.** The client's slug, and once given the feedback: a file, a voice note's transcript, or text from the app's feedback stage. Resolve the folder: `clients-private/<slug>/` first, then `clients/<slug>/`; read and write only there. Read `prd.md`.

**Steps.**

1. Set the stage first, so the client's link opens the feedback: from the repo root, `node --experimental-strip-types app/scripts/client-state.ts --slug <slug> --stage feedback`. With no feedback yet, stop here.
2. Under `clients/`, stop if the feedback holds an email address or a real person's name.
3. Write `feedback/<yyyy-mm-dd>.md` (today; `-2` for a second one that day): a `# Feedback, <yyyy-mm-dd>` title, a `Source:` line, then:
   - `## What works`: one bullet per point, the client's words verbatim in double quotes, and the FR or NFR ID it is about;
   - `## What doesn't`: the same, plus the change it asks for;
   - `## Raw`: the feedback as received.
4. Append to `decisions.md` one line per change the client asked for: `- D-<n> (feedback, <yyyy-mm-dd>): <change>. "<quote>"`. A point no requirement covers is marked `new` there, never added to `prd.md` silently.

**Outputs.** The stage `feedback`, then `feedback/<yyyy-mm-dd>.md` and the new lines in `decisions.md`.

**Done when** `state.json` says `feedback` and every point of the source sits under exactly one of the two sections, with its quote.

## Test

From `app/`: `npm run skill-test -- feedback`. It runs this skill headless on the made-up client in `../prd/fixture/` with `inbox/feedback.txt` and checks the two sections and the stage.
