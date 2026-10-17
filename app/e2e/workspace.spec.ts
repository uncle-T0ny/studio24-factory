import type { Browser, Page } from "@playwright/test"
import { createProject } from "./support/app"
import { expect, test } from "./support/fixtures"

async function newClientLink(page: Page, stage: string): Promise<string> {
  const links = page.getByRole("form", { name: "Client links" })

  await links.getByLabel("Opens the stage").selectOption(stage)
  await links.getByRole("button", { name: "New link" }).click()

  const url = links.getByLabel("New link, shown once")

  await expect(url).toHaveValue(/\/c\//)

  return await url.inputValue()
}

async function clientPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext()

  return await context.newPage()
}

test("a client link names the current stage before its own is reached, then opens it, and stops when revoked", async ({
  page,
  browser,
  owner,
}) => {
  await createProject(page, `Spring Bakery (${owner.suffix})`)
  await expect(page.getByRole("list", { name: "Stages" }).getByText("Interview")).toBeVisible()

  const url = await newClientLink(page, "prd")
  const client = await clientPage(browser)

  await client.goto(url)
  await expect(client.getByText("your project is now at the Interview stage")).toBeVisible()

  await page.getByRole("button", { name: "Move to PRD" }).click()
  await expect(page.getByLabel("Stage", { exact: true })).toHaveValue("prd")
  await client.goto(url)
  await expect(client).toHaveURL(/\/prd$/)

  await page.getByRole("list", { name: "Links" }).getByRole("button", { name: "Revoke" }).click()
  await expect(page.getByText(/^Revoked/)).toBeVisible()
  await client.goto(url)
  await expect(client.getByText("This link isn't valid any more.")).toBeVisible()
})

test("a final-stage link asks the client to sign in", async ({ page, browser, owner }) => {
  await createProject(page, `Final Bakery (${owner.suffix})`)
  await page.getByLabel("Stage", { exact: true }).selectOption("final")
  await expect(page.getByRole("button", { name: "Move to Transferred" })).toBeVisible()

  const client = await clientPage(browser)

  await client.goto(await newClientLink(page, "final"))
  await expect(client).toHaveURL(/\/final$/)
  await expect(client.getByText("Sign in to open your app.")).toBeVisible()
})
