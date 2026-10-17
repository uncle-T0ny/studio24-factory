import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { clientFolder, parseStage } from "./clients"

describe("clientFolder", () => {
  let repoDir: string

  beforeEach(() => {
    repoDir = mkdtempSync(path.join(tmpdir(), "client-folder-"))
    mkdirSync(path.join(repoDir, "clients", "demo-client"), { recursive: true })
  })

  afterEach(() => {
    rmSync(repoDir, { recursive: true, force: true })
  })

  test("falls back to clients/ for the public demo client", () => {
    expect(clientFolder(repoDir, "demo-client")).toBe(path.join(repoDir, "clients", "demo-client"))
  })

  test("prefers a real client's folder in clients-private/ over clients/", () => {
    mkdirSync(path.join(repoDir, "clients-private", "demo-client"), { recursive: true })

    expect(clientFolder(repoDir, "demo-client")).toBe(
      path.join(repoDir, "clients-private", "demo-client"),
    )
  })

  test("rejects a slug that could reach outside the client folders", () => {
    expect(() => clientFolder(repoDir, "../app")).toThrow(/--slug/)
  })

  test("fails when no client folder has the slug", () => {
    expect(() => clientFolder(repoDir, "acme")).toThrow(/No folder for acme/)
  })
})

describe("parseStage", () => {
  test("accepts each of the six stages and rejects any other", () => {
    expect(parseStage("prd")).toBe("prd")
    expect(() => parseStage("estimate")).toThrow(/--stage must be one of/)
  })
})
