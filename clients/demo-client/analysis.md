# Analysis: Demo client

Template: https://github.com/uncle-T0ny/client-app-starter, tag v0.4.0, read on 2026-10-17 (README, `package.json`, `app/wrangler.jsonc`, `app/convex.json`, `.env.example`, `docs/deploy-checklist.md`), against [prd.md](prd.md).

## Manifest

- **What it is:** a starter for small client web apps: an owner signs in, works on her own records, and shares one record with a guest through a secret link with no account (`/p/<token>`, revocable). Vite, React 19 and TypeScript in `app/`, Convex for the database, live queries, file storage and auth; an example resource (`projects`) to replace with the client's domain; a UI kit, in-app feedback, export and import of one record, optional voice.
- **What to configure:** the app's name (`app/convex/lib/appConfig.ts`, `app/package.json`, `app/wrangler.jsonc`, `app/index.html`); a Convex project on the client's account with `SITE_URL`, `OWNER_EMAILS`, `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM` and the Convex Auth keys; a Resend sending domain; `app/.env.production` with the prod Convex URL. The five voice keys stay unset: this client needs no voice.
- **Where it deploys:** the backend on Convex (`npm run deploy:convex`), the frontend as Cloudflare Workers static assets in SPA mode (`npm run deploy:web`, Wrangler, no Worker script).
- **Its limits:** one example resource, no drawing canvas, no PDF reading or writing, share links without an expiry date, no phone-specific layout; password reset needs a verified Resend domain.
- **Its monthly cost on the free plans:** $0: Convex Free & Starter, Workers static assets (free and unlimited), Resend Free; voice is off, so LiveKit, Deepgram and OpenRouter cost nothing. Limits and prices are in [estimate.md](estimate.md).

## Verdicts

| ID    | Verdict         | Detail                                                                                                                                                                                                   |
| ----- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1  | extension       | +10 h, +$0/month: a `plans` resource in place of the example `projects` (name, indoors or outdoors, optional width and length, event date) and an SVG editor canvas, on a free grid without measurements |
| FR-2  | extension       | +5 h, +$0/month: round and long tables to drag, rotate and number on the canvas                                                                                                                          |
| FR-3  | extension       | +2 h, +$0/month: the chairs per table made from the guest count                                                                                                                                          |
| FR-4  | extension       | +1 h, +$0/month: recount the chairs when the guest count changes; Convex live queries (in the template) push it to every open screen                                                                     |
| FR-5  | extension       | +3 h, +$0/month: the planner's own items (name, size, colour) in a library she reuses                                                                                                                    |
| FR-6  | extension       | +3 h, +$0/month: a ceremony block of rows, two sides and an aisle                                                                                                                                        |
| FR-7  | in the template | The share-token pattern: `/p/<token>`, revocable, guest access through `projectQuery` and `projectMutation` (`convex/lib/functions.ts`, `convex/lib/access.ts`, `convex/share.ts`, `src/share/`)         |
| FR-8  | in the template | A guest's write goes through `projectMutation` straight to the record, and the owner's live query shows it; no approval step to build                                                                    |
| FR-9  | extension       | +4 h, +$0/month: a PDF of the plan and its table list, made in the browser with a client-side PDF library, no server                                                                                     |
| FR-10 | extension       | +4 h, +$0/month: the PDF upload to Convex file storage with the template's upload helper (`src/lib/`), its first page drawn in the browser as the canvas background                                      |
| FR-11 | extension       | +1.5 h, +$0/month: an expiry date on the share link, the day after the event date, checked in `convex/lib/access.ts`                                                                                     |
| FR-12 | extension       | +1 h, +$0/month: on a narrow screen, the share page asks the couple to use a desktop                                                                                                                     |
| NFR-1 | in the template | The UI kit (`src/ui/`, `.claude/skills/ui-kit/`); the editor's ease of use is built into the FR-1 to FR-6 hours                                                                                          |
| NFR-2 | in the template | A desktop browser SPA; phones are handled by FR-12                                                                                                                                                       |
| NFR-3 | in the template | Convex's free plan and Workers static assets carry 4 to 8 plans a month of up to 300 guests; the breaking points are in [estimate.md](estimate.md)                                                       |
| NFR-4 | extension       | +0.5 h, +$0/month: the upload accepts PDF files only                                                                                                                                                     |
| NFR-5 | in the template | Auth, the share link, uploads, export and the deploy are ready, so the hours go to the editor; the fit against $1,000 is checked in [estimate.md](estimate.md)                                           |
