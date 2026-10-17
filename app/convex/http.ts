import { httpRouter } from "convex/server"
import { validate } from "convex-helpers/validators"
import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"
import { auth } from "./auth"
import { AGENT_EVENTS_PATH, agentEventValidator, isAgentRequest } from "./lib/voice"

const http = httpRouter()

auth.addHttpRoutes(http)

// The voice agent's transcript (agent/src/transcript.ts): one event per POST, with the shared
// VOICE_AGENT_SECRET as a bearer token. Convex doesn't retry an HTTP action, so the agent does,
// and storing an event twice changes nothing (lib/voiceData.ts).
http.route({
  path: AGENT_EVENTS_PATH,
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const isAgent = await isAgentRequest(
      request.headers.get("Authorization"),
      process.env.VOICE_AGENT_SECRET,
    )

    if (!isAgent) {
      return new Response("Unauthorized", { status: 401 })
    }

    let event: unknown

    try {
      event = await request.json()
    } catch {
      return new Response("The body isn't JSON.", { status: 400 })
    }

    if (!validate(agentEventValidator, event)) {
      return new Response("The body isn't an agent event.", { status: 400 })
    }

    const isKnownRoom = await ctx.runMutation(internal.voice.recordEvent, { event })

    return isKnownRoom
      ? new Response(null, { status: 204 })
      : new Response("No such session.", { status: 404 })
  }),
})

export default http
