# Studio24 Factory: decisions

The stack, what runs with which keys, the cut order, the privacy model and the spend limits, all decided before the clock started on 2026-10-17. The requirements are in [PRD.md](PRD.md).

## Stack

| Layer           | Choice                                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Starting point  | The starter template `uncle-T0ny/client-app-starter` v0.4.0, pre-existing and not part of the 2 hours, with its one-command local run, UI kit, auth and voice wiring. Its README: [template-readme.md](template-readme.md). |
| Backend         | Convex (database, live queries, actions, file storage), Convex Auth with the Password provider, `@convex-dev/migrations` for schema changes on deployed data.                                                               |
| Web             | Vite, React, TypeScript in strict mode.                                                                                                                                                                                     |
| Hosting         | The web app on Cloudflare Workers static assets; the backend on a Convex production deployment.                                                                                                                             |
| Voice interview | LiveKit Agents for Node 1.9.3. The worker is self-hosted on a small server of the developer's, as a non-root user under systemd; LiveKit Cloud carries the media.                                                           |
| Interview audio | Deepgram Nova-3 streaming speech-to-text and Deepgram Aura-2 text-to-speech, with no fallback to LiveKit Inference.                                                                                                         |
| Feedback audio  | MAI-Transcribe 2 through OpenRouter; Scribe v2 through OpenRouter is the swap, chosen by an env var.                                                                                                                        |
| LLM             | Claude through OpenRouter, one key (`OPENROUTER_API_KEY`) for the backend and the voice worker; the models below.                                                                                                           |

## Models

| Task                                        | Model      | Settings                            |
| ------------------------------------------- | ---------- | ----------------------------------- |
| The interviewer (the voice agent's replies) | Haiku 5.5  | reasoning off                       |
| The template manifest, the feedback split   | Haiku 5.5  | reasoning off, a strict JSON schema |
| The PRD, the verdicts, the estimate         | Sonnet 5.5 | reasoning effort low                |
| Any Haiku call whose schema Haiku rejects   | Sonnet 5.5 | the same schema                     |

Haiku where speed matters (a live conversation) or the task is extraction; Sonnet where the output is a judgement the developer reviews.

## Running without keys

`npm start` runs the whole app locally on a local Convex backend, with no account. Each key adds a layer, and every layer keeps the ones below it working. The layers, the keys each needs and what each adds are in the README's [How to run the project](../README.md#how-to-run-the-project).

Voice is offered only with its keys: the voice interview only when all five keys are set, otherwise the interview is in text and no microphone is shown; voice feedback only when `OPENROUTER_API_KEY` is set, otherwise feedback is typed.

## Cut order

Decided before the clock. At a checkpoint (T+20, T+40, T+60, T+80), a stage that is behind gets the next cut, in this order; each cut keeps the stage and puts less behind it:

1. Feedback by voice gives way to typed feedback.
2. The dev app built from the template gives way to the mockup alone.
3. Analysing a template from its repo link gives way to a manifest prepared in advance.

Never cut: the sign-in, the client link, the voice interview, the PRD and the project timeline. They are the path a reviewer walks from end to end.

## Privacy model

- `clients/` holds one client, `clients/demo-client/`: made up and public. No real client, person or third-party data enters the repo.
- Real clients live in `clients-private/<slug>/`, which is gitignored and is its own git repository with no remote, so it never leaves the developer's machine.
- Skills look a client's slug up in `clients-private/` first, then in `clients/`, and write only in the folder they read from.
- A check fails on any email address under `clients/`, always, and on any name from a deny list. The deny list lives in `clients-private/`, never in the repo; it starts empty and is there for real clients.
- Skills move a client's stage into Convex with `npx convex run`, under the developer's own Convex login; no deploy key sits in the repo.
- Keys come only from the environment, through a local key wrapper kept outside the repo. Nothing reads, prints, logs or commits a key; `.env*` files are gitignored, and `.env.example` holds names only.
- The docs name no real client.

## Spend limits

- The demo's caps, counted in Convex and checked before a LiveKit token is minted and before each model call: 10 interviews a day across the demo, 10 minutes per interview, 3 minutes per voice feedback, 30 LLM calls a day.
- The providers' hard limits: the OpenRouter key's $5 a month limit is the hard cap, and the daily caps keep spend well below it; about $10 a month is the ceiling for each other provider.

## Deploys and the repo

- Only the integrator deploys (Convex production, the web Worker and the voice worker), at T+20, T+60 and T+96. No other session touches a shared deployment.
- The repo stays private until the submission.

## Decisions during the build

- Mockups are served from Convex file storage in a sandboxed iframe, not from `app/public`.
- A client link opens only the stages the project has reached; otherwise it names the current one.
- The owner moves a project's stage from the project page.
- The voice fallback is unit-tested, not driven by fake keys in e2e.
- One analysis call returns the verdicts and the free-tier breaks; the totals are a pure sum.
