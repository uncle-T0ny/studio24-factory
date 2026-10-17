# Studio24 Factory: rules for agents

This repo is the developer's framework for building a client's app: one skill per step in `.claude/skills/`, one folder per client (`clients/` for the made-up demo, `clients-private/` for real ones). Every rule lives in the skill that uses it; this file only links them.
The web app is in `app/` (run its commands there), the voice worker in `agent/`.

- Start here: `/orchestrator <slug>`.
- Before every commit: `/pre-commit`.
- End every session: `/wrap-up`.

| Skill                                                         | What it is for                                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [/orchestrator](.claude/skills/orchestrator/SKILL.md)         | Where a client is and the next step; launches the work as sessions.     |
| [/interview](.claude/skills/interview/SKILL.md)               | Opens the client's interview and saves the transcript, verbatim.        |
| [/prd](.claude/skills/prd/SKILL.md)                           | The PRD from the transcript, every requirement with a verbatim quote.   |
| [/analyze-template](.claude/skills/analyze-template/SKILL.md) | A template's manifest and a verdict for each requirement.               |
| [/estimate](.claude/skills/estimate/SKILL.md)                 | Hours plus infrastructure $/month, and where the free tiers break.      |
| [/prototype](.claude/skills/prototype/SKILL.md)               | The mockup, then a dev app from the template, on the client's link.     |
| [/feedback](.claude/skills/feedback/SKILL.md)                 | The client's feedback on the prototype: what works and what doesn't.    |
| [/handover](.claude/skills/handover/SKILL.md)                 | The final app behind a login, and the move to the client's accounts.    |
| [/wrap-up](.claude/skills/wrap-up/SKILL.md)                   | Ends a session: learnings per skill, proposed rule changes, progress.   |
| [/pre-commit](.claude/skills/pre-commit/SKILL.md)             | The gates, the code rules and the commands, checked before each commit. |
| [/ui-kit](.claude/skills/ui-kit/SKILL.md)                     | Every UI change in `app/`, built from the kit.                          |

Docs: [PRD](docs/PRD.md), [decisions](docs/DECISIONS.md), [architecture](docs/architecture.md), [deploy checklist](docs/deploy-checklist.md).
