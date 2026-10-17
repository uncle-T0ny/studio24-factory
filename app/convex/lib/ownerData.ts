import type { Id, TableNames } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"

// Every table that holds an owner's data, with the storage files each row holds. Deleting an
// owner (testing:deleteTestOwner) walks this list, so a new owner-scoped table goes here too;
// convex/testing.test.ts fails when a table with an ownerId field is missing from it.

export interface OwnerRow {
  id: Id<TableNames>
  files: Id<"_storage">[]
}

export interface OwnerScopedTable {
  table: TableNames
  rows: (ctx: MutationCtx, ownerId: Id<"users">) => Promise<OwnerRow[]>
}

export const OWNER_SCOPED_TABLES: readonly OwnerScopedTable[] = [
  {
    table: "projects",
    rows: async (ctx, ownerId) => {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect()

      return projects.map((project) => ({ id: project._id, files: [] }))
    },
  },
  {
    table: "feedback",
    rows: async (ctx, ownerId) => {
      const entries = await ctx.db
        .query("feedback")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect()

      return entries.map((entry) => ({
        id: entry._id,
        files: entry.screenshotId ? [entry.screenshotId] : [],
      }))
    },
  },
  {
    table: "voiceSessions",
    rows: async (ctx, ownerId) => {
      const sessions = await ctx.db
        .query("voiceSessions")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect()

      return sessions.map((session) => ({ id: session._id, files: [] }))
    },
  },
  {
    table: "voiceTranscripts",
    rows: async (ctx, ownerId) => {
      const turns = await ctx.db
        .query("voiceTranscripts")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect()

      return turns.map((turn) => ({ id: turn._id, files: [] }))
    },
  },
]

// Deletes the owner's rows in every owner-scoped table, with their files.
export async function deleteOwnerData(ctx: MutationCtx, ownerId: Id<"users">): Promise<void> {
  for (const { rows } of OWNER_SCOPED_TABLES) {
    for (const row of await rows(ctx, ownerId)) {
      for (const fileId of row.files) {
        await ctx.storage.delete(fileId)
      }

      await ctx.db.delete(row.id)
    }
  }
}
