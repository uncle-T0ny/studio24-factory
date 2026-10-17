# Template analysis: seating-demo

Template: `uncle-T0ny/client-app-starter`.

## Manifest

- What it is: Vite, React and TypeScript on Cloudflare Workers static assets, with Convex and Convex Auth (password).
- What to configure: the Convex deployment, `SITE_URL`, the auth keys; voice keys only for the voice worker.
- Where it deploys: Cloudflare Workers (web) and Convex (backend).
- Limits: no canvas or drag-and-drop component; no file export.
- Monthly cost: Cloudflare Workers free plan and Convex free plan at trial usage.

## Verdicts

| ID    | Verdict         | Detail                                                    |
| ----- | --------------- | --------------------------------------------------------- |
| FR-1  | extension       | +16 h, +$0/month: a floor plan canvas with drag and drop. |
| FR-2  | in the template | Convex tables and the owner-scoped data pattern.          |
| FR-3  | extension       | +6 h, +$0/month: a couple role on the project link.       |
| FR-4  | extension       | +4 h, +$0/month: print styles and a CSV export.           |
| NFR-1 | in the template | Responsive UI kit.                                        |
| NFR-2 | in the template | Convex Auth and owner-scoped queries.                     |
| NFR-3 | in the template | Free plans at trial usage.                                |
| NFR-4 | extension       | +2 h, +$0/month: optimistic updates on drag.              |
