# Studio24 Factory

From a client's problem to a working app in production. It started with an app for my wife, a wedding planner.

**Live:** https://studio24-factory.doit-rant.workers.dev (press **Demo as developer** on the sign-in page). The priorities and the calls made on the clock: [docs/DECISIONS.md](docs/DECISIONS.md) and [docs/build-log.md](docs/build-log.md).

## Why I built this

My wife is a wedding planner. I love prototyping, and as an experienced developer I know how to get to a stable result:
it's a pleasure to see a prototype become not just something that might break, but a production-ready solution.
The day before this take-home, I spent 2 hours 40 minutes building an app that covers what she needs,
and it saves her a $30-a-month subscription.
Back in Vancouver, I'd worked on a similar idea.
So I thought: why not a factory that builds apps like this quickly, efficiently and well?
The quality comes from good reference templates: the better the template, the better the app that comes out.

I also went back through the prompts from those 2 hours 40 minutes and saw how much of it could be automated and improved.
Studio24 Factory is the result: an example of full-cycle development, from a client's problem to a working solution
in production that does its job.

## What currently works

Studio24 Factory is a studio for a developer who builds apps for clients. The developer signs in, sees each client's project on a timeline of six stages, and gives the client a link that opens only the stage the project has reached.

- **Sign-in.** Email and password for the developer, limited to an allowlist; **Demo as developer** signs a reviewer in to the demo account in one click.
- **Projects and the timeline.** Each project moves through interview, PRD, template analysis, prototype, feedback and final app. The developer moves the stage from the project page and issues or revokes one-stage client links; a link opens its stage once the project has reached it, and otherwise names the current stage.
- **The interview.** The client talks to a voice interviewer (LiveKit, Deepgram Nova-3 and Aura-2, Claude Haiku through OpenRouter, the worker self-hosted), or types: the text interview is the fallback when voice is off or fails. At most five questions; the transcript is saved with the project.
- **The PRD.** Drafted from the transcript by Claude Sonnet: numbered FRs and NFRs with priorities, each citing the client's words; a quote the client never said is highlighted, and an answer invalid twice is flagged.
- **Template analysis and estimate.** A verdict per requirement against the starter template, the hours, the infrastructure $/month, and where each free tier breaks.
- **The prototype.** A clickable mockup, uploaded to Convex file storage and shown in a sandboxed frame on the client's link.
- **Feedback.** The client types feedback or records a voice note (up to 3 minutes), sorted into what works, what is broken and what to change. Voice notes are transcribed by MAI-Transcribe 2 through OpenRouter; the swap is one env var, `FEEDBACK_STT_MODEL` (for example Scribe v2 through OpenRouter).
- **No keys needed to try it.** Without `OPENROUTER_API_KEY` every AI answer is a recorded one, labelled "recorded demo answer".
- **The demo client** (`clients/demo-client/`, made up) was carried on production from a live interview to its prototype and the client's feedback.

**Privacy.** `clients/` holds only the made-up demo client; real clients live in `clients-private/<slug>/`, gitignored and its own git repository with no remote. `npm run check` fails on any email address under `clients/`, and on any name from a deny list kept in `clients-private/`. Keys come only from the environment: `.env*` files are gitignored, `.env.example` holds names only, and client links are stored as hashes. The demo's spend is capped in Convex before each model call and each voice session.

## What is incomplete

- **The voice agent on a 2-vCPU host.** Its event loop gets blocked, the client gets interrupted, and speech-to-text slips (a "wedding planner" heard as "writing planner"); it needs a bigger host and a better interview agent.
- **The voice interview's transcript** grows at the end of the page; it should stay in view without scrolling.
- **The templates panel:** adding a template by its repo link from the UI. The backend, `templates:addByLink`, exists; the analysis runs against the starter template, seeded on first use.
- **The client's prototype page** shows the mockup in a framed box, not full screen.

Next steps:

- Improve the interview agent: shorter, sharper questions; voice turn-taking on a bigger host.
- `/prototype` builds the mockup from the client's design reference (the screens of a real app they like), not as a page of cards around a static plan.
- Client asset upload (logos, photos, documents) into the client's project.
- The dev app built from the template as the prototype, beside the mockup.

## How to run the project

