# The voice agent

The voice interviewer: a [LiveKit Agents](https://docs.livekit.io/agents/) worker that joins a client's interview room, asks about the app they want built (at most five questions, `src/prompts.ts`) and sends the transcript to the app. Deepgram listens (Nova-3) and speaks (Aura-2); the LLM is Claude Haiku through OpenRouter.

The app works without it: when voice is off or fails, the client types the interview instead.

## How it fits in

1. The app (`app/convex/livekit.ts`) mints the browser's LiveKit token, which dispatches an agent by name: `AGENT_NAME` here and in the Convex deployment must match.
2. The worker registers under that name, joins the room, greets the client and runs the interview. At `VOICE_MAX_SECONDS` it says a closing line, deletes the room and ends the job.
3. Each turn, then the whole history at the end, is posted to the Convex HTTP route `/voice/agent-events` with `Authorization: Bearer $VOICE_AGENT_SECRET` (`src/transcript.ts`). A failed post is retried on network errors and 5xx, then logged as a warning without its text.

## Environment

Names only; `.env.example` explains each. The worker refuses to start when a required one is missing (`src/config.ts`).

- Required: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `DEEPGRAM_API_KEY`, `OPENROUTER_API_KEY`, `CONVEX_SITE_URL`, `VOICE_AGENT_SECRET`.
- Optional: `AGENT_NAME` (default `voice-assistant`), `OPENROUTER_MODEL` (default `anthropic/claude-haiku-5.5`), `VOICE_MAX_SECONDS` (default 600, at most 3600), `LOG_LEVEL`.

## Run it locally

Node 22 or later. `npm start` at the repo root starts this worker for you; to run it on its own:

```sh
npm ci
cp .env.example .env.local   # then fill in the values
npm run dev
```

`npm run dev` runs `src/main.ts` directly through Node's type stripping and reads `.env.local`. Checks: `npm run check` (format, typecheck, lint, tests) and `npm run build`.

## Deploy

Production runs on a small Linux VPS as a systemd service, from compiled JavaScript:

```sh
npm ci && npm run build && npm prune --omit=dev
npx livekit-agents download-files
node dist/main.js start    # npm run start:prod
```

Build with `npm run build`, not `npx tsc -p .`: `tsconfig.json` has `noEmit` (it only typechecks); `tsconfig.build.json` writes `dist/`.

`deploy/voice-agent.service` is the unit; its header has the install steps. What it relies on:

- **A stop drains.** In `start` mode the worker stops taking jobs on SIGTERM or SIGINT and lets live sessions run to their end (`drainTimeout` is `VOICE_MAX_SECONDS` plus a minute); the job processes ignore the signal, so systemd signalling the whole group does not cut a call. The unit sends SIGTERM; keep `TimeoutStopSec` above `VOICE_MAX_SECONDS` + 60.
- **`LOG_LEVEL=warn`.** LiveKit Agents logs what the client says at info; `src/logging.ts` moves those records to debug, and warn keeps the journal to warnings and errors.
- **No open ports.** The worker only connects out (LiveKit, Deepgram, OpenRouter, Convex); its health server binds `127.0.0.1`.
- **Secrets** sit in a root-only `EnvironmentFile`, never in the repo.

The `Dockerfile` is the other option: it builds the same `dist/`, fetches the model files at build time and runs `node dist/main.js start` (the commands are in its header).
