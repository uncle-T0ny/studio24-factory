// Page helpers. They find things only by role, label and visible text, so the markup can change
// under them.
import { expect, type Locator, type Page } from "@playwright/test"

export async function openSignUp(page: Page): Promise<void> {
  await page.goto("/")
  await page.getByRole("button", { name: "First time here? Sign up" }).click()
  await expect(page.getByRole("button", { name: "Sign up", exact: true })).toBeVisible()
}

export async function submitCredentials(
  page: Page,
  email: string,
  password: string,
  action: "Sign up" | "Sign in",
): Promise<void> {
  await page.getByLabel("Email", { exact: true }).fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: action, exact: true }).click()
}

export async function signUp(page: Page, email: string, password: string): Promise<void> {
  await openSignUp(page)
  await submitCredentials(page, email, password, "Sign up")
  await expectProjectsPage(page)
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/")
  await submitCredentials(page, email, password, "Sign in")
  await expectProjectsPage(page)
}

export async function expectProjectsPage(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible()
}

// Creates a project from the projects page and waits for its own page.
export async function createProject(page: Page, name: string): Promise<void> {
  const form = page.getByRole("form", { name: "New project" })

  await form.getByLabel("Project name").fill(name)
  await form.getByRole("button", { name: "New project" }).click()
  await expect(page).toHaveURL(/\/project\//)
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible()
}

export function shareButton(page: Page): Locator {
  return page.getByRole("button", { name: "Share link", exact: true })
}

export function shareDialog(page: Page): Locator {
  return page.getByRole("dialog", { name: "Share link" })
}

// Opens the share popover on a project's page, reads the link and closes it again.
export async function readShareLink(page: Page): Promise<string> {
  await shareButton(page).click()
  const link = await shareDialog(page).getByLabel("Link to share").inputValue()

  await shareButton(page).click()
  await expect(shareDialog(page)).toHaveCount(0)

  return link
}

export async function renameProject(page: Page, name: string): Promise<void> {
  const form = page.getByRole("form", { name: "Rename project" })

  await form.getByLabel("Project name").fill(name)
  await form.getByRole("button", { name: "Save" }).click()
}
