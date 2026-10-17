// The starter this app is built on, analysed by hand: the template every project can use even
// when the analysis by link can't run. Prices checked on the providers' pages on 2026-10-17.
export const SEEDED_TEMPLATE = {
  name: "client-app-starter v0.4.0",
  repoUrl: "https://github.com/uncle-T0ny/client-app-starter",
  manifest: {
    stack: [
      "Convex: database, server functions, Convex Auth (password)",
      "Vite, React and TypeScript",
      "Cloudflare Workers static assets",
      "LiveKit Agents voice worker (optional)",
      "Claude through OpenRouter (optional)",
    ],
    deployTarget: "Cloudflare Workers for the web app, Convex Cloud for the backend",
    configure: [
      "Set the app name and brand in app.config.ts",
      "Create the Convex production deployment and set its environment variables",
      "Set the Worker name in wrangler.jsonc and deploy",
    ],
    limits: [
      "Needs a connection: the Convex client has no offline mode",
      "One share token per project opens it to a guest",
      "Convex Free: 1,000,000 function calls a month, 0.5 GB of database, 1 GB of files",
      "Workers static assets: requests are free and unlimited",
    ],
    monthlyCost: {
      freeUsd: 0,
      paidUsd: 25,
      notes:
        "Free plans cover a small app. Past them, Convex Starter bills $2.20 per extra million function calls; Convex Professional is $25 a developer a month.",
    },
  },
}
