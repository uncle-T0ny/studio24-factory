# Running Studio24 Factory

## How to run the project

From a terminal, with [Node.js](https://nodejs.org) 22 (22.6 or later) and git; no account and no key:

```sh
git clone https://github.com/uncle-T0ny/studio24-factory.git
cd studio24-factory
npm start
```

The app needs port 5173 free.

`npm start` installs the packages, downloads Convex's local backend and runs everything on your machine (the first run takes a minute or two; later runs are ready in seconds). It prints:

- `App:` http://localhost:5173. Open it and press **Demo as developer**, or sign in with the printed `Sign in:` email and `Password:` (saved in `.env.local`).
- `Client:` the demo client's link, which opens its interview.

To see the prototype and feedback pages locally, upload the demo client's mockup once, from `app/` in a second terminal (needs [jq](https://jqlang.org)):

```sh
npx convex run prototypes:uploadMockup "$(jq -Rs '{slug:"demo-client", html:.}' ../clients/demo-client/mockup.html)"
```

Each key you add turns on one more layer, and every layer keeps the ones below it working. Keys go in `.env.local` at the repo root (gitignored; `.env.example` lists the names), never in a shell export.

| Layer | Keys                                                                                       | What works                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | none, nothing to install                                                                   | The live URL in the README.                                                                                                                 |
| 1     | none                                                                                       | The whole flow in text; the AI's answers are recorded ones, labelled "recorded demo answer".                                                |
| 2     | `OPENROUTER_API_KEY`                                                                       | Real AI at every stage, and voice feedback (MAI-Transcribe 2 through OpenRouter; `FEEDBACK_STT_MODEL` swaps it, for example for Scribe v2). |
| 3     | layer 2 plus `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` and `DEEPGRAM_API_KEY` | The live voice interview; `npm start` also starts the voice worker.                                                                         |

With no keys the interview is in text and no microphone is shown. `npm run reset` deletes the local data; `npm run reseed` puts the demo client back at an empty interview.

**Windows and Node.** Windows works natively, in PowerShell or cmd; if a native install fails, WSL2 with Node 22 is the alternative. Node 22.6 or later is needed (the start script runs on Node's TypeScript stripping). Safari blocks the local Convex dashboard (not the app); open the dashboard in another browser.

**Checks**, from `app/`: `npm run check` (format, types, lint, the English and privacy checks, unused code, the unit tests), `npm run build`, `npm run e2e`. **Deploy:** `npm run deploy:convex` and `npm run deploy:web` from `app/`; the voice worker in `agent/` runs under systemd on the developer's own server ([docs/deploy-checklist.md](deploy-checklist.md)).

**Built on** the pre-existing starter template [uncle-T0ny/client-app-starter](https://github.com/uncle-T0ny/client-app-starter) v0.4.0, MIT, built before the clock and not part of the 2 hours: Convex with Convex Auth, Vite, React and TypeScript, Cloudflare Workers static assets, the UI kit, a LiveKit Agents voice worker and the one-command local run. Its README: [docs/template-readme.md](template-readme.md).

## The framework

The repo is also the developer's framework for running clients through these stages with Claude Code. `/orchestrator <slug>` says where a client is, what is done, and the one next step, and launches the work as background sessions on the developer's yes. Each stage has its skill in `.claude/skills/`, which works in the client's folder and moves the project's stage in the app. At the end of a session the developer runs `/wrap-up` by hand; it records what was learned into the skills' `learnings.md`.

## Privacy

`clients/` holds only the made-up demo client; real clients live in `clients-private/<slug>/`, gitignored and its own git repository with no remote. `npm run check` fails on any email address under `clients/`, and on any name from a deny list kept in `clients-private/`. Keys come only from the environment.
