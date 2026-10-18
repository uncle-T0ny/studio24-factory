# Studio24 Factory: PRD

A client app studio: from a client's voice interview to a PRD, a template-based estimate, a prototype,
the client's feedback and the final app. Priorities: must, should, could.

## Functional requirements

| ID    | Requirement                                                                                                                                                                                                                                                                                  | Priority |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-1  | The developer signs in (email and password); "Demo as developer" lets a reviewer in with one click.                                                                                                                                                                                          | must     |
| FR-2  | The workspace lists client projects, each with a timeline of its stages: interview, PRD, analysis, prototype, feedback, final.                                                                                                                                                               | must     |
| FR-3  | The developer creates a project and a client link; the link opens only the stage the developer allows, and any other stage shows a clear access message.                                                                                                                                     | must     |
| FR-4  | Through the link, an AI voice agent interviews the client (the idea, counter-questions, the business, the constraints); the transcript is stored in the project. Text interview when the mic is denied, the agent is unavailable or voice isn't configured.                                  | must     |
| FR-5  | The PRD is drafted from the transcript: numbered FRs and NFRs with priorities, a decisions log, an out-of-scope list. Every requirement cites a verbatim quote; a quote not found in the transcript, or an invalid structure, is flagged, never invented.                                    | must     |
| FR-6  | A template is added by its repo link and analysed: what it is, what to configure, where it deploys, its limits and monthly cost. Each requirement gets a verdict: in the template, needs an extension (+hours, +infrastructure), or not supported (with an alternative).                     | should   |
| FR-7  | The estimate: hours plus infrastructure $/month; usage beyond a free tier raises it, and the screen shows why.                                                                                                                                                                               | should   |
| FR-8  | A prototype is registered for the project (a mockup at least; a dev app built from the template if time allows), and the client opens it through the link.                                                                                                                                   | should   |
| FR-9  | The client gives feedback on the prototype by voice note or text; it is transcribed, split into what works and what doesn't, and stored in the project.                                                                                                                                      | should   |
| FR-10 | The final app stage sits behind a login, with the handover to the client's own accounts as a documented step.                                                                                                                                                                                | could    |
| FR-11 | The repo is the developer's framework: CLAUDE.md names the stages and the skill for each; .claude/skills/ holds one skill per stage; each client has a folder (the public demo client in clients/, real clients in a private, ignored folder); skills update the project's stage in the app. | must     |

## Non-functional requirements

Each NFR is a rule in the Claude Code skill `.claude/skills/pre-commit/SKILL.md`, run before every
commit: it runs the gates, checks the staged change against each rule, and the commit waits until
every rule passes.

| ID    | Requirement                                                                                                                                                            | Priority |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| NFR-1 | TypeScript only, strict, no `any`; Prettier; English only.                                                                                                             | must     |
| NFR-2 | No secrets and no client personal data in the repo; keys come from the environment only; a check fails on an email address or a deny-listed name under clients/.       | must     |
| NFR-3 | Runs locally with `npm start` and no keys (text flow, recorded AI answers); each key adds a layer: real AI, then live voice.                                           | must     |
| NFR-4 | Deployed: a public live URL (Cloudflare Workers) on a Convex production backend.                                                                                       | must     |
| NFR-5 | Gates green on main: check, unit tests, build, end-to-end tests.                                                                                                       | must     |
| NFR-6 | AI and voice spend is capped per provider; the demo can't run up a bill.                                                                                               | should   |
| NFR-7 | Built in a 2-hour timebox; the commit history is the time log, and any overrun is stated in the README.                                                                | must     |
| NFR-8 | Self-explanatory code: names and structure carry the meaning, so comments stay rare; no comment restates the code, and one appears only for a why the code can't show. | must     |
| NFR-9 | Code the developer can explain: small changes, no unused code, test names that state the rule they check.                                                              | must     |

## Decisions log

The decisions, among them the starter template, the cut order and the made-up demo client, are in [DECISIONS.md](DECISIONS.md).

## Out of scope

- Client asset upload (logo and similar).
- Automated transfer to the client's accounts.
- Payments, billing, teams and roles.
- Real client data in the repo.
