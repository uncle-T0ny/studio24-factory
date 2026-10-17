import type { Locator } from "@playwright/test"
import { createProject } from "./support/app"
import { expect, test } from "./support/fixtures"
import { solidPng, type Rgb } from "./support/png"

const SCREENSHOT_COLOR: Rgb = {
  red: 200,
  green: 60,
  blue: 120,
}
const SCREENSHOT_WIDTH_PX = 320
const SCREENSHOT_HEIGHT_PX = 200

// A macOS screenshot copied to the clipboard pastes as one PNG file with no text. The test hands
// the page exactly that paste event, so it never touches the system clipboard other sessions use.
async function pastePng(target: Locator, png: Buffer): Promise<void> {
  await target.evaluate((element, base64) => {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
    const data = new DataTransfer()

    data.items.add(new File([bytes], "image.png", { type: "image/png" }))
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    )
  }, png.toString("base64"))
}

test("feedback: sent from a project with a pasted screenshot, shown on /feedback, marked done", async ({
  page,
  owner,
}) => {
  await createProject(page, `Spring launch (${owner.suffix})`)

  const projectPath = new URL(page.url()).pathname
  const message = `The export button does nothing (${owner.suffix})`
  const dialog = page.getByRole("dialog", { name: "Send feedback" })

  const messageField = dialog.getByLabel("Message")

  await page.getByRole("button", { name: "Feedback", exact: true }).click()
  await expect(dialog).toBeVisible()
  await expect(messageField).toBeFocused()
  await expect(dialog.getByText(`Sent with: ${projectPath} ·`)).toBeVisible()
  await dialog.getByRole("radio", { name: "Feature request" }).click()
  await dialog.getByRole("radio", { name: "Something's broken" }).click()
  await expect(dialog.getByRole("radio", { name: "Something's broken" })).toHaveAttribute(
    "aria-checked",
    "true",
  )

  await messageField.fill(message)
  await pastePng(
    messageField,
    solidPng(SCREENSHOT_WIDTH_PX, SCREENSHOT_HEIGHT_PX, SCREENSHOT_COLOR),
  )
  await expect(dialog.getByRole("button", { name: "Enlarge screenshot" })).toBeVisible()
  await expect(
    dialog.getByText(`${SCREENSHOT_WIDTH_PX} × ${SCREENSHOT_HEIGHT_PX} px`),
  ).toBeVisible()
  await expect(messageField).toHaveValue(message)

  await dialog.getByRole("button", { name: "Send feedback" }).click()
  await expect(page.getByRole("status").filter({ hasText: "Thanks! Saved." })).toBeVisible()
  await expect(dialog).toHaveCount(0)

  await page.getByRole("link", { name: "All projects" }).click()
  await page.getByRole("link", { name: "All feedback" }).click()
  await expect(page).toHaveURL(/\/feedback$/)

  const entry = page.getByRole("article").filter({ hasText: message })

  await expect(entry).toBeVisible()
  await expect(entry.getByText(owner.email, { exact: true })).toBeVisible()
  await expect(entry.getByText("Something's broken", { exact: true })).toBeVisible()
  await expect(entry.getByText(projectPath, { exact: true })).toBeVisible()
  await expect(entry.getByText(/^Headless Chrome \d+|^Chrome \d+/)).toBeVisible()

  await entry.getByRole("button", { name: "Enlarge screenshot" }).click()
  const viewer = page.getByRole("dialog", { name: "Screenshot" })
  const image = viewer.getByRole("img", { name: "Screenshot" })

  await expect(image).toBeVisible()
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBe(SCREENSHOT_WIDTH_PX)
  await viewer.getByRole("button", { name: "Close" }).click()
  await expect(viewer).toHaveCount(0)

  const status = entry.getByRole("radiogroup", { name: "Status" })

  await expect(status.getByRole("radio", { name: "New" })).toHaveAttribute("aria-checked", "true")
  await status.getByRole("radio", { name: "Done" }).click()
  await expect(status.getByRole("radio", { name: "Done" })).toHaveAttribute("aria-checked", "true")

  const filter = page.getByRole("radiogroup", { name: "Show" })

  await filter.getByRole("radio", { name: "New" }).click()
  await expect(entry).toHaveCount(0)
  await filter.getByRole("radio", { name: "Done" }).click()
  await expect(entry).toBeVisible()

  await page.reload()
  await expect(
    page
      .getByRole("article")
      .filter({ hasText: message })
      .getByRole("radiogroup", { name: "Status" })
      .getByRole("radio", { name: "Done" }),
  ).toHaveAttribute("aria-checked", "true")
})
