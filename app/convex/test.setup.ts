/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"

// The two dots in this file's name keep `convex deploy` from bundling it.

export const modules = import.meta.glob(["./**/*.ts", "!./**/*.*.ts"])

export const OWNER_EMAILS = "owner@example.com, other@example.com"

export type TestBackend = ReturnType<typeof newBackend>

export type TestCaller = ReturnType<TestBackend["withIdentity"]>

interface StorageRowWriter {
  patch(fileId: Id<"_storage">, fields: { contentType: string }): Promise<void>
}

export function newBackend() {
  return convexTest(schema, modules)
}

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
