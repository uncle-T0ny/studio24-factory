// The transcript goes to the app's Convex HTTP action (app/convex/http.ts), one event per POST:
// each committed turn as it happens (best effort), then, when the session ends, the whole
// history, which replaces what the turns stored. Each turn carries its index, so a retried POST
// stores nothing twice. The shapes match agentEventValidator in app/convex/lib/voice.ts; the two
// packages share no code, so a change to one is a change to both.

export const AGENT_EVENTS_PATH = "/voice/agent-events"

export const Role = {
  User: "user",
  Assistant: "assistant",
} as const

export type Role = (typeof Role)[keyof typeof Role]

export interface Turn {
  index: number
  role: Role
  text: string
  at: number
}

export interface TurnEvent extends Turn {
  type: "turn"
  roomName: string
}

export interface EndEvent {
  type: "end"
  roomName: string
  reason: string
  at: number
  turns: Turn[]
}

export type AgentEvent = TurnEvent | EndEvent

// The longest turn text and the most turns sent; the server keeps the same limits.
export const MAX_TURN_LENGTH = 4000
export const MAX_TURNS = 500

// A message as the session commits it (llm.ChatMessage has these fields).
export interface Message {
  role: string
  textContent: string | undefined
  createdAt: number
}

function isRole(role: string): role is Role {
  return role === Role.User || role === Role.Assistant
}

// The message as a turn's role and text, or null: only user and assistant messages with some
// text count (the session also commits system and developer messages, and an interrupted reply
// can be empty).
function spoken(message: Message): Pick<Turn, "role" | "text"> | null {
  const text = message.textContent?.trim() ?? ""

  if (!isRole(message.role) || text.length === 0) {
    return null
  }

  return { role: message.role, text: text.slice(0, MAX_TURN_LENGTH) }
}

// The session's messages as turns, numbered in order: the history the end event carries.
export function historyTurns(messages: readonly Message[]): Turn[] {
  const turns: Turn[] = []

  for (const message of messages) {
    const turn = spoken(message)

    if (turn && turns.length < MAX_TURNS) {
      turns.push({ index: turns.length, ...turn, at: message.createdAt })
    }
  }

  return turns
}

// Numbers the turns as they are committed, the same way historyTurns does.
export function createTurnCounter(roomName: string) {
  let next = 0

  return (message: Message): TurnEvent | null => {
    const turn = spoken(message)

    if (!turn || next >= MAX_TURNS) {
      return null
    }

    const event: TurnEvent = { type: "turn", roomName, index: next, ...turn, at: message.createdAt }

    next += 1

    return event
  }
}

export interface Logger {
  warn: (fields: Record<string, unknown>, message: string) => void
}

export interface PosterOptions {
  siteUrl: string
  secret: string
  logger: Logger
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  attempts?: number
}

export interface TranscriptPoster {
  // Queues the event; events go out one at a time, in the order they were queued.
  post: (event: AgentEvent) => void
  // Resolves once every queued event was sent or given up on.
  flush: () => Promise<void>
}

const DEFAULT_ATTEMPTS = 3
const FIRST_RETRY_MS = 250

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

// A 4xx answer (a wrong secret, a malformed event, a room the app doesn't know) won't change on
// a retry; a network error or a 5xx might.
function isRetryable(status: number | null): boolean {
  return status === null || status >= 500
}

export function createTranscriptPoster(options: PosterOptions): TranscriptPoster {
  const send = options.fetch ?? fetch
  const sleep = options.sleep ?? defaultSleep
  const attempts = options.attempts ?? DEFAULT_ATTEMPTS
  const url = new URL(AGENT_EVENTS_PATH, options.siteUrl).toString()
  let queue = Promise.resolve()

  const deliver = async (event: AgentEvent): Promise<void> => {
    let status: number | null = null

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await send(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.secret}`,
          },
          body: JSON.stringify(event),
        })

        if (response.ok) {
          return
        }

        status = response.status
      } catch {
        status = null
      }

      if (!isRetryable(status) || attempt === attempts) {
        break
      }

      await sleep(FIRST_RETRY_MS * 2 ** (attempt - 1))
    }

    options.logger.warn(
      { type: event.type, roomName: event.roomName, status },
      "transcript event not delivered",
    )
  }

  return {
    post: (event) => {
      queue = queue.then(() => deliver(event))
    },
    flush: () => queue,
  }
}
