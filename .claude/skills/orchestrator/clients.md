# Client folders and stages

The rules every stage skill works under; [SKILL.md](SKILL.md) picks the next step from them.

## The stages

A project moves through six stages, the timeline in the app. Each skill takes the client's slug, works in the client's folder, and then sets the stage it is named for, which decides what the client's link opens:

```sh
node --experimental-strip-types app/scripts/client-state.ts --slug <slug> --stage <stage> [--prod] [--dry-run]
```

From the repo root: it sets the stage in Convex with `npx convex run projects:setStage` (in `app/`, under the developer's own Convex login, so no key sits in the repo), then mirrors it in the folder's `state.json`. `--prod` targets the live app; `--dry-run` writes `state.json` and prints the command without running it.

| Stage     | Skill                                 | Produces                                                                                    |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| interview | `/interview`                          | The client's interview transcript, from the voice agent or the text interview.              |
| PRD       | `/prd`                                | Numbered FRs and NFRs with priorities, each citing a quote, a decisions log, out of scope.  |
| analysis  | `/analyze-template`, then `/estimate` | The template's manifest, a verdict per requirement, then hours plus infrastructure $/month. |
| prototype | `/prototype`                          | The mockup, then a dev app built from the template, linked to the project.                  |
| feedback  | `/feedback`                           | The client's feedback, split into what works and what doesn't.                              |
| final     | `/handover`                           | The final app behind a login, and the handover to the client's own accounts.                |

`/interview` and `/feedback` set their stage first, so the client's link opens them, then collect; `/analyze-template` leaves the stage and `/estimate` sets `analysis`.

## Client folders

- `clients/<slug>/` holds only the made-up public demo client, [clients/demo-client/](../../../clients/demo-client/), whose README lists the folder's files and the skill that writes each. Real clients live in `clients-private/<slug>/`, with the same layout: gitignored, its own git repository with no remote (`git init clients-private` once).
- A skill looks the slug up in `clients-private/` first, then `clients/`, and writes only in the folder it read from.
- Details stay in the folder; Convex holds the high-level state, the stage.
- No email address and no deny-listed name under `clients/`: `npm run check:privacy` fails on either, and runs in `npm run check`. The deny list is `clients-private/deny-list.txt`, one name per line, never in the repo; add each real client's names there.
- Format a client folder's files with Prettier from `app/` by hand (`npm run format:check` doesn't reach `clients/`), never a transcript; say when `npm run check:privacy` ran without the deny list.
