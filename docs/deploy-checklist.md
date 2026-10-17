# Deploy checklist: Convex prod and Cloudflare Workers

Run from `app/`. Backend first, so the new frontend never calls a missing function.

## A. Pre-flight (before the build, not at deploy time)

- [ ] `npx convex login status`: logged in to the account and team this client's app belongs to, and no other. A CLI left logged in to another account creates deployments there.
- [ ] `npx wrangler whoami`: the Cloudflare account this app deploys to. If the login reaches several accounts, add the right account's id to `wrangler.jsonc`.
- [ ] Gates green: `npm ci`, `npm run check`, `npm test`, `npm run build`, `npm run e2e` (from a checkout whose `.env.local` does not point at the prod deployment).
- [ ] Prod env, by name only: `npx convex env list --prod --names-only` shows `SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`, `OWNER_EMAILS`, `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`, and does **not** show `ALLOW_TEST_FUNCTIONS`.

First prod setup only:

- [ ] `npx convex deploy` creates the prod deployment.
- [ ] `npx @convex-dev/auth --prod` sets `JWT_PRIVATE_KEY` and `JWKS`.
- [ ] `npx convex env set --prod SITE_URL <the app's URL>` (the Worker's URL, or the custom domain once there is one).
- [ ] `npx convex env set --prod OWNER_EMAILS <the real owners, comma-separated>`.
- [ ] `npx convex env set --prod AUTH_EMAIL_FROM "<App name> <no-reply@your-domain>"`.
- [ ] The account holder sets `npx convex env set --prod AUTH_RESEND_KEY` with no value: the CLI asks for it, so it stays out of shell history and agent logs. Agents never set or read it.
- [ ] Resend: the sending domain shows Verified; the key has sending access only, restricted to that domain.
- [ ] Create `.env.production` with `VITE_CONVEX_URL=https://<prod-deployment-name>.convex.cloud` (gitignored).

## B. Each prod deploy

1. [ ] Backup: `npm run backup:prod` writes `backups/<date>.zip` (database and files; gitignored, real client data). Optionally also **Backup Now** in the Convex dashboard.
2. [ ] Schema compatibility: diff `convex/schema.ts` against the last prod release. Safe: new tables, new indexes, new `v.optional(...)` fields, widened unions. Anything else (a removed, renamed or narrowed field, a new required field) goes through a migration first (`convex/migrations.ts`); Convex refuses a schema that existing documents don't match.
3. [ ] `npm run deploy:convex` (`convex deploy`, asks to confirm).
4. [ ] Run any new migration: `npx convex run migrations:run '{fn: "migrations:<name>"}' --prod`.
5. [ ] `npm run deploy:web` (`vite build` against `.env.production`, then `wrangler deploy`).

## C. Smoke checks (on the deployed URL)

- [ ] `/` loads; sign-in against prod works.
- [ ] Deep links load directly, in a fresh tab: `/project/<id>`, `/p/<token>` (`curl -sI` gives 200: the SPA fallback).
- [ ] `/favicon.ico`, `/favicon-32.png`, `/apple-touch-icon.png` give 200.
- [ ] No console errors on the projects page, a project's page and a share link.
- [ ] The main bundle names the prod deployment, not dev: `curl -s <site>/ | grep -o 'assets/index-[^"]*\.js'`, then grep that file for the deployment name.
- [ ] Live sync works (the WebSocket connects), and `/ui-kit` loads (a lazy chunk).

## D. After a deploy

- [ ] Lazy chunks have content-hashed names: a tab opened before the deploy fails to load them until it reloads. Deploy between the client's working sessions, or tell them to reload.
- [ ] Monthly: `npx convex deployment usage --prod` against the plan limits below.

## Plan limits (free tier and first paid tier)

Read from the vendors' pages on 2026-10-17; prices and limits change, so check the pages before quoting them. Convex limits are per team: every app on the same team shares one allowance. The Resend domain count is per account.

### Convex ([pricing](https://www.convex.dev/pricing), [limits](https://docs.convex.dev/production/state/limits), [backups](https://docs.convex.dev/database/backup-restore))

| Item                            | Free / Starter                                                | Professional                           |
| ------------------------------- | ------------------------------------------------------------- | -------------------------------------- |
| Price                           | $0; Starter adds pay-as-you-go once a card is registered      | $25 per developer per month            |
| Function calls                  | 1M per month (Starter: +$2.20 per 1M)                         | 25M per month                          |
| Action compute                  | 20 GB-hours per month                                         | 250 GB-hours                           |
| Database storage                | 0.5 GB                                                        | 50 GB                                  |
| Database I/O                    | 1 GB per month                                                | 50 GB per month                        |
| File storage (includes backups) | 1 GB                                                          | 100 GB                                 |
| Data egress                     | 1 GB per month                                                | 50 GB per month                        |
| Deployments per team            | 40                                                            | 300                                    |
| Developers                      | 1 to 6                                                        | 1 to 20                                |
| Backups                         | manual Backup Now only, kept 7 days, at most 2 per deployment | daily or weekly scheduled, plus manual |
| Logs                            | a short recent history in the dashboard; no log streaming     | log streaming included                 |
| Over the limit                  | Free: hard caps, writes may fail; Starter: billed             | billed                                 |

Also: a document is at most 1 MiB; function arguments and return values 16 MiB; 512 env vars per deployment, 8 KiB each. Prices are for US regions; other regions cost 1.3x.

### Cloudflare Workers ([pricing](https://developers.cloudflare.com/workers/platform/pricing/), [limits](https://developers.cloudflare.com/workers/platform/limits/), [static assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/))

| Item                                        | Workers Free                                  | Workers Paid                  |
| ------------------------------------------- | --------------------------------------------- | ----------------------------- |
| Price                                       | $0                                            | from $5 per account per month |
| Static asset requests                       | free and unlimited (no Worker script runs)    | free and unlimited            |
| Worker requests (only with a Worker script) | 100,000 per day                               | 10M per month included        |
| Asset files per version                     | 20,000                                        | 100,000                       |
| Single asset file                           | 25 MiB                                        | 25 MiB                        |
| Workers per account                         | 100                                           | 500                           |
| Custom domains                              | 100 per zone; needs an active Cloudflare zone | same                          |

A custom domain goes in `wrangler.jsonc`: `"routes": [{ "pattern": "app.example.com", "custom_domain": true }]`.

### Resend ([pricing](https://resend.com/pricing), [quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits))

| Item             | Free                            | Pro            |
| ---------------- | ------------------------------- | -------------- |
| Price            | $0                              | $20 per month  |
| Emails per day   | 100                             | no daily limit |
| Emails per month | 3,000                           | 50,000         |
| Verified domains | 3                               | 10             |
| API rate limit   | 10 requests per second per team | same           |

Every To, CC and BCC recipient counts as one email. A bounce rate over 4% or a spam rate over 0.08% can pause sending.

### What usually forces the first paid step

- Convex egress or file storage (large files, many guests, kept backups), or several apps on one team: Convex Starter, cents to a few dollars a month.
- The client wants scheduled backups or log streaming: Convex Professional.
- More than 100 emails a day: Resend Pro.
- Server code with more than 100,000 requests a day: Workers Paid.
