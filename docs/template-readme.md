# Client app starter

A starter for small client web apps: an owner signs in, works on her own records, and shares one record with a guest through a secret link, with no account. It ships the parts every such app needs, already tested, and one small example resource (`projects`) to replace with the client's domain.

Extracted 2026-10-17 from a client app built 2026-10-16, cleaned in review. Version 0.4.0.

## Run locally

You need only [Node.js](https://nodejs.org) 22 (22.6 or later) and git: no Convex account and no keys. The same commands work in PowerShell, cmd, bash and zsh:

```sh
git clone https://github.com/uncle-T0ny/client-app-starter.git
cd client-app-starter
npm start
```

The first run installs the packages, downloads the local Convex backend and takes a minute or two; later runs reuse everything and are ready in seconds. It prints the app's URL (http://localhost:5173) and the sign-in: `demo@example.com` with a generated password, saved in `.env.local`. Stop it with Ctrl+C.

What `npm start` does (`app/scripts/start.ts`, every step idempotent): installs `app/` if `node_modules` is missing; makes or reuses a local anonymous Convex deployment (`CONVEX_AGENT_MODE=anonymous`, so it stays local even if you are logged in to Convex); generates the Convex Auth keys, `SITE_URL`, a local `VOICE_AGENT_SECRET` and the demo password, and sets them on the deployment through stdin, never on a command line; pushes the optional keys it finds; seeds the demo owner (`convex/seed.ts`); starts `convex dev` and Vite together, and the voice agent when voice is on.

**With no keys** everything works but voice: sign-in, projects, share links, feedback, export and import. A project's page takes a typed message instead of the microphone.

**Optional keys** go in `.env.local` in the repo root (gitignored; copy `.env.example`), never in a shell `export`, `set` or `$env:`. A name already in your environment wins over the file. Each `npm start` pushes the keys it finds to the local deployment and removes the ones you deleted.

| Key                                                    | Turns on                                                                   |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Voice: the LiveKit project the browser and the agent join                  |
| `DEEPGRAM_API_KEY`                                     | Voice: the agent's speech, Nova-3 in and Aura-2 (Thalia) out               |
| `OPENROUTER_API_KEY`                                   | Voice: the agent's replies (the LLM, `OPENROUTER_MODEL` to change it)      |
| `AGENT_NAME`                                           | The voice worker's name in the LiveKit project (default `voice-assistant`) |
| `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`                   | Password-reset emails through Resend                                       |

Voice is on only when all five voice keys (the first three rows) are set; then `npm start` also installs and starts the agent worker. Give each worker that shares one LiveKit project its own `AGENT_NAME`.

**Reset the local data:** stop `npm start`, then `npm run reset` deletes the local deployment (`app/.convex/`); the next `npm start` makes a new one and seeds it again. `.env.local` stays. `npm run start:check` runs the whole start, checks that the app answers and the seed is there, and stops (CI runs it on Linux, macOS and Windows).

**Windows** is supported natively (PowerShell or cmd). If a native install fails, WSL2 with Node 22 is the alternative. Safari blocks the local Convex dashboard (not the app); open the dashboard in another browser.

## Stack

- **Frontend:** Vite, React 19 and TypeScript (strict), React Router, in `app/`.
- **Backend:** [Convex](https://convex.dev): the database, live queries, file storage and Convex Auth (email and password).
- **Email:** [Resend](https://resend.com) for the password-reset code.
- **Hosting:** Cloudflare Workers static assets in SPA mode, deployed with Wrangler (no Worker script).
- **Tests:** Vitest (with convex-test for the Convex functions) and Playwright (Chromium) on a local anonymous Convex backend.

## What is in it

| Module                                                                                                                                                             | Where                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Auth: email and password, an owner allowlist (`OWNER_EMAILS`, checked at sign-up and on every call), password reset by a Resend code, clear sign-in problems       | `convex/auth.ts`, `convex/lib/owners.ts`, `convex/lib/signIn.ts`, `convex/accounts.ts`, `convex/ResendOTPPasswordReset.ts`, `src/auth/` |
| Access layer: `ownerQuery`, `ownerMutation`, `projectQuery`, `projectMutation`; the share-token pattern (`/p/<token>`, revocable)                                  | `convex/lib/functions.ts`, `convex/lib/access.ts`, `convex/share.ts`, `src/share/`                                                      |
| Migrations: `@convex-dev/migrations`, with one example migration                                                                                                   | `convex/migrations.ts`                                                                                                                  |
| Validators as the single source of the data shapes; the test-functions guard and owner cleanup over a configured table list                                        | `convex/lib/validators.ts`, `convex/testing.ts`, `convex/lib/ownerData.ts`                                                              |
| UI kit: neutral tokens (slate, a blue accent, system fonts; light and dark), components, the `/ui-kit` page, the `ui-kit` agent skill                              | `src/ui/`, `.claude/skills/ui-kit/SKILL.md`                                                                                             |
| In-app feedback: a dialog with a pasted screenshot and the page's context, a `/feedback` inbox, a triage script                                                    | `convex/feedback.ts`, `src/feedback/`, `scripts/feedback.ts`                                                                            |
| Export and import of one record as a versioned JSON file, behind an adapter; a whole-database backup script                                                        | `convex/lib/backup.ts`, `convex/backup.ts`, `src/backup/`, `scripts/backup.ts`                                                          |
| Wrangler SPA deploy                                                                                                                                                | `wrangler.jsonc`, `npm run deploy`                                                                                                      |
| Playwright harness: its own local anonymous backend in `app/.e2e/`, refuses cloud deployments, a fresh test owner per test                                         | `e2e/`                                                                                                                                  |
| Checks: format, typecheck, strict lint rules, English only, no raw colours, knip, tests                                                                            | `npm run check`                                                                                                                         |
| Generic helpers: errors, error boundary, upload, timed state, undo history, platform, dates                                                                        | `src/lib/`                                                                                                                              |
| The example resource: `projects` (ownerId, name, shareToken), the list, the owner's page, the share-link page                                                      | `convex/projects.ts`, `src/projects/`                                                                                                   |
| Optional voice (LiveKit), on only with its five keys: a token mint with a daily cap, a transcript HTTP action, a voice card with a typed fallback, an agent worker | `convex/livekit.ts`, `convex/voice.ts`, `convex/http.ts`, `src/voice/`, `agent/` (see [Optional: voice](#optional-voice-livekit))       |
| Local run: `npm start` on a local anonymous Convex deployment, the demo owner's seed with the app's own hook                                                       | `app/scripts/start.ts`, `app/scripts/start/`, `convex/seed.ts`                                                                          |

## Start a new app from it

1. Copy the folder (without `.git`, the `node_modules` folders, `app/.e2e`, `app/.convex` and the `.env.local` files) and run `git init`.
2. Rename the app in `app/convex/lib/appConfig.ts`: `APP_NAME`, `BRAND` and `BACKUP_FORMAT` (choose the format name once, before the first real export). Also `name` in `app/package.json` and `app/wrangler.jsonc`, the `<title>` in `app/index.html`, and the placeholder icons in `app/public/`.
3. Install and create your own Convex project, on your own Convex account:

   ```sh
   cd app
   npm install
   npx convex login status   # check it is the account you mean, before anything is created
   npx convex dev            # creates the project and its dev deployment, writes .env.local
   npx @convex-dev/auth      # sets JWT_PRIVATE_KEY and JWKS on the dev deployment
   ```

4. Set the dev deployment's environment variables with `npx convex env set NAME value` (names only here; values never go into the repo):
   - `SITE_URL`: `http://localhost:5173` in dev, the app's URL in prod.
   - `OWNER_EMAILS`: comma-separated emails allowed to sign up. Unset means nobody can.
   - `AUTH_RESEND_KEY`: a Resend API key with sending access, restricted to your domain. Set it with `npx convex env set AUTH_RESEND_KEY` and no value, so the CLI asks for it and it stays out of your shell history.
   - `AUTH_EMAIL_FROM`: the reset email's sender, such as `My App <no-reply@your-domain>`.
   - `ALLOW_TEST_FUNCTIONS=true`: dev only, for `npm run prove:owner`. Never on prod.
5. Resend: add and verify the sending domain (its DNS records), then create the key for that domain only. Until the domain is verified, reset emails fail with "Couldn't send the email right now."
6. Replace the example: change `projectFields` in `convex/lib/validators.ts`, `convex/projects.ts` and `src/projects/`, keep every public function on the builders in `convex/lib/functions.ts`, and add every owner-scoped table to `convex/lib/ownerData.ts` (a test fails until you do).

## Run

Locally, with no account: `npm start` in the repo root ([Run locally](#run-locally)). Against your own cloud dev deployment:

```sh
cd app
npx convex dev   # keeps the dev deployment's functions in sync
npm run dev      # http://localhost:5173 ; the kit is at /ui-kit once signed in
```

**The seed.** `convex/seed.ts` is what `npm start` runs on every start: `seed:run` (an internal action, since Convex Auth creates password accounts only from an action) makes the demo owner from `DEMO_OWNER_EMAIL` and `DEMO_OWNER_PASSWORD`, then calls `seed:demoData`, the internal mutation marked as the app's seed hook: put the app's own demo records there, idempotent.

## Check and test

```sh
npm run check    # format:check, typecheck (app and convex/), lint, check:english, check:colors, knip, Vitest
npm test         # Vitest only
npm run build    # typecheck and production build
```

## End-to-end tests

Playwright, Chromium only, in `e2e/`: one spec each for auth, share, feedback and backup. They run against their own local anonymous Convex backend and a Vite server, never against a cloud deployment.

```sh
npx playwright install chromium   # once
npm run e2e                       # starts the backend and Vite, runs the suite, stops them
npm run e2e:backend               # optional: keep the backend up between runs
E2E_BACKEND_PORT=3580 E2E_SITE_PORT=3581 E2E_VITE_PORT=5580 npm run e2e   # other ports
```

The Convex CLI runs in `app/.e2e/` (gitignored), so the suite never writes `app/.env.local`. It refuses to run if `app/.e2e/.env.local` names a cloud deployment, the one `app/.env.local` names, or one listed in `E2E_SHARED_DEPLOYMENTS` (comma-separated deployment names, from your shell). The first run makes the local deployment and sets its Convex Auth keys, `SITE_URL`, `OWNER_EMAILS` (one test owner) and `ALLOW_TEST_FUNCTIONS=true`. Each test signs up its own `test-owner+e2e-…@example.com` and deletes it afterwards.

## Deploy

Backend on Convex prod first, then the frontend on Cloudflare Workers. The full steps and gates are in [docs/deploy-checklist.md](docs/deploy-checklist.md).

1. Create `app/.env.production` (gitignored) with your prod URL only. It is public (the build ships it to every browser), but it names your deployment, so it stays out of the template:

   ```sh
   VITE_CONVEX_URL=https://<prod-deployment-name>.convex.cloud
   ```

2. Deploy:

   ```sh
   npm run deploy:convex   # convex deploy: pushes convex/ to prod (asks to confirm)
   npm run deploy:web      # vite build against .env.production, then wrangler deploy
   npm run deploy          # both, in that order
   ```

## Backup

- **Export project** (on a project's page, owner only) downloads one JSON file: the versioned envelope `{format, version, exportedAt, data}`. **Import project** on the projects list makes a new project from it, with its own share link. Another resource plugs in with its own `BackupAdapter` (`src/backup/adapter.ts`).
- `npm run backup:prod` exports the whole prod database with its files to `app/backups/<date>.zip` (gitignored: it holds real client data and auth tables; keep it off shared machines).
- `npm run feedback -- --prod` prints new feedback as Markdown for triage.

## Optional: voice (LiveKit)

A voice agent inside the app: on a project's page the owner, or a guest with the share link, presses **Start talking** and talks with an assistant that answers out loud. It is off until you turn it on, and generic: the example agent greets you and answers in a sentence or two. Replace its words in `agent/src/prompts.ts`.

How it fits together (details in [docs/architecture.md](docs/architecture.md#optional-voice-livekit)):

1. The browser asks for the microphone first. Only then does it call `livekit.startSession`, a `projectMutation` that counts the session against the daily cap, records it, and mints a 10-minute LiveKit token for a new room. The token dispatches the agent by name.
2. The agent worker (`agent/`, a Node package of its own) joins the room: speech-to-text (Nova-3) and text-to-speech (Aura-2, Thalia) through Deepgram's LiveKit plugin, the LLM through OpenRouter with thinking off. There is no LiveKit Inference fallback.
3. It POSTs every turn to the Convex HTTP action `/voice/agent-events` with a shared secret, then the whole history when the session ends, which replaces the stored turns, so a turn whose POST was lost is filled in at the end.
4. A session ends when the user presses **End**, when she leaves, or at `VOICE_MAX_SECONDS`: the agent says goodbye and deletes the room.

If the microphone is blocked, or the agent doesn't join within 30 seconds (`VOICE_AGENT_JOIN_TIMEOUT_MS` in `app/src/app.config.ts`), the card says what happened and offers a typed message instead, saved with the project (`voice.saveTypedMessage`).

### Set it up

Voice is on only when all five keys are set: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `DEEPGRAM_API_KEY`, `OPENROUTER_API_KEY`. The public query `voice.enabled` reports it; off, the project pages show no mic and no voice card, only the typed message, and `livekit.startSession` refuses. Locally, put the five in the root `.env.local` and run `npm start`: it sets them on the local deployment and starts the worker. For a cloud deployment:

1. **LiveKit Cloud project** (the free Build plan is enough to start): its URL, API key and secret are `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.
2. **Deepgram key**: `DEEPGRAM_API_KEY`, for the agent's speech in and out.
3. **OpenRouter key**, with a credit limit on it: `OPENROUTER_API_KEY`. The model is `OPENROUTER_MODEL`, by default `anthropic/claude-haiku-5.5`.
4. **A shared secret** for the transcript route, the same on both sides: `VOICE_AGENT_SECRET` (for example `openssl rand -base64 32`).
5. **The Convex deployment's env** (`npx convex env set NAME`, with no value, prompts for it): the five keys (Convex uses the last two only as part of the switch), `VOICE_AGENT_SECRET`, `AGENT_NAME` (the worker to dispatch, default `voice-assistant`), and optionally `VOICE_SESSIONS_PER_DAY` (default 20; `0` stops new sessions).
6. **The agent's env**: `cp agent/.env.example agent/.env.local` and fill in `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `DEEPGRAM_API_KEY`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `AGENT_NAME` (the same as the deployment's), `CONVEX_SITE_URL` (the deployment's HTTP actions URL, `https://<deployment-name>.convex.site`), `VOICE_AGENT_SECRET` and `VOICE_MAX_SECONDS` (default 300). The worker refuses to start while a required one is missing.

The frontend needs no setting: it asks `voice.enabled`. Names only here and in the `.env.example` files: the values never go into the repo.

### Run the worker locally

`npm start` in the repo root runs it for you when the five keys are set. On its own, against a cloud dev deployment:

```sh
cd agent
npm install
npm run dev              # registers with your LiveKit project as AGENT_NAME (default "voice-assistant")
```

Then open a project's page (`npm run dev` in `app/`, with `npx convex dev` running) and press **Start talking**. `npm run check` in `agent/` runs Prettier, the typecheck, the same lint rules as the app, and the unit tests. `npm run build` compiles the worker to `dist/` and `npm run start:prod` runs it (`node dist/main.js start`), for a Node without TypeScript stripping. Its health server listens on 127.0.0.1 only, and what users say is logged at debug, not at `start`'s info level.

### Deploy the worker

The worker only makes outbound connections (to LiveKit, OpenRouter and Convex), so it needs no open ports and no domain.

- **Your own server (the default path):** `agent/Dockerfile` builds an image that compiles the worker (`npm run build`), fetches the model files at build time (`npx livekit-agents download-files`) and runs `node dist/main.js start`; or, without Docker, `agent/deploy/voice-agent.service` is a systemd unit that runs `dist/` (the steps are in its header). Put the env in a root-only file. A stop drains: on SIGTERM the worker lets live sessions run to their end, so keep the stop timeout above `VOICE_MAX_SECONDS` plus a minute.
- **LiveKit Cloud agent hosting (the alternative):** from `agent/`, `lk cloud auth`, then `lk agent create` registers the agent, writes `livekit.toml`, builds the Dockerfile and deploys it; `lk agent deploy` ships a new version, `lk agent status` and `lk agent logs` watch it. Give it the agent's env as secrets. On the free plan an idle agent scales to zero, and the first session after that waits 10 to 20 seconds for it, which the 30-second join timeout covers.

Neither is done for you: the template ships the files, not a deployment.

### Costs and free tiers

Read on 2026-10-17 from the providers' pricing pages; check them again before you rely on them.

| Item                                     | Price                                                    | Free                                                                                                                                                                                                                         |
| ---------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LiveKit Cloud                            | Build plan $0, no card; Ship from $50 a month            | Build: 5,000 WebRTC participant minutes and 1,000 agent session minutes (agents hosted on LiveKit Cloud) a month, 5 concurrent agent sessions. A hard cap: new sessions fail once it is used up, until the 1st of the month. |
| STT, Deepgram Nova-3                     | billed by Deepgram on `DEEPGRAM_API_KEY`                 | Deepgram's own terms; since 0.4.0 the agent calls Deepgram directly, so the LiveKit Inference figures (read 2026-10-17: $0.0048 a minute) no longer apply as such                                                            |
| TTS, Deepgram Aura-2 (Thalia)            | billed by Deepgram on `DEEPGRAM_API_KEY`                 | the same; through LiveKit Inference it was $30 per million characters                                                                                                                                                        |
| LLM, Claude Haiku 5.5 through OpenRouter | $0.10 per million input tokens, $0.50 per million output | none; a reply measured about $0.00004                                                                                                                                                                                        |

A 5-minute session cost roughly $0.10 at the LiveKit Inference prices (estimate: STT about $0.024, TTS about $0.06 for 2,000 characters, the LLM under $0.01); check Deepgram's pricing page for the direct prices. A worker on your own server uses no LiveKit agent session minutes, which count only agents LiveKit hosts (whether its own connection counts as WebRTC participant minutes is unverified).

For batch transcription (a voice note, a recorded feedback), OpenRouter's `POST /api/v1/audio/transcriptions` with `microsoft/mai-transcribe-2` costs $0.10 per audio hour and needs only `OPENROUTER_API_KEY`; ElevenLabs Scribe v2 is reachable the same way when accuracy matters more. It is batch only, which adds about 0.7 to 1 second per turn, so the live agent keeps streaming STT (Nova-3 through Deepgram's plugin).

### The cap

`livekit.startSession` counts every session it starts in `voiceUsage`, per UTC day, inside the same transaction that mints the token, so two clicks can't both take the last one and a failed mint counts nothing. Past `VOICE_SESSIONS_PER_DAY` it refuses with "Today's voice sessions are used up. They start again at 00:00 UTC." The cap is per deployment, owner and guests together. Together with `VOICE_MAX_SECONDS` it bounds the spend: at most cap × max length of audio a day. Set a credit limit on the OpenRouter key too.

### Change it

- **Speech providers:** `speech()` in `agent/src/main.ts`: Deepgram's plugin, `new deepgram.STT({ model: "nova-3" })` and `new deepgram.TTS({ model: "aura-2-thalia-en" })` on `DEEPGRAM_API_KEY`. Another voice is another `aura-2-*` model; another provider is its plugin, such as `@livekit/agents-plugin-elevenlabs` (`new elevenlabs.TTS({ voiceId })`, `ELEVEN_API_KEY`), and then change the switch's `VOICE_KEYS` in `app/convex/lib/voice.ts` and `app/scripts/start/settings.ts`.
- **Domain words:** `KEYTERMS` in `agent/src/prompts.ts` go to Nova-3 as keyterms; empty, none are sent.
- **Turn taking:** `TURN_HANDLING` in `agent/src/main.ts` sets turn detection (VAD and STT endpointing), interruptions and preemptive replies explicitly, so a self-hosted and a LiveKit-hosted worker behave the same. LiveKit's turn detector model is `turnDetection: new inference.TurnDetector()`.
- **Noise cancellation** (off): `inputOptions.noiseCancellation` in `session.start`, for example `audioEnhancement()` from `@livekit/plugins-ai-coustics`, billed through LiveKit Cloud.
- **Recording** (off): `record: false` in `session.start` keeps LiveKit Cloud from recording the session's audio and transcript; the app keeps its own transcript.
- **Per-session context:** the token's dispatch metadata (`convex/livekit.ts`) reaches the agent as `ctx.job.metadata` (`agent/src/metadata.ts`); add what your agent needs there.

### Remove it

Delete `agent/`, `app/src/projects/ProjectVoice.tsx` and the voice branch of `app/src/projects/ProjectAssistant.tsx` (keep its typed message, with `src/voice/TypedFallback.tsx`, or remove both), the rest of `app/src/voice/`, `VOICE_KEYS` in `app/scripts/start/settings.ts`, `app/convex/livekit.ts`, `app/convex/voice.ts`, `app/convex/lib/voice*.ts`, `app/convex/lib/livekitToken.ts`, the route in `convex/http.ts`, the three `voice*` tables in `convex/schema.ts` with their entries in `convex/lib/ownerData.ts`, the call in `projects.remove`, `VOICE_*` in `app/src/app.config.ts`, and the LiveKit packages. On a deployment with voice data, clear the tables first.

## Optional modules, not included

- **PDF export:** jsPDF and svg2pdf.js, embedded static font subsets, and a page fit (Letter, orientation by the drawing's shape), made in the browser from an SVG element. Left out so far; add it as `src/pdf/` with an svg-in, PDF-out API and its own print palette (CSS variables don't resolve in a PDF).

## Docs

- [docs/architecture.md](docs/architecture.md): stack, data, access rules, code map, conventions.
- [docs/deploy-checklist.md](docs/deploy-checklist.md): Convex prod plus Workers, steps, gates and plan limits.
- [CLAUDE.md](CLAUDE.md): the code rules for agents.

## License

MIT, see [LICENSE](LICENSE).
