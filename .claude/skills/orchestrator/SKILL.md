---
name: orchestrator
description: The framework's entry point. Tells where a client is, what is done and missing, and the one next stage skill to run; logs progress; on the developer's yes, launches the work as background sessions. Use on "/orchestrator", "/orchestrator <slug>", "where are we with <slug>", "what's next", "run the next stage".
---

# /orchestrator: where the client is, and what's next

The developer decides; the orchestrator recommends, launches what was approved, and reports. It never does a stage's work in its own thread.

**Inputs.** A client's slug, or none: then list every folder in `clients-private/` and `clients/` with its stage from `state.json` and its next skill, and stop.

**Steps.**

1. Resolve the folder ([clients.md](clients.md): the stages, the stage command, the folders and privacy): `clients-private/<slug>/` first, then `clients/<slug>/`; read and write only there. No folder: the next action is `/interview <slug>`.
2. Read `state.json` (the stage) and list which stage files exist: `interview/*.md`, `prd.md` (more than a placeholder), `analysis.md`, `estimate.md`, `prototype.md`, `feedback/*.md`, `handover.md`.
3. Pick the one next action, the first row that matches:

   | Stage and files                             | Next                                                            |
   | ------------------------------------------- | --------------------------------------------------------------- |
   | `interview`, no transcript                  | the client takes the interview; then `/interview <slug> <file>` |
   | `interview`, a transcript                   | `/prd <slug>`                                                   |
   | `prd`, no `analysis.md`                     | `/analyze-template <slug> <template link>`                      |
   | `prd`, `analysis.md` but no `estimate.md`   | `/estimate <slug>`                                              |
   | `analysis`                                  | `/prototype <slug>`                                             |
   | `prototype`                                 | `/feedback <slug>`, to open the client's feedback               |
   | `feedback`, no feedback file                | the client tries the prototype; then `/feedback <slug> <file>`  |
   | `feedback`, changes asked in `decisions.md` | `/prototype <slug>` again                                       |
   | `feedback`, nothing left to change          | `/handover <slug> <final app URL>`                              |
   | `final`                                     | the open items of the `handover.md` checklist                   |

4. Report in four lines: the stage, what is done (the files), what is missing, and the next action with the exact command; then append one line to `progress.md`, an append-only log (create it with a `# Progress: <slug>` title): `- <yyyy-mm-dd HH:MM> stage <stage>; done: <files>; next: <action>`, the time from `date "+%F %H:%M"`.
5. Ask the developer to approve the next action. Only on a yes:
   - a stage skill runs in a background subagent, given the slug and this repo's path;
   - build work (the dev app from the template) runs as parallel background sessions, each in its own git worktree (`git worktree add ../<repo>-worktrees/<branch> -b <branch> <base>`, never the Agent tool's worktree isolation), each owning a listed set of files; one integrator session is the only writer to `main`;
   - sessions check in at each milestone; relay the developer's decisions to them, and report each check-in back to the developer.
   - a session without the bound prod copy runs no prod command: it hands each command, ready to paste, to the integrator and mirrors the stage with `--dry-run`.

**Done when** the developer has the stage, the done and missing files, and one next action, and `progress.md` has today's line. It never sets the stage; the stage skills do.

## Learnings

Read [learnings.md](learnings.md) before you run. A problem a run hits and solves is recorded there at the session's end by `/wrap-up`, which also proposes changes to this file from it (a new rule, or an obsolete one removed), applied only on the developer's yes.

## Test

From `app/`: `npm run skill-test -- orchestrator`. It runs this skill headless on the made-up client in `../prd/fixture/` at stage `prd` with `analysis.md` and no `estimate.md`, and checks that it names `/estimate`, appends `progress.md`, leaves the stage, and launches nothing.
