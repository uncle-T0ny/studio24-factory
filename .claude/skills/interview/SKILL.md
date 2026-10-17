---
name: interview
description: Opens a client's interview and saves its transcript into their folder, verbatim; also starts the folder of a new client. Use on "/interview <slug>" before the interview, "/interview <slug> <transcript file>" after it, "save the interview for <slug>", "new client <slug>".
---

# /interview: open the interview, then save the transcript

**Inputs.** The client's slug, and after the interview the transcript: a file path, or text copied from the app's interview screen.

**Steps.**

1. Resolve the folder: `clients-private/<slug>/` first, then `clients/<slug>/`; read and write only there. No folder yet: a real client gets `clients-private/<slug>/` with the demo client's layout (`README.md`, `interview/`, `feedback/`, `decisions.md`); `clients/` holds only the made-up demo client.
2. Set the stage first, so the client's link opens the interview: from the repo root, `node --experimental-strip-types app/scripts/client-state.ts --slug <slug> --stage interview`. With no transcript yet, stop here.
3. Write the transcript to `interview/<yyyy-mm-dd>.md` (today; `-2` for a second one that day): a `# Interview, <yyyy-mm-dd>` title, a `Source:` line, then each turn as `**Agent:** …` or `**Client:** …`, one paragraph per turn. Copy the words verbatim: no fixing, no summarising, no merged turns; every later quote is checked against this file.
4. Under `clients/`, stop if the transcript holds an email address or a real person's name: it belongs in `clients-private/`.

**Outputs.** The stage `interview`, then `interview/<yyyy-mm-dd>.md`.

**Done when** `state.json` says `interview` and the transcript file holds every turn of the source, word for word.

## Test

From `app/`: `npm run skill-test -- interview`. It runs this skill headless on the made-up client in `../prd/fixture/` with `inbox/interview.txt` and checks the transcript file and the stage.
