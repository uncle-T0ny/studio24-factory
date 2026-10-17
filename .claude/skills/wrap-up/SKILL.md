---
name: wrap-up
description: Ends a session in this repo: records each problem the session hit and solved in the learnings.md of the skill it belongs to, keeps every learnings.md under its cap, proposes the SKILL.md rule changes they suggest, and logs the client's progress. Use at the end of every session, on "/wrap-up", "/wrap-up <slug>", "wrap up", "end the session".
---

# /wrap-up: learn from the session

**Inputs.** The session itself, or a run note (a file listing what ran, the problems hit and how each was solved); the client's slug if a client was worked on.

**Steps.**

1. List each problem the session hit and solved: the skill it belongs to (`.claude/skills/<skill>/`), the problem, the fix, and the rule it suggests. A problem left unsolved is not a learning: name it in the report as open.
2. Append each to that skill's `learnings.md`: `- <yyyy-mm-dd>: <problem>. Fix: <fix>. Rule: <rule>.` If the file already holds the same lesson, update that entry instead of adding a second.
3. Keep each touched `learnings.md` at most 12,000 characters (about 3k tokens; `wc -c`). Over the cap, rewrite the whole file to fit: merge repeats, summarise old entries, drop those a SKILL.md rule now covers, most costly and most recent first. Never just cut the tail.
4. Propose SKILL.md changes from each touched `learnings.md`: a rule to add (a lesson that recurs or cost a lot) or one to remove (contradicted or obsolete). Print each as the file, the line to add or remove, and the learning behind it. Apply none until the developer says yes; then apply only those approved.
5. A client was worked on: append to its folder's `progress.md` (`clients-private/<slug>/` first, then `clients/<slug>/`): `- <yyyy-mm-dd HH:MM> wrap-up: <what was done>; next: <action>`, the time from `date "+%F %H:%M"`.
6. Report: the entries added per skill, each touched file's size against the cap, the proposals, and the open problems.

**Outputs.** New `learnings.md` entries, the proposals, the `progress.md` line.

**Done when** every solved problem sits in its skill's `learnings.md`, every touched `learnings.md` is under 12,000 characters, the proposals are printed and none applied without a yes, and the client's `progress.md` has the session's line.

## Learnings

Read [learnings.md](learnings.md) before you run. A problem this skill hits and solves is recorded there by the next `/wrap-up`, which also proposes changes to this file from it, applied only on the developer's yes.

## Test

From `app/`: `npm run skill-test -- wrap-up`. It runs this skill headless on the made-up client in `../prd/fixture/` with `inbox/run-note.md` (one solved problem in `/prd`, one unsolved in `/estimate`) and checks the new entry in `prd/learnings.md`, the cap, the printed proposal, an unchanged `prd/SKILL.md` and `estimate/learnings.md`, and the `progress.md` line.
