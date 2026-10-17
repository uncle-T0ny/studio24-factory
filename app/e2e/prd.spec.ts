import { randomBytes } from "node:crypto"
import { expect, test } from "@playwright/test"
import { runConvex } from "./support/localDeployment"
import { deleteTestOwner } from "./support/owners"
import type { Stage } from "../convex/lib/validators"

const suffix = () => `e2e-prd-${randomBytes(3).toString("hex")}`

function clientLink(ownerSuffix: string, stages: Stage[]): string {
  const args = { ownerSuffix, clientName: "Sample planner", stages }
  const created = runConvex(["run", "testing:createTestProject", JSON.stringify(args)])

  return (JSON.parse(created) as { token: string }).token
}

test.describe("the PRD and the estimate, with no OPENROUTER_API_KEY", () => {
  const owners: string[] = []

  test.afterEach(() => {
    owners.splice(0).forEach(deleteTestOwner)
  })

  test("drafts the PRD from the interview and estimates it, labelled recorded", async ({
    page,
  }) => {
    owners.push(suffix())
    const token = clientLink(owners[0] ?? "", ["prd", "analysis"])
    runConvex(["run", "prd:seedFixtureInterview", JSON.stringify({ token, stage: "prd" })])

    await page.goto(`/c/${token}/prd`)
    await page.getByRole("button", { name: "Draft the PRD" }).click()

    await expect(page.getByText("FR-1 Draw the room")).toBeVisible()
    await expect(page.getByText(/^Recorded demo answer/)).toBeVisible()
    await expect(page.getByText("unverified", { exact: true })).toHaveCount(1)
    await expect(page.getByText("verified", { exact: true })).toHaveCount(8)

    runConvex(["run", "prd:seedFixtureInterview", JSON.stringify({ token, stage: "analysis" })])
    await page.goto(`/c/${token}/analysis`)
    await page.getByRole("button", { name: "Run the analysis" }).click()

    await expect(page.getByText("client-app-starter v0.4.0")).toBeVisible()
    await expect(page.getByText("$0 a month", { exact: true })).toBeVisible()
    await expect(page.getByText("Convex: 1,000,000 function calls a month")).toBeVisible()
    await expect(page.getByText("not supported")).toBeVisible()
  })

  test("refuses the PRD to a link that doesn't open its stage", async ({ page }) => {
    owners.push(suffix())
    const token = clientLink(owners[0] ?? "", ["interview"])

    await page.goto(`/c/${token}/prd`)

    await expect(page.getByText("This link doesn't open this stage.")).toBeVisible()
  })
})
