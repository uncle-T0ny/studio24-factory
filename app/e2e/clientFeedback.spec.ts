import { randomBytes } from "node:crypto"
import { expect, test, type Page } from "@playwright/test"
import { runConvex } from "./support/localDeployment"
import { deleteTestOwner } from "./support/owners"
import { slugOf } from "../convex/lib/projects"

const MOCKUP = "<!doctype html><h1>Seating plan mockup</h1>"
const FEEDBACK =
  "Dragging guests onto tables is quick. Printing cuts off the last row. Show free chairs per table."

function clientWithMockup(): { suffix: string; token: string } {
  const suffix = `e2e-feedback-${randomBytes(3).toString("hex")}`
  const clientName = `Client ${suffix}`
  const created = runConvex([
    "run",
    "testing:createTestProject",
    JSON.stringify({ ownerSuffix: suffix, clientName, stages: ["prototype", "feedback"] }),
  ])
  const { token } = JSON.parse(created) as { token: string }

  runConvex([
    "run",
    "prototypes:uploadMockup",
    JSON.stringify({ slug: slugOf(clientName), html: MOCKUP }),
  ])

  return { suffix, token }
}

function isVoiceEnabled(): boolean {
  return runConvex(["run", "clientFeedback:voiceEnabled"]).trim() === "true"
}

async function expectMockup(page: Page): Promise<void> {
  const frame = page.frameLocator('iframe[title="The prototype"]')

  await expect(frame.getByRole("heading", { name: "Seating plan mockup" })).toBeVisible()
}

test("opens the uploaded mockup at the prototype stage", async ({ page }) => {
  const client = clientWithMockup()

  try {
    await page.goto(`/c/${client.token}/prototype`)
    await expectMockup(page)
  } finally {
    deleteTestOwner(client.suffix)
  }
})

test("sorts written feedback; the mic and a live split only with OPENROUTER_API_KEY", async ({
  page,
}) => {
  const client = clientWithMockup()
  const withKey = isVoiceEnabled()

  try {
    await page.goto(`/c/${client.token}/feedback`)
    await expectMockup(page)
    await page.getByLabel("What works, what's broken, what would you change?").fill(FEEDBACK)
    await page.getByRole("button", { name: "Send feedback" }).click()

    const sent = page.getByRole("article", { name: "Feedback sent" })

    await expect(sent.getByText(FEEDBACK)).toBeVisible()
    await expect(
      sent.getByRole("list", { name: "What we heard" }).getByRole("listitem"),
    ).not.toHaveCount(0, {
      timeout: 30_000,
    })
    await expect(sent.getByText("recorded demo answer")).toHaveCount(withKey ? 0 : 1)
    await expect(page.getByRole("button", { name: "Record a voice note" })).toHaveCount(
      withKey ? 1 : 0,
    )
  } finally {
    deleteTestOwner(client.suffix)
  }
})
