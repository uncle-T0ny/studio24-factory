/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"

// convex-test: the Convex function tests run on an in-memory backend. The two dots in this
// file's name keep `convex deploy` from bundling it.

// Every module but the tests and this file.
export const modules = import.meta.glob(["./**/*.ts", "!./**/*.*.ts"])

export const OWNER_EMAILS = "owner@example.com, other@example.com"

export type TestBackend = ReturnType<typeof newBackend>

// The backend as one caller: TestBackend itself (nobody signed in) or signedIn(...).as.
export type TestCaller = ReturnType<TestBackend["withIdentity"]>

// What storedFile writes into a file's system row; the typed db can't write a system table.
interface StorageRowWriter {
  patch(fileId: Id<"_storage">, fields: { contentType: string }): Promise<void>
}

export function newBackend() {
  return convexTest(schema, modules)
}

// The backend as the user with this email, created if she is new; any email can sign in here,
// OWNER_EMAILS decides whether she is an owner.
export async function signedIn(t: TestBackend, email: string) {
  const userId: Id<"users"> = await t.run(async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique()

    return user?._id ?? (await ctx.db.insert("users", { email }))
  })

  return {
    userId,
    as: t.withIdentity({
      subject: `${userId}|session`,
    }),
  }
}

// A stored file of this type and size. convex-test keeps no content type (Convex takes it from
// the upload), so it is written into the file's system row, which only the test backend allows.
export async function storedFile(
  t: TestBackend,
  contentType: string,
  size: number,
): Promise<Id<"_storage">> {
  return await t.run(async (ctx) => {
    const fileId = await ctx.storage.store(new Blob([new Uint8Array(size)]))
    const rows = ctx.db as unknown as StorageRowWriter

    await rows.patch(fileId, { contentType })

    return fileId
  })
}
