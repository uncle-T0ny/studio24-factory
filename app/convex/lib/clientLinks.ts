import { newShareToken, hashToken } from "./shareToken"
import type { Stage } from "./validators"
import type { Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"

export interface NewLink {
  linkId: Id<"clientLinks">
  token: string
}

export async function insertClientLink(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  stages: Stage[],
): Promise<NewLink> {
  const token = newShareToken()
  const linkId = await ctx.db.insert("clientLinks", {
    projectId,
    tokenHash: await hashToken(token),
    stages,
    requiresLogin: stages.includes("final"),
  })

  return { linkId, token }
}
