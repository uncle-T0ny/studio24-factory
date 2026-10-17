import { readFile } from "node:fs/promises"
import type { Page } from "@playwright/test"
import { createProject } from "./support/app"
import { expect, test } from "./support/fixtures"

type ChosenFile = string | { name: string; mimeType: string; buffer: Buffer }

// Clicks "Import project" and picks the file in the file chooser it opens.
async function importFile(page: Page, file: ChosenFile): Promise<void> {
  const choosing = page.waitForEvent("filechooser")

  await page.getByRole("button", { name: "Import project", exact: true }).click()
  await (await choosing).setFiles(file)
}

test("backup: the owner exports a project and imports it back as a new project", async ({
  page,
  owner,
}, testInfo) => {
  const name = `Spring launch (${owner.suffix})`

  await createProject(page, name)

  const downloading = page.waitForEvent("download")

  await page.getByRole("button", { name: "Export project" }).click()
  const download = await downloading
  const filePath = testInfo.outputPath("export.json")

  await download.saveAs(filePath)
  expect(download.suggestedFilename()).toMatch(/ - Project export - \d{4}-\d{2}-\d{2}\.json$/)

  const exported: unknown = JSON.parse(await readFile(filePath, "utf8"))

  expect(exported).toMatchObject({ version: 1, data: { project: { name } } })

  await page.getByRole("link", { name: "All projects" }).click()
  await importFile(page, filePath)
  await expect(
    page.getByText(`Imported "${name}" as a new one with its own share link.`),
  ).toBeVisible()
  await expect(page.getByRole("list", { name: "Projects" }).getByText(name)).toHaveCount(2)
})

test("backup: a file that isn't an export is refused with a message", async ({ page, owner }) => {
  await importFile(page, {
    name: `notes-${owner.suffix}.json`,
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ hello: "world" })),
  })
  await expect(page.getByText(/isn't a .* project export/)).toBeVisible()
  await expect(page.getByText("No projects yet.")).toBeVisible()
})
