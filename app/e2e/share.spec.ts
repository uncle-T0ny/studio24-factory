import {
  createProject,
  readShareLink,
  renameProject,
  shareButton,
  shareDialog,
} from "./support/app"
import { expect, test } from "./support/fixtures"

test("share: a guest opens the link and renames the project, a new link revokes the old one", async ({
  page,
  owner,
  browser,
}) => {
  const name = `Spring launch (${owner.suffix})`
  const renamed = `Renamed by a guest (${owner.suffix})`

  await createProject(page, name)
  const link = await readShareLink(page)

  expect(link).toMatch(/\/p\/[A-Za-z0-9_-]{32}$/)

  const guestContext = await browser.newContext()

  try {
    const guest = await guestContext.newPage()

    await guest.goto(link)
    await expect(guest.getByRole("heading", { name, exact: true })).toBeVisible()
    await expect(guest.getByText("You opened this project with a share link.")).toBeVisible()
    await expect(guest.getByRole("button", { name: "Feedback", exact: true })).toHaveCount(0)
    await renameProject(guest, renamed)
    await expect(guest.getByRole("heading", { name: renamed, exact: true })).toBeVisible()

    // The owner's page follows the guest's edit live.
    await expect(page.getByRole("heading", { name: renamed, exact: true })).toBeVisible()

    await shareButton(page).click()
    await shareDialog(page).getByRole("button", { name: "New link" }).click()
    await page
      .getByRole("alertdialog", { name: "Make a new link" })
      .getByRole("button", { name: "Make new link" })
      .click()
    await expect(
      shareDialog(page).getByText("New link made. The old one no longer works."),
    ).toBeVisible()
    await expect(shareDialog(page).getByLabel("Link to share")).not.toHaveValue(link)

    await guest.reload()
    await expect(guest.getByText(/This link doesn't work any more/)).toBeVisible()
  } finally {
    await guestContext.close()
  }
})

test("share: a made-up token opens nothing", async ({ page }) => {
  await page.goto("/p/not-a-real-token")
  await expect(page.getByText(/This link doesn't work any more/)).toBeVisible()
})
