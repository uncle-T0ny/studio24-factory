import { createProject } from "./support/app"
import { expect, test } from "./support/fixtures"

// Voice is off on the e2e backend (it has no LiveKit, Deepgram or OpenRouter keys), so the
// project page shows no voice card and no mic, and the owner works through the typed message.
test("voice off: no mic or voice card, and a typed message is saved", async ({ page, owner }) => {
  await createProject(page, `Voice (${owner.suffix})`)

  const card = page.getByLabel("Message", { exact: true })

  await expect(card.getByRole("heading", { name: "Message", exact: true })).toBeVisible()
  await expect(page.getByLabel("Voice assistant")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Start talking" })).toHaveCount(0)

  const form = card.getByRole("form", { name: "Type a message" })

  await form.getByLabel("Your message").fill("Please call me back tomorrow.")
  await form.getByRole("button", { name: "Send" }).click()
  await expect(form.getByText("Sent. It's saved with the project.")).toBeVisible()
})
