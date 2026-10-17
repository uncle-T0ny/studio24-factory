import { v, type Infer } from "convex/values"

// The single source of the app's data shapes: the schema, the functions' args and `returns`, and
// the types src uses (Infer<>) all come from these validators. No v.any(): lint refuses it.

// The example resource. Replace it, or add yours next to it.
export const projectFields = {
  ownerId: v.id("users"),
  name: v.string(),
  shareToken: v.string(),
}

// What a project export carries (lib/backup.ts wraps it in the versioned envelope).
export const projectContentValidator = v.object({
  project: v.object({
    name: v.string(),
  }),
})

export type ProjectContent = Infer<typeof projectContentValidator>

export const MAX_PROJECT_NAME_LENGTH = 200
