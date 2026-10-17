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

const MAX_DURATION_REASON = "max_duration"
const DRAIN_MARGIN_MS = 60_000
const HEALTH_HOST = "127.0.0.1"

const config = readConfig(process.env)

function speech() {
  return {
    stt: new deepgram.STT({
      apiKey: config.deepgramApiKey,
      model: "nova-3",
      language: "en",
      // Smart formatting wrote a spoken number as "12:30" (lesson 1).
      smartFormat: false,
      keyterm: [...KEYTERMS],
    }),
    tts: new deepgram.TTS({ apiKey: config.deepgramApiKey, model: "aura-2-thalia-en" }),
  }
}

class OpenRouterLLM extends openai.LLM {
  override chat(options: Parameters<openai.LLM["chat"]>[0]) {
    return super.chat({ ...options, extraKwargs: withThinkingOff(options.extraKwargs) })
  }
}

// Don't set temperature: Claude Haiku 5.5 refuses it on OpenRouter.
function languageModel() {
  return new OpenRouterLLM({
    model: config.openRouterModel,
    baseURL: OPENROUTER_BASE_URL,
    apiKey: config.openRouterApiKey,
    maxCompletionTokens: MAX_REPLY_TOKENS,
  })
}

// A longer pause before the turn ends keeps a sentence with a pause in it as one answer (lesson 2).
const TURN_HANDLING = {
  turnDetection: "vad",
  endpointing: { minDelay: 800 },
  interruption: { enabled: true, mode: "vad" },
  preemptiveGeneration: { enabled: true },
} as const

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
    const { interviewId } = parseJobMetadata(ctx.job.metadata)
    const logger = log().child({ roomName, interviewId })
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
      inputOptions: { deleteRoomOnClose: true },
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
