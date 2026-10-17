import { deleteProjectData } from "./projectData"
import type { Id, TableNames } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"

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

      for (const project of projects) {
        await deleteProjectData(ctx, project._id)
      }

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
    table: "templates",
    rows: async (ctx, ownerId) => {
      const templates = await ctx.db
        .query("templates")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect()

      return templates.map((template) => ({ id: template._id, files: [] }))
    },
  },
]

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
