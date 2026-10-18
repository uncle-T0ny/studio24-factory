import { ConvexError } from "convex/values"
import type { UsageKind } from "./validators"
import type { MutationCtx } from "../_generated/server"

export const DAILY_CAPS: Partial<Record<UsageKind, number>> = {
  interviews: 10,
  llmCalls: 30,
  sttSeconds: 30 * 60,
}

export const MAX_INTERVIEW_SEC = 10 * 60
export const MAX_VOICE_FEEDBACK_SEC = 3 * 60

export const CAP_REACHED = "Today's demo allowance is used up. It starts again at 00:00 UTC."

export function usageDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

export async function spendUsage(ctx: MutationCtx, kind: UsageKind, amount = 1): Promise<void> {
  const day = usageDay(Date.now())
  const row = await ctx.db
    .query("usage")
    .withIndex("by_day", (q) => q.eq("day", day).eq("kind", kind))
    .unique()
  const used = row?.count ?? 0
  const cap = DAILY_CAPS[kind]

  if (cap !== undefined && used + amount > cap) {
    throw new ConvexError(CAP_REACHED)
  }

  if (row) {
    await ctx.db.patch(row._id, { count: used + amount })
  } else {
    await ctx.db.insert("usage", { day, kind, count: amount })
  }
}
