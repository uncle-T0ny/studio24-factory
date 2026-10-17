import { randomBytes } from "node:crypto"
import { runConvex } from "./localDeployment"
import { testOwnerEmail } from "../../convex/lib/owners"

export const OWNER_PASSWORD = "e2e-password-123"

// OWNER_EMAILS on the e2e backend lists exactly this owner (see e2e/localBackend.ts).
export const ALLOWLISTED_OWNER_SUFFIX = "e2e-owner"
export const ALLOWLISTED_OWNER_EMAIL = testOwnerEmail(ALLOWLISTED_OWNER_SUFFIX)

export interface TestOwner {
  suffix: string
  email: string
  password: string
}

// A fresh owner per test: test-owner+e2e-<label>-<random>@example.com. The e2e backend sets
// ALLOW_TEST_FUNCTIONS=true, which lets these sign up and lets deleteTestOwner remove them.
export function newTestOwner(label: string): TestOwner {
  const suffix = `e2e-${label}-${randomBytes(3).toString("hex")}`

  return {
    suffix,
    email: testOwnerEmail(suffix),
    password: OWNER_PASSWORD,
  }
}

// Deletes the owner with her data (convex/lib/ownerData.ts), sessions and accounts.
export function deleteTestOwner(suffix: string): void {
  runConvex(["run", "testing:deleteTestOwner", JSON.stringify({ ownerSuffix: suffix })])
}

export function strangerEmail(): string {
  return `stranger-${randomBytes(3).toString("hex")}@example.com`
}
