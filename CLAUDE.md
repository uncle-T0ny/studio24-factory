# Client app starter: rules for agents

The app lives in `app/`; run every command from there, except `npm start` (the whole app locally, on a local anonymous Convex deployment, no account or keys: README, "Run locally"), `npm run start:check` and `npm run reset`, which run from the repo root. The optional voice agent is its own package in `agent/` (`npm run check` there). Architecture: [docs/architecture.md](docs/architecture.md). Deploy: [docs/deploy-checklist.md](docs/deploy-checklist.md).

## Code rules

- TypeScript only, `strict` (with `noUncheckedIndexedAccess`), configs and scripts included. No plain JS, no shell scripts: `app/scripts/start.ts` runs on Node's type stripping with no dependency, the same on macOS, Linux and Windows.
- No `any`, and no `v.any()` in Convex validators: give every field a typed validator. Data shapes come from `convex/lib/validators.ts`, the single source; `src` uses their `Infer<>` types.
- Prettier formats everything (`npm run format`).
- English only, in code, comments, UI text and commit messages.
- The UI kit is mandatory: build every screen from `src/ui` (its `index.ts`) and its tokens. No raw `<button>`, `<input>`, `<select>` or `<textarea>`, and no raw colours, outside `src/ui/`. A missing pattern goes into the kit first, with its states on `/ui-kit`. See [.claude/skills/ui-kit/SKILL.md](.claude/skills/ui-kit/SKILL.md).
- Every public Convex function uses a builder from `convex/lib/functions.ts` (`ownerQuery`, `ownerMutation`, `projectQuery`, `projectMutation`, `publicQuery`), never the raw `query` or `mutation`.
- A new owner-scoped table goes into `convex/lib/ownerData.ts`.
- Schema changes on deployed data go through `convex/migrations.ts`.
- No secrets in the repo: env var values live in the Convex deployment's env; `.env.local` and `.env.production` are gitignored. Local optional keys go in the root `.env.local`, never in a shell export.
- Voice is on only when `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `DEEPGRAM_API_KEY` and `OPENROUTER_API_KEY` are all set (`VOICE_KEYS`, in `convex/lib/voice.ts` and `scripts/start/settings.ts`); the UI asks `voice.enabled` and works through typed messages when it is off.
- The app's demo data goes in the seed hook, `seed:demoData` in `convex/seed.ts`, idempotent.
- Tests: Vitest next to the code (`*.test.ts`); e2e selects by role, label and visible text only.
- Run `npm run check` before you call anything done.

## Commands

```sh
npm run dev            # Vite on http://localhost:5173 (with `npx convex dev` running)
npm run check          # format:check, typecheck, lint, check:english, check:colors, knip, tests
npm test               # Vitest
npm run build          # typecheck and production build
npm run e2e            # Playwright on its own local anonymous Convex backend
npm run format         # Prettier, writes
npm run deploy         # deploy:convex, then deploy:web (see the deploy checklist)
npm run backup:prod    # whole prod export with files to backups/<date>.zip
npm run feedback       # new feedback as Markdown (-- --prod, -- --all)
```

Never run the e2e suite against a cloud deployment, and never set `ALLOW_TEST_FUNCTIONS` on prod.
