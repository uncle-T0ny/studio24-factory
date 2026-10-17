# The voice worker as a container, for your own server (README, "Optional: voice (LiveKit)").
#   docker build -t voice-agent .
#   docker run -d --name voice-agent --env-file .env.production --restart unless-stopped voice-agent
# The worker only makes outbound connections (LiveKit, OpenRouter, Convex): publish no ports.
FROM node:24-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json tsconfig.json tsconfig.build.json ./
RUN npm ci

# The sources to plain JavaScript in dist/ (npm run build), then only the runtime packages.
COPY src ./src
RUN npm run build && npm prune --omit=dev

# The plugins' model files are fetched now, at build time, not on the first session.
RUN npx livekit-agents download-files

USER node
CMD ["node", "dist/main.js", "start"]
