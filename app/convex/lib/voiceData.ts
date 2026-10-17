import { cleanTurnText, MAX_TURNS, TranscriptSource, type AgentEvent, type Turn } from "./voice"
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"

// The voice module's writes: storing what the agent sends, and deleting a project's voice rows
// with the project (projects.remove).

async function sessionByRoom(
  ctx: MutationCtx,
  roomName: string,
): Promise<Doc<"voiceSessions"> | null> {
  return await ctx.db
    .query("voiceSessions")
    .withIndex("by_roomName", (q) => q.eq("roomName", roomName))
    .unique()
}

async function sessionTurns(
  ctx: MutationCtx,
  sessionId: Id<"voiceSessions">,
): Promise<Doc<"voiceTranscripts">[]> {
  return await ctx.db
    .query("voiceTranscripts")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect()
}

function turnRow(session: Doc<"voiceSessions">, turn: Turn) {
  return {
    ownerId: session.ownerId,
    projectId: session.projectId,
    sessionId: session._id,
    index: turn.index,
    role: turn.role,
    text: cleanTurnText(turn.text),
    at: turn.at,
    source: TranscriptSource.Voice,
  }
}

// One turn, stored once however often it is sent: a turn with the same index replaces the
// stored one. Ignored once the session has ended, since the end's history is final.
async function storeTurn(ctx: MutationCtx, session: Doc<"voiceSessions">, turn: Turn) {
  if (session.endedAt !== undefined || turn.index < 0 || turn.index >= MAX_TURNS) {
    return
  }

  const stored = await ctx.db
    .query("voiceTranscripts")
    .withIndex("by_session", (q) => q.eq("sessionId", session._id).eq("index", turn.index))
    .unique()

  if (stored) {
    await ctx.db.patch(stored._id, turnRow(session, turn))
  } else {
    await ctx.db.insert("voiceTranscripts", turnRow(session, turn))
  }
}

// The end: the history replaces whatever the turns stored, and the session is closed. Sending
// it twice gives the same rows.
async function endSession(
  ctx: MutationCtx,
  session: Doc<"voiceSessions">,
  event: Extract<AgentEvent, { type: "end" }>,
) {
  for (const row of await sessionTurns(ctx, session._id)) {
    await ctx.db.delete(row._id)
  }

  for (const turn of event.turns.slice(0, MAX_TURNS)) {
    await ctx.db.insert("voiceTranscripts", turnRow(session, turn))
  }

  await ctx.db.patch(session._id, {
    endedAt: session.endedAt ?? event.at,
    endReason: event.reason,
  })
}

// Stores an agent event; false when the app has no session for its room.
export async function recordAgentEvent(ctx: MutationCtx, event: AgentEvent): Promise<boolean> {
  const session = await sessionByRoom(ctx, event.roomName)

  if (!session) {
    return false
  }

  switch (event.type) {
    case "turn":
      await storeTurn(ctx, session, event)
      break
    case "end":
      await endSession(ctx, session, event)
      break
  }

  return true
}

export async function deleteProjectVoiceData(
  ctx: MutationCtx,
  projectId: Id<"projects">,
): Promise<void> {
  const transcripts = await ctx.db
    .query("voiceTranscripts")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect()
  const sessions = await ctx.db
    .query("voiceSessions")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect()

  for (const row of [...transcripts, ...sessions]) {
    await ctx.db.delete(row._id)
  }
}
