import { randomBytes } from "node:crypto"
import { runConvex } from "./localDeployment"
import { testOwnerEmail } from "../../convex/lib/owners"

export const OWNER_PASSWORD = "e2e-password-123"

export const ALLOWLISTED_OWNER_SUFFIX = "e2e-owner"
export const ALLOWLISTED_OWNER_EMAIL = testOwnerEmail(ALLOWLISTED_OWNER_SUFFIX)
export const DEMO_DEVELOPER_EMAIL = testOwnerEmail("e2e-demo")

export interface TestOwner {
  suffix: string
  email: string
  password: string
}

export function newTestOwner(label: string): TestOwner {
  const suffix = `e2e-${label}-${randomBytes(3).toString("hex")}`

  return {
    suffix,
    email: testOwnerEmail(suffix),
    password: OWNER_PASSWORD,
  }
}

export function deleteTestOwner(suffix: string): void {
  runConvex(["run", "testing:deleteTestOwner", JSON.stringify({ ownerSuffix: suffix })])
}

export function strangerEmail(): string {
  return `stranger-${randomBytes(3).toString("hex")}@example.com`
}
