// Same shapes as agentEventValidator in app/convex/lib/voice.ts; the packages share no code.

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

export const MAX_TURN_LENGTH = 4000
export const MAX_TURNS = 500

export interface Message {
  role: string
  textContent: string | undefined
  createdAt: number
}

function isRole(role: string): role is Role {
  return role === Role.User || role === Role.Assistant
}

function spoken(message: Message): Pick<Turn, "role" | "text"> | null {
  const text = message.textContent?.trim() ?? ""

  if (!isRole(message.role) || text.length === 0) {
    return null
  }

  return { role: message.role, text: text.slice(0, MAX_TURN_LENGTH) }
}

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
  post: (event: AgentEvent) => void
  flush: () => Promise<void>
}

const DEFAULT_ATTEMPTS = 3
const FIRST_RETRY_MS = 250

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

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
