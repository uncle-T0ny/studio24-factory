import { fileURLToPath } from "node:url"
import {
  cli,
  defineAgent,
  llm,
  log,
  ServerOptions,
  voice,
  type JobContext,
  type JobProcess,
} from "@livekit/agents"
import * as deepgram from "@livekit/agents-plugin-deepgram"
import * as openai from "@livekit/agents-plugin-openai"
import * as silero from "@livekit/agents-plugin-silero"
import { OPENROUTER_BASE_URL, readConfig } from "./config.ts"
import { quietTranscripts } from "./logging.ts"
import { parseJobMetadata } from "./metadata.ts"
import { withThinkingOff } from "./openRouterBody.ts"
import {
  CLOSING_LINE,
  GREETING_INSTRUCTIONS,
  INSTRUCTIONS,
  KEYTERMS,
  MAX_REPLY_TOKENS,
} from "./prompts.ts"
import {
  createTranscriptPoster,
  createTurnCounter,
  historyTurns,
  type TranscriptPoster,
} from "./transcript.ts"

// The voice worker. It registers with LiveKit under AGENT_NAME (config.ts) and joins only the
// rooms the app dispatches it to: the token app/convex/livekit.ts mints names the same
// AGENT_NAME. In the room it listens, answers through the LLM, speaks, and POSTs the transcript
// to the app's Convex HTTP action.

const MAX_DURATION_REASON = "max_duration"
// A SIGTERM lets the live sessions finish: each one ends at the session limit anyway.
const DRAIN_MARGIN_MS = 60_000
// The worker's health and status server listens on this machine only: nothing outside needs it.
const HEALTH_HOST = "127.0.0.1"

// Read at start: a missing variable stops the worker before it registers.
const config = readConfig(process.env)

// Speech in and out through Deepgram's own plugin, on DEEPGRAM_API_KEY: Nova-3 listens and
// Aura-2 (Thalia) speaks. There is no LiveKit Inference fallback. KEYTERMS (prompts.ts) bias
// the STT towards your domain's words; empty, it sends none.
function speech() {
  return {
    stt: new deepgram.STT({
      apiKey: config.deepgramApiKey,
      model: "nova-3",
      language: "en",
      keyterm: [...KEYTERMS],
    }),
    tts: new deepgram.TTS({ apiKey: config.deepgramApiKey, model: "aura-2-thalia-en" }),
  }
}

// OpenRouter's OpenAI-compatible API through the OpenAI plugin, with thinking off on every
// request (openRouterBody.ts). maxCompletionTokens goes out as max_completion_tokens. Don't set
// temperature: Claude Haiku 5.5 refuses it there.
class OpenRouterLLM extends openai.LLM {
  override chat(options: Parameters<openai.LLM["chat"]>[0]) {
    return super.chat({ ...options, extraKwargs: withThinkingOff(options.extraKwargs) })
  }
}

function languageModel() {
  return new OpenRouterLLM({
    model: config.openRouterModel,
    baseURL: OPENROUTER_BASE_URL,
    apiKey: config.openRouterApiKey,
    maxCompletionTokens: MAX_REPLY_TOKENS,
  })
}

// Every turn is set here, so a self-hosted worker and one on LiveKit Cloud behave the same
// (their defaults differ). Turns end on VAD silence plus STT endpointing; for LiveKit's turn
// detector model use turnDetection: new inference.TurnDetector() (README).
const TURN_HANDLING = {
  turnDetection: "vad",
  interruption: { enabled: true, mode: "vad" },
  preemptiveGeneration: { enabled: true },
} as const

// Each committed turn goes to the app as it happens; the end event carries the whole history.
function postTurns(session: voice.AgentSession, poster: TranscriptPoster, roomName: string) {
  const nextTurn = createTurnCounter(roomName)

  session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (event) => {
    if (!(event.item instanceof llm.ChatMessage)) {
      return
    }

    const turn = nextTurn(event.item)

    if (turn) {
      poster.post(turn)
    }
  })
}

function sessionMessages(session: voice.AgentSession): llm.ChatMessage[] {
  return session.history.items.filter((item) => item instanceof llm.ChatMessage)
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load()
  },
  entry: async (ctx: JobContext) => {
    quietTranscripts(log())

    const roomName = ctx.job.room?.name ?? ""
    const { sessionId } = parseJobMetadata(ctx.job.metadata)
    const logger = log().child({ roomName, sessionId })
    const poster = createTranscriptPoster({
      siteUrl: config.convexSiteUrl,
      secret: config.agentSecret,
      logger,
    })
    const session = new voice.AgentSession({
      vad: ctx.proc.userData.vad as silero.VAD,
      ...speech(),
      llm: languageModel(),
      turnHandling: TURN_HANDLING,
    })
    let endReason = "ended"

    // The session limit: say goodbye, then delete the room, which drops the user too.
    const endAtLimit = async () => {
      endReason = MAX_DURATION_REASON

      try {
        await session.say(CLOSING_LINE, { allowInterruptions: false }).waitForPlayout()
        await ctx.deleteRoom()
      } catch (error) {
        logger.warn({ error: String(error) }, "could not close the session cleanly")
      }

      ctx.shutdown(MAX_DURATION_REASON)
    }
    const limit = setTimeout(() => void endAtLimit(), config.maxSessionMs)

    session.on(voice.AgentSessionEventTypes.Close, (event) => {
      clearTimeout(limit)

      if (endReason !== MAX_DURATION_REASON) {
        endReason = event.reason
      }
    })
    postTurns(session, poster, roomName)

    // Runs when the job ends, for any reason: the whole history goes out before it exits.
    ctx.addShutdownCallback(async () => {
      clearTimeout(limit)
      poster.post({
        type: "end",
        roomName,
        reason: endReason,
        at: Date.now(),
        turns: historyTurns(sessionMessages(session)),
      })
      await poster.flush()
    })

    await session.start({
      agent: new voice.Agent({ instructions: INSTRUCTIONS }),
      room: ctx.room,
      // The room goes when the session does (the user left, or the limit), so nobody stays in
      // it using minutes. Noise cancellation (LiveKit Cloud's) plugs in here too (README).
      inputOptions: { deleteRoomOnClose: true },
      // No session recording or transcript upload to LiveKit Cloud: the app keeps the transcript.
      record: false,
    })
    await ctx.connect()
    session.generateReply({ instructions: GREETING_INSTRUCTIONS })
  },
})

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: config.agentName,
    host: HEALTH_HOST,
    drainTimeout: config.maxSessionMs + DRAIN_MARGIN_MS,
  }),
)
