import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import {
  FeedbackStatus,
  FeedbackType,
  MAX_SCREENSHOT_BYTES,
  type FeedbackContext,
} from "./lib/feedback"
import { newBackend, OWNER_EMAILS, signedIn, storedFile, type TestBackend } from "./test.setup"
import { defined } from "../src/test/defined"

const CONTEXT: FeedbackContext = {
  path: "/project/k17abc",
  projectId: "k17abc",
  appVersion: "a680093",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/141.0.0.0 Safari/537.36",
  viewport: {
    width: 1440,
    height: 900,
  },
  time: "2026-10-16T21:04:05.000Z",
  timeZone: "America/Denver",
}

async function fixture() {
  const t = newBackend()

  return {
    t,
    owner: (await signedIn(t, "owner@example.com")).as,
    otherOwner: (await signedIn(t, "other@example.com")).as,
  }
}

async function feedbackRows(t: TestBackend) {
  return await t.run(async (ctx) => await ctx.db.query("feedback").collect())
}

beforeEach(() => {
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("feedback", () => {
  it("saves a signed-in owner's feedback as new, with a trimmed message and the screenshot", async () => {
    const { t, otherOwner } = await fixture()
    const screenshotId = await storedFile(t, "image/png", 200_000)
    const feedbackId = await otherOwner.mutation(api.feedback.create, {
      type: FeedbackType.Broken,
      message: "  The export button does nothing  ",
      screenshotId,
      context: CONTEXT,
    })
    const row = await t.run(async (ctx) => await ctx.db.get(feedbackId))

    expect(row).toMatchObject({
      type: FeedbackType.Broken,
      message: "The export button does nothing",
      screenshotId,
      context: CONTEXT,
      status: FeedbackStatus.New,
    })
    expect(typeof row?.createdAt).toBe("number")
  })

  it("lists every owner's entries to every owner, newest first, with email and screenshot URL", async () => {
    const { t, owner, otherOwner } = await fixture()
    const screenshotId = await storedFile(t, "image/jpeg", 100_000)

    await otherOwner.mutation(api.feedback.create, {
      type: FeedbackType.Feature,
      message: "Add a dark mode",
      context: CONTEXT,
    })
    await new Promise((resolve) => setTimeout(resolve, 2))
    await owner.mutation(api.feedback.create, {
      type: FeedbackType.Question,
      message: "Can I rename a project?",
      screenshotId,
      context: CONTEXT,
    })

    const entries = await otherOwner.query(api.feedback.list, {})

    expect(entries.map((entry) => [entry.message, entry.authorEmail])).toEqual([
      ["Can I rename a project?", "owner@example.com"],
      ["Add a dark mode", "other@example.com"],
    ])
    expect(defined(entries[0]).screenshotUrl).toEqual(expect.any(String))
    expect(defined(entries[1]).screenshotUrl).toBeNull()
  })

  it("marks an entry done and filters by status", async () => {
    const { owner, otherOwner } = await fixture()
    const feedbackId = await otherOwner.mutation(api.feedback.create, {
      type: FeedbackType.Broken,
      message: "Undo skips a step",
      context: CONTEXT,
    })

    await owner.mutation(api.feedback.setStatus, {
      feedbackId,
      status: FeedbackStatus.Done,
    })

    expect(await owner.query(api.feedback.list, { status: FeedbackStatus.New })).toEqual([])
    expect(
      (await owner.query(api.feedback.list, { status: FeedbackStatus.Done })).map(
        (entry) => entry.id,
      ),
    ).toEqual([feedbackId])
  })

  it("refuses everyone who isn't a signed-in owner, and saves nothing", async () => {
    const { t, otherOwner } = await fixture()
    const stranger = (await signedIn(t, "stranger@example.com")).as
    const feedbackId = await otherOwner.mutation(api.feedback.create, {
      type: FeedbackType.Broken,
      message: "Undo skips a step",
      context: CONTEXT,
    })

    for (const caller of [t, stranger]) {
      const refusals = [
        caller.mutation(api.feedback.create, {
          type: FeedbackType.Broken,
          message: "Let me in",
          context: CONTEXT,
        }),
        caller.query(api.feedback.list, {}),
        caller.mutation(api.feedback.setStatus, {
          feedbackId,
          status: FeedbackStatus.Done,
        }),
        caller.mutation(api.feedback.generateUploadUrl, {}),
      ]

      for (const refusal of refusals) {
        await expect(refusal).rejects.toThrow("Not allowed")
      }
    }

    const rows = await feedbackRows(t)

    expect(rows).toHaveLength(1)
    expect(defined(rows[0]).status).toBe(FeedbackStatus.New)
  })

  it("refuses an empty message and a screenshot that isn't a small PNG or JPG", async () => {
    const { t, otherOwner } = await fixture()
    const gif = await storedFile(t, "image/gif", 1000)
    const huge = await storedFile(t, "image/png", MAX_SCREENSHOT_BYTES + 1)
    const attempts = [
      otherOwner.mutation(api.feedback.create, {
        type: FeedbackType.Broken,
        message: "   ",
        context: CONTEXT,
      }),
      otherOwner.mutation(api.feedback.create, {
        type: FeedbackType.Broken,
        message: "See the gif",
        screenshotId: gif,
        context: CONTEXT,
      }),
      otherOwner.mutation(api.feedback.create, {
        type: FeedbackType.Broken,
        message: "See the huge one",
        screenshotId: huge,
        context: CONTEXT,
      }),
    ]

    for (const attempt of attempts) {
      await expect(attempt).rejects.toThrow()
    }

    expect(await feedbackRows(t)).toHaveLength(0)
  })
})
