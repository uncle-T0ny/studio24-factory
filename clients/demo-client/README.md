# Demo client

A made-up client, the one the local run seeds (slug `demo-client`). Nothing here comes from a real client: real clients live in `clients-private/<slug>/`, with the same layout, outside this repo.

The project's stage is in [state.json](state.json), a mirror of its stage in Convex.

| Path                         | Holds                                  | Written by                    |
| ---------------------------- | -------------------------------------- | ----------------------------- |
| [interview/](interview/)     | The interview transcripts              | `/interview`                  |
| [prd.md](prd.md)             | The PRD                                | `/prd`                        |
| [decisions.md](decisions.md) | The decisions log                      | Every stage skill             |
| [feedback/](feedback/)       | The client's feedback on the prototype | `/feedback`                   |
| [state.json](state.json)     | The stage, and when it last changed    | `app/scripts/client-state.ts` |
