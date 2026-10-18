# Studio24 Factory

From a client's problem to a working app in production. It started with an app for my wife, a wedding planner.

**Live:** https://studio24-factory.doit-rant.workers.dev (press **Demo as developer**). Decisions: [docs/DECISIONS.md](docs/DECISIONS.md). Build log: [docs/build-log.md](docs/build-log.md). How I worked, one line per 5 minutes: [tracking.md](tracking.md).

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

- A live interview through the client's link: voice or text, at most five questions, shown as a chat.
- The developer's project page shows each stage's output in place.
- A PRD drafted from the interview, every requirement quoted from the transcript and the quotes verified.
- A template analysis against the starter template and an estimate: the hours and the monthly running cost on free tiers.
- A clickable prototype on the client's link, and feedback on it by text or voice note, sorted into what works, what's broken and what to change.
- The developer's side: one Claude Code skill per stage, an `/orchestrator` skill that tracks where a client is and launches the next stage, and `/wrap-up`, which the developer runs at a session's end to record what was learned into the skills.
- A demo client went through the whole loop on the live app: interview, PRD, analysis and estimate, prototype, feedback.
- 225 unit tests and 16 end-to-end tests pass; a fresh clone runs locally with no account and no keys.

## What is incomplete

- The voice agent runs on a 2 vCPU host: it works, but turn-taking lags and speech recognition slips; it needs a bigger host and a sharper interview agent.
- The voice interview's transcript grows at the end of the page; it should stay in view without scrolling.
- Adding a template by link from the UI: the backend exists, the screen doesn't.
- The design is weak and needs real work, above all in the templates: a template should carry a finished design, so the mockup and the app built on it look good from the start; the mockup should also follow the client's own design reference.
- Every "Demo as developer" visitor shares one demo owner and its daily caps; feedback uploads have no size limit, and password-reset emails no rate limit.

## How to run the project

With Node.js 22.6 or later and git, no account and no key:

```sh
git clone https://github.com/uncle-T0ny/studio24-factory.git
cd studio24-factory
npm start
```

Open http://localhost:5173 (the port must be free) and press **Demo as developer**. It runs on recorded demo answers.

Real AI and live voice (keys in layers), the prototype locally, Windows, the checks and the deploy: [docs/running.md](docs/running.md). Built on my starter template [uncle-T0ny/client-app-starter](https://github.com/uncle-T0ny/client-app-starter) v0.4.0, made before the clock.
