// An optional smoke test against the dev deployment that .env.local names (never prod): checks
// the OWNER_EMAILS sign-up gate and the owner's path, then deletes its test owner. The deployment
// needs ALLOW_TEST_FUNCTIONS=true. `npm run prove:owner`.

import { ConvexHttpClient } from "convex/browser"
import { convexRun, readConvexUrl } from "./lib/convex"
import { testOwnerSuffix } from "./testOwner"
import { api } from "../convex/_generated/api"
import { testOwnerEmail } from "../convex/lib/owners"

const OWNER_SUFFIX = testOwnerSuffix("prove-owner")
const OWNER_EMAIL = testOwnerEmail(OWNER_SUFFIX)
const STRANGER_EMAIL = "stranger@example.com"
const PASSWORD = "proof-password-123"

function deleteTestOwner() {
  convexRun("testing:deleteTestOwner", { ownerSuffix: OWNER_SUFFIX }, { prod: false })
}

function check(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`FAILED: ${message}`)
  }

  console.log(`ok   ${message}`)
}

async function signUp(client: ConvexHttpClient, email: string): Promise<string | null> {
  try {
    const result = await client.action(api.auth.signIn, {
      provider: "password",
      params: {
        email,
        password: PASSWORD,
        flow: "signUp",
      },
    })

    return result.tokens?.token ?? null
  } catch {
    return null
  }
}

async function prove(convexUrl: string) {
  const anonymous = new ConvexHttpClient(convexUrl)
  const strangerToken = await signUp(anonymous, STRANGER_EMAIL)

  check(strangerToken === null, "an email outside OWNER_EMAILS can't sign up")

  const ownerToken = await signUp(anonymous, OWNER_EMAIL)

  check(ownerToken !== null, `the test owner ${OWNER_EMAIL} signs up`)

  const owner = new ConvexHttpClient(convexUrl)

  owner.setAuth(ownerToken)

  const projectId = await owner.mutation(api.projects.create, { name: "Proof project" })
  const projects = await owner.query(api.projects.listMine, {})
  const project = projects.find((candidate) => candidate._id === projectId)

  check(project !== undefined, "the owner lists the new project")
  check(project.shareToken.length >= 32, "the project has a long random share token")

  await owner.mutation(api.projects.rename, { projectId, name: "Proof project, renamed" })
  check(
    (await owner.query(api.projects.get, { projectId }))?.name === "Proof project, renamed",
    "the owner renames the project",
  )
  check(
    (await anonymous.query(api.projects.get, { projectId })) === null,
    "a signed-out client can't read the project",
  )
  check(
    (await anonymous.query(api.projects.getByShareToken, { shareToken: project.shareToken }))
      ?._id === projectId,
    "the share token opens the project",
  )
}

async function main() {
  const convexUrl = readConvexUrl()

  console.log(`     test owner: ${OWNER_EMAIL}`)
  deleteTestOwner()

  try {
    await prove(convexUrl)
  } finally {
    deleteTestOwner()
    console.log("ok   the test owner and their data are deleted")
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
