# Demo client

A made-up client, the one the local run seeds (slug `demo-client`). Nothing here comes from a real client: real clients live in `clients-private/<slug>/`, with the same layout, outside this repo.

The project's stage is in [state.json](state.json), a mirror of its stage in Convex. The stage skills fill the folder; [CLAUDE.md](../../CLAUDE.md) says which writes what.

| Path                         | Holds                                  | Written by                    |
| ---------------------------- | -------------------------------------- | ----------------------------- |
| [interview/](interview/)     | The interview transcripts              | `/interview`                  |
| [prd.md](prd.md)             | The PRD                                | `/prd`                        |
| [decisions.md](decisions.md) | The decisions log                      | `/prd`, `/feedback`           |
| `analysis.md`                | The template's analysis                | `/analyze-template`           |
| `estimate.md`                | Hours and infrastructure $/month       | `/estimate`                   |
| `prototype.md`               | The prototype and its links            | `/prototype`                  |
| [feedback/](feedback/)       | The client's feedback on the prototype | `/feedback`                   |
| `handover.md`                | The final app and the handover         | `/handover`                   |
| [state.json](state.json)     | The stage, and when it last changed    | `app/scripts/client-state.ts` |
