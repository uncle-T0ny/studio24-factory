import { randomBytes } from "node:crypto"
import { expect, test } from "./support/fixtures"
import { runConvex } from "./support/localDeployment"
import { deleteTestOwner } from "./support/owners"
import { FIXTURE_TRANSCRIPT } from "../convex/lib/fixtureTranscript"

const ANSWERS = FIXTURE_TRANSCRIPT.filter((turn) => turn.speaker === "client")

function interviewLink(suffix: string): string {
  const created = runConvex([
    "run",
    "testing:createTestProject",
    JSON.stringify({ ownerSuffix: suffix, clientName: "Interview client", stages: ["interview"] }),
  ])
  const { token } = JSON.parse(created) as { token: string }

  return `/c/${token}/interview`
}

test.describe("the interview without voice keys", () => {
  const suffix = `e2e-interview-${randomBytes(3).toString("hex")}`

  test.afterAll(() => deleteTestOwner(suffix))

  test("shows no mic, runs in text on recorded questions and ends after the sample answers", async ({
    page,
  }) => {
    await page.goto(interviewLink(suffix))

    await expect(page.getByRole("heading", { name: "Interview", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Start talking" })).toHaveCount(0)
    await page.getByRole("button", { name: "Start the interview" }).click()

    const transcript = page.getByRole("list", { name: "Transcript" })
    const form = page.getByRole("form", { name: "Your answer" })

    await expect(transcript.getByText(FIXTURE_TRANSCRIPT[0].text)).toBeVisible()
    await expect(transcript.getByText("Interviewer · recorded demo answer").first()).toBeVisible()

    for (const answer of ANSWERS) {
      await form.getByRole("button", { name: "Use the sample answer" }).click()
      await expect(form.getByLabel("Your answer")).toHaveValue(answer.text)
      await form.getByRole("button", { name: "Send" }).click()
      await expect(transcript.getByText(answer.text)).toBeVisible()
    }

    await expect(page.getByText("Thanks, the interview is done.")).toBeVisible()
    await expect(transcript.getByText(FIXTURE_TRANSCRIPT.at(-1)?.text ?? "")).toBeVisible()
    await expect(form).toHaveCount(0)
  })
})
