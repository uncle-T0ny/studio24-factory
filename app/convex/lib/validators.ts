import { v, type Infer } from "convex/values"

export const projectFields = {
  ownerId: v.id("users"),
  name: v.string(),
  shareToken: v.string(),
}

export const projectContentValidator = v.object({
  project: v.object({
    name: v.string(),
  }),
})

export type ProjectContent = Infer<typeof projectContentValidator>

export const MAX_PROJECT_NAME_LENGTH = 200
