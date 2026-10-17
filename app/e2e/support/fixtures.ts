import { test as base } from "@playwright/test"
import { signUp } from "./app"
import { deleteTestOwner, newTestOwner, type TestOwner } from "./owners"

interface Fixtures {
  // A fresh owner, signed up and signed in on `page`, deleted with all their data afterwards.
  owner: TestOwner
}

function ownerLabel(title: string): string {
  const label = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  return label.slice(0, 20).replace(/-$/, "") || "test"
}

export const test = base.extend<Fixtures>({
  owner: async ({ page }, provide, testInfo) => {
    const owner = newTestOwner(ownerLabel(testInfo.title))

    try {
      await signUp(page, owner.email, owner.password)
      await provide(owner)
    } finally {
      deleteTestOwner(owner.suffix)
    }
  },
})

export { expect } from "@playwright/test"
