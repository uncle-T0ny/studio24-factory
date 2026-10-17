const TEST_OWNER_LOCAL_PART = "test-owner"
const TEST_OWNER_DOMAIN = "example.com"
const TEST_OWNER_SUFFIX_PATTERN = /^[a-z0-9-]{1,40}$/
const TEST_OWNER_EMAIL_PATTERN = /^test-owner\+[a-z0-9-]{1,40}@example\.com$/
const TEST_FUNCTIONS_FLAG = "true"

export interface OwnerEnv {
  ownerEmails: string | undefined
  allowTestFunctions: string | undefined
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function parseOwnerEmails(ownerEmailsEnv: string | undefined): string[] {
  if (!ownerEmailsEnv) {
    return []
  }

  return ownerEmailsEnv
    .split(",")
    .map(normalizeEmail)
    .filter((email) => email.length > 0)
}

export function areTestFunctionsAllowed(allowTestFunctionsEnv: string | undefined): boolean {
  return allowTestFunctionsEnv === TEST_FUNCTIONS_FLAG
}

export function isTestOwnerSuffix(suffix: string): boolean {
  return TEST_OWNER_SUFFIX_PATTERN.test(suffix)
}

export function testOwnerEmail(suffix: string): string {
  if (!isTestOwnerSuffix(suffix)) {
    throw new Error(`A test owner suffix is 1 to 40 of a-z, 0-9 and "-": "${suffix}"`)
  }

  return `${TEST_OWNER_LOCAL_PART}+${suffix}@${TEST_OWNER_DOMAIN}`
}

export function isTestOwnerEmail(email: string): boolean {
  return TEST_OWNER_EMAIL_PATTERN.test(normalizeEmail(email))
}

export function ownerEnv(): OwnerEnv {
  return {
    ownerEmails: process.env.OWNER_EMAILS,
    allowTestFunctions: process.env.ALLOW_TEST_FUNCTIONS,
  }
}

export function isOwnerEmail(email: string, env: OwnerEnv): boolean {
  const ownerEmails = parseOwnerEmails(env.ownerEmails)
  const isListed = ownerEmails.includes(normalizeEmail(email))
  const isAllowedTestOwner =
    areTestFunctionsAllowed(env.allowTestFunctions) && isTestOwnerEmail(email)

  return isListed || isAllowedTestOwner
}
