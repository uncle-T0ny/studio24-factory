import type { TranscriptLine } from "./transcript"
import { cleanTurnText, MAX_TURNS, VoiceRole, type AgentEvent, type Turn } from "./voice"
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

async function interviewByRoom(
  ctx: MutationCtx,
  roomName: string,
): Promise<Doc<"interviews"> | null> {
  return await ctx.db
    .query("interviews")
    .withIndex("by_roomName", (q) => q.eq("roomName", roomName))
    .unique()
}

function turnRow(interview: Doc<"interviews">, turn: Turn) {
  return {
    interviewId: interview._id,
    projectId: interview.projectId,
    seq: turn.index,
    speaker: turn.role === VoiceRole.User ? ("client" as const) : ("agent" as const),
    text: cleanTurnText(turn.text),
    at: turn.at,
  }
}

async function storeTurn(ctx: MutationCtx, interview: Doc<"interviews">, turn: Turn) {
  const isOutOfRange = turn.index < 0 || turn.index >= MAX_TURNS

  if (interview.endedAt !== undefined || isOutOfRange || cleanTurnText(turn.text) === "") {
    return
  }

  const stored = await ctx.db
    .query("transcriptTurns")
    .withIndex("by_interview", (q) => q.eq("interviewId", interview._id).eq("seq", turn.index))
    .unique()

  if (stored) {
    await ctx.db.patch(stored._id, turnRow(interview, turn))
  } else {
    await ctx.db.insert("transcriptTurns", turnRow(interview, turn))
  }

  if (interview.status === "waiting") {
    await ctx.db.patch(interview._id, { status: "live" })
  }
}

async function endInterview(
  ctx: MutationCtx,
  interview: Doc<"interviews">,
  event: Extract<AgentEvent, { type: "end" }>,
) {
  const stored = await ctx.db
    .query("transcriptTurns")
    .withIndex("by_interview", (q) => q.eq("interviewId", interview._id))
    .collect()

  for (const row of stored) {
    await ctx.db.delete(row._id)
  }

  for (const turn of event.turns.slice(0, MAX_TURNS).filter((t) => cleanTurnText(t.text))) {
    await ctx.db.insert("transcriptTurns", turnRow(interview, turn))
  }

  const endedAt = interview.endedAt ?? event.at

  await ctx.db.patch(interview._id, {
    status: "done",
    endedAt,
    durationSec: Math.round((endedAt - (interview.startedAt ?? endedAt)) / 1000),
  })
}

export async function recordAgentEvent(ctx: MutationCtx, event: AgentEvent): Promise<boolean> {
  const interview = await interviewByRoom(ctx, event.roomName)

  if (!interview) {
    return false
  }

  switch (event.type) {
    case "turn":
      await storeTurn(ctx, interview, event)
      break
    case "end":
      await endInterview(ctx, interview, event)
      break
  }

  return true
}

export async function interviewTurns(
  ctx: QueryCtx,
  interviewId: Id<"interviews">,
): Promise<TranscriptLine[]> {
  const rows = await ctx.db
    .query("transcriptTurns")
    .withIndex("by_interview", (q) => q.eq("interviewId", interviewId))
    .collect()

  return rows.map(({ seq, speaker, text }) => ({ seq, speaker, text }))
}

// Numbered from 1, like the fixture transcript the recorded PRD cites.
export async function appendTurn(
  ctx: MutationCtx,
  interview: Doc<"interviews">,
  speaker: TranscriptLine["speaker"],
  text: string,
): Promise<void> {
  const last = await ctx.db
    .query("transcriptTurns")
    .withIndex("by_interview", (q) => q.eq("interviewId", interview._id))
    .order("desc")
    .first()

  await ctx.db.insert("transcriptTurns", {
    interviewId: interview._id,
    projectId: interview.projectId,
    seq: (last?.seq ?? 0) + 1,
    speaker,
    text,
    at: Date.now(),
  })
}
