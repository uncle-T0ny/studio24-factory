import { describe, expect, it } from "vitest"
import { internal } from "./_generated/api"
import { CAP_REACHED, DAILY_CAPS, usageDay } from "./lib/usage"
import { newBackend } from "./test.setup"

describe("the usage check", () => {
  it("allows 30 LLM calls a day and refuses the 31st without counting it", async () => {
    const t = newBackend()

    for (let i = 0; i < 30; i += 1) {
      await t.mutation(internal.usage.spend, { kind: "llmCalls" })
    }

    await expect(t.mutation(internal.usage.spend, { kind: "llmCalls" })).rejects.toThrow(
      CAP_REACHED,
    )

    const rows = await t.run(async (ctx) => await ctx.db.query("usage").collect())

    expect(rows).toEqual([expect.objectContaining({ kind: "llmCalls", count: 30 })])
    expect(DAILY_CAPS).toEqual({ interviews: 10, llmCalls: 30, sttSeconds: 30 * 60 })
  })

  it("counts minutes without a daily cap, and per UTC day", async () => {
    const t = newBackend()

    await t.run(async (ctx) => {
      await ctx.db.insert("usage", { day: "2000-01-01", kind: "llmCalls", count: 30 })
    })
    await t.mutation(internal.usage.spend, { kind: "llmCalls" })
    await t.mutation(internal.usage.spend, { kind: "interviewMinutes", amount: 500 })

    const today = await t.run(
      async (ctx) =>
        await ctx.db
          .query("usage")
          .withIndex("by_day", (q) => q.eq("day", usageDay(Date.now())))
          .collect(),
    )

    expect(today.map(({ kind, count }) => ({ kind, count }))).toEqual([
      { kind: "interviewMinutes", count: 500 },
      { kind: "llmCalls", count: 1 },
    ])
    expect(usageDay(Date.UTC(2026, 9, 17, 23, 59))).toBe("2026-10-17")
  })

  it("caps speech-to-text at 30 minutes a day", async () => {
    const t = newBackend()

    await t.mutation(internal.usage.spend, { kind: "sttSeconds", amount: 30 * 60 - 10 })

    await expect(
      t.mutation(internal.usage.spend, { kind: "sttSeconds", amount: 11 }),
    ).rejects.toThrow(CAP_REACHED)
    await t.mutation(internal.usage.spend, { kind: "sttSeconds", amount: 10 })
  })
})
