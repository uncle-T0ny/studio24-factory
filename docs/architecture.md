# Architecture

A skeleton: fill each section in for the app you build. The text below describes the starter as shipped (v0.2.0) and its one example resource, `projects`.

## Stack

| Part           | Choice                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | Vite, React 19, TypeScript (strict), React Router, in `app/`. UI from the kit in `app/src/ui`.                                           |
| Backend        | Convex: database, live queries (an owner and a guest see each other's edits live), file storage.                                         |
| Owner sign-in  | Convex Auth, email and password. Only the emails on the `OWNER_EMAILS` env var can sign up, and the list is checked again on every call. |
| Guest access   | A secret link `/p/<token>`, with no sign-up, scoped to one project. The owner can make a new token, which revokes the old link.          |
| Password reset | Convex Auth `Password({ reset })`: an 8-digit code sent by Resend from `AUTH_EMAIL_FROM`, on a domain verified in Resend.                |
| Migrations     | `@convex-dev/migrations` from the first release, so schema changes on real data go through a migration (`convex/migrations.ts`).         |
| Hosting        | `npx convex deploy`, then the frontend on Cloudflare Workers static assets (SPA mode) with Wrangler.                                     |
| Tests          | Vitest and convex-test (in-memory backend); Playwright on a local anonymous Convex backend.                                              |

## Data (Convex tables)

- `projects` {ownerId, name, shareToken}: the example resource. Indexes `by_owner`, `by_shareToken`.
- `feedback` {ownerId, type: "broken" | "feature" | "question", message, screenshotId?, context: {path, projectId?, appVersion, userAgent, viewport, time, timeZone}, createdAt, status: "new" | "done"}. Not per project: every owner sees every entry. A screenshot is a PNG or JPEG in Convex storage, at most 3 MB and 2400 px on its longest side; the browser shrinks a bigger one before it uploads.
- The Convex Auth tables (`authTables`).
- The optional voice module's `voiceSessions`, `voiceTranscripts` and `voiceUsage` (below, [Optional: voice](#optional-voice-livekit)).

Every shape comes from `convex/lib/validators.ts` (and `convex/lib/feedback.ts`): the schema, the functions' args and `returns`, and the types `src` uses (`Infer<>`). Every table that holds an owner's data is listed in `convex/lib/ownerData.ts`.

## Access rules

Every public Convex function is declared with a builder from `convex/lib/functions.ts`, which applies the rules in `convex/lib/access.ts`. ESLint forbids the raw `query` and `mutation` in function files.

- `ownerQuery` / `ownerMutation`: a signed-in owner, or "Not allowed". They add `ctx.ownerId` and `ctx.access`.
- `projectQuery` / `projectMutation`: the owner or a guest. They take the optional `shareToken` arg and add `ctx.access`, whose `find*` methods return null and `require*` methods throw "Not allowed"; `*OwnedProject` refuses a guest. With a token the caller is that project's guest and nobody else, even when an owner is signed in.
- `publicQuery`: `accounts.status` (before sign-in) and `projects.getByShareToken` (the project without its `ownerId`).
- Internal functions (`internalQuery`, `internalMutation`): `feedback.listForTriage` for `npm run feedback`, `voice.recordEvent` for the voice agent's HTTP route, and `convex/testing.ts`, which throws unless the deployment sets `ALLOW_TEST_FUNCTIONS=true`.

An owner is a signed-in user whose email is on `OWNER_EMAILS`, checked on every call (`findOwner`): taking an email off the list locks that account out at once, while the share links to its projects keep working.

`accounts.status` exists because prod masks auth errors as "Server Error": after a failed sign-in or sign-up the form asks it why (`src/auth/authProblems.ts`). It answers only `missing`, `locked` or `ready`. An email off the allowlist answers `missing`, like an owner's email with no account yet, so the public query doesn't reveal who is on the list; sign-up then refuses it. The accepted trade-off: anyone can learn whether an email has a usable account, which the form needs to tell a wrong password from a missing account.

A resource that belongs to a project gets its own `find*`/`require*` pair in `Access`, which loads the row and checks its project with `findProject`.

## Code map (`app/`)

### Environment and scripts

`npx convex dev` writes `.env.local` (`CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`), gitignored. `npm start` in the repo root (`app/scripts/start.ts`) runs everything on a local anonymous deployment instead and keeps its own settings (the demo password, the optional keys) in the root `.env.local`; it sets the deployment's env through the CLI's stdin and seeds with `convex/seed.ts`. `.env.production` (gitignored, made by hand) holds the prod `VITE_CONVEX_URL`, which `vite build` reads. Backend settings live in the deployment's env, never in a file: `SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`, `OWNER_EMAILS`, `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`; dev only `ALLOW_TEST_FUNCTIONS`. `vite.config.ts` defines `__APP_VERSION__`, the git short commit of the build, sent with every feedback entry.

| Script                | Does                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run check`       | `format:check`, `typecheck` (app and `convex/`), `lint`, `check:english`, `check:colors`, `knip`, `npm test` |
| `npm run e2e`         | Playwright on its own local anonymous backend; state in `app/.e2e/`                                          |
| `npm run build`       | typecheck and production build                                                                               |
| `npm run deploy`      | `deploy:convex`, then `deploy:web`                                                                           |
| `npm run backup:prod` | `convex export` of prod with its files to `backups/<date>.zip`                                               |
| `npm run feedback`    | new feedback as Markdown (`-- --prod`, `-- --all`)                                                           |
| `npm run prove:owner` | optional smoke test of the sign-up gate and the owner's path on the dev deployment                           |

### Where things are

- `convex/schema.ts`, `convex/lib/validators.ts`: the data.
- `convex/lib/functions.ts`, `convex/lib/access.ts`: the access builders and rules. A function file only declares functions; its helpers live in `convex/lib/<topic>.ts`, and its `returns` validator pins what the client receives.
- `convex/projects.ts`, `convex/share.ts`: the example resource and its share token.
- `convex/auth.ts`, `convex/accounts.ts`, `convex/ResendOTPPasswordReset.ts`, `convex/lib/owners.ts`, `convex/lib/signIn.ts`: sign-in.
- `convex/feedback.ts`, `convex/lib/feedback.ts`, `convex/lib/feedbackEntries.ts`: feedback.
- `convex/backup.ts`, `convex/lib/backup.ts`: the export envelope and the example's export and import.
- `convex/testing.ts`, `convex/lib/ownerData.ts`: test owners and their cleanup.
- `src/App.tsx`: the routes (`/`, `/project/:id`, `/p/:token`, `/feedback`, `/ui-kit`) inside an error boundary.
- `src/projects/`, `src/share/`, `src/backup/`, `src/feedback/`, `src/auth/`, `src/voice/`: the features, on the kit.
- `src/ui/`: the UI kit; `/ui-kit` shows every component in its states and needs a signed-in owner.
- `src/lib/`: generic helpers that import only `lib/` and `ui/` (lint-enforced).
- `e2e/`: the specs and `e2e/support/` (ports, the local deployment guard, owners, fixtures, page helpers).

## Optional: voice (LiveKit)

On only when the deployment has all five keys, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `DEEPGRAM_API_KEY` and `OPENROUTER_API_KEY` (`VOICE_KEYS` in `convex/lib/voice.ts`). The public query `voice.enabled` reports it; `src/projects/ProjectAssistant.tsx` shows the voice card when it is on and only the typed message when it is off, and `livekit.startSession` refuses when it is off. Setup, costs and removal are in the [README](../README.md#optional-voice-livekit). Nothing in it is about one app: the example agent is a short assistant.

```text
browser (src/voice/VoiceSession)                Convex                           agent/ (Node worker)
  Start: getUserMedia ok?  ── no ──> fallback: typed message ──> voice.saveTypedMessage
     │ yes
     └─ livekit.startSession ─────────────> cap +1 (voiceUsage), voiceSessions row,
                                            token: room voice-<random>, dispatch AGENT_NAME
  Room.connect(token) ── LiveKit Cloud creates the room and dispatches the agent ──> joins
  agent not in the room after 30 s ──> fallback                    STT → LLM → TTS in the room
                                         POST /voice/agent-events <── each turn {index}, then
                                         (Bearer VOICE_AGENT_SECRET)     the end with the history
                                         voiceTranscripts upserted;      limit: goodbye, deleteRoom
                                         the end replaces them
```

- **Token** (`convex/livekit.ts`, `convex/lib/livekitToken.ts`): a `projectMutation`, so the owner or a share-token holder; identity `owner-<sessionId>` or `guest-<sessionId>`, a 10-minute TTL, grants to join that one room, publish, subscribe and send data, and a `RoomConfiguration` that dispatches the agent with `{sessionId}` as metadata. A token's dispatch applies only when its join creates the room, hence a new room name per session and no `createRoom` call. `livekit-server-sdk` runs in the default runtime (jose on WebCrypto), so there is no `"use node"` file, and the cap, the row and the mint are one transaction.
- **Cap**: `voiceUsage` {day, sessions}, one row per UTC day, checked and incremented before the mint; `VOICE_SESSIONS_PER_DAY` (default 20, `0` is off). With voice off (a missing key) it refuses with "Voice is off on this deployment: it needs its LiveKit, Deepgram and OpenRouter keys." before anything is counted.
- **Ingest** (`convex/http.ts`, `convex/lib/voiceData.ts`): the bearer secret is compared in constant time (both sides hashed with SHA-256 first); an unset `VOICE_AGENT_SECRET` lets nobody in. The body is checked against `agentEventValidator`; 401, 400, 404 (unknown room) or 204. A turn is upserted by (session, index), so a retried POST stores nothing twice, and ignored once the session ended; the end event deletes the session's voice turns, inserts its history and sets `endedAt`, so sending it twice gives the same rows. Convex never retries an HTTP action; the agent retries network errors and 5xx (three tries, backoff), not 4xx.
- **Data**: `voiceSessions` {ownerId, projectId, roomName, startedAt, endedAt?, endReason?} (`by_owner`, `by_project`, `by_roomName`); `voiceTranscripts` {ownerId, projectId, sessionId?, index?, role: "user" | "assistant", text, at, source: "voice" | "typed"} (`by_owner`, `by_project`, `by_session`); a typed message has no session. Both carry the project's `ownerId` and are in `convex/lib/ownerData.ts`; `projects.remove` deletes a project's voice rows with it. Shapes in `convex/lib/voice.ts`; the agent's copy of the event shapes is `agent/src/transcript.ts`.
- **Browser** (`src/voice/`, `src/projects/ProjectVoice.tsx`, lazy-loaded): its own `Room` in `RoomContext`, `useVoiceAssistant` for the agent's state, `useTranscriptions` for the live transcript, `RoomAudioRenderer`, `useAudioPlayback` for blocked autoplay. Not components-react's `useSession`: it fetches a token on mount (`prepareConnection`), which would spend the cap on every page view.
- **Agent** (`agent/`, its own package: TypeScript run by Node's type stripping in dev, so erasable syntax only, and compiled to `dist/` by `npm run build` for `npm run start:prod`; Prettier and the app's lint rules without React): `ServerOptions({ agentName, host: "127.0.0.1" })` for explicit dispatch under `AGENT_NAME` (default `voice-assistant`, the same name the token dispatches) with its health server on this machine only; Silero VAD, Deepgram's plugin with Nova-3 (STT) and `aura-2-thalia-en` (TTS) on `DEEPGRAM_API_KEY`, no LiveKit Inference; the framework's `lk.pii.*` records (what users say) moved from info to debug (`agent/src/logging.ts`); the OpenAI plugin pointed at OpenRouter, with `reasoning: { enabled: false }` added to every request body and `max_completion_tokens`; turn handling set explicitly; `record: false`; the session limit (`VOICE_MAX_SECONDS`) says a closing line, deletes the room and shuts the job down; `deleteRoomOnClose` removes the room whenever the session closes; the shutdown callback sends the history; `drainTimeout` lets a SIGTERM wait for live sessions. Its config is checked at start (`agent/src/config.ts`).
- **Tests**: `convex/livekit.test.ts` (access, the cap, the decoded and verified grants), `convex/voice.test.ts` (secret, validation, idempotent turns, the end, the typed fallback, the cascade), `src/voice/voiceStatus.test.ts`, `agent/src/*.test.ts`, and `e2e/voice.spec.ts` (with voice off, no mic or voice card, and the typed message is saved). Nothing in the suites reaches LiveKit or OpenRouter.

## Conventions

- TypeScript strict with `noUncheckedIndexedAccess` and `verbatimModuleSyntax`; no `any`, no `v.any()`, no `!` outside tests (use `defined()` in a test).
- ESLint `strictTypeChecked` with type-aware parsing; import order; files at most 400 lines, functions 120, complexity 15 (tests are exempt from the size rules); raw `button`/`input`/`select`/`textarea` and deep kit imports only inside `src/ui/`; `src/ui/` and `src/lib/` import no feature code; English only. An `eslint-disable` carries its reason.
- Errors: the server throws `ConvexError` with a sentence for the user, the client throws `UserError`; components show them with `useErrorState` (inline) or `useErrorToast`, which also log to the console.
- A kind is a string enum; an outside string becomes one through `enumGuard` (`src/lib/enums.ts`).
- Tests select by role, label and visible text only.
