import { expect, test } from "@playwright/test"
import { expectProjectsPage, openSignUp, signIn, signUp, submitCredentials } from "./support/app"
import {
  ALLOWLISTED_OWNER_EMAIL,
  ALLOWLISTED_OWNER_SUFFIX,
  OWNER_PASSWORD,
  deleteTestOwner,
  newTestOwner,
  strangerEmail,
} from "./support/owners"

test.describe("owner sign-up", () => {
  test.beforeEach(() => deleteTestOwner(ALLOWLISTED_OWNER_SUFFIX))
  test.afterEach(() => deleteTestOwner(ALLOWLISTED_OWNER_SUFFIX))

  test("the owner signs up, signs out and signs in again", async ({ page }) => {
    await openSignUp(page)
    await submitCredentials(page, ALLOWLISTED_OWNER_EMAIL, OWNER_PASSWORD, "Sign up")
    await expectProjectsPage(page)
    await expect(page.getByText("No projects yet.")).toBeVisible()

    await page.getByRole("button", { name: "Sign out" }).click()
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible()

    await signIn(page, ALLOWLISTED_OWNER_EMAIL, OWNER_PASSWORD)
    await page.reload()
    await expectProjectsPage(page)
  })
})

test("an email outside the allowlist can't sign up", async ({ page }) => {
  await openSignUp(page)
  await submitCredentials(page, strangerEmail(), OWNER_PASSWORD, "Sign up")

  await expect(
    page.getByText("Couldn't sign up. Only the owners' emails can make an account."),
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toHaveCount(0)
})

test("sign-in problems: no account offers sign-up, a wrong password offers a reset", async ({
  page,
}) => {
  const owner = newTestOwner("sign-in-problems")

  try {
    await page.goto("/")
    await submitCredentials(page, owner.email, owner.password, "Sign in")
    await expect(page.getByText("No account with this email.")).toBeVisible()

    await page.getByRole("button", { name: "Create one?" }).click()
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue(owner.email)
    await page.getByRole("button", { name: "Sign up", exact: true }).click()
    await expectProjectsPage(page)

    await page.getByRole("button", { name: "Sign out" }).click()
    await submitCredentials(page, owner.email, "not-the-password", "Sign in")
    await expect(page.getByText("Wrong password.")).toBeVisible()

    await page.getByRole("button", { name: "Forgot password?" }).click()
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible()
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue(owner.email)
  } finally {
    deleteTestOwner(owner.suffix)
  }
})

test("an email that has an account is told to sign in instead", async ({ page }) => {
  const owner = newTestOwner("account-exists")

  try {
    await signUp(page, owner.email, owner.password)
    await page.getByRole("button", { name: "Sign out" }).click()

    await openSignUp(page)
    await submitCredentials(page, owner.email, "another-password", "Sign up")
    await expect(page.getByText("This email already has an account.")).toBeVisible()

    await page.getByRole("button", { name: "Sign in instead?" }).click()
    await submitCredentials(page, owner.email, owner.password, "Sign in")
    await expectProjectsPage(page)
  } finally {
    deleteTestOwner(owner.suffix)
  }
})

// accounts:status doesn't reveal the allowlist, so the email reads as one with no account; the
// sign-up it offers refuses the email.
test("an email outside the allowlist is offered sign-up, which refuses it", async ({ page }) => {
  const email = strangerEmail()

  await page.goto("/")
  await submitCredentials(page, email, OWNER_PASSWORD, "Sign in")
  await expect(page.getByText("No account with this email.")).toBeVisible()

  await page.getByRole("button", { name: "Create one?" }).click()
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(email)
  await page.getByLabel("Password", { exact: true }).fill(OWNER_PASSWORD)
  await page.getByRole("button", { name: "Sign up", exact: true }).click()
  await expect(
    page.getByText("Couldn't sign up. Only the owners' emails can make an account."),
  ).toBeVisible()
})
