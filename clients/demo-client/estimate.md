# Estimate: Demo client

From [prd.md](prd.md) and the verdicts in [analysis.md](analysis.md), 2026-10-17. Prices and limits read on 2026-10-17 from the providers' pricing pages named below.

## Hours

| Item      | Verdict         | Hours  | What                                                                     |
| --------- | --------------- | ------ | ------------------------------------------------------------------------ |
| FR-1      | extension       | 10     | The `plans` resource and the editor canvas, with or without measurements |
| FR-2      | extension       | 5      | Tables to drag, rotate and number                                        |
| FR-3      | extension       | 2      | Chairs from the guest count                                              |
| FR-4      | extension       | 1      | Chairs recounted live                                                    |
| FR-5      | extension       | 3      | The planner's own items                                                  |
| FR-6      | extension       | 3      | Ceremony rows                                                            |
| FR-7      | in the template | 1      | Setup: the editor on the share-link page                                 |
| FR-8      | in the template | 0.5    | Setup: check that the couple's writes reach the planner live             |
| FR-9      | extension       | 4      | PDF export for the venue                                                 |
| FR-10     | extension       | 4      | PDF upload as the plan's background                                      |
| FR-11     | extension       | 1.5    | Link expiry after the event date                                         |
| FR-12     | extension       | 1      | The phone notice                                                         |
| NFR-1     | in the template | 0.5    | Setup: the app's name, brand and icons on the UI kit                     |
| NFR-2     | in the template | 0      | Nothing to set up: a desktop browser app                                 |
| NFR-3     | in the template | 0      | Nothing to set up: the free plans carry the volume                       |
| NFR-4     | extension       | 0.5    | PDF-only upload                                                          |
| NFR-5     | in the template | 0      | Nothing to set up: checked below                                         |
| Setup     |                 | 3      | Copy the template, rename it, the Convex project, auth keys and env      |
| Deploy    |                 | 2      | Convex prod, the Worker, the Resend domain                               |
| Handover  |                 | 2      | Move to the client's own accounts, a walkthrough                         |
| **Total** |                 | **44** |                                                                          |

Against the budget (NFR-5, "budget 1000$"): $1,000 over 44 h is about $22.70 an hour. The hourly rate is not set here; at a higher rate, the `should` FRs (FR-11 and FR-12, 2.5 h) are the first to cut.

## Infrastructure

| Service            | Plan                     | $/month | At this usage                                                    |
| ------------------ | ------------------------ | ------- | ---------------------------------------------------------------- |
| Convex             | Free & Starter           | 0       | Database, live queries, file storage for the uploaded PDFs, auth |
| Cloudflare Workers | Free, static assets only | 0       | The frontend; static asset requests are free and unlimited       |
| Resend             | Free                     | 0       | Password-reset emails only, a few a month                        |
| Voice providers    | not used                 | 0       | LiveKit, Deepgram and OpenRouter stay off: no voice in the PRD   |
| **Total**          |                          | **0**   |                                                                  |

Usage the PRD implies: 4 to 8 plans a month, 50 to 300 guests each, one couple's link per plan, one uploaded PDF per plan (assumed about 2 MB).

## Free tier breaks

| Service and limit                        | Free limit               | Client's usage that reaches it                                                                                                                                     | $/month after                  | Source                                                      |
| ---------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------- |
| Convex function calls                    | 1M a month               | About 25,000 a month (8 plans, 6 editing sessions each, about 500 calls a session); breaks at about 40 times that                                                  | $2.20 per extra 1M             | https://www.convex.dev/pricing                              |
| Convex database storage                  | 0.5 GB                   | About 50 KB a plan; breaks at about 10,000 plans                                                                                                                   | $0.22 per extra GB             | https://www.convex.dev/pricing                              |
| Convex file storage                      | 1 GB                     | 2 MB a plan; breaks at about 500 PDFs, about 5 years at 8 a month                                                                                                  | $0.033 per extra GB            | https://www.convex.dev/pricing                              |
| Convex data egress                       | 1 GB a month             | 8 plans opened 30 times each with a 2 MB background is about 0.5 GB; breaks at about 16 such plans a month. That file downloads count as data egress is unverified | $0.132 per extra GB            | https://www.convex.dev/pricing                              |
| Convex database I/O                      | 1 GB a month             | unverified: depends on the editor's write pattern, to measure in the dev app                                                                                       | $0.22 per extra GB             | https://www.convex.dev/pricing                              |
| Cloudflare Workers static asset requests | free and unlimited       | never                                                                                                                                                              | $0                             | https://developers.cloudflare.com/workers/platform/pricing/ |
| Resend emails                            | 3,000 a month, 100 a day | Password resets only; never at this volume                                                                                                                         | from the paid plan on the page | https://resend.com/pricing                                  |

**Total:** 44 hours; $0/month now, and $0.132 per GB a month past the first free tier to break (Convex data egress, 1 GB, at about 16 plans a month; unverified until the dev app measures it).
