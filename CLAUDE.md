# Studio24 Factory: rules for agents

This repo is the developer's framework for building a client's app: this file names the stages and the skill that runs at each, `.claude/skills/` holds one skill per stage, and each client has a folder. The web app is in `app/`, the voice worker in `agent/`. Requirements: [docs/PRD.md](docs/PRD.md). Decisions (stack, key layers, cut order, privacy): [docs/DECISIONS.md](docs/DECISIONS.md). Architecture: [docs/architecture.md](docs/architecture.md). Deploy: [docs/deploy-checklist.md](docs/deploy-checklist.md).

## Before every commit

Run `/pre-commit` ([.claude/skills/pre-commit/SKILL.md](.claude/skills/pre-commit/SKILL.md)): the gates, then NFR-1 to NFR-9 on the staged change. Commit only when every rule passes. The integrator runs it before each merge to `main`.

## The stages

A project moves through six stages, the timeline in the app. Each skill works in the client's folder and then sets the project's stage in Convex.

| Stage     | Skill                                 | Produces                                                                                    |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| interview | `/interview`                          | The client's interview transcript, from the voice agent or the text interview.              |
| PRD       | `/prd`                                | Numbered FRs and NFRs with priorities, each citing a quote, a decisions log, out of scope.  |
| analysis  | `/analyze-template`, then `/estimate` | The template's manifest, a verdict per requirement, then hours plus infrastructure $/month. |
| prototype | `/prototype`                          | The mockup, then a dev app built from the template, linked to the project.                  |
| feedback  | `/feedback`                           | The client's feedback, split into what works and what doesn't.                              |
| final     | `/handover`                           | The final app behind a login, and the handover to the client's own accounts.                |

### interview: `/interview`

### PRD: `/prd`

### analysis: `/analyze-template`, `/estimate`

### prototype: `/prototype`

### feedback: `/feedback`

### final: `/handover`

## Client folders

- `clients/<slug>/` holds only the made-up public demo client, `clients/demo-client/`. Real clients live in `clients-private/<slug>/`: gitignored, its own git repo with no remote.
- A skill looks the slug up in `clients-private/` first, then `clients/`, and writes only in the folder it read from.
- Details stay in the folder; Convex holds the high-level state, set with `npx convex run` under the developer's own login.
- No email address and no deny-listed name under `clients/`; the deny list lives in `clients-private/`.

## Code rules

- TypeScript only, `strict` (with `noUncheckedIndexedAccess`), configs and scripts included. No plain JS, no shell scripts: `app/scripts/start.ts` runs on Node's type stripping with no dependency, the same on macOS, Linux and Windows.
- No `any`, and no `v.any()` in Convex validators: give every field a typed validator. Data shapes come from `convex/lib/validators.ts`, the single source; `src` uses their `Infer<>` types.
- Prettier formats everything (`npm run format`).
- English only, in code, comments, UI text and commit messages.
- Self-explanatory code: names and structure carry the meaning. No comment restates the code; a comment only for a why the code can't show.
- The UI kit is mandatory: build every screen from `src/ui` (its `index.ts`) and its tokens. No raw `<button>`, `<input>`, `<select>` or `<textarea>`, and no raw colours, outside `src/ui/`. A missing pattern goes into the kit first, with its states on `/ui-kit`. See [.claude/skills/ui-kit/SKILL.md](.claude/skills/ui-kit/SKILL.md).
- Every public Convex function uses a builder from `convex/lib/functions.ts` (`ownerQuery`, `ownerMutation`, `projectQuery`, `projectMutation`, `publicQuery`), never the raw `query` or `mutation`.
- A new owner-scoped table goes into `convex/lib/ownerData.ts`.
- Schema changes on deployed data go through `convex/migrations.ts`.
- No secrets in the repo: keys come only from the environment; env var values live in the Convex deployment's env; `.env.local` and `.env.production` are gitignored. Name an env var, never its value.
- Voice is on only when `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `DEEPGRAM_API_KEY` and `OPENROUTER_API_KEY` are all set (`VOICE_KEYS`, in `convex/lib/voice.ts` and `scripts/start/settings.ts`); the UI asks `voice.enabled` and works through typed messages when it is off.
- The app's demo data goes in the seed hook, `seed:demoData` in `convex/seed.ts`, idempotent.
- Tests: Vitest next to the code (`*.test.ts`), each named for the rule it checks; e2e selects by role, label and visible text only.

## Commands

The app lives in `app/`; run every command from there, except `npm start` (the whole app locally, on a local anonymous Convex deployment, no account or keys), `npm run start:check` and `npm run reset`, which run from the repo root. The voice worker is its own package in `agent/` (`npm run check` and `npx tsc -p .` there).

```sh
npm run dev            # Vite on http://localhost:5173 (with `npx convex dev` running)
npm run check          # format:check, typecheck, lint, check:english, check:colors, knip, tests
npm test               # Vitest
npm run build          # typecheck and production build
npm run e2e            # Playwright on its own local anonymous Convex backend
npm run format         # Prettier, writes
npm run deploy         # deploy:convex, then deploy:web (see the deploy checklist)
npm run backup:prod    # whole prod export with files to backups/<date>.zip
npm run feedback       # new support-form feedback as Markdown (-- --prod, -- --all)
```

Never run the e2e suite against a cloud deployment, and never set `ALLOW_TEST_FUNCTIONS` on prod.
