import { ConvexError, type Infer } from "convex/values"
import { MAX_PROJECT_NAME_LENGTH } from "./validators"
import schema from "../schema"

// A project as its share link opens it: the document without its owner's id.
export const sharedProjectValidator = schema.doc("projects").omit("ownerId")

export type SharedProject = Infer<typeof sharedProjectValidator>

// The trimmed name, or a sentence for the user.
export function cleanProjectName(name: string): string {
  const cleaned = name.trim()

  if (cleaned.length === 0) {
    throw new ConvexError("A project needs a name.")
  }

  if (cleaned.length > MAX_PROJECT_NAME_LENGTH) {
    throw new ConvexError(`Keep the name under ${MAX_PROJECT_NAME_LENGTH} characters.`)
  }

  return cleaned
}
