# Code rules and commands

The rules every code change follows; [SKILL.md](SKILL.md) checks them before each commit.

## Code rules

- TypeScript only, `strict` (with `noUncheckedIndexedAccess`), configs and scripts included. No plain JS, no shell scripts: `app/scripts/start.ts` runs on Node's type stripping with no dependency, the same on macOS, Linux and Windows.
- No `any`, and no `v.any()` in Convex validators: give every field a typed validator. Data shapes come from `convex/lib/validators.ts`, the single source; `src` uses their `Infer<>` types.
- Prettier formats everything (`npm run format`).
- English only, in code, comments, UI text and commit messages.
- Self-explanatory code: names and structure carry the meaning. No comment restates the code; a comment only for a why the code can't show.
- The UI kit is mandatory: build every screen from `src/ui` (its `index.ts`) and its tokens. No raw `<button>`, `<input>`, `<select>` or `<textarea>`, and no raw colours, outside `src/ui/`. A missing pattern goes into the kit first, with its states on `/ui-kit`. See [the ui-kit skill](../ui-kit/SKILL.md).
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
npm run check:privacy  # no email address or deny-listed name under clients/
npm test               # Vitest
npm run build          # typecheck and production build
npm run e2e            # Playwright on its own local anonymous Convex backend
npm run format         # Prettier, writes
npm run deploy         # deploy:convex, then deploy:web (see the deploy checklist)
npm run backup:prod    # whole prod export with files to backups/<date>.zip
npm run feedback       # new support-form feedback as Markdown (-- --prod, -- --all)
npm run skill-test -- <skill>  # one skill headless on the made-up fixture client
```

Never run the e2e suite against a cloud deployment, and never set `ALLOW_TEST_FUNCTIONS` on prod.
