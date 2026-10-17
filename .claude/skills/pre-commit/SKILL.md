---
name: pre-commit
description: Runs before every commit, and before every merge to main. Runs the gates, then checks the staged change against each non-functional requirement (NFR-1 to NFR-9 in docs/PRD.md) and prints pass or fail per rule. Use before any `git commit` or merge, on "/pre-commit", "commit this", "ready to commit", "merge it". The commit waits until every rule passes.
---

# /pre-commit: the gates and the NFRs, before every commit

Every session runs this before each commit; the integrator runs it before each merge to `main`. The commit (or merge) waits until every line below says PASS. Paths are relative to the repo root.

## 1. Gates

- In `app/`: `npm run check`, `npm test`, `npm run build`. Once the privacy check is part of `npm run check`, it runs there.
- In `agent/`, when the change touches it: `npm run check`, `npx tsc -p .`.

A red gate is a FAIL of NFR-5; fix it, don't skip it.

## 2. The rules, on the staged change

Read `git diff --cached` (and `--stat`), then check each rule:

- **NFR-1 TypeScript.** Every new code file is TypeScript (JS only for a config a tool reads as JS; no shell scripts). No `any`, no `as any`, no `v.any()`, no `@ts-ignore`. Prettier-formatted. English only, in code, comments, UI text and the commit message.
- **NFR-2 No secrets, no personal data.** No key value anywhere: name the env var, never its value. No `.env*` file but `.env.example`, which holds names only. Nothing under `clients-private/`. Under `clients/`: no email address, no deny-listed name (the list lives in `clients-private/`), only the made-up demo client.
- **NFR-3 Runs without keys.** `npm start` with no keys still runs the whole flow in text, the AI's answers recorded and labelled "recorded demo answer". A feature that needs a key keeps the layer below it working; voice is offered only when its keys are set.
- **NFR-4 Deployable.** The production build passes; a new env var is named in `.env.example`; nothing assumes a local path, host or account.
- **NFR-5 Gates green.** Step 1 passed; new logic has a test.
- **NFR-6 Spend capped.** Every new model call, speech call or LiveKit token goes through the usage check before it runs.
- **NFR-7 Honest time log.** One step per commit, committed when it is done; no rewriting of history; a message that says what changed.
- **NFR-8 Self-explanatory code.** Names and structure carry the meaning. For each added comment:
  - it restates the code: delete it;
  - it explains what a block does: rename or extract instead, then delete it;
  - it states a why the code can't show (a constraint, a provider quirk, a rejected alternative): keep it, one line if it can be.

  No commented-out code, no section banners, no doc comment that repeats the signature. Fewer comments is the goal: when in doubt, cut.

- **NFR-9 Explainable.** A small change; no unused export, file or dependency (knip in `app/`, a re-read in `agent/`); no speculative abstraction; each test name states the rule it checks ("rejects a client link opened at the wrong stage", not "works").

## 3. Report

Print one line per gate and per rule, a FAIL with its `file:line` and the reason:

```
gates   app: check PASS, test PASS, build PASS; agent: not touched
NFR-1   PASS
NFR-8   FAIL app/convex/projects.ts:42 the comment restates the code
...
```

Any FAIL: fix it, stage the fix, run this again. Commit only when all pass.

## Learnings

Read [learnings.md](learnings.md) before you run. A problem a run hits and solves is recorded there at the session's end by `/wrap-up`, which also proposes changes to this file from it (a new rule, or an obsolete one removed), applied only on the developer's yes.