From a terminal, with [Node.js](https://nodejs.org) 22 (22.6 or later) and git; no account and no key:

```sh
git clone https://github.com/uncle-T0ny/studio24-factory.git
cd studio24-factory
npm start
```

`npm start` installs the packages, downloads Convex's local backend and runs everything on your machine (the first run takes a minute or two; later runs are ready in seconds). It prints:

- `App:` http://localhost:5173. Open it and press **Demo as developer**, or sign in with the printed `Sign in:` email and `Password:` (saved in `.env.local`).
- `Client:` the demo client's link, which opens its interview.

To see the prototype and feedback pages locally, upload the demo client's mockup once, from `app/` in a second terminal (needs [jq](https://jqlang.org)):

```sh
npx convex run prototypes:uploadMockup "$(jq -Rs '{slug:"demo-client", html:.}' ../clients/demo-client/mockup.html)"
```

Each key you add turns on one more layer, and every layer keeps the ones below it working. Keys go in `.env.local` at the repo root (gitignored; `.env.example` lists the names), never in a shell export.

| Layer | Keys                                                                                       | What works                                                                                   |
| ----- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 0     | none, nothing to install                                                                   | The live URL above.                                                                          |
| 1     | none                                                                                       | The whole flow in text; the AI's answers are recorded ones, labelled "recorded demo answer". |
| 2     | `OPENROUTER_API_KEY`                                                                       | Real AI at every stage, and voice feedback (MAI-Transcribe 2, also through OpenRouter).      |
| 3     | layer 2 plus `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` and `DEEPGRAM_API_KEY` | The live voice interview; `npm start` also starts the voice worker.                          |

With no keys the interview is in text and no microphone is shown. `npm run reset` deletes the local data; `npm run reseed` puts the demo client back at an empty interview.

**Windows and Node.** Windows works natively, in PowerShell or cmd; if a native install fails, WSL2 with Node 22 is the alternative. Node 22.6 or later is needed (the start script runs on Node's TypeScript stripping). Safari blocks the local Convex dashboard (not the app); open the dashboard in another browser.

**Checks**, from `app/`: `npm run check` (format, types, lint, the English and privacy checks, unused code, the unit tests), `npm run build`, `npm run e2e`. **Deploy:** `npm run deploy:convex` and `npm run deploy:web` from `app/`; the voice worker in `agent/` runs under systemd on the developer's own server ([docs/deploy-checklist.md](docs/deploy-checklist.md)).

**Built on** the pre-existing starter template [uncle-T0ny/client-app-starter](https://github.com/uncle-T0ny/client-app-starter) v0.4.0, MIT, built before the clock and not part of the 2 hours: Convex with Convex Auth, Vite, React and TypeScript, Cloudflare Workers static assets, the UI kit, a LiveKit Agents voice worker and the one-command local run. Its README: [docs/template-readme.md](docs/template-readme.md).

## The framework

The repo is also the developer's framework for running clients through these stages with Claude Code. `/orchestrator <slug>` says where a client is, what is done, and the one next step, and launches the work as background sessions on the developer's yes. Each stage has its skill in `.claude/skills/`, which works in the client's folder and moves the project's stage in the app. At the end of a session the developer runs `/wrap-up` by hand; it records what was learned into the skills' `learnings.md`.

## Time

Clock: started 16:55 MDT on 2026-10-17; the 2-hour timebox ends 18:55. The commit history is the log: the first commit is 0caf782 (17:01). The developer's instructions to the AI, one line per 5 minutes: [tracking.md](tracking.md); every merge with its reading note: [docs/build-log.md](docs/build-log.md).

| Time  | What                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------ |
| 16:55 | The clock starts: an empty repo, the README's motivation first.                                        |
| 17:12 | The starter template v0.4.0 imported as copied files.                                                  |
| 17:17 | First deploy: the template as imported, on Convex production and Cloudflare Workers.                   |
| 17:19 | The PRD, the decisions and the pre-commit rules merged; parallel sessions start on the stages.         |
| 17:32 | The schema, access and usage caps deployed; 17:36: "Demo as developer" and the demo client.            |
| 17:48 | The text interview live with real AI; the developer plays the client on production.                    |
| 17:55 | The PRD, analysis and estimate, stages and client links, prototype and feedback, and the voice worker. |
| 18:00 | Fixes from the live interview: at most five questions, no deadline question, chat bubbles.             |
| 18:18 | The demo client carried from the interview to its prototype, in the template's look; 18:20: feedback.  |
| 18:31 | Feature freeze: only this README, the deploy and the checks after it.                                  |

**Preparation, before the clock and not part of the 2 hours:** the starter template built and published (v0.1.0 to v0.4.0, CI on Ubuntu, macOS and Windows); the voice stack verified end to end (LiveKit Cloud, Deepgram, Claude through OpenRouter) and the speech-to-text options for feedback compared; a locked-down slot for the voice worker on the developer's own server; the plan, the cut order and the session prompts.

**Over time:** OVERRUN-PLACEHOLDER
