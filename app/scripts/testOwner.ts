import { randomBytes } from "node:crypto"

const SUFFIX_ENV = "TEST_OWNER_SUFFIX"

export function testOwnerSuffix(prefix: string): string {
  const fromEnv = process.env[SUFFIX_ENV]

  if (fromEnv) {
    return fromEnv
  }

  return `${prefix}-${randomBytes(3).toString("hex")}`
}
